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

  // 各コミュニティのメンバー数を取得
  const communityIds = data.map(c => c.id)
  
  // 承認済みメンバーを取得
  const { data: approvedMembers } = await supabase
    .from('community_members')
    .select('community_id, user_id')
    .in('community_id', communityIds)
    .eq('status', 'approved')

  // コミュニティIDごとのメンバー数をカウント
  const memberCountMap = new Map<string, number>()
  approvedMembers?.forEach(m => {
    const currentCount = memberCountMap.get(m.community_id) || 0
    memberCountMap.set(m.community_id, currentCount + 1)
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

  // 各コミュニティのメンバー数を設定
  // 所有者がメンバーテーブルに含まれていない場合でも、コミュニティには最低1人（所有者）がいる
  return data.map(community => {
    const approvedCount = memberCountMap.get(community.id) || 0
    // 所有者がメンバーテーブルに含まれているか確認
    const ownerInMembers = approvedMembers?.some(m => 
      m.community_id === community.id && m.user_id === community.owner_id
    )
    // メンバー数は承認済みメンバー数（所有者が含まれていない場合は+1）
    const memberCount = ownerInMembers ? approvedCount : Math.max(approvedCount, 1)

    const isMember = user && (
      community.owner_id === user.id || 
      membershipMap.get(community.id) === 'approved'
    )

    return {
      ...community,
      member_count: memberCount,
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
      community_type: communityType // サークル or 公式コミュニティ
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

/**
 * コミュニティ限定投稿を取得
 */
export async function getCommunityPosts(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(id, name, account_type, verification_status, organization_name, icon_url)
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

  // コミュニティの所有者か確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id, community_type')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  if (community.owner_id !== user.id) {
    throw new Error('コミュニティの所有者のみイベントを作成できます')
  }

  if (community.community_type !== 'official') {
    throw new Error('イベントは公式コミュニティのみ作成できます')
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

  // メンバーシップを確認
  const { data: membership } = await supabase
    .from('community_members')
    .select('*')
    .eq('community_id', event.community_id)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!membership) {
    throw new Error('コミュニティメンバーのみ参加登録できます')
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

  // イベントの作成者またはコミュニティの所有者か確認
  const { data: event } = await supabase
    .from('events')
    .select(`
      created_by,
      community:communities(owner_id)
    `)
    .eq('id', eventId)
    .single()

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  const community = event.community as any
  if (event.created_by !== user.id && community.owner_id !== user.id) {
    throw new Error('イベントの作成者またはコミュニティの所有者のみ更新できます')
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

  // イベントの作成者またはコミュニティの所有者か確認
  const { data: event } = await supabase
    .from('events')
    .select(`
      created_by,
      community:communities(owner_id)
    `)
    .eq('id', eventId)
    .single()

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  const community = event.community as any
  if (event.created_by !== user.id && community.owner_id !== user.id) {
    throw new Error('イベントの作成者またはコミュニティの所有者のみ削除できます')
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

  // コミュニティのメンバーか確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  // 所有者でない場合、メンバーシップを確認
  if (community.owner_id !== user.id) {
    const { data: member } = await supabase
      .from('community_members')
      .select('status')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single()

    if (!member) {
      throw new Error('コミュニティのメンバーのみチャンネルを作成できます')
    }
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

  if (channel.community?.owner_id !== user.id) {
    throw new Error('コミュニティの運営者のみチャンネルを削除できます')
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

