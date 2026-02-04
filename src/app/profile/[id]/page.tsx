'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Post, UserScore } from '@/lib/supabase'
import { getUserScore } from '@/lib/quest'
import { User as UserIcon, MapPin, GraduationCap, Calendar, MessageSquare, Edit, Settings, Send, Building2, Heart, HelpCircle, BookOpen, MessageCircle, Mail, Twitter, Instagram, Facebook, Linkedin, Link as LinkIcon, MoreVertical, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { StudentStatusBadge } from '@/components/StudentStatusBadge'
import { getUniversityById, type University } from '@/lib/universities'
import type { UserUniversity, UserStudyAbroadUniversity } from '@/lib/supabase'

export default function Profile() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [userScore, setUserScore] = useState<UserScore | null>(null)
  const [verificationRequest, setVerificationRequest] = useState<any>(null)
  const [userUniversities, setUserUniversities] = useState<UserUniversity[]>([])
  const [userStudyAbroadUniversities, setUserStudyAbroadUniversities] = useState<UserStudyAbroadUniversity[]>([])
  const [displayOrganization, setDisplayOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // ケバブメニュー
  const [showKebabMenu, setShowKebabMenu] = useState(false)
  const kebabMenuRef = useRef<HTMLDivElement>(null)

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
      
      // 複数所属大学を取得
      const { data: userUnisData } = await supabase
        .from('user_universities')
        .select(`
          *,
          university:universities(
            id,
            name_ja,
            name_en,
            country_code,
            continent:continents(name_ja)
          )
        `)
        .eq('user_id', userId)
        .order('display_order', { ascending: true })
      
      if (userUnisData && userUnisData.length > 0) {
        setUserUniversities(userUnisData as UserUniversity[])
      } else {
        // 後方互換性: 既存の単一大学データを取得
      if (data.university_id) {
        const { data: uniData } = await getUniversityById(data.university_id)
        if (uniData) {
            setUserUniversities([{
              id: 'legacy',
              user_id: userId,
              university_id: uniData.id,
              university: {
                id: uniData.id,
                name_ja: uniData.name_ja || null,
                name_en: uniData.name_en || null,
                country_code: uniData.country_code || null,
                continent: uniData.continent ? { name_ja: uniData.continent.name_ja || null } : null
              },
              start_date: data.university_start_date || null,
              end_date: data.university_end_date || null,
              display_order: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
          }
        }
      }
      
      // 複数留学先大学を取得
      const { data: userStudyAbroadUnisData } = await supabase
        .from('user_study_abroad_universities')
          .select(`
            *,
          university:universities(
            id,
            name_ja,
            name_en,
            country_code,
            continent:continents(name_ja)
          )
          `)
        .eq('user_id', userId)
        .order('display_order', { ascending: true })
      
      if (userStudyAbroadUnisData && userStudyAbroadUnisData.length > 0) {
        setUserStudyAbroadUniversities(userStudyAbroadUnisData as UserStudyAbroadUniversity[])
      } else if (data.study_abroad_university_id) {
        // 後方互換性: 既存の単一留学先大学データを取得
        const { data: uniData } = await getUniversityById(data.study_abroad_university_id)
        if (uniData) {
          setUserStudyAbroadUniversities([{
            id: 'legacy',
            user_id: userId,
            university_id: uniData.id,
            university: {
              id: uniData.id,
              name_ja: uniData.name_ja || null,
              name_en: uniData.name_en || null,
              country_code: uniData.country_code || null,
              continent: uniData.continent ? { name_ja: uniData.continent.name_ja || null } : null
            },
            start_date: data.study_abroad_start_date || null,
            end_date: data.study_abroad_end_date || null,
            display_order: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        }
      }
      
      // 表示組織を取得
      if (data.display_organization_id) {
        const { data: orgData } = await supabase
          .from('profiles')
          .select('id, name, organization_name, verification_status')
          .eq('id', data.display_organization_id)
          .single()
        if (orgData) {
          setDisplayOrganization(orgData)
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
        
        {/* プロフィールヘッダー */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 ${isOrganizationAccount ? 'border-l-4 border-l-blue-500' : ''}`}>
          <div className="relative mb-6">
            <div className="flex items-center space-x-4">
              <UserAvatar 
                iconUrl={profile.icon_url} 
                name={profile.name} 
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {/* 画面が大きい時：AccountBadgeを表示 */}
                  <div className="hidden sm:block">
                  <AccountBadge 
                    accountType={profile.account_type} 
                    verificationStatus={profile.verification_status}
                    organizationName={profile.organization_name}
                    isOperator={profile.is_operator}
                    size="md"
                  />
                  </div>
                  {/* 画面が小さい時：CheckCircleマークを表示（運営のみ） */}
                  {profile.is_operator && profile.verification_status === 'verified' && (
                    <CheckCircle className={`h-5 w-5 sm:hidden text-purple-600`} />
                  )}
                  {/* 画面が小さい時：CheckCircleマークを表示（組織アカウント） */}
                  {!profile.is_operator && profile.account_type && profile.account_type !== 'individual' && profile.verification_status === 'verified' && (
                    <CheckCircle className={`h-5 w-5 sm:hidden text-[#B39855]`} />
                  )}
                </div>
              </div>
            </div>
            
            {/* ケバブメニュー（右上に固定） */}
            <div className="absolute top-0 right-0" ref={kebabMenuRef}>
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setShowKebabMenu(!showKebabMenu)}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    title="メニュー"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {showKebabMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <Link
                          href={`/profile/${profile.id}/edit`}
                          onClick={() => setShowKebabMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>編集</span>
                  </Link>
                  {profile.account_type === 'individual' && (
                    <>
                            <Link
                              href="/verification/request"
                              onClick={() => setShowKebabMenu(false)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Building2 className="h-4 w-4" />
                              <span>組織認証申請</span>
                      </Link>
                            <Link
                              href="/organization/invites"
                              onClick={() => setShowKebabMenu(false)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Mail className="h-4 w-4" />
                              <span>組織招待</span>
                      </Link>
                    </>
                  )}
                  {profile.account_type !== 'individual' && profile.is_organization_owner && profile.verification_status === 'verified' && (
                          <Link
                            href="/organization/manage"
                            onClick={() => setShowKebabMenu(false)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Building2 className="h-4 w-4" />
                            <span>組織管理</span>
                    </Link>
                  )}
                  {profile.account_type !== 'individual' && !profile.is_organization_owner && (
                          <Link
                            href="/organization/invites"
                            onClick={() => setShowKebabMenu(false)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Mail className="h-4 w-4" />
                            <span>組織招待</span>
                    </Link>
                  )}
                        <Link
                          href="/settings"
                          onClick={() => setShowKebabMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Settings className="h-4 w-4" />
                          <span>設定</span>
                  </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : currentUser && (
                <Link href={`/chat/${profile.id}`} className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">メッセージを送る</span>
                  <span className="sm:hidden">メッセージ</span>
                </Link>
              )}
            </div>
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3 md:col-span-2">
              {/* 組織アカウント情報 */}
              {profile.account_type !== 'individual' && (
                <>
                  {/* 表示組織（display_organization_idが設定されている場合はその組織、そうでない場合は元の優先ロジック） */}
                  {(displayOrganization?.organization_name || profile.organization_name) && (
                    <div className="flex items-start space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-gray-600 whitespace-nowrap">組織名:</span>
                          <span className="font-medium text-gray-900">
                            {displayOrganization?.organization_name || profile.organization_name}
                          </span>
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
              {/* 所属大学（複数表示） */}
              {userUniversities.length > 0 && (
                <div className="space-y-3">
                  {userUniversities.map((userUni, index) => (
                    <div key={userUni.id} className="flex items-start space-x-2">
                  <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                          <span className="text-gray-600 whitespace-nowrap">
                            {index === 0 ? '所属大学:' : `所属大学 ${index + 1}:`}
                          </span>
                      <span className="font-medium text-gray-900">
                            {userUni.university?.name_ja || userUni.university?.name_en || '大学名不明'}
                      </span>
                          {userUni.university?.name_ja && userUni.university?.name_en && (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                              ({userUni.university.name_en})
                        </span>
                      )}
                          {userUni.university?.country_code && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium whitespace-nowrap">
                                {userUni.university.country_code}
                          </span>
                              {userUni.university.continent?.name_ja && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium whitespace-nowrap">
                                  {userUni.university.continent.name_ja}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                        {/* 在籍期間 */}
                        {(userUni.start_date || userUni.end_date) && (
                          <div className="mt-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {userUni.start_date && (
                              <span>{new Date(userUni.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                            )}
                            {userUni.start_date && userUni.end_date && <span> ～ </span>}
                            {userUni.end_date ? (
                              <span>{new Date(userUni.end_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                            ) : userUni.start_date ? (
                              <span>（現在在籍中）</span>
                            ) : null}
                          </div>
                        )}
                  </div>
                    </div>
                  ))}
                </div>
              )}
              {/* 留学先大学（複数表示） */}
              {userStudyAbroadUniversities.length > 0 && (
                <div className="space-y-3">
                  {userStudyAbroadUniversities.map((userUni, index) => (
                    <div key={userUni.id} className="flex items-start space-x-2">
                  <GraduationCap className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                          <span className="text-gray-600 whitespace-nowrap">
                            {index === 0 ? '留学先大学:' : `留学先大学 ${index + 1}:`}
                          </span>
                      <span className="font-medium text-gray-900">
                            {userUni.university?.name_ja || userUni.university?.name_en || '大学名不明'}
                      </span>
                          {userUni.university?.name_ja && userUni.university?.name_en && (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                              ({userUni.university.name_en})
                        </span>
                      )}
                          {userUni.university?.country_code && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium whitespace-nowrap">
                                {userUni.university.country_code}
                        </span>
                              {userUni.university.continent?.name_ja && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium whitespace-nowrap">
                                  {userUni.university.continent.name_ja}
                          </span>
                        )}
                      </div>
                          )}
                    </div>
                        {/* 滞在期間 */}
                        {(userUni.start_date || userUni.end_date) && (
                          <div className="mt-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {userUni.start_date && (
                              <span>{new Date(userUni.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                            )}
                            {userUni.start_date && userUni.end_date && <span> ～ </span>}
                            {userUni.end_date ? (
                              <span>{new Date(userUni.end_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                            ) : userUni.start_date ? (
                              <span>（現在滞在中）</span>
                            ) : null}
                </div>
              )}
            </div>
                  </div>
                  ))}
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
