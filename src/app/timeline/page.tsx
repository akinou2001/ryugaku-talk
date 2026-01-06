'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, MessageSquare, Clock, Search, MapPin, GraduationCap, Sparkles, Users, BookOpen, HelpCircle, Briefcase, Home, GraduationCap as LearnIcon, ChevronLeft, ChevronRight, Filter, X, Calendar, Award, TrendingUp, Heart, Eye, CheckCircle2, Loader2 } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'
import { StudentStatusBadge } from '@/components/StudentStatusBadge'
import { useAuth } from '@/components/Providers'
import { getUserCommunities } from '@/lib/community'
import { UserAvatar } from '@/components/UserAvatar'

type TimelineView = 'latest' | 'community'
type PostCategory = 'all' | 'question' | 'diary' | 'chat'
type MainCategory = 'all' | 'learn' | 'work' | 'live'
type DetailCategory = 'all' | 'regular-study' | 'language-study' | 'exchange' | 'research' | 'working-holiday' | 'residence' | 'local-hire' | 'volunteer' | 'internship' | 'nomad' | 'high-school' | 'summer-school' | 'current' | 'experienced' | 'applicant'

type CommunityPost = {
  id: string
  type: 'post' | 'event' | 'quest'
  title: string
  content: string
  community_id: string
  community_name?: string
  created_at: string
  created_by?: string
  creator?: { 
    name: string
    account_type?: string
    verification_status?: string
    organization_name?: string
    languages?: string[]
  }
  event_date?: string
  location?: string
  deadline?: string
  reward_amount?: number
  category?: string
  likes_count?: number
  comments_count?: number
}

type TimelineItem = Post | {
  id: string
  type: 'event' | 'quest'
  title: string
  content: string
  created_at: string
  community_id?: string
  community_name?: string
  creator?: { 
    name: string
    account_type?: string
    verification_status?: string
    organization_name?: string
    languages?: string[]
  }
  event_date?: string
  location?: string
  deadline?: string
  reward_amount?: number
}

