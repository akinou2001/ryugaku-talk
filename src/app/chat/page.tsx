'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Message } from '@/lib/supabase'
import { MessageCircle, Search, User as UserIcon, Send, Clock } from 'lucide-react'
import Link from 'next/link'

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

  useEffect(() => {
    if (user) {
      fetchConversations()
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

      setConversations(Array.from(conversationMap.values()))
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*')

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
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchUsers()
    setShowSearch(true)
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">チャット</h1>
          </div>
        </div>

        {/* ユーザー検索 */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ユーザーを検索</h2>
          
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'id' | 'tag')}
                    className="input-field"
                  >
                    <option value="id">IDで検索</option>
                    <option value="tag">タグ（言語）で検索</option>
                  </select>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={searchType === 'id' ? 'ユーザーIDを入力' : '言語を入力（例: 日本語）'}
                      className="input-field pl-10"
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    検索
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* 検索結果 */}
          {showSearch && searchResults.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">検索結果</h3>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/chat/${result.id}`}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{result.name}</div>
                        <div className="text-sm text-gray-500">{result.email}</div>
                      </div>
                    </div>
                    <button className="btn-primary text-sm">
                      メッセージを送る
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showSearch && searchResults.length === 0 && searchTerm && (
            <div className="border-t border-gray-200 pt-4 text-center text-gray-500">
              検索結果が見つかりませんでした
            </div>
          )}
        </div>

        {/* 会話一覧 */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">会話一覧</h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-6">まだ会話がありません</p>
              <p className="text-sm text-gray-400">上記の検索機能でユーザーを検索してメッセージを送りましょう</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.otherUser.id}
                  href={`/chat/${conversation.otherUser.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{conversation.otherUser.name}</h3>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <span className="text-xs text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(conversation.lastMessage.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Send className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
