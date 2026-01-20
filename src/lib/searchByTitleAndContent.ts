import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import "server-only";

/**
 * タイトルとコンテンツを使用してAI検索を実行
 * 投稿データベースから関連する投稿を検索し、AIが要約・回答を生成
 * 
 * @param query - 検索クエリ（ユーザーの質問）
 * @param limit - データベースから取得する投稿の最大数（デフォルト: 100）
 * @param topK - 使用する上位K件の投稿（デフォルト: 5）
 * @returns AIが生成した回答テキスト
 */
export async function searchByTitleAndContent(
  query: string,
  limit = 100,
  topK = 5
): Promise<string> {
  try {
    // 1️⃣ 投稿データ（title + content）を取得
    const { data, error } = await supabase
      .from("posts")
      .select("title, content")
      .is('community_id', null) // コミュニティ限定投稿は除外
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    console.log("supabase data:", data);

    // 2️⃣ 番号付きの候補リストを構築
    const items = (data ?? []).map((r: any, idx: number) => ({
      no: idx + 1, // 1ベースの番号
      title: (r.title ?? "").toString().trim(),
      content: (r.content ?? "").toString().trim().slice(0, 800), // トークン数を制御
    }));

    // 3️⃣ DashScope API（サーバーサイド専用）
    const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
    
    // デバッグ用ログ（本番環境では削除推奨）
    console.log("[DEBUG] DASHSCOPE_API_KEY check:", {
      exists: !!dashscopeApiKey,
      length: dashscopeApiKey?.length || 0,
      startsWith: dashscopeApiKey?.substring(0, 3) || "N/A",
      hasPlaceholder: dashscopeApiKey?.includes("your_dashscope_api_key") || false,
    });
    
    if (!dashscopeApiKey) {
      throw new Error("DASHSCOPE_API_KEY環境変数が設定されていません。.env.localファイルにDASHSCOPE_API_KEYを設定してください。");
    }

    const trimmedKey = dashscopeApiKey.trim();
    
    // APIキーの形式チェック（空文字やプレースホルダーを検出）
    if (trimmedKey === "") {
      throw new Error("DASHSCOPE_API_KEYが空です。.env.localファイルで実際のAPIキーを設定してください。");
    }
    
    // プレースホルダーのチェック（大文字小文字を区別しない）
    const placeholderPatterns = [
      "your_dashscope_api_key",
      "your_dashscope",
      "placeholder",
      "example",
      "sk-xxxxxxxx",
    ];
    
    const hasPlaceholder = placeholderPatterns.some(pattern => 
      trimmedKey.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasPlaceholder) {
      throw new Error("DASHSCOPE_API_KEYがプレースホルダーのままです。.env.localファイルで実際のAPIキーに置き換えてください。");
    }
    
    // APIキーの最小長チェック（通常は20文字以上）
    if (trimmedKey.length < 10) {
      throw new Error(`DASHSCOPE_API_KEYが短すぎます（${trimmedKey.length}文字）。正しいAPIキーを設定してください。`);
    }

    const openai = new OpenAI({
      apiKey: dashscopeApiKey.trim(),
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

    // 4️⃣ 日本語プロンプト（厳密に番号を返す）
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

    console.log("User prompt:", userPrompt);

    // 5️⃣ AIを呼び出し（非ストリーミング、安定したJSON返却）
    try {
      const stream = await openai.chat.completions.create({
        model: "qwen-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      });

      const content = stream.choices[0]?.message?.content ?? "";
      console.log("AI response:", content);
      
      return content.trim();
    } catch (apiError: any) {
      // DashScope APIのエラーハンドリング
      if (apiError?.status === 401 || apiError?.message?.includes("401") || apiError?.message?.includes("Incorrect API key")) {
        throw new Error(
          "DashScope APIキーが無効です。以下の点を確認してください：\n" +
          "1. .env.localファイルにDASHSCOPE_API_KEYが正しく設定されているか\n" +
          "2. APIキーが有効で、期限切れでないか\n" +
          "3. 開発サーバーを再起動したか（環境変数の変更を反映するため）\n" +
          "4. APIキーに余分なスペースや改行が含まれていないか"
        );
      }
      if (apiError?.status === 429 || apiError?.message?.includes("rate limit")) {
        throw new Error("APIの利用制限に達しました。しばらく待ってから再度お試しください。");
      }
      throw apiError;
    }
  } catch (error: any) {
    console.error("Error in searchByTitleAndContent:", error);
    
    // 既に詳細なエラーメッセージが設定されている場合はそのまま使用
    if (error?.message && !error.message.includes("AI検索の実行中にエラーが発生しました")) {
      throw error;
    }
    
    throw new Error(
      error?.message || "AI検索の実行中にエラーが発生しました"
    );
  }
}

