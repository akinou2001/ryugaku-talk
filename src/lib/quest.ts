import { supabase } from './supabase'
import type { Quest, QuestCompletion, QuestStatus, QuestCompletionStatus, Post } from './supabase'

/**
 * 全員向けクエスト一覧を取得
 */
export async function getGlobalQuests(userId?: string, includeCompleted: boolean = true) {
  // 期限が過ぎた全員向けクエストを自動的に〆切状態にする
  await closeExpiredQuests(null)

  let query = supabase
    .from('quests')
    .select(`
      *,
      creator:profiles(id, name, icon_url)
    `)
    .is('community_id', null)

  // 完了済みも含める場合は、statusフィルタを適用しない
  if (!includeCompleted) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching global quests:', error)
    throw error
  }

  // ユーザーの完了状況を取得
  if (userId && data) {
    const { data: completions } = await supabase
      .from('quest_completions')
      .select('quest_id, status')
      .eq('user_id', userId)
      .in('quest_id', data.map(q => q.id))

    const completionMap = new Map(
      completions?.map(c => [c.quest_id, c.status]) || []
    )

    return data.map(quest => ({
      ...quest,
      user_completion_status: completionMap.get(quest.id) || undefined
    })) as Quest[]
  }

  return data as Quest[]
}

/**
 * コミュニティのクエスト一覧を取得
 */
export async function getQuests(communityId: string, userId?: string, includeCompleted: boolean = true) {
  // 期限が過ぎたクエストを自動的に〆切状態にする
  await closeExpiredQuests(communityId)

  let query = supabase
    .from('quests')
    .select(`
      *,
      community:communities(id, name, community_type),
      creator:profiles(id, name, icon_url)
    `)
    .eq('community_id', communityId)

  // 完了済みも含める場合は、statusフィルタを適用しない
  if (!includeCompleted) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quests:', error)
    throw error
  }

  // ユーザーの完了状況を取得
  if (userId && data) {
    const { data: completions } = await supabase
      .from('quest_completions')
      .select('quest_id, status')
      .eq('user_id', userId)
      .in('quest_id', data.map(q => q.id))

    const completionMap = new Map(
      completions?.map(c => [c.quest_id, c.status]) || []
    )

    return data.map(quest => ({
      ...quest,
      user_completion_status: completionMap.get(quest.id) || undefined
    })) as Quest[]
  }

  return data as Quest[]
}

/**
 * クエストを作成（コミュニティ管理者のみ）
 */
export async function createQuest(
  communityId: string,
  title: string,
  description?: string,
  rewardAmount: number = 1,
  deadline?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // コミュニティの所有者か確認
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single()

  if (!community) {
    throw new Error('コミュニティが見つかりません')
  }

  if (community.owner_id !== user.id) {
    throw new Error('コミュニティの管理者のみクエストを作成できます')
  }

  // 作成者のプロフィール情報を取得（スナップショット）
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, account_type')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('quests')
    .insert({
      community_id: communityId,
      title,
      description,
      created_by: user.id,
      creator_profile: profile || null,
      reward_amount: rewardAmount,
      deadline: deadline || null,
      status: 'active'
    })
    .select(`
      *,
      community:communities(id, name, community_type),
      creator:profiles(id, name)
    `)
    .single()

  if (error) {
    console.error('Error creating quest:', error)
    throw error
  }

  return data as Quest
}

/**
 * クエストを更新
 */
export async function updateQuest(
  questId: string,
  updates: {
    title?: string
    description?: string
    reward_amount?: number
    deadline?: string
  }
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // クエストの作成者か確認
  const { data: quest } = await supabase
    .from('quests')
    .select('created_by')
    .eq('id', questId)
    .single()

  if (!quest) {
    throw new Error('クエストが見つかりません')
  }

  if (quest.created_by !== user.id) {
    throw new Error('クエストの作成者のみ更新できます')
  }

  const { data, error } = await supabase
    .from('quests')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', questId)
    .select(`
      *,
      community:communities(id, name, community_type),
      creator:profiles(id, name)
    `)
    .single()

  if (error) {
    console.error('Error updating quest:', error)
    throw error
  }

  return data as Quest
}

