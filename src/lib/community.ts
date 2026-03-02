import { supabase } from './supabase'
import type { Community, CommunityMember, MemberStatus, MemberRole, CommunityRoom } from './supabase'

/**
 * コミュニティを検索
 * 通常の検索では公開コミュニティのみを返す
 * コミュニティID（UUID）で検索した場合は非公開も含める
 */
export async function searchCommunities(
  query?: string, 
  communityType?: 'guild' | 'official' | 'all'
) {
  const { data: { user } } = await supabase.auth.getUser()
  
  // UUID形式かどうかをチェック（コミュニティID検索）
  const isUuidSearch = query && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim())
  
  let supabaseQuery = supabase
    .from('communities')
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name, is_operator)
    `)
    .eq('is_archived', false) // アーカイブされていないコミュニティのみ
    .order('created_at', { ascending: false })

  if (query) {
    if (isUuidSearch) {
      // UUID検索の場合はIDで直接検索（非公開も含む）
      supabaseQuery = supabaseQuery.eq('id', query.trim())
    } else {
      // 通常の検索は名前と説明で検索し、公開コミュニティのみ
      supabaseQuery = supabaseQuery
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('visibility', 'public')
    }
  } else {
    // クエリがない場合は公開コミュニティのみ
    supabaseQuery = supabaseQuery.eq('visibility', 'public')
  }

  // コミュニティ種別でフィルタリング
  if (communityType && communityType !== 'all') {
    supabaseQuery = supabaseQuery.eq('community_type', communityType)
  }

  const { data, error } = await supabaseQuery

  if (error) {
    console.error('Error searching communities:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  const communityIds = data.map(c => c.id)

  // 各コミュニティのメンバー数をRPC関数で取得（RLSバイパス）
  const memberCountResults = await Promise.all(
    communityIds.map(id => supabase.rpc('get_community_member_count', { p_community_id: id }))
  )
  const memberCountMap = new Map<string, number>()
  communityIds.forEach((id, i) => {
    memberCountMap.set(id, memberCountResults[i].data ?? 1)
  })

  // ユーザーがログインしている場合、メンバーシップ状態を取得
  let membershipMap = new Map<string, string>()
  if (user) {
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id, status')
      .eq('user_id', user.id)
      .in('community_id', communityIds)

    membershipMap = new Map(
      memberships?.map(m => [m.community_id, m.status]) || []
    )
  }

  return data.map(community => {
    const isMember = user && (
      community.owner_id === user.id ||
      membershipMap.get(community.id) === 'approved'
    )

    return {
      ...community,
      member_count: memberCountMap.get(community.id) ?? 1,
      is_member: isMember || false,
      member_status: membershipMap.get(community.id) || undefined
    }
  })
}

/**
 * コミュニティをIDで取得
 */
export async function getCommunityById(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name, is_operator)
    `)
    .eq('id', communityId)
    .single()

  if (error) {
    console.error('Error fetching community:', error)
    throw error
  }

  // メンバー情報を取得（ユーザーがログインしている場合）
  // 所有者の場合は自動的にメンバーとして扱う
  if (userId && data) {
    const isOwner = data.owner_id === userId
    
    if (isOwner) {
      return {
        ...data,
        is_member: true,
        member_status: 'approved' as MemberStatus,
        member_role: 'admin' as MemberRole
      }
    }

    // 所有者でない場合のみ、メンバーテーブルを確認
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
 * コミュニティを作成（個人アカウントはサークル、組織アカウントは公式コミュニティ）
 */
export async function createCommunity(
  name: string,
  description?: string,
  coverImageUrl?: string,
  iconUrl?: string,
  visibility: 'public' | 'private' = 'public',
  communityType: 'guild' | 'official' = 'official',
  timezone?: string
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

  // 個人アカウントはサークルのみ、組織アカウントは公式コミュニティのみ
  if (communityType === 'guild' && profile.account_type !== 'individual') {
    throw new Error('サークルは個人アカウントのみ作成できます')
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
      community_type: communityType, // サークル or 公式コミュニティ
      timezone: timezone || null
    })
    .select(`
      *,
      owner:profiles(id, name, account_type, verification_status, organization_name, is_operator)
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
    is_archived?: boolean
    timezone?: string | null
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
      owner:profiles(id, name, account_type, verification_status, organization_name, is_operator)
    `)
    .single()

  if (error) {
    console.error('Error updating community:', error)
    throw error
  }

  return data
}

