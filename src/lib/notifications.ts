import { supabase } from './supabase'

export type NotificationType = 
  | 'announcement' 
  | 'community_event' 
  | 'community_quest' 
  | 'urgent_question' 
  | 'safety_check' 
  | 'dm' 
  | 'comment' 
  | 'like'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  content?: string
  linkUrl?: string
}

/**
 * 通知を作成する
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        link_url: params.linkUrl
      })

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to create notification:', error)
    // 通知作成の失敗はアプリの動作を妨げないようにする
  }
}

/**
 * 複数のユーザーに通知を作成する
 */
export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  content?: string,
  linkUrl?: string
) {
  if (userIds.length === 0) return

  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      content,
      link_url: linkUrl
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('Error creating notifications:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to create notifications:', error)
    // 通知作成の失敗はアプリの動作を妨げないようにする
  }
}

/**
 * コメント通知を作成
 */
export async function notifyComment(
  postAuthorId: string,
  commentAuthorName: string,
  postTitle: string,
  postId: string
) {
  // 自分の投稿へのコメントは通知しない
  // （実際の実装では、コメント作成時にpostAuthorIdを取得する必要がある）
  await createNotification({
    userId: postAuthorId,
    type: 'comment',
    title: `${commentAuthorName}さんがコメントしました`,
    content: `「${postTitle}」にコメントがつきました`,
    linkUrl: `/posts/${postId}`
  })
}

/**
 * DM通知を作成
 */
export async function notifyDM(
  receiverId: string,
  senderName: string,
  messagePreview: string
) {
  await createNotification({
    userId: receiverId,
    type: 'dm',
    title: `${senderName}さんからメッセージ`,
    content: messagePreview,
    linkUrl: `/chat/${receiverId}`
  })
}

/**
 * 緊急質問通知を作成（コミュニティメンバーに送信）
 */
export async function notifyUrgentQuestion(
  communityId: string,
  questionTitle: string,
  questionId: string
) {
  try {
    // コミュニティメンバーを取得
    const { data: members, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)

    if (error) throw error

    const userIds = (members || []).map(m => m.user_id)

    await createNotificationsForUsers(
      userIds,
      'urgent_question',
      '緊急の質問が投稿されました',
      questionTitle,
      `/posts/${questionId}`
    )
  } catch (error) {
    console.error('Error notifying urgent question:', error)
  }
}

/**
 * コミュニティイベント通知を作成
 */
export async function notifyCommunityEvent(
  communityId: string,
  eventTitle: string,
  eventId: string
) {
  try {
    const { data: members, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)

    if (error) throw error

    const userIds = (members || []).map(m => m.user_id)

    await createNotificationsForUsers(
      userIds,
      'community_event',
      '新しいイベントが作成されました',
      eventTitle,
      `/communities/${communityId}/events/${eventId}`
    )
  } catch (error) {
    console.error('Error notifying community event:', error)
  }
}

/**
 * コミュニティクエスト通知を作成
 */
export async function notifyCommunityQuest(
  communityId: string,
  questTitle: string,
  questId: string
) {
  try {
    const { data: members, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)

    if (error) throw error

    const userIds = (members || []).map(m => m.user_id)

    await createNotificationsForUsers(
      userIds,
      'community_quest',
      '新しいクエストが作成されました',
      questTitle,
      `/communities/${communityId}/quests/${questId}`
    )
  } catch (error) {
    console.error('Error notifying community quest:', error)
  }
}

