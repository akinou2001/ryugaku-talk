'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { Post, Comment } from '@/lib/supabase'
import { updateUserScore } from '@/lib/quest'
import { notifyComment } from '@/lib/notifications'
import { Heart, MessageSquare, Share, Flag, Clock, User, MapPin, GraduationCap, Edit, Trash2, MoreVertical, HelpCircle, BookOpen, MessageCircle, CheckCircle2, X as XIcon, Link as LinkIcon, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'
import ReactMarkdown from 'react-markdown'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { uploadFile, validateFileType, validateFileSize, FILE_TYPES } from '@/lib/storage'

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
  const [isResolving, setIsResolving] = useState(false)
  const [showResolveCommentPrompt, setShowResolveCommentPrompt] = useState(false)
  // 編集時の画像アップロード用
  const [editPostImages, setEditPostImages] = useState<File[]>([])
  const [editPostImagePreviews, setEditPostImagePreviews] = useState<string[]>([])
  const [editImageUploading, setEditImageUploading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

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

      // 投稿者に通知を送信（自分の投稿へのコメントは除く）
      if (post && post.author_id !== user.id) {
        await notifyComment(
          post.author_id,
          user.name || '匿名',
          post.title || '投稿',
          postId
        )
      }

      setNewComment('')
      fetchComments()
    } catch (error: any) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!user || !post) return
    if (post.author_id !== user.id) {
      setError('投稿の解決は投稿者のみ可能です')
      return
    }
    if (post.category !== 'question') {
      setError('質問のみ解決できます')
      return
    }

    // 解決済みの場合は未解決に戻す
    if (post.is_resolved) {
      setIsResolving(true)
      try {
        const { error } = await supabase
          .from('posts')
          .update({
            is_resolved: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId)

        if (error) throw error

        setPost(prev => prev ? { ...prev, is_resolved: false } : null)
        setShowResolveCommentPrompt(false)
      } catch (error: any) {
        setError(error.message || '投稿の更新に失敗しました')
      } finally {
        setIsResolving(false)
      }
      return
    }

    // 未解決の場合は解決にする
    setIsResolving(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          is_resolved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      setPost(prev => prev ? { ...prev, is_resolved: true } : null)
      // コメント入力フォームを表示・促す
      setShowResolveCommentPrompt(true)
      // コメント入力欄にフォーカス
      setTimeout(() => {
        const commentInput = document.getElementById('comment-input')
        if (commentInput) {
          commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
          commentInput.focus()
        }
      }, 100)
    } catch (error: any) {
      setError(error.message || '投稿の更新に失敗しました')
    } finally {
      setIsResolving(false)
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
        router.push('/timeline')
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
    setEditImageUploading(true)
    try {
      // 新しい画像をアップロード
      let uploadedImageUrls: string[] = []
      if (editPostImages.length > 0) {
        for (const image of editPostImages) {
          if (!validateFileType(image, FILE_TYPES.POST_IMAGE)) {
            throw new Error('写真はJPEG、PNG、GIF、WebP形式のみ対応しています')
          }
          if (!validateFileSize(image, 5)) {
            throw new Error('写真は5MB以下である必要があります')
          }
          const url = await uploadFile(image, 'post-images', user.id)
          uploadedImageUrls.push(url)
        }
      }

      // Markdown内の画像プレースホルダーを実際のURLに置き換え
      let finalContent = editForm.content
      if (uploadedImageUrls.length > 0 && (post.category === 'diary' || post.category === 'official')) {
        uploadedImageUrls.forEach((url, index) => {
          const placeholder = `[画像${editPostImagePreviews.length - uploadedImageUrls.length + index + 1}]`
          // ![alt]([画像1]) 形式のプレースホルダーを実際のURLに置き換え
          finalContent = finalContent.replace(new RegExp(`\\[画像${editPostImagePreviews.length - uploadedImageUrls.length + index + 1}\\]`, 'g'), url)
        })
      }

      // 既存の画像URLを取得して結合
      const existingImages = post.images || []
      const allImages = [...existingImages, ...uploadedImageUrls]

      const { error } = await supabase
        .from('posts')
        .update({
          title: editForm.title,
          content: finalContent,
          image_url: editForm.image_url || null,
          images: allImages.length > 0 ? allImages : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      setShowEditForm(false)
      setEditPostImages([])
      setEditPostImagePreviews([])
      fetchPost()
    } catch (error: any) {
      setError(error.message || '投稿の編集に失敗しました')
    } finally {
      setIsEditing(false)
      setEditImageUploading(false)
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
              onClick={() => router.push('/timeline')}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              タイムラインに戻る
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
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${getCategoryColor(post.category)}`}>
              {(() => {
                const Icon = getCategoryIcon(post.category)
                return <Icon className="h-3 w-3 text-white" />
              })()}
              {getCategoryLabel(post.category)}
            </span>
            <div className="flex items-center text-sm text-gray-500 font-medium">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(post.created_at)}
            </div>
          </div>

          {post.category !== 'chat' && (
            <div className="mb-6">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>
                {/* 解決済みバッジ（質問のみ） */}
                {post.category === 'question' && post.is_resolved && (
                  <span className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                    <CheckCircle2 className="h-4 w-4" />
                    解決済み
                  </span>
                )}
              </div>
              {post.category === 'question' && !post.is_resolved && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  この質問はまだ解決されていません
                </p>
              )}
            </div>
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
              ) : (post.category === 'diary' || post.category === 'official') ? (
                /* Markdownレンダリング（日記と公式投稿のみ） */
                <div className="prose prose-lg max-w-none 
                  prose-headings:text-gray-900 prose-headings:font-bold 
                  prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-6 prose-h1:font-extrabold prose-h1:leading-tight
                  prose-h2:text-3xl prose-h2:mt-6 prose-h2:mb-4 prose-h2:font-bold prose-h2:leading-tight
                  prose-h3:text-2xl prose-h3:mt-5 prose-h3:mb-3 prose-h3:font-semibold
                  prose-p:text-gray-800 prose-p:leading-relaxed prose-p:text-base prose-p:my-4
                  prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-bold
                  prose-em:text-gray-800 prose-em:italic
                  prose-ul:text-gray-800 prose-ul:my-4 prose-ul:pl-6
                  prose-ol:text-gray-800 prose-ol:my-4 prose-ol:pl-6
                  prose-li:my-2 prose-li:leading-relaxed
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:my-4
                  prose-hr:my-8 prose-hr:border-gray-300
                  prose-img:rounded-lg prose-img:my-6 prose-img:shadow-md
                  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-gray-900 prose-pre:text-gray-100">
                  {/* @ts-ignore - react-markdown型定義の問題を回避 */}
                  <ReactMarkdown
                    // @ts-ignore
                    components={{
                      // @ts-ignore
                      h1: ({node, ...props}: any) => <h1 className="text-4xl font-extrabold mt-8 mb-6 text-gray-900 leading-tight" {...props} />,
                      // @ts-ignore
                      h2: ({node, ...props}: any) => <h2 className="text-3xl font-bold mt-6 mb-4 text-gray-900 leading-tight" {...props} />,
                      // @ts-ignore
                      h3: ({node, ...props}: any) => <h3 className="text-2xl font-semibold mt-5 mb-3 text-gray-900" {...props} />,
                      // @ts-ignore
                      p: ({node, ...props}: any) => <p className="text-base text-gray-800 leading-relaxed my-4" {...props} />,
                      // @ts-ignore
                      strong: ({node, ...props}: any) => <strong className="font-bold text-gray-900" {...props} />,
                      // @ts-ignore
                      em: ({node, ...props}: any) => <em className="italic text-gray-800" {...props} />,
                      // @ts-ignore
                      ul: ({node, ...props}: any) => <ul className="list-disc pl-6 my-4 text-gray-800" {...props} />,
                      // @ts-ignore
                      ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 my-4 text-gray-800" {...props} />,
                      // @ts-ignore
                      li: ({node, ...props}: any) => <li className="my-2 leading-relaxed" {...props} />,
                      // @ts-ignore
                      blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4" {...props} />,
                      // @ts-ignore
                      hr: ({node, ...props}: any) => <hr className="my-8 border-gray-300" {...props} />,
                      // @ts-ignore
                      img: ({node, ...props}: any) => {
                        let src = props.src || ''
                        // URLが正しく設定されているか確認
                        if (!src) {
                          return null
                        }
                        // プレースホルダーが残っている場合は、post.images配列から取得
                        if (src.includes('[画像')) {
                          const imageMatch = src.match(/\[画像(\d+)\]/)
                          if (imageMatch && post.images && post.images.length > 0) {
                            const imageIndex = parseInt(imageMatch[1]) - 1
                            if (post.images[imageIndex]) {
                              src = post.images[imageIndex]
                            } else {
                              return null
                            }
                          } else {
                            return null
                          }
                        }
                        // URLが有効か確認（httpまたはhttpsで始まる）
                        if (!src.startsWith('http://') && !src.startsWith('https://')) {
                          return null
                        }
                        return (
                          <img 
                            src={src}
                            alt={props.alt || '画像'}
                            className="w-full rounded-lg border border-gray-200 shadow-md my-6 object-contain max-h-96"
                            onError={(e) => {
                              // 画像の読み込みエラー時は非表示
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )
                      },
                    }}
                  >
                    {(() => {
                      // 特殊な画像記法を標準的なMarkdown記法に変換
                      // !https://... (https://...) 形式を ![画像](https://...) に変換
                      let processedContent = post.content || ''
                      
                      // パターン1: !https://url (https://url) 形式
                      // 括弧内のURLを優先的に使用
                      processedContent = processedContent.replace(
                        /!https:\/\/([^\s]+)\s*\(https:\/\/([^)]+)\)/g,
                        '![画像](https://$2)'
                      )
                      
                      // パターン2: !https://url 形式（括弧なし）
                      processedContent = processedContent.replace(
                        /!https:\/\/([^\s]+)/g,
                        '![画像](https://$1)'
                      )
                      
                      return processedContent
                    })()}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {post.content}
                  </div>
                </div>
              )}

              {/* 写真表示（日記と公式投稿以外の場合のみ。日記・公式投稿はMarkdown内に画像が含まれる） */}
              {!(post.category === 'diary' || post.category === 'official') && (
                <>
                  {post.images && post.images.length > 0 ? (
                    /* 複数画像表示 */
                    <div className="mt-6 space-y-4">
                      {post.images.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`投稿画像 ${index + 1}`}
                            className="w-full rounded-lg border border-gray-200"
                          />
                          {post.cover_image_url === imageUrl && (
                            <div className="absolute top-2 right-2 bg-primary-500 text-white px-3 py-1 rounded text-sm font-semibold">
                              カバー写真
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : post.image_url ? (
                    /* 通常投稿: 1枚の画像 */
                    <div className="mt-6">
                      <img
                        src={post.image_url}
                        alt="投稿画像"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  ) : null}
                </>
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
                    内容 * {(post.category === 'diary' || post.category === 'official') && <span className="text-xs text-gray-500">(Markdown形式対応)</span>}
                  </label>
                  {(post.category === 'diary' || post.category === 'official') ? (
                    <MarkdownEditor
                      value={editForm.content}
                      onChange={(newValue) => setEditForm(prev => ({ ...prev, content: newValue }))}
                      placeholder="投稿の内容をMarkdown形式で記述できます。"
                      rows={15}
                      onImageSelect={(file) => {
                        // 画像を追加（最大4枚）
                        if (editPostImages.length < 4) {
                          const newImages = [...editPostImages, file]
                          setEditPostImages(newImages)
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setEditPostImagePreviews(prev => [...prev, reader.result as string])
                          }
                          reader.readAsDataURL(file)
                        } else {
                          setError('写真は最大4枚までアップロードできます')
                        }
                      }}
                      uploadedImages={editPostImagePreviews}
                    />
                  ) : (
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      required
                      rows={8}
                      className="input-field"
                    />
                  )}
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
              {/* 投稿者のみ編集・削除・解決ボタンを表示 */}
              {user && post.author_id === user.id && (
                <>
                  {/* 解決ボタン（質問のみ） */}
                  {post.category === 'question' && (
                    <button
                      onClick={handleResolve}
                      disabled={isResolving}
                      className={`flex items-center space-x-2 px-3 lg:px-4 py-2.5 border-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 ${
                        post.is_resolved
                          ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-600 border-green-200 hover:from-green-100 hover:to-green-200'
                          : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border-blue-200 hover:from-blue-100 hover:to-blue-200'
                      }`}
                      title={isResolving ? '更新中...' : post.is_resolved ? '解決済み' : '解決する'}
                    >
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden lg:inline">{isResolving ? '更新中...' : post.is_resolved ? '解決済み' : '解決する'}</span>
                    </button>
                  )}
                  {post.category !== 'chat' && (
                    <button
                      onClick={() => setShowEditForm(!showEditForm)}
                      className="flex items-center space-x-2 px-3 lg:px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      title="編集"
                    >
                      <Edit className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden lg:inline">編集</span>
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 px-3 lg:px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-2 border-red-200 rounded-xl font-semibold hover:from-red-100 hover:to-red-200 transition-all duration-200 disabled:opacity-50"
                    title={isDeleting ? '削除中...' : '削除'}
                  >
                    <Trash2 className="h-5 w-5 flex-shrink-0" />
                    <span className="hidden lg:inline">{isDeleting ? '削除中...' : '削除'}</span>
                  </button>
                </>
              )}
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <Share className="h-5 w-5" />
                  <span>共有</span>
                </button>
                {showShareMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowShareMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/posts/${postId}`
                            const text = post.title || '投稿を共有'
                            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
                            window.open(shareUrl, '_blank', 'width=550,height=420')
                            setShowShareMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          <XIcon className="h-5 w-5 text-gray-700" />
                          <span className="font-medium text-gray-900">X（旧Twitter）で共有</span>
                        </button>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/posts/${postId}`
                            const text = post.title || '投稿を共有'
                            const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`
                            window.open(shareUrl, '_blank', 'width=550,height=420')
                            setShowShareMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          <div className="h-5 w-5 bg-[#00C300] rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">L</span>
                          </div>
                          <span className="font-medium text-gray-900">LINEで共有</span>
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={async () => {
                            const url = `${window.location.origin}/posts/${postId}`
                            try {
                              await navigator.clipboard.writeText(url)
                              setUrlCopied(true)
                              setTimeout(() => {
                                setUrlCopied(false)
                                setShowShareMenu(false)
                              }, 2000)
                            } catch (err) {
                              // フォールバック: テキストエリアを使用
                              const textArea = document.createElement('textarea')
                              textArea.value = url
                              document.body.appendChild(textArea)
                              textArea.select()
                              document.execCommand('copy')
                              document.body.removeChild(textArea)
                              setUrlCopied(true)
                              setTimeout(() => {
                                setUrlCopied(false)
                                setShowShareMenu(false)
                              }, 2000)
                            }
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          {urlCopied ? (
                            <>
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-600">URLをコピーしました</span>
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-5 w-5 text-gray-700" />
                              <span className="font-medium text-gray-900">URLをコピー</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button className="flex items-center space-x-2 px-3 lg:px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200" title="通報">
                <Flag className="h-5 w-5 flex-shrink-0" />
                <span className="hidden lg:inline">通報</span>
              </button>
            </div>
          </div>
        </div>

        {/* コメントセクション */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">コメント ({comments.length})</h2>

          {/* 解決時のコメント促しメッセージ */}
          {showResolveCommentPrompt && post.category === 'question' && post.is_resolved && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl">
              <p className="text-blue-800 font-semibold mb-2">✅ 質問を解決済みにしました</p>
              <p className="text-blue-700 text-sm">どのように解決したか、コメントで共有してください。他のユーザーの参考になります。</p>
            </div>
          )}

          {/* コメント投稿フォーム */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex space-x-4">
                <textarea
                  id="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={showResolveCommentPrompt && post.is_resolved ? "どのように解決したか、コメントで共有してください..." : "コメントを入力してください..."}
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
