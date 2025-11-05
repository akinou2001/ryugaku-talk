import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export interface User {
  id: string
  email: string
  name: string
  university?: string
  study_abroad_destination?: string
  major?: string
  bio?: string
  languages: string[]
  contribution_score: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  category: 'question' | 'diary' | 'information'
  tags: string[]
  university?: string
  study_abroad_destination?: string
  major?: string
  author_id: string
  author: User
  likes_count: number
  comments_count: number
  is_pinned: boolean
  is_resolved: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  author: User
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