/**
 * 期限が過ぎたクエストを自動的に〆切状態にする
 */
export async function closeExpiredQuests(communityId?: string | null) {
  const now = new Date().toISOString()
  
  let query = supabase
    .from('quests')
    .update({ 
      status: 'completed',
      updated_at: now
    })
    .eq('status', 'active')
    .lt('deadline', now)
    .not('deadline', 'is', null)

  if (communityId !== undefined && communityId !== null) {
    query = query.eq('community_id', communityId)
  } else if (communityId === null) {
    // 全員向けクエスト（community_id IS NULL）の場合
    query = query.is('community_id', null)
  }

  const { error } = await query

  if (error) {
    console.error('Error closing expired quests:', error)
    // エラーが発生しても処理を続行
  }
}

/**
 * クエストを削除
 */
export async function deleteQuest(questId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // クエストの作成者か確認
  const { data: quest, error: fetchError } = await supabase
    .from('quests')
    .select('created_by, community_id')
    .eq('id', questId)
    .single()

  if (fetchError) {
    console.error('Error fetching quest:', fetchError)
    throw new Error('クエストの取得に失敗しました')
  }

  if (!quest) {
    throw new Error('クエストが見つかりません')
  }

  if (quest.created_by !== user.id) {
    throw new Error('クエストの作成者のみ削除できます')
  }

  // クエストに関連するquest_completionsを先に削除（CASCADEが設定されていない場合）
  const { error: deleteCompletionsError } = await supabase
    .from('quest_completions')
    .delete()
    .eq('quest_id', questId)

  if (deleteCompletionsError) {
    console.error('Error deleting quest completions:', deleteCompletionsError)
    // エラーが発生しても続行（CASCADEで自動削除される可能性があるため）
  }

  // クエストを削除
  const { error } = await supabase
    .from('quests')
    .delete()
    .eq('id', questId)

  if (error) {
    console.error('Error deleting quest:', error)
    throw new Error(error.message || 'クエストの削除に失敗しました')
  }
}

/**
 * クエスト完了を申請
 */
export async function requestQuestCompletion(
  questId: string,
  proofText?: string,
  proofUrl?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // クエスト情報を取得
  const { data: quest } = await supabase
    .from('quests')
    .select('created_by, community:communities(community_type)')
    .eq('id', questId)
    .single()

  if (!quest) {
    throw new Error('クエストが見つかりません')
  }

  // 既に申請済みか確認
  const { data: existing } = await supabase
    .from('quest_completions')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    throw new Error('既に申請済みです')
  }

  const { data, error } = await supabase
    .from('quest_completions')
    .insert({
      quest_id: questId,
      user_id: user.id,
      completed_by: quest.created_by, // クエスト作成者が判定を行う
      status: 'pending',
      proof_text: proofText,
      proof_url: proofUrl
    })
    .select(`
      *,
      quest:quests(*),
      user:profiles!quest_completions_user_id_fkey(id, name)
    `)
    .single()

  if (error) {
    console.error('Error requesting quest completion:', error)
    throw error
  }

  return data as QuestCompletion
}

/**
 * クエスト完了を承認/拒否
 */
export async function updateQuestCompletionStatus(
  completionId: string,
  status: QuestCompletionStatus
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 完了記録を取得
  const { data: completion } = await supabase
    .from('quest_completions')
    .select(`
      *,
      quest:quests(created_by, reward_amount, community:communities(community_type))
    `)
    .eq('id', completionId)
    .single()

  if (!completion) {
    throw new Error('完了記録が見つかりません')
  }

  const quest = completion.quest as any
  if (quest.created_by !== user.id) {
    throw new Error('クエスト作成者のみ承認/拒否できます')
  }

  // ステータスを更新
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  // 承認された場合、報酬を付与
  if (status === 'approved' && !completion.reward_given) {
    updateData.reward_given = true

    // スコアを更新
    await updateUserScore(
      completion.user_id,
      quest.reward_amount
    )
  }

  const { data, error } = await supabase
    .from('quest_completions')
    .update(updateData)
    .eq('id', completionId)
    .select(`
      *,
      quest:quests(*),
      user:profiles!quest_completions_user_id_fkey(id, name)
    `)
    .single()

  if (error) {
    console.error('Error updating quest completion status:', error)
    throw error
  }

  return data as QuestCompletion
}

