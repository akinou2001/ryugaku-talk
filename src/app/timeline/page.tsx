'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, Flame, MessageSquare, Clock, Search, MapPin, GraduationCap, Sparkles, Users, BookOpen, HelpCircle, Briefcase, Home, GraduationCap as LearnIcon, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'
import { useAuth } from '@/components/Providers'
import { getUserCommunities } from '@/lib/community'

type TimelineView = 'recommended' | 'latest' | 'community'
type PostCategory = 'all' | 'question' | 'diary' | 'chat'
type MainCategory = 'all' | 'learn' | 'work' | 'live'
type DetailCategory = 'all' | 'regular-study' | 'language-study' | 'exchange' | 'research' | 'working-holiday' | 'residence' | 'local-hire' | 'volunteer' | 'internship' | 'nomad' | 'high-school' | 'summer-school' | 'current' | 'experienced' | 'applicant'

type CommunityPost = {
  id: string
  type: 'announcement' | 'event' | 'quest'
  title: string
  content: string
  community_id: string
  community_name?: string
  created_at: string
  created_by?: string
  creator?: { name: string }
  event_date?: string
  location?: string
  deadline?: string
  reward_type?: 'candle' | 'torch'
  reward_amount?: number
}

type TimelineItem = Post | {
  id: string
  type: 'event' | 'quest'
  title: string
  content: string
  created_at: string
  community_id?: string
  community_name?: string
  creator?: { name: string }
  event_date?: string
  location?: string
  deadline?: string
  reward_type?: 'candle' | 'torch'
  reward_amount?: number
}

