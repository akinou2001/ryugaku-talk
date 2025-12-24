'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { createCommunity } from '@/lib/community'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function NewCommunity() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cover_image_url: '',
    icon_url: '',
    visibility: 'public' as 'public' | 'private',
    community_type: (user?.account_type === 'individual' ? 'guild' : 'official') as 'guild' | 'official'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setLoading(true)
    setError('')

    try {
      const community = await createCommunity(
        formData.name,
        formData.description || undefined,
        formData.cover_image_url || undefined,
        formData.icon_url || undefined,
        formData.visibility,
        formData.community_type
      )

      router.push(`/communities/${community.id}`)
    } catch (error: any) {
      setError(error.message || 'コミュニティの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-6">コミュニティを作成するにはログインしてください。</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn-primary"
            >
              ログイン
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="btn-secondary"
            >
              新規登録
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 個人アカウントはギルドを作成可能、組織アカウントは公式コミュニティを作成可能
  const canCreateGuild = user && user.account_type === 'individual'
  const canCreateOfficialCommunity = user && 
    user.account_type !== 'individual' && 
    user.verification_status === 'verified'

  if (!canCreateGuild && !canCreateOfficialCommunity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {user && user.account_type !== 'individual' && user.verification_status !== 'verified'
              ? '認証が必要です'
              : 'ログインが必要です'}
          </h1>
          <p className="text-gray-600 mb-6">
            {user && user.account_type !== 'individual' && user.verification_status !== 'verified'
              ? '公式コミュニティを作成するには、認証済みの組織アカウントが必要です。'
              : 'コミュニティを作成するにはログインしてください。'}
          </p>
          <button
            onClick={() => router.push('/communities')}
            className="btn-primary"
          >
            コミュニティ一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {formData.community_type === 'guild' ? '新規ギルド' : '新規公式コミュニティ'}
            </h1>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* コミュニティ名 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              コミュニティ名 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="例: 東京大学 留学支援室"
              className="input-field"
            />
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="コミュニティの説明を入力してください"
              className="input-field"
            />
          </div>

          {/* カバー画像URL */}
          <div>
            <label htmlFor="cover_image_url" className="block text-sm font-medium text-gray-700 mb-2">
              カバー画像URL（任意）
            </label>
            <input
              type="url"
              id="cover_image_url"
              name="cover_image_url"
              value={formData.cover_image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="input-field"
            />
          </div>

          {/* アイコンURL */}
          <div>
            <label htmlFor="icon_url" className="block text-sm font-medium text-gray-700 mb-2">
              アイコンURL（任意）
            </label>
            <input
              type="url"
              id="icon_url"
              name="icon_url"
              value={formData.icon_url}
              onChange={handleChange}
              placeholder="https://example.com/icon.jpg"
              className="input-field"
            />
          </div>

          {/* コミュニティタイプ（個人アカウントのみ表示） */}
          {user && user.account_type === 'individual' && (
            <div>
              <label htmlFor="community_type" className="block text-sm font-medium text-gray-700 mb-2">
                コミュニティタイプ
              </label>
              <select
                id="community_type"
                name="community_type"
                value={formData.community_type}
                onChange={handleChange}
                className="input-field"
                disabled
              >
                <option value="guild">ギルド（個人アカウント）</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                ギルドでは、メンバーがクエストを投稿し、クリアするとキャンドルを獲得できます。
              </p>
            </div>
          )}

          {/* 公開設定 */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
              公開設定
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="input-field"
            >
              <option value="public">公開（誰でも検索可能）</option>
              <option value="private">非公開（URLを知っている人のみ）</option>
            </select>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


