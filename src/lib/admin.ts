import { supabase } from './supabase'
import type { User, OrganizationVerificationRequest, Report, ReportStatus, GlobalAnnouncement, Quest } from './supabase'

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
    console.log('Fetching verification requests with status:', status)
    
    // まず、プロフィール情報を含めずにシンプルに取得
    let query = supabase
      .from('organization_verification_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      console.log('Filtering by status:', status)
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching verification requests:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log('Verification requests fetched (simple query):', data?.length || 0)
    if (data && data.length > 0) {
      console.log('Sample request:', JSON.stringify(data[0], null, 2))
      
      // プロフィール情報を個別に取得
      const profileIds = Array.from(new Set(data.map(r => r.profile_id)))
      console.log('Fetching profiles for:', profileIds)
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, account_type')
        .in('id', profileIds)
      
      if (profileError) {
        console.error('Error fetching profiles:', profileError)
      } else {
        console.log('Profiles fetched:', profiles?.length || 0)
        
        // プロフィール情報をマージ
        const dataWithProfiles = data.map(request => ({
          ...request,
          profiles: profiles?.find(p => p.id === request.profile_id)
        }))
        
        return { data: dataWithProfiles, error: null }
      }
    }
    
    return { data: data || [], error: null }
  } catch (error: any) {
    console.error('Error in getVerificationRequests:', error)
    return { data: null, error: error.message || error }
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

    // プロフィールの認証ステータスとaccount_typeを更新
    // 承認時にaccount_typeを申請時のタイプに変更し、is_organization_ownerフラグを設定
    console.log('Updating profile verification_status and account_type:', {
      profile_id: request.profile_id,
      admin_id: adminId,
      new_status: 'verified',
      new_account_type: request.account_type
    })
    
    // プロフィール更新データを構築
    const updateData: any = {
      account_type: request.account_type, // 申請時の組織タイプに変更
      verification_status: 'verified',
      organization_name: request.organization_name,
      organization_type: request.organization_type,
      organization_url: request.organization_url,
      contact_person_name: request.contact_person_name,
      contact_person_email: request.contact_person_email,
      contact_person_phone: request.contact_person_phone,
      updated_at: new Date().toISOString()
    }

    // is_organization_ownerカラムが存在する場合のみ設定
    // 注意: スキーマに追加されていない場合はエラーになる可能性がある
    try {
      updateData.is_organization_owner = true // 最初の申請者をオーナーに設定
    } catch (e) {
      // カラムが存在しない場合は無視
      console.warn('is_organization_owner column may not exist:', e)
    }
    
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', request.profile_id)
      .select()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      console.error('Profile update error details:', JSON.stringify(profileError, null, 2))
      throw profileError
    }

    console.log('Profile updated successfully:', updatedProfile)

    // 承認通知を作成
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.profile_id,
          type: 'organization_verification',
          title: '組織認証が承認されました',
          content: `${request.organization_name}の組織認証申請が承認されました。組織用機能をご利用いただけます。`,
          link_url: `/profile/${request.profile_id}`,
          is_read: false
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
        // 通知の作成に失敗しても承認処理は成功しているので続行
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // 通知の作成に失敗しても承認処理は成功しているので続行
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

    // 拒否通知を作成
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.profile_id,
          type: 'organization_verification',
          title: '組織認証が拒否されました',
          content: `${request.organization_name}の組織認証申請が拒否されました。詳細はお問い合わせください。`,
          link_url: `/verification/request`,
          is_read: false
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
        // 通知の作成に失敗しても拒否処理は成功しているので続行
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // 通知の作成に失敗しても拒否処理は成功しているので続行
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
 * 組織アカウントの認証状態を直接更新
 */
