'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, XCircle, AlertCircle, Clock, MapPin, Users, Send, Download, Edit, Save, X, Repeat } from 'lucide-react'
import Link from 'next/link'

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
  creator?: {
    name: string
    organization_name?: string
  }
}

interface SafetyCheckResponse {
  id: string
  safety_check_id: string
  user_id: string
  status: 'safe' | 'unsafe' | 'unknown'
  message?: string
  location?: any
  responded_at: string
  user?: {
    name: string
    study_abroad_destination?: string
  }
}

export default function SafetyCheckDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const safetyCheckId = params.id as string

  const [safetyCheck, setSafetyCheck] = useState<SafetyCheck | null>(null)
  const [responses, setResponses] = useState<SafetyCheckResponse[]>([])
  const [targetUsers, setTargetUsers] = useState<Array<{id: string, name: string, study_abroad_destination?: string}>>([])
  const [loading, setLoading] = useState(true)
  const [userResponse, setUserResponse] = useState<SafetyCheckResponse | null>(null)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseStatus, setResponseStatus] = useState<'safe' | 'unsafe'>('safe')
  const [responseMessage, setResponseMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    message: '',
    is_recurring: false,
    recurrence_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrence_time: '09:00'
  })
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (safetyCheckId) {
      fetchSafetyCheck()
      fetchResponses()
    }
  }, [safetyCheckId, user])

  useEffect(() => {
    if (safetyCheck && user && safetyCheck.created_by === user.id) {
      fetchTargetUsers()
    }
  }, [safetyCheck, user])

  const fetchSafetyCheck = async () => {
    try {
      const { data, error } = await supabase
        .from('safety_checks')
        .select(`
          *,
          creator:profiles(name, organization_name)
        `)
        .eq('id', safetyCheckId)
        .single()

      if (error) throw error

      setSafetyCheck(data)
      
      // 編集フォームの初期値を設定
      if (data) {
        setEditForm({
          title: data.title || '',
          message: data.message || '',
          is_recurring: data.is_recurring || false,
          recurrence_type: (data.recurrence_type as 'daily' | 'weekly' | 'monthly') || 'daily',
          recurrence_time: data.recurrence_time || '09:00'
        })
      }
    } catch (error) {
      console.error('Error fetching safety check:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('safety_check_responses')
        .select(`
          *,
          user:profiles(name, study_abroad_destination)
        `)
        .eq('safety_check_id', safetyCheckId)
        .order('responded_at', { ascending: false })

      if (error) throw error

      setResponses(data || [])
      
      // ユーザーの回答を確認
      if (user) {
        const userResp = (data || []).find(r => r.user_id === user.id)
        setUserResponse(userResp || null)
        // 回答フォームは自動で開かない（ボタンで開く）
        // setShowResponseForm(!userResp && safetyCheck?.status === 'active')
      }
    } catch (error) {
      console.error('Error fetching responses:', error)
    }
  }

  const fetchTargetUsers = async () => {
    if (!safetyCheck) return

    try {
      let userIds: string[] = []

      // 対象ユーザーを取得
      if (safetyCheck.target_user_ids && safetyCheck.target_user_ids.length > 0) {
        userIds = safetyCheck.target_user_ids
      } else if (safetyCheck.community_id) {
        // コミュニティメンバーを取得
        const { data: members, error } = await supabase
          .from('community_members')
          .select('user_id')
          .eq('community_id', safetyCheck.community_id)

        if (error) throw error
        userIds = (members || []).map(m => m.user_id)
      }

      if (userIds.length === 0) return

      // ユーザープロフィールを取得
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, study_abroad_destination')
        .in('id', userIds)

      if (error) throw error

      setTargetUsers(profiles || [])
    } catch (error) {
      console.error('Error fetching target users:', error)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !safetyCheck) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('safety_check_responses')
        .insert({
          safety_check_id: safetyCheck.id,
          user_id: user.id,
          status: responseStatus,
          message: responseMessage || null
        })
        .select(`
          *,
          user:profiles(name, study_abroad_destination)
        `)
        .single()

      if (error) throw error

      // 回答数を更新
      await supabase
        .from('safety_checks')
        .update({ response_count: safetyCheck.response_count + 1 })
        .eq('id', safetyCheck.id)

      setUserResponse(data)
      setResponses(prev => [data, ...prev])
      setShowResponseForm(false)
      if (safetyCheck) {
        setSafetyCheck({ ...safetyCheck, response_count: safetyCheck.response_count + 1 })
      }
    } catch (error: any) {
      console.error('Error submitting response:', error)
      alert(error.message || '回答の送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSafetyCheck = async () => {
    if (!safetyCheck || !user) return

    setEditing(true)
    try {
      // 次回送信日時を計算
      let nextSendAt: string | null = null
      if (editForm.is_recurring) {
        const now = new Date()
        const [hours, minutes] = editForm.recurrence_time.split(':').map(Number)
        const nextDate = new Date(now)
        nextDate.setHours(hours, minutes, 0, 0)
        
        if (editForm.recurrence_type === 'daily') {
          if (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + 1)
          }
        } else if (editForm.recurrence_type === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7)
        } else if (editForm.recurrence_type === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        nextSendAt = nextDate.toISOString()
      } else {
        // 定期送信を無効にした場合、next_send_atをnullに
        nextSendAt = null
      }

      const { error } = await supabase
        .from('safety_checks')
        .update({
          title: editForm.title,
          message: editForm.message,
          is_recurring: editForm.is_recurring,
          recurrence_type: editForm.is_recurring ? editForm.recurrence_type : null,
          recurrence_time: editForm.is_recurring ? editForm.recurrence_time : null,
          next_send_at: nextSendAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', safetyCheck.id)

      if (error) throw error

      // データを再取得
      await fetchSafetyCheck()
      setShowEditForm(false)
    } catch (error: any) {
      console.error('Error updating safety check:', error)
      alert(error.message || '安否確認の更新に失敗しました')
    } finally {
      setEditing(false)
    }
  }

  const getStatusIcon = (status: 'safe' | 'unsafe' | 'unknown') => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'unsafe': return <XCircle className="h-5 w-5 text-red-600" />
      case 'unknown': return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusLabel = (status: 'safe' | 'unsafe' | 'unknown') => {
    switch (status) {
      case 'safe': return '安全'
      case 'unsafe': return '危険'
      case 'unknown': return '不明'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!safetyCheck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">安否確認が見つかりません</h1>
            <Link href="/safety-check" className="btn-primary">
              安否確認一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isCreator = user && safetyCheck.created_by === user.id
  const responseRate = safetyCheck.total_sent > 0 
    ? Math.round((safetyCheck.response_count / safetyCheck.total_sent) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/safety-check" className="text-primary-600 hover:text-primary-800 mb-4 inline-block">
          ← 安否確認一覧に戻る
        </Link>

        {/* 安否確認詳細 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-orange-600" />
              <div className="flex-1">
                {!showEditForm ? (
                  <h1 className="text-3xl font-bold text-gray-900">{safetyCheck.title}</h1>
                ) : (
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-orange-500 focus:outline-none w-full"
                    placeholder="タイトル"
                  />
                )}
                {safetyCheck.creator && (
                  <p className="text-sm text-gray-600 mt-1">
                    作成者: {safetyCheck.creator.name}
                    {safetyCheck.creator.organization_name && ` (${safetyCheck.creator.organization_name})`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                safetyCheck.status === 'active' ? 'bg-orange-100 text-orange-800' :
                safetyCheck.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {safetyCheck.status === 'active' ? '進行中' : safetyCheck.status === 'completed' ? '完了' : 'キャンセル'}
              </span>
              {isCreator && safetyCheck.status === 'active' && (
                <>
                  {!showEditForm ? (
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="px-3 lg:px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      title="編集"
                    >
                      <Edit className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden lg:inline">編集</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleUpdateSafetyCheck}
                        disabled={editing}
                        className="px-3 lg:px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        title={editing ? '保存中...' : '保存'}
                      >
                        <Save className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden lg:inline">{editing ? '保存中...' : '保存'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowEditForm(false)
                          // フォームを元の値にリセット
                          if (safetyCheck) {
                            setEditForm({
                              title: safetyCheck.title || '',
                              message: safetyCheck.message || '',
                              is_recurring: safetyCheck.is_recurring || false,
                              recurrence_type: (safetyCheck.recurrence_type as 'daily' | 'weekly' | 'monthly') || 'daily',
                              recurrence_time: safetyCheck.recurrence_time || '09:00'
                            })
                          }
                        }}
                        className="px-3 lg:px-4 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center space-x-2"
                        title="キャンセル"
                      >
                        <X className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden lg:inline">キャンセル</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            {!showEditForm ? (
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{safetyCheck.message}</p>
            ) : (
              <textarea
                value={editForm.message}
                onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 text-lg"
                placeholder="メッセージ"
              />
            )}
          </div>

          {/* 統計情報（作成者のみ） */}
          {isCreator && !showEditForm && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{safetyCheck.total_sent}</div>
                <div className="text-sm text-gray-600">送信数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{responses.length}</div>
                <div className="text-sm text-gray-600">回答数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {safetyCheck.total_sent > 0 ? Math.round((responses.length / safetyCheck.total_sent) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">回答率</div>
              </div>
            </div>
          )}

          {/* 定期送信設定（編集時） */}
          {isCreator && showEditForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">定期送信設定</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="edit_is_recurring"
                    checked={editForm.is_recurring}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="edit_is_recurring" className="text-sm font-medium text-gray-700">
                    定期送信を有効にする
                  </label>
                </div>
                {editForm.is_recurring && (
                  <div className="grid grid-cols-2 gap-4 pl-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        送信間隔
                      </label>
                      <select
                        value={editForm.recurrence_type}
                        onChange={(e) => setEditForm(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
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
                        value={editForm.recurrence_time}
                        onChange={(e) => setEditForm(prev => ({ ...prev, recurrence_time: e.target.value }))}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
                {safetyCheck.is_recurring && (
                  <div className="pl-8">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Repeat className="h-4 w-4" />
                      <span>
                        現在: {safetyCheck.recurrence_type === 'daily' ? '毎日' :
                              safetyCheck.recurrence_type === 'weekly' ? '毎週' :
                              safetyCheck.recurrence_type === 'monthly' ? '毎月' : '定期'}
                        {safetyCheck.recurrence_time && ` ${safetyCheck.recurrence_time}`}
                        {safetyCheck.next_send_at && ` (次回: ${new Date(safetyCheck.next_send_at).toLocaleString('ja-JP')})`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>作成: {new Date(safetyCheck.created_at).toLocaleString('ja-JP')}</span>
            </span>
            {safetyCheck.completed_at && (
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>完了: {new Date(safetyCheck.completed_at).toLocaleString('ja-JP')}</span>
              </span>
            )}
          </div>
        </div>

        {/* 回答ボタン（対象ユーザーで未回答の場合） */}
        {!userResponse && safetyCheck.status === 'active' && user && !isCreator && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">安否状況を報告してください</h2>
              <p className="text-gray-600 mb-6">{safetyCheck.title}</p>
              <button
                onClick={() => setShowResponseForm(true)}
                className="px-4 lg:px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
                title="回答する"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="hidden lg:inline">回答する</span>
              </button>
            </div>
          </div>
        )}

        {/* 回答フォーム（対象ユーザーのみ） */}
        {showResponseForm && !userResponse && safetyCheck.status === 'active' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">安否状況を報告</h2>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  安否状況 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['safe', 'unsafe'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setResponseStatus(status)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        responseStatus === status
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {getStatusIcon(status)}
                      <div className="mt-2 font-semibold">{getStatusLabel(status)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ（オプション）
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="状況の詳細を入力してください"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {submitting ? '送信中...' : '回答を送信'}
              </button>
            </form>
          </div>
        )}

        {/* 自分の回答表示 */}
        {userResponse && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">あなたの回答</h2>
            <div className="flex items-start space-x-3">
              {getStatusIcon(userResponse.status)}
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  {getStatusLabel(userResponse.status)}
                </div>
                {userResponse.message && (
                  <p className="text-gray-600 mb-2">{userResponse.message}</p>
                )}
                <div className="text-sm text-gray-500">
                  回答日時: {new Date(userResponse.responded_at).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 回答一覧（作成者のみ） */}
        {isCreator && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">回答一覧</h2>
              <button
                onClick={() => {
                  // OSSMA形式でエクスポート
                  const exportData = {
                    safety_check_id: safetyCheck.id,
                    title: safetyCheck.title,
                    created_at: safetyCheck.created_at,
                    total_sent: safetyCheck.total_sent,
                    response_count: safetyCheck.response_count,
                    response_rate: responseRate,
                    responses: responses.map(r => ({
                      user_name: r.user?.name || '匿名',
                      status: r.status,
                      message: r.message || '',
                      location: r.user?.study_abroad_destination || '',
                      responded_at: r.responded_at
                    }))
                  }
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `safety-check-${safetyCheck.id}-${new Date().toISOString().split('T')[0]}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="px-3 lg:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                title="エクスポート"
              >
                <Download className="h-5 w-5 flex-shrink-0" />
                <span className="hidden lg:inline">エクスポート</span>
              </button>
            </div>
            {targetUsers.length === 0 && responses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">まだ回答がありません</p>
            ) : (
              <div className="space-y-3">
                {/* 回答済みユーザー */}
                {responses.map((response) => {
                  const targetUser = targetUsers.find(u => u.id === response.user_id)
                  return (
                    <div key={response.id} className="p-4 border border-gray-200 rounded-xl bg-green-50">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(response.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-gray-900">
                              {response.user?.name || targetUser?.name || '匿名'}
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                              回答済み
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {getStatusLabel(response.status)}
                          </div>
                          {response.message && (
                            <p className="text-gray-700 mb-2">{response.message}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>
                              回答日時: {new Date(response.responded_at).toLocaleString('ja-JP')}
                            </span>
                            {(response.user?.study_abroad_destination || targetUser?.study_abroad_destination) && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{response.user?.study_abroad_destination || targetUser?.study_abroad_destination}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {/* 未回答ユーザー */}
                {targetUsers
                  .filter(user => !responses.some(r => r.user_id === user.id))
                  .map((targetUser) => (
                    <div key={targetUser.id} className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-gray-700">
                              {targetUser.name || '匿名'}
                            </div>
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-semibold">
                              未回答
                            </span>
                          </div>
                          {targetUser.study_abroad_destination && (
                            <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{targetUser.study_abroad_destination}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

