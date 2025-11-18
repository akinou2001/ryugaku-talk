import { supabase } from './supabase'
import type { User, OrganizationVerificationRequest } from './supabase'

/**
 * 管理者権限をチェック
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.is_admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * 組織アカウントの認証申請一覧を取得
 */
export async function getVerificationRequests(status?: 'pending' | 'approved' | 'rejected') {
  try {
    let query = supabase
      .from('organization_verification_requests')
      .select(`
        *,
        profile:profiles(id, name, email, account_type)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * 組織アカウントの認証申請を承認
 */
export async function approveVerificationRequest(
  requestId: string,
  adminId: string,
  reviewNotes?: string
) {
  try {
    // 申請情報を取得
    const { data: request, error: fetchError } = await supabase
      .from('organization_verification_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      throw new Error('認証申請が見つかりません')
    }

    // 申請を承認
    const { error: updateError } = await supabase
      .from('organization_verification_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      })
      .eq('id', requestId)

    if (updateError) {
      throw updateError
    }

    // プロフィールの認証ステータスを更新
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.profile_id)

    if (profileError) {
      throw profileError
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || '認証申請の承認に失敗しました' }
  }
}

/**
 * 組織アカウントの認証申請を拒否
 */
export async function rejectVerificationRequest(
  requestId: string,
  adminId: string,
  reviewNotes?: string
) {
  try {
    // 申請情報を取得
    const { data: request, error: fetchError } = await supabase
      .from('organization_verification_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      throw new Error('認証申請が見つかりません')
    }

    // 申請を拒否
    const { error: updateError } = await supabase
      .from('organization_verification_requests')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      })
      .eq('id', requestId)

    if (updateError) {
      throw updateError
    }

    // プロフィールの認証ステータスを更新
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        verification_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.profile_id)

    if (profileError) {
      throw profileError
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || '認証申請の拒否に失敗しました' }
  }
}

/**
 * ユーザー一覧を取得
 */
export async function getUsers(filters?: {
  accountType?: string
  verificationStatus?: string
  isActive?: boolean
  search?: string
}) {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.accountType) {
      query = query.eq('account_type', filters.accountType)
    }

    if (filters?.verificationStatus) {
      query = query.eq('verification_status', filters.verificationStatus)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,organization_name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * ユーザーを停止
 */
export async function suspendUser(
  userId: string,
  adminId: string,
  reason?: string,
  suspendedUntil?: Date
) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        suspended_until: suspendedUntil?.toISOString() || null,
        suspension_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'ユーザーの停止に失敗しました' }
  }
}

/**
 * ユーザーを復帰
 */
export async function unsuspendUser(userId: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: true,
        suspended_until: null,
        suspension_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'ユーザーの復帰に失敗しました' }
  }
}

/**
 * 統計情報を取得
 */
export async function getAdminStats() {
  try {
    const { data, error } = await supabase
      .from('admin_stats')
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    // ビューが存在しない場合は個別に取得
    try {
      const [
        { count: totalUsers },
        { count: individualUsers },
        { count: educationalUsers },
        { count: companyUsers },
        { count: governmentUsers },
        { count: pendingVerifications },
        { count: verifiedOrganizations },
        { count: totalPosts },
        { count: officialPosts },
        { count: totalComments },
        { count: pendingReports }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'individual'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'educational'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'company'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'government'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_official', true),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ])

      return {
        data: {
          total_users: totalUsers || 0,
          individual_users: individualUsers || 0,
          educational_users: educationalUsers || 0,
          company_users: companyUsers || 0,
          government_users: governmentUsers || 0,
          pending_verifications: pendingVerifications || 0,
          verified_organizations: verifiedOrganizations || 0,
          total_posts: totalPosts || 0,
          official_posts: officialPosts || 0,
          total_comments: totalComments || 0,
          pending_reports: pendingReports || 0
        },
        error: null
      }
    } catch (fallbackError: any) {
      return { data: null, error: fallbackError }
    }
  }
}

