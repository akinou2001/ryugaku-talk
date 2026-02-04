'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Message } from '@/lib/supabase'
import { MessageCircle, Search, Send, Plus, X, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'

interface Conversation {
  otherUser: User
  lastMessage?: Message
  unreadCount: number
}

export default function ChatList() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudentStatuses, setSelectedStudentStatuses] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [locationSearch, setLocationSearch] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const locationScrollRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (user) {
      fetchConversations()
      
      // リアルタイムでメッセージを監視
      const channel = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
          },
          () => {
            fetchConversations()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchConversations = async () => {
    if (!user) return

    try {
      // 自分が送信者または受信者のメッセージを取得
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      // 会話相手ごとにグループ化
      const conversationMap = new Map<string, Conversation>()

      messages?.forEach((message) => {
        const otherUserId = message.sender_id === user.id 
          ? message.receiver_id 
          : message.sender_id

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            otherUser: {} as User,
            unreadCount: 0
          })
        }

        const conversation = conversationMap.get(otherUserId)!
        
        // 最新メッセージを設定
        if (!conversation.lastMessage || 
            new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
          conversation.lastMessage = message
        }

        // 未読数をカウント
        if (message.receiver_id === user.id && !message.is_read) {
          conversation.unreadCount++
        }
      })

      // 会話相手のプロフィール情報を取得
      const otherUserIds = Array.from(conversationMap.keys())
      if (otherUserIds.length > 0) {
        try {
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', otherUserIds)

          if (!usersError && users && users.length > 0) {
            users.forEach((profile) => {
              const conversation = conversationMap.get(profile.id)
              if (conversation) {
                conversation.otherUser = profile
              }
            })
          }
        } catch (error) {
          console.error('Error fetching user profiles:', error)
        }
      }

      // 最新メッセージの日時でソート
      const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0
        if (!a.lastMessage) return 1
        if (!b.lastMessage) return -1
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      })

      setConversations(sortedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = useCallback(async (term: string) => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 検索語が空で、フィルターも選択されていない場合は結果をクリア
    if (!term.trim() && selectedStudentStatuses.length === 0 && selectedLocations.length === 0) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController()
    const currentController = abortControllerRef.current

    setIsSearching(true)
    try {
      const escapedTerm = term.trim()
      
      let data: any[] = []
      let error: any = null
      
      // 検索語がある場合、2つのクエリを別々に実行して結果をマージ
      if (escapedTerm) {
        // 名前で検索
        let nameQuery = supabase
          .from('profiles')
          .select('*')
        
        if (user?.id) {
          nameQuery = nameQuery.neq('id', user.id)
        }
        
        nameQuery = nameQuery.ilike('name', `%${escapedTerm}%`)
        
        // 留学先フィルター
        if (selectedLocations.length > 0) {
          nameQuery = nameQuery.in('study_abroad_destination', selectedLocations)
        }
        
        const { data: nameData, error: nameError } = await nameQuery.limit(50)
        
        if (nameError) {
          console.error('Name search error:', nameError)
          error = nameError
        } else {
          data = nameData || []
        }
        
        // 留学先で検索（名前で見つからなかった場合も含めて検索）
        let locationQuery = supabase
          .from('profiles')
          .select('*')
        
        if (user?.id) {
          locationQuery = locationQuery.neq('id', user.id)
        }
        
        locationQuery = locationQuery.ilike('study_abroad_destination', `%${escapedTerm}%`)
        
        // 留学先フィルター
        if (selectedLocations.length > 0) {
          locationQuery = locationQuery.in('study_abroad_destination', selectedLocations)
        }
        
        const { data: locationData, error: locationError } = await locationQuery.limit(50)
        
        if (locationError) {
          console.error('Location search error:', locationError)
          if (!error) error = locationError
        } else {
          // 結果をマージ（重複を除去）
          const existingIds = new Set(data.map(u => u.id))
          const newUsers = (locationData || []).filter(u => !existingIds.has(u.id))
          data = [...data, ...newUsers]
        }
      } else {
        // 検索語がない場合は全ユーザーを取得
        let query = supabase
          .from('profiles')
          .select('*')
        
        if (user?.id) {
          query = query.neq('id', user.id)
        }
        
        // 留学先フィルター
        if (selectedLocations.length > 0) {
          query = query.in('study_abroad_destination', selectedLocations)
        }
        
        const limit = selectedLocations.length > 0 ? 50 : 100
        const result = await query.limit(limit)
        data = result.data || []
        error = result.error
      }
      
      console.log('Executing query with:', {
        searchTerm: escapedTerm,
        selectedLocations,
        selectedStudentStatuses,
        userId: user?.id
      })

      // リクエストがキャンセルされた場合は何もしない
      if (currentController.signal.aborted) {
        return
      }

      if (error) {
        console.error('Error searching users:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('Search term:', escapedTerm)
        console.error('Selected locations:', selectedLocations)
        console.error('Selected student statuses:', selectedStudentStatuses)
        setSearchResults([])
        return
      }

      console.log('Search query successful. Found', data?.length || 0, 'users')
      if (data && data.length > 0) {
        console.log('Sample users:', data.slice(0, 3).map(u => ({ name: u.name, id: u.id, study_abroad_destination: u.study_abroad_destination })))
      } else {
        // デバッグ: 全ユーザーを取得してデータが存在するか確認
        console.log('No results found. Checking if users exist in database...')
        const { data: allUsers, error: allError } = await supabase
          .from('profiles')
          .select('id, name, study_abroad_destination')
          .neq('id', user?.id || '')
          .limit(10)
        
        if (allError) {
          console.error('Error fetching all users:', allError)
        } else {
          console.log('Total users in database (sample):', allUsers?.length || 0)
          if (allUsers && allUsers.length > 0) {
            console.log('Sample users from database:', allUsers)
            // 検索語が含まれているか確認
            const matchingUsers = allUsers.filter(u => 
              u.name?.includes(escapedTerm) || u.study_abroad_destination?.includes(escapedTerm)
            )
            console.log('Users matching search term:', matchingUsers)
          }
        }
      }

      // 留学ステータスフィルターを適用（クライアント側でフィルタリング）
      let filteredData = data || []
      if (selectedStudentStatuses.length > 0) {
        // profilesテーブルにstudent_statusカラムが存在しない場合、タグで検索
        // 現時点では、クライアント側でフィルタリング（後でサーバー側に移行可能）
        filteredData = filteredData.filter(user => {
          // タグに留学ステータスが含まれているか確認
          const tags = user.tags || []
          return selectedStudentStatuses.some(status => {
            const statusMap: Record<string, string[]> = {
              'current': ['現役留学生', 'current'],
              'experienced': ['留学経験者', 'experienced'],
              'applicant': ['留学希望者', 'applicant'],
              'overseas_work': ['海外ワーク', 'overseas_work'],
              'domestic_supporter': ['国内サポーター', 'domestic_supporter']
            }
            const statusTags = statusMap[status] || []
            return statusTags.some(tag => tags.includes(tag))
          })
        })
        console.log('After student status filter:', filteredData.length, 'users')
      }
      
      setSearchResults(filteredData)
    } catch (error: any) {
      // AbortErrorは無視
      if (error?.name !== 'AbortError') {
        console.error('Error searching users:', error)
        setSearchResults([])
      }
    } finally {
      if (!currentController.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [user?.id, selectedStudentStatuses, selectedLocations])

  // デバウンス処理付きの検索
  useEffect(() => {
    // 既存のタイマーをクリア
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 検索語が空で、フィルターも選択されていない場合は結果をクリア
    if (!searchTerm.trim() && selectedStudentStatuses.length === 0 && selectedLocations.length === 0) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // デバウンス処理：300ms待機してから検索実行
    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchTerm)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, selectedStudentStatuses, selectedLocations, searchUsers])

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // フォーム送信時は即座に検索（デバウンスなし）
    // 検索語が空でもフィルターが選択されていれば検索実行
    if (searchTerm.trim() || selectedStudentStatuses.length > 0 || selectedLocations.length > 0) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchUsers(searchTerm)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) return 'たった今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInDays === 1) return '昨日'
    if (diffInDays < 7) return `${diffInDays}日前`
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  // 国を地域で分類（タイムラインと同じ）
  const countriesByRegion = {
    'africa': {
      label: 'アフリカ',
      countries: [
        { code: 'ZA', name: '南アフリカ', flag: '🇿🇦' },
        { code: 'EG', name: 'エジプト', flag: '🇪🇬' },
        { code: 'KE', name: 'ケニア', flag: '🇰🇪' },
        { code: 'NG', name: 'ナイジェリア', flag: '🇳🇬' },
        { code: 'MA', name: 'モロッコ', flag: '🇲🇦' },
        { code: 'GH', name: 'ガーナ', flag: '🇬🇭' },
        { code: 'TZ', name: 'タンザニア', flag: '🇹🇿' },
        { code: 'ET', name: 'エチオピア', flag: '🇪🇹' },
        { code: 'TN', name: 'チュニジア', flag: '🇹🇳' },
        { code: 'DZ', name: 'アルジェリア', flag: '🇩🇿' },
        { code: 'UG', name: 'ウガンダ', flag: '🇺🇬' },
        { code: 'RW', name: 'ルワンダ', flag: '🇷🇼' }
      ]
    },
    'north-america': {
      label: '北アメリカ',
      countries: [
        { code: 'US', name: 'アメリカ', flag: '🇺🇸' },
        { code: 'CA', name: 'カナダ', flag: '🇨🇦' },
        { code: 'MX', name: 'メキシコ', flag: '🇲🇽' },
        { code: 'CR', name: 'コスタリカ', flag: '🇨🇷' },
        { code: 'PA', name: 'パナマ', flag: '🇵🇦' },
        { code: 'GT', name: 'グアテマラ', flag: '🇬🇹' },
        { code: 'CU', name: 'キューバ', flag: '🇨🇺' },
        { code: 'JM', name: 'ジャマイカ', flag: '🇯🇲' },
        { code: 'DO', name: 'ドミニカ共和国', flag: '🇩🇴' }
      ]
    },
    'south-america': {
      label: '南アメリカ',
      countries: [
        { code: 'BR', name: 'ブラジル', flag: '🇧🇷' },
        { code: 'AR', name: 'アルゼンチン', flag: '🇦🇷' },
        { code: 'CL', name: 'チリ', flag: '🇨🇱' },
        { code: 'CO', name: 'コロンビア', flag: '🇨🇴' },
        { code: 'PE', name: 'ペルー', flag: '🇵🇪' },
        { code: 'VE', name: 'ベネズエラ', flag: '🇻🇪' },
        { code: 'EC', name: 'エクアドル', flag: '🇪🇨' },
        { code: 'UY', name: 'ウルグアイ', flag: '🇺🇾' },
        { code: 'PY', name: 'パラグアイ', flag: '🇵🇾' },
        { code: 'BO', name: 'ボリビア', flag: '🇧🇴' }
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
        { code: 'IN', name: 'インド', flag: '🇮🇳' },
        { code: 'IL', name: 'イスラエル', flag: '🇮🇱' },
        { code: 'SA', name: 'サウジアラビア', flag: '🇸🇦' },
        { code: 'AE', name: 'UAE', flag: '🇦🇪' },
        { code: 'QA', name: 'カタール', flag: '🇶🇦' },
        { code: 'KW', name: 'クウェート', flag: '🇰🇼' },
        { code: 'OM', name: 'オマーン', flag: '🇴🇲' },
        { code: 'BD', name: 'バングラデシュ', flag: '🇧🇩' },
        { code: 'PK', name: 'パキスタン', flag: '🇵🇰' },
        { code: 'MM', name: 'ミャンマー', flag: '🇲🇲' },
        { code: 'KH', name: 'カンボジア', flag: '🇰🇭' },
        { code: 'LA', name: 'ラオス', flag: '🇱🇦' }
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
        { code: 'NZ', name: 'ニュージーランド', flag: '🇳🇿' },
        { code: 'FJ', name: 'フィジー', flag: '🇫🇯' },
        { code: 'PG', name: 'パプアニューギニア', flag: '🇵🇬' },
        { code: 'NC', name: 'ニューカレドニア', flag: '🇳🇨' }
      ]
    }
  }

  // 留学ステータスオプション
  const studentStatusOptions = [
    { id: 'current', label: '現役留学生' },
    { id: 'experienced', label: '留学経験者' },
    { id: 'applicant', label: '留学希望者' },
    { id: 'overseas_work', label: '海外ワーク' },
    { id: 'domestic_supporter', label: '国内サポーター' }
  ]

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

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-6">チャット機能を使用するにはログインしてください。</p>
          <div className="flex space-x-4 justify-center">
            <Link href="/auth/signin" className="btn-primary">
              ログイン
            </Link>
            <Link href="/auth/signup" className="btn-secondary">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">メッセージ</h1>
            </div>
          </div>

          {/* 検索バー */}
          <div className="mb-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {isSearching ? (
                        <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="名前、ステータス、目的タグで検索..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary px-6 whitespace-nowrap"
                    disabled={isSearching || (!searchTerm.trim() && selectedStudentStatuses.length === 0 && selectedLocations.length === 0)}
                  >
                    {isSearching ? (
                      <span className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>検索中</span>
                      </span>
                    ) : (
                      '検索'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 px-1">
                  名前で検索できます
                </p>
              </form>

              {/* フィルターボタン */}
              <div className="mt-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
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
                      {(selectedStudentStatuses.length > 0 || selectedLocations.length > 0) && (
                        <span className="ml-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                          {selectedStudentStatuses.length + selectedLocations.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* フィルターオプション */}
              {showFilters && (
                <div className="mt-4 p-4 bg-white rounded-xl shadow-md border border-gray-200 space-y-4">
                  {/* 留学ステータスフィルター */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      留学ステータス
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {studentStatusOptions.map((status) => {
                        const isSelected = selectedStudentStatuses.includes(status.id)
                        return (
                          <button
                            key={status.id}
                            onClick={() => {
                              setSelectedStudentStatuses(prev => {
                                if (prev.includes(status.id)) {
                                  return prev.filter(s => s !== status.id)
                                } else {
                                  return [...prev, status.id]
                                }
                              })
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-2 border-primary-400 shadow-md transform scale-105'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                            }`}
                          >
                            {status.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 留学先フィルター */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        留学先
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
                    
                    {/* 地域別の国の国旗チップ */}
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
                                          setSelectedLocations(prev => {
                                            if (prev.includes(country.name)) {
                                              return prev.filter(c => c !== country.name)
                                            } else {
                                              return [...prev, country.name]
                                            }
                                          })
                                          setLocationSearch('')
                                        }}
                                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center space-x-2 flex-shrink-0 ${
                                          isSelected
                                            ? 'bg-gray-900 text-white shadow-lg transform scale-105'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                                        }`}
                                      >
                                        <span 
                                          className="text-lg emoji" 
                                          style={{ 
                                            fontFamily: 'Twemoji Mozilla, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Segoe UI Symbol, Android Emoji, EmojiSymbols, sans-serif',
                                            display: 'inline-block',
                                            lineHeight: '1',
                                            verticalAlign: 'middle',
                                            fontSize: '1.2em',
                                            minWidth: '1.2em',
                                            textAlign: 'center',
                                            unicodeBidi: 'bidi-override',
                                            direction: 'ltr'
                                          }}
                                          role="img"
                                          aria-label={`${country.name}の国旗`}
                                        >
                                          {country.flag || '🏳️'}
                                        </span>
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
                                if (!selectedLocations.includes(location)) {
                                  setSelectedLocations(prev => [...prev, location])
                                }
                                setLocationSearch('')
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              {location}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 検索結果 */}
              {(searchTerm.trim() || selectedStudentStatuses.length > 0 || selectedLocations.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-gray-500">検索中...</p>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                          検索結果 ({searchResults.length}件)
                        </h3>
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setSearchResults([])
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          クリア
                        </button>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {searchResults.map((result) => (
                          <Link
                            key={result.id}
                            href={`/chat/${result.id}`}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 hover:shadow-md transition-all group"
                            onClick={() => {
                              setSearchTerm('')
                              setSearchResults([])
                            }}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <UserAvatar
                                iconUrl={(result as any).icon_url}
                                name={result.name}
                                size="lg"
                                className="flex-shrink-0 shadow-md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700">
                                    {result.name}
                                  </h3>
                                  {((result.account_type && result.account_type !== 'individual') || result.is_operator) && (
                                    <AccountBadge 
                                      accountType={result.account_type}
                                      verificationStatus={result.verification_status}
                                      organizationName={result.organization_name}
                                      isOperator={result.is_operator}
                                      size="sm"
                                    />
                                  )}
                                </div>
                                {((result as any).student_status || (result as any).study_abroad_destination) && (
                                  <p className="text-sm text-gray-500 truncate">
                                    {(() => {
                                      const statusMap: Record<string, string> = {
                                        'current': '現役留学生',
                                        'experienced': '留学経験者',
                                        'applicant': '留学志願者',
                                        'overseas_work': '海外ワーク',
                                        'domestic_supporter': '国内サポーター'
                                      }
                                      const status = (result as any).student_status
                                      const statusText = status ? statusMap[status] || status : ''
                                      const destination = (result as any).study_abroad_destination || ''
                                      return [statusText, destination].filter(Boolean).join(' • ')
                                    })()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center group-hover:bg-primary-700 transition-colors shadow-sm">
                                <Send className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium mb-1">検索結果が見つかりませんでした</p>
                      <p className="text-xs text-gray-400">
                        別の名前、ステータス、または目的タグで検索してみてください
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 会話一覧 */}
      <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${
        (searchTerm.trim() || selectedStudentStatuses.length > 0 || selectedLocations.length > 0) ? 'opacity-30 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ会話がありません</h3>
              <p className="text-gray-500 mb-6">上の検索バーでユーザーを検索してメッセージを送りましょう</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isUnread = conversation.unreadCount > 0
                const lastMessagePreview = conversation.lastMessage?.content || ''
                const isCandleMessage = false

                return (
                  <Link
                    key={conversation.otherUser.id}
                    href={`/chat/${conversation.otherUser.id}`}
                    className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                      isUnread
                        ? 'bg-white border-2 border-primary-200 shadow-md hover:shadow-lg'
                        : 'bg-white border border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {/* アバター */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        iconUrl={(conversation.otherUser as any).icon_url}
                        name={conversation.otherUser.name}
                        size="xl"
                        className="shadow-md"
                      />
                      {isUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}</span>
                        </div>
                      )}
                    </div>

                    {/* 会話情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {conversation.otherUser.name}
                          </h3>
                          {((conversation.otherUser.account_type && conversation.otherUser.account_type !== 'individual') || conversation.otherUser.is_operator) && (
                            <AccountBadge 
                              accountType={conversation.otherUser.account_type}
                              verificationStatus={conversation.otherUser.verification_status}
                              organizationName={conversation.otherUser.organization_name}
                              isOperator={conversation.otherUser.is_operator}
                              size="sm"
                            />
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDate(conversation.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <div className="flex items-center space-x-2">
                          {isCandleMessage ? (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <span className="text-lg">🕯️</span>
                              <span className="text-sm font-medium">キャンドルを送りました</span>
                            </div>
                          ) : (
                            <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                              {lastMessagePreview}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 矢印アイコン */}
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isUnread ? 'bg-primary-100' : 'bg-gray-100'
                      }`}>
                        <Send className={`h-4 w-4 ${isUnread ? 'text-primary-600' : 'text-gray-400'}`} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
