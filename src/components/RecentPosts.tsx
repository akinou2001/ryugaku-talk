'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, MessageSquare, Clock, Heart, HelpCircle, BookOpen } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'

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
          author:profiles(name, account_type, verification_status, organization_name, icon_url)
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return HelpCircle
      case 'diary': return BookOpen
      case 'chat': return MessageCircle
      case 'information': return MessageCircle // 後方互換性
      default: return MessageCircle
    }
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
      case 'question': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'diary': return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'chat': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'information': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' // 後方互換性
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">まだ投稿がありません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <Link 
            key={post.id} 
            href={`/posts/${post.id}`} 
            className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${getOrganizationBorderColor()}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getCategoryColor(post.category)}`}>
                {(() => {
                  const Icon = getCategoryIcon(post.category)
                  return <Icon className="h-3.5 w-3.5 text-white" />
                })()}
                {getCategoryLabel(post.category)}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {formatDate(post.created_at)}
              </span>
            </div>
            
            {post.category === 'chat' ? (
              <p className="text-gray-900 mb-4 line-clamp-2 text-base font-medium leading-relaxed">
                {post.content}
              </p>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                  {post.content}
                </p>
              </>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <UserAvatar 
                  iconUrl={post.author?.icon_url} 
                  name={post.author?.name} 
                  size="sm"
                />
                <span className="text-sm text-gray-700 font-medium truncate">
                  {post.author?.name || '匿名'}
                </span>
                {post.author && (
                  <AccountBadge 
                    accountType={post.author.account_type} 
                    verificationStatus={post.author.verification_status}
                    organizationName={post.author.organization_name}
                    size="sm"
                  />
                )}
              </div>
              <div className="flex items-center space-x-4 ml-4">
                <span className="flex items-center text-sm text-gray-600">
                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                  {post.likes_count}
                </span>
                <span className="flex items-center text-sm text-gray-600">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {post.comments_count}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}


