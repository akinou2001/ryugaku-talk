import type { Post, User } from '@/lib/supabase'

// ユーザーごとの投稿データ型（全マップコンポーネント共通）
export interface UserPostData {
  user: User
  posts: Post[]
  displayPost: Post
  displayType: 'question' | 'diary' | 'chat' | 'normal'
}

// マップコンポーネント共通の Props 型
export interface MapComponentProps {
  posts: Post[]
  userPostData?: UserPostData[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

// カテゴリスタイル
export interface CategoryStyle {
  bgColor: string
  borderColor: string
  icon: string
  shape: 'circle' | 'square' | 'diamond'
  ringColor: string
  ringWidth: number
}

// 投稿種別に応じた色とアイコンを取得
export function getCategoryStyle(category: string, urgencyLevel?: string, isResolved?: boolean): CategoryStyle {
  const baseStyles = {
    question: {
      bgColor: '#3B82F6',
      borderColor: '#2563EB',
      icon: '?',
      shape: 'circle' as const,
    },
    diary: {
      bgColor: '#10B981',
      borderColor: '#059669',
      icon: 'D',
      shape: 'square' as const,
    },
    chat: {
      bgColor: '#8B5CF6',
      borderColor: '#7C3AED',
      icon: 'C',
      shape: 'diamond' as const,
    },
  }

  const style = baseStyles[category as keyof typeof baseStyles] || baseStyles.question

  let ringColor = style.borderColor
  let ringWidth = 2
  if (category === 'question' && !isResolved && urgencyLevel) {
    if (urgencyLevel === 'urgent') {
      ringColor = '#EF4444'
      ringWidth = 4
    } else {
      ringColor = '#3B82F6'
      ringWidth = 2
    }
  }

  return { ...style, ringColor, ringWidth }
}

// カテゴリ名ラベル
export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'question': return '質問'
    case 'diary': return '日記'
    case 'chat': return 'つぶやき'
    default: return '投稿'
  }
}

// カテゴリ色（シンプル版）
export function getCategoryColor(category: string): string {
  switch (category) {
    case 'question': return '#3B82F6'
    case 'diary': return '#10B981'
    case 'chat': return '#8B5CF6'
    default: return '#6B7280'
  }
}

// 24時間以内かどうかを判定
export function isWithin24Hours(createdAt: string): boolean {
  const now = new Date()
  const postDate = new Date(createdAt)
  const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
  return hoursSincePost <= 24
}

// 相対時刻フォーマット
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`
  return date.toLocaleDateString('ja-JP')
}

// 同じ位置に複数の投稿がある場合のオフセット計算
export function getOffsetCoordinates(
  baseCoords: { lat: number; lng: number },
  index: number,
  total: number
): { lat: number; lng: number } {
  if (total === 1) return baseCoords

  const angle = (index / total) * Math.PI * 2
  const radius = 0.3
  const latOffset = radius * Math.cos(angle)
  const lngOffset = radius * Math.sin(angle) / Math.cos(baseCoords.lat * Math.PI / 180)

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
  }
}