export async function updateVerificationStatus(
  userId: string,
  status: 'pending' | 'verified' | 'rejected',
  adminId: string,
  reviewNotes?: string
) {
  try {
    console.log('Updating verification status:', { userId, status, adminId })
    
    // プロフィールの認証ステータスを更新
    const { error: profileError, data: profileData } = await supabase
      .from('profiles')
      .update({
        verification_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      throw new Error(`プロフィールの更新に失敗しました: ${profileError.message}`)
    }

    console.log('Profile updated:', profileData)

    // 認証申請が存在する場合は更新、存在しない場合は作成
    const { data: existingRequest, error: fetchError } = await supabase
      .from('organization_verification_requests')
      .select('id')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing request:', fetchError)
      // エラーを無視して続行（申請が存在しない場合もあるため）
    }

    const requestStatus = status === 'verified' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending'

    if (existingRequest) {
      // 既存の申請を更新
      const { error: updateError } = await supabase
        .from('organization_verification_requests')
        .update({
          status: requestStatus,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null
        })
        .eq('id', existingRequest.id)

      if (updateError) {
        console.error('Error updating verification request:', updateError)
        throw new Error(`認証申請の更新に失敗しました: ${updateError.message}`)
      }
      console.log('Verification request updated')
    } else {
      // 認証申請が存在しない場合は作成（管理者が直接認証した場合）
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type, organization_name, organization_type, organization_url, contact_person_name, contact_person_email, contact_person_phone')
        .eq('id', userId)
        .single()

      if (profile && profile.account_type !== 'individual') {
        const { error: createError } = await supabase
          .from('organization_verification_requests')
          .insert({
            profile_id: userId,
            account_type: profile.account_type,
            organization_name: profile.organization_name || '',
            organization_type: profile.organization_type || null,
            organization_url: profile.organization_url || null,
            contact_person_name: profile.contact_person_name || '',
            contact_person_email: profile.contact_person_email || '',
            contact_person_phone: profile.contact_person_phone || null,
            status: requestStatus,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            review_notes: reviewNotes || null
          })

        if (createError) {
          console.error('Error creating verification request:', createError)
          // 申請の作成に失敗しても、プロフィールの更新は成功しているので続行
          // ただし、エラーを記録
        } else {
          console.log('Verification request created')
        }
      }
    }

    // 通知を作成（承認・拒否時）
    if (status === 'verified' || status === 'rejected') {
      try {
        // 組織情報を取得
        const { data: orgProfile } = await supabase
          .from('profiles')
          .select('organization_name')
          .eq('id', userId)
          .single()

        const organizationName = orgProfile?.organization_name || '組織'

        const notificationTitle = status === 'verified' 
          ? '組織認証が承認されました'
          : '組織認証が拒否されました'
        
        const notificationContent = status === 'verified'
          ? `${organizationName}の組織認証申請が承認されました。組織用機能をご利用いただけます。`
          : `${organizationName}の組織認証申請が拒否されました。詳細はお問い合わせください。`

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'organization_verification',
            title: notificationTitle,
            content: notificationContent,
            link_url: status === 'verified' ? `/profile/${userId}` : `/verification/request`,
            is_read: false
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
          // 通知の作成に失敗しても処理は成功しているので続行
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError)
        // 通知の作成に失敗しても処理は成功しているので続行
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error in updateVerificationStatus:', error)
    return { success: false, error: error.message || '認証状態の更新に失敗しました' }
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

/**
 * 通報一覧を取得
 */
export async function getReports(status?: ReportStatus) {
  try {
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles(id, name, email),
        post:posts(id, title, content, author_id),
        comment:comments(id, content, author_id)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    return { data: null, error: error.message || '通報の取得に失敗しました' }
  }
}

/**
 * 通報のステータスを更新
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminId: string
) {
  try {
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || '通報ステータスの更新に失敗しました' }
  }
}

/**
 * 通報された投稿を削除
 */
export async function deleteReportedPost(postId: string) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      throw error
    }

    // 関連する通報を解決済みに更新
    await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('post_id', postId)

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || '投稿の削除に失敗しました' }
  }
}

/**
 * 通報されたコメントを削除
 */
export async function deleteReportedComment(commentId: string) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      throw error
    }

    // 関連する通報を解決済みに更新
    await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('comment_id', commentId)

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'コメントの削除に失敗しました' }
  }
}

/**
 * 全員向けお知らせ一覧を取得
 */
export async function getGlobalAnnouncements() {
  try {
    const { data, error } = await supabase
      .from('global_announcements')
      .select(`
        *,
        creator:profiles(id, name, icon_url)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'お知らせの取得に失敗しました' }
  }
}

/**
 * 全員向けお知らせを作成
 */
export async function createGlobalAnnouncement(
  title: string,
  content: string,
  createdBy: string
) {
  try {
    const { data, error } = await supabase
      .from('global_announcements')
      .insert({
        title,
        content,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // 全ユーザーに通知を送信
    await sendNotificationToAllUsers(
      'global_announcement',
      title,
      content,
      `/announcements/${data.id}`
    )

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'お知らせの作成に失敗しました' }
  }
}

/**
 * 全員向けお知らせを更新
 */
export async function updateGlobalAnnouncement(
  id: string,
  title: string,
  content: string
) {
  try {
    const { data, error } = await supabase
      .from('global_announcements')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'お知らせの更新に失敗しました' }
  }
}

/**
 * 全員向けお知らせを削除
 */
export async function deleteGlobalAnnouncement(id: string) {
  try {
    const { error } = await supabase
      .from('global_announcements')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'お知らせの削除に失敗しました' }
  }
}

/**
 * 全員向けクエストを作成
 */
export async function createGlobalQuest(
  title: string,
  description: string,
  rewardAmount: number,
  deadline: string | null,
  createdBy: string
) {
  try {
    const { data, error } = await supabase
      .from('quests')
      .insert({
        title,
        description,
        reward_amount: rewardAmount,
        deadline,
        created_by: createdBy,
        status: 'active',
        community_id: null // 全員向けクエスト
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // 全ユーザーに通知を送信
    await sendNotificationToAllUsers(
      'global_quest',
      title,
      description || '',
      `/quests/${data.id}`
    )

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'クエストの作成に失敗しました' }
  }
}

/**
 * 全員向けクエスト一覧を取得
 */
export async function getGlobalQuests() {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select(`
        *,
        creator:profiles(id, name, icon_url)
      `)
      .is('community_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'クエストの取得に失敗しました' }
  }
}

/**
 * 全ユーザーに通知を送信
 */
async function sendNotificationToAllUsers(
  type: 'global_announcement' | 'global_quest',
  title: string,
  content: string,
  linkUrl: string
) {
  try {
    // 全ユーザーのIDを取得
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')

    if (usersError || !users) {
      console.error('Error fetching users for notifications:', usersError)
      return
    }

    // バッチで通知を作成（Supabaseの制限を考慮して100件ずつ）
    const batchSize = 100
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const notifications = batch.map(user => ({
        user_id: user.id,
        type,
        title,
        content: content.substring(0, 500), // 通知の内容は500文字まで
        link_url: linkUrl,
        is_read: false
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
      }
    }
  } catch (error) {
    console.error('Error sending notifications to all users:', error)
  }
}

