'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import type { GlobalAnnouncement } from '@/lib/supabase'
import { ArrowLeft, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { UserAvatar } from '@/components/UserAvatar'
import ReactMarkdown from 'react-markdown'

export default function AnnouncementDetail() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const announcementId = params.id as string

  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (announcementId) {
      fetchAnnouncement()
    }
  }, [announcementId])

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('global_announcements')
        .select(`
          *,
          creator:profiles(id, name, icon_url)
        `)
        .eq('id', announcementId)
        .single()

      if (error) {
        throw error
      }

      setAnnouncement(data as GlobalAnnouncement)
    } catch (error: any) {
      setError(error.message || 'お知らせの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">お知らせが見つかりません</h1>
          <Link href="/timeline" className="btn-primary">
            タイムラインに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/timeline"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            タイムラインに戻る
          </Link>
          <div className="mb-4">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold inline-flex items-center">
              📢 全員向けお知らせ
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{announcement.title}</h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(announcement.created_at).toLocaleString('ja-JP')}</span>
            </div>
            {announcement.creator && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <UserAvatar
                  iconUrl={announcement.creator.icon_url}
                  name={announcement.creator.name}
                  size="sm"
                />
                <span>{announcement.creator.name}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* お知らせ内容 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="prose max-w-none">
            <ReactMarkdown>{announcement.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

