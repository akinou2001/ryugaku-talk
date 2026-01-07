'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Shield, MapPin, Users, Send, CheckCircle, XCircle, AlertCircle, Clock, Repeat, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SafetyCheck {
  id: string
  created_by: string
  community_id?: string
  title: string
  message: string
  target_area?: any
  target_user_ids?: string[]
  status: 'active' | 'completed' | 'cancelled'
  response_count: number
  total_sent: number
  created_at: string
  completed_at?: string
  is_recurring?: boolean
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | null
  recurrence_time?: string | null
  next_send_at?: string | null
}

interface SafetyCheckResponse {
  id: string
  safety_check_id: string
  user_id: string
  status: 'safe' | 'unsafe' | 'unknown'
  message?: string
  location?: any
  responded_at: string
}

export default function SafetyCheckPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    community_id: '',
    target_area_type: 'community' as 'community' | 'area' | 'users',
    target_lat: '',
    target_lng: '',
    target_radius: '',
    target_country: '',
    target_region: '',
    is_recurring: false,
    recurrence_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrence_time: '09:00'
  })
  const [submitting, setSubmitting] = useState(false)
  const [userCommunities, setUserCommunities] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    if (user) {
      checkAccess()
      fetchSafetyChecks()
      fetchUserCommunities()
    }
  }, [user])

  const checkAccess = () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    // 組織アカウント（認証済み）のみアクセス可能
    if (user.account_type === 'individual' || user.verification_status !== 'verified') {
      router.push('/')
      return
    }
  }

  const fetchUserCommunities = async () => {
    if (!user) return

    try {
      // ユーザーが管理者またはメンバーであるコミュニティを取得
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community:communities(id, name)
        `)
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])

      if (error) throw error

      const communities = (data || [])
        .map((item: any) => item.community)
        .filter((community: any): community is {id: string, name: string} => Boolean(community))
      
      setUserCommunities(communities)
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }

  const fetchSafetyChecks = async () => {
    if (!user) return

    try {
      setLoading(true)
      // 作成した安否確認または対象となっている安否確認を取得
      const { data, error } = await supabase
        .from('safety_checks')
        .select('*')
        .or(`created_by.eq.${user.id},target_user_ids.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setSafetyChecks(data || [])
    } catch (error) {
      console.error('Error fetching safety checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSafetyCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      let targetArea = null
      if (formData.target_area_type === 'area') {
        if (formData.target_lat && formData.target_lng && formData.target_radius) {
          targetArea = {
            lat: parseFloat(formData.target_lat),
            lng: parseFloat(formData.target_lng),
            radius: parseFloat(formData.target_radius)
          }
        }
      } else if (formData.target_area_type === 'users' && formData.target_country) {
        targetArea = {
          country: formData.target_country,
          region: formData.target_region || null
        }
      }

      // 次回送信日時を計算
      let nextSendAt: string | null = null
      if (formData.is_recurring) {
        const now = new Date()
        const [hours, minutes] = formData.recurrence_time.split(':').map(Number)
        const nextDate = new Date(now)
        nextDate.setHours(hours, minutes, 0, 0)
        
        if (formData.recurrence_type === 'daily') {
          if (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + 1)
          }
        } else if (formData.recurrence_type === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7)
        } else if (formData.recurrence_type === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        nextSendAt = nextDate.toISOString()
      }

      const { data: safetyCheck, error: checkError } = await supabase
        .from('safety_checks')
        .insert({
          created_by: user.id,
          community_id: formData.community_id || null,
          title: formData.title,
          message: formData.message,
          target_area: targetArea,
          status: 'active',
          is_recurring: formData.is_recurring,
          recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
          recurrence_time: formData.is_recurring ? formData.recurrence_time : null,
          next_send_at: nextSendAt
        })
        .select()
        .single()

      if (checkError) throw checkError

      // 対象ユーザーを特定して通知を送信
      let targetUserIds: string[] = []

      if (formData.community_id) {
        // コミュニティメンバーを取得
        const { data: members, error: membersError } = await supabase
          .from('community_members')
          .select('user_id')
          .eq('community_id', formData.community_id)

        if (!membersError && members) {
          targetUserIds = members.map(m => m.user_id)
        }
      } else if (formData.target_area_type === 'area' && targetArea) {
        // 位置情報ベースで対象ユーザーを検索（簡易実装）
        // 実際の実装では、より高度な位置情報検索が必要
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, study_abroad_destination')
          .not('study_abroad_destination', 'is', null)
          .contains('languages', ['status:current'])

        if (!profilesError && profiles) {
          // 簡易実装：実際には位置情報に基づくフィルタリングが必要
          targetUserIds = profiles.map(p => p.id)
        }
      }

      // 通知を作成
      if (targetUserIds.length > 0) {
        const notifications = targetUserIds.map(userId => ({
          user_id: userId,
          type: 'safety_check',
          title: formData.title,
          content: formData.message,
          link_url: `/safety-check/${safetyCheck.id}`
        }))

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notifError) {
          console.error('Error creating notifications:', notifError)
        }

        // 安否確認のtotal_sentを更新
        await supabase
          .from('safety_checks')
          .update({ total_sent: targetUserIds.length })
          .eq('id', safetyCheck.id)
      }

      setShowCreateForm(false)
      setFormData({
        title: '',
        message: '',
        community_id: '',
        target_area_type: 'community',
        target_lat: '',
        target_lng: '',
        target_radius: '',
        target_country: '',
        target_region: '',
        is_recurring: false,
        recurrence_type: 'daily',
        recurrence_time: '09:00'
      })
      fetchSafetyChecks()
    } catch (error: any) {
      console.error('Error creating safety check:', error)
      alert(error.message || '安否確認の作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || user.account_type === 'individual' || user.verification_status !== 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 text-center py-16">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
            <p className="text-gray-600 mb-6">この機能は認証済みの組織アカウントのみが利用できます。</p>
            <Link href="/" className="btn-primary">
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-10 w-10 text-orange-600" />
              <h1 className="text-4xl font-bold text-gray-900">安全・安否確認</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 lg:px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              title="安否確認を作成"
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              <span className="hidden lg:inline">安否確認を作成</span>
            </button>
          </div>
          <p className="text-gray-600 mt-2">災害・テロ発生時などに、対象エリア内のユーザーに安否確認通知を送信できます</p>
        </div>

        {/* 作成フォーム */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">安否確認を作成</h2>
            <form onSubmit={handleCreateSafetyCheck} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="例: 地震発生 - 安否確認"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="安否確認の内容を入力してください"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象範囲
                </label>
                <select
                  value={formData.target_area_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_area_type: e.target.value as any }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="community">コミュニティメンバー</option>
                  <option value="area">指定エリア（位置情報）</option>
                  <option value="users">国・地域</option>
                </select>
              </div>
              {formData.target_area_type === 'community' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    コミュニティ *
                  </label>
                  <select
                    value={formData.community_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, community_id: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">選択してください</option>
                    {userCommunities.map(community => (
                      <option key={community.id} value={community.id}>{community.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.target_area_type === 'area' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      緯度
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.target_lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_lat: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      経度
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.target_lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_lng: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      半径（km）
                    </label>
                    <input
                      type="number"
                      value={formData.target_radius}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_radius: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
              {formData.target_area_type === 'users' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      国
                    </label>
                    <input
                      type="text"
                      value={formData.target_country}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_country: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="例: アメリカ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      地域（オプション）
                    </label>
                    <input
                      type="text"
                      value={formData.target_region}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_region: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="例: カリフォルニア州"
                    />
                  </div>
                </div>
              )}
              {/* 定期送信設定 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                    定期送信を有効にする
                  </label>
                </div>
                {formData.is_recurring && (
                  <div className="grid grid-cols-2 gap-4 pl-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        送信間隔
                      </label>
                      <select
                        value={formData.recurrence_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="daily">毎日</option>
                        <option value="weekly">毎週</option>
                        <option value="monthly">毎月</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        送信時刻
                      </label>
                      <input
                        type="time"
                        value={formData.recurrence_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurrence_time: e.target.value }))}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({
                      title: '',
                      message: '',
                      community_id: '',
                      target_area_type: 'community',
                      target_lat: '',
                      target_lng: '',
                      target_radius: '',
                      target_country: '',
                      target_region: '',
                      is_recurring: false,
                      recurrence_type: 'daily',
                      recurrence_time: '09:00'
                    })
                  }}
                  className="px-6 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 lg:px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
                  title={submitting ? '送信中...' : formData.is_recurring ? '定期送信を設定' : '送信'}
                >
                  <span className="hidden lg:inline">{submitting ? '送信中...' : formData.is_recurring ? '定期送信を設定' : '送信'}</span>
                  <Shield className="h-4 w-4 lg:hidden flex-shrink-0" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 安否確認一覧 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : safetyChecks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">安否確認はまだありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {safetyChecks.map((check) => (
              <div key={check.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap">
                      <Shield className="h-6 w-6 text-orange-600" />
                      <h3 className="text-xl font-bold text-gray-900">{check.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        check.status === 'active' ? 'bg-orange-100 text-orange-800' :
                        check.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {check.status === 'active' ? '進行中' : check.status === 'completed' ? '完了' : 'キャンセル'}
                      </span>
                      {check.is_recurring && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center space-x-1">
                          <Repeat className="h-3 w-3" />
                          <span>
                            {check.recurrence_type === 'daily' ? '毎日' :
                             check.recurrence_type === 'weekly' ? '毎週' :
                             check.recurrence_type === 'monthly' ? '毎月' : '定期'}
                            {check.recurrence_time && ` ${check.recurrence_time}`}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{check.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>送信数: {check.total_sent}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>回答数: {check.response_count}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(check.created_at).toLocaleString('ja-JP')}</span>
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/safety-check/${check.id}`}
                    className="px-3 lg:px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center space-x-2"
                    title="詳細を見る"
                  >
                    <span className="hidden lg:inline">詳細を見る</span>
                    <Eye className="h-4 w-4 lg:hidden flex-shrink-0" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

