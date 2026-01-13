'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { getUserCommunities } from '@/lib/community'
import { getQuests, getQuestById } from '@/lib/quest'
import { requestQuestCompletion } from '@/lib/quest'
import type { Quest } from '@/lib/supabase'
import { uploadFile, validateFileType, validateFileSize, FILE_TYPES, isImageFile } from '@/lib/storage'
import { ArrowLeft, Save, X, Search, ChevronLeft, ChevronRight, Flame, Image as ImageIcon, Upload, Award } from 'lucide-react'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { searchUniversities, findUniversityByAlias, type University } from '@/lib/universities'

function NewPostInner() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'question' as 'question' | 'diary' | 'chat' | 'information' | 'official',
    tags: [] as string[],
    university_id: null as string | null,
    study_abroad_destinations: [] as string[],
    is_official: false,
    official_category: '',
    community_id: '' as string | undefined,
    urgency_level: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  })
  
  // 大学検索用
  const [universitySearchQuery, setUniversitySearchQuery] = useState('')
  const [universitySearchResults, setUniversitySearchResults] = useState<University[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)
  const [userCommunities, setUserCommunities] = useState<Array<{id: string, name: string}>>([])
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([])
  const [selectedQuestId, setSelectedQuestId] = useState<string>('')
  const [questFromUrl, setQuestFromUrl] = useState<string | null>(null)
  const [questInfo, setQuestInfo] = useState<Quest | null>(null)
  const [showQuestConfirmModal, setShowQuestConfirmModal] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)
  const [countrySearch, setCountrySearch] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const countryScrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  // 複数画像（最大4枚）
  const [postImages, setPostImages] = useState<File[]>([])
  const [postImagePreviews, setPostImagePreviews] = useState<string[]>([])
  const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null) // カバー写真のインデックス
  // アップロード済み画像URL（リアルタイム置き換え用）
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  
  // タイムラインのチップで使っているタグ
  const availableTags = [
    '正規留学',
    '語学留学',
    '交換留学',
    '研究室交流',
    'ワーホリ',
    '駐在',
    '現地採用',
    'ボランティア',
    'インターンシップ',
    'ノマド',
    '中学・高校',
    'サマースクール',
    'スポーツ',
    '大学',
    '大学院',
    '現役留学生',
    '留学経験者',
    '留学志願者'
  ]
  
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

  const isVerifiedOrganization = user && 
    user.account_type !== 'individual' && 
    user.verification_status === 'verified'

  useEffect(() => {
    const category = searchParams.get('category')
    if (category && ['question', 'diary', 'chat', 'information'].includes(category)) {
      setFormData(prev => ({
        ...prev,
        category: (category === 'information' ? 'chat' : category) as 'question' | 'diary' | 'chat'
      }))
    }
    
    // URLパラメータからquest_idを取得
    const questId = searchParams.get('quest_id')
    const communityId = searchParams.get('community_id')
    if (questId) {
      setQuestFromUrl(questId)
      setSelectedQuestId(questId)
      // クエスト情報を取得
      getQuestById(questId).then(quest => {
        setQuestInfo(quest)
        // コミュニティIDも設定
        if (communityId && quest.community_id === communityId) {
          setFormData(prev => ({
            ...prev,
            community_id: communityId
          }))
        }
      }).catch(error => {
        console.error('Error fetching quest:', error)
      })
    }
    
    if (user) {
      fetchUserCommunities()
      fetchUserProfile()
    }
  }, [searchParams, user])

  const fetchUserProfile = async () => {
    if (!user || profileLoaded) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('study_abroad_destination, languages, university_id, university')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      if (data) {
        // プロフィール属性を取得
        const languages = data.languages || []
        
        // 留学先を取得（カンマ区切りの文字列または単一の文字列）
        const destinations = data.study_abroad_destination 
          ? (data.study_abroad_destination.includes(',') 
              ? data.study_abroad_destination.split(',').map((d: string) => d.trim()) 
              : [data.study_abroad_destination])
          : []
        
        // 留学目的を取得（purpose:で始まるもの）
        const purposeTags = languages
          .filter((lang: string) => lang.startsWith('purpose:'))
          .map((lang: string) => lang.replace('purpose:', ''))
        
        // 留学詳細種別を取得（detail:で始まるもの）
        const detailTags = languages
          .filter((lang: string) => lang.startsWith('detail:'))
          .map((lang: string) => lang.replace('detail:', ''))
        
        // 学生ステータスを取得（status:で始まるもの）
        const statusTag = languages.find((lang: string) => lang.startsWith('status:'))
        const studentStatus = statusTag ? statusTag.replace('status:', '') : ''

        // プロフィール属性をチップに反映
        const autoTags: string[] = []
        
        // 留学詳細種別をタグに追加（マッピング）
        const detailTagMap: Record<string, string> = {
          'regular-study': '正規留学',
          'language-study': '語学留学',
          'exchange': '交換留学',
          'research': '研究室交流',
          'working-holiday': 'ワーホリ',
          'residence': '駐在',
          'local-hire': '現地採用',
          'volunteer': 'ボランティア',
          'internship': 'インターンシップ',
          'nomad': 'ノマド',
          'high-school': '中学・高校',
          'summer-school': 'サマースクール'
        }
        
        detailTags.forEach((detail: string) => {
          if (detailTagMap[detail] && availableTags.includes(detailTagMap[detail])) {
            autoTags.push(detailTagMap[detail])
          }
        })
        
        // 学生ステータスをタグに追加
        const statusTagMap: Record<string, string> = {
          'current': '現役留学生',
          'experienced': '留学経験者',
          'applicant': '留学志願者'
        }
        
        if (studentStatus && statusTagMap[studentStatus] && availableTags.includes(statusTagMap[studentStatus])) {
          autoTags.push(statusTagMap[studentStatus])
        }

        // 大学情報を取得
        let university: University | null = null
        if (data.university_id) {
          const { data: uniData } = await supabase
            .from('universities')
            .select(`
              *,
              continent:continents(*)
            `)
            .eq('id', data.university_id)
            .single()
          if (uniData) {
            university = uniData as University
          }
        } else if (data.university) {
          // 既存のテキストから大学を検索
          const { data: foundUni } = await findUniversityByAlias(data.university)
          if (foundUni) {
            university = foundUni
          }
        }

        // フォームデータを更新（プロフィール属性を自動選択）
        setFormData(prev => ({
          ...prev,
          tags: autoTags,
          study_abroad_destinations: destinations,
          university_id: university?.id || null
        }))
        
        if (university) {
          setSelectedUniversity(university)
        }
        
        setProfileLoaded(true)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchUserCommunities = async () => {
    if (!user) return
    try {
      const communities = await getUserCommunities(user.id)
      const communityList = communities.map(c => {
        const community = c.community as any
        return { id: community.id, name: community.name }
      }).filter(Boolean)
      setUserCommunities(communityList)
    } catch (error) {
      console.error('Error fetching user communities:', error)
    }
  }

  const fetchQuestsForCommunity = async (communityId: string) => {
    if (!user) return
    try {
      const quests = await getQuests(communityId, user.id)
      setAvailableQuests(quests)
    } catch (error) {
      console.error('Error fetching quests:', error)
      setAvailableQuests([])
    }
  }

  // コミュニティが選択されたら、そのコミュニティのクエストを取得
  useEffect(() => {
    if (formData.community_id) {
      fetchQuestsForCommunity(formData.community_id)
    } else {
      setAvailableQuests([])
      setSelectedQuestId('')
    }
  }, [formData.community_id, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('ログインが必要です')
      return
    }

    // クエストIDがURLパラメータから設定されている場合、確認モーダルを表示
    if (questFromUrl && !showQuestConfirmModal) {
      setShowQuestConfirmModal(true)
      setPendingSubmit(() => async () => {
        await submitPost()
      })
      return
    }

    await submitPost()
  }

  const submitPost = async () => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setLoading(true)
    setError('')
    setShowQuestConfirmModal(false)

    try {
      // カテゴリが'information'の場合は'chat'に変換（後方互換性）
      const category = formData.category === 'information' ? 'chat' : formData.category
      
      // つぶやきの場合はタイトルを自動生成（内容の最初の50文字）
      const title = category === 'chat' 
        ? (formData.content.length > 50 ? formData.content.substring(0, 50) + '...' : formData.content) || 'つぶやき'
        : formData.title
      
      // コミュニティ限定投稿の場合はpost_typeを設定
      const postType = formData.community_id ? 'normal' : null
      
      // クエストIDを設定（選択されている場合、またはURLパラメータから）
      const questIdToUse = selectedQuestId || questFromUrl || null
      
      // クエストタグを追加（選択されている場合）
      const finalTags = [...formData.tags]
      if (questIdToUse) {
        finalTags.push(`quest:${questIdToUse}`)
      }
      
      // 写真をアップロード（最大4枚）
      // 既にアップロード済みの画像URLを使用（リアルタイムアップロード済み）
      let images: string[] = uploadedImageUrls
      let coverImageUrl: string | undefined = undefined
      
      // まだアップロードされていない画像があればアップロード
      if (postImages.length > uploadedImageUrls.length) {
        setImageUploading(true)
        try {
          const remainingImages = postImages.slice(uploadedImageUrls.length)
          const newUploadedImages: string[] = []
          for (const image of remainingImages) {
            if (!validateFileType(image, FILE_TYPES.POST_IMAGE)) {
              throw new Error('写真はJPEG、PNG、GIF、WebP形式のみ対応しています')
            }
            if (!validateFileSize(image, 5)) {
              throw new Error('写真は5MB以下である必要があります')
            }
            const url = await uploadFile(image, 'post-images', user.id)
            newUploadedImages.push(url)
          }
          images = [...uploadedImageUrls, ...newUploadedImages]
          // カバー写真を設定
          if (coverImageIndex !== null && coverImageIndex < images.length) {
            coverImageUrl = images[coverImageIndex]
          }
        } catch (error: any) {
          setError(error.message || '写真のアップロードに失敗しました')
          setLoading(false)
          setImageUploading(false)
          return
        } finally {
          setImageUploading(false)
        }
      } else if (images.length > 0) {
        // カバー写真を設定
        if (coverImageIndex !== null && coverImageIndex < images.length) {
          coverImageUrl = images[coverImageIndex]
        }
      }

      // Markdown内の画像プレースホルダーは既にリアルタイムで置き換え済み
      // 念のため、残っているプレースホルダーがあれば置き換え
      let finalContent = formData.content
      if (images.length > 0 && (category === 'diary' || category === 'official')) {
        images.forEach((url, index) => {
          const placeholder = `[画像${index + 1}]`
          const regex = new RegExp(`\\[画像${index + 1}\\]`, 'g')
          if (finalContent.includes(placeholder)) {
            finalContent = finalContent.replace(regex, url)
          }
        })
      }

      // 複数の国を選択している場合は、最初の1つを保存（将来的には配列フィールドを追加）
      const universityName = selectedUniversity 
        ? (selectedUniversity.name_ja || selectedUniversity.name_en)
        : null
      
      const postData: any = {
        title: title,
        content: finalContent,
        category: category,
        tags: finalTags,
        university_id: selectedUniversity?.id || formData.university_id || null,
        university: universityName, // 後方互換性のため残す
        study_abroad_destination: formData.study_abroad_destinations.length > 0 ? formData.study_abroad_destinations[0] : null,
        author_id: user.id,
        is_official: isVerifiedOrganization && formData.is_official,
        official_category: isVerifiedOrganization && formData.is_official ? formData.official_category : null,
        community_id: formData.community_id || null,
        post_type: postType,
        quest_id: questIdToUse || null,
        images: images.length > 0 ? images : null, // 複数画像
        cover_image_url: coverImageUrl || null, // カバー写真
        is_pro: false, // すべての投稿で同じ機能のためfalse
        urgency_level: category === 'question' ? formData.urgency_level : null
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // クエストIDが設定されている場合、自動的にクエスト完了申請を作成（旧方式との互換性のため）
      if (questIdToUse && data) {
        try {
          await requestQuestCompletion(
            questIdToUse,
            `投稿: ${data.title}`,
            `/posts/${data.id}`
          )
        } catch (questError: any) {
          // クエスト完了申請のエラーは投稿作成を妨げない
          console.error('Error requesting quest completion:', questError)
        }
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

      // コミュニティ限定投稿の場合、投稿後にコミュニティページにリダイレクト
      const redirectPath = formData.community_id 
        ? `/communities/${formData.community_id}?tab=timeline`
        : `/posts/${data.id}`
      
      router.push(redirectPath)
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
      [name]: name === 'category' && value === 'information' ? 'chat' : value
    }))
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
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
              value={formData.category === 'information' ? 'chat' : formData.category}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="question">質問</option>
              <option value="diary">留学日記</option>
              <option value="chat">つぶやき</option>
              {isVerifiedOrganization && (
                <option value="official">公式投稿</option>
              )}
            </select>
          </div>


          {/* 組織アカウント用の公式投稿オプション */}
          {isVerifiedOrganization && formData.category === 'official' && (
            <>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_official}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_official: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    公式投稿として公開する
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  公式投稿は認証済みの組織アカウントからの情報として表示されます
                </p>
              </div>

              {formData.is_official && (
                <div>
                  <label htmlFor="official_category" className="block text-sm font-medium text-gray-700 mb-2">
                    公式投稿カテゴリ
                  </label>
                  <select
                    id="official_category"
                    name="official_category"
                    value={formData.official_category}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">選択してください</option>
                    <option value="scholarship">奨学金情報</option>
                    <option value="event">イベント情報</option>
                    <option value="program">プログラム情報</option>
                    <option value="announcement">お知らせ</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* タイトル（つぶやきの場合は非表示） */}
          {formData.category !== 'chat' && (
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
          )}

          {/* 緊急度設定（質問の場合のみ） */}
          {formData.category === 'question' && (
            <div>
              <label htmlFor="urgency_level" className="block text-sm font-medium text-gray-700 mb-2">
                緊急度
              </label>
              <select
                id="urgency_level"
                name="urgency_level"
                value={formData.urgency_level}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency_level: e.target.value as 'low' | 'normal' | 'high' | 'urgent' }))}
                className="input-field"
              >
                <option value="low">低</option>
                <option value="normal">通常</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                質問の緊急度を設定できます。緊急度が高い質問は、平面マップUIで優先的に表示されます。
              </p>
            </div>
          )}

          {/* 内容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              内容 * {(formData.category === 'diary' || formData.category === 'official') && <span className="text-xs text-gray-500">(Markdown形式対応)</span>}
            </label>
            {(formData.category === 'diary' || formData.category === 'official') ? (
              <MarkdownEditor
                value={formData.content}
                onChange={(newValue) => setFormData(prev => ({ ...prev, content: newValue }))}
                placeholder="# タイトル\n\n本文をMarkdown形式で記述できます。\n\n## 見出し\n\n- リスト項目1\n- リスト項目2\n\n**太字**や*斜体*も使えます。"
                rows={15}
              onImageSelect={async (file) => {
                // 画像をアップロードしてMarkdownに挿入
                if (postImages.length >= 4) {
                  setError('写真は最大4枚までアップロードできます')
                  return
                }

                // バリデーション
                if (!validateFileType(file, FILE_TYPES.POST_IMAGE)) {
                  setError('写真はJPEG、PNG、GIF、WebP形式のみ対応しています')
                  return
                }
                if (!validateFileSize(file, 5)) {
                  setError('写真は5MB以下である必要があります')
                  return
                }

                // プレビューを追加
                const reader = new FileReader()
                reader.onloadend = () => {
                  setPostImagePreviews(prev => [...prev, reader.result as string])
                  // 最初の画像を自動的にカバー写真に設定
                  if (postImagePreviews.length === 0) {
                    setCoverImageIndex(0)
                  }
                }
                reader.readAsDataURL(file)

                // 画像を配列に追加
                const newImages = [...postImages, file]
                setPostImages(newImages)

                // 画像を即座にアップロードしてURLを取得
                try {
                  setImageUploading(true)
                  const imageIndex = postImages.length
                  const placeholder = `[画像${imageIndex + 1}]`
                  const url = await uploadFile(file, 'post-images', user.id)
                  
                  // アップロード済みURLを保存
                  setUploadedImageUrls(prev => [...prev, url])
                  
                  // Markdown内のプレースホルダーを実際のURLに置き換え
                  const updatedContent = formData.content.replace(
                    new RegExp(`\\[画像${imageIndex + 1}\\]`, 'g'),
                    url
                  )
                  setFormData(prev => ({ ...prev, content: updatedContent }))
                } catch (error: any) {
                  setError(error.message || '画像のアップロードに失敗しました')
                  // エラー時は画像を削除
                  setPostImages(prev => prev.filter((_, i) => i !== postImages.length))
                  setPostImagePreviews(prev => prev.slice(0, -1))
                } finally {
                  setImageUploading(false)
                }
              }}
              uploadedImages={postImagePreviews}
            />
            ) : (
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
            )}
          </div>

          {/* 写真アップロード（最大4枚） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              写真（最大4枚、オプション）
            </label>
              <div className="space-y-4">
                {/* 画像グリッド */}
                <div className="grid grid-cols-2 gap-4">
                  {postImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`画像 ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                      {coverImageIndex === index && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          カバー写真
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCoverImageIndex(index)}
                          className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                            coverImageIndex === index
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-gray-700 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {coverImageIndex === index ? 'カバー写真' : 'カバーに設定'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = postImages.filter((_, i) => i !== index)
                            const newPreviews = postImagePreviews.filter((_, i) => i !== index)
                            setPostImages(newImages)
                            setPostImagePreviews(newPreviews)
                            if (coverImageIndex === index) {
                              setCoverImageIndex(newImages.length > 0 ? 0 : null)
                            } else if (coverImageIndex !== null && coverImageIndex > index) {
                              setCoverImageIndex(coverImageIndex - 1)
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                  {postImagePreviews.length < 4 && (
                    <label className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex flex-col items-center space-y-2">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">写真を追加</span>
                        <span className="text-xs text-gray-500">({postImagePreviews.length}/4)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (!validateFileType(file, FILE_TYPES.POST_IMAGE)) {
                              setError('写真はJPEG、PNG、GIF、WebP形式のみ対応しています')
                              return
                            }
                            if (!validateFileSize(file, 5)) {
                              setError('写真は5MB以下である必要があります')
                              return
                            }
                            if (postImages.length >= 4) {
                              setError('写真は最大4枚までアップロードできます')
                              return
                            }
                            const newImages = [...postImages, file]
                            setPostImages(newImages)
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setPostImagePreviews(prev => [...prev, reader.result as string])
                              // 最初の画像を自動的にカバー写真に設定
                              if (postImagePreviews.length === 0) {
                                setCoverImageIndex(0)
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        disabled={imageUploading}
                      />
                    </label>
                  )}
                </div>
                {postImagePreviews.length > 0 && coverImageIndex === null && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    カバー写真を選択してください。投稿一覧で目立つように表示されます。
                  </div>
                )}
              </div>
            </div>

          {/* タグ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タグ
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (formData.tags.includes(tag)) {
                      setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag]
                      }))
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              選択したタグ: {formData.tags.length > 0 ? formData.tags.join(', ') : 'なし'}
            </p>
          </div>

          {/* どこに関する質問か */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                どこに関する質問か
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
                                    setCountrySearch('')
                                    setFormData(prev => ({ ...prev, study_abroad_destinations: [] }))
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

          {/* 所属大学 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属大学（任意）
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedUniversity ? (selectedUniversity.name_ja || selectedUniversity.name_en) : universitySearchQuery}
                onChange={async (e) => {
                  const query = e.target.value
                  setUniversitySearchQuery(query)
                  setShowUniversityDropdown(true)
                  
                  if (query.length >= 2) {
                    const { data } = await searchUniversities({ query, limit: 10 })
                    setUniversitySearchResults(data || [])
                  } else {
                    setUniversitySearchResults([])
                  }
                }}
                onFocus={() => {
                  if (universitySearchQuery.length >= 2) {
                    setShowUniversityDropdown(true)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowUniversityDropdown(false), 200)
                }}
                placeholder="大学名を検索..."
                className="input-field"
              />
              {selectedUniversity && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUniversity(null)
                    setUniversitySearchQuery('')
                    setFormData({ ...formData, university_id: null })
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {showUniversityDropdown && universitySearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {universitySearchResults.map((uni) => (
                    <button
                      key={uni.id}
                      type="button"
                      onClick={() => {
                        setSelectedUniversity(uni)
                        setUniversitySearchQuery(uni.name_ja || uni.name_en)
                        setFormData({ ...formData, university_id: uni.id })
                        setShowUniversityDropdown(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {uni.name_ja || uni.name_en}
                      </div>
                      {uni.name_ja && (
                        <div className="text-sm text-gray-500">{uni.name_en}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {uni.country_code} {uni.continent?.name_ja && `・${uni.continent.name_ja}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              大学名を入力して検索してください。見つからない場合は、管理画面で追加できます。
            </p>
          </div>

          {/* コミュニティ限定投稿（質問・日記・つぶやき） */}
          {userCommunities.length > 0 && (formData.category === 'question' || formData.category === 'diary' || formData.category === 'chat') && (
            <>
              <div>
                <label htmlFor="community_id" className="block text-sm font-medium text-gray-700 mb-2">
                  コミュニティ限定投稿（オプション）
                </label>
                <select
                  id="community_id"
                  name="community_id"
                  value={formData.community_id || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, community_id: e.target.value || undefined }))
                    setSelectedQuestId('') // コミュニティが変更されたらクエスト選択をリセット
                  }}
                  className="input-field"
                >
                  <option value="">公開（全員に表示）</option>
                  {userCommunities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}（コミュニティ限定）
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  コミュニティを選択すると、そのコミュニティのメンバーのみに表示されます。質問・日記・つぶやきでコミュニティ限定投稿が可能です。
                </p>
              </div>

              {/* クエスト選択（コミュニティ限定投稿の場合のみ） */}
              {formData.community_id && availableQuests.length > 0 && (
                <div>
                  <label htmlFor="quest_id" className="block text-sm font-medium text-gray-700 mb-2">
                    <Flame className="h-4 w-4 inline mr-1" />
                    クエストタグ（オプション）
                  </label>
                  <select
                    id="quest_id"
                    name="quest_id"
                    value={selectedQuestId}
                    onChange={(e) => setSelectedQuestId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">クエストを選択しない</option>
                    {availableQuests.map((quest) => (
                      <option key={quest.id} value={quest.id}>
                        {quest.title} ({quest.reward_amount}ポイント)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    クエストを選択すると、投稿にクエストタグが付与され、自動的にクエスト完了申請が送信されます。クエスト作成者の承認後に報酬が付与されます。
                  </p>
                </div>
              )}
            </>
          )}


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
              disabled={loading || imageUploading}
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading || imageUploading ? (imageUploading ? '写真をアップロード中...' : '投稿中...') : '投稿する'}
            </button>
          </div>
        </form>

        {/* クエスト回答確認モーダル */}
        {showQuestConfirmModal && questInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">クエストへの回答</h2>
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  この投稿は以下のクエストに対する回答となります。よろしいですか？
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">{questInfo.title}</h3>
                  </div>
                  {questInfo.description && (
                    <p className="text-sm text-gray-600">{questInfo.description}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowQuestConfirmModal(false)
                    setQuestFromUrl(null)
                    setSelectedQuestId('')
                    setQuestInfo(null)
                    if (pendingSubmit) {
                      setPendingSubmit(null)
                    }
                  }}
                  className="btn-secondary flex-1"
                >
                  修正する
                </button>
                <button
                  onClick={async () => {
                    if (pendingSubmit) {
                      await pendingSubmit()
                      setPendingSubmit(null)
                    }
                  }}
                  className="btn-primary flex-1"
                >
                  そのまま投稿する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewPost() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </div>
    }>
      <NewPostInner />
    </Suspense>
  )
}
