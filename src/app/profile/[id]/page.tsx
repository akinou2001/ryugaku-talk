'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Post, UserScore } from '@/lib/supabase'
import { getUserScore } from '@/lib/quest'
import { User as UserIcon, MapPin, GraduationCap, Calendar, MessageSquare, Flame, Edit, Settings, Send, Building2, Candle, Torch } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'

export default function Profile() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [userScore, setUserScore] = useState<UserScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) {
      fetchProfile()
      fetchUserPosts()
      fetchUserScore()
    }
  }, [userId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
    } catch (error: any) {
      setError(error.message || 'プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      setPosts(data || [])
    } catch (error: any) {
      console.error('Error fetching user posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const fetchUserScore = async () => {
    try {
      const score = await getUserScore(userId)
      setUserScore(score)
    } catch (error: any) {
      console.error('Error fetching user score:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">プロフィールが見つかりません</h1>
          <p className="text-gray-600 mb-6">{error || 'このユーザーは存在しないか、プロフィールが設定されていません。'}</p>
          <Link href="/board" className="btn-primary">
            掲示板に戻る
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* プロフィールヘッダー */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <AccountBadge 
                    accountType={profile.account_type} 
                    verificationStatus={profile.verification_status}
                    organizationName={profile.organization_name}
                    size="md"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <>
                  <Link href={`/profile/${profile.id}/edit`} className="btn-secondary flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Link>
                  <Link href="/settings" className="btn-primary flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    設定
                  </Link>
                </>
              ) : currentUser && (
                <Link href={`/chat/${profile.id}`} className="btn-primary flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  メッセージを送る
                </Link>
              )}
            </div>
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              {/* 組織アカウント情報 */}
              {profile.account_type !== 'individual' && (
                <>
                  {profile.organization_name && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">組織名: </span>
                      <span className="font-medium">{profile.organization_name}</span>
                    </div>
                  )}
                  {profile.organization_type && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">組織種別: </span>
                      <span className="font-medium">{profile.organization_type}</span>
                    </div>
                  )}
                  {profile.organization_url && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">URL: </span>
                      <a 
                        href={profile.organization_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:text-primary-800"
                      >
                        {profile.organization_url}
                      </a>
                    </div>
                  )}
                  {profile.verification_status === 'unverified' && isOwnProfile && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold mb-1">認証申請が必要です</div>
                      <div className="text-xs mb-2">
                        組織アカウントとして認証を受けることで、コミュニティ作成や公式投稿などの機能がご利用いただけます。
                      </div>
                      <Link href="/verification/request" className="btn-primary text-sm inline-block">
                        認証申請をする
                      </Link>
                    </div>
                  )}
                  {profile.verification_status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold mb-1">認証審査中</div>
                      <div className="text-xs">
                        組織アカウントの認証審査中です。通常1-3営業日で完了します。
                        認証が完了すると、コミュニティ作成などの組織用機能がご利用いただけます。
                      </div>
                      {isOwnProfile && (
                        <Link href="/verification/request" className="text-xs text-yellow-700 hover:text-yellow-900 underline mt-2 inline-block">
                          申請内容を確認・更新
                        </Link>
                      )}
                    </div>
                  )}
                  {profile.verification_status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold mb-1">認証が拒否されました</div>
                      <div className="text-xs mb-2">
                        組織アカウントの認証が拒否されました。詳細はお問い合わせください。
                      </div>
                      {isOwnProfile && (
                        <Link href="/verification/request" className="btn-secondary text-sm inline-block">
                          再申請する
                        </Link>
                      )}
                    </div>
                  )}
                  {profile.verification_status === 'verified' && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold mb-1">認証済み</div>
                      <div className="text-xs">
                        組織アカウントとして認証されています。コミュニティ作成などの組織用機能をご利用いただけます。
                      </div>
                    </div>
                  )}
                </>
              )}
              {profile.study_abroad_destination && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">留学先: </span>
                  <span className="font-medium">{profile.study_abroad_destination}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">参加日: </span>
                <span className="font-medium">{formatDate(profile.created_at)}</span>
              </div>
              {userScore && (
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-gray-600">火: </span>
                    <span className="font-medium">{userScore.flame_count || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xl">🕯️</span>
                    <span className="text-gray-600">キャンドル: </span>
                    <span className="font-medium">{userScore.candle_count || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xl">🔥</span>
                    <span className="text-gray-600">トーチ: </span>
                    <span className="font-medium">{userScore.torch_count || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 自己紹介 */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">自己紹介</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* 使用言語 */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">使用言語</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages
                  .filter((language: string) => !language.startsWith('purpose:') && !language.startsWith('detail:'))
                  .map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* 統計情報 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{posts.length}</div>
              <div className="text-sm text-gray-600">投稿数</div>
            </div>
            {userScore && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{userScore.flame_count || 0}</div>
                  <div className="text-sm text-gray-600">🔥 火</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{userScore.candle_count || 0}</div>
                  <div className="text-sm text-gray-600">🕯️ キャンドル</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{userScore.torch_count || 0}</div>
                  <div className="text-sm text-gray-600">🔥 トーチ</div>
                </div>
              </>
            )}
            {!userScore && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.contribution_score || 0}</div>
                  <div className="text-sm text-gray-600">貢献度</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">コメント数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">いいね数</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 投稿一覧 */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">最近の投稿</h2>
          
          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">まだ投稿がありません</p>
              {isOwnProfile && (
                <Link href="/posts/new" className="btn-primary mt-4">
                  最初の投稿をする
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 line-clamp-2 mb-3">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
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
        </div>
      </div>
    </div>
  )
}