/**
 * ユーザースコアを更新（将来の拡張用、現在は使用しない）
 */
export async function updateUserScore(
  userId: string,
  amount: number
) {
  // スコアレコードを取得または作成
  const { data: existing } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_scores')
      .update(updateData)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating user score:', error)
      throw error
    }
  } else {
    const insertData: any = {
      user_id: userId
    }

    const { error } = await supabase
      .from('user_scores')
      .insert(insertData)

    if (error) {
      console.error('Error creating user score:', error)
      throw error
    }
  }
}

/**
 * クエストの完了申請一覧を取得（クエスト作成者向け）
 */
export async function getQuestCompletions(questId: string) {
  const { data, error } = await supabase
    .from('quest_completions')
    .select(`
      *,
      user:profiles!quest_completions_user_id_fkey(id, name),
      completed_by_user:profiles!quest_completions_completed_by_fkey(id, name),
      quest:quests(title, reward_amount)
    `)
    .eq('quest_id', questId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quest completions:', error)
    throw error
  }

  return data as QuestCompletion[]
}

/**
 * ユーザースコアを取得
 */
export async function getUserScore(userId: string) {
  // リレーション指定を削除して、単純にuser_scoresテーブルから取得
  // 406エラーを避けるため、リレーションは使用しない
  const { data, error } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // エラーハンドリング
  if (error) {
    // PGRST116は「レコードが見つからない」エラー（正常）
    // その他のエラーはログに出力
    if (error.code !== 'PGRST116') {
      // 406エラー（Not Acceptable）の場合は警告のみ
      // 型アサーションを使用してstatusをチェック（PostgrestError型にはstatusが存在しないが、実際のエラーオブジェクトには含まれる場合がある）
      const errorWithStatus = error as any
      if (errorWithStatus.status !== 406) {
        console.error('Error fetching user score:', error)
      }
    }
    // エラーが発生した場合はデフォルト値を返す
    return {
      id: '',
      user_id: userId,
      flame_count: 0,
      candle_count: 0,
      torch_count: 0,
      candles_received_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // レコードが存在しない場合はデフォルト値を返す
  if (!data) {
    return {
      id: '',
      user_id: userId,
      flame_count: 0,
      candle_count: 0,
      torch_count: 0,
      candles_received_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return data
}

/**
 * クエストIDでクエストを取得
 */
export async function getQuestById(questId: string) {
  const { data, error } = await supabase
    .from('quests')
    .select(`
      *,
      community:communities(id, name, community_type, owner_id),
      creator:profiles(id, name, icon_url, account_type, verification_status, organization_name, is_operator)
    `)
    .eq('id', questId)
    .single()

  if (error) {
    console.error('Error fetching quest:', error)
    throw error
  }

  return data as Quest
}

/**
 * クエストに紐づく投稿を取得（ツリー表示用）
 */
export async function getQuestPosts(questId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(id, name, icon_url, account_type, verification_status, organization_name, is_operator)
    `)
    .eq('quest_id', questId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching quest posts:', error)
    throw error
  }

  return data as Post[]
}

/**
 * クエストに紐づく投稿数を取得
 */
export async function getQuestPostCount(questId: string): Promise<number> {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('quest_id', questId)

  if (error) {
    console.error('Error fetching quest post count:', error)
    return 0
  }

  return count || 0
}

/**
 * 複数のクエストに紐づく投稿数を一括取得
 */
export async function getQuestPostCounts(questIds: string[]): Promise<Map<string, number>> {
  if (questIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('posts')
    .select('quest_id')
    .in('quest_id', questIds)
    .not('quest_id', 'is', null)

  if (error) {
    console.error('Error fetching quest post counts:', error)
    return new Map()
  }

  const countMap = new Map<string, number>()
  questIds.forEach(id => countMap.set(id, 0))
  
  data?.forEach(post => {
    if (post.quest_id) {
      countMap.set(post.quest_id, (countMap.get(post.quest_id) || 0) + 1)
    }
  })

  return countMap
}

/**
 * クエスト投稿を承認（管理者によるOKスタンプ）
 */
export async function approveQuestPost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 投稿とクエスト情報を取得
  const { data: post } = await supabase
    .from('posts')
    .select(`
      quest_id,
      quest:quests!inner(
        id,
        community_id,
        community:communities!inner(owner_id)
      )
    `)
    .eq('id', postId)
    .single()

  if (!post || !post.quest_id) {
    throw new Error('クエスト投稿が見つかりません')
  }

  // コミュニティの管理者か確認
  const quest = post.quest as any
  const community = quest?.community as any
  const communityOwnerId = community?.owner_id
  if (communityOwnerId !== user.id) {
    throw new Error('コミュニティの管理者のみ承認できます')
  }

  // 承認フラグを更新
  const { data, error } = await supabase
    .from('posts')
    .update({ quest_approved: true })
    .eq('id', postId)
    .select(`
      *,
      author:profiles(id, name, icon_url, account_type, verification_status, organization_name, is_operator)
    `)
    .single()

  if (error) {
    console.error('Error approving quest post:', error)
    throw error
  }

  return data as Post
}

/**
 * クエスト投稿の承認を解除
 */
export async function unapproveQuestPost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // 投稿とクエスト情報を取得
  const { data: post } = await supabase
    .from('posts')
    .select(`
      quest_id,
      quest:quests!inner(
        id,
        community_id,
        community:communities!inner(owner_id)
      )
    `)
    .eq('id', postId)
    .single()

  if (!post || !post.quest_id) {
    throw new Error('クエスト投稿が見つかりません')
  }

  // コミュニティの管理者か確認
  const quest = post.quest as any
  const community = quest?.community as any
  const communityOwnerId = community?.owner_id
  if (communityOwnerId !== user.id) {
    throw new Error('コミュニティの管理者のみ承認解除できます')
  }

  // 承認フラグを解除
  const { data, error } = await supabase
    .from('posts')
    .update({ quest_approved: false })
    .eq('id', postId)
    .select(`
      *,
      author:profiles(id, name, icon_url, account_type, verification_status, organization_name, is_operator)
    `)
    .single()

  if (error) {
    console.error('Error unapproving quest post:', error)
    throw error
  }

  return data as Post
}

/**
 * キャンドルを送信（週1回まで）- 現在は使用しない
 */
export async function sendCandle(senderId: string, receiverId: string) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 月曜日を0にする
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)

  // 今週に既に送信したか確認
  const { data: existing } = await supabase
    .from('candle_sends')
    .select('*')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .gte('sent_at', weekStart.toISOString())
    .single()

  if (existing) {
    throw new Error('今週は既にキャンドルを送信済みです（週1回まで）')
  }

  // キャンドル送信を記録
  const { error: sendError } = await supabase
    .from('candle_sends')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      sent_at: now.toISOString(),
      week_start: weekStart.toISOString()
    })

  if (sendError) {
    console.error('Error sending candle:', sendError)
    throw new Error('キャンドルの送信に失敗しました')
  }

  // 受信者のスコアを更新
  await updateUserScore(receiverId, 1)

  // 送信者のスコアも更新（送信回数の記録）
  const { data: senderScore } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', senderId)
    .single()

  if (senderScore) {
    await supabase
      .from('user_scores')
      .update({
        last_candle_sent_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('user_id', senderId)
  } else {
    await supabase
      .from('user_scores')
      .insert({
        user_id: senderId,
        last_candle_sent_at: now.toISOString()
      })
  }
}

