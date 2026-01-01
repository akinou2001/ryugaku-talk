'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MapPin, MessageSquare, BookOpen, HelpCircle, AlertCircle, Clock, X } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import Link from 'next/link'
import { useAuth } from '@/components/Providers'
import { useRouter } from 'next/navigation'

// 地図コンポーネントを動的インポート（SSRを無効化）
const MapView = dynamic(() => import('@/components/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
})

export default function MapPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'question' | 'diary' | 'chat'>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, selectedUrgency, selectedCountry])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, name, icon_url, account_type, verification_status, organization_name)
        `)
        .is('community_id', null) // コミュニティ限定投稿は除外
        .in('category', ['question', 'diary', 'chat'])

      // カテゴリフィルター
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      // 緊急度フィルター（質問の場合のみ）
      if (selectedCategory === 'question' || selectedCategory === 'all') {
        if (selectedUrgency !== 'all') {
          query = query.eq('urgency_level', selectedUrgency)
        }
      }

      // 国フィルター
      if (selectedCountry !== 'all') {
        query = query.eq('study_abroad_destination', selectedCountry)
      }

      query = query.order('created_at', { ascending: false }).limit(100)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'normal': return 'bg-blue-500'
      case 'low': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return '緊急'
      case 'high': return '高'
      case 'normal': return '通常'
      case 'low': return '低'
      default: return '未設定'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <HelpCircle className="h-5 w-5" />
      case 'diary': return <BookOpen className="h-5 w-5" />
      case 'chat': return <MessageSquare className="h-5 w-5" />
      default: return <MessageSquare className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-gradient-to-r from-blue-500 to-blue-600'
      case 'diary': return 'bg-gradient-to-r from-green-500 to-green-600'
      case 'chat': return 'bg-gradient-to-r from-purple-500 to-purple-600'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question': return '❓ 質問'
      case 'diary': return '📝 日記'
      case 'chat': return '💬 つぶやき'
      default: return category
    }
  }

  const handleMarkerClick = (post: Post) => {
    setSelectedPost(post)
  }

  // 国ごとに投稿をグループ化（フィルター用）
  const postsByCountry = posts.reduce((acc, post) => {
    const country = post.study_abroad_destination || '不明'
    if (!acc[country]) {
      acc[country] = []
    }
    acc[country].push(post)
    return acc
  }, {} as Record<string, Post[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            眺める
          </h1>
          <p className="text-gray-600">世界中のユーザーの活動（日記やつぶやき）や「困りごと（質問）」を視覚的に発見</p>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* カテゴリフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="question">質問</option>
                <option value="diary">日記</option>
                <option value="chat">つぶやき</option>
              </select>
            </div>

            {/* 緊急度フィルター（質問の場合のみ表示） */}
            {(selectedCategory === 'question' || selectedCategory === 'all') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  緊急度
                </label>
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="urgent">緊急</option>
                  <option value="high">高</option>
                  <option value="normal">通常</option>
                  <option value="low">低</option>
                </select>
              </div>
            )}

            {/* 国フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                国・地域
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                {Object.keys(postsByCountry).sort().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 地図表示 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">読み込み中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">投稿が見つかりません</p>
            </div>
          ) : (
            <MapView 
              posts={posts} 
              onMarkerClick={handleMarkerClick}
              selectedPostId={selectedPost?.id}
            />
          )}
        </div>

        {/* 選択された投稿の詳細パネル */}
        {selectedPost && (
          <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">投稿詳細</h3>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <Link
                href={`/posts/${selectedPost.id}`}
                className="block group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${getCategoryColor(selectedPost.category)}`}>
                      {getCategoryLabel(selectedPost.category)}
                    </span>
                    {selectedPost.category === 'question' && selectedPost.urgency_level && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getUrgencyColor(selectedPost.urgency_level)}`}>
                        {getUrgencyLabel(selectedPost.urgency_level)}
                      </span>
                    )}
                  </div>
                  {selectedPost.category !== 'chat' && (
                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {selectedPost.title}
                    </h4>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-4">
                    {selectedPost.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <UserAvatar 
                        iconUrl={selectedPost.author?.icon_url} 
                        name={selectedPost.author?.name} 
                        size="sm"
                      />
                      <span>{selectedPost.author?.name || '匿名'}</span>
                    </div>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(selectedPost.created_at).toLocaleDateString('ja-JP')}</span>
                    </span>
                  </div>
                  {selectedPost.study_abroad_destination && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedPost.study_abroad_destination}</span>
                    </div>
                  )}
                  <div className="pt-3">
                    <span className="text-primary-600 hover:text-primary-800 font-semibold text-sm">
                      詳細を見る →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