export default function Timeline() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<TimelineView>('recommended')
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('all')
  const [selectedMainCategories, setSelectedMainCategories] = useState<MainCategory[]>([])
  const [selectedDetailCategories, setSelectedDetailCategories] = useState<DetailCategory[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [userCommunityIds, setUserCommunityIds] = useState<string[]>([])
  const [locationSearch, setLocationSearch] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false) // 絞り込み表示/非表示
  const locationScrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  
  // デバウンス処理（500ms待機）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
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
  
  // 検索結果をフィルタリング（チップで選択されている国も含める）
  const filteredLocations = (() => {
    const allCountries = Object.values(countriesByRegion).flatMap(region => region.countries.map(c => c.name))
    const searchResults = allCountries.filter(country =>
      country.toLowerCase().includes(locationSearch.toLowerCase())
    )
    // 選択されている国も検索結果に含める
    const selectedButNotInResults = selectedLocations.filter(loc => 
      !searchResults.includes(loc) && allCountries.includes(loc)
    )
    const combined = [...searchResults, ...selectedButNotInResults]
    return Array.from(new Set(combined))
  })()

  useEffect(() => {
    if (view === 'community' && user) {
      fetchUserCommunities()
    } else if (view !== 'community') {
      fetchPosts()
      fetchLocations()
    }
  }, [view, selectedCategory, selectedMainCategories, selectedDetailCategories, selectedLocations, debouncedSearchTerm, user])

  useEffect(() => {
    if (view === 'community' && userCommunityIds.length > 0) {
      fetchCommunityPosts()
    } else if (view === 'community' && userCommunityIds.length === 0 && !loading) {
      setLoading(false)
    }
  }, [view, userCommunityIds, debouncedSearchTerm])

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('study_abroad_destination')
        .not('study_abroad_destination', 'is', null)

      if (error) {
        console.error('Error fetching locations:', error)
        return
      }

      const locations = Array.from(
        new Set((data || []).map(item => item.study_abroad_destination).filter(Boolean) as string[])
      ).sort()

      setAvailableLocations(locations)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchUserCommunities = async () => {
    if (!user) {
      setUserCommunityIds([])
      setCommunityPosts([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setCommunityPosts([])
      const communities = await getUserCommunities(user.id)
      
      const communityIds: string[] = []
      communities.forEach(c => {
        if (c.community) {
          const community = c.community as any
          if (community.id) {
            communityIds.push(community.id)
          }
        }
      })
      
      setUserCommunityIds(communityIds)
      
      if (communityIds.length > 0) {
        await fetchCommunityPosts(communityIds)
      } else {
        setCommunityPosts([])
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching user communities:', error)
      setUserCommunityIds([])
      setCommunityPosts([])
      setLoading(false)
    }
  }

  const fetchCommunityPosts = async (communityIds?: string[]) => {
    const ids = communityIds || userCommunityIds
    if (ids.length === 0) {
      setCommunityPosts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const [announcementsResult, eventsResult, questsResult] = await Promise.all([
        supabase
          .from('announcements')
          .select(`
            *,
            community:communities(id, name),
            creator:profiles(id, name)
          `)
          .in('community_id', ids)
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select(`
            *,
            community:communities(id, name),
            creator:profiles(id, name)
          `)
          .in('community_id', ids)
          .order('event_date', { ascending: false }),
        supabase
          .from('quests')
          .select(`
            *,
            community:communities(id, name),
            creator:profiles(id, name)
          `)
          .in('community_id', ids)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      ])

      if (announcementsResult.error) {
        console.error('Error fetching announcements:', announcementsResult.error)
      }
      if (eventsResult.error) {
        console.error('Error fetching events:', eventsResult.error)
      }
      if (questsResult.error) {
        console.error('Error fetching quests:', questsResult.error)
      }

      const announcements: CommunityPost[] = (announcementsResult.data || []).map((a: any) => ({
        id: a.id,
        type: 'announcement' as const,
        title: a.title,
        content: a.content,
        community_id: a.community_id,
        community_name: a.community?.name,
        created_at: a.created_at,
        created_by: a.created_by,
        creator: a.creator ? { name: a.creator.name } : undefined
      }))

      const events: CommunityPost[] = (eventsResult.data || []).map((e: any) => ({
        id: e.id,
        type: 'event' as const,
        title: e.title,
        content: e.description,
        community_id: e.community_id,
        community_name: e.community?.name,
        created_at: e.created_at,
        created_by: e.created_by,
        creator: e.creator ? { name: e.creator.name } : undefined,
        event_date: e.event_date,
        location: e.location
      }))

      const quests: CommunityPost[] = (questsResult.data || []).map((q: any) => ({
        id: q.id,
        type: 'quest' as const,
        title: q.title,
        content: q.description || '',
        community_id: q.community_id,
        community_name: q.community?.name,
        created_at: q.created_at,
        created_by: q.created_by,
        creator: q.creator ? { name: q.creator.name } : undefined,
        deadline: q.deadline,
        reward_type: q.reward_type,
        reward_amount: q.reward_amount
      }))

      let allPosts = [...announcements, ...events, ...quests]
      if (debouncedSearchTerm) {
        allPosts = allPosts.filter(post =>
          post.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      }

      allPosts.sort((a, b) => {
        const dateA = a.event_date || a.created_at
        const dateB = b.event_date || b.created_at
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })

      setCommunityPosts(allPosts)
    } catch (error) {
      console.error('Error fetching community posts:', error)
      setCommunityPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name, account_type, verification_status, organization_name, study_abroad_destination)
        `)

      // コミュニティ限定投稿は除外（通常のタイムラインでは表示しない）
      query = query.is('community_id', null)

      // ビューに応じたフィルタリング
      if (view === 'recommended') {
        query = query.order('created_at', { ascending: false })
      } else if (view === 'latest') {
        query = query.order('created_at', { ascending: false })
      }

      // 投稿種別フィルター
      if (selectedCategory === 'question') {
        query = query.eq('category', 'question')
      } else if (selectedCategory === 'diary') {
        query = query.eq('category', 'diary')
      } else if (selectedCategory === 'chat') {
        // 'chat'と'information'の両方を含める（後方互換性）
        query = query.in('category', ['chat', 'information'])
      }

      // 大カテゴリフィルター（複数選択対応）
      if (selectedMainCategories.length > 0) {
        // 大カテゴリに紐づくタグを取得
        const mainCategoryTagMap: Record<MainCategory, string[]> = {
          all: [],
          'learn': ['正規留学', '語学留学', '交換留学', '研究室交流', '中学・高校', 'サマースクール'],
          'work': ['ワーホリ', '駐在', '現地採用', 'ボランティア', 'インターンシップ', 'ノマド'],
          'live': ['現役留学生', '留学経験者', '留学志願者']
        }
        const allTags: string[] = []
        selectedMainCategories.forEach(mainCat => {
          if (mainCat !== 'all') {
            allTags.push(...mainCategoryTagMap[mainCat])
          }
        })
        if (allTags.length > 0) {
          // いずれかのタグを含む投稿を取得
          query = query.or(allTags.map(tag => `tags.cs.{${tag}}`).join(','))
        }
      }

      // 詳細カテゴリフィルター（複数選択対応、タグベースで判定）
      if (selectedDetailCategories.length > 0) {
        const detailTagMap: Record<DetailCategory, string[]> = {
          all: [],
          'regular-study': ['正規留学', 'regular-study'],
          'language-study': ['語学留学', 'language-study'],
          'exchange': ['交換留学', 'exchange'],
          'research': ['研究室交流', 'research'],
          'working-holiday': ['ワーホリ', 'working-holiday'],
          'residence': ['駐在', 'residence'],
          'local-hire': ['現地採用', 'local-hire'],
          'volunteer': ['ボランティア', 'volunteer'],
          'internship': ['インターンシップ', 'internship'],
          'nomad': ['ノマド', 'nomad'],
          'high-school': ['中学・高校', 'high-school'],
          'summer-school': ['サマースクール', 'summer-school'],
          'current': ['現役留学生', 'current'],
          'experienced': ['留学経験者', 'experienced'],
          'applicant': ['留学志願者', 'applicant']
        }
        const allTags: string[] = []
        selectedDetailCategories.forEach(detailCat => {
          if (detailCat !== 'all') {
            allTags.push(...detailTagMap[detailCat])
          }
        })
        if (allTags.length > 0) {
          // いずれかのタグを含む投稿を取得
          query = query.or(allTags.map(tag => `tags.cs.{${tag}}`).join(','))
        }
      }

      // ロケーションフィルター（複数選択対応）
      if (selectedLocations.length > 0) {
        query = query.in('study_abroad_destination', selectedLocations)
      }

      // 検索
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,content.ilike.%${debouncedSearchTerm}%`)
      }

      const { data: postsData, error: postsError } = await query.limit(50)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
      }

      // ユーザーが参加しているコミュニティのイベントとクエストを取得
      let events: TimelineItem[] = []
      let quests: TimelineItem[] = []
      
      if (user) {
        try {
          // ユーザーが参加しているコミュニティを取得
          const { data: userCommunities } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', user.id)
            .eq('status', 'approved')

          const communityIds = userCommunities?.map(c => c.community_id) || []

          if (communityIds.length > 0) {
            // イベントを取得
            const { data: eventsData } = await supabase
              .from('events')
              .select(`
                *,
                community:communities(id, name),
                creator:profiles(id, name)
              `)
              .in('community_id', communityIds)
              .order('created_at', { ascending: false })
              .limit(20)

            events = (eventsData || []).map((e: any) => ({
              id: e.id,
              type: 'event' as const,
              title: e.title,
              content: e.description,
              created_at: e.created_at,
              community_id: e.community_id,
              community_name: e.community?.name,
              creator: e.creator ? { name: e.creator.name } : undefined,
              event_date: e.event_date,
              location: e.location,
              deadline: e.deadline
            }))

            // クエストを取得
            const { data: questsData } = await supabase
              .from('quests')
              .select(`
                *,
                community:communities(id, name),
                creator:profiles(id, name)
              `)
              .in('community_id', communityIds)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(20)

            quests = (questsData || []).map((q: any) => ({
              id: q.id,
              type: 'quest' as const,
              title: q.title,
              content: q.description || '',
              created_at: q.created_at,
              community_id: q.community_id,
              community_name: q.community?.name,
              creator: q.creator ? { name: q.creator.name } : undefined,
              deadline: q.deadline,
              reward_type: q.reward_type,
              reward_amount: q.reward_amount
            }))
          }
        } catch (error) {
          console.error('Error fetching events and quests:', error)
        }
      }

      // 投稿、イベント、クエストを統合して日付順にソート
      const allItems: TimelineItem[] = [
        ...(postsData || []),
        ...events,
        ...quests
      ]

      // 検索フィルターを適用
      let filteredItems = allItems
      if (debouncedSearchTerm) {
        filteredItems = allItems.filter(item => {
          const title = 'title' in item ? item.title : ''
          const content = 'content' in item ? item.content : ''
          const searchLower = debouncedSearchTerm.toLowerCase()
          return title.toLowerCase().includes(searchLower) || 
                 content.toLowerCase().includes(searchLower)
        })
      }

      // 日付順にソート
      filteredItems.sort((a, b) => {
        const dateA = ('event_date' in a && a.event_date) ? a.event_date : a.created_at
        const dateB = ('event_date' in b && b.event_date) ? b.event_date : b.created_at
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })

      setPosts(postsData || [])
      setTimelineItems(filteredItems)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (view === 'community') {
      if (userCommunityIds.length > 0) {
        fetchCommunityPosts()
      }
    } else {
      fetchPosts()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'たった今'
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question': return '質問'
      case 'diary': return '日記'
      case 'chat': return 'つぶやき'
      case 'information': return 'つぶやき' // 後方互換性
      case 'official': return '公式'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-100 text-blue-800'
      case 'diary': return 'bg-green-100 text-green-800'
      case 'chat': return 'bg-purple-100 text-purple-800'
      case 'information': return 'bg-purple-100 text-purple-800' // 後方互換性
      case 'official': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const mainCategories = [
    { id: 'all' as MainCategory, label: 'すべて', icon: null },
    { id: 'learn' as MainCategory, label: '学ぶ', icon: LearnIcon },
    { id: 'work' as MainCategory, label: '働く', icon: Briefcase },
    { id: 'live' as MainCategory, label: '暮らす', icon: Home }
  ]

  const detailCategories: Record<MainCategory, { id: DetailCategory, label: string }[]> = {
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
      { id: 'summer-school', label: 'サマースクール' },
      { id: 'current', label: '現役留学生' },
      { id: 'experienced', label: '留学経験者' },
      { id: 'applicant', label: '留学志願者' }
    ],
    work: [
      { id: 'all', label: 'すべて' },
      { id: 'working-holiday', label: 'ワーホリ' },
      { id: 'residence', label: '駐在' },
      { id: 'local-hire', label: '現地採用' },
      { id: 'internship', label: 'インターンシップ' },
      { id: 'nomad', label: 'ノマド' },
      { id: 'current', label: '現役留学生' },
      { id: 'experienced', label: '留学経験者' },
      { id: 'applicant', label: '留学志願者' }
    ],
    live: [
      { id: 'all', label: 'すべて' },
      { id: 'volunteer', label: 'ボランティア' },
      { id: 'residence', label: '駐在' },
      { id: 'current', label: '現役留学生' },
      { id: 'experienced', label: '留学経験者' },
      { id: 'applicant', label: '留学志願者' }
    ]
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* セグメントコントロール */}
      <div className="mb-4">
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('recommended')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              view === 'recommended'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <Sparkles className="h-4 w-4" />
              <span>おすすめ</span>
            </div>
          </button>
          <button
            onClick={() => setView('latest')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              view === 'latest'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            最新
          </button>
          {user && (
            <button
              onClick={() => setView('community')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                view === 'community'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Users className="h-4 w-4" />
                <span>コミュニティ</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="投稿を検索..."
            className="input-field pl-10 w-full"
          />
        </form>
      </div>

      {/* フィルター表示/非表示ボタン */}
      {view !== 'community' && (
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showFilters ? (
              <>
                <X className="h-4 w-4" />
                <span>フィルターを隠す</span>
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                <span>フィルターを表示</span>
                {(selectedCategory !== 'all' || selectedMainCategories.length > 0 || selectedDetailCategories.length > 0 || selectedLocations.length > 0) && (
                  <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {[
                      selectedCategory !== 'all' ? 1 : 0,
                      selectedMainCategories.length,
                      selectedDetailCategories.length,
                      selectedLocations.length
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      )}

      {/* 絞り込みオプション（折りたたみ可能） */}
      {view !== 'community' && showFilters && (
        <div className="mb-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* 投稿種別フィルター */}
          <div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>すべて</span>
            </button>
            <button
              onClick={() => setSelectedCategory('question')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedCategory === 'question'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>質問</span>
            </button>
            <button
              onClick={() => setSelectedCategory('diary')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedCategory === 'diary'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>日記</span>
            </button>
            <button
              onClick={() => setSelectedCategory('chat')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedCategory === 'chat'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>つぶやき</span>
            </button>
          </div>
          </div>

          {/* 大カテゴリフィルター */}
          <div>
          <div className="flex flex-wrap gap-2">
            {mainCategories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedMainCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'all') {
                      setSelectedMainCategories([])
                      setSelectedDetailCategories([])
                    } else {
                      setSelectedMainCategories(prev => {
                        if (prev.includes(cat.id)) {
                          return prev.filter(c => c !== cat.id)
                        } else {
                          return [...prev, cat.id]
                        }
                      })
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
          </div>

          {/* 詳細カテゴリフィルター */}
          {selectedMainCategories.length > 0 && (
            <div>
          <div className="flex flex-wrap gap-2">
            {selectedMainCategories.map(mainCat => {
              if (mainCat === 'all') return null
              return detailCategories[mainCat].map((detail) => {
                const isSelected = selectedDetailCategories.includes(detail.id)
                return (
                  <button
                    key={detail.id}
                    onClick={() => {
                      if (detail.id === 'all') {
                        setSelectedDetailCategories([])
                      } else {
                        setSelectedDetailCategories(prev => {
                          if (prev.includes(detail.id)) {
                            return prev.filter(c => c !== detail.id)
                          } else {
                            return [...prev, detail.id]
                          }
                        })
                      }
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
            }).flat()}
          </div>
          </div>
          )}

          {/* ロケーションチップ */}
          <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              国で絞り込む
            </label>
            <button
              onClick={() => {
                const allKeys = Array.from(Object.keys(countriesByRegion))
                const allExpanded = allKeys.every(key => expandedRegions.has(key))
                if (allExpanded) {
                  setExpandedRegions(new Set())
                } else {
                  setExpandedRegions(new Set(allKeys))
                }
              }}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              {Array.from(Object.keys(countriesByRegion)).every(key => expandedRegions.has(key)) ? 'すべて折りたたむ' : 'すべて展開'}
            </button>
          </div>
          
          {/* 地域別の国の国旗チップ（横スクロール・折りたたみ可能） */}
          {Object.entries(countriesByRegion).map(([regionKey, region]) => {
            const isExpanded = expandedRegions.has(regionKey)
            return (
              <div key={regionKey} className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
                <button
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
                    {isExpanded ? '▼' : '▶'} {selectedLocations.filter(l => region.countries.some(c => c.name === l)).length > 0 && `(${selectedLocations.filter(l => region.countries.some(c => c.name === l)).length}件選択中)`}
                  </span>
                </button>
                {isExpanded && (
                  <div className="relative p-2">
                    <button
                      onClick={() => {
                        const ref = locationScrollRefs.current[regionKey]
                        if (ref) {
                          ref.scrollBy({ left: -200, behavior: 'smooth' })
                        }
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div 
                      ref={(el) => { locationScrollRefs.current[regionKey] = el }}
                      className="overflow-x-auto pb-2 scrollbar-hide px-8" 
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      <div className="flex space-x-2 min-w-max">
                        {region.countries.map((country) => {
                          const isSelected = selectedLocations.includes(country.name)
                          return (
                            <button
                              key={country.code}
                              onClick={() => {
                                if (country.code === 'OTHER') {
                                  setSelectedLocations([])
                                  setLocationSearch('')
                                } else {
                                  setSelectedLocations(prev => {
                                    if (prev.includes(country.name)) {
                                      return prev.filter(c => c !== country.name)
                                    } else {
                                      return [...prev, country.name]
                                    }
                                  })
                                  setLocationSearch('')
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
                      onClick={() => {
                        const ref = locationScrollRefs.current[regionKey]
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
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="国を検索..."
              className="input-field pl-10 w-full"
            />
            {locationSearch && filteredLocations.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredLocations.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => {
                      setSelectedLocations(prev => {
                        if (prev.includes(location)) {
                          return prev.filter(l => l !== location)
                        } else {
                          return [...prev, location]
                        }
                      })
                      setLocationSearch('')
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                      selectedLocations.includes(location) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {selectedLocations.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              選択中: {selectedLocations.join(', ')}
            </p>
          )}
          </div>

          {/* フィルターリセット */}
          {(selectedCategory !== 'all' || selectedMainCategories.length > 0 || selectedDetailCategories.length > 0 || selectedLocations.length > 0) && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedMainCategories([])
                  setSelectedDetailCategories([])
                  setSelectedLocations([])
                }}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                フィルターをリセット
              </button>
            </div>
          )}
        </div>
      )}

      {/* フィルターが非表示でも、フィルターが適用されている場合は簡易表示 */}
      {view !== 'community' && !showFilters && (selectedCategory !== 'all' || selectedMainCategories.length > 0 || selectedDetailCategories.length > 0 || selectedLocations.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedCategory !== 'all' && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              {selectedCategory === 'question' ? '質問' : selectedCategory === 'diary' ? '日記' : 'つぶやき'}
            </span>
          )}
          {selectedMainCategories.length > 0 && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              {selectedMainCategories.map(cat => mainCategories.find(c => c.id === cat)?.label).filter(Boolean).join(', ')}
            </span>
          )}
          {selectedDetailCategories.length > 0 && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              詳細: {selectedDetailCategories.length}件
            </span>
          )}
          {selectedLocations.length > 0 && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              国: {selectedLocations.length}件
            </span>
          )}
        </div>
      )}

      {/* 投稿一覧 */}
      {view === 'community' && (
        <>
          {!user ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ログインが必要です</p>
            </div>
          ) : communityPosts.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {userCommunityIds.length === 0 
                  ? '所属しているコミュニティがありません' 
                  : 'コミュニティの投稿が見つかりません'}
              </p>
              {userCommunityIds.length === 0 && (
                <Link href="/communities" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                  コミュニティを探す →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {communityPosts.map((post) => (
              <Link 
                key={post.id} 
                href={post.type === 'quest' ? `/communities/${post.community_id}` : post.type === 'announcement' ? `/communities/${post.community_id}/announcements/${post.id}` : `/communities/${post.community_id}/events/${post.id}`}
                className="card hover:shadow-md transition-shadow block"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.type === 'announcement' 
                        ? 'bg-blue-100 text-blue-800' 
                        : post.type === 'event'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {post.type === 'announcement' ? 'お知らせ' : post.type === 'event' ? 'イベント' : 'クエスト'}
                    </span>
                    {post.community_name && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{post.community_name}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(post.event_date || post.created_at)}
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.content}
                </p>

                {post.type === 'event' && post.location && (
                  <div className="mb-3">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      <MapPin className="h-3 w-3" />
                      <span>{post.location}</span>
                    </span>
                  </div>
                )}

                {post.type === 'quest' && (
                  <div className="mb-3 flex items-center space-x-2 flex-wrap gap-2">
                    {post.deadline && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        <span>期限: {formatDate(post.deadline)}</span>
                      </span>
                    )}
                    {post.reward_type && post.reward_amount && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                        <Flame className="h-3 w-3" />
                        <span>報酬: {post.reward_amount}{post.reward_type === 'candle' ? 'キャンドル' : 'トーチ'}</span>
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {post.creator ? (
                      <span>by {post.creator.name}</span>
                    ) : (
                      <span>by コミュニティ</span>
                    )}
                  </div>
                </div>
              </Link>
              ))}
            </div>
          )}
        </>
      )}
      {view !== 'community' && (
        <>
          {posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">投稿が見つかりません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isOrganizationPost = post.author && post.author.account_type !== 'individual'
              const getOrganizationBorderColor = () => {
                if (!isOrganizationPost) return ''
                switch (post.author?.account_type) {
                  case 'educational': return 'border-l-4 border-l-blue-500'
                  case 'company': return 'border-l-4 border-l-green-500'
                  case 'government': return 'border-l-4 border-l-purple-500'
                  default: return ''
                }
              }
              return (
            <Link key={post.id} href={`/posts/${post.id}`} className={`card hover:shadow-md transition-shadow block ${getOrganizationBorderColor()}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(post.created_at)}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {post.title}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.content}
              </p>

              {/* ロケーションタグ */}
              {post.study_abroad_destination && (
                <div className="mb-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const location = post.study_abroad_destination
                      if (location) {
                        setSelectedLocations(prev => {
                          if (prev.includes(location)) {
                            return prev.filter(l => l !== location)
                          } else {
                            return [...prev, location]
                          }
                        })
                      }
                    }}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{post.study_abroad_destination}</span>
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500 flex-wrap">
                  <span>by </span>
                  {post.author_id ? (
                    <Link 
                      href={`/profile/${post.author_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      {post.author?.name || '匿名'}
                    </Link>
                  ) : (
                    <span>{post.author?.name || '匿名'}</span>
                  )}
                  {post.author && (
                    <AccountBadge 
                      accountType={post.author.account_type} 
                      verificationStatus={post.author.verification_status}
                      organizationName={post.author.organization_name}
                      size="sm"
                    />
                  )}
                  {post.university && (
                    <span className="flex items-center">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {post.university}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Flame className="h-4 w-4 mr-1 text-orange-500" />
                    {post.likes_count}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {post.comments_count}
                  </span>
                </div>
              </div>
            </Link>
            )
            })}
        </div>
          )}
        </>
      )}
    </div>
  )
}

