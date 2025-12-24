'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { BookOpen, Flame, MessageSquare, Clock, Search, Filter, Plus, Calendar, MapPin, GraduationCap } from 'lucide-react'

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
          author:profiles(name, university, study_abroad_destination)
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
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">留学日記</h1>
        </div>
        <Link href="/posts/new?category=diary" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          日記を書く
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
              placeholder="日記を検索..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            検索
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Filter className="h-5 w-5 text-gray-400" />
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
        {(selectedCountry !== 'all' || selectedUniversity !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
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

      {/* 日記一覧 */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">まだ留学日記がありません</p>
          <Link href="/posts/new?category=diary" className="btn-primary">
            最初の日記を書く
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="card hover:shadow-md transition-shadow block">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  留学日記
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {post.title}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.content}
              </p>
              
              {/* タグ */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{post.author?.name || '匿名'}</span>
                    {post.author?.study_abroad_destination && (
                      <span className="text-gray-400">•</span>
                    )}
                    {post.author?.study_abroad_destination && (
                      <span>{post.author.study_abroad_destination}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Flame className="h-4 w-4 mr-1 text-orange-500" />
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


