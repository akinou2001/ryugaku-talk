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
 * 当月のAI利用回数を取得
 * GET /api/ai/concierge/usage
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

    // ai_concierge_chats テーブルから当月の利用回数を取得
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { count, error } = await supabase
      .from('ai_concierge_chats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd);

    if (error) {
      console.error('Error fetching usage count:', error);
      return NextResponse.json(
        { error: "利用回数の取得に失敗しました" },
        { status: 500 }
      );
    }

    const usageCount = count || 0;
    const limit = 10;
    const remaining = Math.max(limit - usageCount, 0);

    return NextResponse.json({
      usage_count: usageCount,
      remaining,
      limit,
      allowed: usageCount < limit
    });
  } catch (error: any) {
    console.error('Error in GET /api/ai/concierge/usage:', error);
    return NextResponse.json(
      { error: "利用回数の取得に失敗しました" },
      { status: 500 }
    );
  }
}
