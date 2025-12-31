'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, Flame, MessageSquare, Clock, Search, MapPin, GraduationCap, Sparkles, Users, BookOpen, HelpCircle, Briefcase, Home, GraduationCap as LearnIcon, ChevronLeft, ChevronRight, Filter, X, Calendar, Award, TrendingUp, Heart, Eye } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'
import { useAuth } from '@/components/Providers'
import { getUserCommunities } from '@/lib/community'
import { UserAvatar } from '@/components/UserAvatar'

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
  const [showFilters, setShowFilters] = useState(false)
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
  
  const filteredLocations = (() => {
    const allCountries = Object.values(countriesByRegion).flatMap(region => region.countries.map(c => c.name))
    const searchResults = allCountries.filter(country =>
      country.toLowerCase().includes(locationSearch.toLowerCase())
    )
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
          author:profiles(name, account_type, verification_status, organization_name, study_abroad_destination, icon_url)
        `)

      query = query.is('community_id', null)

      if (view === 'recommended') {
        query = query.order('created_at', { ascending: false })
      } else if (view === 'latest') {
        query = query.order('created_at', { ascending: false })
      }

      if (selectedCategory === 'question') {
        query = query.eq('category', 'question')
      } else if (selectedCategory === 'diary') {
        query = query.eq('category', 'diary')
      } else if (selectedCategory === 'chat') {
        query = query.in('category', ['chat', 'information'])
      }

      if (selectedMainCategories.length > 0) {
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
          query = query.or(allTags.map(tag => `tags.cs.{${tag}}`).join(','))
        }
      }

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
          query = query.or(allTags.map(tag => `tags.cs.{${tag}}`).join(','))
        }
      }

      if (selectedLocations.length > 0) {
        query = query.in('study_abroad_destination', selectedLocations)
      }

      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,content.ilike.%${debouncedSearchTerm}%`)
      }

      const { data: postsData, error: postsError } = await query.limit(50)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
      }

      let events: TimelineItem[] = []
      let quests: TimelineItem[] = []
      
      if (user) {
        try {
          const { data: userCommunities } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', user.id)
            .eq('status', 'approved')

          const communityIds = userCommunities?.map(c => c.community_id) || []

          if (communityIds.length > 0) {
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

      const allItems: TimelineItem[] = [
        ...(postsData || []),
        ...events,
        ...quests
      ]

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
      case 'information': return 'つぶやき'
      case 'official': return '公式'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'diary': return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'chat': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'information': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'official': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
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

  // スケルトンローディング
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="flex items-center justify-between mt-6">
        <div className="h-8 bg-gray-200 rounded-full w-32"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* ヘッダーセクション */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            タイムライン
          </h1>
          <p className="text-gray-600">最新の投稿やイベントをチェック</p>
        </div>

        {/* セグメントコントロール */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-white rounded-xl p-1.5 shadow-md border border-gray-200">
            <button
              onClick={() => setView('recommended')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                view === 'recommended'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>おすすめ</span>
              </div>
            </button>
            <button
              onClick={() => setView('latest')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                view === 'latest'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>最新</span>
              </div>
            </button>
            {user && (
              <button
                onClick={() => setView('community')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  view === 'community'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>コミュニティ</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 検索バー */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="投稿を検索..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            />
          </form>
        </div>

        {/* フィルター表示/非表示ボタン */}
        {view !== 'community' && (
          <div className="mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
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
                    <span className="ml-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
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

        {/* 絞り込みオプション */}
        {view !== 'community' && showFilters && (
          <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 space-y-6">
            {/* 投稿種別フィルター */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">投稿種別</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <span>すべて</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('question')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedCategory === 'question'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105'
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>質問</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('diary')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedCategory === 'diary'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>日記</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('chat')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedCategory === 'chat'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:scale-105'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>つぶやき</span>
                </button>
              </div>
            </div>

            {/* 大カテゴリフィルター */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">カテゴリ</label>
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
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">詳細カテゴリ</label>
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
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-2 border-primary-400 shadow-md transform scale-105'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:scale-105'
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
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
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
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  {Array.from(Object.keys(countriesByRegion)).every(key => expandedRegions.has(key)) ? 'すべて折りたたむ' : 'すべて展開'}
                </button>
              </div>
              
              {Object.entries(countriesByRegion).map(([regionKey, region]) => {
                const isExpanded = expandedRegions.has(regionKey)
                return (
                  <div key={regionKey} className="mb-3 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
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
                      className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-200"
                    >
                      <h4 className="text-sm font-semibold text-gray-700">{region.label}</h4>
                      <span className="text-xs text-gray-500">
                        {isExpanded ? '▼' : '▶'} {selectedLocations.filter(l => region.countries.some(c => c.name === l)).length > 0 && `(${selectedLocations.filter(l => region.countries.some(c => c.name === l)).length}件選択中)`}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="relative p-3">
                        <button
                          onClick={() => {
                            const ref = locationScrollRefs.current[regionKey]
                            if (ref) {
                              ref.scrollBy({ left: -200, behavior: 'smooth' })
                            }
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div 
                          ref={(el) => { locationScrollRefs.current[regionKey] = el }}
                          className="overflow-x-auto pb-2 scrollbar-hide px-10" 
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
                                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center space-x-2 flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                                  }`}
                                >
                                  <span className="text-lg">{country.flag}</span>
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* 検索窓 */}
              <div className="relative mt-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="国を検索..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {locationSearch && filteredLocations.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
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
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 border-b border-gray-100 last:border-b-0 ${
                          selectedLocations.includes(location) ? 'bg-primary-50' : ''
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{location}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedLocations.length > 0 && (
                <p className="text-sm text-gray-600 mt-3 px-3 py-2 bg-primary-50 rounded-lg border border-primary-200">
                  選択中: <span className="font-semibold text-primary-700">{selectedLocations.join(', ')}</span>
                </p>
              )}
            </div>

            {/* フィルターリセット */}
            {(selectedCategory !== 'all' || selectedMainCategories.length > 0 || selectedDetailCategories.length > 0 || selectedLocations.length > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedMainCategories([])
                    setSelectedDetailCategories([])
                    setSelectedLocations([])
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors"
                >
                  フィルターをリセット
                </button>
              </div>
            )}
          </div>
        )}

        {/* フィルターが非表示でも、フィルターが適用されている場合は簡易表示 */}
        {view !== 'community' && !showFilters && (selectedCategory !== 'all' || selectedMainCategories.length > 0 || selectedDetailCategories.length > 0 || selectedLocations.length > 0) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                {selectedCategory === 'question' ? '質問' : selectedCategory === 'diary' ? '日記' : 'つぶやき'}
              </span>
            )}
            {selectedMainCategories.length > 0 && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                {selectedMainCategories.map(cat => mainCategories.find(c => c.id === cat)?.label).filter(Boolean).join(', ')}
              </span>
            )}
            {selectedDetailCategories.length > 0 && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                詳細: {selectedDetailCategories.length}件
              </span>
            )}
            {selectedLocations.length > 0 && (
              <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                国: {selectedLocations.length}件
              </span>
            )}
          </div>
        )}

        {/* 投稿一覧 */}
        {view === 'community' && (
          <>
            {!user ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">ログインが必要です</p>
              </div>
            ) : communityPosts.length === 0 && !loading ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2 text-lg font-medium">
                  {userCommunityIds.length === 0 
                    ? '所属しているコミュニティがありません' 
                    : 'コミュニティの投稿が見つかりません'}
                </p>
                {userCommunityIds.length === 0 && (
                  <Link href="/communities" className="inline-block mt-4 text-primary-600 hover:text-primary-800 text-sm font-semibold transition-colors">
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
                  className="block group"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          post.type === 'announcement' 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                            : post.type === 'event'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                        }`}>
                          {post.type === 'announcement' ? '📢 お知らせ' : post.type === 'event' ? '📅 イベント' : '🎯 クエスト'}
                        </span>
                        {post.community_name && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-semibold flex items-center space-x-1 border border-gray-300">
                            <Users className="h-3 w-3" />
                            <span>{post.community_name}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 flex items-center font-medium">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(post.event_date || post.created_at)}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {post.type === 'event' && post.location && (
                      <div className="mb-4">
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-semibold border border-primary-200">
                          <MapPin className="h-3 w-3" />
                          <span>{post.location}</span>
                        </span>
                      </div>
                    )}

                    {post.type === 'quest' && (
                      <div className="mb-4 flex items-center space-x-2 flex-wrap gap-2">
                        {post.deadline && (
                          <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                            <Clock className="h-3 w-3" />
                            <span>期限: {formatDate(post.deadline)}</span>
                          </span>
                        )}
                        {post.reward_type && post.reward_amount && (
                          <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200">
                            <Award className="h-3 w-3" />
                            <span>報酬: {post.reward_amount}{post.reward_type === 'candle' ? 'キャンドル' : 'トーチ'}</span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600 font-medium">
                        {post.creator ? (
                          <span>{post.creator.name}</span>
                        ) : (
                          <span>コミュニティ</span>
                        )}
                      </div>
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
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">投稿が見つかりません</p>
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
              <Link key={post.id} href={`/posts/${post.id}`} className={`block group ${getOrganizationBorderColor()}`} onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getCategoryColor(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center font-medium">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-1 leading-relaxed">
                    {post.content}
                  </p>

                  {/* 写真表示 */}
                  {post.image_url && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={post.image_url}
                        alt="投稿画像"
                        className="w-full max-w-md h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* ロケーションタグ */}
                  {post.study_abroad_destination && (
                    <div className="mb-4">
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
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-semibold hover:from-primary-100 hover:to-primary-200 transition-all border border-primary-200"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>{post.study_abroad_destination}</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap gap-3">
                      <div className="flex items-center space-x-2">
                        <UserAvatar 
                          iconUrl={post.author?.icon_url} 
                          name={post.author?.name} 
                          size="sm"
                        />
                        {post.author_id ? (
                          <Link 
                            href={`/profile/${post.author_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary-600 hover:text-primary-800 font-semibold transition-colors"
                          >
                            {post.author?.name || '匿名'}
                          </Link>
                        ) : (
                          <span className="font-medium">{post.author?.name || '匿名'}</span>
                        )}
                      </div>
                      {post.author && (
                        <AccountBadge 
                          accountType={post.author.account_type} 
                          verificationStatus={post.author.verification_status}
                          organizationName={post.author.organization_name}
                          size="sm"
                        />
                      )}
                      {post.university && (
                        <span className="flex items-center text-gray-600">
                          <GraduationCap className="h-4 w-4 mr-1" />
                          <span className="font-medium">{post.university}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-5 text-sm text-gray-600">
                      <span className="flex items-center font-semibold">
                        <Heart className="h-5 w-5 mr-1.5 text-red-500" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center font-semibold">
                        <MessageSquare className="h-5 w-5 mr-1.5 text-primary-500" />
                        {post.comments_count}
                      </span>
                    </div>
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
    </div>
  )
}
