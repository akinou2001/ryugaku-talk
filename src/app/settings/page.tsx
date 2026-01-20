'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Settings, User, Lock, Bell, Shield, Trash2, Save, Eye, EyeOff, Mail, Phone, Building2, CheckCircle, FileText, Globe } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'verification' | 'notifications' | 'privacy' | 'delete'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // アカウント設定（登録時の情報を表示）
  const [accountData, setAccountData] = useState<{
    name: string
    email: string
    account_type: 'individual' | 'educational' | 'company' | 'government' | ''
    organization_name: string
    organization_type: string
    contact_person_name: string
    contact_person_email: string
    contact_person_phone: string
  }>({
    name: '',
    email: '',
    account_type: '',
    organization_name: '',
    organization_type: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: ''
  })

  // パスワード変更
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // 退会
  const [deleteConfirm, setDeleteConfirm] = useState({
    understand: false,
    dataLoss: false,
    permanent: false
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ownedCommunities, setOwnedCommunities] = useState<any[]>([])
  const [checkingCommunities, setCheckingCommunities] = useState(false)
  const [showCommunityTransferModal, setShowCommunityTransferModal] = useState(false)
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)
  const [transferTargetUserId, setTransferTargetUserId] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [communityMembers, setCommunityMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // 組織認証申請
  const [verificationData, setVerificationData] = useState({
    organization_name: '',
    official_email: '',
    website_url: '',
    message: ''
  })
  const [existingVerificationRequest, setExistingVerificationRequest] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // アカウントデータを読み込む
    loadAccountData()
    
    // 組織アカウントの場合は認証申請情報を読み込む
    if (user && user.account_type !== 'individual') {
      checkExistingVerificationRequest()
    }
    
    // コミュニティのオーナーシップを確認
    if (user) {
      checkOwnedCommunities()
    }
  }, [user, router])
  
  const checkOwnedCommunities = async () => {
    if (!user) return
    
    setCheckingCommunities(true)
    try {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('id, name, description')
        .eq('owner_id', user.id)
      
      if (error) {
        console.error('Error checking owned communities:', error)
        return
      }
      
      // 各コミュニティのメンバー数を取得
      const communitiesWithMemberCount = await Promise.all(
        (communities || []).map(async (community) => {
          const { count } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)
            .eq('status', 'approved')
          
          return {
            ...community,
            member_count: count || 0
          }
        })
      )
      
      setOwnedCommunities(communitiesWithMemberCount)
    } catch (error) {
      console.error('Error checking owned communities:', error)
    } finally {
      setCheckingCommunities(false)
    }
  }

  const loadAccountData = async () => {
    if (!user) return

    setAccountData({
      name: user.name || '',
      email: user.email || '',
      account_type: user.account_type || 'individual',
      organization_name: user.organization_name || '',
      organization_type: user.organization_type || '',
      contact_person_name: user.contact_person_name || '',
      contact_person_email: user.contact_person_email || '',
      contact_person_phone: user.contact_person_phone || ''
    })
  }

  const checkExistingVerificationRequest = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('organization_verification_requests')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing request:', error)
        return
      }

      if (data) {
        setExistingVerificationRequest(data)
        setVerificationData({
          organization_name: data.organization_name || user.organization_name || '',
          official_email: data.contact_person_email || user.contact_person_email || '',
          website_url: data.organization_url || user.organization_url || '',
          message: data.request_reason || ''
        })
      } else {
        // 既存の申請がない場合は、プロフィール情報から初期値を設定
        setVerificationData({
          organization_name: user.organization_name || '',
          official_email: user.contact_person_email || '',
          website_url: user.organization_url || '',
          message: ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    // バリデーション
    if (!verificationData.organization_name.trim()) {
      setError('組織名を入力してください')
      setLoading(false)
      return
    }

    if (!verificationData.official_email.trim()) {
      setError('公式メールアドレスを入力してください')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(verificationData.official_email)) {
      setError('有効なメールアドレスを入力してください')
      setLoading(false)
      return
    }

    try {
      // 既存の申請がある場合は更新、ない場合は新規作成
      if (existingVerificationRequest && existingVerificationRequest.status === 'pending') {
        // 既存の申請を更新（pendingの場合のみ）
        const { error: updateError } = await supabase
          .from('organization_verification_requests')
          .update({
            organization_name: verificationData.organization_name,
            contact_person_email: verificationData.official_email,
            organization_url: verificationData.website_url || null,
            request_reason: verificationData.message || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVerificationRequest.id)

        if (updateError) throw updateError
      } else {
        // 新規申請を作成
        const { error: insertError } = await supabase
          .from('organization_verification_requests')
          .insert({
            profile_id: user.id,
            account_type: user.account_type,
            organization_name: verificationData.organization_name,
            contact_person_email: verificationData.official_email,
            organization_url: verificationData.website_url || null,
            request_reason: verificationData.message || null,
            status: 'pending'
          })

        if (insertError) throw insertError
      }

      setSuccess('認証申請を送信しました。審査結果をお待ちください。')
      // 既存の申請情報を再取得
      await checkExistingVerificationRequest()
    } catch (error: any) {
      setError(error.message || '認証申請の送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    // バリデーション
    if (!passwordData.currentPassword) {
      setError('現在のパスワードを入力してください')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('新しいパスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('新しいパスワードが一致しません')
      setLoading(false)
      return
    }

    try {
      // 現在のパスワードを確認
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      })

      if (signInError) {
        throw new Error('現在のパスワードが正しくありません')
      }

      // パスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) throw updateError

      setSuccess('パスワードを変更しました')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      setError(error.message || 'パスワードの変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadCommunityMembers = async (communityId: string) => {
    if (!user) return

    setLoadingMembers(true)
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          user:profiles(id, name, email, icon_url)
        `)
        .eq('community_id', communityId)
        .eq('status', 'approved')
        .order('joined_at', { ascending: false })

      if (error) throw error

      setCommunityMembers(data || [])
    } catch (error: any) {
      console.error('Error loading community members:', error)
      setError('メンバー情報の取得に失敗しました')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleTransferCommunity = async (communityId: string, newOwnerId: string) => {
    if (!user || !newOwnerId.trim()) return

    setTransferring(true)
    setError('')
    setSuccess('')

    try {
      // 新しいオーナーが存在するか確認
      const { data: newOwner, error: ownerError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', newOwnerId.trim())
        .single()

      if (ownerError || !newOwner) {
        setError('指定されたユーザーが見つかりません')
        setTransferring(false)
        return
      }

      // コミュニティのオーナーを更新
      const { error: updateError } = await supabase
        .from('communities')
        .update({ owner_id: newOwnerId.trim() })
        .eq('id', communityId)
        .eq('owner_id', user.id) // セキュリティ: 現在のオーナーのみ更新可能

      if (updateError) throw updateError

      setSuccess(`${newOwner.name}さんにコミュニティのオーナー権限を移管しました`)
      await checkOwnedCommunities()
      setTimeout(() => {
        setShowCommunityTransferModal(false)
        setSelectedCommunityId(null)
        setTransferTargetUserId('')
        setCommunityMembers([])
        setSuccess('')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'コミュニティの移管に失敗しました')
    } finally {
      setTransferring(false)
    }
  }

  const handleDeleteCommunity = async (communityId: string) => {
    if (!user) return

    if (!confirm('このコミュニティを削除しますか？この操作は取り消せません。')) return

    setLoading(true)
    setError('')

    try {
      // コミュニティを削除（CASCADEで関連データも削除される）
      const { error: deleteError } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)
        .eq('owner_id', user.id) // セキュリティ: オーナーのみ削除可能

      if (deleteError) throw deleteError

      setSuccess('コミュニティを削除しました')
      await checkOwnedCommunities()
    } catch (error: any) {
      setError(error.message || 'コミュニティの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    if (!deleteConfirm.understand || !deleteConfirm.dataLoss || !deleteConfirm.permanent) {
      setError('すべての確認項目にチェックを入れてください')
      return
    }

    // 組織アカウントでコミュニティのオーナーがいる場合は退会不可
    if (user.account_type !== 'individual' && ownedCommunities.length > 0) {
      setError('コミュニティのオーナーであるため、退会できません。まずコミュニティの移管または削除を行ってください。')
      setShowDeleteModal(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      // セッショントークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('セッションが取得できませんでした。再度ログインしてください。')
        setLoading(false)
        return
      }

      // サーバーサイドAPI経由で認証ユーザーを削除
      const deleteUserResponse = await fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: user.id })
      })

      const deleteUserData = await deleteUserResponse.json()

      if (!deleteUserResponse.ok) {
        // 認証ユーザーの削除に失敗した場合は、エラーを表示して処理を中断
        setError(deleteUserData.error || '認証ユーザーの削除に失敗しました。')
        setLoading(false)
        return
      }

      // 認証ユーザーの削除が成功したら、プロフィールも削除
      // （CASCADEで自動削除される可能性があるが、念のため明示的に削除）
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (deleteError) {
        // プロフィールの削除に失敗しても、認証ユーザーは削除されているので続行
        console.error('Profile deletion error (ignored):', deleteError)
      }

      // ログアウト
      await signOut()
      router.push('/')
    } catch (error: any) {
      setError(error.message || '退会処理に失敗しました')
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">設定</h1>
            </div>
            <p className="text-gray-600">アカウント設定とプライバシー設定を管理できます</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* サイドバー */}
            <div className="lg:col-span-1">
              <nav className="card p-2 space-y-1">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'account'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>アカウント設定</span>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'password'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span>パスワード</span>
                </button>
                {user && user.account_type !== 'individual' && (
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'verification'
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>組織認証</span>
                    {existingVerificationRequest?.status === 'pending' && (
                      <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                        審査中
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>通知</span>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>プライバシー</span>
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'delete'
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>退会</span>
                </button>
              </nav>
            </div>

            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              {/* アカウント設定（登録時の情報を表示） */}
              {activeTab === 'account' && (
                <div className="card space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">アカウント設定</h2>
                    <p className="text-sm text-gray-600">登録時にご入力いただいた情報を表示しています。プロフィール情報の編集は<a href={`/profile/${user.id}/edit`} className="text-primary-600 hover:text-primary-700 underline">プロフィール編集</a>から行えます。</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        アカウントタイプ
                      </label>
                      <div className="input-field bg-gray-50">
                        {accountData.account_type === 'individual' ? '個人アカウント' :
                         accountData.account_type === 'educational' ? '教育機関アカウント' :
                         accountData.account_type === 'company' ? '企業アカウント' :
                         accountData.account_type === 'government' ? '政府機関アカウント' :
                         '不明'}
                      </div>
                      {/* 個人アカウントまたは未認証の組織アカウントの場合、組織認証申請へのリンクを表示 */}
                      {((accountData.account_type === 'individual' || accountData.account_type === '' || !accountData.account_type) || 
                        ((accountData.account_type === 'educational' || accountData.account_type === 'company' || accountData.account_type === 'government') && user && user.verification_status !== 'verified')) && (
                        <div className="mt-2">
                          <Link 
                            href="/verification/request" 
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            組織認証申請
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            {accountData.account_type === 'individual'
                              ? '個人アカウントから組織アカウント（教育機関・企業・政府機関）として認証を受けることができます'
                              : '組織アカウントとして認証を受けることで、コミュニティ作成などの機能がご利用いただけます'}
                          </p>
                        </div>
                      )}
                      {/* 認証済みの組織アカウントの場合、認証ステータスを表示 */}
                      {accountData.account_type !== 'individual' && user && user.verification_status === 'verified' && (
                        <div className="mt-2">
                          <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            認証済み
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            組織アカウントとして認証されています
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {accountData.account_type === 'individual' ? '名前' : '担当者名'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={accountData.name}
                          disabled
                          className="input-field pl-10 bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={accountData.email}
                          disabled
                          className="input-field pl-10 bg-gray-50"
                        />
                      </div>
                    </div>

                    {accountData.account_type !== 'individual' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            組織名
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={accountData.organization_name}
                              disabled
                              className="input-field pl-10 bg-gray-50"
                            />
                          </div>
                        </div>

                        {accountData.organization_type && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              組織タイプ
                            </label>
                            <div className="input-field bg-gray-50">
                              {accountData.organization_type}
                            </div>
                          </div>
                        )}

                        {accountData.contact_person_name && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              担当者名
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={accountData.contact_person_name}
                                disabled
                                className="input-field pl-10 bg-gray-50"
                              />
                            </div>
                          </div>
                        )}

                        {accountData.contact_person_email && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              担当者メールアドレス
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="email"
                                value={accountData.contact_person_email}
                                disabled
                                className="input-field pl-10 bg-gray-50"
                              />
                            </div>
                          </div>
                        )}

                        {accountData.contact_person_phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              担当者電話番号
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                value={accountData.contact_person_phone}
                                disabled
                                className="input-field pl-10 bg-gray-50"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* パスワード変更 */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordChange} className="card space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">パスワード変更</h2>

                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      現在のパスワード <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                        className="input-field pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      新しいパスワード <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={6}
                        className="input-field pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">6文字以上で入力してください</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      新しいパスワード（確認） <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        className="input-field pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? '変更中...' : 'パスワードを変更'}
                    </button>
                  </div>
                </form>
              )}

              {/* 組織認証 */}
              {activeTab === 'verification' && user && user.account_type !== 'individual' && (
                <form onSubmit={handleVerificationSubmit} className="card space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">組織認証申請</h2>
                    {existingVerificationRequest && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        existingVerificationRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                        existingVerificationRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {existingVerificationRequest.status === 'approved' ? '認証済み' :
                         existingVerificationRequest.status === 'rejected' ? '拒否' :
                         '審査中'}
                      </span>
                    )}
                  </div>

                  {existingVerificationRequest && (
                    <div className={`p-4 rounded-lg ${
                      existingVerificationRequest.status === 'approved' ? 'bg-green-50 border border-green-200' :
                      existingVerificationRequest.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                      'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className={`h-5 w-5 mt-0.5 ${
                          existingVerificationRequest.status === 'approved' ? 'text-green-600' :
                          existingVerificationRequest.status === 'rejected' ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {existingVerificationRequest.status === 'approved' ? '認証済み' :
                             existingVerificationRequest.status === 'rejected' ? '認証が拒否されました' :
                             '認証審査中'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {existingVerificationRequest.status === 'approved' ? 
                              '組織アカウントとして認証されています。コミュニティ作成などの組織用機能をご利用いただけます。' :
                             existingVerificationRequest.status === 'rejected' ? 
                              '認証が拒否されました。詳細はお問い合わせください。' :
                              '認証申請を提出しました。通常1-3営業日で審査が完了します。'}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            申請日: {new Date(existingVerificationRequest.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      組織アカウントとして認証を受けることで、コミュニティ作成や公式投稿などの機能がご利用いただけます。
                    </p>
                  </div>

                  {(!existingVerificationRequest || existingVerificationRequest.status === 'pending') && (
                    <>
                      <div>
                        <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 mb-2">
                          組織名 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="organization_name"
                            value={verificationData.organization_name}
                            onChange={(e) => setVerificationData({ ...verificationData, organization_name: e.target.value })}
                            required
                            className="input-field pl-10"
                            placeholder="例: 東京大学"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="official_email" className="block text-sm font-medium text-gray-700 mb-2">
                          公式メールアドレス <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="official_email"
                            value={verificationData.official_email}
                            onChange={(e) => setVerificationData({ ...verificationData, official_email: e.target.value })}
                            required
                            className="input-field pl-10"
                            placeholder="例: contact@university.ac.jp"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          組織の公式メールアドレスを入力してください
                        </p>
                      </div>

                      <div>
                        <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-2">
                          ウェブサイトURL（任意）
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="url"
                            id="website_url"
                            value={verificationData.website_url}
                            onChange={(e) => setVerificationData({ ...verificationData, website_url: e.target.value })}
                            className="input-field pl-10"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          申請理由・メッセージ（任意）
                        </label>
                        <div className="relative">
                          <div className="absolute top-3 left-3 pointer-events-none">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          <textarea
                            id="message"
                            value={verificationData.message}
                            onChange={(e) => setVerificationData({ ...verificationData, message: e.target.value })}
                            rows={4}
                            className="input-field pl-10"
                            placeholder="認証申請の理由や、組織についての説明を入力してください"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="btn-primary flex items-center">
                          <Save className="h-4 w-4 mr-2" />
                          {loading ? '送信中...' : existingVerificationRequest ? '申請を更新' : '認証申請を送信'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}

              {/* 通知設定 */}
              {activeTab === 'notifications' && (
                <div className="card space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">通知設定</h2>
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">通知設定機能は準備中です</p>
                  </div>
                </div>
              )}

              {/* プライバシー設定 */}
              {activeTab === 'privacy' && (
                <div className="card space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">プライバシー設定</h2>
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">プライバシー設定機能は準備中です</p>
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
                      プライバシーポリシーを確認
                    </Link>
                  </div>
                </div>
              )}

              {/* 退会 */}
              {activeTab === 'delete' && (
                <div className="card space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">退会</h2>

                  {/* 組織アカウントでコミュニティのオーナーがいる場合 */}
                  {user && user.account_type !== 'individual' && ownedCommunities.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                        <Building2 className="h-5 w-5 mr-2" />
                        コミュニティの管理が必要です
                      </h3>
                      <p className="text-sm text-yellow-800 mb-4">
                        あなたは{ownedCommunities.length}つのコミュニティのオーナーです。退会する前に、以下のいずれかの操作を行ってください：
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-800 mb-4 space-y-1">
                        <li>コミュニティのオーナー権限を他のメンバーに移管する</li>
                        <li>コミュニティを削除して運営を終了する</li>
                      </ul>
                      
                      <div className="space-y-3">
                        {ownedCommunities.map((community) => (
                          <div key={community.id} className="bg-white rounded-lg p-3 border border-yellow-300">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{community.name}</h4>
                              <span className="text-xs text-gray-500">
                                {community.member_count || 0}名のメンバー
                              </span>
                            </div>
                            {community.description && (
                              <p className="text-xs text-gray-600 mb-3">{community.description}</p>
                            )}
                            <div className="flex space-x-2">
                              <button
                                onClick={async () => {
                                  setSelectedCommunityId(community.id)
                                  setShowCommunityTransferModal(true)
                                  await loadCommunityMembers(community.id)
                                }}
                                className="btn-secondary text-sm"
                              >
                                オーナー権限を移管
                              </button>
                              <button
                                onClick={() => handleDeleteCommunity(community.id)}
                                className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                              >
                                コミュニティを削除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">危険な操作</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 mb-4">
                        退会すると、すべてのデータが永久に削除され、復元できません。
                        この操作は取り消せません。
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={user && user.account_type !== 'individual' && ownedCommunities.length > 0}
                        className="btn-secondary bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        退会する
                      </button>
                      {user && user.account_type !== 'individual' && ownedCommunities.length > 0 && (
                        <p className="text-xs text-red-700 mt-2">
                          コミュニティの管理を完了してから退会できます
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 退会モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">退会</h3>
            <p className="text-gray-600 mb-4">
              この操作は取り消せません。アカウントとすべてのデータが永久に削除されます。
            </p>
            
            <div className="space-y-3 mb-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConfirm.understand}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, understand: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  退会すると、すべての投稿、コメント、メッセージなどのデータが削除されることを理解しました
                </span>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConfirm.dataLoss}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, dataLoss: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  データの損失は取り戻せないことを理解しました
                </span>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConfirm.permanent}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, permanent: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  この操作が永久的で取り消せないことを理解しました
                </span>
              </label>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirm({
                    understand: false,
                    dataLoss: false,
                    permanent: false
                  })
                  setError('')
                }}
                className="btn-secondary flex-1"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || !deleteConfirm.understand || !deleteConfirm.dataLoss || !deleteConfirm.permanent}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '退会処理中...' : '退会する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* コミュニティ移管モーダル */}
      {showCommunityTransferModal && selectedCommunityId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">コミュニティのオーナー権限を移管</h3>
            <p className="text-gray-600 mb-4">
              新しいオーナーを選択してください。この操作は取り消せません。
            </p>
            
            {loadingMembers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">メンバーを読み込み中...</p>
              </div>
            ) : communityMembers.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいオーナーを選択 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {communityMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setTransferTargetUserId(member.user_id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        transferTargetUserId === member.user_id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {member.user?.icon_url ? (
                            <img
                              src={member.user.icon_url}
                              alt={member.user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{member.user?.name || '不明'}</p>
                          <p className="text-xs text-gray-500 truncate">{member.user?.email || '不明'}</p>
                        </div>
                        {transferTargetUserId === member.user_id && (
                          <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  このコミュニティには承認済みメンバーがいません。ユーザーIDを直接入力してください。
                </p>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新しいオーナーのユーザーID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={transferTargetUserId}
                    onChange={(e) => setTransferTargetUserId(e.target.value)}
                    placeholder="ユーザーID（UUID）"
                    className="input-field w-full"
                  />
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {success}
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowCommunityTransferModal(false)
                  setSelectedCommunityId(null)
                  setTransferTargetUserId('')
                  setCommunityMembers([])
                  setError('')
                  setSuccess('')
                }}
                className="btn-secondary flex-1"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleTransferCommunity(selectedCommunityId, transferTargetUserId)}
                disabled={transferring || !transferTargetUserId.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {transferring ? '移管中...' : '移管する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

