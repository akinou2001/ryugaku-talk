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
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    account_type: '' as 'individual' | 'educational' | 'company' | 'government' | '',
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
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
  }, [user, router])

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

  const handleDeleteAccount = async () => {
    if (!user) return
    if (deleteConfirm !== '退会') {
      setError('「退会」と入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      // プロフィールを削除（CASCADEで関連データも削除される）
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (deleteError) throw deleteError

      // 認証ユーザーを削除
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
      
      // admin APIが使えない場合は、ユーザーにログアウトしてもらう
      if (authDeleteError) {
        console.error('Auth user deletion error:', authDeleteError)
        // プロフィールは削除されたので、ログアウトしてから手動で削除してもらう
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

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">危険な操作</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 mb-4">
                        退会すると、すべてのデータが永久に削除され、復元できません。
                        この操作は取り消せません。
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="btn-secondary bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        退会する
                      </button>
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
            <p className="text-sm text-gray-600 mb-4">
              退会を確認するには、「<strong>退会</strong>」と入力してください。
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="退会"
              className="input-field mb-4"
            />
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirm('')
                  setError('')
                }}
                className="btn-secondary flex-1"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== '退会'}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50"
              >
                {loading ? '退会処理中...' : '退会する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

