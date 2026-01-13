'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { getQuestById, getQuestPosts, approveQuestPost, unapproveQuestPost } from '@/lib/quest'
import { isAdmin } from '@/lib/admin'
import type { Quest, Post } from '@/lib/supabase'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Award, User } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { QuestBadge } from '@/components/QuestBadge'
import { UserAvatar } from '@/components/UserAvatar'
import ReactMarkdown from 'react-markdown'

export default function GlobalQuestDetail() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const questId = params.questId as string

  const [quest, setQuest] = useState<Quest | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvingPostId, setApprovingPostId] = useState<string | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    if (questId) {
      fetchQuest()
      fetchQuestPosts()
      checkAdminStatus()
    }
  }, [questId, user])

  const checkAdminStatus = async () => {
    if (!user) return
    const admin = await isAdmin(user.id)
    setIsAdminUser(admin)
  }

  const fetchQuest = async () => {
    try {
      const data = await getQuestById(questId)
      // 全員向けクエスト（community_idがnull）か確認
      if (data.community_id) {
        // コミュニティクエストの場合は、コミュニティ詳細ページにリダイレクト
        router.push(`/communities/${data.community_id}/quests/${questId}`)
        return
      }
      setQuest(data)
    } catch (error: any) {
      setError(error.message || 'クエストの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestPosts = async () => {
    try {
      const data = await getQuestPosts(questId)
      setPosts(data)
    } catch (error: any) {
      console.error('Error fetching quest posts:', error)
    }
  }

  const handleApprovePost = async (postId: string) => {
    if (!user) return
    setApprovingPostId(postId)
    try {
      await approveQuestPost(postId)
      await fetchQuestPosts()
    } catch (error: any) {
      setError(error.message || '承認に失敗しました')
    } finally {
      setApprovingPostId(null)
    }
  }

  const handleUnapprovePost = async (postId: string) => {
    if (!user) return
    setApprovingPostId(postId)
    try {
      await unapproveQuestPost(postId)
      await fetchQuestPosts()
    } catch (error: any) {
      setError(error.message || '承認解除に失敗しました')
    } finally {
      setApprovingPostId(null)
    }
  }

  const isCreator = quest?.created_by === user?.id

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!quest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">クエストが見つかりません</h1>
          <Link href="/timeline" className="btn-primary">
            タイムラインに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/timeline"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            タイムラインに戻る
          </Link>
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-6 w-6 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">{quest.title}</h1>
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full text-xs font-semibold">
              全員向けクエスト
            </span>
          </div>
          {quest.description && (
            <div className="prose max-w-none mt-4">
              <ReactMarkdown>{quest.description}</ReactMarkdown>
            </div>
          )}
          <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
            {quest.deadline && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>期限: {new Date(quest.deadline).toLocaleDateString('ja-JP')}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Award className="h-4 w-4" />
              <span>報酬: {quest.reward_amount}ポイント</span>
            </div>
          </div>
          
          {/* 回答数と回答者のアイコン */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 flex-wrap">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                回答が{posts.length}件あります。
              </span>
              {posts.length > 0 && (
                <div className="flex -space-x-2">
                  {Array.from(new Set(posts.map(p => p.author_id))).slice(0, 10).map((authorId) => {
                    const post = posts.find(p => p.author_id === authorId)
                    if (!post || !post.author) return null
                    return (
                      <div
                        key={authorId}
                        className="relative"
                        title={post.author.name || '不明'}
                      >
                        <UserAvatar
                          iconUrl={post.author.icon_url}
                          name={post.author.name}
                          size="sm"
                        />
                      </div>
                    )
                  })}
                  {Array.from(new Set(posts.map(p => p.author_id))).length > 10 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white">
                      +{Array.from(new Set(posts.map(p => p.author_id))).length - 10}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 投稿一覧（ツリー表示） */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">回答投稿</h2>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">まだ回答がありません</p>
              <p className="text-sm text-gray-400 mt-2">
                このクエストに回答するには、投稿を作成してquest_idを設定してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className={`block border rounded-lg p-4 hover:shadow-md transition-all ${
                    post.quest_approved
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <UserAvatar
                        iconUrl={post.author?.icon_url}
                        name={post.author?.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                          <span className="font-semibold text-gray-900">
                            {post.author?.name || '不明'}
                          </span>
                          {post.author && (
                            <AccountBadge
                              accountType={post.author.account_type}
                              verificationStatus={post.author.verification_status}
                              isOperator={post.author.is_operator}
                              size="sm"
                            />
                          )}
                          {post.quest_id && (
                            <QuestBadge
                              questId={post.quest_id}
                              approved={post.quest_approved}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(post.created_at).toLocaleString('ja-JP')}</span>
                        </div>
                      </div>
                    </div>
                    {post.quest_approved && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">承認済み</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <div className="prose max-w-none text-sm text-gray-700">
                      <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                  </div>
                  {(isCreator || isAdminUser) && (
                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      {post.quest_approved ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnapprovePost(post.id)
                          }}
                          disabled={approvingPostId === post.id}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>承認を解除</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprovePost(post.id)
                          }}
                          disabled={approvingPostId === post.id}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>OKスタンプ</span>
                        </button>
                      )}
                      <Link
                        href={`/posts/${post.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700"
                      >
                        詳細を見る
                      </Link>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

