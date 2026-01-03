'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Post, User } from '@/lib/supabase'
import { MapPin, MessageSquare, BookOpen, HelpCircle, Clock, X, Users } from 'lucide-react'
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

// ユーザーごとの投稿データ型
interface UserPostData {
  user: User
  posts: Post[]
  displayPost: Post // 表示する投稿（優先順位に基づく）
  displayType: 'question' | 'diary' | 'chat' | 'normal'
}

export default function MapPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'question' | 'diary' | 'chat'>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserPostData | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, selectedUrgency, selectedCountry, selectedCommunity])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      // 投稿を取得（位置情報が設定されている投稿のみ）
      // まずは投稿から直接取得し、位置情報でフィルタリング
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, name, icon_url, account_type, verification_status, organization_name, study_abroad_destination, student_status)
        `)
        .is('community_id', null) // コミュニティ限定投稿は除外
        .in('category', ['question', 'diary', 'chat'])
        .not('study_abroad_destination', 'is', null) // 位置情報が設定済み

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

      query = query.order('created_at', { ascending: false }).limit(500)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching posts:', error)
        setAllPosts([])
        return
      }

      // 日本を除外し、位置情報が設定されている投稿のみをフィルタリング
      const filteredPosts = (data || []).filter(post => {
        const country = post.study_abroad_destination || post.author?.study_abroad_destination
        return country && country !== '日本' && country !== 'Japan'
      })

      console.log('Fetched posts:', filteredPosts.length, 'posts')
      setAllPosts(filteredPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // ユーザーごとにグループ化し、表示優先順位に基づいて表示する投稿を決定
  const userPostData = useMemo(() => {
    const userMap = new Map<string, UserPostData>()

    allPosts.forEach(post => {
      if (!post.author) return

      const userId = post.author.id
      const now = new Date()
      const postDate = new Date(post.created_at)
      const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: post.author,
          posts: [],
          displayPost: post,
          displayType: post.category as 'question' | 'diary' | 'chat' | 'normal'
        })
      }

      const userData = userMap.get(userId)!
      userData.posts.push(post)

      // 表示優先順位: 未解決の質問 > 24時間以内の日記 > つぶやき > 通常
      const currentPriority = getPostPriority(userData.displayPost, now)
      const newPriority = getPostPriority(post, now)

      if (newPriority > currentPriority) {
        userData.displayPost = post
        userData.displayType = post.category as 'question' | 'diary' | 'chat' | 'normal'
      }
    })

    return Array.from(userMap.values())
  }, [allPosts])

  // 投稿の優先度を計算（数値が大きいほど優先）
  function getPostPriority(post: Post, now: Date): number {
    const postDate = new Date(post.created_at)
    const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)

    // 未解決の質問: 優先度 100 + 緊急度
    if (post.category === 'question' && !post.is_resolved) {
      const urgencyScore = post.urgency_level === 'urgent' ? 4 :
                          post.urgency_level === 'high' ? 3 :
                          post.urgency_level === 'normal' ? 2 : 1
      return 100 + urgencyScore
    }

    // 24時間以内の日記: 優先度 50
    if (post.category === 'diary' && hoursSincePost <= 24) {
      return 50
    }

    // つぶやき: 優先度 30
    if (post.category === 'chat') {
      return 30
    }

    // 通常: 優先度 10
    return 10
  }

  // フィルタリング後のユーザーデータ
  const filteredUserData = useMemo(() => {
    let filtered = userPostData

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(data => data.displayType === selectedCategory)
    }

    // 緊急度フィルター（質問の場合のみ）
    if (selectedCategory === 'question' || selectedCategory === 'all') {
      if (selectedUrgency !== 'all') {
        filtered = filtered.filter(data => 
          data.displayType === 'question' && 
          data.displayPost.urgency_level === selectedUrgency
        )
      }
    }

    // 国フィルター
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(data => 
        data.user.study_abroad_destination === selectedCountry
      )
    }

    return filtered
  }, [userPostData, selectedCategory, selectedUrgency, selectedCountry])

  // 表示用の投稿リスト（MapViewに渡す）
  const displayPosts = useMemo(() => {
    return filteredUserData.map(data => data.displayPost)
  }, [filteredUserData])

  // 国リスト（フィルター用）
  const countries = useMemo(() => {
    const countrySet = new Set<string>()
    userPostData.forEach(data => {
      if (data.user.study_abroad_destination) {
        countrySet.add(data.user.study_abroad_destination)
      }
    })
    return Array.from(countrySet).sort()
  }, [userPostData])

  const handleMarkerClick = (post: Post) => {
    const userData = userPostData.find(data => data.displayPost.id === post.id)
    if (userData) {
      setSelectedUser(userData)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            眺める
          </h1>
          <p className="text-gray-600">世界で挑戦している留学生の「今」を眺めて、感じて、助け合うための地図</p>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* カテゴリフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                投稿タイプ
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
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* 所属コミュニティフィルター（将来実装） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属コミュニティ
              </label>
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled
              >
                <option value="all">すべて</option>
                <option value="coming-soon">準備中</option>
              </select>
            </div>
          </div>
        </div>

        {/* 地図表示 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">読み込み中...</p>
                </div>
              </div>
            )}
            <MapView 
              posts={displayPosts}
              userPostData={filteredUserData}
              onMarkerClick={handleMarkerClick}
              selectedPostId={selectedUser?.displayPost.id}
            />
            {!loading && displayPosts.length === 0 && (
              <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">投稿が見つかりません</p>
                  <p className="text-gray-400 text-sm mt-2">地図上に表示する投稿がありません</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 選択されたユーザーの簡易カード */}
        {selectedUser && (
          <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">ユーザー情報</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* ユーザー情報 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    iconUrl={selectedUser.user.icon_url} 
                    name={selectedUser.user.name} 
                    size="lg"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedUser.user.name}</h4>
                    {selectedUser.user.study_abroad_destination && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedUser.user.study_abroad_destination}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 最新投稿（表示タイプ別） */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">最新の活動</h5>
                  <Link
                    href={`/posts/${selectedUser.displayPost.id}`}
                    className="block group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          selectedUser.displayType === 'question' ? 'bg-blue-500' :
                          selectedUser.displayType === 'diary' ? 'bg-green-500' :
                          selectedUser.displayType === 'chat' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}>
                          {selectedUser.displayType === 'question' ? '❓ 質問' :
                           selectedUser.displayType === 'diary' ? '📝 日記' :
                           selectedUser.displayType === 'chat' ? '💬 つぶやき' : '投稿'}
                        </span>
                        {selectedUser.displayType === 'question' && selectedUser.displayPost.urgency_level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getUrgencyColor(selectedUser.displayPost.urgency_level)}`}>
                            {getUrgencyLabel(selectedUser.displayPost.urgency_level)}
                          </span>
                        )}
                      </div>
                      {selectedUser.displayType !== 'chat' && (
                        <h6 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {selectedUser.displayPost.title}
                        </h6>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {selectedUser.displayPost.content}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(selectedUser.displayPost.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* プロフィールへのリンク */}
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    href={`/profile/${selectedUser.user.id}`}
                    className="text-primary-600 hover:text-primary-800 font-semibold text-sm"
                  >
                    プロフィールを見る →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
