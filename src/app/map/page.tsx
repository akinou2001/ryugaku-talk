'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MapPin, BookOpen, HelpCircle, Clock, X, MessageCircle, Filter, Search, List } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import Link from 'next/link'
import { useAuth } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import type { UserPostData } from '@/lib/mapUtils'

// 地図コンポーネントを動的インポート（SSRを無効化）
const MapView = dynamic(() => import('@/components/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
})

const Globe3D = dynamic(() => import('@/components/GlobeOptionA').then(mod => ({ default: mod.GlobeOptionA })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] min-h-[400px] bg-white rounded-2xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
    </div>
  )
})

const MapListView = dynamic(() => import('@/components/MapListView').then(mod => ({ default: mod.MapListView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
})

export default function MapPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'question' | 'diary' | 'chat'>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'normal' | 'urgent'>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserPostData | null>(null)
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'list'>('2D')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, selectedUrgency, selectedCountry, selectedCommunity])

  const fetchPosts = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, name, icon_url, account_type, verification_status, organization_name, study_abroad_destination, languages, university_id, study_abroad_university_id)
        `)
        .is('community_id', null)
        .in('category', ['question', 'diary', 'chat'])

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      if (selectedCategory === 'question' || selectedCategory === 'all') {
        if (selectedUrgency !== 'all') {
          query = query.eq('urgency_level', selectedUrgency)
        }
      }

      query = query.order('created_at', { ascending: false }).limit(500)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching posts:', error)
        setAllPosts([])
        return
      }

      // マップ表示対象:
      // 1) 現役留学生 → プロフィールに留学先があれば全投稿を表示
      // 2) 準備中・帰国済み → 投稿自体に留学先 or 大学が紐づいていれば表示
      const filteredPosts = (data || []).filter(post => {
        const authorDest = post.author?.study_abroad_destination
        const languages = post.author?.languages || []
        const isCurrentStudent = languages.some((lang: string) => lang === 'status:current')

        if (isCurrentStudent && authorDest) return true

        const postDest = post.study_abroad_destination
        const postUniId = post.university_id
        if (postDest || postUniId) {
          return !!(authorDest || postDest)
        }

        return false
      })

      setAllPosts(filteredPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 投稿の優先度を計算
  function getPostPriority(post: Post, now: Date): number {
    const postDate = new Date(post.created_at)
    const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
    const category = post.category || 'question'

    if (category === 'question' && !post.is_resolved) {
      return 100 + (post.urgency_level === 'urgent' ? 2 : 1)
    }
    if (category === 'diary' && hoursSincePost <= 24) return 50
    if (category === 'chat' && hoursSincePost <= 24) return 30
    return 10
  }

  // ユーザーごとにグループ化し、表示優先順位に基づいて表示する投稿を決定
  const userPostData = useMemo(() => {
    const userMap = new Map<string, UserPostData>()

    allPosts.forEach(post => {
      if (!post.author) return
      const userId = post.author.id

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

      const now = new Date()
      const currentPriority = getPostPriority(userData.displayPost, now)
      const newPriority = getPostPriority(post, now)

      if (newPriority > currentPriority) {
        userData.displayPost = post
        userData.displayType = (post.category || 'question') as 'question' | 'diary' | 'chat' | 'normal'
      }
    })

    return Array.from(userMap.values())
  }, [allPosts])

  // フィルタリング後のユーザーデータ
  const filteredUserData = useMemo(() => {
    let filtered = userPostData

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(data => data.displayType === selectedCategory)
    }

    if (selectedCategory === 'question' || selectedCategory === 'all') {
      if (selectedUrgency !== 'all') {
        filtered = filtered.filter(data =>
          data.displayType === 'question' &&
          data.displayPost.urgency_level === selectedUrgency
        )
      }
    }

    if (selectedCountry !== 'all') {
      filtered = filtered.filter(data =>
        data.user.study_abroad_destination === selectedCountry
      )
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(data => {
        const post = data.displayPost
        const user = data.user
        return (
          (post.title || '').toLowerCase().includes(searchLower) ||
          (post.content || '').toLowerCase().includes(searchLower) ||
          (user.name || '').toLowerCase().includes(searchLower) ||
          (user.study_abroad_destination || '').toLowerCase().includes(searchLower)
        )
      })
    }

    return filtered
  }, [userPostData, selectedCategory, selectedUrgency, selectedCountry, searchTerm])

  const displayPosts = useMemo(() => {
    return filteredUserData.map(data => data.displayPost)
  }, [filteredUserData])

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
    router.push(`/posts/${post.id}`)
  }

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-500'
      case 'normal': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return '緊急'
      case 'normal': return '通常'
      default: return '未設定'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">マップ</h1>
            <p className="text-sm text-gray-600">世界で挑戦している現役留学生の「今」をチェックしよう</p>
          </div>
        </div>

        {/* 検索バー */}
        <div className="mb-3">
          <form onSubmit={(e) => e.preventDefault()} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="投稿、ユーザー名、国で検索..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                aria-label="検索をクリア"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            )}
          </form>
        </div>

        {/* フィルター表示/非表示ボタンとビュー切り替え */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
          >
            {showFilters ? (
              <>
                <X className="h-4 w-4" />
                <span>フィルターを隠す</span>
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                <span>フィルターを表示</span>
                {(selectedCategory !== 'all' || selectedUrgency !== 'all' || selectedCountry !== 'all') && (
                  <span className="ml-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                    {[selectedCategory !== 'all' ? 1 : 0, selectedUrgency !== 'all' ? 1 : 0, selectedCountry !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </>
            )}
          </button>
          {/* ビュー切り替えボタン */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center space-x-1 bg-white rounded-xl p-1 shadow-md border border-gray-200">
              <button
                onClick={() => setViewMode('2D')}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${viewMode === '2D' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >2D</button>
              <button
                onClick={() => setViewMode('3D')}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${viewMode === '3D' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >3D</button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="h-3.5 w-3.5" />
                リスト
              </button>
            </div>
          </div>
        </div>

        {/* 絞り込みフィルター */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投稿タイプ</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="all">すべて</option>
                  <option value="question">質問</option>
                  <option value="diary">日記</option>
                  <option value="chat">つぶやき</option>
                </select>
              </div>
              {(selectedCategory === 'question' || selectedCategory === 'all') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">緊急度</label>
                  <select value={selectedUrgency} onChange={(e) => setSelectedUrgency(e.target.value as any)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="all">すべて</option>
                    <option value="normal">通常</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">国・地域</label>
                <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="all">すべて</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所属コミュニティ</label>
                <select value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled>
                  <option value="all">すべて</option>
                  <option value="coming-soon">準備中</option>
                </select>
              </div>
            </div>
            {(selectedCategory !== 'all' || selectedUrgency !== 'all' || selectedCountry !== 'all') && (
              <div className="mt-4">
                <button onClick={() => { setSelectedCategory('all'); setSelectedUrgency('all'); setSelectedCountry('all') }}
                  className="text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors">
                  フィルターをリセット
                </button>
              </div>
            )}
          </div>
        )}

        {/* フィルター簡易表示 */}
        {!showFilters && (selectedCategory !== 'all' || selectedUrgency !== 'all' || selectedCountry !== 'all') && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                投稿タイプ: {selectedCategory === 'question' ? '質問' : selectedCategory === 'diary' ? '日記' : 'つぶやき'}
              </span>
            )}
            {selectedUrgency !== 'all' && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                緊急度: {selectedUrgency === 'urgent' ? '緊急' : '通常'}
              </span>
            )}
            {selectedCountry !== 'all' && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                国: {selectedCountry}
              </span>
            )}
          </div>
        )}

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
            {viewMode === '2D' ? (
              <MapView
                posts={displayPosts}
                userPostData={filteredUserData}
                onMarkerClick={handleMarkerClick}
                selectedPostId={selectedUser?.displayPost.id}
              />
            ) : viewMode === '3D' ? (
              <Globe3D
                posts={displayPosts}
                userPostData={filteredUserData}
                onMarkerClick={handleMarkerClick}
                selectedPostId={selectedUser?.displayPost.id}
              />
            ) : (
              <MapListView
                posts={displayPosts}
                userPostData={filteredUserData}
                onMarkerClick={handleMarkerClick}
                selectedPostId={selectedUser?.displayPost.id}
              />
            )}
            {!loading && displayPosts.length === 0 && (
              <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">投稿が見つかりません</p>
                  <p className="text-gray-400 text-sm mt-2">地図上に表示する投稿がありません</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 選択されたユーザーの簡易カード */}
        {selectedUser && (
          <div className="fixed bottom-6 left-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">ユーザー情報</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar iconUrl={selectedUser.user.icon_url} name={selectedUser.user.name} size="lg" />
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
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">最新の活動</h5>
                  <Link href={`/posts/${selectedUser.displayPost.id}`} className="block group">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          selectedUser.displayType === 'question' ? 'bg-blue-500' :
                          selectedUser.displayType === 'diary' ? 'bg-green-500' :
                          selectedUser.displayType === 'chat' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}>
                          {selectedUser.displayType === 'question' && <HelpCircle className="h-3 w-3 text-white inline mr-1" />}
                          {selectedUser.displayType === 'diary' && <BookOpen className="h-3 w-3 text-white inline mr-1" />}
                          {selectedUser.displayType === 'chat' && <MessageCircle className="h-3 w-3 text-white inline mr-1" />}
                          {selectedUser.displayType === 'question' ? '質問' : selectedUser.displayType === 'diary' ? '日記' : selectedUser.displayType === 'chat' ? 'つぶやき' : '投稿'}
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
                      <p className="text-xs text-gray-600 line-clamp-3">{selectedUser.displayPost.content}</p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(selectedUser.displayPost.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <Link href={`/profile/${selectedUser.user.id}`} className="text-primary-600 hover:text-primary-800 font-semibold text-sm">
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
