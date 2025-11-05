'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { User, Message } from '@/lib/supabase'
import { ArrowLeft, Send, User as UserIcon, Clock } from 'lucide-react'
import Link from 'next/link'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
            filter: `sender_id=eq.${userId},receiver_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setMessages((prev) => [...prev, payload.new as Message])
              markAsRead(payload.new.id)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      setMessages((prev) => [...prev, data])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
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
      return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
    }
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="card mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{otherUser.name}</h1>
              <p className="text-sm text-gray-500">{otherUser.email}</p>
            </div>
            <Link href={`/profile/${otherUser.id}`} className="btn-secondary text-sm">
              プロフィールを見る
            </Link>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="card mb-4" style={{ height: '500px', overflowY: 'auto' }}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">まだメッセージがありません</p>
                <p className="text-sm text-gray-400 mt-2">メッセージを送って会話を始めましょう</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMyMessage = message.sender_id === user.id
                const showDate = index === 0 || 
                  new Date(message.created_at).toDateString() !== 
                  new Date(messages[index - 1].created_at).toDateString()

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatDate(message.created_at)}
                      </div>
                    )}
                    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMyMessage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center mt-1 text-xs ${
                          isMyMessage ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* メッセージ入力 */}
        <form onSubmit={handleSend} className="card">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="input-field flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? '送信中...' : '送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