export default function Timeline() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<TimelineView>('latest')
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('all')
  const [selectedMainCategories, setSelectedMainCategories] = useState<MainCategory[]>([])
  const [selectedDetailCategories, setSelectedDetailCategories] = useState<DetailCategory[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [userCommunityIds, setUserCommunityIds] = useState<string[]>([])
  const [locationSearch, setLocationSearch] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false) // 絞り込み表示/非表示
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const locationScrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // スクロール時のヘッダー表示制御
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const threshold = 100 // スクロールの閾値
      
      // ページトップ付近では常に表示
      if (currentScrollY < threshold) {
        setIsHeaderVisible(true)
        setLastScrollY(currentScrollY)
        return
      }
      
      // 上にスクロールする時はヘッダーを表示
      if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true)
      } 
      // 下にスクロールする時はヘッダーを隠す
      else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])
  
  // 検索語が空になった場合は即座にクリア（Enterキーを押すまで検索しない）
  useEffect(() => {
    // 検索語が空の場合は結果をクリア
    if (!searchTerm.trim()) {
      setDebouncedSearchTerm('')
      setIsSearching(false)
    }
  }, [searchTerm])

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
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

  const fetchLocations = async () => {
    // ロケーション情報の取得（将来的に使用する可能性があるため、関数は残す）
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('study_abroad_destination')
        .not('study_abroad_destination', 'is', null)

      if (error) {
        console.error('Error fetching locations:', error)
        return
      }
      // 現在は使用していないが、将来的に使用する可能性があるため、エラーハンドリングは残す
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchCommunityPosts = useCallback(async (communityIds?: string[]) => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController()
    const currentController = abortControllerRef.current

    const ids = communityIds || userCommunityIds
    if (ids.length === 0) {
      setCommunityPosts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const [postsResult, eventsResult, questsResult] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            community:communities(id, name),
            author:profiles(id, name, icon_url, account_type, verification_status, organization_name, languages)
          `)
          .in('community_id', ids)
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select(`
            *,
            community:communities(id, name),
            creator:profiles(id, name, account_type, verification_status, organization_name, languages)
          `)
          .in('community_id', ids)
          .order('event_date', { ascending: false }),
        supabase
          .from('quests')
          .select(`
            *,
            community:communities(id, name),
            creator:profiles(id, name, account_type, verification_status, organization_name, languages)
          `)
          .in('community_id', ids)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      ])

      if (postsResult.error) {
        console.error('Error fetching posts:', postsResult.error)
      }
      if (eventsResult.error) {
        console.error('Error fetching events:', eventsResult.error)
      }
      if (questsResult.error) {
        console.error('Error fetching quests:', questsResult.error)
      }

      const posts: CommunityPost[] = (postsResult.data || []).map((p: any) => ({
        id: p.id,
        type: 'post' as const,
        title: p.title,
        content: p.content,
        community_id: p.community_id,
        community_name: p.community?.name,
        created_at: p.created_at,
        created_by: p.author_id,
        creator: p.author ? { 
          name: p.author.name,
          account_type: p.author.account_type,
          verification_status: p.author.verification_status,
          organization_name: p.author.organization_name,
          languages: p.author.languages
        } : undefined,
        category: p.category,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0
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
        creator: e.creator ? { 
          name: e.creator.name,
          account_type: e.creator.account_type,
          verification_status: e.creator.verification_status,
          organization_name: e.creator.organization_name
        } : undefined,
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
        creator: q.creator ? { 
          name: q.creator.name,
          account_type: q.creator.account_type,
          verification_status: q.creator.verification_status,
          organization_name: q.creator.organization_name
        } : undefined,
        deadline: q.deadline,
        reward_amount: q.reward_amount
      }))

      let allPosts = [...posts, ...events, ...quests]
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

      // リクエストがキャンセルされた場合は何もしない
      if (currentController.signal.aborted) {
        return
      }

      setCommunityPosts(allPosts)
      
      // コミュニティ投稿のいいね状態を取得
      if (user && posts.length > 0) {
        const postIds = posts.map(p => p.id)
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
        
        if (likesData) {
          const likedPostIds = new Set(likesData.map(l => l.post_id))
          setLikedPosts(prev => {
            const newSet = new Set(prev)
            likedPostIds.forEach(id => newSet.add(id))
            return newSet
          })
        }
      }
    } catch (error: any) {
      // AbortErrorは無視
      if (error?.name !== 'AbortError') {
        console.error('Error fetching community posts:', error)
        setCommunityPosts([])
      }
    } finally {
      if (!currentController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [userCommunityIds, debouncedSearchTerm])

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

  // useEffectを関数定義の後に配置
  useEffect(() => {
    if (view === 'community' && user) {
      fetchUserCommunities()
    } else if (view !== 'community') {
      // fetchPostsは後で定義されるため、ここでは直接呼び出さない
      // 代わりに、fetchPostsの依存関係が変更されたときに再実行されるようにする
    }
  }, [view, user])

  // fetchPostsとfetchLocationsを呼び出すuseEffect
  useEffect(() => {
    if (view !== 'community') {
      fetchPosts()
      fetchLocations()
    }
  }, [view, selectedCategory, selectedMainCategories, selectedDetailCategories, selectedLocations, debouncedSearchTerm, user])

  useEffect(() => {
    if (view === 'community' && userCommunityIds.length > 0) {
      fetchCommunityPosts()
    } else if (view === 'community' && userCommunityIds.length === 0) {
      // コミュニティがない場合はローディングを解除
      // fetchUserCommunities内で既にsetLoading(false)が呼ばれているので、
      // ここでは重複して呼ばないようにする
    }
  }, [view, userCommunityIds, debouncedSearchTerm, fetchCommunityPosts])

  const fetchPosts = async () => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController()
    const currentController = abortControllerRef.current

    try {
      setLoading(true)
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name, account_type, verification_status, organization_name, study_abroad_destination, icon_url, languages)
        `)

      // コミュニティ限定投稿は除外（通常のタイムラインでは表示しない）
      query = query.is('community_id', null)

      // ビューに応じたフィルタリング
      if (view === 'latest') {
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

      // リクエストがキャンセルされた場合は何もしない
      if (currentController.signal.aborted) {
        return
      }

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
      
      // いいね状態を取得
      if (user && postsData && postsData.length > 0) {
        const postIds = postsData.map(p => p.id)
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
        
        if (likesData) {
          const likedPostIds = new Set(likesData.map(l => l.post_id))
          setLikedPosts(likedPostIds)
        }
      } else if (!user) {
        setLikedPosts(new Set())
      }
    } catch (error: any) {
      // AbortErrorは無視
      if (error?.name !== 'AbortError') {
        console.error('Error fetching posts:', error)
      }
    } finally {
      if (!currentController.signal.aborted) {
        setLoading(false)
      }
    }
  }
  
  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const isLiked = likedPosts.has(postId)

    try {
      if (isLiked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error
        
        setLikedPosts(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
        
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
        ))
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        if (error) throw error
        
        setLikedPosts(prev => new Set(prev).add(postId))
        
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
        ))
      }
    } catch (error: any) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Enterキーを押したときだけ検索を実行
    if (searchTerm.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      setIsSearching(true)
      setDebouncedSearchTerm(searchTerm)
      // 検索を実行
      if (view === 'community') {
        if (userCommunityIds.length > 0) {
          fetchCommunityPosts().finally(() => {
            setIsSearching(false)
          })
        } else {
          setIsSearching(false)
        }
      } else {
        fetchPosts().finally(() => {
          setIsSearching(false)
        })
      }
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return HelpCircle
      case 'diary': return BookOpen
      case 'chat': return MessageCircle
      case 'information': return MessageCircle // 後方互換性
      default: return MessageCircle
    }
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
      case 'question': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'diary': return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'chat': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'information': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' // 後方互換性
      case 'official': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }
  
  // スケルトンローディング
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-1.5"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded-full w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* ヘッダーセクション（スクロール時に表示/非表示） */}
      <div 
        ref={headerRef}
        className={`sticky top-0 z-50 bg-gradient-to-br from-white via-gray-50 to-white backdrop-blur-md border-b border-gray-200 shadow-sm transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              タイムライン
            </h1>
            <p className="text-sm text-gray-600">最新の投稿やイベントをチェック</p>
          </div>

          {/* セグメントコントロール */}
          <div className="mb-3">
            <div className="flex space-x-2 bg-white rounded-xl p-1 shadow-md border border-gray-200">
              <button
                onClick={() => setView('latest')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  view === 'latest'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>最新</span>
                </div>
              </button>
              {user && (
                <button
                  onClick={() => setView('community')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    view === 'community'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>コミュニティ</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* 検索バー */}
          <div className="mb-3">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="投稿を検索..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                autoFocus={false}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    // クリアボタンクリック時は即座にクリア
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current)
                    }
                    setSearchTerm('')
                    setDebouncedSearchTerm('')
                    setIsSearching(false)
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                  aria-label="検索をクリア"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              )}
            </form>
            {debouncedSearchTerm && (
              <div className="mt-1.5 text-xs text-gray-600 flex items-center space-x-1.5">
                <Search className="h-3.5 w-3.5" />
                <span>
                  「{debouncedSearchTerm}」の検索結果
                  {!loading && !isSearching && view !== 'community' && posts.length > 0 && (
                    <span className="ml-1 text-primary-600 font-semibold">
                      ({posts.length}件)
                    </span>
                  )}
                </span>
              </div>
            )}
            {searchTerm && !debouncedSearchTerm && (
              <div className="mt-1.5 text-xs text-gray-500 flex items-center space-x-1.5">
                <span>Enterキーで検索</span>
              </div>
            )}
          </div>

          {/* フィルター表示/非表示ボタン */}
          {view !== 'community' && (
            <div className="mb-3">
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
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              {Array.from(Object.keys(countriesByRegion)).every(key => expandedRegions.has(key)) ? 'すべて折りたたむ' : 'すべて展開'}
            </button>
          </div>
          
              {/* 地域別の国の国旗チップ（横スクロール・折りたたみ可能） */}
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
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* 投稿一覧 */}
        {view === 'community' && (
          <>
            {debouncedSearchTerm && view === 'community' && (
              <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>
                  「{debouncedSearchTerm}」の検索結果
                  {!loading && communityPosts.length > 0 && (
                    <span className="ml-1 text-primary-600 font-semibold">
                      ({communityPosts.length}件)
                    </span>
                  )}
                </span>
              </div>
            )}
            {!user ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">ログインが必要です</p>
              </div>
            ) : loading && !isSearching ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : loading && isSearching ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                  <p className="text-gray-500 text-lg font-medium">検索中...</p>
                </div>
              </div>
            ) : communityPosts.length === 0 && !loading ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                {debouncedSearchTerm ? (
                  <>
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2 text-lg font-medium">
                      「{debouncedSearchTerm}」に一致する投稿が見つかりませんでした
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      別のキーワードで検索してみてください
                    </p>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {communityPosts.map((post) => (
                <Link 
                  key={post.id} 
                  href={post.type === 'quest' ? `/communities/${post.community_id}?tab=quests#quest-${post.id}` : post.type === 'post' ? `/posts/${post.id}` : `/communities/${post.community_id}?tab=events#event-${post.id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg hover:border-primary-200 transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1.5">
                        {post.type === 'post' ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 ${getCategoryColor((post as any).category)}`}>
                            {(() => {
                              const category = (post as any).category
                              const Icon = getCategoryIcon(category)
                              return (
                                <>
                                  <Icon className="h-2.5 w-2.5 text-white" />
                                  {getCategoryLabel(category)}
                                </>
                              )
                            })()}
                          </span>
                        ) : post.type === 'event' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            📅 イベント
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            🎯 クエスト
                          </span>
                        )}
                        {post.community_name && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-medium flex items-center space-x-0.5 border border-gray-300">
                            <Users className="h-2.5 w-2.5" />
                            <span>{post.community_name}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center font-medium">
                        <Clock className="h-3 w-3 mr-0.5" />
                        {formatDate(post.event_date || post.created_at)}
                      </span>
                    </div>
                    
                    {post.type === 'post' && (post as any).category === 'chat' ? (
                      <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-snug">
                        {post.content}
                      </h2>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors leading-snug">
                          {post.title}
                        </h2>
                        {/* 日記の内容は非表示 */}
                        {(post as any).category !== 'diary' && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>
                        )}
                      </>
                    )}

                    {post.type === 'event' && post.location && (
                      <div className="mb-2">
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                          <MapPin className="h-2.5 w-2.5" />
                          <span>{post.location}</span>
                        </span>
                      </div>
                    )}

                    {post.type === 'quest' && (
                      <div className="mb-2 flex items-center space-x-1.5 flex-wrap gap-1.5">
                        {post.deadline && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-full text-xs font-medium border border-red-200">
                            <Clock className="h-2.5 w-2.5" />
                            <span>期限: {formatDate(post.deadline)}</span>
                          </span>
                        )}
                        {post.reward_amount && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                            <Award className="h-2.5 w-2.5" />
                            <span>報酬: {post.reward_amount}ポイント</span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-2">
                        {post.creator ? (
                          <>
                            <span className="text-xs text-gray-600 font-medium">{post.creator.name}</span>
                            {/* 投稿カテゴリがofficialの場合はAccountBadgeを非表示 */}
                            {post.creator.account_type && post.creator.account_type !== 'individual' && (post as any).category !== 'official' && (
                              <AccountBadge 
                                accountType={post.creator.account_type as 'educational' | 'company' | 'government'} 
                                verificationStatus={(post.creator.verification_status || 'unverified') as 'unverified' | 'pending' | 'verified' | 'rejected'}
                                organizationName={post.creator.organization_name}
                                size="sm"
                              />
                            )}
                            <StudentStatusBadge 
                              languages={(post.creator as any).languages}
                              size="sm"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">コミュニティ</span>
                        )}
                      </div>
                      {post.type === 'post' && (post.likes_count !== undefined || post.comments_count !== undefined) && (
                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                          {post.likes_count !== undefined && (
                            <button
                              onClick={(e) => handleLike(post.id, e)}
                              className={`flex items-center font-semibold transition-all ${
                                likedPosts.has(post.id)
                                  ? 'text-red-600 hover:text-red-700'
                                  : 'text-gray-600 hover:text-red-600'
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 mr-1 ${likedPosts.has(post.id) ? 'fill-current text-red-500' : 'text-red-500'}`} />
                              {post.likes_count || 0}
                            </button>
                          )}
                          {post.comments_count !== undefined && (
                            <span className="flex items-center font-semibold">
                              <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary-500" />
                              {post.comments_count || 0}
                            </span>
                          )}
                        </div>
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
            {loading && !isSearching ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : loading && isSearching ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                  <p className="text-gray-500 text-lg font-medium">検索中...</p>
                </div>
              </div>
            ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                {debouncedSearchTerm 
                  ? `「${debouncedSearchTerm}」に一致する投稿が見つかりませんでした`
                  : '投稿が見つかりません'}
              </p>
              {debouncedSearchTerm && (
                <p className="text-sm text-gray-400 mt-2">
                  別のキーワードで検索してみてください
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                return (
              <Link key={post.id} href={`/posts/${post.id}`} className="block group" onClick={(e) => e.stopPropagation()}>
                <div className={`bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-200 ${
                  post.category === 'diary' && post.cover_image_url ? 'p-0 overflow-hidden' : 'p-4'
                }`}>
                  <div className={`flex items-center justify-between ${post.category === 'diary' && post.cover_image_url ? 'absolute top-3 left-3 right-3 z-10' : 'mb-2'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.category === 'diary' && post.cover_image_url ? (
                        <span className={`px-3 py-1.5 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-xs font-semibold flex items-center gap-1 text-white shadow-lg ${getCategoryColor(post.category)}`}>
                          {(() => {
                            const Icon = getCategoryIcon(post.category)
                            return <Icon className="h-3 w-3 text-white" />
                          })()}
                          {getCategoryLabel(post.category)}
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 ${getCategoryColor(post.category)}`}>
                          {(() => {
                            const Icon = getCategoryIcon(post.category)
                            return <Icon className="h-2.5 w-2.5 text-white" />
                          })()}
                          {getCategoryLabel(post.category)}
                        </span>
                      )}
                      {/* 解決済みバッジ（質問のみ） */}
                      {post.category === 'question' && post.is_resolved && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white">
                          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          解決済み
                        </span>
                      )}
                      {/* ロケーションタグ（日記でカバー画像がある場合は非表示、それ以外は表示） */}
                      {post.study_abroad_destination && !(post.category === 'diary' && post.cover_image_url) && (
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
                          className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium hover:from-primary-100 hover:to-primary-200 transition-all border border-primary-200"
                        >
                          <MapPin className="h-2.5 w-2.5" />
                          <span>{post.study_abroad_destination}</span>
                        </button>
                      )}
                    </div>
                    {post.category === 'diary' && post.cover_image_url ? (
                      <span className="px-3 py-1.5 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-xs font-semibold text-white shadow-lg flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center font-medium">
                        <Clock className="h-3 w-3 mr-0.5" />
                        {formatDate(post.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {/* 日記でカバー画像がある場合の特別なレイアウト */}
                  {post.category === 'diary' && post.cover_image_url ? (
                    <div className="relative">
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={post.cover_image_url}
                          alt="カバー写真"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* グラデーションオーバーレイ */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20"></div>
                        
                        {/* 左上：ユーザー情報（グラスモーフィズム） */}
                        <div className="absolute top-3 left-3 z-20">
                          <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-xl p-2.5 shadow-2xl">
                            <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                              <UserAvatar 
                                iconUrl={post.author?.icon_url} 
                                name={post.author?.name} 
                                size="sm"
                              />
                              {post.author_id ? (
                                <span
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    router.push(`/profile/${post.author_id}`)
                                  }}
                                  className="text-white font-semibold text-xs drop-shadow-lg hover:text-primary-200 transition-colors cursor-pointer"
                                >
                                  {post.author?.name || '匿名'}
                                </span>
                              ) : (
                                <span className="text-white font-semibold text-xs drop-shadow-lg">{post.author?.name || '匿名'}</span>
                              )}
                              {post.author && (
                                <>
                                  {/* 投稿カテゴリがofficialの場合はAccountBadgeを非表示 */}
                                  {post.author.account_type && post.author.account_type !== 'individual' && (
                                    <div className="drop-shadow-lg">
                                      <AccountBadge 
                                        accountType={post.author.account_type} 
                                        verificationStatus={post.author.verification_status}
                                        organizationName={post.author.organization_name}
                                        size="sm"
                                      />
                                    </div>
                                  )}
                                  <div className="drop-shadow-lg">
                                    <StudentStatusBadge 
                                      languages={post.author.languages}
                                      size="sm"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 右下：いいね数・コメント数（グラスモーフィズム） */}
                        <div className="absolute bottom-3 right-3 z-20">
                          <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-xl px-3 py-2 shadow-2xl">
                            <div className="flex items-center space-x-3 text-xs text-white">
                              <button
                                onClick={(e) => handleLike(post.id, e)}
                                className={`flex items-center font-semibold drop-shadow-lg transition-all ${
                                  likedPosts.has(post.id)
                                    ? 'text-red-300 hover:text-red-200'
                                    : 'text-white hover:text-red-200'
                                }`}
                              >
                                <Heart className={`h-3.5 w-3.5 mr-1 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                {post.likes_count}
                              </button>
                              <span className="flex items-center font-semibold drop-shadow-lg">
                                <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary-200" />
                                {post.comments_count}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 下部オーバーレイ（タイトルとタグ用） */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                          {/* タイトル（画像の上に重ねて表示） */}
                          <h2 className="text-xl font-bold text-white mb-3 leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-primary-200 transition-colors">
                            {post.title}
                          </h2>
                          
                          {/* タグチップ */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 日記タグ */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 ${getCategoryColor(post.category)} drop-shadow-lg`}>
                              {(() => {
                                const Icon = getCategoryIcon(post.category)
                                return <Icon className="h-2.5 w-2.5 text-white" />
                              })()}
                              {getCategoryLabel(post.category)}
                            </span>
                            {post.study_abroad_destination && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium hover:from-primary-100 hover:to-primary-200 transition-all border border-primary-200 drop-shadow-lg flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {post.study_abroad_destination}
                              </span>
                            )}
                            {post.university && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium hover:from-primary-100 hover:to-primary-200 transition-all border border-primary-200 drop-shadow-lg flex items-center gap-0.5">
                                <GraduationCap className="h-2.5 w-2.5" />
                                {post.university}
                              </span>
                            )}
                            {post.tags && post.tags.length > 0 && post.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium hover:from-primary-100 hover:to-primary-200 transition-all border border-primary-200 drop-shadow-lg">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : post.category === 'chat' ? (
                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-snug">
                      {post.content}
                    </h2>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors leading-snug">
                        {post.title}
                      </h2>
                      {/* 日記の内容は非表示 */}
                      {post.category !== 'diary' && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      )}
                      
                      {/* 通常の写真表示（日記以外、またはカバー画像がない場合） */}
                      {post.cover_image_url ? (
                        <div className="mb-2 rounded-lg overflow-hidden border border-primary-200 shadow-sm relative">
                          <img
                            src={post.cover_image_url}
                            alt="カバー写真"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ) : post.image_url ? (
                        <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={post.image_url}
                            alt="投稿画像"
                            className="w-full max-w-md h-auto object-cover"
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                  
                  {/* フッター情報（日記でカバー画像がない場合、または日記以外の場合） */}
                  {!(post.category === 'diary' && post.cover_image_url) && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-xs text-gray-600 flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5">
                        <UserAvatar 
                          iconUrl={post.author?.icon_url} 
                          name={post.author?.name} 
                          size="sm"
                        />
                        {post.author_id ? (
                          <span
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/profile/${post.author_id}`)
                            }}
                            className="text-primary-600 hover:text-primary-800 font-semibold transition-colors cursor-pointer"
                          >
                            {post.author?.name || '匿名'}
                          </span>
                        ) : (
                          <span className="font-medium">{post.author?.name || '匿名'}</span>
                        )}
                      </div>
                      {post.author && (
                        <>
                          {/* 投稿カテゴリがofficialの場合はAccountBadgeを非表示 */}
                          {post.author.account_type && post.author.account_type !== 'individual' && post.category !== 'official' && (
                            <AccountBadge 
                              accountType={post.author.account_type} 
                              verificationStatus={post.author.verification_status}
                              organizationName={post.author.organization_name}
                              size="sm"
                            />
                          )}
                          <StudentStatusBadge 
                            languages={post.author.languages}
                            size="sm"
                          />
                        </>
                      )}
                      {post.university && (
                        <span className="flex items-center text-gray-600">
                          <GraduationCap className="h-3 w-3 mr-0.5" />
                          <span className="font-medium text-xs">{post.university}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center font-semibold transition-all ${
                          likedPosts.has(post.id)
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-gray-600 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 mr-1 ${likedPosts.has(post.id) ? 'fill-current text-red-500' : 'text-red-500'}`} />
                        {post.likes_count}
                      </button>
                      <span className="flex items-center font-semibold">
                        <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary-500" />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                  )}
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

