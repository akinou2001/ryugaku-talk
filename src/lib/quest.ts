import { supabase } from './supabase'
import type { Quest, QuestCompletion, QuestStatus, QuestCompletionStatus } from './supabase'

/**
 * コミュニティのクエスト一覧を取得
 */
export async function getQuests(communityId: string, userId?: string) {
  const { data, error } = await supabase
    .from('quests')
    .select(`
      *,
      community:communities(id, name, community_type),
      creator:profiles(id, name, icon_url)
    `)
    .eq('community_id', communityId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

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
 * クエストを作成
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
 * クエストを削除
 */
export async function deleteQuest(questId: string) {
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
    throw new Error('クエストの作成者のみ削除できます')
  }

  const { error } = await supabase
    .from('quests')
    .delete()
    .eq('id', questId)

  if (error) {
    console.error('Error deleting quest:', error)
    throw error
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
      user:profiles(id, name)
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
      user:profiles(id, name)
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
      user:profiles(id, name),
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
  const { data, error } = await supabase
    .from('user_scores')
    .select(`
      *,
      user:profiles(id, name)
    `)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116は「レコードが見つからない」エラー
    console.error('Error fetching user score:', error)
    throw error
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

