import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 環境変数の検証
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // サーバーサイドでのエラー
    console.error('Supabase環境変数が設定されていません')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定')
  } else {
    // クライアントサイドでの警告
    console.warn('Supabase環境変数が設定されていません')
  }
}

// 空の文字列でもクライアントを作成（エラーを防ぐため）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// 型定義
export type AccountType = 'individual' | 'educational' | 'company' | 'government'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export interface User {
  id: string
  email: string
  name: string
  account_type: AccountType
  university?: string
  study_abroad_destination?: string
  major?: string
  bio?: string
  languages: string[]
  contribution_score: number
  // 組織アカウント用フィールド
  organization_name?: string
  organization_type?: string
  organization_url?: string
  verification_status: VerificationStatus
  verification_documents?: string
  contact_person_name?: string
  contact_person_email?: string
  contact_person_phone?: string
  // 管理者・アカウント管理用フィールド
  is_admin: boolean
  is_active: boolean
  suspended_until?: string
  suspension_reason?: string
  // アイコン画像
  icon_url?: string
  created_at: string
  updated_at: string
}

export interface OrganizationVerificationRequest {
  id: string
  profile_id: string
  account_type: 'educational' | 'company' | 'government'
  organization_name: string
  organization_type?: string
  organization_url?: string
  contact_person_name: string
  contact_person_email: string
  contact_person_phone?: string
  verification_documents?: string
  request_reason?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
  profile?: User // 後方互換性のため残す
  profiles?: User // profile_id外部キーで取得したプロフィール
}

export interface Post {
  id: string
  title: string
  content: string
  category: 'question' | 'diary' | 'chat' | 'information' | 'official' // 'information'は後方互換性のため残す
  tags: string[]
  university?: string
  study_abroad_destination?: string
  major?: string
  author_id: string
  author?: User
  likes_count: number
  comments_count: number
  is_pinned: boolean
  is_resolved: boolean
  is_official: boolean
  official_category?: string
  community_id?: string // コミュニティ限定投稿用
  post_type?: 'announcement' | 'event' | 'quest' | 'normal' // コミュニティ限定投稿の種別
  attachments?: Array<{ url: string; filename: string; type: string }> // ファイル添付（JSONB形式）
  image_url?: string // 写真1枚用
  urgency_level?: 'low' | 'normal' | 'high' | 'urgent' // 質問の緊急度
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  author?: User
  likes_count: number
  is_solution: boolean
  created_at: string
  updated_at: string
}

export interface Like {
  id: string
  user_id: string
  post_id?: string
  comment_id?: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

// コミュニティ機能の型定義
export type CommunityVisibility = 'public' | 'private'
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'banned'
export type MemberRole = 'member' | 'moderator' | 'admin'
export type RoomMemberPermission = 'auto' | 'request'
export type EventParticipantStatus = 'registered' | 'attended' | 'cancelled'

export interface Community {
  id: string
  name: string
  description?: string
  cover_image_url?: string
  icon_url?: string
  owner_id: string
  owner?: User
  visibility: CommunityVisibility
  is_public?: boolean // 誰でも参加可能か、承認制か
  community_type?: 'guild' | 'official' // ギルド or 公式コミュニティ
  created_at: string
  updated_at: string
  // 集計情報（クエリ時に追加）
  member_count?: number
  is_member?: boolean
  member_status?: MemberStatus
  member_role?: MemberRole
}

export interface CommunityMember {
  id: string
  community_id: string
  community?: Community
  user_id: string
  user?: User
  status: MemberStatus
  role: MemberRole
  joined_at?: string
  created_at: string
  updated_at: string
}

export interface CommunityRoom {
  id: string
  community_id: string
  community?: Community
  name: string
  description?: string
  created_by?: string
  creator?: User
  member_permission: RoomMemberPermission
  created_at: string
  updated_at: string
  // 集計情報
  message_count?: number
  is_joined?: boolean
}

export interface CommunityRoomMessage {
  id: string
  room_id: string
  room?: CommunityRoom
  sender_id: string
  sender?: User
  content: string
  created_at: string
}

export interface Announcement {
  id: string
  community_id: string
  community?: Community
  title: string
  content: string
  image_url?: string
  attachment_url?: string
  attachment_filename?: string
  created_by?: string
  creator?: User
  created_at: string
  updated_at: string
}

export interface FAQ {
  id: string
  community_id: string
  community?: Community
  question: string
  answer: string
  category?: string
  order_index: number
  created_by?: string
  creator?: User
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  community_id: string
  community?: Community
  title: string
  description: string
  event_date: string
  location?: string
  online_url?: string
  registration_deadline?: string
  deadline?: string // 締切日時（registration_deadlineの別名）
  capacity?: number
  attachments?: Array<{ url: string; filename: string; type: string }> // ファイル添付（JSONB形式）
  created_by?: string
  creator?: User
  created_at: string
  updated_at: string
  // 集計情報
  participant_count?: number
  is_registered?: boolean
  registration_status?: EventParticipantStatus
}

export interface EventParticipant {
  id: string
  event_id: string
  event?: Event
  user_id: string
  user?: User
  status: EventParticipantStatus
  registered_at: string
}

// クエスト機能の型定義
export type QuestStatus = 'active' | 'completed' | 'cancelled'
export type QuestCompletionStatus = 'pending' | 'approved' | 'rejected'

export interface Quest {
  id: string
  community_id: string
  community?: Community
  title: string
  description?: string
  created_by: string
  creator?: User
  creator_profile?: any // 作成者のプロフィール情報（スナップショット）
  status: QuestStatus
  reward_amount: number
  deadline?: string // クエストの期限
  created_at: string
  updated_at: string
  // 集計情報
  completion_count?: number
  user_completion_status?: QuestCompletionStatus
}

export interface QuestCompletion {
  id: string
  quest_id: string
  quest?: Quest
  user_id: string
  user?: User
  completed_by: string // クリア判定を行ったユーザー（通常はクエスト作成者）
  completed_by_user?: User
  status: QuestCompletionStatus
  proof_text?: string
  proof_url?: string
  reward_given: boolean
  created_at: string
  updated_at: string
}

// スコアシステムの型定義（将来の拡張用に保持、現在は使用しない）
export interface UserScore {
  id: string
  user_id: string
  user?: User
  created_at: string
  updated_at: string
}

export interface CandleSend {
  id: string
  sender_id: string
  sender?: User
  receiver_id: string
  receiver?: User
  message_id?: string
  message?: Message
  sent_at: string
  week_start: string // 週の開始日（月曜日）
}