/**
 * コミュニティを削除（所有者または管理者のみ）
 */
export async function deleteCommunity(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティ情報を取得
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  // 所有者か管理者かを確認
  const isOwner = community.owner_id === user.id
  
  // 管理者かどうかを確認
  let isAdmin = false
  if (!isOwner) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    isAdmin = profile?.is_admin === true
  }

  if (!isOwner && !isAdmin) {
    throw new Error('コミュニティの所有者または管理者のみ削除できます')
  }

  // コミュニティを削除（CASCADEで関連データも削除される）
  const { error } = await supabase
    .from('communities')
    .delete()
    .eq('id', communityId)

  if (error) {
    console.error('Error deleting community:', error)
    throw error
  }
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
 * コミュニティへの加入申請を取り消す
 */
export async function cancelCommunityMembershipRequest(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 申請中のメンバーシップを取得
  const { data: membership } = await supabase
    .from('community_members')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()

  if (!membership) {
    throw new Error('加入申請が見つかりません')
  }

  // 申請を取り消す（削除）
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('id', membership.id)

  if (error) {
    console.error('Error canceling membership request:', error)
    throw error
  }
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

  const communityId = (membership.community as any).id || membership.community_id
  const communityOwnerId = (membership.community as any).owner_id

  // owner/admin/moderatorチェック
  const isOwner = communityOwnerId === user.id
  let canManage = isOwner
  if (!canManage) {
    const { data: currentMember } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()
    canManage = currentMember?.role === 'admin' || currentMember?.role === 'moderator'
  }

  if (!canManage) {
    throw new Error('コミュニティの管理者のみ承認/拒否できます')
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
 * 注意: この関数はコミュニティメンバーまたは所有者のみが使用可能
 */
export async function getCommunityMembers(
  communityId: string,
  status?: MemberStatus
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティの所有者か、メンバーかを確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  const isOwner = community.owner_id === user.id

  // メンバーシップを確認（所有者の場合はスキップ）
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()

    if (!membership) {
      throw new Error('コミュニティメンバーのみメンバー一覧を閲覧できます')
    }
  }

  // メンバー一覧を取得（所有者またはメンバーのみ実行可能）
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
        owner:profiles(id, name, account_type, verification_status, organization_name, is_operator)
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
  const [memberCountResult, announcementsResult, eventsResult] = await Promise.all([
    supabase.rpc('get_community_member_count', { p_community_id: communityId }),
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
    member_count: memberCountResult.data ?? 1,
    announcement_count: announcementsResult.count || 0,
    event_count: eventsResult.count || 0
  }
}

/**
 * コミュニティ限定投稿を取得
 */
export async function getCommunityPosts(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(id, name, account_type, verification_status, organization_name, icon_url, timezone)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching community posts:', error)
    throw error
  }

  // いいね状態を取得（ユーザーがログインしている場合）
  if (userId && data) {
    const postIds = data.map(post => post.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    const likedPostIds = new Set(likesData?.map(like => like.post_id) || [])
    return data.map(post => ({
      ...post,
      is_liked: likedPostIds.has(post.id)
    }))
  }

  return data || []
}

/**
 * コミュニティのイベント一覧を取得
 */
export async function getCommunityEvents(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .eq('community_id', communityId)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching community events:', error)
    throw error
  }

  // 参加状態を取得（ユーザーがログインしている場合）
  if (userId && data) {
    const eventIds = data.map(event => event.id)
    const { data: participantsData } = await supabase
      .from('event_participants')
      .select('event_id, status')
      .eq('user_id', userId)
      .in('event_id', eventIds)

    const participantMap = new Map(
      participantsData?.map(p => [p.event_id, p.status]) || []
    )

    return data.map(event => ({
      ...event,
      is_registered: participantMap.has(event.id),
      registration_status: participantMap.get(event.id) || undefined
    }))
  }

  return data || []
}

/**
 * イベントを作成
 */
export async function createEvent(
  communityId: string,
  title: string,
  description: string,
  eventDate: string,
  location?: string,
  onlineUrl?: string,
  deadline?: string,
  capacity?: number,
  attachments?: Array<{ url: string; filename: string; type: string }>
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティ情報を取得
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id, community_type')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  if (community.community_type !== 'official') {
    throw new Error('イベントは公式コミュニティのみ作成できます')
  }

  // owner/admin/moderatorチェック
  const isOwner = community.owner_id === user.id
  let canManage = isOwner
  if (!canManage) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()
    canManage = member?.role === 'admin' || member?.role === 'moderator'
  }

  if (!canManage) {
    throw new Error('コミュニティの管理者のみイベントを作成できます')
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      community_id: communityId,
      title,
      description,
      event_date: eventDate,
      location: location || null,
      online_url: onlineUrl || null,
      registration_deadline: deadline || null,
      deadline: deadline || null,
      capacity: capacity || null,
      attachments: attachments || [],
      created_by: user.id
    })
    .select(`
      *,
      creator:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .single()

  if (error) {
    console.error('Error creating event:', error)
    throw error
  }

  return data
}

/**
 * イベントに参加登録
 */
export async function registerEvent(eventId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // イベント情報を取得
  const { data: event } = await supabase
    .from('events')
    .select('community_id, capacity, registration_deadline, deadline')
    .eq('id', eventId)
    .single()

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  // 締切チェック
  const deadline = event.deadline || event.registration_deadline
  if (deadline && new Date(deadline) < new Date()) {
    throw new Error('参加登録の締切を過ぎています')
  }

  // 定員チェック
  if (event.capacity) {
    const { count } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered')

    if (count && count >= event.capacity) {
      throw new Error('定員に達しています')
    }
  }

  // 既に登録済みか確認
  const { data: existing } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    throw new Error('既に参加登録済みです')
  }

  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: 'registered'
    })
    .select(`
      *,
      user:profiles(id, name)
    `)
    .single()

  if (error) {
    console.error('Error registering event:', error)
    throw error
  }

  return data
}

/**
 * イベントの参加登録をキャンセル
 */
export async function cancelEventRegistration(eventId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  const { data, error } = await supabase
    .from('event_participants')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error cancelling event registration:', error)
    throw error
  }

  return data
}

/**
 * イベントの参加者一覧を取得
 */
export async function getEventParticipants(eventId: string) {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      *,
      user:profiles(id, name, account_type, verification_status, organization_name)
    `)
    .eq('event_id', eventId)
    .eq('status', 'registered')
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('Error fetching event participants:', error)
    throw error
  }

  return data || []
}

