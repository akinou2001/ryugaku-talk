'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { getCommunityById, getCommunityStats, getCommunityMembers, getCommunityPosts, getCommunityEvents, requestCommunityMembership, updateMembershipStatus, createEvent, registerEvent, cancelEventRegistration, getEventParticipants, updateEvent, deleteEvent, updateCommunity, getCommunityChannels, createChannel, deleteChannel, getChannelMessages, sendChannelMessage, deleteCommunity } from '@/lib/community'
import { uploadFiles, uploadFile, validateFileType, validateFileSize, FILE_TYPES, getFileIcon, isImageFile } from '@/lib/storage'
import { getQuests, createQuest, requestQuestCompletion, updateQuestCompletionStatus, getQuestCompletions, updateQuest, deleteQuest, getQuestPostCounts, getQuestPosts } from '@/lib/quest'
import type { Community, Quest, QuestCompletion, Post, Event, CommunityMember, User, CommunityRoomMessage } from '@/lib/supabase'
import { ArrowLeft, Plus, Users, Building2, CheckCircle, X, Clock, MessageSquare, Calendar, UserPlus, Settings, MapPin, Upload, File, Image as ImageIcon, Edit, Trash2, Award, Heart, Archive, ArchiveRestore, Hash, Send } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { isAdmin } from '@/lib/admin'

