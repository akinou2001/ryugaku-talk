'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Message } from '@/lib/supabase'
import { MessageCircle, Search, User as UserIcon, Clock, Send, Plus, X, Hash, Tag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'

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
  const [searchType, setSearchType] = useState<'id' | 'tag'>('id')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

  const searchUsers = useCallback(async (term: string, type: 'id' | 'tag') => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!term.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController()
    const currentController = abortControllerRef.current

    setIsSearching(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id) // 自分を除外

      if (type === 'id') {
        // IDで検索（部分一致）
        query = query.ilike('id', `%${term}%`)
      } else {
        // タグ（言語）で検索
        query = query.contains('languages', [term])
      }

      const { data, error } = await query.limit(20)

      // リクエストがキャンセルされた場合は何もしない
      if (currentController.signal.aborted) {
        return
      }

      if (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
        return
      }

      setSearchResults(data || [])
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
  }, [user?.id])

  // デバウンス処理付きの検索
  useEffect(() => {
    // 既存のタイマーをクリア
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 検索バーが閉じられている場合は何もしない
    if (!showSearch) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // 検索語が空の場合は結果をクリア
    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // デバウンス処理：300ms待機してから検索実行
    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchTerm, searchType)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, searchType, showSearch, searchUsers])

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
    if (searchTerm.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchUsers(searchTerm, searchType)
    }
  }

  const handleSearchTypeChange = (type: 'id' | 'tag') => {
    setSearchType(type)
    // 検索タイプ変更時は検索語があれば再検索
    if (searchTerm.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchUsers(searchTerm, type)
    } else {
      setSearchResults([])
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
              <h1 className="text-2xl font-bold text-gray-900">メッセージ</h1>
            </div>
            <button
              onClick={() => {
                setShowSearch(!showSearch)
                if (showSearch) {
                  // 検索バーを閉じる時に検索状態をリセット
                  setSearchTerm('')
                  setSearchResults([])
                  setIsSearching(false)
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={showSearch ? '検索を閉じる' : '新しい会話を始める'}
            >
              {showSearch ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Plus className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* 検索バー */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showSearch ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSearchTypeChange('id')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      searchType === 'id'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Hash className="h-4 w-4" />
                    <span>ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchTypeChange('tag')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      searchType === 'tag'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                    <span>タグ</span>
                  </button>
                </div>
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
                      placeholder={searchType === 'id' ? 'ユーザーIDを入力...' : '言語を入力（例: 日本語）...'}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary px-6 whitespace-nowrap"
                    disabled={isSearching || !searchTerm.trim()}
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
              </form>

              {/* 検索結果 */}
              {searchTerm.trim() && (
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
                              setShowSearch(false)
                              setSearchTerm('')
                              setSearchResults([])
                            }}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md">
                                {getInitials(result.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700">
                                    {result.name}
                                  </h3>
                                  {result.account_type && result.account_type !== 'individual' && (
                                    <AccountBadge 
                                      accountType={result.account_type}
                                      verificationStatus={result.verification_status}
                                      organizationName={result.organization_name}
                                      size="sm"
                                    />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{result.email}</p>
                                {searchType === 'id' && (
                                  <p className="text-xs text-gray-400 mt-0.5">ID: {result.id}</p>
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
                        {searchType === 'id' 
                          ? '別のユーザーIDで検索してみてください' 
                          : '別の言語で検索してみてください'}
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
        showSearch && searchTerm.trim() ? 'opacity-30 pointer-events-none' : 'opacity-100'
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
              <p className="text-gray-500 mb-6">ユーザーを検索してメッセージを送りましょう</p>
              <button
                onClick={() => setShowSearch(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>新しい会話を始める</span>
              </button>
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
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {getInitials(conversation.otherUser.name)}
                      </div>
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
                          {conversation.otherUser.account_type && conversation.otherUser.account_type !== 'individual' && (
                            <AccountBadge 
                              accountType={conversation.otherUser.account_type}
                              verificationStatus={conversation.otherUser.verification_status}
                              organizationName={conversation.otherUser.organization_name}
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
