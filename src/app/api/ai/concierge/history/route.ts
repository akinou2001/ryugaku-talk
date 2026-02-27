import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

/**
 * チャット履歴を取得
 * GET /api/ai/concierge/history?search=検索キーワード&limit=件数
 */
export async function GET(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('ai_concierge_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 検索キーワードがある場合は全文検索
    if (search.trim()) {
      query = query.or(`question_text.ilike.%${search}%,answer_text.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json(
        { error: "チャット履歴の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ chats: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/ai/concierge/history:', error);
    return NextResponse.json(
      { error: "チャット履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * チャット履歴を保存
 * POST /api/ai/concierge/history
 */
export async function POST(req: Request) {
  try {
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

    const { question_text, answer_text, mode, confidence_level, related_posts } = await req.json();

    if (!question_text || !answer_text) {
      return NextResponse.json(
        { error: "質問と回答の内容が必要です" },
        { status: 400 }
      );
    }

    // related_postsをJSONB形式に変換
    const relatedPostsJson = Array.isArray(related_posts) 
      ? related_posts 
      : (related_posts ? [related_posts] : []);

    console.log('Attempting to save chat history:', {
      user_id: user.id,
      question_length: question_text?.length || 0,
      answer_length: answer_text?.length || 0,
      mode: mode || 'grounded',
      confidence_level: confidence_level || 'medium',
      related_posts_count: relatedPostsJson.length,
      related_posts_type: typeof related_posts,
      related_posts_is_array: Array.isArray(related_posts)
    });

    const { data, error } = await supabase
      .from('ai_concierge_chats')
      .insert({
        user_id: user.id,
        question_text,
        answer_text,
        mode: mode || 'grounded',
        confidence_level: confidence_level || 'medium',
        related_posts: relatedPostsJson
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat history:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        user_id: user.id
      });
      return NextResponse.json(
        { 
          error: "チャット履歴の保存に失敗しました",
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('Chat history saved successfully:', {
      chat_id: data?.id,
      user_id: user.id,
      created_at: data?.created_at
    });

    return NextResponse.json({ chat: data });
  } catch (error: any) {
    console.error('Error in POST /api/ai/concierge/history:', error);
    return NextResponse.json(
      { error: "チャット履歴の保存に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * チャット履歴を削除
 * DELETE /api/ai/concierge/history?id=チャットID
 */
export async function DELETE(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "チャットIDが必要です" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('ai_concierge_chats')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // 自分のチャットのみ削除可能

    if (error) {
      console.error('Error deleting chat history:', error);
      return NextResponse.json(
        { error: "チャット履歴の削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/ai/concierge/history:', error);
    return NextResponse.json(
      { error: "チャット履歴の削除に失敗しました" },
      { status: 500 }
    );
  }
}
