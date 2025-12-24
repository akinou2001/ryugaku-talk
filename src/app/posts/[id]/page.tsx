'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { Post, Comment } from '@/lib/supabase'
import { updateUserScore } from '@/lib/quest'
import { Flame, MessageSquare, Share, Flag, Clock, User, MapPin, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'

export default function PostDetail() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchComments()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name, university, study_abroad_destination, major, account_type, verification_status, organization_name)
        `)
        .eq('id', postId)
        .single()

      if (error) {
        throw error
      }

      setPost(data)
      
      // いいね状態を確認
      if (user) {
        try {
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single()
          
          setLiked(!!likeData)
        } catch (likeError) {
          // いいねが存在しない場合はエラーになるが、これは正常
          setLiked(false)
        }
      }
    } catch (error: any) {
      setError(error.message || '投稿の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      setComments(data || [])
    } catch (error: any) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    try {
      if (liked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error
        setLiked(false)
        setPost(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null)
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        if (error) throw error
        setLiked(true)
        setPost(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null)
        
        // 投稿者に「火」を加算（いいねされた側）
        if (post?.author_id) {
          try {
            await addFlameToUser(post.author_id)
          } catch (flameError) {
            console.error('Error adding flame:', flameError)
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling like:', error)
    }
  }

  // 「火」をユーザーに加算する関数
  const addFlameToUser = async (userId: string) => {
    // スコアレコードを取得または作成
    const { data: existing } = await supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase
        .from('user_scores')
        .update({
          flame_count: (existing.flame_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('user_scores')
        .insert({
          user_id: userId,
          flame_count: 1,
          candle_count: 0,
          torch_count: 0,
          candles_received_count: 0
        })
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    if (!newComment.trim()) return

    setCommentLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim()
        })

      if (error) throw error

      // 貢献度を更新（コメント投稿で+5ポイント）
      // 現在の貢献度を取得してから更新
      const { data: profileData } = await supabase
        .from('profiles')
        .select('contribution_score')
        .eq('id', user.id)
        .single()

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ 
            contribution_score: (profileData.contribution_score || 0) + 5,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      }

      // 質問への回答の場合、投稿者に「火」を加算
      if (post?.category === 'question' && post?.author_id) {
        try {
          await addFlameToUser(post.author_id)
        } catch (flameError) {
          console.error('Error adding flame for answer:', flameError)
        }
      }

      setNewComment('')
      fetchComments()
    } catch (error: any) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">投稿が見つかりません</h1>
          <p className="text-gray-600 mb-6">{error || 'この投稿は存在しないか、削除されました。'}</p>
          <button
            onClick={() => router.push('/board')}
            className="btn-primary"
          >
            掲示板に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 投稿ヘッダー */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
              {getCategoryLabel(post.category)}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(post.created_at)}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* 投稿者情報 */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              {post.author_id ? (
                <Link 
                  href={`/profile/${post.author_id}`}
                  className="font-medium text-primary-600 hover:text-primary-800"
                >
                  {post.author?.name || '匿名'}
                </Link>
              ) : (
                <span className="font-medium">{post.author?.name || '匿名'}</span>
              )}
              {post.author && (
                <AccountBadge 
                  accountType={post.author.account_type} 
                  verificationStatus={post.author.verification_status}
                  organizationName={post.author.organization_name}
                  size="sm"
                />
              )}
            </div>
            {post.author?.university && (
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">{post.author.university}</span>
              </div>
            )}
            {post.author?.study_abroad_destination && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">{post.author.study_abroad_destination}</span>
              </div>
            )}
          </div>

          {/* タグ */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 投稿内容 */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  liked 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Flame className={`h-5 w-5 ${liked ? 'text-orange-500 fill-current' : 'text-gray-500'}`} />
                <span>{post.likes_count}</span>
              </button>
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageSquare className="h-5 w-5" />
                <span>{post.comments_count}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                <Share className="h-5 w-5" />
                <span>共有</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                <Flag className="h-5 w-5" />
                <span>通報</span>
              </button>
            </div>
          </div>
        </div>

        {/* コメントセクション */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">コメント ({comments.length})</h2>

          {/* コメント投稿フォーム */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex space-x-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="コメントを入力してください..."
                  rows={3}
                  className="flex-1 input-field"
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="btn-primary self-start"
                >
                  {commentLoading ? '投稿中...' : '投稿'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 mb-4">コメントするにはログインが必要です</p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="btn-primary"
                >
                  ログイン
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="btn-secondary"
                >
                  新規登録
                </button>
              </div>
            </div>
          )}

          {/* コメント一覧 */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">まだコメントがありません</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{comment.author?.name || '匿名'}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                  <div className="flex items-center space-x-4 mt-4">
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{comment.likes_count}</span>
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      返信
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
