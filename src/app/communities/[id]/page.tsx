'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { getCommunityById, getCommunityStats, getCommunityMembers, getCommunityPosts, getCommunityEvents, requestCommunityMembership, updateMembershipStatus, createEvent, registerEvent, cancelEventRegistration, getEventParticipants, updateEvent, deleteEvent, updateCommunity } from '@/lib/community'
import { uploadFiles, uploadFile, validateFileType, validateFileSize, FILE_TYPES, getFileIcon, isImageFile } from '@/lib/storage'
import { getQuests, createQuest, requestQuestCompletion, updateQuestCompletionStatus, getQuestCompletions, updateQuest, deleteQuest } from '@/lib/quest'
import type { Community, Quest, QuestCompletion, Post, Event, CommunityMember } from '@/lib/supabase'
import { ArrowLeft, Plus, Users, Building2, CheckCircle, X, Clock, Flame, MessageSquare, Calendar, UserPlus, Settings, MapPin, Upload, File, Image as ImageIcon, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'

type TabType = 'timeline' | 'members' | 'events' | 'quests'

export default function CommunityDetail() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const communityId = params.id as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('timeline')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  
  // メンバーシップ状態
  const [isMember, setIsMember] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<'none' | 'pending' | 'approved'>('none')

  // タイムライン
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  // メンバー
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [pendingMembers, setPendingMembers] = useState<CommunityMember[]>([])

  // イベント
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [eventParticipants, setEventParticipants] = useState<Record<string, any[]>>({})
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    online_url: '',
    deadline: '',
    capacity: ''
  })
  const [eventFiles, setEventFiles] = useState<File[]>([])
  const [eventFilesUploading, setEventFilesUploading] = useState(false)

  // クエスト
  const [quests, setQuests] = useState<Quest[]>([])
  const [questsLoading, setQuestsLoading] = useState(false)
  const [showCreateQuest, setShowCreateQuest] = useState(false)
  const [showCompletionForm, setShowCompletionForm] = useState<string | null>(null)
  const [questCompletions, setQuestCompletions] = useState<Record<string, QuestCompletion[]>>({})

  // クエスト作成フォーム
  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    reward_type: 'candle' as 'candle' | 'torch',
    reward_amount: 1,
    deadline: ''
  })

  // クエスト完了申請フォーム
  const [completionForm, setCompletionForm] = useState({
    proof_text: '',
    proof_url: ''
  })

  // コミュニティ編集
  const [isEditingCommunity, setIsEditingCommunity] = useState(false)
  const [communityEditForm, setCommunityEditForm] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private'
  })
  const [communityCoverImage, setCommunityCoverImage] = useState<File | null>(null)
  const [communityCoverImagePreview, setCommunityCoverImagePreview] = useState<string | null>(null)
  const [communityCoverImageUploading, setCommunityCoverImageUploading] = useState(false)

  useEffect(() => {
    if (communityId) {
      fetchCommunity()
    }
  }, [communityId, user])

  useEffect(() => {
    if (community && !isEditingCommunity) {
      setCommunityEditForm({
        name: community.name || '',
        description: community.description || '',
        visibility: community.visibility || 'public'
      })
      setCommunityCoverImagePreview(community.cover_image_url || null)
    }
  }, [community, isEditingCommunity])

  // URLパラメータからタブを設定
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['timeline', 'members', 'events', 'quests'].includes(tabParam)) {
      setActiveTab(tabParam as TabType)
    }
  }, [searchParams])

  // ハッシュに基づいてスクロール
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        setTimeout(() => {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 300)
      }
    }
  }, [activeTab, events, quests])

  useEffect(() => {
    if (community && isMember) {
      switch (activeTab) {
        case 'timeline':
          fetchPosts()
          break
        case 'members':
          fetchMembers()
          break
        case 'events':
          fetchEvents()
          break
        case 'quests':
          fetchQuests()
          break
      }
    }
  }, [activeTab, community, isMember])

  const fetchCommunity = async () => {
    try {
      setLoading(true)
      const data = await getCommunityById(communityId, user?.id)
      setCommunity(data as Community)
      const owner = user?.id === data?.owner_id
      setIsOwner(owner)
      
      // メンバーシップ状態を確認
      if (owner) {
        setIsMember(true)
        setMembershipStatus('approved')
      } else if (data?.is_member) {
        setIsMember(true)
        setMembershipStatus('approved')
      } else if (data?.member_status === 'pending') {
        setIsMember(false)
        setMembershipStatus('pending')
      } else {
        setIsMember(false)
        setMembershipStatus('none')
      }
      
      // コミュニティ情報取得後、統計情報を取得
      if (data) {
        await fetchCommunityStats()
        // メンバーの場合、タイムラインを自動的に読み込む
        if (owner || data.is_member) {
          await fetchPosts()
        }
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

  const fetchPosts = async () => {
    if (!isMember && !isOwner) return
    
    try {
      setPostsLoading(true)
      
      // 投稿、イベント、クエストを取得
      const [postsData, eventsData, questsData] = await Promise.all([
        getCommunityPosts(communityId, user?.id),
        getCommunityEvents(communityId, user?.id),
        getQuests(communityId, user?.id)
      ])

      // すべてのアイテムを統合
      const allItems: any[] = [
        ...(postsData || []).map((p: any) => ({ ...p, itemType: 'post' })),
        ...(eventsData || []).map((e: any) => ({ ...e, itemType: 'event' })),
        ...(questsData || []).map((q: any) => ({ ...q, itemType: 'quest' }))
      ]

      // 日付順にソート
      allItems.sort((a, b) => {
        const dateA = a.event_date || a.created_at
        const dateB = b.event_date || b.created_at
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })

      setPosts(allItems)
    } catch (error: any) {
      console.error('Error fetching posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      setMembersLoading(true)
      const [approvedData, pendingData] = await Promise.all([
        getCommunityMembers(communityId, 'approved'),
        isOwner ? getCommunityMembers(communityId, 'pending') : Promise.resolve([])
      ])
      setMembers(approvedData || [])
      setPendingMembers(pendingData || [])
    } catch (error: any) {
      console.error('Error fetching members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      const data = await getCommunityEvents(communityId, user?.id)
      setEvents(data || [])
    } catch (error: any) {
      console.error('Error fetching events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const fetchQuests = async () => {
    try {
      setQuestsLoading(true)
      const data = await getQuests(communityId, user?.id)
      setQuests(data)
      
      // クエスト作成者の場合、各クエストの完了申請を取得
      if (isOwner && user) {
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

  const handleJoinRequest = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    try {
      await requestCommunityMembership(communityId)
      setMembershipStatus('pending')
      alert('加入申請を送信しました。承認をお待ちください。')
    } catch (error: any) {
      setError(error.message || '加入申請に失敗しました')
    }
  }

  const handleApproveMember = async (membershipId: string) => {
    try {
      await updateMembershipStatus(membershipId, 'approved')
      await fetchMembers()
      await fetchCommunityStats()
    } catch (error: any) {
      setError(error.message || '承認に失敗しました')
    }
  }

  const handleRejectMember = async (membershipId: string) => {
    try {
      await updateMembershipStatus(membershipId, 'rejected')
      await fetchMembers()
    } catch (error: any) {
      setError(error.message || '拒否に失敗しました')
    }
  }

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isMember) {
      setError('コミュニティメンバーのみクエストを作成できます')
      return
    }

    try {
      // datetime-localの値をISO形式に変換
      const deadline = questForm.deadline ? new Date(questForm.deadline).toISOString() : undefined
      
      await createQuest(
        communityId,
        questForm.title,
        questForm.description,
        questForm.reward_type,
        questForm.reward_amount,
        deadline
      )
      setQuestForm({ title: '', description: '', reward_type: 'candle', reward_amount: 1, deadline: '' })
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
      await fetchQuests()
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
      await fetchQuests()
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
      await fetchQuests()
    } catch (error: any) {
      setError(error.message || '拒否に失敗しました')
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isOwner) {
      setError('コミュニティの所有者のみイベントを作成できます')
      return
    }

    try {
      setEventFilesUploading(true)
      
      // ファイルをアップロード
      let attachments: Array<{ url: string; filename: string; type: string }> = []
      if (eventFiles.length > 0) {
        // ファイルタイプとサイズを検証
        for (const file of eventFiles) {
          if (!validateFileType(file, FILE_TYPES.EVENT_ATTACHMENTS)) {
            throw new Error(`${file.name}はサポートされていないファイル形式です`)
          }
          if (!validateFileSize(file, 10)) { // 10MB制限
            throw new Error(`${file.name}は10MB以下である必要があります`)
          }
        }
        
        attachments = await uploadFiles(eventFiles, 'event-attachments', communityId)
      }

      // datetime-localの値をISO形式に変換
      const eventDate = eventForm.event_date ? new Date(eventForm.event_date).toISOString() : ''
      const deadline = eventForm.deadline ? new Date(eventForm.deadline).toISOString() : undefined
      const capacity = eventForm.capacity ? parseInt(eventForm.capacity) : undefined

      await createEvent(
        communityId,
        eventForm.title,
        eventForm.description,
        eventDate,
        eventForm.location || undefined,
        eventForm.online_url || undefined,
        deadline,
        capacity,
        attachments.length > 0 ? attachments : undefined
      )
      setEventForm({
        title: '',
        description: '',
        event_date: '',
        location: '',
        online_url: '',
        deadline: '',
        capacity: ''
      })
      setEventFiles([])
      setShowCreateEvent(false)
      await fetchEvents()
    } catch (error: any) {
      setError(error.message || 'イベントの作成に失敗しました')
    } finally {
      setEventFilesUploading(false)
    }
  }

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setEventFiles(prev => [...prev, ...files])
  }

  const handleRemoveEventFile = (index: number) => {
    setEventFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRegisterEvent = async (eventId: string) => {
    if (!user || !isMember) {
      setError('コミュニティメンバーのみ参加登録できます')
      return
    }

    try {
      await registerEvent(eventId)
      await fetchEvents()
    } catch (error: any) {
      setError(error.message || '参加登録に失敗しました')
    }
  }

  const handleCancelEventRegistration = async (eventId: string) => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    try {
      await cancelEventRegistration(eventId)
      await fetchEvents()
    } catch (error: any) {
      setError(error.message || 'キャンセルに失敗しました')
    }
  }

  const handleViewEventParticipants = async (eventId: string) => {
    try {
      const participants = await getEventParticipants(eventId)
      setEventParticipants(prev => ({
        ...prev,
        [eventId]: participants
      }))
    } catch (error: any) {
      setError(error.message || '参加者一覧の取得に失敗しました')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('本当にこのイベントを削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      await deleteEvent(eventId)
      await fetchEvents()
      await fetchPosts() // タイムラインも更新
    } catch (error: any) {
      setError(error.message || 'イベントの削除に失敗しました')
    }
  }

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('本当にこのクエストを削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      await deleteQuest(questId)
      await fetchQuests()
      await fetchPosts() // タイムラインも更新
    } catch (error: any) {
      setError(error.message || 'クエストの削除に失敗しました')
    }
  }

  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null)
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    online_url: '',
    deadline: '',
    capacity: ''
  })
  const [editQuestForm, setEditQuestForm] = useState({
    title: '',
    description: '',
    reward_type: 'candle' as 'candle' | 'torch',
    reward_amount: 1,
    deadline: ''
  })

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEventId) return

    try {
      const eventDate = editEventForm.event_date ? new Date(editEventForm.event_date).toISOString() : ''
      const deadline = editEventForm.deadline ? new Date(editEventForm.deadline).toISOString() : undefined
      const capacity = editEventForm.capacity ? parseInt(editEventForm.capacity) : undefined

      await updateEvent(editingEventId, {
        title: editEventForm.title,
        description: editEventForm.description,
        event_date: eventDate,
        location: editEventForm.location || undefined,
        online_url: editEventForm.online_url || undefined,
        deadline,
        capacity: capacity?.toString()
      })
      setEditingEventId(null)
      await fetchEvents()
      await fetchPosts()
    } catch (error: any) {
      setError(error.message || 'イベントの編集に失敗しました')
    }
  }

  const handleEditQuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuestId) return

    try {
      const deadline = editQuestForm.deadline ? new Date(editQuestForm.deadline).toISOString() : undefined

      await updateQuest(editingQuestId, {
        title: editQuestForm.title,
        description: editQuestForm.description,
        reward_type: editQuestForm.reward_type,
        reward_amount: editQuestForm.reward_amount,
        deadline
      })
      setEditingQuestId(null)
      await fetchQuests()
      await fetchPosts()
    } catch (error: any) {
      setError(error.message || 'クエストの編集に失敗しました')
    }
  }

  const handleCommunityCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      setError('画像ファイルを選択してください')
      return
    }

    if (!validateFileSize(file, 5)) {
      setError('画像サイズは5MB以下である必要があります')
      return
    }

    setCommunityCoverImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCommunityCoverImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleRemoveCommunityCoverImage = () => {
    setCommunityCoverImage(null)
    setCommunityCoverImagePreview(null)
  }

  const handleEditCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return

    try {
      setError('')
      
      // カバー画像をアップロード
      let coverImageUrl: string | undefined = undefined
      if (communityCoverImage) {
        setCommunityCoverImageUploading(true)
        try {
          coverImageUrl = await uploadFile(communityCoverImage, 'community-covers', `community-${communityId}`)
        } catch (error: any) {
          setError(error.message || 'カバー画像のアップロードに失敗しました')
          setCommunityCoverImageUploading(false)
          return
        } finally {
          setCommunityCoverImageUploading(false)
        }
      }

      await updateCommunity(communityId, {
        name: communityEditForm.name,
        description: communityEditForm.description || undefined,
        visibility: communityEditForm.visibility,
        cover_image_url: coverImageUrl || (communityCoverImagePreview === null && !communityCoverImage ? null : undefined)
      })
      
      setIsEditingCommunity(false)
      setCommunityCoverImage(null)
      await fetchCommunity()
    } catch (error: any) {
      setError(error.message || 'コミュニティの編集に失敗しました')
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
  const canViewContent = isMember || isOwner
  const isPublicCommunity = community.is_public !== false // デフォルトはtrue

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
          {isEditingCommunity && isOwner ? (
            <form onSubmit={handleEditCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  コミュニティ名 *
                </label>
                <input
                  type="text"
                  value={communityEditForm.name}
                  onChange={(e) => setCommunityEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  value={communityEditForm.description}
                  onChange={(e) => setCommunityEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公開設定
                </label>
                <select
                  value={communityEditForm.visibility}
                  onChange={(e) => setCommunityEditForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                  className="input-field"
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カバー画像
                </label>
                <div className="space-y-2">
                  {(communityCoverImagePreview || community.cover_image_url) && (
                    <div className="relative inline-block">
                      <img
                        src={communityCoverImagePreview || community.cover_image_url || ''}
                        alt="カバー画像プレビュー"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCommunityCoverImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {!communityCoverImagePreview && !community.cover_image_url && (
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">カバー画像を選択</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleCommunityCoverImageChange}
                        className="hidden"
                        disabled={communityCoverImageUploading}
                      />
                    </label>
                  )}
                  {!communityCoverImagePreview && !community.cover_image_url && (
                    <p className="text-xs text-gray-500">
                      対応形式: JPEG, PNG, GIF, WebP（5MB以下）
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={communityCoverImageUploading}
                  className="btn-primary"
                >
                  {communityCoverImageUploading ? 'アップロード中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCommunity(false)
                    setCommunityCoverImage(null)
                    setCommunityCoverImagePreview(community.cover_image_url || null)
                    setCommunityEditForm({
                      name: community.name || '',
                      description: community.description || '',
                      visibility: community.visibility || 'public'
                    })
                  }}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <>
              {(communityCoverImagePreview || community.cover_image_url) && (
                <img
                  src={communityCoverImagePreview || community.cover_image_url || ''}
                  alt={community.name}
                  className="w-full h-48 object-cover rounded-t-lg mb-4"
                />
              )}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
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
                {isOwner && (
                  <button
                    onClick={() => setIsEditingCommunity(true)}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* 参加申請ボタン */}
          {!canViewContent && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {membershipStatus === 'pending' ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-2">加入申請中です</p>
                  <p className="text-sm text-gray-500">承認をお待ちください</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {isPublicCommunity 
                      ? 'このコミュニティに参加するには、加入申請が必要です。'
                      : 'このコミュニティは承認制です。加入申請を送信してください。'}
                  </p>
                  {user ? (
                    <button
                      onClick={handleJoinRequest}
                      className="btn-primary flex items-center mx-auto"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      加入申請
                    </button>
                  ) : (
                    <Link href="/auth/signin" className="btn-primary inline-flex items-center">
                      ログインして加入申請
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        {canViewContent && (
          <div className="card mb-6">
            <div className="flex space-x-1 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'timeline'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                タイムライン
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'members'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                メンバー
              </button>
              {community.community_type === 'official' && (
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'events'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  イベント
                </button>
              )}
              <button
                onClick={() => setActiveTab('quests')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'quests'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Flame className="h-4 w-4 inline mr-2" />
                クエスト
              </button>
            </div>
          </div>
        )}

        {/* タブコンテンツ */}
        {canViewContent && (
          <>
            {/* タイムライン */}
            {activeTab === 'timeline' && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">タイムライン</h2>
                  <Link href={`/posts/new?community_id=${communityId}`} className="btn-primary flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    投稿する
                  </Link>
                </div>

                {postsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">投稿がありません</p>
                    <p className="text-sm text-gray-400 mt-2">最初の投稿を作成してみましょう</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((item: any) => {
                      // イベントの場合
                      if (item.itemType === 'event') {
                        return (
                          <Link
                            key={item.id}
                            href={`/communities/${communityId}?tab=events#event-${item.id}`}
                            className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow border-l-4 border-l-purple-500 cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                    イベント
                                  </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2 flex-wrap gap-2">
                                  {item.event_date && (
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDateTime(item.event_date)}</span>
                                    </span>
                                  )}
                                  {item.location && (
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{item.location}</span>
                                    </span>
                                  )}
                                  {item.deadline && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>締切: {formatDateTime(item.deadline)}</span>
                                    </span>
                                  )}
                                  {item.creator && (
                                    <span>{item.creator.name}</span>
                                  )}
                                </div>
                                {item.is_registered && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    参加登録済み
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      }

                      // クエストの場合
                      if (item.itemType === 'quest') {
                        return (
                          <Link
                            key={item.id}
                            href={`/communities/${communityId}?tab=quests#quest-${item.id}`}
                            className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow border-l-4 border-l-orange-500 cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                    クエスト
                                  </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2 flex-wrap gap-2">
                                  {item.deadline && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>期限: {formatDateTime(item.deadline)}</span>
                                    </span>
                                  )}
                                  {item.reward_type && item.reward_amount && (
                                    <span className="flex items-center space-x-1">
                                      <Flame className="h-3 w-3" />
                                      <span>報酬: {item.reward_amount}{item.reward_type === 'candle' ? 'キャンドル' : 'トーチ'}</span>
                                    </span>
                                  )}
                                  {item.creator && (
                                    <span>{item.creator.name}</span>
                                  )}
                                </div>
                                {item.user_completion_status === 'approved' && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    完了済み
                                  </span>
                                )}
                                {item.user_completion_status === 'pending' && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                    申請中
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      }

                      // 通常の投稿の場合
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Link href={`/posts/${item.id}`} className="hover:underline">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                              </Link>
                              <p className="text-sm text-gray-600 line-clamp-1">{item.content}</p>
                              {/* 写真表示 */}
                              {item.image_url && (
                                <div className="mt-2">
                                  <img
                                    src={item.image_url}
                                    alt="投稿画像"
                                    className="w-full max-w-md rounded-lg border border-gray-200"
                                  />
                                </div>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center space-x-2">
                                  <UserAvatar 
                                    iconUrl={item.author?.icon_url} 
                                    name={item.author?.name} 
                                    size="sm"
                                  />
                                  <span>{item.author?.name || '不明'}</span>
                                </div>
                                <span>{formatDate(item.created_at)}</span>
                                <div className="flex items-center space-x-1">
                                  <Flame className="h-3 w-3" />
                                  <span>{item.likes_count}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{item.comments_count}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* メンバー */}
            {activeTab === 'members' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">メンバー</h2>

                {/* 承認待ちメンバー（所有者のみ） */}
                {isOwner && pendingMembers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">承認待ち</h3>
                    <div className="space-y-2">
                      {pendingMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.user?.name || '不明'}</p>
                              <p className="text-xs text-gray-500">申請日: {formatDate(member.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveMember(member.id)}
                              className="btn-primary text-sm flex items-center"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              承認
                            </button>
                            <button
                              onClick={() => handleRejectMember(member.id)}
                              className="btn-secondary text-sm flex items-center"
                            >
                              <X className="h-3 w-3 mr-1" />
                              拒否
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 承認済みメンバー */}
                {membersLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">メンバーがいません</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.user?.name || '不明'}</p>
                          <p className="text-xs text-gray-500">
                            {member.role === 'admin' ? '管理者' : 'メンバー'} • {formatDate(member.joined_at || member.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* イベント（公式コミュニティのみ） */}
            {activeTab === 'events' && community.community_type === 'official' && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">イベント</h2>
                  {isOwner && (
                    <button
                      onClick={() => setShowCreateEvent(!showCreateEvent)}
                      className="btn-primary flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      イベントを作成
                    </button>
                  )}
                </div>

                {/* イベント作成フォーム */}
                {showCreateEvent && isOwner && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">新しいイベント</h3>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          タイトル *
                        </label>
                        <input
                          type="text"
                          value={eventForm.title}
                          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="input-field"
                          placeholder="イベントのタイトルを入力"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          説明 *
                        </label>
                        <textarea
                          value={eventForm.description}
                          onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                          required
                          rows={3}
                          className="input-field"
                          placeholder="イベントの説明を入力"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            開催日時 *
                          </label>
                          <input
                            type="datetime-local"
                            value={eventForm.event_date}
                            onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                            required
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            締切日時
                          </label>
                          <input
                            type="datetime-local"
                            value={eventForm.deadline}
                            onChange={(e) => setEventForm(prev => ({ ...prev, deadline: e.target.value }))}
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            場所
                          </label>
                          <input
                            type="text"
                            value={eventForm.location}
                            onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                            className="input-field"
                            placeholder="会場名や住所"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            会議室リンク（Zoom等）
                          </label>
                          <input
                            type="url"
                            value={eventForm.online_url}
                            onChange={(e) => setEventForm(prev => ({ ...prev, online_url: e.target.value }))}
                            className="input-field"
                            placeholder="https://zoom.us/j/... または https://meet.google.com/..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          定員
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={eventForm.capacity}
                          onChange={(e) => setEventForm(prev => ({ ...prev, capacity: e.target.value }))}
                          className="input-field"
                          placeholder="定員数（空欄で無制限）"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          添付ファイル（Word、Excel、PowerPoint、PDF、写真など）
                        </label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                            onChange={handleEventFileChange}
                            className="input-field"
                            disabled={eventFilesUploading}
                          />
                          {eventFiles.length > 0 && (
                            <div className="space-y-2">
                              {eventFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">{getFileIcon(file.type)}</span>
                                    <span className="text-sm text-gray-700">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEventFile(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            対応形式: PDF, Word, Excel, PowerPoint, 画像（各ファイル10MB以下）
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" className="btn-primary">
                          作成
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateEvent(false)
                            setEventForm({
                              title: '',
                              description: '',
                              event_date: '',
                              location: '',
                              online_url: '',
                              deadline: '',
                              capacity: ''
                            })
                            setEventFiles([])
                          }}
                          className="btn-secondary"
                        >
                          キャンセル
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {eventsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">イベントがありません</p>
                    {isOwner && (
                      <p className="text-sm text-gray-400 mt-2">最初のイベントを作成してみましょう</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} id={`event-${event.id}`} className="border border-gray-200 rounded-lg p-4 scroll-mt-4">
                        {editingEventId === event.id ? (
                          <form onSubmit={handleEditEvent} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                タイトル *
                              </label>
                              <input
                                type="text"
                                value={editEventForm.title}
                                onChange={(e) => setEditEventForm(prev => ({ ...prev, title: e.target.value }))}
                                required
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                説明 *
                              </label>
                              <textarea
                                value={editEventForm.description}
                                onChange={(e) => setEditEventForm(prev => ({ ...prev, description: e.target.value }))}
                                required
                                rows={3}
                                className="input-field"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  開催日時 *
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editEventForm.event_date}
                                  onChange={(e) => setEditEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                                  required
                                  className="input-field"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  締切日時
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editEventForm.deadline}
                                  onChange={(e) => setEditEventForm(prev => ({ ...prev, deadline: e.target.value }))}
                                  className="input-field"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  場所
                                </label>
                                <input
                                  type="text"
                                  value={editEventForm.location}
                                  onChange={(e) => setEditEventForm(prev => ({ ...prev, location: e.target.value }))}
                                  className="input-field"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  会議室リンク（Zoom等）
                                </label>
                                <input
                                  type="url"
                                  value={editEventForm.online_url}
                                  onChange={(e) => setEditEventForm(prev => ({ ...prev, online_url: e.target.value }))}
                                  className="input-field"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                定員
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editEventForm.capacity}
                                onChange={(e) => setEditEventForm(prev => ({ ...prev, capacity: e.target.value }))}
                                className="input-field"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button type="submit" className="btn-primary">
                                保存
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEventId(null)
                                  setEditEventForm({
                                    title: '',
                                    description: '',
                                    event_date: '',
                                    location: '',
                                    online_url: '',
                                    deadline: '',
                                    capacity: ''
                                  })
                                }}
                                className="btn-secondary"
                              >
                                キャンセル
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                              {isOwner && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingEventId(event.id)
                                      setEditEventForm({
                                        title: event.title,
                                        description: event.description,
                                        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
                                        location: event.location || '',
                                        online_url: event.online_url || '',
                                        deadline: event.deadline ? new Date(event.deadline).toISOString().slice(0, 16) : '',
                                        capacity: event.capacity || ''
                                      })
                                    }}
                                    className="p-1 text-gray-600 hover:text-primary-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="p-1 text-gray-600 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDateTime(event.event_date)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.online_url && event.is_registered && (
                            <a
                              href={event.online_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline flex items-center space-x-1"
                            >
                              <span>📹</span>
                              <span>会議室リンク</span>
                            </a>
                          )}
                          {event.deadline && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>締切: {formatDateTime(event.deadline)}</span>
                            </div>
                          )}
                          {event.capacity && (
                            <span>定員: {event.capacity}名</span>
                          )}
                        </div>
                        {/* 添付ファイル表示 */}
                        {event.attachments && event.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">添付ファイル</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {event.attachments.map((attachment, index) => (
                                <a
                                  key={index}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                  <span className="text-lg">{getFileIcon(attachment.type)}</span>
                                  <span className="text-xs text-gray-700 truncate flex-1">{attachment.filename}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-3">
                          {event.is_registered ? (
                            <>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                参加登録済み
                              </span>
                              <button
                                onClick={() => handleCancelEventRegistration(event.id)}
                                className="btn-secondary text-sm"
                              >
                                キャンセル
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRegisterEvent(event.id)}
                              className="btn-primary text-sm"
                            >
                              参加する
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleViewEventParticipants(event.id)}
                              className="btn-secondary text-sm"
                            >
                              参加者一覧
                            </button>
                          )}
                        </div>
                        {isOwner && eventParticipants[event.id] && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              参加者 ({eventParticipants[event.id].length}名)
                            </h4>
                            <div className="space-y-1">
                              {eventParticipants[event.id].map((participant) => (
                                <div key={participant.id} className="text-sm text-gray-600">
                                  {participant.user?.name || '不明'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* クエスト */}
            {activeTab === 'quests' && (
              <div className="card">
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          期限（任意）
                        </label>
                        <input
                          type="datetime-local"
                          value={questForm.deadline}
                          onChange={(e) => setQuestForm(prev => ({ ...prev, deadline: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" className="btn-primary">
                          作成
                        </button>
                          <button
                          type="button"
                          onClick={() => {
                            setShowCreateQuest(false)
                            setQuestForm({ title: '', description: '', reward_type: 'candle', reward_amount: 1, deadline: '' })
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
                      <div key={quest.id} id={`quest-${quest.id}`} className="border border-gray-200 rounded-lg p-4 scroll-mt-4">
                        {editingQuestId === quest.id ? (
                          <form onSubmit={handleEditQuest} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                タイトル *
                              </label>
                              <input
                                type="text"
                                value={editQuestForm.title}
                                onChange={(e) => setEditQuestForm(prev => ({ ...prev, title: e.target.value }))}
                                required
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                説明
                              </label>
                              <textarea
                                value={editQuestForm.description}
                                onChange={(e) => setEditQuestForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="input-field"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  報酬タイプ
                                </label>
                                <select
                                  value={editQuestForm.reward_type}
                                  onChange={(e) => setEditQuestForm(prev => ({ ...prev, reward_type: e.target.value as 'candle' | 'torch' }))}
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
                                  value={editQuestForm.reward_amount}
                                  onChange={(e) => setEditQuestForm(prev => ({ ...prev, reward_amount: parseInt(e.target.value) || 1 }))}
                                  className="input-field"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                期限（任意）
                              </label>
                              <input
                                type="datetime-local"
                                value={editQuestForm.deadline}
                                onChange={(e) => setEditQuestForm(prev => ({ ...prev, deadline: e.target.value }))}
                                className="input-field"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button type="submit" className="btn-primary">
                                保存
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestId(null)
                                  setEditQuestForm({
                                    title: '',
                                    description: '',
                                    reward_type: 'candle',
                                    reward_amount: 1,
                                    deadline: ''
                                  })
                                }}
                                className="btn-secondary"
                              >
                                キャンセル
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
                                  {quest.created_by === user?.id && (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => {
                                          setEditingQuestId(quest.id)
                                          setEditQuestForm({
                                            title: quest.title,
                                            description: quest.description || '',
                                            reward_type: quest.reward_type,
                                            reward_amount: quest.reward_amount,
                                            deadline: quest.deadline ? new Date(quest.deadline).toISOString().slice(0, 16) : ''
                                          })
                                        }}
                                        className="p-1 text-gray-600 hover:text-primary-600"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteQuest(quest.id)}
                                        className="p-1 text-gray-600 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                            {quest.description && (
                              <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>作成者: {quest.creator?.name || '不明'}</span>
                              <span>{formatDate(quest.created_at)}</span>
                              {quest.deadline && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>期限: {formatDateTime(quest.deadline)}</span>
                                </span>
                              )}
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
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
