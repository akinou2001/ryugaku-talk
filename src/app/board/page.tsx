'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, Heart, MessageSquare, Clock, Search, Filter, Plus, MapPin, GraduationCap } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'

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
          author:profiles(name, account_type, verification_status, organization_name)
        `)

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
      case 'question': return '質問'
      case 'diary': return '留学日記'
      case 'information': return '情報共有'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-100 text-blue-800'
      case 'diary': return 'bg-green-100 text-green-800'
      case 'information': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">掲示板</h1>
        <Link href="/posts/new" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          新規投稿
        </Link>
      </div>

      {/* 検索・フィルター */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="投稿を検索..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            検索
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field flex-1"
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
              className="input-field flex-1"
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
              className="input-field flex-1"
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
              className="input-field flex-1"
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
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              フィルターをリセット
            </button>
          </div>
        )}
      </div>

      {/* 投稿一覧 */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">投稿が見つかりません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="card hover:shadow-md transition-shadow block">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(post.created_at)}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {post.title}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500 flex-wrap">
                  <span>by </span>
                  {post.author_id ? (
                    <Link 
                      href={`/profile/${post.author_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      {post.author?.name || '匿名'}
                    </Link>
                  ) : (
                    <span>{post.author?.name || '匿名'}</span>
                  )}
                  {post.author && (
                    <AccountBadge 
                      accountType={post.author.account_type} 
                      verificationStatus={post.author.verification_status}
                      organizationName={post.author.organization_name}
                      size="sm"
                    />
                  )}
                  {post.university && (
                    <span>{post.university}</span>
                  )}
                  {post.study_abroad_destination && (
                    <span>{post.study_abroad_destination}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {post.likes_count}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {post.comments_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


