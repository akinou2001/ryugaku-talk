'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { getCommunityById, getCommunityStats } from '@/lib/community'
import { getQuests, createQuest, requestQuestCompletion, updateQuestCompletionStatus, getQuestCompletions } from '@/lib/quest'
import type { Community, Quest, QuestCompletion } from '@/lib/supabase'
import { ArrowLeft, Plus, Users, Building2, CheckCircle, X, Clock, Flame, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'

export default function CommunityDetail() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const communityId = params.id as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [questsLoading, setQuestsLoading] = useState(true)
  const [showCreateQuest, setShowCreateQuest] = useState(false)
  const [showCompletionForm, setShowCompletionForm] = useState<string | null>(null)
  const [questCompletions, setQuestCompletions] = useState<Record<string, QuestCompletion[]>>({})
  const [isMember, setIsMember] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [error, setError] = useState('')
  const [memberCount, setMemberCount] = useState(0)

  // クエスト作成フォーム
  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    reward_type: 'candle' as 'candle' | 'torch',
    reward_amount: 1
  })

  // クエスト完了申請フォーム
  const [completionForm, setCompletionForm] = useState({
    proof_text: '',
    proof_url: ''
  })

  useEffect(() => {
    if (communityId) {
      fetchCommunity()
      checkMembership()
    }
  }, [communityId, user])

  const fetchCommunity = async () => {
    try {
      const data = await getCommunityById(communityId, user?.id)
      setCommunity(data as Community)
      const owner = user?.id === data?.owner_id
      setIsOwner(owner)
      
      // コミュニティ情報取得後、クエストと統計情報を取得
      if (data) {
        await Promise.all([
          fetchQuests(owner),
          fetchCommunityStats()
        ])
      }
    } catch (error: any) {
      setError(error.message || 'コミュニティの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunityStats = async () => {
    try {
      const stats = await getCommunityStats(communityId)
      setMemberCount(stats.member_count)
    } catch (error) {
      console.error('Error fetching community stats:', error)
    }
  }

  const fetchQuests = async (isOwnerFlag?: boolean) => {
    try {
      setQuestsLoading(true)
      const data = await getQuests(communityId, user?.id)
      setQuests(data)
      
      // クエスト作成者の場合、各クエストの完了申請を取得
      const ownerFlag = isOwnerFlag !== undefined ? isOwnerFlag : isOwner
      if (ownerFlag && user) {
        const completionsMap: Record<string, QuestCompletion[]> = {}
        for (const quest of data) {
          if (quest.created_by === user.id) {
            try {
              const completions = await getQuestCompletions(quest.id)
              completionsMap[quest.id] = completions
            } catch (error) {
              console.error(`Error fetching completions for quest ${quest.id}:`, error)
            }
          }
        }
        setQuestCompletions(completionsMap)
      }
    } catch (error: any) {
      console.error('Error fetching quests:', error)
    } finally {
      setQuestsLoading(false)
    }
  }

  const checkMembership = async () => {
    if (!user) return

    try {
      // 所有者の場合は自動的にメンバーとして扱う
      if (community && community.owner_id === user.id) {
        setIsMember(true)
        return
      }

      const { data } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single()

      setIsMember(!!data)
    } catch (error) {
      setIsMember(false)
    }
  }

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isMember) {
      setError('コミュニティメンバーのみクエストを作成できます')
      return
    }

    try {
      await createQuest(
        communityId,
        questForm.title,
        questForm.description,
        questForm.reward_type,
        questForm.reward_amount
      )
      setQuestForm({ title: '', description: '', reward_type: 'candle', reward_amount: 1 })
      setShowCreateQuest(false)
      fetchQuests()
    } catch (error: any) {
      setError(error.message || 'クエストの作成に失敗しました')
    }
  }

  const handleRequestCompletion = async (questId: string) => {
    if (!user || !isMember) {
      setError('コミュニティメンバーのみクエスト完了を申請できます')
      return
    }

    try {
      await requestQuestCompletion(
        questId,
        completionForm.proof_text || undefined,
        completionForm.proof_url || undefined
      )
      setCompletionForm({ proof_text: '', proof_url: '' })
      setShowCompletionForm(null)
      await fetchQuests(isOwner)
    } catch (error: any) {
      setError(error.message || '完了申請に失敗しました')
    }
  }

  const handleApproveCompletion = async (completionId: string) => {
    if (!user || !isOwner) {
      setError('クエスト作成者のみ承認できます')
      return
    }

    try {
      await updateQuestCompletionStatus(completionId, 'approved')
      await fetchQuests(isOwner)
    } catch (error: any) {
      setError(error.message || '承認に失敗しました')
    }
  }

  const handleRejectCompletion = async (completionId: string) => {
    if (!user || !isOwner) {
      setError('クエスト作成者のみ拒否できます')
      return
    }

    try {
      await updateQuestCompletionStatus(completionId, 'rejected')
      await fetchQuests(isOwner)
    } catch (error: any) {
      setError(error.message || '拒否に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => router.push('/communities')} className="btn-primary">
            コミュニティ一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">コミュニティが見つかりません</h1>
          <button onClick={() => router.push('/communities')} className="btn-primary">
            コミュニティ一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  const isGuild = community.community_type === 'guild'
  const rewardLabel = isGuild ? 'キャンドル' : 'トーチ'
  const rewardIcon = isGuild ? '🕯️' : '🔥'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {isGuild ? 'ギルド' : '公式コミュニティ'} • {formatDate(community.created_at)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* コミュニティ情報 */}
        <div className="card mb-6">
          {community.cover_image_url && (
            <img
              src={community.cover_image_url}
              alt={community.name}
              className="w-full h-48 object-cover rounded-t-lg mb-4"
            />
          )}
          <div className="flex items-start space-x-4">
            {community.icon_url ? (
              <img
                src={community.icon_url}
                alt={community.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary-600" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{community.name}</h2>
                {community.owner && (
                  <AccountBadge
                    accountType={community.owner.account_type}
                    verificationStatus={community.owner.verification_status}
                  />
                )}
              </div>
              {community.description && (
                <p className="text-gray-600 mb-3">{community.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{memberCount}名</span>
                </div>
                {community.owner && (
                  <div>
                    運営: {community.owner.organization_name || community.owner.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* クエストセクション */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">クエスト</h2>
            {isMember && (
              <button
                onClick={() => setShowCreateQuest(!showCreateQuest)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                クエストを作成
              </button>
            )}
          </div>

          {/* クエスト作成フォーム */}
          {showCreateQuest && isMember && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">新しいクエスト</h3>
              <form onSubmit={handleCreateQuest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル *
                  </label>
                  <input
                    type="text"
                    value={questForm.title}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="input-field"
                    placeholder="クエストのタイトルを入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={questForm.description}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="クエストの説明を入力"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      報酬タイプ
                    </label>
                    <select
                      value={questForm.reward_type}
                      onChange={(e) => setQuestForm(prev => ({ ...prev, reward_type: e.target.value as 'candle' | 'torch' }))}
                      className="input-field"
                    >
                      <option value="candle">🕯️ キャンドル（ギルド）</option>
                      <option value="torch">🔥 トーチ（公式コミュニティ）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      報酬数
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={questForm.reward_amount}
                      onChange={(e) => setQuestForm(prev => ({ ...prev, reward_amount: parseInt(e.target.value) || 1 }))}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary">
                    作成
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateQuest(false)
                      setQuestForm({ title: '', description: '', reward_type: 'candle', reward_amount: 1 })
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* クエスト一覧 */}
          {questsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : quests.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">クエストがありません</p>
              {isMember && (
                <p className="text-sm text-gray-400 mt-2">最初のクエストを作成してみましょう</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {quests.map((quest) => (
                <div key={quest.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{quest.title}</h3>
                      {quest.description && (
                        <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>作成者: {quest.creator?.name || '不明'}</span>
                        <span>{formatDate(quest.created_at)}</span>
                        <span className="flex items-center space-x-1">
                          <span>{rewardIcon}</span>
                          <span>報酬: {quest.reward_amount}{rewardLabel}</span>
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {quest.user_completion_status === 'approved' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          完了済み
                        </span>
                      )}
                      {quest.user_completion_status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          申請中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* クエスト完了申請 */}
                  {isMember && !quest.user_completion_status && (
                    <div className="mt-3">
                      {showCompletionForm === quest.id ? (
                        <div className="p-3 bg-gray-50 rounded border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">完了申請</h4>
                          <div className="space-y-2 mb-2">
                            <input
                              type="text"
                              value={completionForm.proof_text}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, proof_text: e.target.value }))}
                              placeholder="完了証明（テキスト）"
                              className="input-field text-sm"
                            />
                            <input
                              type="url"
                              value={completionForm.proof_url}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, proof_url: e.target.value }))}
                              placeholder="完了証明（URL）"
                              className="input-field text-sm"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRequestCompletion(quest.id)}
                              className="btn-primary text-sm"
                            >
                              申請する
                            </button>
                            <button
                              onClick={() => {
                                setShowCompletionForm(null)
                                setCompletionForm({ proof_text: '', proof_url: '' })
                              }}
                              className="btn-secondary text-sm"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCompletionForm(quest.id)}
                          className="btn-secondary text-sm"
                        >
                          完了を申請
                        </button>
                      )}
                    </div>
                  )}

                  {/* クエスト作成者向け: 完了申請の承認/拒否 */}
                  {isOwner && quest.created_by === user?.id && questCompletions[quest.id] && questCompletions[quest.id].length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">完了申請一覧</h4>
                      <div className="space-y-2">
                        {questCompletions[quest.id].map((completion) => (
                          <div key={completion.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm">{completion.user?.name || '不明'}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    completion.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    completion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {completion.status === 'approved' ? '承認済み' :
                                     completion.status === 'rejected' ? '拒否済み' :
                                     '申請中'}
                                  </span>
                                </div>
                                {completion.proof_text && (
                                  <p className="text-xs text-gray-600 mb-1">{completion.proof_text}</p>
                                )}
                                {completion.proof_url && (
                                  <a
                                    href={completion.proof_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 hover:underline"
                                  >
                                    {completion.proof_url}
                                  </a>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(completion.created_at)}
                                </p>
                              </div>
                            </div>
                            {completion.status === 'pending' && (
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => handleApproveCompletion(completion.id)}
                                  className="btn-primary text-xs flex items-center"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  承認
                                </button>
                                <button
                                  onClick={() => handleRejectCompletion(completion.id)}
                                  className="btn-secondary text-xs flex items-center"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  拒否
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isOwner && quest.created_by === user?.id && (!questCompletions[quest.id] || questCompletions[quest.id].length === 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">完了申請はまだありません</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

