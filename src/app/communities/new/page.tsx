'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { createCommunity } from '@/lib/community'
import { uploadFile, validateFileType, validateFileSize, FILE_TYPES } from '@/lib/storage'
import { ArrowLeft, Save, X, Image as ImageIcon } from 'lucide-react'

export default function NewCommunity() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
    community_type: (user?.account_type === 'individual' ? 'guild' : 'official') as 'guild' | 'official'
  })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルタイプとサイズを検証
      if (!validateFileType(file, FILE_TYPES.POST_IMAGE)) {
        setError('画像はJPEG、PNG、GIF、WebP形式のみ対応しています')
        return
      }
      if (!validateFileSize(file, 5)) { // 5MB制限
        setError('画像は5MB以下である必要があります')
        return
      }
      
      setCoverImage(file)
      // プレビューを作成
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleRemoveCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setLoading(true)
    setError('')

    try {
      // カバー画像をアップロード
      let coverImageUrl: string | undefined = undefined
      if (coverImage) {
        setImageUploading(true)
        try {
          coverImageUrl = await uploadFile(coverImage, 'community-covers', `community-cover-${user.id}`)
        } catch (error: any) {
          setError(error.message || '画像のアップロードに失敗しました')
          setLoading(false)
          setImageUploading(false)
          return
        } finally {
          setImageUploading(false)
        }
      }

      const community = await createCommunity(
        formData.name,
        formData.description || undefined,
        coverImageUrl,
        undefined, // icon_urlは不要
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

          {/* カバー画像 */}
          <div>
            <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
              カバー画像（任意）
            </label>
            <div className="space-y-2">
              <input
                type="file"
                id="cover_image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleCoverImageChange}
                className="input-field"
                disabled={imageUploading}
              />
              {coverImagePreview && (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="カバー画像プレビュー"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                対応形式: JPEG, PNG, GIF, WebP（5MB以下）
              </p>
            </div>
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
                ギルドでは、メンバーがクエストを投稿し、クリアするとポイントを獲得できます。
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


