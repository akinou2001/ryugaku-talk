'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Mail, Lock, Eye, EyeOff, User, Building2, GraduationCap, Briefcase, Shield } from 'lucide-react'
import type { AccountType } from '@/lib/supabase'

export default function SignUp() {
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [contactEmailError, setContactEmailError] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)
  
  // 組織アカウント用フィールド
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState('')
  const [contactPersonName, setContactPersonName] = useState('')
  const [contactPersonEmail, setContactPersonEmail] = useState('')
  const [contactPersonPhone, setContactPersonPhone] = useState('')
  
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  const isOrganizationAccount = accountType !== 'individual'

  // メールアドレスのバリデーション
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 既に登録済みのメールアドレスかチェック
  const checkEmailExists = async (emailAddress: string): Promise<boolean> => {
    if (!emailAddress || !validateEmail(emailAddress)) {
      return false
    }

    try {
      const normalizedEmail = emailAddress.trim().toLowerCase()
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking email:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    }
  }

  // 個人アカウントのメールアドレスチェック
  const handleEmailBlur = async () => {
    if (!email.trim()) {
      setEmailError('')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('有効なメールアドレスを入力してください')
      return
    }

    setCheckingEmail(true)
    setEmailError('')
    
    const exists = await checkEmailExists(email)
    if (exists) {
      setEmailError('このメールアドレスは既に登録されています。ログインページからログインしてください。')
    }
    
    setCheckingEmail(false)
  }

  // 組織アカウントの担当者メールアドレスチェック
  const handleContactEmailBlur = async () => {
    if (!contactPersonEmail.trim()) {
      setContactEmailError('')
      return
    }

    if (!validateEmail(contactPersonEmail)) {
      setContactEmailError('有効なメールアドレスを入力してください')
      return
    }

    setCheckingEmail(true)
    setContactEmailError('')
    
    const exists = await checkEmailExists(contactPersonEmail)
    if (exists) {
      setContactEmailError('このメールアドレスは既に登録されています。ログインページからログインしてください。')
    }
    
    setCheckingEmail(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    // 個人アカウントのバリデーション
    if (!isOrganizationAccount) {
      if (!email.trim()) {
        setError('メールアドレスを入力してください')
        setLoading(false)
        return
      }
      if (!validateEmail(email)) {
        setError('有効なメールアドレスを入力してください（例: user@example.com）')
        setLoading(false)
        return
      }
      if (emailError) {
        setError(emailError)
        setLoading(false)
        return
      }
      // 最終チェック
      const exists = await checkEmailExists(email)
      if (exists) {
        setError('このメールアドレスは既に登録されています。ログインページからログインしてください。')
        setLoading(false)
        return
      }
    }

    // 組織アカウントのバリデーション
    if (isOrganizationAccount) {
      if (!contactPersonName.trim()) {
        setError('担当者名を入力してください')
        setLoading(false)
        return
      }
      if (!organizationName.trim()) {
        setError('組織名を入力してください')
        setLoading(false)
        return
      }
      if (!contactPersonEmail.trim()) {
        setError('担当者メールアドレスを入力してください')
        setLoading(false)
        return
      }
      if (!validateEmail(contactPersonEmail)) {
        setError('有効な担当者メールアドレスを入力してください（例: contact@example.com）')
        setLoading(false)
        return
      }
      if (contactEmailError) {
        setError(contactEmailError)
        setLoading(false)
        return
      }
      // 最終チェック
      const exists = await checkEmailExists(contactPersonEmail)
      if (exists) {
        setError('このメールアドレスは既に登録されています。ログインページからログインしてください。')
        setLoading(false)
        return
      }
    }

    try {
      const organizationData = isOrganizationAccount ? {
        organization_name: organizationName,
        organization_type: organizationType,
        contact_person_name: contactPersonName,
        contact_person_email: contactPersonEmail,
        contact_person_phone: contactPersonPhone
      } : undefined

      // 組織アカウントの場合は担当者メールアドレスをログイン用メールアドレスとして使用
      const loginEmail = isOrganizationAccount ? contactPersonEmail : email
      const loginName = isOrganizationAccount ? contactPersonName : name

      await signUp(loginEmail, password, loginName, accountType, organizationData)
      
      // アカウント作成成功メッセージを表示
      // 注意：メール確認が必要な場合のみメールが送信される
      // 既存ユーザーの場合はエラーがスローされるはず
      setSuccess(true)
      setSuccessMessage('認証メールを送信しました。メールボックスをご確認ください。メールが届かない場合は、迷惑メールフォルダもご確認ください。')
      
      // 組織アカウントの場合は認証申請ページにリダイレクト（少し遅延を入れる）
      if (isOrganizationAccount) {
        setTimeout(() => {
          router.push('/verification/request')
        }, 3000)
      }
    } catch (error: any) {
      setError(error.message || 'アカウント作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      await signInWithGoogle()
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Googleログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'individual': return '個人'
      case 'educational': return '教育機関'
      case 'company': return '企業'
      case 'government': return '政府機関'
    }
  }

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'individual': return <User className="h-5 w-5" />
      case 'educational': return <GraduationCap className="h-5 w-5" />
      case 'company': return <Briefcase className="h-5 w-5" />
      case 'government': return <Shield className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <MessageCircle className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントを作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
              既存のアカウントにログイン
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    {successMessage}
                  </p>
                  {!isOrganizationAccount && (
                    <div className="mt-3">
                      <Link 
                        href="/auth/signin" 
                        className="text-sm font-medium text-green-700 hover:text-green-600 underline"
                      >
                        ログインページへ移動
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* アカウントタイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              アカウントタイプ
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['individual', 'educational', 'company', 'government'] as AccountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    accountType === type
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`${accountType === type ? 'text-primary-600' : 'text-gray-400'}`}>
                      {getAccountTypeIcon(type)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {getAccountTypeLabel(type)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {isOrganizationAccount && (
              <p className="mt-2 text-sm text-gray-500">
                組織アカウントは認証審査が必要です。審査完了まで通常1-3営業日かかります。
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* 個人アカウント用フィールド */}
            {!isOrganizationAccount && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    お名前
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="山田太郎"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailError('')
                      }}
                      onBlur={handleEmailBlur}
                      className={`input-field pl-10 ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="your@email.com"
                    />
                    {checkingEmail && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>
              </>
            )}

            {/* 組織アカウント用フィールド */}
            {isOrganizationAccount && (
              <>
                <div>
                  <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700">
                    担当者名 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="contactPersonName"
                      name="contactPersonName"
                      type="text"
                      required
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="山田太郎"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                    組織名 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="input-field pl-10"
                      placeholder={accountType === 'educational' ? "東京大学" : accountType === 'company' ? "株式会社○○" : "文部科学省"}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700">
                    組織種別
                  </label>
                  <input
                    id="organizationType"
                    name="organizationType"
                    type="text"
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="input-field"
                    placeholder={accountType === 'educational' ? "国立大学" : accountType === 'company' ? "IT企業" : "省庁"}
                  />
                </div>

                <div>
                  <label htmlFor="contactPersonEmail" className="block text-sm font-medium text-gray-700">
                    担当者メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="contactPersonEmail"
                      name="contactPersonEmail"
                      type="email"
                      required
                      value={contactPersonEmail}
                      onChange={(e) => {
                        setContactPersonEmail(e.target.value)
                        setContactEmailError('')
                      }}
                      onBlur={handleContactEmailBlur}
                      className={`input-field pl-10 ${contactEmailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="contact@example.com"
                    />
                    {checkingEmail && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                  {contactEmailError && (
                    <p className="mt-1 text-sm text-red-600">{contactEmailError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPersonPhone" className="block text-sm font-medium text-gray-700">
                    担当者電話番号
                  </label>
                  <input
                    id="contactPersonPhone"
                    name="contactPersonPhone"
                    type="tel"
                    value={contactPersonPhone}
                    onChange={(e) => setContactPersonPhone(e.target.value)}
                    className="input-field"
                    placeholder="03-1234-5678"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="6文字以上のパスワード"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="パスワードを再入力"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                利用規約
              </Link>
              および
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                プライバシーポリシー
              </Link>
              に同意します
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'アカウント作成中...' : success ? 'アカウント作成完了' : 'アカウントを作成'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでアカウント作成
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
