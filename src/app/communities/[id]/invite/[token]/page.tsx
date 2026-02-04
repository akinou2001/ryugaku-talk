'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { joinCommunityByInvite } from '@/lib/community'
import { CheckCircle, X, Loader2 } from 'lucide-react'

export default function CommunityInvitePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const communityId = params.id as string
  const inviteToken = params.token as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      // ログインしていない場合はログインページにリダイレクト
      router.push(`/auth/signin?redirect=/communities/${communityId}/invite/${inviteToken}`)
      return
    }

    if (!authLoading && user && !loading && !success && !error) {
      handleJoin()
    }
  }, [user, authLoading])

  const handleJoin = async () => {
    if (!user || !inviteToken) return

    setLoading(true)
    setError('')

    try {
      await joinCommunityByInvite(inviteToken)
      setSuccess(true)
      setTimeout(() => {
        router.push(`/communities/${communityId}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'コミュニティへの参加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">処理中...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">コミュニティに参加しました</h1>
          <p className="text-gray-600">コミュニティページに移動します...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラー</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/communities')}
            className="btn-primary"
          >
            コミュニティ一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return null
}
