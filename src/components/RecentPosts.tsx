'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, Flame, MessageSquare, Clock } from 'lucide-react'

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentPosts()
  }, [])

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name)
        `)
        .is('community_id', null) // コミュニティ限定投稿は除外
        .order('created_at', { ascending: false })
        .limit(6)

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
      case 'diary': return '日記'
      case 'chat': return 'つぶやき'
      case 'information': return 'つぶやき' // 後方互換性
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-100 text-blue-800'
      case 'diary': return 'bg-green-100 text-green-800'
      case 'chat': return 'bg-purple-100 text-purple-800'
      case 'information': return 'bg-purple-100 text-purple-800' // 後方互換性
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <section className="py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">最近の投稿</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">最近の投稿</h2>
        <Link href="/board" className="btn-primary">
          すべて見る
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">まだ投稿がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(post.created_at)}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>by {post.author?.name || '匿名'}</span>
                <div className="flex items-center space-x-4">
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
    </section>
  )
}


