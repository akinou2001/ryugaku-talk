'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { createCommunity } from '@/lib/community'
import { uploadFile, validateFileType, validateFileSize, FILE_TYPES } from '@/lib/storage'
import { DEFAULT_COMMUNITY_COVERS } from '@/config/theme-config'
import { ArrowLeft, Save, X, Image as ImageIcon } from 'lucide-react'
import { TIMEZONE_GROUPS } from '@/lib/timezone'

export default function NewCommunity() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
    community_type: (user?.account_type === 'individual' ? 'guild' : 'official') as 'guild' | 'official',
    timezone: ''
  })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [selectedDefaultCover, setSelectedDefaultCover] = useState<string | null>(null)
  const [iconImage, setIconImage] = useState<File | null>(null)
  const [iconImagePreview, setIconImagePreview] = useState<string | null>(null)
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
      setSelectedDefaultCover(null) // デフォルト選択を解除
      // プレビューを作成
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleSelectDefaultCover = (coverPath: string) => {
    setSelectedDefaultCover(coverPath)
    setCoverImage(null) // アップロードファイルを解除
    setCoverImagePreview(coverPath) // デフォルト写真のパスをプレビューに設定
    setError('')
  }

  const handleRemoveCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
    setSelectedDefaultCover(null)
  }

  const handleIconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setIconImage(file)
      // プレビューを作成
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleRemoveIconImage = () => {
    setIconImage(null)
    setIconImagePreview(null)
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
      // カバー画像をアップロードまたはデフォルト写真を設定
      let coverImageUrl: string | undefined = undefined
      if (coverImage) {
        // ファイルアップロードの場合
        setImageUploading(true)
        try {
          coverImageUrl = await uploadFile(coverImage, 'community-covers', `community-cover-${user.id}`)
        } catch (error: any) {
          setError(error.message || 'カバー画像のアップロードに失敗しました')
          setLoading(false)
          setImageUploading(false)
          return
        } finally {
          setImageUploading(false)
        }
      } else if (selectedDefaultCover) {
        // デフォルト写真を選択した場合
        coverImageUrl = selectedDefaultCover
      }

      // アイコン画像をアップロード
      let iconImageUrl: string | undefined = undefined
      if (iconImage) {
        setImageUploading(true)
        try {
          iconImageUrl = await uploadFile(iconImage, 'community-icons', `community-icon-${user.id}`)
        } catch (error: any) {
          setError(error.message || 'アイコン画像のアップロードに失敗しました')
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
        iconImageUrl,
        formData.visibility,
        formData.community_type,
        formData.timezone || undefined
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

  // 個人アカウントはサークルを作成可能、組織アカウントは公式コミュニティを作成可能
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
              {formData.community_type === 'guild' ? '新規サークル' : '新規公式コミュニティ'}
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

          {/* アイコン画像 */}
          <div>
            <label htmlFor="icon_image" className="block text-sm font-medium text-gray-700 mb-2">
              アイコン画像（任意）
            </label>
            <div className="space-y-2">
              <input
                type="file"
                id="icon_image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleIconImageChange}
                className="input-field"
                disabled={imageUploading}
              />
              {iconImagePreview && (
                <div className="relative inline-block">
                  <img
                    src={iconImagePreview}
                    alt="アイコン画像プレビュー"
                    className="w-24 h-24 object-cover rounded-full border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveIconImage}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                対応形式: JPEG, PNG, GIF, WebP（5MB以下、推奨サイズ: 正方形）
              </p>
            </div>
          </div>

          {/* カバー画像 */}
          <div>
            <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
              カバー画像（任意）
            </label>
            <div className="space-y-4">
              {/* ファイルアップロード */}
              <div>
                <label htmlFor="cover_image" className="block text-xs font-medium text-gray-600 mb-2">
                  画像をアップロード
                </label>
              <input
                type="file"
                id="cover_image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleCoverImageChange}
                className="input-field"
                disabled={imageUploading}
              />
                <p className="text-xs text-gray-500 mt-1">
                  対応形式: JPEG, PNG, GIF, WebP（5MB以下）
                </p>
              </div>

              {/* デフォルト写真の選択 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  デフォルト写真から選択
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {DEFAULT_COMMUNITY_COVERS.map((coverPath, index) => {
                    const isSelected = selectedDefaultCover === coverPath
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectDefaultCover(coverPath)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all bg-gray-100 ${
                          isSelected
                            ? 'border-primary-600 ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={coverPath}
                          alt={`デフォルトカバー ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 画像が読み込めない場合はプレースホルダーを表示
                            const target = e.currentTarget
                            target.style.display = 'none'
                            const placeholder = target.parentElement?.querySelector('.image-placeholder')
                            if (placeholder) {
                              (placeholder as HTMLElement).style.display = 'flex'
                            }
                          }}
                        />
                        <div className="image-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300" style={{ display: 'none' }}>
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary-600 bg-opacity-20 flex items-center justify-center z-10">
                            <div className="bg-primary-600 text-white rounded-full p-1">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* プレビュー */}
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
                <option value="guild">サークル（個人アカウント）</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                サークルでは、メンバーがクエストを投稿し、クリアするとポイントを獲得できます。
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

          {/* タイムゾーン */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              タイムゾーン（任意）
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">未設定</option>
              {TIMEZONE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              設定すると、コミュニティページに現地時刻が表示されます
            </p>
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


