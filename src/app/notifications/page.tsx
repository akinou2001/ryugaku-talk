'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, Calendar, Award, Shield, ArrowRight, Search, Filter } from 'lucide-react'
import Link from 'next/link'
// 日付フォーマット関数（date-fnsの代替）
const formatDistanceToNow = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'たった今'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}週間前`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}ヶ月前`
  return `${Math.floor(diffInSeconds / 31536000)}年前`
}

interface Notification {
  id: string
  type: 'announcement' | 'community_event' | 'community_quest' | 'urgent_question' | 'safety_check' | 'dm' | 'comment' | 'like'
  title: string
  content?: string
  link_url?: string
  is_read: boolean
  created_at: string
}

type NotificationTypeFilter = 'all' | 'dm' | 'safety_check' | 'comment' | 'like' | 'announcement' | 'community_event' | 'community_quest' | 'urgent_question'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // リアルタイムで通知を監視
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされた通知
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // タイプフィルター
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // 検索フィルター
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        (n.content && n.content.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [notifications, typeFilter, searchTerm])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'announcement': return <AlertCircle className="h-5 w-5 text-blue-600" />
      case 'community_event': return <Calendar className="h-5 w-5 text-green-600" />
      case 'community_quest': return <Award className="h-5 w-5 text-yellow-600" />
      case 'urgent_question': return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'safety_check': return <Shield className="h-5 w-5 text-orange-600" />
      case 'dm': return <MessageSquare className="h-5 w-5 text-purple-600" />
      case 'comment': return <MessageSquare className="h-5 w-5 text-blue-600" />
      case 'like': return <CheckCircle className="h-5 w-5 text-pink-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'announcement': return 'bg-blue-50 border-blue-200'
      case 'community_event': return 'bg-green-50 border-green-200'
      case 'community_quest': return 'bg-yellow-50 border-yellow-200'
      case 'urgent_question': return 'bg-red-50 border-red-200'
      case 'safety_check': return 'bg-orange-50 border-orange-200'
      case 'dm': return 'bg-purple-50 border-purple-200'
      case 'comment': return 'bg-blue-50 border-blue-200'
      case 'like': return 'bg-pink-50 border-pink-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
            <p className="text-gray-600 mb-6">通知を表示するにはログインしてください。</p>
            <Link href="/auth/signin" className="btn-primary">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getTypeLabel = (type: NotificationTypeFilter) => {
    switch (type) {
      case 'all': return 'すべて'
      case 'dm': return 'メッセージ'
      case 'safety_check': return '安全確認'
      case 'comment': return 'コメント'
      case 'like': return 'いいね'
      case 'announcement': return 'お知らせ'
      case 'community_event': return 'コミュニティイベント'
      case 'community_quest': return 'コミュニティクエスト'
      case 'urgent_question': return '緊急の質問'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">通知</h1>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm text-primary-600 hover:text-primary-800 font-semibold"
              >
                すべて既読にする
              </button>
            )}
          </div>

          {/* 検索バー */}
          <div className="mb-4">
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="通知を検索..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                  aria-label="検索をクリア"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              )}
            </form>
          </div>

          {/* フィルター表示/非表示ボタン */}
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
                  {typeFilter !== 'all' && (
                    <span className="ml-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                      1
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* フィルター */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">通知タイプ</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'dm', 'safety_check', 'comment', 'like', 'announcement', 'community_event', 'community_quest', 'urgent_question'] as NotificationTypeFilter[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      typeFilter === type
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                    }`}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* フィルターが非表示でも、フィルターが適用されている場合は簡易表示 */}
          {!showFilters && (typeFilter !== 'all' || searchTerm) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {typeFilter !== 'all' && (
                <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                  タイプ: {getTypeLabel(typeFilter)}
                </span>
              )}
              {searchTerm && (
                <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-semibold border border-primary-300">
                  検索: {searchTerm}
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm || typeFilter !== 'all' 
                  ? '条件に一致する通知が見つかりませんでした' 
                  : '通知はありません'}
              </p>
              {(searchTerm || typeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                  }}
                  className="mt-4 px-4 py-2 text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors"
                >
                  フィルターをリセット
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    notification.is_read
                      ? 'bg-white border-gray-200'
                      : `${getNotificationColor(notification.type)} border-2`
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          {notification.content && (
                            <p className="text-sm text-gray-600 mb-2">{notification.content}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at))}
                            </span>
                            {!notification.is_read && (
                              <span className="px-2 py-0.5 bg-primary-500 text-white rounded-full">
                                未読
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.link_url && (
                            <Link
                              href={notification.link_url}
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              <ArrowRight className="h-5 w-5" />
                            </Link>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