/**
 * イベントを更新
 */
export async function updateEvent(
  eventId: string,
  updates: {
    title?: string
    description?: string
    event_date?: string
    location?: string
    online_url?: string
    deadline?: string
    capacity?: string
    attachments?: Array<{ url: string; filename: string; type: string }>
  }
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // イベント情報を取得
  const { data: event } = await supabase
    .from('events')
    .select(`
      created_by,
      community_id,
      community:communities(owner_id)
    `)
    .eq('id', eventId)
    .single()

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  // owner/admin/moderatorチェック
  const community = event.community as any
  const isOwner = community.owner_id === user.id
  let canManage = isOwner || event.created_by === user.id
  if (!canManage) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', event.community_id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()
    canManage = member?.role === 'admin' || member?.role === 'moderator'
  }

  if (!canManage) {
    throw new Error('コミュニティの管理者のみイベントを更新できます')
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select(`
      *,
      community:communities(id, name, community_type),
      creator:profiles(id, name)
    `)
    .single()

  if (error) {
    console.error('Error updating event:', error)
    throw error
  }

  return data as Event
}

/**
 * イベントを削除
 */
export async function deleteEvent(eventId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // イベント情報を取得
  const { data: event } = await supabase
    .from('events')
    .select(`
      created_by,
      community_id,
      community:communities(owner_id)
    `)
    .eq('id', eventId)
    .single()

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  // owner/admin/moderatorチェック
  const community = event.community as any
  const isOwner = community.owner_id === user.id
  let canManage = isOwner || event.created_by === user.id
  if (!canManage) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', event.community_id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()
    canManage = member?.role === 'admin' || member?.role === 'moderator'
  }

  if (!canManage) {
    throw new Error('コミュニティの管理者のみイベントを削除できます')
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

/**
 * コミュニティのチャンネル一覧を取得
 */
export async function getCommunityChannels(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('community_rooms')
    .select(`
      *,
      creator:profiles(id, name, icon_url)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching community channels:', error)
    throw error
  }

  // メッセージ数を取得
  if (data && data.length > 0) {
    const channelIds = data.map(channel => channel.id)
    const { data: messageCounts } = await supabase
      .from('community_room_messages')
      .select('room_id')
      .in('room_id', channelIds)

    const countMap = new Map<string, number>()
    messageCounts?.forEach(msg => {
      const current = countMap.get(msg.room_id) || 0
      countMap.set(msg.room_id, current + 1)
    })

    return data.map(channel => ({
      ...channel,
      message_count: countMap.get(channel.id) || 0
    }))
  }

  return data || []
}

/**
 * チャンネルを作成
 */
export async function createChannel(
  communityId: string,
  name: string,
  description?: string,
  memberPermission: 'auto' | 'request' = 'auto'
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティ情報を取得
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  // owner/admin/moderatorチェック
  const isOwner = community.owner_id === user.id
  let canManage = isOwner
  if (!canManage) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()
    canManage = member?.role === 'admin' || member?.role === 'moderator'
  }

  if (!canManage) {
    throw new Error('コミュニティの管理者のみチャンネルを作成できます')
  }

  const { data, error } = await supabase
    .from('community_rooms')
    .insert({
      community_id: communityId,
      name,
      description,
      created_by: user.id,
      member_permission: memberPermission
    })
    .select(`
      *,
      creator:profiles(id, name, icon_url)
    `)
    .single()

  if (error) {
    console.error('Error creating channel:', error)
    throw error
  }

  return data
}

/**
 * チャンネルを削除（運営者のみ）
 */
export async function deleteChannel(channelId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティの所有者か確認
  const { data: channel } = await supabase
    .from('community_rooms')
    .select(`
      *,
      community:communities(owner_id)
    `)
    .eq('id', channelId)
    .single()

  if (!channel) {
    throw new Error('チャンネルが見つかりません')
  }

  // owner/admin/moderatorチェック
  const isOwner = channel.community?.owner_id === user.id
  let canManage = isOwner
  if (!canManage) {
    const communityId = channel.community_id
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()
    canManage = member?.role === 'admin' || member?.role === 'moderator'
  }

  if (!canManage) {
    throw new Error('コミュニティの管理者のみチャンネルを削除できます')
  }

  const { error } = await supabase
    .from('community_rooms')
    .delete()
    .eq('id', channelId)

  if (error) {
    console.error('Error deleting channel:', error)
    throw error
  }
}

/**
 * チャンネルのメッセージを取得
 */
export async function getChannelMessages(channelId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('community_room_messages')
    .select(`
      *,
      sender:profiles(id, name, icon_url, account_type, verification_status, organization_name, is_operator)
    `)
    .eq('room_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching channel messages:', error)
    throw error
  }

  // 時系列順にソート（古い順）
  return (data || []).reverse()
}

/**
 * チャンネルにメッセージを送信
 */
export async function sendChannelMessage(
  channelId: string, 
  content: string,
  attachments?: Array<{ url: string; filename: string; type: string }>
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // チャンネルにアクセス権があるか確認
  const { data: channel } = await supabase
    .from('community_rooms')
    .select(`
      *,
      community:communities(id, owner_id)
    `)
    .eq('id', channelId)
    .single()

  if (!channel) {
    throw new Error('チャンネルが見つかりません')
  }

  // コミュニティのメンバーか確認
  const isOwner = channel.community?.owner_id === user.id
  if (!isOwner) {
    const { data: member } = await supabase
      .from('community_members')
      .select('status')
      .eq('community_id', channel.community?.id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()

    if (!member) {
      throw new Error('コミュニティのメンバーのみメッセージを送信できます')
    }
  }

  const { data, error } = await supabase
    .from('community_room_messages')
    .insert({
      room_id: channelId,
      sender_id: user.id,
      content: content.trim() || '', // ファイルのみの場合も許可
      attachments: attachments && attachments.length > 0 ? attachments : null
    })
    .select(`
      *,
      sender:profiles(id, name, icon_url, account_type, verification_status, organization_name, is_operator)
    `)
    .single()

  if (error) {
    console.error('Error sending channel message:', error)
    throw error
  }

  return data
}

// ============================================
// コミュニティ招待機能
// ============================================

/**
 * 招待リンクを生成
 */
export async function createCommunityInvite(
  communityId: string,
  options?: {
    expiresInDays?: number
    maxUses?: number
  }
): Promise<{ inviteToken: string; inviteUrl: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティの所有者または管理者か確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  const isOwner = community.owner_id === user.id
  if (!isOwner) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .in('role', ['admin', 'moderator'])
      .single()

    if (!member) {
      throw new Error('コミュニティの所有者・管理者のみ招待リンクを作成できます')
    }
  }

  // トークンを生成（32文字のランダム文字列）
  const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // 有効期限を計算
  const expiresAt = options?.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('community_invites')
    .insert({
      community_id: communityId,
      created_by: user.id,
      invite_token: inviteToken,
      expires_at: expiresAt,
      max_uses: options?.maxUses || null,
      used_count: 0,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invite:', error)
    throw error
  }

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/communities/${communityId}/invite/${inviteToken}`

  return { inviteToken, inviteUrl }
}

/**
 * 招待トークンでコミュニティに参加
 */
export async function joinCommunityByInvite(inviteToken: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 招待を取得
  const { data: invite, error: inviteError } = await supabase
    .from('community_invites')
    .select('*, community:communities(id)')
    .eq('invite_token', inviteToken)
    .eq('is_active', true)
    .single()

  if (inviteError || !invite) {
    throw new Error('有効な招待リンクが見つかりません')
  }

  // 有効期限チェック
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error('この招待リンクの有効期限が切れています')
  }

  // 使用回数チェック
  if (invite.max_uses !== null && invite.used_count >= invite.max_uses) {
    throw new Error('この招待リンクの使用回数制限に達しています')
  }

  // 既にメンバーか確認
  const { data: existingMember } = await supabase
    .from('community_members')
    .select('id, status')
    .eq('community_id', invite.community_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    if (existingMember.status === 'approved') {
      throw new Error('既にこのコミュニティのメンバーです')
    } else if (existingMember.status === 'pending') {
      throw new Error('既に加入申請済みです')
    }
  }

  // メンバーシップを作成（承認済み）
  const { error: memberError } = await supabase
    .from('community_members')
    .insert({
      community_id: invite.community_id,
      user_id: user.id,
      status: 'approved',
      role: 'member',
      joined_at: new Date().toISOString()
    })

  if (memberError) {
    console.error('Error joining community:', memberError)
    throw memberError
  }

  // 使用回数を増やす
  await supabase
    .from('community_invites')
    .update({ used_count: invite.used_count + 1 })
    .eq('id', invite.id)
}

/**
 * 招待リンク一覧を取得
 */
export async function getCommunityInvites(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 権限チェック
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  const isOwner = community.owner_id === user.id
  if (!isOwner) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .in('role', ['admin', 'moderator'])
      .single()

    if (!member) {
      throw new Error('権限がありません')
    }
  }

  const { data, error } = await supabase
    .from('community_invites')
    .select('*, creator:profiles(id, name)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invites:', error)
    throw error
  }

  return data || []
}

