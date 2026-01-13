'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { BookOpen, MessageSquare, Clock, Search, Filter, Plus, Calendar, MapPin, GraduationCap, Heart, X } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { AccountBadge } from '@/components/AccountBadge'
import { searchUniversities, type University } from '@/lib/universities'

export default function Diary() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null)
  const [selectedUniversityData, setSelectedUniversityData] = useState<University | null>(null)
  const [sortBy, setSortBy] = useState('newest')
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [universitySearch, setUniversitySearch] = useState('')
  const [universitySearchResults, setUniversitySearchResults] = useState<University[]>([])
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchFilterOptions = useCallback(async () => {
    try {
      // 留学日記の利用可能な国を取得
      const { data: countryData, error: countryError } = await supabase
        .from('posts')
        .select('study_abroad_destination')
        .eq('category', 'diary')
        .not('study_abroad_destination', 'is', null)

      if (countryError) {
        console.error('Error fetching countries:', countryError)
      }

      const countries = Array.from(new Set(
        (countryData || []).map(item => item.study_abroad_destination).filter(Boolean) as string[]
      )).sort()

      setAvailableCountries(countries)
    } catch (error) {
      console.error('Error fetching filter options:', error)
      setAvailableCountries([])
    }
  }, [])

  const fetchDiaryPosts = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name, university, study_abroad_destination, icon_url, account_type, verification_status, organization_name)
        `)
        .is('community_id', null) // コミュニティ限定投稿は除外
        .eq('category', 'diary')

      if (selectedCountry !== 'all') {
        query = query.eq('study_abroad_destination', selectedCountry)
      }

      if (selectedUniversityId) {
        query = query.eq('university_id', selectedUniversityId)
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      }

      // 並び替え
      if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: sortBy === 'oldest' })
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching diary posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching diary posts:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCountry, selectedUniversityId, sortBy, searchTerm])

  // フィルターオプションは初回のみ取得
  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // 投稿データはフィルターや検索条件が変更されたときに取得
  useEffect(() => {
    fetchDiaryPosts()
  }, [fetchDiaryPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // searchTermが変更されるとuseEffectで自動的にfetchDiaryPostsが実行される
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '日付不明'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '日付不明'
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'たった今'
      if (diffInHours < 24) return `${diffInHours}時間前`
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
      return date.toLocaleDateString('ja-JP')
    } catch (error) {
      console.error('Error formatting date:', error)
      return '日付不明'
    }
  }

  // スケルトンローディング
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="flex items-center justify-between mt-6">
        <div className="h-8 bg-gray-200 rounded-full w-32"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-10 w-10 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                留学日記
              </h1>
            </div>
            <p className="text-sm text-gray-600">留学の思い出を日記に残しましょう</p>
          </div>
          <Link href="/posts/new?category=diary" className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            日記を書く
          </Link>
        </div>

        {/* 検索バー */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="日記を検索..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              検索
            </button>
          </form>
        </div>

        {/* フィルター表示/非表示ボタン */}
        <div className="mb-4">
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
                {(selectedCountry !== 'all' || selectedUniversityId !== null || sortBy !== 'newest') && (
                  <span className="ml-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                    {[
                      selectedCountry !== 'all' ? 1 : 0,
                      selectedUniversityId !== null ? 1 : 0,
                      sortBy !== 'newest' ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* 絞り込みフィルター */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="all">すべての国</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 relative">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={universitySearch}
                    onChange={async (e) => {
                      const query = e.target.value
                      setUniversitySearch(query)
                      if (query.length >= 2) {
                        const { data } = await searchUniversities({ query, limit: 10 })
                        setUniversitySearchResults(data || [])
                        setShowUniversityDropdown(true)
                      } else {
                        setUniversitySearchResults([])
                        setShowUniversityDropdown(false)
                      }
                    }}
                    onFocus={() => {
                      if (universitySearch.length >= 2) {
                        setShowUniversityDropdown(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowUniversityDropdown(false), 200)
                    }}
                    placeholder="大学名を検索..."
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  {selectedUniversityId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUniversityId(null)
                        setSelectedUniversityData(null)
                        setUniversitySearch('')
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  {showUniversityDropdown && universitySearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {universitySearchResults.map((uni) => (
                        <button
                          key={uni.id}
                          type="button"
                          onClick={() => {
                            setSelectedUniversityId(uni.id)
                            setSelectedUniversityData(uni)
                            setUniversitySearch(uni.name_ja || uni.name_en)
                            setShowUniversityDropdown(false)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {uni.name_ja || uni.name_en}
                          </div>
                          {uni.name_ja && (
                            <div className="text-sm text-gray-500">{uni.name_en}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {uni.country_code} {uni.continent?.name_ja && `・${uni.continent.name_ja}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="newest">新しい順</option>
                  <option value="oldest">古い順</option>
                  <option value="popular">人気順</option>
                </select>
              </div>
            </div>

            {/* フィルターリセット */}
            {(selectedCountry !== 'all' || selectedUniversityId !== null || sortBy !== 'newest') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedCountry('all')
                    setSelectedUniversityId(null)
                    setSelectedUniversityData(null)
                    setUniversitySearch('')
                    setSortBy('newest')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors"
                >
                  フィルターをリセット
                </button>
              </div>
            )}
          </div>
        )}

        {/* フィルターが非表示でも、フィルターが適用されている場合は簡易表示 */}
        {!showFilters && (selectedCountry !== 'all' || selectedUniversityId !== null || sortBy !== 'newest') && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedCountry !== 'all' && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                国: {selectedCountry}
              </span>
            )}
            {selectedUniversityData && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300 flex items-center space-x-1.5">
                <GraduationCap className="h-3 w-3" />
                <span>{selectedUniversityData.name_ja || selectedUniversityData.name_en}</span>
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                並び順: {sortBy === 'oldest' ? '古い順' : '人気順'}
              </span>
            )}
          </div>
        )}

        {/* 日記一覧 */}
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6 text-sm font-medium">まだ留学日記がありません</p>
            <Link href="/posts/new?category=diary" className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              最初の日記を書く
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="block group">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-bold flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-white" />
                        留学日記
                      </span>
                      {post.author?.study_abroad_destination && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200 flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {post.author.study_abroad_destination}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500 font-medium">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {post.title || 'タイトルなし'}
                  </h2>
                  
                  {/* カバー写真表示 */}
                  {post.cover_image_url ? (
                    <div className="mb-4 rounded-xl overflow-hidden border-2 border-primary-200 shadow-lg relative">
                      <img
                        src={post.cover_image_url}
                        alt="カバー写真"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : post.image_url ? (
                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={post.image_url}
                        alt="投稿画像"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : null}
                  
                  {post.content && (
                    <p className="text-gray-600 mb-4 line-clamp-1 leading-relaxed">
                      {post.content}
                    </p>
                  )}
                  
                  {/* タグ */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm font-medium border border-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm font-medium border border-gray-300">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5">
                        <UserAvatar 
                          iconUrl={post.author?.icon_url} 
                          name={post.author?.name} 
                          size="sm"
                        />
                        <span className="font-semibold">{post.author?.name || '匿名'}</span>
                      </div>
                      {post.author && (
                        <>
                          <AccountBadge 
                            accountType={post.author.account_type} 
                            verificationStatus={post.author.verification_status}
                            organizationName={post.author.organization_name}
                            size="sm"
                          />
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-5 text-sm text-gray-600">
                      <span className="flex items-center font-semibold">
                        <Heart className="h-5 w-5 mr-1.5 text-red-500" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center font-semibold">
                        <MessageSquare className="h-5 w-5 mr-1.5 text-primary-500" />
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


