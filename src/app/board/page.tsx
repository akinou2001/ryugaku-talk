'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, MessageSquare, Clock, Search, Filter, Plus, MapPin, GraduationCap, Heart } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'

export default function Board() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedUniversity, setSelectedUniversity] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableUniversities, setAvailableUniversities] = useState<string[]>([])

  useEffect(() => {
    fetchPosts()
    fetchFilterOptions()
  }, [selectedCategory, selectedCountry, selectedUniversity, sortBy])

  const fetchFilterOptions = async () => {
    try {
      // 利用可能な国を取得
      const { data: countryData, error: countryError } = await supabase
        .from('posts')
        .select('study_abroad_destination')
        .not('study_abroad_destination', 'is', null)

      // 利用可能な大学を取得
      const { data: universityData, error: universityError } = await supabase
        .from('posts')
        .select('university')
        .not('university', 'is', null)

      if (countryError) {
        console.error('Error fetching countries:', countryError)
      }

      if (universityError) {
        console.error('Error fetching universities:', universityError)
      }

      const countries = Array.from(new Set(
        (countryData || []).map(item => item.study_abroad_destination).filter(Boolean) as string[]
      )).sort()

      const universities = Array.from(new Set(
        (universityData || []).map(item => item.university).filter(Boolean) as string[]
      )).sort()

      setAvailableCountries(countries)
      setAvailableUniversities(universities)
    } catch (error) {
      console.error('Error fetching filter options:', error)
      setAvailableCountries([])
      setAvailableUniversities([])
    }
  }

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name, account_type, verification_status, organization_name, icon_url)
        `)
        .is('community_id', null) // コミュニティ限定投稿は除外

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      if (selectedCountry !== 'all') {
        query = query.eq('study_abroad_destination', selectedCountry)
      }

      if (selectedUniversity !== 'all') {
        query = query.eq('university', selectedUniversity)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'たった今'
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question': return '❓ 質問'
      case 'diary': return '📝 日記'
      case 'chat': return '💬 つぶやき'
      case 'information': return '💬 つぶやき' // 後方互換性
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'diary': return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'chat': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'information': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' // 後方互換性
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              掲示板
            </h1>
            <p className="text-gray-600">質問や留学日記を投稿して交流しましょう</p>
          </div>
          <Link href="/posts/new" className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            新規投稿
          </Link>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="投稿を検索..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              検索
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="all">すべてのカテゴリ</option>
                <option value="question">質問</option>
                <option value="diary">留学日記</option>
                <option value="information">情報共有</option>
              </select>
            </div>

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

            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-gray-400" />
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="all">すべての大学</option>
                {availableUniversities.map((university) => (
                  <option key={university} value={university}>
                    {university}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
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
          {(selectedCategory !== 'all' || selectedCountry !== 'all' || selectedUniversity !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedCountry('all')
                  setSelectedUniversity('all')
                }}
                className="text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors"
              >
                フィルターをリセット
              </button>
            </div>
          )}
        </div>

        {/* 投稿一覧 */}
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">投稿が見つかりません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isOrganizationPost = post.author && post.author.account_type !== 'individual'
              const getOrganizationBorderColor = () => {
                if (!isOrganizationPost) return ''
                switch (post.author?.account_type) {
                  case 'educational': return 'border-l-4 border-l-blue-500'
                  case 'company': return 'border-l-4 border-l-green-500'
                  case 'government': return 'border-l-4 border-l-purple-500'
                  default: return ''
                }
              }
              return (
              <Link key={post.id} href={`/posts/${post.id}`} className={`block group ${getOrganizationBorderColor()}`}>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getCategoryColor(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center font-medium">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  
                  {post.category === 'chat' ? (
                    <p className="text-gray-900 mb-4 line-clamp-1 leading-relaxed text-lg">
                      {post.content}
                    </p>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-1 leading-relaxed">
                        {post.content}
                      </p>
                    </>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap gap-3">
                      <div className="flex items-center space-x-2">
                        <UserAvatar 
                          iconUrl={post.author?.icon_url} 
                          name={post.author?.name} 
                          size="sm"
                        />
                        {post.author_id ? (
                          <Link 
                            href={`/profile/${post.author_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary-600 hover:text-primary-800 font-semibold transition-colors"
                          >
                            {post.author?.name || '匿名'}
                          </Link>
                        ) : (
                          <span className="font-medium">{post.author?.name || '匿名'}</span>
                        )}
                      </div>
                      {post.author && (
                        <AccountBadge 
                          accountType={post.author.account_type} 
                          verificationStatus={post.author.verification_status}
                          organizationName={post.author.organization_name}
                          size="sm"
                        />
                      )}
                      {post.university && (
                        <span className="font-medium">{post.university}</span>
                      )}
                      {post.study_abroad_destination && (
                        <span className="font-medium">{post.study_abroad_destination}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-5 text-sm text-gray-600">
                      <span className="flex items-center font-semibold">
                        <Heart className="h-5 w-5 mr-1.5 text-red-500" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center font-semibold">
                        <MessageSquare className="h-5 w-5 mr-1.5 text-primary-500" />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