/**
 * 招待リンクを無効化
 */
export async function revokeCommunityInvite(inviteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 招待を取得して権限チェック
  const { data: invite } = await supabase
    .from('community_invites')
    .select('*, community:communities(owner_id)')
    .eq('id', inviteId)
    .single()

  if (!invite) {
    throw new Error('招待リンクが見つかりません')
  }

  const isOwner = invite.community?.owner_id === user.id
  if (!isOwner) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', invite.community_id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .in('role', ['admin', 'moderator'])
      .single()

    if (!member) {
      throw new Error('権限がありません')
    }
  }

  const { error } = await supabase
    .from('community_invites')
    .update({ is_active: false })
    .eq('id', inviteId)

  if (error) {
    console.error('Error revoking invite:', error)
    throw error
  }
}

// ============================================
// 所有者権限移管機能
// ============================================

/**
 * コミュニティの所有者権限を移管
 */
export async function transferCommunityOwnership(
  communityId: string,
  newOwnerId: string,
  reason?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 現在の所有者か確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  if (community.owner_id !== user.id) {
    throw new Error('所有者のみ権限を移管できます')
  }

  // 移管先のユーザーがコミュニティメンバーか確認
  const { data: newOwnerMember } = await supabase
    .from('community_members')
    .select('id, status')
    .eq('community_id', communityId)
    .eq('user_id', newOwnerId)
    .eq('status', 'approved')
    .single()

  if (!newOwnerMember) {
    throw new Error('移管先のユーザーは承認済みメンバーである必要があります')
  }

  // トランザクション開始（Supabaseでは手動で管理）
  const oldOwnerId = community.owner_id

  // 所有者を更新
  const { error: updateError } = await supabase
    .from('communities')
    .update({ owner_id: newOwnerId })
    .eq('id', communityId)

  if (updateError) {
    console.error('Error transferring ownership:', updateError)
    throw updateError
  }

  // 元の所有者を管理者ロールに変更
  const { error: memberUpdateError } = await supabase
    .from('community_members')
    .update({ role: 'admin' })
    .eq('community_id', communityId)
    .eq('user_id', oldOwnerId)

  if (memberUpdateError) {
    console.error('Error updating old owner role:', memberUpdateError)
    // エラーでも続行（既にadminの場合など）
  }

  // 移管先のユーザーを管理者ロールに変更（既にメンバーの場合）
  await supabase
    .from('community_members')
    .update({ role: 'admin' })
    .eq('community_id', communityId)
    .eq('user_id', newOwnerId)

  // 移管履歴を記録
  await supabase
    .from('community_ownership_transfers')
    .insert({
      community_id: communityId,
      from_user_id: oldOwnerId,
      to_user_id: newOwnerId,
      reason: reason || null
    })
}

