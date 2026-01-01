'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Message } from '@/lib/supabase'
import { MessageCircle, Search, User as UserIcon, Clock, Send, Plus, X, Hash, Tag } from 'lucide-react'
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

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setShowSearch(false)
      return
    }

    setIsSearching(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id) // 自分を除外

      if (searchType === 'id') {
        // IDで検索（部分一致）
        query = query.ilike('id', `%${searchTerm}%`)
      } else {
        // タグ（言語）で検索
        query = query.contains('languages', [searchTerm])
      }

      const { data, error } = await query.limit(10)

      if (error) {
        console.error('Error searching users:', error)
        return
      }

      setSearchResults(data || [])
      setShowSearch(true)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchUsers()
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
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {showSearch ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Plus className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* 検索バー */}
          {showSearch && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSearchType('id')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      searchType === 'id'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Hash className="h-4 w-4" />
                    <span>ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('tag')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      searchType === 'tag'
                        ? 'bg-primary-600 text-white'
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
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        if (e.target.value.trim()) {
                          searchUsers()
                        } else {
                          setSearchResults([])
                          setShowSearch(false)
                        }
                      }}
                      placeholder={searchType === 'id' ? 'ユーザーIDを入力...' : '言語を入力（例: 日本語）...'}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary px-6"
                    disabled={isSearching}
                  >
                    {isSearching ? '検索中...' : '検索'}
                  </button>
                </div>
              </form>

              {/* 検索結果 */}
              {searchResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">検索結果</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={`/chat/${result.id}`}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all"
                        onClick={() => {
                          setShowSearch(false)
                          setSearchTerm('')
                          setSearchResults([])
                        }}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {getInitials(result.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 truncate">{result.name}</h3>
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
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                            <Send className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchTerm && searchResults.length === 0 && !isSearching && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">検索結果が見つかりませんでした</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 会話一覧 */}
      <div className="flex-1 overflow-y-auto">
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
