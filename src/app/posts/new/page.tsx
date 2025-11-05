'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function NewPost() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'question' as 'question' | 'diary' | 'information',
    tags: '',
    university: '',
    study_abroad_destination: '',
    major: ''
  })

  useEffect(() => {
    const category = searchParams.get('category')
    if (category && ['question', 'diary', 'information'].includes(category)) {
      setFormData(prev => ({
        ...prev,
        category: category as 'question' | 'diary' | 'information'
      }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setLoading(true)
    setError('')

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: tagsArray,
          university: formData.university || null,
          study_abroad_destination: formData.study_abroad_destination || null,
          major: formData.major || null,
          author_id: user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // 貢献度を更新（投稿作成で+10ポイント）
      // 現在の貢献度を取得してから更新
      const { data: profileData } = await supabase
        .from('profiles')
        .select('contribution_score')
        .eq('id', user.id)
        .single()

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ 
            contribution_score: (profileData.contribution_score || 0) + 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      }

      router.push(`/posts/${data.id}`)
    } catch (error: any) {
      setError(error.message || '投稿の作成に失敗しました')
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
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
            <p className="text-gray-600 mb-6">投稿するにはログインしてください。</p>
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
            <h1 className="text-3xl font-bold text-gray-900">新規投稿</h1>
          </div>
        </div>

        {/* 投稿フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* カテゴリ選択 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="question">質問</option>
              <option value="diary">留学日記</option>
              <option value="information">情報共有</option>
            </select>
          </div>

          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="投稿のタイトルを入力してください"
              className="input-field"
            />
          </div>

          {/* 内容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              内容 *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              placeholder="投稿の内容を入力してください"
              className="input-field"
            />
          </div>

          {/* タグ */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="留学, アメリカ, 大学院"
              className="input-field"
            />
            <p className="text-sm text-gray-500 mt-1">複数のタグはカンマで区切って入力してください</p>
          </div>

          {/* 大学・留学先・専攻 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* 投稿ボタン */}
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
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
