'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, Calendar, Award, Shield, ArrowRight } from 'lucide-react'
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

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

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

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">通知はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
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

