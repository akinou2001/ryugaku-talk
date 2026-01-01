'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Building2, Mail, Phone, Globe, FileText, ArrowLeft, CheckCircle, User } from 'lucide-react'
import Link from 'next/link'

export default function VerificationRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [existingRequest, setExistingRequest] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_person_name: '',
    official_email: '',
    website_url: '',
    message: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // 組織アカウントでない場合はリダイレクト
    if (user.account_type === 'individual') {
      router.push('/')
      return
    }

    // 既存の申請を確認
    checkExistingRequest()
  }, [user, router])

  const checkExistingRequest = async () => {
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
        setExistingRequest(data)
        // 既存の申請がある場合はフォームに値を設定
        setFormData({
          organization_name: data.organization_name || user.organization_name || '',
          contact_person_name: data.contact_person_name || user.contact_person_name || '',
          official_email: data.contact_person_email || user.contact_person_email || '',
          website_url: data.organization_url || user.organization_url || '',
          message: data.request_reason || ''
        })
      } else if (user) {
        // 既存の申請がない場合、プロフィール情報をデフォルト値として設定
        setFormData({
          organization_name: user.organization_name || '',
          contact_person_name: user.contact_person_name || '',
          official_email: user.contact_person_email || '',
          website_url: user.organization_url || '',
          message: ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess(false)

    // バリデーション
    if (!formData.organization_name.trim()) {
      setError('組織名を入力してください')
      setLoading(false)
      return
    }

    if (!formData.contact_person_name.trim()) {
      setError('担当者名を入力してください')
      setLoading(false)
      return
    }

    if (!formData.official_email.trim()) {
      setError('公式メールアドレスを入力してください')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.official_email)) {
      setError('有効なメールアドレスを入力してください')
      setLoading(false)
      return
    }

    try {
      // 既存の申請がある場合は更新、ない場合は新規作成
      if (existingRequest && existingRequest.status === 'pending') {
        // 既存の申請を更新（pendingの場合のみ）
        const { error: updateError } = await supabase
          .from('organization_verification_requests')
          .update({
            organization_name: formData.organization_name,
            contact_person_name: formData.contact_person_name,
            contact_person_email: formData.official_email,
            organization_url: formData.website_url || null,
            request_reason: formData.message || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRequest.id)

        if (updateError) throw updateError
        
        // profilesテーブルのverification_statusを更新
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ verification_status: 'pending' })
          .eq('id', user.id)

        if (profileUpdateError) {
          console.error('Error updating profile verification status:', profileUpdateError)
          // エラーを無視（申請は成功しているため）
        }
      } else {
        // 新規申請を作成
        const { error: insertError } = await supabase
          .from('organization_verification_requests')
          .insert({
            profile_id: user.id,
            account_type: user.account_type,
            organization_name: formData.organization_name,
            contact_person_name: formData.contact_person_name,
            contact_person_email: formData.official_email,
            organization_url: formData.website_url || null,
            request_reason: formData.message || null,
            status: 'pending'
          })

        if (insertError) throw insertError
        
        // profilesテーブルのverification_statusを'pending'に更新
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ verification_status: 'pending' })
          .eq('id', user.id)

        if (profileUpdateError) {
          console.error('Error updating profile verification status:', profileUpdateError)
          // エラーを無視（申請は成功しているため）
        }
      }

      setSuccess(true)
      // 既存の申請情報を再取得
      await checkExistingRequest()
      
      // プロフィールページにリダイレクト（申請状態を表示するため）
      setTimeout(() => {
        router.push(`/profile/${user.id}`)
      }, 1500)
    } catch (error: any) {
      setError(error.message || '認証申請の送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!user || user.account_type === 'individual') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            {user && (
              <Link
                href={`/profile/${user.id}`}
                className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                プロフィールに戻る
              </Link>
            )}
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">組織認証申請</h1>
            </div>
            <p className="text-gray-600">
              組織アカウントとして認証を受けることで、コミュニティ作成や公式投稿などの機能がご利用いただけます。
            </p>
          </div>

          {/* 既存の申請状態 */}
          {existingRequest && (
            <div className={`card mb-6 ${
              existingRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
              existingRequest.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start space-x-3">
                <CheckCircle className={`h-5 w-5 mt-0.5 ${
                  existingRequest.status === 'approved' ? 'text-green-600' :
                  existingRequest.status === 'rejected' ? 'text-red-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {existingRequest.status === 'approved' ? '認証済み' :
                     existingRequest.status === 'rejected' ? '認証が拒否されました' :
                     '認証審査中'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {existingRequest.status === 'approved' ? 
                      '組織アカウントとして認証されています。組織用機能をご利用いただけます。' :
                     existingRequest.status === 'rejected' ? 
                      '認証が拒否されました。詳細はお問い合わせください。' :
                      '認証申請を提出しました。通常1-3営業日で審査が完了します。'}
                  </p>
                  <p className="text-xs text-gray-500">
                    申請日: {new Date(existingRequest.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* フォーム */}
          {(!existingRequest || existingRequest.status === 'pending') && (
            <form onSubmit={handleSubmit} className="card space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                  認証申請を送信しました。審査結果をお待ちください。
                </div>
              )}

              {/* 組織名 */}
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
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="例: 東京大学"
                  />
                </div>
              </div>

              {/* 担当者名 */}
              <div>
                <label htmlFor="contact_person_name" className="block text-sm font-medium text-gray-700 mb-2">
                  担当者名 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="contact_person_name"
                    name="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="例: 山田太郎"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  認証申請の担当者名を入力してください
                </p>
              </div>

              {/* 公式メールアドレス */}
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
                    name="official_email"
                    value={formData.official_email}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="例: contact@university.ac.jp"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  組織の公式メールアドレスを入力してください
                </p>
              </div>

              {/* ウェブサイトURL */}
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
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* メッセージ */}
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
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="input-field pl-10"
                    placeholder="認証申請の理由や、組織についての説明を入力してください"
                  />
                </div>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end space-x-4">
                {user && (
                  <Link href={`/profile/${user.id}`} className="btn-secondary">
                    キャンセル
                  </Link>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? '送信中...' : existingRequest ? '申請を更新' : '認証申請を送信'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

