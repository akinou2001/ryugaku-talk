import { NextResponse } from "next/server";
import { findRelevantPostsForQuery } from "@/lib/searchPosts";
import { findSimilarUsers } from "@/lib/searchUsers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

// サーバーサイド用のSupabaseクライアントを作成
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Gemini APIクライアントの初期化（遅延初期化）
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * 質問受付API（起点）
 * ユーザーの質問を受け取り、AI回答フロー全体を開始する
 * 
 * 内部で以下を実行：
 * 1. 関連投稿検索
 * 2. 類似ユーザー検索
 * 3. 外部情報取得（オプション）
 * 4. AI回答生成
 */
export async function POST(req: Request) {
  try {
    // 認証チェック
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const { question_text, context } = await req.json();

    if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
      return NextResponse.json(
        { error: "質問内容が必要です" },
        { status: 400 }
      );
    }

    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI機能の設定が完了していません" },
        { status: 500 }
      );
    }

    // 1. 関連投稿を検索
    const posts = await findRelevantPostsForQuery(question_text, 5);
    const relatedPosts = posts.map(post => ({
      post_id: post.id,
      title: post.title,
      content_snippet: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
      author_name: post.author?.name || '匿名',
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      category: post.category,
    }));

    // 2. 類似ユーザーを検索
    const users = await findSimilarUsers(question_text, 3);
    const recommendedUsers = users.map(user => ({
      user_id: user.id,
      display_name: user.name,
      attributes: {
        study_abroad_destination: user.study_abroad_destination,
        university: user.university,
        major: user.major,
        account_type: user.account_type,
      },
      contribution_score: user.contribution_score || 0,
      icon_url: user.icon_url,
    }));

    // 3. 外部情報取得（オプション - 現時点では空配列）
    const externalSources: any[] = [];

    // 4. モード判定
    const hasReferences = relatedPosts.length > 0 || externalSources.length > 0;
    const mode = hasReferences ? "grounded" : "reasoning";

    // 5. AI回答を生成
    const systemInstruction = mode === "grounded"
      ? `あなたは留学支援コミュニティ「RyugakuTalk」のAIコンシェルジュです。
ユーザーの質問に対して、提供された過去の投稿や外部情報を根拠として、親切で正確な回答を提供してください。

回答の際は以下の点に注意してください：
- 過去の投稿の内容を引用する場合は、「投稿: [タイトル]（投稿者: [名前]）」のように明記してください
- 外部のウェブページの情報を参考にする場合は、「参考: [情報源]」のように出典を明記してください
- 回答は日本語で、わかりやすく、親切に書いてください
- 提供された情報に基づいて回答し、推測は最小限にしてください
- 回答はMarkdown形式で記述してください（見出し、リスト、太字などが使用可能です）`
      : `あなたは留学支援コミュニティ「RyugakuTalk」のAIコンシェルジュです。
ユーザーの質問に対して、一般的な留学経験・制度・合理的推論に基づいて回答してください。

回答の際は以下の点に注意してください：
- 回答は日本語で、わかりやすく、親切に書いてください
- これは一般的な推論に基づく回答であることを明記してください
- 不確実な情報は推測であることを明示してください
- 具体的な情報が必要な場合は、過去の投稿を参照するか、公式サイトを確認することを推奨してください
- 回答はMarkdown形式で記述してください（見出し、リスト、太字などが使用可能です）`;

    let userPrompt = `以下の質問に回答してください。\n\n質問: ${question_text}\n\n`;

    if (mode === "grounded") {
      if (relatedPosts.length > 0) {
        userPrompt += `参考になる過去の投稿:\n`;
        relatedPosts.forEach((post, index) => {
          userPrompt += `[投稿${index + 1}]\n`;
          userPrompt += `タイトル: ${post.title}\n`;
          userPrompt += `投稿者: ${post.author_name}\n`;
          userPrompt += `内容: ${post.content_snippet}\n\n`;
        });
      }

      if (externalSources.length > 0) {
        userPrompt += `参考になる外部情報:\n`;
        externalSources.forEach((source, index) => {
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

    const genAI = getGeminiClient();
    // gemini-3-flash-preview: 最新の軽量で高速なモデル
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: systemInstruction,
    });
    
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const answer_text = response.text() || "回答を生成できませんでした。";

    // 引用情報を整形
    const citations = [
      ...relatedPosts.map(post => ({
        type: "post" as const,
        ref_id: post.post_id,
        title: post.title,
        confidence_level: "high" as const,
      })),
      ...externalSources.map(source => ({
        type: "external" as const,
        ref_id: source.url,
        title: source.title,
        confidence_level: "medium" as const,
      })),
    ];

    // 最終回答を返す
    return NextResponse.json({
      answer_text,
      citations,
      related_posts: relatedPosts,
      recommended_users: recommendedUsers,
      mode,
      confidence_level: hasReferences ? "high" : "low",
    });
  } catch (error: any) {
    console.error("Error in AI ask API:", error);
    
    // Gemini APIのエラーハンドリング
    if (error?.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Gemini APIキーが無効です" },
        { status: 500 }
      );
    }
    
    if (error?.message?.includes("quota") || error?.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "APIの利用制限に達しました。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    // モデルが見つからない場合のエラー（支払い登録が必要な可能性）
    if (error?.message?.includes("404") || error?.message?.includes("not found")) {
      return NextResponse.json(
        { 
          error: "指定されたモデルが見つかりません。APIキーの設定、支払い情報の登録、または利用可能なモデル名をご確認ください。",
          details: error?.message || "モデルが見つかりません"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "AI回答の生成に失敗しました" },
      { status: 500 }
    );
  }
}