type TabType = 'timeline' | 'members' | 'events' | 'quests' | 'channels'

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
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<'none' | 'pending' | 'approved'>('none')
  
  // 削除確認モーダル
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
  const [questPostCounts, setQuestPostCounts] = useState<Map<string, number>>(new Map())
  const [questPostAuthors, setQuestPostAuthors] = useState<Record<string, Array<{ id: string; name: string; icon_url?: string }>>>({})

  // クエスト作成フォーム
  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
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

  // チャンネル
  const [channels, setChannels] = useState<any[]>([])
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    member_permission: 'auto' as 'auto' | 'request'
  })
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [channelMessages, setChannelMessages] = useState<CommunityRoomMessage[]>([])
  const [channelMessagesLoading, setChannelMessagesLoading] = useState(false)
  const [newChannelMessage, setNewChannelMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [channelMessageFiles, setChannelMessageFiles] = useState<File[]>([])
  const [channelMessageFilesUploading, setChannelMessageFilesUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (tabParam && ['timeline', 'members', 'events', 'quests', 'channels'].includes(tabParam)) {
      setActiveTab(tabParam as TabType)
    }
    const channelParam = searchParams.get('channel')
    if (channelParam) {
      setSelectedChannelId(channelParam)
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
    if (selectedChannelId) {
      fetchChannelMessages(selectedChannelId)
      // リアルタイムでメッセージを監視
      const channel = supabase
        .channel(`channel-messages:${selectedChannelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_room_messages',
            filter: `room_id=eq.${selectedChannelId}`
          },
          (payload) => {
            const newMsg = payload.new as any
            // 送信者情報を取得
            supabase
              .from('profiles')
              .select('id, name, icon_url, account_type, verification_status, organization_name, is_operator')
              .eq('id', newMsg.sender_id)
              .single()
              .then(({ data: sender }) => {
                if (sender) {
                  setChannelMessages((prev) => {
                    if (prev.some(m => m.id === newMsg.id)) return prev
                    return [...prev, { ...newMsg, sender: sender as User } as CommunityRoomMessage]
                  })
                  scrollToBottom()
                }
              })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedChannelId])

  useEffect(() => {
    scrollToBottom()
  }, [channelMessages])

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
        case 'channels':
          fetchChannels()
          break
      }
    } else if (community && activeTab === 'channels') {
      // メンバーでなくてもチャンネル一覧は表示可能（閲覧のみ）
      fetchChannels()
    }
  }, [activeTab, community, isMember])

  const fetchCommunity = async () => {
    try {
      setLoading(true)
      const data = await getCommunityById(communityId, user?.id)
      setCommunity(data as Community)
      const owner = user?.id === data?.owner_id
      setIsOwner(owner)
      
      // 管理者かどうかを確認
      if (user) {
        const admin = await isAdmin(user.id)
        setIsAdminUser(admin)
      }
      
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
      setError('')
      const data = await getQuests(communityId, user?.id)
      setQuests(data || [])
      
      // クエストに紐づく投稿数を取得
      if (data && data.length > 0) {
        const counts = await getQuestPostCounts(data.map(q => q.id))
        setQuestPostCounts(counts)
        
        // 各クエストの回答者の情報を取得
        const authorsMap: Record<string, Array<{ id: string; name: string; icon_url?: string }>> = {}
        for (const quest of data) {
          try {
            const posts = await getQuestPosts(quest.id)
            // 重複を除去して回答者の情報を取得
            const uniqueAuthors = new Map<string, { id: string; name: string; icon_url?: string }>()
            posts.forEach(post => {
              if (post.author_id && post.author) {
                if (!uniqueAuthors.has(post.author_id)) {
                  uniqueAuthors.set(post.author_id, {
                    id: post.author_id,
                    name: post.author.name || '不明',
                    icon_url: post.author.icon_url
                  })
                }
              }
            })
            authorsMap[quest.id] = Array.from(uniqueAuthors.values())
          } catch (error) {
            console.error(`Error fetching authors for quest ${quest.id}:`, error)
            authorsMap[quest.id] = []
          }
        }
        setQuestPostAuthors(authorsMap)
      }
      
      // クエスト作成者の場合、各クエストの完了申請を取得
      if (isOwner && user && data) {
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
      setError(error.message || 'クエストの取得に失敗しました')
      setQuests([])
    } finally {
      setQuestsLoading(false)
    }
  }

  const fetchChannels = async () => {
    try {
      setChannelsLoading(true)
      const data = await getCommunityChannels(communityId, user?.id)
      setChannels(data || [])
    } catch (error: any) {
      console.error('Error fetching channels:', error)
      setError(error.message || 'チャンネルの取得に失敗しました')
    } finally {
      setChannelsLoading(false)
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
    if (!user || !isOwner) {
      setError('コミュニティの管理者のみクエストを作成できます')
      return
    }

    try {
      // datetime-localの値をISO形式に変換
      const deadline = questForm.deadline ? new Date(questForm.deadline).toISOString() : undefined
      
      await createQuest(
        communityId,
        questForm.title,
        questForm.description,
        questForm.reward_amount,
        deadline
      )
      setQuestForm({ title: '', description: '', reward_amount: 1, deadline: '' })
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
      setError('')
      await deleteQuest(questId)
      await fetchQuests()
      await fetchPosts() // タイムラインも更新
      // 成功メッセージを表示（オプション）
    } catch (error: any) {
      console.error('Error deleting quest:', error)
      setError(error.message || 'クエストの削除に失敗しました')
      alert(error.message || 'クエストの削除に失敗しました')
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
        cover_image_url: coverImageUrl || undefined
      })
      
      setIsEditingCommunity(false)
      setCommunityCoverImage(null)
      await fetchCommunity()
    } catch (error: any) {
      setError(error.message || 'コミュニティの編集に失敗しました')
    }
  }

  const handleArchiveCommunity = async () => {
    if (!isOwner) return
    if (!confirm('このコミュニティをアーカイブしますか？アーカイブされたコミュニティは検索結果に表示されなくなりますが、既存のメンバーは引き続きアクセスできます。')) {
      return
    }

    try {
      setError('')
      await updateCommunity(communityId, {
        is_archived: true
      })
      await fetchCommunity()
      alert('コミュニティをアーカイブしました')
    } catch (error: any) {
      setError(error.message || 'アーカイブに失敗しました')
    }
  }

  const handleUnarchiveCommunity = async () => {
    if (!isOwner) return
    if (!confirm('このコミュニティのアーカイブを解除しますか？')) {
      return
    }

    try {
      setError('')
      await updateCommunity(communityId, {
        is_archived: false
      })
      await fetchCommunity()
      alert('アーカイブを解除しました')
    } catch (error: any) {
      setError(error.message || 'アーカイブ解除に失敗しました')
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

  const fetchChannelMessages = async (channelId: string) => {
    try {
      setChannelMessagesLoading(true)
      const data = await getChannelMessages(channelId, 100)
      setChannelMessages(data || [])
      scrollToBottom()
    } catch (error: any) {
      console.error('Error fetching channel messages:', error)
      setError(error.message || 'メッセージの取得に失敗しました')
    } finally {
      setChannelMessagesLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isMember) {
      setError('コミュニティメンバーのみチャンネルを作成できます')
      return
    }

    try {
      await createChannel(
        communityId,
        channelForm.name,
        channelForm.description || undefined,
        channelForm.member_permission
      )
      setChannelForm({ name: '', description: '', member_permission: 'auto' })
      setShowCreateChannel(false)
      await fetchChannels()
    } catch (error: any) {
      setError(error.message || 'チャンネルの作成に失敗しました')
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('本当にこのチャンネルを削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      await deleteChannel(channelId)
      await fetchChannels()
      if (selectedChannelId === channelId) {
        setSelectedChannelId(null)
        setChannelMessages([])
      }
    } catch (error: any) {
      setError(error.message || 'チャンネルの削除に失敗しました')
    }
  }

  const handleDeleteCommunity = async () => {
    if (!community) return

    setDeleting(true)
    setError('')

    try {
      await deleteCommunity(communityId)
      router.push('/communities')
    } catch (error: any) {
      setError(error.message || 'コミュニティの削除に失敗しました')
      setDeleting(false)
    }
  }

  const handleChannelMessageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setChannelMessageFiles(prev => [...prev, ...files])
  }

  const handleRemoveChannelMessageFile = (index: number) => {
    setChannelMessageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendChannelMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedChannelId || sendingMessage) return
    if (!newChannelMessage.trim() && channelMessageFiles.length === 0) return

    setSendingMessage(true)
    setChannelMessageFilesUploading(true)
    setError('') // エラーをクリア
    try {
      // ファイルをアップロード
      let attachments: Array<{ url: string; filename: string; type: string }> = []
      if (channelMessageFiles.length > 0) {
        console.log('ファイルアップロード開始:', channelMessageFiles.map(f => ({ name: f.name, type: f.type, size: f.size })))
        
        // ファイルタイプとサイズを検証
        for (const file of channelMessageFiles) {
          console.log(`ファイル検証: ${file.name}, タイプ: ${file.type}, サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
          
          if (!validateFileType(file, FILE_TYPES.EVENT_ATTACHMENTS)) {
            const errorMsg = `${file.name}はサポートされていないファイル形式です（タイプ: ${file.type}）`
            console.error(errorMsg)
            throw new Error(errorMsg)
          }
          if (!validateFileSize(file, 10)) { // 10MB制限
            const errorMsg = `${file.name}は10MB以下である必要があります（現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`
            console.error(errorMsg)
            throw new Error(errorMsg)
          }
        }
        
        console.log('バケット: channel-attachments にアップロード開始')
        attachments = await uploadFiles(channelMessageFiles, 'channel-attachments', `channel-${selectedChannelId}`)
        console.log('ファイルアップロード成功:', attachments)
      }

      // 楽観的更新：即座にUIに反映
      const optimisticMessage: CommunityRoomMessage = {
        id: `temp-${Date.now()}`,
        room_id: selectedChannelId,
        sender_id: user.id,
        content: newChannelMessage.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name || '匿名',
          icon_url: user.icon_url || undefined,
          account_type: user.account_type || 'individual',
          verification_status: user.verification_status || 'unverified',
          organization_name: user.organization_name || undefined,
          is_operator: user.is_operator || false
        } as User
      }
      
      setChannelMessages((prev) => [...prev, optimisticMessage])
      const messageContent = newChannelMessage.trim()
      const messageAttachments = attachments.length > 0 ? attachments : undefined
      setNewChannelMessage('')
      setChannelMessageFiles([])
      scrollToBottom()

      const message = await sendChannelMessage(
        selectedChannelId, 
        messageContent,
        messageAttachments
      )
      
      // 楽観的更新を実際のデータに置き換え
      setChannelMessages((prev) => prev.map(m => 
        m.id === optimisticMessage.id ? message : m
      ))
      scrollToBottom()
    } catch (error: any) {
      console.error('メッセージ送信エラー:', error)
      const errorMessage = error.message || 'メッセージの送信に失敗しました'
      setError(errorMessage)
      // エラーメッセージを3秒後に自動で消す
      setTimeout(() => setError(''), 5000)
    } finally {
      setSendingMessage(false)
      setChannelMessageFilesUploading(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'たった今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
  const canViewContent = isMember || isOwner
  const isPublicCommunity = community.is_public !== false // デフォルトはtrue

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/communities')}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <div>
              <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
                {community.is_archived && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    アーカイブ済み
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isGuild ? 'サークル' : '公式コミュニティ'} • {formatDate(community.created_at)}
              </p>
            </div>
          </div>
        </div>

        {community.is_archived && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">
              このコミュニティはアーカイブされています。検索結果には表示されませんが、既存のメンバーは引き続きアクセスできます。
            </p>
          </div>
        )}

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
              
              {/* コミュニティ削除セクション */}
              {(isOwner || isAdminUser) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-900 mb-2">危険な操作</h3>
                    <p className="text-sm text-red-700 mb-4">
                      コミュニティを削除すると、すべての関連データ（投稿、イベント、クエスト、メンバー情報など）が永久に削除されます。この操作は取り消せません。
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>コミュニティを削除</span>
                    </button>
                  </div>
                </div>
              )}
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
                          isOperator={community.owner.is_operator}
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
                    title="コミュニティを編集"
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
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="flex space-x-1 border-b border-gray-200 min-w-max">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'timeline'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  タイムライン
                </button>
                <button
                  onClick={() => {
                    setActiveTab('channels')
                    setSelectedChannelId(null)
                    router.push(`/communities/${communityId}?tab=channels`, { scroll: false })
                  }}
                  className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'channels'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  チャンネル
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'members'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  メンバー
                </button>
                {community.community_type === 'official' && (
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      activeTab === 'events'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                    イベント
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('quests')}
                  className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'quests'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  クエスト
                </button>
              </div>
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
                            className="block border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow border-l-4 border-l-purple-500 cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium whitespace-nowrap">
                                    イベント
                                  </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{item.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">{item.description}</p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500 mt-2">
                                  {item.event_date && (
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3 flex-shrink-0" />
                                      <span className="break-words">{formatDateTime(item.event_date)}</span>
                                    </span>
                                  )}
                                  {item.location && (
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="break-words truncate">{item.location}</span>
                                    </span>
                                  )}
                                  {item.deadline && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="break-words">締切: {formatDateTime(item.deadline)}</span>
                                    </span>
                                  )}
                                  {item.creator && (
                                    <span className="truncate">{item.creator.name}</span>
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
                            className="block border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow border-l-4 border-l-orange-500 cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium whitespace-nowrap">
                                    クエスト
                                  </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{item.title}</h3>
                                {item.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 break-words">{item.description}</p>
                                )}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500 mt-2">
                                  {item.deadline && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="break-words">期限: {formatDateTime(item.deadline)}</span>
                                    </span>
                                  )}
                                  {item.reward_amount && (
                                    <span className="flex items-center space-x-1">
                                      <Award className="h-3 w-3 flex-shrink-0" />
                                      <span>報酬: {item.reward_amount}ポイント</span>
                                    </span>
                                  )}
                                  {item.creator && (
                                    <span className="truncate">{item.creator.name}</span>
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
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <Link href={`/posts/${item.id}`} className="hover:underline">
                                {item.category === 'chat' ? (
                                  <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2 break-words">{item.content}</p>
                                ) : (
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{item.title}</h3>
                                )}
                              </Link>
                              {item.category !== 'chat' && (
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">{item.content}</p>
                              )}
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
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <UserAvatar 
                                    iconUrl={item.author?.icon_url} 
                                    name={item.author?.name} 
                                    size="sm"
                                  />
                                  <span className="truncate">{item.author?.name || '不明'}</span>
                                </div>
                                <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                                <div className="flex items-center space-x-1">
                                  <Heart className="h-3 w-3 text-red-500 flex-shrink-0" />
                                  <span>{item.likes_count}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
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
                            <UserAvatar
                              iconUrl={member.user?.icon_url}
                              name={member.user?.name}
                              size="md"
                            />
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
                        <UserAvatar
                          iconUrl={member.user?.icon_url}
                          name={member.user?.name}
                          size="md"
                        />
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
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words flex-1 min-w-0">{event.title}</h3>
                              {isOwner && (
                                <div className="flex items-center space-x-2 flex-shrink-0">
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
                                        capacity: event.capacity ? String(event.capacity) : ''
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
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 break-words">{event.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="break-words">{formatDateTime(event.event_date)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.online_url && event.is_registered && (
                            <a
                              href={event.online_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline flex items-center space-x-1 whitespace-nowrap"
                            >
                              <span>📹</span>
                              <span>会議室リンク</span>
                            </a>
                          )}
                          {event.deadline && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">締切: {formatDateTime(event.deadline)}</span>
                            </div>
                          )}
                          {event.capacity && (
                            <span className="whitespace-nowrap">定員: {event.capacity}名</span>
                          )}
                        </div>
                        {/* 添付ファイル表示 */}
                        {event.attachments && event.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">添付ファイル</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {event.attachments.map((attachment, index) => (
                                <a
                                  key={index}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors min-w-0"
                                >
                                  <span className="text-lg flex-shrink-0">{getFileIcon(attachment.type)}</span>
                                  <span className="text-xs text-gray-700 truncate flex-1 min-w-0">{attachment.filename}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">クエスト</h2>
                  {isOwner && (
                    <button
                      onClick={() => setShowCreateQuest(!showCreateQuest)}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      クエストを作成
                    </button>
                  )}
                </div>

                {/* クエスト作成フォーム */}
                {showCreateQuest && isOwner && (
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
                            報酬ポイント
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
                            setQuestForm({ title: '', description: '', reward_amount: 1, deadline: '' })
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
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">クエストがありません</p>
                    {isOwner && (
                      <p className="text-sm text-gray-400">最初のクエストを作成してみましょう</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quests.map((quest) => (
                      <div key={quest.id} id={`quest-${quest.id}`} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200 scroll-mt-4">
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
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                報酬ポイント
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editQuestForm.reward_amount}
                                onChange={(e) => setEditQuestForm(prev => ({ ...prev, reward_amount: parseInt(e.target.value) || 1 }))}
                                className="input-field"
                              />
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
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1 gap-2">
                                  <Link
                                    href={`/communities/${communityId}/quests/${quest.id}`}
                                    className="text-base sm:text-lg font-semibold text-gray-900 break-words flex-1 min-w-0 hover:text-primary-600 transition-colors"
                                  >
                                    {quest.title}
                                  </Link>
                                  {quest.created_by === user?.id && (
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      <button
                                        onClick={() => {
                                          setEditingQuestId(quest.id)
                                          setEditQuestForm({
                                            title: quest.title,
                                            description: quest.description || '',
                                            reward_amount: quest.reward_amount,
                                            deadline: quest.deadline ? new Date(quest.deadline).toISOString().slice(0, 16) : ''
                                          })
                                        }}
                                        className="p-1 text-gray-600 hover:text-primary-600"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteQuest(quest.id)
                                        }}
                                        className="p-1 text-gray-600 hover:text-red-600"
                                        title="クエストを削除"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                            {quest.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">{quest.description}</p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500">
                              <span className="truncate">作成者: {quest.creator?.name || '不明'}</span>
                              <span className="whitespace-nowrap">{formatDate(quest.created_at)}</span>
                              <span className="flex items-center space-x-1 whitespace-nowrap">
                                <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                <span>回答: {questPostCounts.get(quest.id) || 0}件</span>
                              </span>
                              {quest.deadline && (
                                <span className={`flex items-center space-x-1 ${quest.status === 'completed' || (quest.deadline && new Date(quest.deadline) < new Date()) ? 'text-red-600 font-semibold' : ''}`}>
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="break-words">
                                    期限: {formatDateTime(quest.deadline)}
                                    {(quest.status === 'completed' || (quest.deadline && new Date(quest.deadline) < new Date())) && ' (締切済み)'}
                                  </span>
                                </span>
                              )}
                              {quest.reward_amount && (
                                <span className="flex items-center space-x-1 whitespace-nowrap">
                                  <Award className="h-3 w-3 flex-shrink-0" />
                                  <span>報酬: {quest.reward_amount}ポイント</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            {(quest.status === 'completed' || (quest.deadline && new Date(quest.deadline) < new Date())) && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium whitespace-nowrap">
                                締切済み
                              </span>
                            )}
                            {quest.user_completion_status === 'approved' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium whitespace-nowrap">
                                完了済み
                              </span>
                            )}
                            {quest.user_completion_status === 'pending' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium whitespace-nowrap">
                                申請中
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 回答するボタン（締切済みでない場合のみ） */}
                        {isMember && quest.status !== 'completed' && (!quest.deadline || new Date(quest.deadline) >= new Date()) && (
                          <div className="mt-3 flex items-center space-x-2">
                            <Link
                              href={`/posts/new?quest_id=${quest.id}&community_id=${communityId}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              回答する
                            </Link>
                                </div>
                        )}
                        {/* 締切済みの場合のメッセージ */}
                        {isMember && (quest.status === 'completed' || (quest.deadline && new Date(quest.deadline) < new Date())) && (
                          <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
                            このクエストは締め切られています
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
                        {isOwner && quest.created_by === user?.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">
                                回答が{questPostCounts.get(quest.id) || 0}件あります。
                              </span>
                              {questPostAuthors[quest.id] && questPostAuthors[quest.id].length > 0 && (
                                <div className="flex -space-x-2">
                                  {questPostAuthors[quest.id].slice(0, 10).map((author) => (
                                    <div
                                      key={author.id}
                                      className="relative"
                                      title={author.name}
                                    >
                                      <UserAvatar
                                        iconUrl={author.icon_url}
                                        name={author.name}
                                        size="sm"
                                      />
                                    </div>
                                  ))}
                                  {questPostAuthors[quest.id].length > 10 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white">
                                      +{questPostAuthors[quest.id].length - 10}
                                    </div>
                                  )}
                                </div>
                              )}
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

            {/* チャンネル */}
            {activeTab === 'channels' && (
              <div className="card">
                {!selectedChannelId ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">チャンネル</h2>
                      {isMember && (
                        <button
                          onClick={() => setShowCreateChannel(true)}
                          className="btn-primary flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          チャンネルを作成
                        </button>
                      )}
                    </div>

                    {/* チャンネル作成フォーム */}
                    {showCreateChannel && isMember && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">新しいチャンネル</h3>
                        <form onSubmit={handleCreateChannel} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              チャンネル名 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={channelForm.name}
                              onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                              required
                              className="input-field"
                              placeholder="例: 雑談、質問、イベントなど"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              説明（任意）
                            </label>
                            <textarea
                              value={channelForm.description}
                              onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                              rows={2}
                              className="input-field"
                              placeholder="チャンネルの説明を入力"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button type="submit" className="btn-primary">
                              作成
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateChannel(false)
                                setChannelForm({ name: '', description: '', member_permission: 'auto' })
                              }}
                              className="btn-secondary"
                            >
                              キャンセル
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* チャンネル一覧 */}
                    {channelsLoading ? (
                      <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : channels.length === 0 ? (
                      <div className="text-center py-12">
                        <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">チャンネルがありません</p>
                        {isMember ? (
                          <button
                            onClick={() => setShowCreateChannel(true)}
                            className="mt-4 btn-primary inline-flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            チャンネルを作成
                          </button>
                        ) : (
                          <p className="text-sm text-gray-400 mt-2">コミュニティに参加してチャンネルを作成しましょう</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {channels.map((channel) => (
                          <div
                            key={channel.id}
                            onClick={() => {
                              setSelectedChannelId(channel.id)
                            }}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Hash className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{channel.name}</h3>
                                {channel.description && (
                                  <p className="text-sm text-gray-500 truncate">{channel.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                                  <span>{channel.message_count || 0}件のメッセージ</span>
                                  {channel.creator && (
                                    <span>作成者: {channel.creator.name}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteChannel(channel.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="チャンネルを削除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
              </div>
            )}
          </>
                ) : (
                  <div className="flex flex-col h-[600px]">
                    {/* チャンネルヘッダー */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedChannelId(null)
                          }}
                          className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <Hash className="h-5 w-5 text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          {channels.find(c => c.id === selectedChannelId)?.name || 'チャンネル'}
                        </h2>
                      </div>
                    </div>

                    {/* メッセージ一覧 */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                      {channelMessagesLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          <p className="text-sm text-gray-600 mt-2">読み込み中...</p>
                        </div>
                      ) : channelMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">メッセージがありません</p>
                          <p className="text-sm text-gray-400 mt-2">最初のメッセージを送信してみましょう</p>
                        </div>
                      ) : (
                        <>
                          {channelMessages.map((message) => (
                            <div key={message.id} className="flex items-start space-x-3">
                              <UserAvatar
                                iconUrl={message.sender?.icon_url}
                                name={message.sender?.name}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-gray-900 text-sm">
                                    {message.sender?.name || '不明'}
                                  </span>
                                  {message.sender && (
                                    <AccountBadge
                                      accountType={message.sender.account_type}
                                      verificationStatus={message.sender.verification_status}
                                      isOperator={message.sender.is_operator}
                                      size="sm"
                                    />
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {formatMessageTime(message.created_at)}
                                  </span>
                                </div>
                                {message.content && (
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mb-2">
                                    {message.content}
                                  </p>
                                )}
                                {/* 添付ファイル表示 */}
                                {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    {message.attachments.map((attachment: any, index: number) => (
                                      <div key={index}>
                                        {isImageFile({ type: attachment.type } as File) ? (
                                          <div className="mt-2">
                                            <img
                                              src={attachment.url}
                                              alt={attachment.filename}
                                              className="max-w-full max-h-64 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => window.open(attachment.url, '_blank')}
                                            />
                                          </div>
                                        ) : (
                                          <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                          >
                                            <span className="text-lg">{getFileIcon(attachment.type)}</span>
                                            <span className="text-sm text-gray-700 flex-1 truncate">{attachment.filename}</span>
                                            <File className="h-4 w-4 text-gray-400" />
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* メッセージ送信フォーム */}
                    {isMember && (
                      <form onSubmit={handleSendChannelMessage} className="border-t border-gray-200 pt-4">
                        {/* エラーメッセージ表示 */}
                        {error && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                            <p className="text-sm font-medium">{error}</p>
                          </div>
                        )}
                        {/* 選択されたファイル一覧 */}
                        {channelMessageFiles.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {channelMessageFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <span className="text-lg">{getFileIcon(file.type)}</span>
                                  <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChannelMessageFile(index)}
                                  className="ml-2 p-1 text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <label className="p-2 text-gray-600 hover:text-primary-600 cursor-pointer transition-colors">
                            <Upload className="h-5 w-5" />
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                              onChange={handleChannelMessageFileChange}
                              className="hidden"
                              disabled={sendingMessage || channelMessageFilesUploading}
                            />
                          </label>
                          <input
                            type="text"
                            value={newChannelMessage}
                            onChange={(e) => setNewChannelMessage(e.target.value)}
                            placeholder="メッセージを入力..."
                            className="input-field flex-1"
                            disabled={sendingMessage || channelMessageFilesUploading}
                          />
                          <button
                            type="submit"
                            disabled={sendingMessage || channelMessageFilesUploading || (!newChannelMessage.trim() && channelMessageFiles.length === 0)}
                            className="btn-primary flex items-center disabled:opacity-50"
                          >
                            {channelMessageFilesUploading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          対応形式: PDF, Word, Excel, PowerPoint, 画像（各ファイル10MB以下）
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* コミュニティ削除確認モーダル */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">コミュニティを削除</h3>
              <p className="text-gray-600 mb-4">
                この操作は取り消せません。コミュニティとすべての関連データ（投稿、イベント、クエスト、メンバー情報など）が永久に削除されます。
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setError('')
                  }}
                  className="btn-secondary flex-1"
                  disabled={deleting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteCommunity}
                  disabled={deleting}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
