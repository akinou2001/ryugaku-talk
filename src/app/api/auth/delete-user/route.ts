import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サーバーサイド用のSupabase Admin Clientを作成
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * 認証ユーザーを削除するAPI
 * 退会処理で使用
 */
export async function POST(req: Request) {
  try {
    // 認証チェック
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証が必要です。ログインしてください。' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // ユーザーIDを取得
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です。ログインしてください。' },
        { status: 401 }
      )
    }

    // リクエストボディからユーザーIDを取得（セキュリティのため、認証されたユーザーIDと一致することを確認）
    const { userId } = await req.json()
    
    if (!userId || userId !== user.id) {
      return NextResponse.json(
        { error: 'ユーザーIDが一致しません。' },
        { status: 403 }
      )
    }

    // Admin Clientで認証ユーザーを削除
    const supabaseAdmin = getSupabaseAdminClient()
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || '認証ユーザーの削除に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete-user API:', error)
    return NextResponse.json(
      { error: error?.message || '認証ユーザーの削除に失敗しました。' },
      { status: 500 }
    )
  }
}

