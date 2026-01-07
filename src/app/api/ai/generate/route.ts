import { NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI APIクライアントの初期化（遅延初期化）
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface RelatedPost {
  post_id: string;
  title: string;
  content_snippet: string;
  author_name: string;
}

interface ExternalSource {
  title: string;
  url: string;
  summary: string;
}

/**
 * AI回答生成API（中核）
 * 検索結果をまとめ、AIに最終回答を生成させる
 */
export async function POST(req: Request) {
  try {
    const { question_text, related_posts = [], external_sources = [] } = await req.json();

    if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
      return NextResponse.json(
        { error: "質問内容が必要です" },
        { status: 400 }
      );
    }

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI機能の設定が完了していません" },
        { status: 500 }
      );
    }

    // モード判定
    const hasReferences = related_posts.length > 0 || external_sources.length > 0;
    const mode = hasReferences ? "grounded" : "reasoning";

    // システムプロンプトを作成
    const systemPrompt = mode === "grounded"
      ? `あなたは留学支援コミュニティ「RyugakuTalk」のAIコンシェルジュです。
ユーザーの質問に対して、提供された過去の投稿や外部情報を根拠として、親切で正確な回答を提供してください。

回答の際は以下の点に注意してください：
- 過去の投稿の内容を引用する場合は、「投稿: [タイトル]（投稿者: [名前]）」のように明記してください
- 外部のウェブページの情報を参考にする場合は、「参考: [情報源]」のように出典を明記してください
- 回答は日本語で、わかりやすく、親切に書いてください
- 提供された情報に基づいて回答し、推測は最小限にしてください`
      : `あなたは留学支援コミュニティ「RyugakuTalk」のAIコンシェルジュです。
ユーザーの質問に対して、一般的な留学経験・制度・合理的推論に基づいて回答してください。

回答の際は以下の点に注意してください：
- 回答は日本語で、わかりやすく、親切に書いてください
- これは一般的な推論に基づく回答であることを明記してください
- 不確実な情報は推測であることを明示してください
- 具体的な情報が必要な場合は、過去の投稿を参照するか、公式サイトを確認することを推奨してください`;

    // ユーザープロンプトを作成
    let userPrompt = `以下の質問に回答してください。\n\n質問: ${question_text}\n\n`;

    if (mode === "grounded") {
      if (related_posts.length > 0) {
        userPrompt += `参考になる過去の投稿:\n`;
        related_posts.forEach((post: RelatedPost, index: number) => {
          userPrompt += `[投稿${index + 1}]\n`;
          userPrompt += `タイトル: ${post.title}\n`;
          userPrompt += `投稿者: ${post.author_name}\n`;
          userPrompt += `内容: ${post.content_snippet}\n\n`;
        });
      }

      if (external_sources.length > 0) {
        userPrompt += `参考になる外部情報:\n`;
        external_sources.forEach((source: ExternalSource, index: number) => {
          userPrompt += `[情報源${index + 1}]\n`;
          userPrompt += `タイトル: ${source.title}\n`;
          userPrompt += `URL: ${source.url}\n`;
          userPrompt += `概要: ${source.summary}\n\n`;
        });
      }

      userPrompt += `上記の情報を根拠として、質問に回答してください。過去の投稿の内容を引用する場合は、投稿のタイトルや投稿者名を明記してください。`;
    } else {
      userPrompt += `一般的な留学経験・制度・合理的推論に基づいて回答してください。これは推論に基づく回答であることを明記してください。`;
    }

    // ChatGPT mini (gpt-3.5-turbo) で回答を生成
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const answer_text = completion.choices[0]?.message?.content || "回答を生成できませんでした。";

    // 引用情報を整形
    const citations = [
      ...related_posts.map((post: RelatedPost) => ({
        type: "post" as const,
        ref_id: post.post_id,
        title: post.title,
        confidence_level: "high" as const,
      })),
      ...external_sources.map((source: ExternalSource) => ({
        type: "external" as const,
        ref_id: source.url,
        title: source.title,
        confidence_level: "medium" as const,
      })),
    ];

    return NextResponse.json({
      answer_text,
      citations,
      mode,
      confidence_level: hasReferences ? "high" : "low",
    });
  } catch (error: any) {
    console.error("Error in AI generate API:", error);
    
    // OpenAI APIのエラーハンドリング
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI APIキーが無効です" },
        { status: 500 }
      );
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "APIの利用制限に達しました。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "AI回答の生成に失敗しました" },
      { status: 500 }
    );
  }
}

