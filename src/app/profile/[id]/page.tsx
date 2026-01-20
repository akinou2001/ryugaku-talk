'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Post, UserScore } from '@/lib/supabase'
import { getUserScore } from '@/lib/quest'
import { User as UserIcon, MapPin, GraduationCap, Calendar, MessageSquare, Edit, Settings, Send, Building2, Heart, HelpCircle, BookOpen, MessageCircle, Mail, Twitter, Instagram, Facebook, Linkedin, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { StudentStatusBadge } from '@/components/StudentStatusBadge'
import { getUniversityById, type University } from '@/lib/universities'

export default function Profile() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [userScore, setUserScore] = useState<UserScore | null>(null)
  const [verificationRequest, setVerificationRequest] = useState<any>(null)
  const [university, setUniversity] = useState<University | null>(null)
  const [studyAbroadUniversity, setStudyAbroadUniversity] = useState<University | null>(null)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) {
      fetchProfile()
      fetchUserPosts()
      fetchUserScore()
      fetchVerificationRequest()
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
      
      // 所属大学情報を取得
      if (data.university_id) {
        const { data: uniData } = await getUniversityById(data.university_id)
        if (uniData) {
          setUniversity(uniData)
        }
      } else if (data.university) {
        // 既存のテキストから大学を検索（後方互換性）
        const { data: uniData } = await supabase
          .from('universities')
          .select(`
            *,
            continent:continents(*)
          `)
          .or(`name_en.ilike.%${data.university}%,name_ja.ilike.%${data.university}%`)
          .limit(1)
          .single()
        if (uniData) {
          setUniversity(uniData as University)
        }
      }
      
      // 留学先大学情報を取得
      if (data.study_abroad_university_id) {
        const { data: uniData } = await getUniversityById(data.study_abroad_university_id)
        if (uniData) {
          setStudyAbroadUniversity(uniData)
        }
      }
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
          author:profiles(name, icon_url)
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

  const fetchVerificationRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_verification_requests')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // 406エラー（Not Acceptable）の場合は、テーブルが存在しないかRLSポリシーの問題の可能性があるため、エラーを無視
      if (error) {
        // PGRST116は「レコードが見つからない」エラー（正常）
        // 406エラーはRLSポリシーやテーブルの問題の可能性があるため、警告のみ
        if (error.code !== 'PGRST116' && (error as any).status !== 406) {
          console.error('Error fetching verification request:', error)
        }
        return
      }

      if (data) {
        setVerificationRequest(data)
      }
    } catch (error: any) {
      // 406エラーの場合は無視（テーブルが存在しないかRLSポリシーの問題の可能性）
      if (error?.status !== 406) {
        console.error('Error fetching verification request:', error)
      }
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
      <div className="h-32 bg-gray-200 rounded mb-6"></div>
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-6"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">プロフィールが見つかりません</h1>
            <p className="text-gray-600 mb-6 text-lg">{error || 'このユーザーは存在しないか、プロフィールが設定されていません。'}</p>
            <Link href="/timeline" className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              タイムラインに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  const isOrganizationAccount = profile.account_type !== 'individual'
  const pageTitle = isOrganizationAccount ? '組織プロフィール' : 'プロフィール'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ページタイトル */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">{pageTitle}</h1>
        
        {/* プロフィールヘッダー */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 ${isOrganizationAccount ? 'border-l-4 border-l-blue-500' : ''}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <UserAvatar 
                iconUrl={profile.icon_url} 
                name={profile.name} 
                size="xl"
              />
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <AccountBadge 
                    accountType={profile.account_type} 
                    verificationStatus={profile.verification_status}
                    organizationName={profile.organization_name}
                    isOperator={profile.is_operator}
                    size="md"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <Link href={`/profile/${profile.id}/edit`} className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold flex items-center hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Link>
                  {profile.account_type === 'individual' && (
                    <>
                      <Link href="/verification/request" className="px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold flex items-center hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                        <Building2 className="h-4 w-4 mr-2" />
                        組織認証申請
                      </Link>
                      <Link href="/organization/invites" className="px-4 py-2.5 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-semibold flex items-center hover:bg-purple-50 hover:border-purple-300 transition-all duration-200">
                        <Mail className="h-4 w-4 mr-2" />
                        組織招待
                      </Link>
                    </>
                  )}
                  {profile.account_type !== 'individual' && profile.is_organization_owner && profile.verification_status === 'verified' && (
                    <Link href="/organization/manage" className="px-4 py-2.5 bg-white border-2 border-green-200 text-green-700 rounded-xl font-semibold flex items-center hover:bg-green-50 hover:border-green-300 transition-all duration-200">
                      <Building2 className="h-4 w-4 mr-2" />
                      組織管理
                    </Link>
                  )}
                  {profile.account_type !== 'individual' && !profile.is_organization_owner && (
                    <Link href="/organization/invites" className="px-4 py-2.5 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-semibold flex items-center hover:bg-purple-50 hover:border-purple-300 transition-all duration-200">
                      <Mail className="h-4 w-4 mr-2" />
                      組織招待
                    </Link>
                  )}
                  <Link href="/settings" className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    設定
                  </Link>
                </>
              ) : currentUser && (
                <Link href={`/chat/${profile.id}`} className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  メッセージを送る
                </Link>
              )}
            </div>
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              {/* 組織アカウント情報 */}
              {profile.account_type !== 'individual' && (
                <>
                  {profile.organization_name && (
                    <div className="flex items-start space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-gray-600 whitespace-nowrap">組織名:</span>
                          <span className="font-medium text-gray-900">{profile.organization_name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {profile.organization_type && (
                    <div className="flex items-start space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-gray-600 whitespace-nowrap">組織種別:</span>
                          <span className="font-medium text-gray-900">{profile.organization_type}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {profile.organization_url && (
                    <div className="flex items-start space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-gray-600 whitespace-nowrap">URL:</span>
                          <a 
                            href={profile.organization_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary-600 hover:text-primary-800 break-all"
                          >
                            {profile.organization_url}
                          </a>
                        </div>
                      </div>
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
                  {(profile.verification_status === 'pending' || verificationRequest?.status === 'pending') && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold mb-1 flex items-center space-x-2">
                        <span>認証審査中</span>
                        {verificationRequest && (
                          <span className="text-xs font-normal opacity-75">
                            (申請日: {new Date(verificationRequest.created_at).toLocaleDateString('ja-JP')})
                          </span>
                        )}
                      </div>
                      <div className="text-xs mb-2">
                        組織アカウントの認証審査中です。通常1-3営業日で完了します。
                        認証が完了すると、コミュニティ作成などの組織用機能がご利用いただけます。
                      </div>
                      {verificationRequest && (
                        <div className="text-xs mb-2 space-y-1">
                          <div>申請組織: {verificationRequest.organization_name}</div>
                          {verificationRequest.contact_person_name && (
                            <div>担当者: {verificationRequest.contact_person_name}</div>
                          )}
                        </div>
                      )}
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
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-gray-600 whitespace-nowrap">留学先:</span>
                      <span className="font-medium text-gray-900">{profile.study_abroad_destination}</span>
                    </div>
                  </div>
                </div>
              )}
              {(university || profile.university) && (
                <div className="flex items-start space-x-2">
                  <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-gray-600 whitespace-nowrap">所属大学:</span>
                      <span className="font-medium text-gray-900">
                        {university ? (university.name_ja || university.name_en) : profile.university}
                      </span>
                      {university && university.name_ja && university.name_en && (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          ({university.name_en})
                        </span>
                      )}
                      {university && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium whitespace-nowrap">
                            {university.country_code}
                          </span>
                          {university.continent && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium whitespace-nowrap">
                              {university.continent.name_ja}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {studyAbroadUniversity && (
                <div className="flex items-start space-x-2">
                  <GraduationCap className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-gray-600 whitespace-nowrap">留学先大学:</span>
                      <span className="font-medium text-gray-900">
                        {studyAbroadUniversity.name_ja || studyAbroadUniversity.name_en}
                      </span>
                      {studyAbroadUniversity.name_ja && studyAbroadUniversity.name_en && (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          ({studyAbroadUniversity.name_en})
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium whitespace-nowrap">
                          {studyAbroadUniversity.country_code}
                        </span>
                        {studyAbroadUniversity.continent && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium whitespace-nowrap">
                            {studyAbroadUniversity.continent.name_ja}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-gray-600 whitespace-nowrap">参加日:</span>
                    <span className="font-medium text-gray-900">{formatDate(profile.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 自己紹介 */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">自己紹介</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* SNSリンク */}
          {(profile.sns_x || profile.sns_tiktok || profile.sns_instagram || profile.sns_facebook || profile.sns_linkedin || profile.sns_url) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">SNSリンク</h3>
              <div className="flex flex-wrap gap-3">
                {profile.sns_x && (
                  <a
                    href={profile.sns_x.startsWith('http') ? profile.sns_x : `https://${profile.sns_x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Twitter className="h-5 w-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">X</span>
                  </a>
                )}
                {profile.sns_tiktok && (
                  <a
                    href={profile.sns_tiktok.startsWith('http') ? profile.sns_tiktok : `https://${profile.sns_tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <span className="text-lg">🎵</span>
                    <span className="text-sm font-medium text-gray-700">TikTok</span>
                  </a>
                )}
                {profile.sns_instagram && (
                  <a
                    href={profile.sns_instagram.startsWith('http') ? profile.sns_instagram : `https://${profile.sns_instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Instagram className="h-5 w-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Instagram</span>
                  </a>
                )}
                {profile.sns_facebook && (
                  <a
                    href={profile.sns_facebook.startsWith('http') ? profile.sns_facebook : `https://${profile.sns_facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Facebook className="h-5 w-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                  </a>
                )}
                {profile.sns_linkedin && (
                  <a
                    href={profile.sns_linkedin.startsWith('http') ? profile.sns_linkedin : `https://${profile.sns_linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Linkedin className="h-5 w-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                  </a>
                )}
                {profile.sns_url && (
                  <a
                    href={profile.sns_url.startsWith('http') ? profile.sns_url : `https://${profile.sns_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <LinkIcon className="h-5 w-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">その他</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 留学ステータス */}
          {profile.languages && profile.languages.some((lang: string) => lang.startsWith('status:')) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">留学ステータス</h3>
              <div className="flex flex-wrap gap-2">
                <StudentStatusBadge 
                  languages={profile.languages}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* 使用言語 */}
          {profile.languages && profile.languages.some((language: string) => !language.startsWith('purpose:') && !language.startsWith('detail:') && !language.startsWith('status:')) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">使用言語</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages
                  .filter((language: string) => !language.startsWith('purpose:') && !language.startsWith('detail:') && !language.startsWith('status:'))
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">最近の投稿</h2>
          
          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-4">まだ投稿がありません</p>
              {isOwnProfile && (
                <Link href="/posts/new" className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  最初の投稿をする
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="block group">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:bg-white hover:shadow-lg hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${getCategoryColor(post.category)}`}>
                        {(() => {
                          const Icon = getCategoryIcon(post.category)
                          return <Icon className="h-3 w-3 text-white" />
                        })()}
                        {getCategoryLabel(post.category)}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">{formatDate(post.created_at)}</span>
                    </div>
                    {post.category === 'chat' ? (
                      <p className="text-gray-900 line-clamp-2 mb-4 leading-relaxed text-lg">{post.content}</p>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{post.title}</h3>
                        <p className="text-gray-600 line-clamp-2 mb-4 leading-relaxed">{post.content}</p>
                      </>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-5">
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
    </div>
  )
}
