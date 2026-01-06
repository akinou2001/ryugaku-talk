'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'
import { ArrowLeft, Save, X, User as UserIcon, Search, MapPin, Briefcase, Home, GraduationCap as LearnIcon, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { uploadFile, validateFileType, validateFileSize, FILE_TYPES } from '@/lib/storage'

export default function EditProfile() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileIcon, setProfileIcon] = useState<File | null>(null)
  const [profileIconPreview, setProfileIconPreview] = useState<string | null>(null)
  const [iconUploading, setIconUploading] = useState(false)
  const [currentIconUrl, setCurrentIconUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    study_abroad_destinations: [] as string[],
    study_purposes: [] as ('learn' | 'work' | 'live')[],
    study_details: [] as ('regular-study' | 'language-study' | 'exchange' | 'research' | 'working-holiday' | 'residence' | 'local-hire' | 'volunteer' | 'internship' | 'nomad' | 'high-school' | 'summer-school')[],
    student_status: '' as '' | 'current' | 'experienced' | 'applicant',
    bio: '',
    languages: [] as string[]
  })

  const [newLanguage, setNewLanguage] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const countryScrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  
  // 国を地域で分類
  const countriesByRegion = {
    'north-america': {
      label: '北アメリカ',
      countries: [
        { code: 'US', name: 'アメリカ', flag: '🇺🇸' },
        { code: 'CA', name: 'カナダ', flag: '🇨🇦' },
        { code: 'MX', name: 'メキシコ', flag: '🇲🇽' }
      ]
    },
    'asia': {
      label: 'アジア',
      countries: [
        { code: 'JP', name: '日本', flag: '🇯🇵' },
        { code: 'KR', name: '韓国', flag: '🇰🇷' },
        { code: 'CN', name: '中国', flag: '🇨🇳' },
        { code: 'TW', name: '台湾', flag: '🇹🇼' },
        { code: 'SG', name: 'シンガポール', flag: '🇸🇬' },
        { code: 'HK', name: '香港', flag: '🇭🇰' },
        { code: 'TH', name: 'タイ', flag: '🇹🇭' },
        { code: 'MY', name: 'マレーシア', flag: '🇲🇾' },
        { code: 'ID', name: 'インドネシア', flag: '🇮🇩' },
        { code: 'PH', name: 'フィリピン', flag: '🇵🇭' },
        { code: 'VN', name: 'ベトナム', flag: '🇻🇳' },
        { code: 'IN', name: 'インド', flag: '🇮🇳' }
      ]
    },
    'europe': {
      label: 'ヨーロッパ',
      countries: [
        { code: 'GB', name: 'イギリス', flag: '🇬🇧' },
        { code: 'DE', name: 'ドイツ', flag: '🇩🇪' },
        { code: 'FR', name: 'フランス', flag: '🇫🇷' },
        { code: 'ES', name: 'スペイン', flag: '🇪🇸' },
        { code: 'IT', name: 'イタリア', flag: '🇮🇹' },
        { code: 'NL', name: 'オランダ', flag: '🇳🇱' },
        { code: 'CH', name: 'スイス', flag: '🇨🇭' },
        { code: 'SE', name: 'スウェーデン', flag: '🇸🇪' },
        { code: 'IE', name: 'アイルランド', flag: '🇮🇪' },
        { code: 'AT', name: 'オーストリア', flag: '🇦🇹' },
        { code: 'BE', name: 'ベルギー', flag: '🇧🇪' },
        { code: 'DK', name: 'デンマーク', flag: '🇩🇰' },
        { code: 'FI', name: 'フィンランド', flag: '🇫🇮' },
        { code: 'NO', name: 'ノルウェー', flag: '🇳🇴' },
        { code: 'PL', name: 'ポーランド', flag: '🇵🇱' },
        { code: 'PT', name: 'ポルトガル', flag: '🇵🇹' },
        { code: 'CZ', name: 'チェコ', flag: '🇨🇿' },
        { code: 'GR', name: 'ギリシャ', flag: '🇬🇷' },
        { code: 'HU', name: 'ハンガリー', flag: '🇭🇺' },
        { code: 'IS', name: 'アイスランド', flag: '🇮🇸' },
        { code: 'RO', name: 'ルーマニア', flag: '🇷🇴' },
        { code: 'RU', name: 'ロシア', flag: '🇷🇺' },
        { code: 'TR', name: 'トルコ', flag: '🇹🇷' },
        { code: 'UA', name: 'ウクライナ', flag: '🇺🇦' }
      ]
    },
    'oceania': {
      label: 'オセアニア',
      countries: [
        { code: 'AU', name: 'オーストラリア', flag: '🇦🇺' },
        { code: 'NZ', name: 'ニュージーランド', flag: '🇳🇿' }
      ]
    },
    'other': {
      label: 'その他',
      countries: [
        { code: 'BR', name: 'ブラジル', flag: '🇧🇷' },
        { code: 'AR', name: 'アルゼンチン', flag: '🇦🇷' },
        { code: 'CL', name: 'チリ', flag: '🇨🇱' },
        { code: 'CO', name: 'コロンビア', flag: '🇨🇴' },
        { code: 'EG', name: 'エジプト', flag: '🇪🇬' },
        { code: 'IL', name: 'イスラエル', flag: '🇮🇱' },
        { code: 'SA', name: 'サウジアラビア', flag: '🇸🇦' },
        { code: 'AE', name: 'UAE', flag: '🇦🇪' },
        { code: 'ZA', name: '南アフリカ', flag: '🇿🇦' },
        { code: 'OTHER', name: 'その他', flag: '🌍' }
      ]
    }
  }
  
  // 人気国（チップで表示）- 地域分類から取得
  const popularCountries = Object.values(countriesByRegion).flatMap(region => region.countries)
  
  // 全ての留学が一般的に可能な国（検索用）
  const allCountries = [
    ...popularCountries,
    { code: 'AT', name: 'オーストリア', flag: '🇦🇹' },
    { code: 'BE', name: 'ベルギー', flag: '🇧🇪' },
    { code: 'BR', name: 'ブラジル', flag: '🇧🇷' },
    { code: 'CL', name: 'チリ', flag: '🇨🇱' },
    { code: 'CO', name: 'コロンビア', flag: '🇨🇴' },
    { code: 'CZ', name: 'チェコ', flag: '🇨🇿' },
    { code: 'DK', name: 'デンマーク', flag: '🇩🇰' },
    { code: 'EG', name: 'エジプト', flag: '🇪🇬' },
    { code: 'FI', name: 'フィンランド', flag: '🇫🇮' },
    { code: 'GR', name: 'ギリシャ', flag: '🇬🇷' },
    { code: 'HK', name: '香港', flag: '🇭🇰' },
    { code: 'HU', name: 'ハンガリー', flag: '🇭🇺' },
    { code: 'ID', name: 'インドネシア', flag: '🇮🇩' },
    { code: 'IN', name: 'インド', flag: '🇮🇳' },
    { code: 'IS', name: 'アイスランド', flag: '🇮🇸' },
    { code: 'IL', name: 'イスラエル', flag: '🇮🇱' },
    { code: 'MY', name: 'マレーシア', flag: '🇲🇾' },
    { code: 'MX', name: 'メキシコ', flag: '🇲🇽' },
    { code: 'NO', name: 'ノルウェー', flag: '🇳🇴' },
    { code: 'PH', name: 'フィリピン', flag: '🇵🇭' },
    { code: 'PL', name: 'ポーランド', flag: '🇵🇱' },
    { code: 'PT', name: 'ポルトガル', flag: '🇵🇹' },
    { code: 'RO', name: 'ルーマニア', flag: '🇷🇴' },
    { code: 'RU', name: 'ロシア', flag: '🇷🇺' },
    { code: 'SA', name: 'サウジアラビア', flag: '🇸🇦' },
    { code: 'ZA', name: '南アフリカ', flag: '🇿🇦' },
    { code: 'TH', name: 'タイ', flag: '🇹🇭' },
    { code: 'TR', name: 'トルコ', flag: '🇹🇷' },
    { code: 'UA', name: 'ウクライナ', flag: '🇺🇦' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'VN', name: 'ベトナム', flag: '🇻🇳' }
  ]
  
  const filteredCountries = allCountries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  )
  
  // 留学目的（大カテゴリ）
  const studyPurposes = [
    { id: 'all' as const, label: 'すべて', icon: null },
    { id: 'learn' as const, label: '学ぶ', icon: LearnIcon },
    { id: 'work' as const, label: '働く', icon: Briefcase },
    { id: 'live' as const, label: '暮らす', icon: Home }
  ]
  
  // 留学詳細種別
  const studyDetails: Record<'all' | 'learn' | 'work' | 'live', { id: typeof formData.study_details[number] | 'all', label: string }[]> = {
    all: [
      { id: 'all', label: 'すべて' },
      { id: 'regular-study', label: '正規留学' },
      { id: 'language-study', label: '語学留学' },
      { id: 'exchange', label: '交換留学' },
      { id: 'research', label: '研究室交流' },
      { id: 'working-holiday', label: 'ワーホリ' },
      { id: 'residence', label: '駐在' },
      { id: 'local-hire', label: '現地採用' },
      { id: 'volunteer', label: 'ボランティア' },
      { id: 'internship', label: 'インターンシップ' },
      { id: 'nomad', label: 'ノマド' },
      { id: 'high-school', label: '中学・高校' },
      { id: 'summer-school', label: 'サマースクール' }
    ],
    learn: [
      { id: 'all', label: 'すべて' },
      { id: 'regular-study', label: '正規留学' },
      { id: 'language-study', label: '語学留学' },
      { id: 'exchange', label: '交換留学' },
      { id: 'research', label: '研究室交流' },
      { id: 'high-school', label: '中学・高校' },
      { id: 'summer-school', label: 'サマースクール' }
    ],
    work: [
      { id: 'all', label: 'すべて' },
      { id: 'working-holiday', label: 'ワーホリ' },
      { id: 'residence', label: '駐在' },
      { id: 'local-hire', label: '現地採用' },
      { id: 'internship', label: 'インターンシップ' },
      { id: 'nomad', label: 'ノマド' }
    ],
    live: [
      { id: 'all', label: 'すべて' },
      { id: 'volunteer', label: 'ボランティア' },
      { id: 'residence', label: '駐在' }
    ]
  }

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

      // study_purposeとstudy_detail、student_statusはlanguagesから復元（複数選択対応）
      const languages = data.languages || []
      const regularLanguages = languages.filter((lang: string) => !lang.startsWith('purpose:') && !lang.startsWith('detail:') && !lang.startsWith('status:'))
      const purposeTags = languages.filter((lang: string) => lang.startsWith('purpose:')).map((lang: string) => lang.replace('purpose:', '') as 'learn' | 'work' | 'live')
      const detailTags = languages.filter((lang: string) => lang.startsWith('detail:')).map((lang: string) => lang.replace('detail:', '') as typeof formData.study_details[number])
      
      // study_abroad_destinationはカンマ区切りの文字列または単一の文字列の可能性がある
      const destinations = data.study_abroad_destination 
        ? (data.study_abroad_destination.includes(',') ? data.study_abroad_destination.split(',').map((d: string) => d.trim()) : [data.study_abroad_destination])
        : []
      
      // student_statusはlanguagesから復元（将来的には専用フィールドを追加）
      const statusTag = languages.find((lang: string) => lang.startsWith('status:'))
      const studentStatus = statusTag ? (statusTag.replace('status:', '') as 'current' | 'experienced' | 'applicant') : ''
      
      setFormData({
        name: data.name || '',
        study_abroad_destinations: destinations,
        study_purposes: purposeTags,
        study_details: detailTags,
        student_status: studentStatus,
        bio: data.bio || '',
        languages: regularLanguages
      })
      
      // 現在のアイコンURLを設定
      if (data.icon_url) {
        setCurrentIconUrl(data.icon_url)
      }
    } catch (error: any) {
      setError(error.message || 'プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setProfileIcon(file)
      // プレビューを作成
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleRemoveIcon = () => {
    setProfileIcon(null)
    setProfileIconPreview(null)
    setCurrentIconUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError('')

    try {
      // アイコン画像をアップロード
      let iconUrl: string | null | undefined = undefined
      if (profileIcon) {
        setIconUploading(true)
        try {
          iconUrl = await uploadFile(profileIcon, 'post-images', `profile-icon-${user.id}`)
        } catch (error: any) {
          setError(error.message || 'アイコン画像のアップロードに失敗しました')
          setSaving(false)
          setIconUploading(false)
          return
        } finally {
          setIconUploading(false)
        }
      } else if (!currentIconUrl && profileIconPreview === null) {
        // 既存のアイコンがなく、新しいアイコンも選択されていない場合はnullを設定（削除）
        iconUrl = null
      }
      
      // study_purposeとstudy_detail、student_statusをlanguagesに含める（将来的には専用フィールドを追加）
      // 既存のpurpose:、detail:、status:タグを削除してから追加
      const existingLanguages = formData.languages.filter(lang => !lang.startsWith('purpose:') && !lang.startsWith('detail:') && !lang.startsWith('status:'))
      const languagesWithAttributes = [...existingLanguages]
      formData.study_purposes.forEach(purpose => {
        languagesWithAttributes.push(`purpose:${purpose}`)
      })
      formData.study_details.forEach(detail => {
        languagesWithAttributes.push(`detail:${detail}`)
      })
      if (formData.student_status) {
        languagesWithAttributes.push(`status:${formData.student_status}`)
      }
      
      // 複数の国をカンマ区切りで保存（将来的には配列フィールドを追加）
      const studyAbroadDestination = formData.study_abroad_destinations.length > 0 
        ? formData.study_abroad_destinations.join(', ')
        : null
      
      const updateData: any = {
        name: formData.name,
        study_abroad_destination: studyAbroadDestination,
        bio: formData.bio || null,
        languages: languagesWithAttributes,
        updated_at: new Date().toISOString()
      }
      
      // アイコンURLを更新（新しいアイコンがアップロードされた場合、または既存のアイコンを削除する場合）
      if (iconUrl !== undefined) {
        updateData.icon_url = iconUrl || null
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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
            
            <div className="space-y-6">
              {/* アイコン画像 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アイコン画像（任意）
                </label>
                <div className="space-y-2">
                  {!profileIcon && !currentIconUrl && (
                    <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex flex-col items-center space-y-2">
                        <UserIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-600">アイコンを選択</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleIconChange}
                        className="hidden"
                        disabled={iconUploading}
                      />
                    </label>
                  )}
                  {(profileIconPreview || currentIconUrl) && (
                    <div className="relative inline-block">
                      <img
                        src={profileIconPreview || currentIconUrl || ''}
                        alt="アイコンプレビュー"
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {!profileIcon && (
                        <label className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1 cursor-pointer hover:bg-opacity-70 rounded-b-full">
                          変更
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleIconChange}
                            className="hidden"
                            disabled={iconUploading}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    対応形式: JPEG, PNG, GIF, WebP（5MB以下）
                  </p>
                </div>
              </div>

              {/* 名前 */}
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

              {/* 留学先（国） */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    留学先
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allExpanded = Object.keys(countriesByRegion).every(key => expandedRegions.has(key))
                      if (allExpanded) {
                        setExpandedRegions(new Set())
                      } else {
                        setExpandedRegions(new Set(Object.keys(countriesByRegion)))
                      }
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    {Object.keys(countriesByRegion).every(key => expandedRegions.has(key)) ? 'すべて折りたたむ' : 'すべて展開'}
                  </button>
                </div>
                
                {/* 地域別の国の国旗チップ（横スクロール・折りたたみ可能） */}
                {Object.entries(countriesByRegion).map(([regionKey, region]) => {
                  const isExpanded = expandedRegions.has(regionKey)
                  return (
                    <div key={regionKey} className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedRegions(prev => {
                            const newSet = new Set(prev)
                            if (newSet.has(regionKey)) {
                              newSet.delete(regionKey)
                            } else {
                              newSet.add(regionKey)
                            }
                            return newSet
                          })
                        }}
                        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-medium text-gray-700">{region.label}</h4>
                        <span className="text-xs text-gray-500">
                          {isExpanded ? '▼' : '▶'} {formData.study_abroad_destinations.filter(d => region.countries.some(c => c.name === d)).length > 0 && `(${formData.study_abroad_destinations.filter(d => region.countries.some(c => c.name === d)).length}件選択中)`}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="relative p-2">
                          <button
                            type="button"
                            onClick={() => {
                              const ref = countryScrollRefs.current[regionKey]
                              if (ref) {
                                ref.scrollBy({ left: -200, behavior: 'smooth' })
                              }
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                          </button>
                          <div 
                            ref={(el) => { countryScrollRefs.current[regionKey] = el }}
                            className="overflow-x-auto pb-2 scrollbar-hide px-8" 
                            style={{ WebkitOverflowScrolling: 'touch' }}
                          >
                            <div className="flex space-x-2 min-w-max">
                              {region.countries.map((country) => {
                                const isSelected = formData.study_abroad_destinations.includes(country.name)
                                return (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                      if (country.code === 'OTHER') {
                                        setFormData(prev => ({ ...prev, study_abroad_destinations: [] }))
                                        setCountrySearch('')
                                      } else {
                                        setFormData(prev => {
                                          if (prev.study_abroad_destinations.includes(country.name)) {
                                            return { ...prev, study_abroad_destinations: prev.study_abroad_destinations.filter(c => c !== country.name) }
                                          } else {
                                            return { ...prev, study_abroad_destinations: [...prev.study_abroad_destinations, country.name] }
                                          }
                                        })
                                        setCountrySearch('')
                                      }
                                    }}
                                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-1 flex-shrink-0 ${
                                      isSelected
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const ref = countryScrollRefs.current[regionKey]
                              if (ref) {
                                ref.scrollBy({ left: 200, behavior: 'smooth' })
                              }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                          >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* 検索窓（全ての国を検索可能） */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="国を検索..."
                    className="input-field pl-10 w-full"
                  />
                  {countrySearch && filteredCountries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              if (prev.study_abroad_destinations.includes(country.name)) {
                                return { ...prev, study_abroad_destinations: prev.study_abroad_destinations.filter(c => c !== country.name) }
                              } else {
                                return { ...prev, study_abroad_destinations: [...prev.study_abroad_destinations, country.name] }
                              }
                            })
                            setCountrySearch('')
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                            formData.study_abroad_destinations.includes(country.name) ? 'bg-primary-50' : ''
                          }`}
                        >
                          <span className="text-xl">{country.flag}</span>
                          <span className="text-sm">{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {formData.study_abroad_destinations.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    選択中: {formData.study_abroad_destinations.join(', ')}
                  </p>
                )}
              </div>

              {/* 留学ステータス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  留学ステータス
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'current' as const, label: '現役留学生' },
                    { id: 'experienced' as const, label: '留学経験者' },
                    { id: 'applicant' as const, label: '留学志願者' }
                  ].map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          student_status: prev.student_status === status.id ? '' : status.id
                        }))
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.student_status === status.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 留学目的（大カテゴリ） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  留学目的
                </label>
                <div className="flex flex-wrap gap-2">
                  {studyPurposes.filter(p => p.id !== 'all').map((purpose) => {
                    const Icon = purpose.icon
                    const isSelected = formData.study_purposes.includes(purpose.id as 'learn' | 'work' | 'live')
                    return (
                      <button
                        key={purpose.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => {
                            if (prev.study_purposes.includes(purpose.id as 'learn' | 'work' | 'live')) {
                              return { 
                                ...prev, 
                                study_purposes: prev.study_purposes.filter(p => p !== purpose.id),
                                study_details: prev.study_details.filter(d => {
                                  // 選択解除された目的に関連する詳細も削除
                                  const relatedDetails: string[] = []
                                  if (purpose.id === 'learn') {
                                    relatedDetails.push('regular-study', 'language-study', 'exchange', 'research', 'high-school', 'summer-school')
                                  } else if (purpose.id === 'work') {
                                    relatedDetails.push('working-holiday', 'residence', 'local-hire', 'internship', 'nomad')
                                  } else if (purpose.id === 'live') {
                                    relatedDetails.push('volunteer', 'residence')
                                  }
                                  return !relatedDetails.includes(d)
                                })
                              }
                            } else {
                              return { 
                                ...prev, 
                                study_purposes: [...prev.study_purposes, purpose.id as 'learn' | 'work' | 'live']
                              }
                            }
                          })
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{purpose.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 留学詳細種別 */}
              {formData.study_purposes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    詳細種別
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // 選択された目的に関連する詳細種別を取得
                      const availableDetails: { id: typeof formData.study_details[number], label: string }[] = []
                      if (formData.study_purposes.includes('learn')) {
                        availableDetails.push(...studyDetails.learn.filter((d): d is { id: typeof formData.study_details[number], label: string } => d.id !== 'all'))
                      }
                      if (formData.study_purposes.includes('work')) {
                        availableDetails.push(...studyDetails.work.filter((d): d is { id: typeof formData.study_details[number], label: string } => d.id !== 'all'))
                      }
                      if (formData.study_purposes.includes('live')) {
                        availableDetails.push(...studyDetails.live.filter((d): d is { id: typeof formData.study_details[number], label: string } => d.id !== 'all'))
                      }
                      // 重複を削除
                      const uniqueDetails = availableDetails.filter((detail, index, self) => 
                        index === self.findIndex(d => d.id === detail.id)
                      )
                      
                      return uniqueDetails.map((detail) => {
                        const isSelected = formData.study_details.includes(detail.id)
                        return (
                          <button
                            key={detail.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                if (prev.study_details.includes(detail.id)) {
                                  return { ...prev, study_details: prev.study_details.filter(d => d !== detail.id) }
                                } else {
                                  return { ...prev, study_details: [...prev.study_details, detail.id] }
                                }
                              })
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {detail.label}
                          </button>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}
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
              disabled={saving || iconUploading}
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving || iconUploading ? (iconUploading ? 'アイコンをアップロード中...' : '保存中...') : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


