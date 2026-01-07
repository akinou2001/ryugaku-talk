'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { HelpCircle, X, RotateCcw, ZoomIn, ZoomOut, Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Globe3DCanvasを動的インポート（SSRを無効化）
const Globe3DCanvas = dynamic(() => import('@/components/Globe3DCanvas').then(mod => ({ default: mod.Globe3DCanvas })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gradient-to-br from-blue-400 via-cyan-400 to-emerald-400 rounded-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-emerald-500/20 animate-pulse"></div>
      <div className="text-center relative z-10">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-white/20"></div>
        </div>
        <p className="text-white mt-6 font-medium text-lg">3D地球を読み込み中...</p>
        <p className="text-white/80 mt-2 text-sm">少しお待ちください</p>
      </div>
    </div>
  )
})

import type { Post, User } from '@/lib/supabase'

interface UserPostData {
  user: User
  posts: Post[]
  displayPost: Post
  displayType: 'question' | 'diary' | 'chat' | 'normal'
}

interface Globe3DProps {
  posts: Post[]
  userPostData?: UserPostData[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

export function Globe3D({ posts, userPostData, onMarkerClick, selectedPostId }: Globe3DProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [helpDismissed, setHelpDismissed] = useState(false)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)
  
  console.log('Globe3D component rendered with posts:', posts.length)

  // 投稿種別に応じた色を取得
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return '#3B82F6'
      case 'diary': return '#10B981'
      case 'chat': return '#8B5CF6'
      default: return '#6B7280'
    }
  }

  // 投稿種別に応じたラベルを取得
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question': return '質問'
      case 'diary': return '日記'
      case 'chat': return 'つぶやき'
      default: return '投稿'
    }
  }

  // 日時をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'たった今'
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
    return date.toLocaleDateString('ja-JP')
  }
  
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 via-cyan-400 to-emerald-400 shadow-2xl border-2 border-white/20">
      {/* 背景グラデーションアニメーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-emerald-500/30 animate-pulse"></div>
      
      {/* 左上の注意書き */}
      <div className="absolute top-4 left-4 z-10 bg-amber-50/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border-2 border-amber-300/50 max-w-[220px] sm:max-w-[240px] right-[60px]">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            3Dマップ機能は準備中です。現在モックを表示しています。
          </p>
        </div>
      </div>
      
      {/* ヘルプボタン */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-lg hover:bg-white transition-all hover:scale-110 border border-white/20"
        title="操作方法を見る"
      >
        <HelpCircle className="h-5 w-5 text-gray-700" />
      </button>

      {/* 操作説明パネル */}
      {showHelp && (
        <div className="absolute top-16 right-4 z-10 bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-5 max-w-xs border border-white/20 animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              操作方法
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RotateCcw className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">ドラッグ</div>
                <div className="text-xs text-gray-600">地球を回転</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ZoomIn className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">ホイール</div>
                <div className="text-xs text-gray-600">ズームイン/アウト</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs font-bold">!</span>
              </div>
              <div>
                <div className="font-semibold">ピンクリック</div>
                <div className="text-xs text-gray-600">投稿詳細へ</div>
              </div>
            </div>
          </div>
          {!helpDismissed && (
            <button
              onClick={() => {
                setHelpDismissed(true)
                setShowHelp(false)
              }}
              className="mt-4 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              次回から非表示にする
            </button>
          )}
        </div>
      )}

      {/* 3Dキャンバス */}
      <div className="relative z-0 h-full">
        <div className="absolute top-0 left-0 w-full h-full">
          <Globe3DCanvas
            posts={posts}
            userPostData={userPostData}
            onMarkerClick={onMarkerClick}
            selectedPostId={selectedPostId}
          />
        </div>
      </div>

      {/* ライブチャット風の投稿パネル */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 ${
        isPanelExpanded ? 'h-[200px]' : 'h-[60px]'
      }`}>
        <div className="h-full bg-gradient-to-t from-white/95 via-white/90 to-white/85 backdrop-blur-xl border-t-2 border-white/30 shadow-2xl rounded-t-3xl">
          {/* パネルヘッダー */}
          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/20 transition-colors rounded-t-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-bold text-gray-900">投稿一覧</h3>
              <span className="text-xs text-gray-600 bg-gray-200/50 px-2 py-1 rounded-full">
                {posts.length}件
              </span>
            </div>
            {isPanelExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* 投稿リスト（展開時のみ表示） */}
          {isPanelExpanded && (
            <div className="h-[140px] overflow-y-auto px-4 pb-4 space-y-2">
              {posts.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  投稿がありません
                </div>
              ) : (
                posts.map((post) => {
                  const categoryColor = getCategoryColor(post.category || 'question')
                  const categoryLabel = getCategoryLabel(post.category || 'question')
                  const avatarUrl = post.author?.icon_url
                  const authorName = post.author?.name || '匿名'
                  const initials = authorName.charAt(0).toUpperCase()
                  const title = post.category === 'chat' 
                    ? post.content?.substring(0, 30) + (post.content && post.content.length > 30 ? '...' : '')
                    : post.title || 'タイトルなし'

                  return (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block group"
                      onClick={(e) => {
                        e.preventDefault()
                        if (onMarkerClick) {
                          onMarkerClick(post)
                        } else {
                          window.location.href = `/posts/${post.id}`
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                        {/* アバター */}
                        <div className="flex-shrink-0">
                          {avatarUrl ? (
                            <div className="relative">
                              <img
                                src={avatarUrl}
                                alt={authorName}
                                className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                  const next = (e.target as HTMLElement).nextElementSibling as HTMLElement
                                  if (next) next.style.display = 'flex'
                                }}
                              />
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: categoryColor }}
                            >
                              {initials}
                            </div>
                          )}
                        </div>

                        {/* コンテンツ */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-bold text-white px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryColor }}
                            >
                              {categoryLabel}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                            {title}
                          </p>
                        </div>

                        {/* アイコン */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronDown className="h-4 w-4 text-gray-600 rotate-[-90deg]" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

