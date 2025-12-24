import { supabase } from './supabase'
import type { Community, CommunityMember, MemberStatus, MemberRole } from './supabase'

/**
 * コミュニティを検索
 */
export async function searchCommunities(query?: string, visibility?: 'public' | 'private' | 'all') {
  let supabaseQuery = supabase
    .from('communities')
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .order('created_at', { ascending: false })

  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  if (visibility && visibility !== 'all') {
    supabaseQuery = supabaseQuery.eq('visibility', visibility)
  }

  const { data, error } = await supabaseQuery

  if (error) {
    console.error('Error searching communities:', error)
    throw error
  }

  return data || []
}

/**
 * コミュニティをIDで取得
 */
export async function getCommunityById(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .eq('id', communityId)
    .single()

  if (error) {
    console.error('Error fetching community:', error)
    throw error
  }

  // メンバー情報を取得（ユーザーがログインしている場合）
  if (userId && data) {
    const { data: memberData } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single()

    if (memberData) {
      return {
        ...data,
        is_member: memberData.status === 'approved',
        member_status: memberData.status,
        member_role: memberData.role
      }
    }
  }

  return data
}

/**
 * コミュニティを作成（個人アカウントはギルド、組織アカウントは公式コミュニティ）
 */
export async function createCommunity(
  name: string,
  description?: string,
  coverImageUrl?: string,
  iconUrl?: string,
  visibility: 'public' | 'private' = 'public',
  communityType: 'guild' | 'official' = 'official'
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // プロフィールを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, verification_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('プロフィールが見つかりません')
  }

  // 個人アカウントはギルドのみ、組織アカウントは公式コミュニティのみ
  if (communityType === 'guild' && profile.account_type !== 'individual') {
    throw new Error('ギルドは個人アカウントのみ作成できます')
  }
  if (communityType === 'official' && (profile.account_type === 'individual' || profile.verification_status !== 'verified')) {
    throw new Error('公式コミュニティは認証済みの組織アカウントのみ作成できます')
  }

  const { data, error } = await supabase
    .from('communities')
    .insert({
      name,
      description,
      cover_image_url: coverImageUrl,
      icon_url: iconUrl,
      owner_id: user.id,
      visibility,
      community_type: communityType // ギルド or 公式コミュニティ
    })
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .single()

  if (error) {
    console.error('Error creating community:', error)
    throw error
  }

  // 作成者を自動的にメンバーとして追加（承認済み、管理者権限）
  if (data) {
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: data.id,
        user_id: user.id,
        status: 'approved',
        role: 'admin',
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
      // メンバー追加に失敗してもコミュニティ作成は成功とする
    }
  }

  return data
}

/**
 * コミュニティを更新
 */
export async function updateCommunity(
  communityId: string,
  updates: {
    name?: string
    description?: string
    cover_image_url?: string
    icon_url?: string
    visibility?: 'public' | 'private'
  }
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 所有者か確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community || community.owner_id !== user.id) {
    throw new Error('コミュニティの所有者のみ更新できます')
  }

  const { data, error } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', communityId)
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .single()

  if (error) {
    console.error('Error updating community:', error)
    throw error
  }

  return data
}

/**
 * コミュニティに加入申請
 */
export async function requestCommunityMembership(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 既に申請済みか確認
  const { data: existing } = await supabase
    .from('community_members')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    throw new Error('既に申請済みです')
  }

  const { data, error } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      user_id: user.id,
      status: 'pending'
    })
    .select(`
      *,
      community:communities(*),
      user:profiles(*)
    `)
    .single()

  if (error) {
    console.error('Error requesting membership:', error)
    throw error
  }

  return data
}

/**
 * メンバー申請を承認/拒否
 */
export async function updateMembershipStatus(
  membershipId: string,
  status: MemberStatus,
  role: MemberRole = 'member'
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティの所有者か確認
  const { data: membership } = await supabase
    .from('community_members')
    .select(`
      *,
      community:communities(owner_id)
    `)
    .eq('id', membershipId)
    .single()

  if (!membership || (membership.community as any).owner_id !== user.id) {
    throw new Error('コミュニティの所有者のみ承認/拒否できます')
  }

  const updateData: any = { status }
  if (status === 'approved') {
    updateData.role = role
  }

  const { data, error } = await supabase
    .from('community_members')
    .update(updateData)
    .eq('id', membershipId)
    .select(`
      *,
      community:communities(*),
      user:profiles(*)
    `)
    .single()

  if (error) {
    console.error('Error updating membership status:', error)
    throw error
  }

  return data
}

/**
 * コミュニティのメンバー一覧を取得
 */
export async function getCommunityMembers(
  communityId: string,
  status?: MemberStatus
) {
  let query = supabase
    .from('community_members')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('community_id', communityId)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching members:', error)
    throw error
  }

  return data || []
}

/**
 * ユーザーが参加しているコミュニティ一覧を取得
 */
export async function getUserCommunities(userId: string) {
  const { data, error } = await supabase
    .from('community_members')
    .select(`
      *,
      community:communities(
        *,
        owner:profiles(id, name, account_type, verification_status, organization_name)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching user communities:', error)
    throw error
  }

  return data || []
}

/**
 * コミュニティの統計情報を取得
 */
export async function getCommunityStats(communityId: string) {
  const [membersResult, announcementsResult, eventsResult] = await Promise.all([
    supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('status', 'approved'),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
  ])

  return {
    member_count: membersResult.count || 0,
    announcement_count: announcementsResult.count || 0,
    event_count: eventsResult.count || 0
  }
}


