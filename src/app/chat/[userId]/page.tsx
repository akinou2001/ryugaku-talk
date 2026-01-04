'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Message } from '@/lib/supabase'
import { ArrowLeft, Send, User as UserIcon, Clock, Check, CheckCheck, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { notifyDM } from '@/lib/notifications'

export default function ChatDetail() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && userId) {
      fetchUserProfile()
      fetchMessages()
      
      // リアルタイムでメッセージを監視
      const channel = supabase
        .channel(`messages:${user.id}:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id}))`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMsg = payload.new as Message
              setMessages((prev) => {
                // 重複チェック
                if (prev.some(m => m.id === newMsg.id)) return prev
                return [...prev, newMsg]
              })
              if (newMsg.receiver_id === user.id) {
                markAsRead(newMsg.id)
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages((prev) => 
                prev.map(msg => msg.id === payload.new.id ? payload.new as Message : msg)
              )
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, userId])

  useEffect(() => {
    // メッセージが更新されたらスクロール
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setOtherUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data || [])
      
      // 未読メッセージを既読にする
      const unreadMessages = data?.filter(
        (msg) => msg.receiver_id === user.id && !msg.is_read
      ) || []
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg) => msg.id)
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', messageIds)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!user) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', user.id)
  }


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || sending) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          content: newMessage.trim(),
          is_read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      // 受信者に通知を送信
      const messagePreview = newMessage.trim().substring(0, 50)
      await notifyDM(
        userId,
        user.name || '匿名',
        messagePreview
      )

      setMessages((prev) => [...prev, data])
      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'たった今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '今日'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日'
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      })
    }
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
          <Link href="/auth/signin" className="btn-primary">
            ログイン
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ユーザーが見つかりません</h1>
          <button onClick={() => router.back()} className="btn-primary">
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <Link href={`/profile/${otherUser.id}`} className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                  {getInitials(otherUser.name)}
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">{otherUser.name}</h1>
                  {otherUser.account_type && otherUser.account_type !== 'individual' && (
                    <AccountBadge 
                      accountType={otherUser.account_type}
                      verificationStatus={otherUser.verification_status}
                      organizationName={otherUser.organization_name}
                      size="sm"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{otherUser.email}</p>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-gray-50 to-white"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">会話を始めましょう</h3>
              <p className="text-gray-500 mb-6">メッセージを送って会話を始めましょう</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMyMessage = message.sender_id === user.id
              const showDate = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString()
              
              const isCandleMessage = false
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showAvatar = !prevMessage || 
                prevMessage.sender_id !== message.sender_id ||
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000 // 5分以上経過

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                        <span className="text-xs font-medium text-gray-600">{formatDate(message.created_at)}</span>
                      </div>
                    </div>
                  )}
                  <div className={`flex items-end space-x-2 ${isMyMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* アバター */}
                    {!isMyMessage && (
                      <div className="flex-shrink-0">
                        {showAvatar ? (
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(otherUser.name)}
                          </div>
                        ) : (
                          <div className="w-8 h-8"></div>
                        )}
                      </div>
                    )}

                    {/* メッセージバブル */}
                    <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
                          isCandleMessage
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
                            : isMyMessage
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                        style={{
                          borderRadius: isMyMessage 
                            ? '1rem 1rem 0.25rem 1rem' 
                            : '1rem 1rem 1rem 0.25rem'
                        }}
                      >
                        {isCandleMessage ? (
                          <div className="text-center">
                            <div className="text-3xl mb-1">🕯️</div>
                            <p className="text-sm font-medium text-gray-700">キャンドルを送りました</p>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </div>
                      
                      {/* タイムスタンプと既読マーク */}
                      <div className={`flex items-center space-x-1 mt-1 px-1 ${isMyMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {isMyMessage && (
                          <div className="text-primary-600">
                            {message.is_read ? (
                              <CheckCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 自分のアバター（通常は非表示） */}
                    {isMyMessage && showAvatar && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {getInitials(user.name)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* メッセージ入力エリア */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {candleSent && (
            <div className="mb-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 flex items-center space-x-1">
                <span>🕯️</span>
                <span>今週は既にキャンドルを送信済みです（週1回まで）</span>
              </p>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e)
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`p-3 rounded-full transition-all transform ${
                newMessage.trim() && !sending
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
