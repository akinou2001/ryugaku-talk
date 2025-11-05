'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'
import { ArrowLeft, Save, X, User as UserIcon } from 'lucide-react'

export default function EditProfile() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    study_abroad_destination: '',
    major: '',
    bio: '',
    languages: [] as string[]
  })

  const [newLanguage, setNewLanguage] = useState('')

  useEffect(() => {
    if (user && user.id === userId) {
      fetchProfile()
    } else {
      router.push('/')
    }
  }, [user, userId, router])

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

      setFormData({
        name: data.name || '',
        university: data.university || '',
        study_abroad_destination: data.study_abroad_destination || '',
        major: data.major || '',
        bio: data.bio || '',
        languages: data.languages || []
      })
    } catch (error: any) {
      setError(error.message || 'プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          university: formData.university || null,
          study_abroad_destination: formData.study_abroad_destination || null,
          major: formData.major || null,
          bio: formData.bio || null,
          languages: formData.languages,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      router.push(`/profile/${userId}`)
    } catch (error: any) {
      setError(error.message || 'プロフィールの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }))
      setNewLanguage('')
    }
  }

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.id !== userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-6">このページにアクセスする権限がありません。</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">プロフィール編集</h1>
          </div>
        </div>

        {/* 編集フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 基本情報 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  お名前 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
                  大学
                </label>
                <input
                  type="text"
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="東京大学"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="study_abroad_destination" className="block text-sm font-medium text-gray-700 mb-2">
                  留学先
                </label>
                <input
                  type="text"
                  id="study_abroad_destination"
                  name="study_abroad_destination"
                  value={formData.study_abroad_destination}
                  onChange={handleChange}
                  placeholder="アメリカ"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                  専攻
                </label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="コンピュータサイエンス"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* 自己紹介 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">自己紹介</h2>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="自己紹介を入力してください..."
                className="input-field"
              />
            </div>
          </div>

          {/* 使用言語 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">使用言語</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="言語を入力"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="btn-secondary"
                >
                  追加
                </button>
              </div>
              
              {formData.languages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((language, index) => (
                    <span
                      key={index}
                      className="flex items-center space-x-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      <span>{language}</span>
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 保存ボタン */}
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
              disabled={saving}
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


