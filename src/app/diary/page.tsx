'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { BookOpen, MessageSquare, Clock, Search, Filter, Plus, Calendar, MapPin, GraduationCap, Heart } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { AccountBadge } from '@/components/AccountBadge'

export default function Diary() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedUniversity, setSelectedUniversity] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableUniversities, setAvailableUniversities] = useState<string[]>([])

  useEffect(() => {
    fetchDiaryPosts()
    fetchFilterOptions()
  }, [selectedCountry, selectedUniversity, sortBy])

  const fetchFilterOptions = async () => {
    try {
      // 留学日記の利用可能な国を取得
      const { data: countryData, error: countryError } = await supabase
        .from('posts')
        .select('study_abroad_destination')
        .eq('category', 'diary')
        .not('study_abroad_destination', 'is', null)

      // 留学日記の利用可能な大学を取得
      const { data: universityData, error: universityError } = await supabase
        .from('posts')
        .select('university')
        .eq('category', 'diary')
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

  const fetchDiaryPosts = async () => {
    try {
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
        console.error('Error fetching diary posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching diary posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDiaryPosts()
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
              <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                留学日記
              </h1>
            </div>
            <p className="text-gray-600">留学の思い出を日記に残しましょう</p>
          </div>
          <Link href="/posts/new?category=diary" className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            日記を書く
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
                placeholder="日記を検索..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              検索
            </button>
          </form>

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
          {(selectedCountry !== 'all' || selectedUniversity !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
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

        {/* 日記一覧 */}
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6 text-lg font-medium">まだ留学日記がありません</p>
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
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500 font-medium">{formatDate(post.created_at)}</span>
                    </div>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-bold">
                      📝 留学日記
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-1 leading-relaxed">
                    {post.content}
                  </p>
                  
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
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <UserAvatar 
                          iconUrl={post.author?.icon_url} 
                          name={post.author?.name} 
                          size="sm"
                        />
                        <span className="font-semibold">{post.author?.name || '匿名'}</span>
                        {post.author && (
                          <AccountBadge 
                            accountType={post.author.account_type} 
                            verificationStatus={post.author.verification_status}
                            organizationName={post.author.organization_name}
                            size="sm"
                          />
                        )}
                        {post.author?.study_abroad_destination && (
                          <span className="text-gray-400">•</span>
                        )}
                        {post.author?.study_abroad_destination && (
                          <span className="font-medium">{post.author.study_abroad_destination}</span>
                        )}
                      </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