// ============================================
// 管理者ロール管理機能
// ============================================

/**
 * メンバーに管理者ロールを付与
 */
export async function promoteToAdmin(
  communityId: string,
  userId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 権限チェック（所有者または管理者）
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  const isOwner = community.owner_id === user.id
  if (!isOwner) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('role', 'admin')
      .single()

    if (!member) {
      throw new Error('所有者または管理者のみ管理者を任命できます')
    }
  }

  // 対象ユーザーが承認済みメンバーか確認
  const { data: targetMember } = await supabase
    .from('community_members')
    .select('id, status')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'approved')
    .single()

  if (!targetMember) {
    throw new Error('対象ユーザーは承認済みメンバーである必要があります')
  }

  // 管理者ロールに変更
  const { error } = await supabase
    .from('community_members')
    .update({ role: 'admin' })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error promoting to admin:', error)
    throw error
  }
}

/**
 * 管理者ロールを剥奪
 */
export async function demoteFromAdmin(
  communityId: string,
  userId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 所有者のみ実行可能
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  if (community.owner_id !== user.id) {
    throw new Error('所有者のみ管理者権限を剥奪できます')
  }

  // 自分自身を剥奪できない
  if (userId === user.id) {
    throw new Error('所有者の権限を剥奪することはできません')
  }

  // 一般メンバーに変更
  const { error } = await supabase
    .from('community_members')
    .update({ role: 'member' })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error demoting from admin:', error)
    throw error
  }
}

/**
 * コミュニティから退出
 */
export async function leaveCommunity(communityId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 所有者は退出できない
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  if (community.owner_id === user.id) {
    throw new Error('所有者はコミュニティから退出できません。先に所有者権限を移管してください。')
  }

  // メンバーシップを削除
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error leaving community:', error)
    throw error
  }
}