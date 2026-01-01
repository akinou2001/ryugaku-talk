'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { Post, Comment } from '@/lib/supabase'
import { updateUserScore } from '@/lib/quest'
import { Heart, MessageSquare, Share, Flag, Clock, User, MapPin, GraduationCap, Edit, Trash2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'

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
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    image_url: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

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
          author:profiles(name, university, study_abroad_destination, major, account_type, verification_status, organization_name, icon_url)
        `)
        .eq('id', postId)
        .single()

      if (error) {
        throw error
      }

      setPost(data)
      
      // 編集フォームに初期値を設定
      if (data) {
        setEditForm({
          title: data.title || '',
          content: data.content || '',
          image_url: data.image_url || ''
        })
      }
      
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
          author:profiles(name, icon_url)
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
        
      }
    } catch (error: any) {
      console.error('Error toggling like:', error)
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


      setNewComment('')
      fetchComments()
    } catch (error: any) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !post) return
    if (post.author_id !== user.id) {
      setError('投稿の削除は投稿者のみ可能です')
      return
    }

    if (!confirm('本当にこの投稿を削除しますか？この操作は取り消せません。')) {
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      // コミュニティ限定投稿の場合はコミュニティページにリダイレクト
      if (post.community_id) {
        router.push(`/communities/${post.community_id}?tab=timeline`)
      } else {
        router.push('/board')
      }
    } catch (error: any) {
      setError(error.message || '投稿の削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post) return
    if (post.author_id !== user.id) {
      setError('投稿の編集は投稿者のみ可能です')
      return
    }

    setIsEditing(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: editForm.title,
          content: editForm.content,
          image_url: editForm.image_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      setShowEditForm(false)
      fetchPost()
    } catch (error: any) {
      setError(error.message || '投稿の編集に失敗しました')
    } finally {
      setIsEditing(false)
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
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">投稿が見つかりません</h1>
            <p className="text-gray-600 mb-6 text-lg">{error || 'この投稿は存在しないか、削除されました。'}</p>
            <button
              onClick={() => router.push('/board')}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              掲示板に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 投稿ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getCategoryColor(post.category)}`}>
              {getCategoryLabel(post.category)}
            </span>
            <div className="flex items-center text-sm text-gray-500 font-medium">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(post.created_at)}
            </div>
          </div>

          {post.category !== 'chat' && (
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>
          )}

          {/* 投稿者情報 */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap">
            <div className="flex items-center space-x-2">
              <UserAvatar 
                iconUrl={post.author?.icon_url} 
                name={post.author?.name} 
                size="md"
              />
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
                  className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm font-medium border border-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 投稿内容 */}
          {!showEditForm ? (
            <>
              {post.category === 'chat' ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-xl">
                    {post.content}
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {post.content}
                  </div>
                </div>
              )}

              {/* 写真表示 */}
              {post.image_url && (
                <div className="mt-6">
                  <img
                    src={post.image_url}
                    alt="投稿画像"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </>
          ) : null}

          {/* 編集フォーム */}
          {showEditForm && user && post.author_id === user.id && post.category !== 'chat' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">投稿を編集</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容 *
                  </label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    required
                    rows={8}
                    className="input-field"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="btn-primary"
                  >
                    {isEditing ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false)
                      setEditForm({
                        title: post.title || '',
                        content: post.content || '',
                        image_url: post.image_url || ''
                      })
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  liked 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-2 border-red-200 shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                <span>{post.likes_count}</span>
              </button>
              <div className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold">
                <MessageSquare className="h-5 w-5 text-primary-500" />
                <span>{post.comments_count}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* 投稿者のみ編集・削除ボタンを表示 */}
              {user && post.author_id === user.id && (
                <>
                  {post.category !== 'chat' && (
                    <button
                      onClick={() => setShowEditForm(!showEditForm)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      <Edit className="h-5 w-5" />
                      <span>編集</span>
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-2 border-red-200 rounded-xl font-semibold hover:from-red-100 hover:to-red-200 transition-all duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>{isDeleting ? '削除中...' : '削除'}</span>
                  </button>
                </>
              )}
              <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                <Share className="h-5 w-5" />
                <span>共有</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                <Flag className="h-5 w-5" />
                <span>通報</span>
              </button>
            </div>
          </div>
        </div>

        {/* コメントセクション */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">コメント ({comments.length})</h2>

          {/* コメント投稿フォーム */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex space-x-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="コメントを入力してください..."
                  rows={3}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none self-start"
                >
                  {commentLoading ? '投稿中...' : '投稿'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-center border border-gray-200">
              <p className="text-gray-600 mb-4 font-medium">コメントするにはログインが必要です</p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  ログイン
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  新規登録
                </button>
              </div>
            </div>
          )}

          {/* コメント一覧 */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-lg font-medium">まだコメントがありません</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <UserAvatar 
                        iconUrl={comment.author?.icon_url} 
                        name={comment.author?.name} 
                        size="sm"
                      />
                      <span className="font-semibold text-gray-900">{comment.author?.name || '匿名'}</span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{formatDate(comment.created_at)}</span>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                    {comment.content}
                  </div>
                  <div className="flex items-center space-x-5 pt-3 border-t border-gray-200">
                    <button className="flex items-center space-x-1.5 text-gray-600 hover:text-red-600 font-semibold transition-colors">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{comment.likes_count}</span>
                    </button>
                    <button className="text-gray-600 hover:text-primary-600 font-semibold transition-colors">
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
