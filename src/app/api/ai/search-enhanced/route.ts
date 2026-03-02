import { NextResponse } from "next/server";
import { searchWithGemini } from "@/lib/searchWithGemini";
import { createClient } from '@supabase/supabase-js';

// サーバーサイド用のSupabaseクライアントを作成（トークン付きでRLS認証コンテキストを設定）
function getSupabaseServerClient(token?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  });
}

/**
 * AIコンシェルジュAPI
 * 投稿データベースから検索し、Gemini APIで要約・引用しながら回答を生成
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
    const supabase = getSupabaseServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    // 月間利用回数チェック
    const MONTHLY_LIMIT = 10;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { count: usageCount, error: usageError } = await supabase
      .from('ai_concierge_chats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd);

    if (!usageError) {
      const currentUsage = usageCount || 0;
      if (currentUsage >= MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            error: "今月の利用回数の上限（10回）に達しました。来月にリセットされます。",
            remaining: 0,
            limit: MONTHLY_LIMIT
          },
          { status: 429 }
        );
      }
    }

    const { question_text, limit, topK } = await req.json();

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

    // AIコンシェルジュを実行
    // topK: 使用する関連投稿の最大数（デフォルト: 5）
    const result = await searchWithGemini(question_text, topK || 5);

    // 利用後の残り回数を計算
    const newUsage = (usageCount || 0) + 1; // 履歴保存後に+1される想定
    const remaining = Math.max(MONTHLY_LIMIT - newUsage, 0);

    // 最終回答を返す
    return NextResponse.json({
      answer_text: result.answer,
      related_posts: result.citedPosts,
      mode: result.citedPosts.length > 0 ? "grounded" : "reasoning",
      confidence_level: result.citedPosts.length > 0 ? "high" : "low",
      remaining,
    });
  } catch (error: any) {
    console.error("Error in AI search-enhanced API:", error);
    
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

