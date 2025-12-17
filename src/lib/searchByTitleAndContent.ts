import OpenAI from "openai";
import process from 'process';
import "dotenv/config"; // ⭐ 关键
import { supabase } from "@/lib/supabase";


/**
 * 使用 title + content 进行 AI 搜索
 * 返回最相关条目的「序号（1-based）」
 */
export async function searchByTitleAndContent(
  query: string,
  limit = 100,
  topK = 5
): Promise<string> {
  // 1️⃣ 取 posts（title + content）
  const { data, error } = await supabase
    .from("posts")
    .select("title, content")
    .order("created_at", { ascending: false })
    .limit(limit);
console.log("supabase data:", data);

  if (error) throw error;

  // 2️⃣ 构造带编号的候选列表
  const items = (data ?? []).map((r: any, idx: number) => ({
    no: idx + 1, // 关键：1-based 序号
    title: (r.title ?? "").toString().trim(),
    content: (r.content ?? "").toString().trim().slice(0, 800), // 控制 token
  }));

  // 3️⃣ OpenAI / DashScope（仅 server）
  const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY!,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  // 4️⃣ 日语 Prompt（严格返回序号）
const systemPrompt = `
あなたは日本語を流暢に扱うアシスタントです。

これから以下の情報が与えられます。
- ユーザーの質問（question）
- データベースから取得した複数の項目（items）
  各項目には「no」「title」「content」が含まれます。

あなたのタスクは：
ユーザーの質問に対して、items の内容（title / content）を根拠として、
最も関連する情報を整理・要約し、自然な日本語で回答することです。

【重要な制約】
- 回答は必ず与えられた items の内容のみに基づくこと（外部知識で補完しない）
- 推測、架空の情報、断定的な作り話は禁止
- items に明確な根拠がない場合は「データベース内に十分な情報が見つかりませんでした」と述べる

【出力ルール】
- 出力は自然言語の日本語（JSON は不要）
- 可能なら箇条書きで要点をまとめる
`.trim();


  const userPrompt = JSON.stringify({
    question: query,
    items,
  });
console.log(userPrompt);
let isAnswering = false;

  // 5️⃣ 调用 AI（非流式，稳定返回 JSON）
   const stream = await openai.chat.completions.create({
    model: "qwen-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: false,
  });

  const content = stream.choices[0]?.message?.content ?? "";
  console.log(content);
  return content.trim();

}


// ——仅用于命令行测试——
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const q = process.argv.slice(2).join(" ") || "日本留学について知りたいです";
    const top = await searchByTitleAndContent(q, 20, 5);
    console.log("TOP:", top);
  })().catch((e) => {
    console.error("ERR:", e);
    process.exit(1);
  });
}
