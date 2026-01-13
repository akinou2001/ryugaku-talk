'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { isAdmin, getVerificationRequests, approveVerificationRequest, rejectVerificationRequest, getUsers, getAdminStats, updateVerificationStatus, getReports, updateReportStatus, deleteReportedPost, deleteReportedComment, getGlobalAnnouncements, createGlobalAnnouncement, updateGlobalAnnouncement, deleteGlobalAnnouncement, getGlobalQuests, createGlobalQuest } from '@/lib/admin'
import type { User, OrganizationVerificationRequest, Report, GlobalAnnouncement, Quest } from '@/lib/supabase'
import { Shield, Users, FileCheck, AlertCircle, CheckCircle, XCircle, Search, Filter, BarChart3, UserCheck, UserX, Flag, Trash2, GraduationCap, Plus, Edit, Trash, Megaphone, Award } from 'lucide-react'
import { searchUniversities, getContinents, getCountryCodes, createUniversity, updateUniversity, deleteUniversity, getUniversityAliases, createAlias, deleteAlias, type University, type Continent, type UniversityAlias } from '@/lib/universities'

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminStatus, setAdminStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<'stats' | 'verifications' | 'users' | 'reports' | 'universities' | 'announcements'>('stats')
  
  // 統計情報
  const [stats, setStats] = useState<any>(null)
  
  // 認証申請
  const [verificationRequests, setVerificationRequests] = useState<OrganizationVerificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<OrganizationVerificationRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // ユーザー管理
  const [users, setUsers] = useState<User[]>([])
  const [userFilters, setUserFilters] = useState({
    accountType: 'all',
    verificationStatus: 'all',
    isActive: 'all',
    search: ''
  })

  // 通報管理
  const [reports, setReports] = useState<Report[]>([])
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [processingReport, setProcessingReport] = useState(false)

  // 大学管理
  const [universities, setUniversities] = useState<University[]>([])
  const [continents, setContinents] = useState<Continent[]>([])
  const [countryCodes, setCountryCodes] = useState<string[]>([])
  const [universityFilters, setUniversityFilters] = useState({
    query: '',
    countryCode: '',
    continentId: '',
    tags: [] as string[],
  })
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [selectedUniversityAliases, setSelectedUniversityAliases] = useState<UniversityAlias[]>([])
  const [isEditingUniversity, setIsEditingUniversity] = useState(false)
  const [isAddingUniversity, setIsAddingUniversity] = useState(false)
  const [newAlias, setNewAlias] = useState({ alias: '', alias_type: 'other' as 'abbreviation' | 'variant' | 'old_name' | 'other' })
  const [universityForm, setUniversityForm] = useState({
    name_en: '',
    name_ja: '',
    country_code: '',
    continent_id: null as number | null,
    city: '',
    latitude: '',
    longitude: '',
    website: '',
    tags: [] as string[],
  })

  // お知らせ管理
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([])
  const [globalQuests, setGlobalQuests] = useState<Quest[]>([])
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<GlobalAnnouncement | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: ''
  })
  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    reward_amount: 0,
    deadline: ''
  })

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  useEffect(() => {
    if (adminStatus) {
      loadData()
    }
  }, [adminStatus, activeTab])

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      router.push('/')
      return
    }

    setAdminStatus(true)
    setLoading(false)
  }

  const loadData = async () => {
    try {
      if (activeTab === 'stats') {
        const { data, error } = await getAdminStats()
        if (error) {
          console.error('Error loading stats:', error)
          alert(`統計情報の取得に失敗しました: ${error.message || error}`)
        }
        if (data) {
          setStats(data)
        }
    } else if (activeTab === 'verifications') {
      console.log('Loading verification requests...')
      const { data, error } = await getVerificationRequests('pending')
      console.log('Verification requests result:', { data, error, count: data?.length || 0 })
      if (error) {
        console.error('Error loading verification requests:', error)
        alert(`認証申請の取得に失敗しました: ${error.message || error}`)
      }
      if (data) {
        console.log('Setting verification requests:', data.length)
        setVerificationRequests(data || [])
      } else {
        console.log('No data, setting empty array')
        setVerificationRequests([])
      }
      } else if (activeTab === 'users') {
        const filters: any = {}
        if (userFilters.accountType !== 'all') {
          filters.accountType = userFilters.accountType
        }
        if (userFilters.verificationStatus !== 'all') {
          filters.verificationStatus = userFilters.verificationStatus
        }
        if (userFilters.isActive !== 'all') {
          filters.isActive = userFilters.isActive === 'true'
        }
        if (userFilters.search) {
          filters.search = userFilters.search
        }

        const { data, error } = await getUsers(filters)
        if (error) {
          console.error('Error loading users:', error)
          alert(`ユーザー情報の取得に失敗しました: ${error.message || error}`)
        }
        if (data) {
          setUsers(data || [])
        } else {
          setUsers([])
        }
      } else if (activeTab === 'reports') {
        const status = reportStatusFilter === 'all' ? undefined : reportStatusFilter
        const { data, error } = await getReports(status)
        if (error) {
          console.error('Error loading reports:', error)
          alert(`通報の取得に失敗しました: ${error.message || error}`)
        }
        if (data) {
          setReports(data || [])
        } else {
          setReports([])
        }
      } else if (activeTab === 'universities') {
        // 大陸と国コードを取得
        const { data: continentsData } = await getContinents()
        if (continentsData) {
          setContinents(continentsData)
        }

        const { data: countryCodesData } = await getCountryCodes()
        if (countryCodesData) {
          setCountryCodes(countryCodesData.map(c => c.country_code))
        }

        // 大学を検索
        const { data: universitiesData, error } = await searchUniversities({
          query: universityFilters.query || undefined,
          countryCode: universityFilters.countryCode || undefined,
          continentId: universityFilters.continentId ? parseInt(universityFilters.continentId) : undefined,
          tags: universityFilters.tags.length > 0 ? universityFilters.tags : undefined,
          limit: 100,
        })

        if (error) {
          console.error('Error loading universities:', error)
          alert(`大学データの取得に失敗しました: ${error.message || error}`)
        }
        if (universitiesData) {
          setUniversities(universitiesData || [])
        } else {
          setUniversities([])
        }
      } else if (activeTab === 'announcements') {
        // 全員向けお知らせを取得
        const { data: announcementsData, error: announcementsError } = await getGlobalAnnouncements()
        if (announcementsError) {
          console.error('Error loading announcements:', announcementsError)
          alert(`お知らせの取得に失敗しました: ${announcementsError}`)
        }
        if (announcementsData) {
          setAnnouncements(announcementsData || [])
        } else {
          setAnnouncements([])
        }

        // 全員向けクエストを取得
        const { data: questsData, error: questsError } = await getGlobalQuests()
        if (questsError) {
          console.error('Error loading global quests:', questsError)
          alert(`クエストの取得に失敗しました: ${questsError}`)
        }
        if (questsData) {
          setGlobalQuests(questsData || [])
        } else {
          setGlobalQuests([])
        }
      }
    } catch (error: any) {
      console.error('Error in loadData:', error)
      alert(`データの取得に失敗しました: ${error.message || error}`)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!user) return

    setProcessing(true)
    const result = await approveVerificationRequest(requestId, user.id, reviewNotes)
    setProcessing(false)

    if (result.success) {
      setSelectedRequest(null)
      setReviewNotes('')
      loadData()
      alert('認証申請を承認しました。承認されたユーザーは一度ログアウトして再ログインしてください。')
    } else {
      alert(`エラー: ${result.error}`)
      console.error('Approval error:', result.error)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!user) return

    setProcessing(true)
    const result = await rejectVerificationRequest(requestId, user.id, reviewNotes)
    setProcessing(false)

    if (result.success) {
      setSelectedRequest(null)
      setReviewNotes('')
      loadData()
      alert('認証申請を拒否しました')
    } else {
      alert(`エラー: ${result.error}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!adminStatus) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
        </div>

        {/* タブ */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 inline mr-2" />
              統計情報
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'verifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileCheck className="h-5 w-5 inline mr-2" />
              認証申請
              {verificationRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {verificationRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              ユーザー管理
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Flag className="h-5 w-5 inline mr-2" />
              通報管理
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('universities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'universities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="h-5 w-5 inline mr-2" />
              大学管理
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'announcements'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Megaphone className="h-5 w-5 inline mr-2" />
              お知らせ管理
            </button>
          </nav>
        </div>

        {/* 統計情報 */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総ユーザー数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_users || 0}</p>
                </div>
                <Users className="h-12 w-12 text-primary-600 opacity-50" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">組織アカウント</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(stats.educational_users || 0) + (stats.company_users || 0) + (stats.government_users || 0)}
                  </p>
                </div>
                <Shield className="h-12 w-12 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">認証待ち</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending_verifications || 0}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-yellow-600 opacity-50" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">通報待ち</p>
                  <p className="text-3xl font-bold text-red-600">{stats.pending_reports || 0}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-red-600 opacity-50" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総投稿数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_posts || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">公式投稿</p>
                  <p className="text-3xl font-bold text-primary-600">{stats.official_posts || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総コメント数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_comments || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 認証申請 */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            {verificationRequests.length === 0 ? (
              <div className="card text-center py-12">
                <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">認証待ちの申請はありません</p>
              </div>
            ) : (
              verificationRequests.map((request) => (
                <div key={request.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.organization_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.account_type === 'educational' ? 'bg-blue-100 text-blue-800' :
                          request.account_type === 'company' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {request.account_type === 'educational' ? '教育機関' :
                           request.account_type === 'company' ? '企業' : '政府機関'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>申請者:</strong> {request.profiles?.name} ({request.profiles?.email})</p>
                        <p><strong>担当者:</strong> {request.contact_person_name} ({request.contact_person_email})</p>
                        {request.organization_url && (
                          <p><strong>URL:</strong> <a href={request.organization_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{request.organization_url}</a></p>
                        )}
                        {request.request_reason && (
                          <p><strong>申請理由:</strong> {request.request_reason}</p>
                        )}
                        <p><strong>申請日:</strong> {new Date(request.created_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="btn-secondary text-sm"
                      >
                        詳細
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ユーザー管理 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* フィルター */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">アカウントタイプ</label>
                  <select
                    value={userFilters.accountType}
                    onChange={(e) => setUserFilters({ ...userFilters, accountType: e.target.value })}
                    className="input-field"
                  >
                    <option value="all">すべて</option>
                    <option value="individual">個人</option>
                    <option value="educational">教育機関</option>
                    <option value="company">企業</option>
                    <option value="government">政府機関</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">認証ステータス</label>
                  <select
                    value={userFilters.verificationStatus}
                    onChange={(e) => setUserFilters({ ...userFilters, verificationStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="all">すべて</option>
                    <option value="unverified">未認証</option>
                    <option value="pending">審査中</option>
                    <option value="verified">認証済み</option>
                    <option value="rejected">拒否</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">アカウント状態</label>
                  <select
                    value={userFilters.isActive}
                    onChange={(e) => setUserFilters({ ...userFilters, isActive: e.target.value })}
                    className="input-field"
                  >
                    <option value="all">すべて</option>
                    <option value="true">有効</option>
                    <option value="false">停止中</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                      placeholder="名前・メール・組織名"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={loadData}
                className="btn-primary mt-4"
              >
                検索
              </button>
            </div>

            {/* ユーザー一覧 */}
            <div className="space-y-4">
              {users.map((targetUser) => (
                <div key={targetUser.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{targetUser.name}</h3>
                        {!targetUser.is_active && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            停止中
                          </span>
                        )}
                        {targetUser.is_admin && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            管理者
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>メール:</strong> {targetUser.email}</p>
                        {targetUser.organization_name && (
                          <p><strong>組織:</strong> {targetUser.organization_name}</p>
                        )}
                        <p><strong>登録日:</strong> {new Date(targetUser.created_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={`/profile/${targetUser.id}`}
                        className="btn-secondary text-sm"
                        target="_blank"
                      >
                        プロフィール
                      </a>
                      {targetUser.account_type !== 'individual' && (
                        <div className="relative">
                          <select
                            value={targetUser.verification_status}
                            onChange={async (e) => {
                              const newStatus = e.target.value as 'pending' | 'verified' | 'rejected'
                              if (confirm(`認証状態を「${newStatus === 'verified' ? '認証済み' : newStatus === 'rejected' ? '拒否' : '審査中'}」に変更しますか？`)) {
                                if (!user) {
                                  alert('管理者情報が取得できません')
                                  return
                                }
                                const result = await updateVerificationStatus(targetUser.id, newStatus, user.id, '')
                                if (result.success) {
                                  alert('認証状態を更新しました')
                                  loadData()
                                } else {
                                  alert(`エラー: ${result.error}`)
                                }
                              } else {
                                // キャンセルされた場合は元の値に戻す
                                e.target.value = targetUser.verification_status
                              }
                            }}
                            className="input-field text-sm"
                          >
                            <option value="pending">審査中</option>
                            <option value="verified">認証済み</option>
                            <option value="rejected">拒否</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 通報管理 */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* フィルター */}
            <div className="card">
              <div className="flex items-center space-x-4">
                <label className="block text-sm font-medium text-gray-700">ステータス</label>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => {
                    setReportStatusFilter(e.target.value as 'all' | 'pending' | 'reviewed' | 'resolved')
                    setTimeout(() => loadData(), 100)
                  }}
                  className="input-field"
                >
                  <option value="all">すべて</option>
                  <option value="pending">未対応</option>
                  <option value="reviewed">確認済み</option>
                  <option value="resolved">解決済み</option>
                </select>
                <button
                  onClick={loadData}
                  className="btn-primary"
                >
                  更新
                </button>
              </div>
            </div>

            {/* 通報一覧 */}
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="card text-center py-12">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">通報はありません</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'pending' ? 'bg-red-100 text-red-800' :
                            report.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {report.status === 'pending' ? '未対応' :
                             report.status === 'reviewed' ? '確認済み' : '解決済み'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><strong>通報者:</strong> {report.reporter?.name || '不明'} ({report.reporter?.email || '不明'})</p>
                          <p><strong>通報理由:</strong> {report.reason}</p>
                          {report.description && (
                            <p><strong>詳細:</strong> {report.description}</p>
                          )}
                          {report.post_id && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p><strong>通報対象（投稿）:</strong></p>
                              <p className="text-gray-700 mt-1">{report.post?.title || '投稿が見つかりません'}</p>
                              <a
                                href={`/posts/${report.post_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline text-xs mt-1 inline-block"
                              >
                                投稿を確認 →
                              </a>
                            </div>
                          )}
                          {report.comment_id && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p><strong>通報対象（コメント）:</strong></p>
                              <p className="text-gray-700 mt-1">{report.comment?.content?.substring(0, 100) || 'コメントが見つかりません'}...</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="btn-secondary text-sm"
                            >
                              詳細
                            </button>
                            {report.post_id && (
                              <button
                                onClick={async () => {
                                  if (confirm('この投稿を削除しますか？この操作は取り消せません。')) {
                                    setProcessingReport(true)
                                    const result = await deleteReportedPost(report.post_id!)
                                    setProcessingReport(false)
                                    if (result.success) {
                                      alert('投稿を削除しました')
                                      loadData()
                                    } else {
                                      alert(`エラー: ${result.error}`)
                                    }
                                  }
                                }}
                                disabled={processingReport}
                                className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 inline mr-1" />
                                投稿削除
                              </button>
                            )}
                            {report.comment_id && (
                              <button
                                onClick={async () => {
                                  if (confirm('このコメントを削除しますか？この操作は取り消せません。')) {
                                    setProcessingReport(true)
                                    const result = await deleteReportedComment(report.comment_id!)
                                    setProcessingReport(false)
                                    if (result.success) {
                                      alert('コメントを削除しました')
                                      loadData()
                                    } else {
                                      alert(`エラー: ${result.error}`)
                                    }
                                  }
                                }}
                                disabled={processingReport}
                                className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 inline mr-1" />
                                コメント削除
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 認証申請詳細モーダル */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">認証申請の詳細</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">組織名</label>
                    <p className="text-gray-900">{selectedRequest.organization_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">申請者</label>
                    <p className="text-gray-900">{selectedRequest.profiles?.name} ({selectedRequest.profiles?.email})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                    <p className="text-gray-900">{selectedRequest.contact_person_name} ({selectedRequest.contact_person_email})</p>
                  </div>
                  {selectedRequest.request_reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">申請理由</label>
                      <p className="text-gray-900">{selectedRequest.request_reason}</p>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">審査メモ</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="input-field"
                    placeholder="審査メモを入力してください（任意）"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processing}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    承認
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={processing}
                    className="btn-secondary flex-1 flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    拒否
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(null)
                      setReviewNotes('')
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 通報詳細モーダル */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">通報の詳細</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedReport.status === 'pending' ? 'bg-red-100 text-red-800' :
                        selectedReport.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedReport.status === 'pending' ? '未対応' :
                         selectedReport.status === 'reviewed' ? '確認済み' : '解決済み'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">通報者</label>
                    <p className="text-gray-900">{selectedReport.reporter?.name || '不明'} ({selectedReport.reporter?.email || '不明'})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">通報理由</label>
                    <p className="text-gray-900">{selectedReport.reason}</p>
                  </div>
                  {selectedReport.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">詳細説明</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>
                  )}
                  {selectedReport.post_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">通報対象（投稿）</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 font-semibold mb-1">{selectedReport.post?.title || '投稿が見つかりません'}</p>
                        <p className="text-gray-700 text-sm">{selectedReport.post?.content?.substring(0, 200)}...</p>
                        <a
                          href={`/posts/${selectedReport.post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                        >
                          投稿を確認 →
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedReport.comment_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">通報対象（コメント）</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.comment?.content || 'コメントが見つかりません'}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">通報日時</label>
                    <p className="text-gray-900">{new Date(selectedReport.created_at).toLocaleString('ja-JP')}</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  {selectedReport.status === 'pending' && (
                    <>
                      <button
                        onClick={async () => {
                          if (!user) return
                          setProcessingReport(true)
                          const result = await updateReportStatus(selectedReport.id, 'reviewed', user.id)
                          setProcessingReport(false)
                          if (result.success) {
                            alert('ステータスを「確認済み」に更新しました')
                            setSelectedReport(null)
                            loadData()
                          } else {
                            alert(`エラー: ${result.error}`)
                          }
                        }}
                        disabled={processingReport}
                        className="btn-secondary flex-1 flex items-center justify-center"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        確認済みにする
                      </button>
                      <button
                        onClick={async () => {
                          if (!user) return
                          setProcessingReport(true)
                          const result = await updateReportStatus(selectedReport.id, 'resolved', user.id)
                          setProcessingReport(false)
                          if (result.success) {
                            alert('ステータスを「解決済み」に更新しました')
                            setSelectedReport(null)
                            loadData()
                          } else {
                            alert(`エラー: ${result.error}`)
                          }
                        }}
                        disabled={processingReport}
                        className="btn-primary flex-1 flex items-center justify-center"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        解決済みにする
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedReport(null)
                    }}
                    className="btn-secondary"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 大学管理 */}
        {activeTab === 'universities' && (
          <div className="space-y-6">
            {/* フィルター */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={universityFilters.query}
                      onChange={(e) => setUniversityFilters({ ...universityFilters, query: e.target.value })}
                      placeholder="大学名（日本語・英語）"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">国</label>
                  <select
                    value={universityFilters.countryCode}
                    onChange={(e) => setUniversityFilters({ ...universityFilters, countryCode: e.target.value })}
                    className="input-field"
                  >
                    <option value="">すべて</option>
                    {countryCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">大陸</label>
                  <select
                    value={universityFilters.continentId}
                    onChange={(e) => setUniversityFilters({ ...universityFilters, continentId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">すべて</option>
                    {continents.map(continent => (
                      <option key={continent.id} value={continent.id.toString()}>{continent.name_ja}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadData}
                    className="btn-primary w-full"
                  >
                    検索
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddingUniversity(true)
                  setUniversityForm({
                    name_en: '',
                    name_ja: '',
                    country_code: '',
                    continent_id: null,
                    city: '',
                    latitude: '',
                    longitude: '',
                    website: '',
                    tags: [],
                  })
                }}
                className="btn-primary mt-4 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                大学を追加
              </button>
            </div>

            {/* 大学一覧 */}
            <div className="space-y-4">
              {universities.length === 0 ? (
                <div className="card text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">大学が見つかりません</p>
                </div>
              ) : (
                universities.map((uni) => (
                  <div key={uni.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {uni.name_ja || uni.name_en}
                          </h3>
                          {uni.name_ja && (
                            <span className="text-sm text-gray-500">({uni.name_en})</span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {uni.country_code}
                          </span>
                          {uni.continent && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              {uni.continent.name_ja}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {uni.city && <p><strong>都市:</strong> {uni.city}</p>}
                          {uni.website && (
                            <p><strong>URL:</strong> <a href={uni.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{uni.website}</a></p>
                          )}
                          {uni.tags && uni.tags.length > 0 && (
                            <p><strong>タグ:</strong> {uni.tags.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            setSelectedUniversity(uni)
                            setIsEditingUniversity(true)
                            setUniversityForm({
                              name_en: uni.name_en,
                              name_ja: uni.name_ja || '',
                              country_code: uni.country_code,
                              continent_id: uni.continent_id || null,
                              city: uni.city || '',
                              latitude: uni.latitude?.toString() || '',
                              longitude: uni.longitude?.toString() || '',
                              website: uni.website || '',
                              tags: uni.tags || [],
                            })
                            // エイリアスも取得
                            const { data: aliases } = await getUniversityAliases(uni.id)
                            setSelectedUniversityAliases(aliases || [])
                          }}
                          className="btn-secondary text-sm"
                        >
                          <Edit className="h-4 w-4 inline mr-1" />
                          編集
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`「${uni.name_ja || uni.name_en}」を削除しますか？この操作は取り消せません。`)) {
                              const { error } = await deleteUniversity(uni.id)
                              if (error) {
                                alert(`エラー: ${error.message || error}`)
                              } else {
                                alert('大学を削除しました')
                                loadData()
                              }
                            }
                          }}
                          className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4 inline mr-1" />
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 大学編集・追加モーダル */}
        {(isEditingUniversity || isAddingUniversity) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isAddingUniversity ? '大学を追加' : '大学を編集'}
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">英語名 *</label>
                    <input
                      type="text"
                      value={universityForm.name_en}
                      onChange={(e) => setUniversityForm({ ...universityForm, name_en: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日本語名</label>
                    <input
                      type="text"
                      value={universityForm.name_ja}
                      onChange={(e) => setUniversityForm({ ...universityForm, name_ja: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">国コード *</label>
                      <select
                        value={universityForm.country_code}
                        onChange={(e) => setUniversityForm({ ...universityForm, country_code: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">選択してください</option>
                        {countryCodes.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">大陸</label>
                      <select
                        value={universityForm.continent_id?.toString() || ''}
                        onChange={(e) => setUniversityForm({ ...universityForm, continent_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="input-field"
                      >
                        <option value="">選択してください</option>
                        {continents.map(continent => (
                          <option key={continent.id} value={continent.id.toString()}>{continent.name_ja}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">都市</label>
                    <input
                      type="text"
                      value={universityForm.city}
                      onChange={(e) => setUniversityForm({ ...universityForm, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">緯度</label>
                      <input
                        type="number"
                        step="any"
                        value={universityForm.latitude}
                        onChange={(e) => setUniversityForm({ ...universityForm, latitude: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">経度</label>
                      <input
                        type="number"
                        step="any"
                        value={universityForm.longitude}
                        onChange={(e) => setUniversityForm({ ...universityForm, longitude: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">公式サイトURL</label>
                    <input
                      type="url"
                      value={universityForm.website}
                      onChange={(e) => setUniversityForm({ ...universityForm, website: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* エイリアス管理（編集時のみ） */}
                {isEditingUniversity && selectedUniversity && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">表記ゆれ・略称</h3>
                    <div className="space-y-2 mb-4">
                      {selectedUniversityAliases.map((alias) => (
                        <div key={alias.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{alias.alias}</span>
                            <span className="ml-2 text-xs text-gray-500">({alias.alias_type})</span>
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm(`「${alias.alias}」を削除しますか？`)) {
                                const { error } = await deleteAlias(alias.id)
                                if (error) {
                                  alert(`エラー: ${error.message || error}`)
                                } else {
                                  const { data: aliases } = await getUniversityAliases(selectedUniversity.id)
                                  setSelectedUniversityAliases(aliases || [])
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <Trash className="h-4 w-4 inline" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newAlias.alias}
                        onChange={(e) => setNewAlias({ ...newAlias, alias: e.target.value })}
                        placeholder="エイリアスを入力"
                        className="input-field flex-1"
                      />
                      <select
                        value={newAlias.alias_type}
                        onChange={(e) => setNewAlias({ ...newAlias, alias_type: e.target.value as any })}
                        className="input-field"
                      >
                        <option value="abbreviation">略称</option>
                        <option value="variant">表記ゆれ</option>
                        <option value="old_name">旧名称</option>
                        <option value="other">その他</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (!newAlias.alias.trim()) {
                            alert('エイリアスを入力してください')
                            return
                          }
                          const { error } = await createAlias({
                            university_id: selectedUniversity.id,
                            alias: newAlias.alias.trim(),
                            alias_type: newAlias.alias_type,
                          })
                          if (error) {
                            alert(`エラー: ${error.message || error}`)
                          } else {
                            setNewAlias({ alias: '', alias_type: 'other' })
                            const { data: aliases } = await getUniversityAliases(selectedUniversity.id)
                            setSelectedUniversityAliases(aliases || [])
                          }
                        }}
                        className="btn-primary"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={async () => {
                      if (!universityForm.name_en || !universityForm.country_code) {
                        alert('英語名と国コードは必須です')
                        return
                      }
                      const universityData: any = {
                        name_en: universityForm.name_en,
                        name_ja: universityForm.name_ja || null,
                        country_code: universityForm.country_code,
                        continent_id: universityForm.continent_id,
                        city: universityForm.city || null,
                        latitude: universityForm.latitude ? parseFloat(universityForm.latitude) : null,
                        longitude: universityForm.longitude ? parseFloat(universityForm.longitude) : null,
                        website: universityForm.website || null,
                        tags: universityForm.tags,
                      }
                      
                      if (isAddingUniversity) {
                        const { data, error } = await createUniversity(universityData)
                        if (error) {
                          alert(`エラー: ${error.message || error}`)
                        } else {
                          alert('大学を追加しました')
                          setIsAddingUniversity(false)
                          loadData()
                        }
                      } else if (selectedUniversity) {
                        const { data, error } = await updateUniversity(selectedUniversity.id, universityData)
                        if (error) {
                          alert(`エラー: ${error.message || error}`)
                        } else {
                          alert('大学を更新しました')
                          setIsEditingUniversity(false)
                          setSelectedUniversity(null)
                          loadData()
                        }
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    {isAddingUniversity ? '追加' : '更新'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUniversity(false)
                      setIsAddingUniversity(false)
                      setSelectedUniversity(null)
                      setSelectedUniversityAliases([])
                      setNewAlias({ alias: '', alias_type: 'other' })
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* お知らせ管理 */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* お知らせセクション */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">全員向けお知らせ</h2>
                <button
                  onClick={() => {
                    setShowAnnouncementForm(true)
                    setEditingAnnouncement(null)
                    setAnnouncementForm({ title: '', content: '' })
                  }}
                  className="btn-primary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  お知らせを作成
                </button>
              </div>

              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    お知らせはありません
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                          <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{announcement.content}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(announcement.created_at).toLocaleString('ja-JP')}
                            {announcement.creator && ` by ${announcement.creator.name}`}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingAnnouncement(announcement)
                              setAnnouncementForm({
                                title: announcement.title,
                                content: announcement.content
                              })
                              setShowAnnouncementForm(true)
                            }}
                            className="btn-secondary text-sm"
                          >
                            <Edit className="h-4 w-4 inline mr-1" />
                            編集
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('このお知らせを削除しますか？')) {
                                const { error } = await deleteGlobalAnnouncement(announcement.id)
                                if (error) {
                                  alert(`エラー: ${error}`)
                                } else {
                                  alert('お知らせを削除しました')
                                  loadData()
                                }
                              }
                            }}
                            className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4 inline mr-1" />
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 全員向けクエストセクション */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">全員向けクエスト</h2>
                <button
                  onClick={() => {
                    setShowQuestForm(true)
                    setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' })
                  }}
                  className="btn-primary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  クエストを作成
                </button>
              </div>

              <div className="space-y-4">
                {globalQuests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    クエストはありません
                  </div>
                ) : (
                  globalQuests.map((quest) => (
                    <div key={quest.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quest.status === 'active' ? 'bg-green-100 text-green-800' :
                              quest.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {quest.status === 'active' ? '進行中' :
                               quest.status === 'completed' ? '完了' : 'キャンセル'}
                            </span>
                          </div>
                          {quest.description && (
                            <div className="text-sm text-gray-600 mb-2">{quest.description}</div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>報酬: {quest.reward_amount}ポイント</span>
                            {quest.deadline && (
                              <span>締切: {new Date(quest.deadline).toLocaleString('ja-JP')}</span>
                            )}
                            <span>作成日: {new Date(quest.created_at).toLocaleString('ja-JP')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* お知らせ作成・編集モーダル */}
        {showAnnouncementForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {editingAnnouncement ? 'お知らせを編集' : 'お知らせを作成'}
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容（Markdown形式） *</label>
                    <textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      rows={15}
                      className="input-field font-mono text-sm"
                      placeholder="# 見出し1&#10;## 見出し2&#10;&#10;**太字**&#10;&#10;*斜体*&#10;&#10;- リスト項目1&#10;- リスト項目2&#10;&#10;[リンクテキスト](URL)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Markdown形式で記入できます。見出し、太字、リスト、リンクなどが使用可能です。
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={async () => {
                      if (!announcementForm.title || !announcementForm.content) {
                        alert('タイトルと内容を入力してください')
                        return
                      }
                      if (!user) {
                        alert('ユーザー情報が取得できません')
                        return
                      }

                      if (editingAnnouncement) {
                        const { error } = await updateGlobalAnnouncement(
                          editingAnnouncement.id,
                          announcementForm.title,
                          announcementForm.content
                        )
                        if (error) {
                          alert(`エラー: ${error}`)
                        } else {
                          alert('お知らせを更新しました')
                          setShowAnnouncementForm(false)
                          setEditingAnnouncement(null)
                          setAnnouncementForm({ title: '', content: '' })
                          loadData()
                        }
                      } else {
                        const { error } = await createGlobalAnnouncement(
                          announcementForm.title,
                          announcementForm.content,
                          user.id
                        )
                        if (error) {
                          alert(`エラー: ${error}`)
                        } else {
                          alert('お知らせを作成しました。全ユーザーに通知が送信されます。')
                          setShowAnnouncementForm(false)
                          setAnnouncementForm({ title: '', content: '' })
                          loadData()
                        }
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    {editingAnnouncement ? '更新' : '作成'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false)
                      setEditingAnnouncement(null)
                      setAnnouncementForm({ title: '', content: '' })
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* クエスト作成モーダル */}
        {showQuestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">全員向けクエストを作成</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
                    <input
                      type="text"
                      value={questForm.title}
                      onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                    <textarea
                      value={questForm.description}
                      onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
                      rows={5}
                      className="input-field"
                      placeholder="クエストの説明を入力してください"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">報酬（ポイント） *</label>
                      <input
                        type="number"
                        value={questForm.reward_amount}
                        onChange={(e) => setQuestForm({ ...questForm, reward_amount: parseInt(e.target.value) || 0 })}
                        className="input-field"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">締切日時</label>
                      <input
                        type="datetime-local"
                        value={questForm.deadline}
                        onChange={(e) => setQuestForm({ ...questForm, deadline: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={async () => {
                      if (!questForm.title || questForm.reward_amount < 0) {
                        alert('タイトルと報酬を正しく入力してください')
                        return
                      }
                      if (!user) {
                        alert('ユーザー情報が取得できません')
                        return
                      }

                      // deadlineをISO形式に変換（datetime-local形式から）
                      let deadlineISO: string | null = null
                      if (questForm.deadline) {
                        deadlineISO = new Date(questForm.deadline).toISOString()
                      }

                      const result = await createGlobalQuest(
                        questForm.title,
                        questForm.description,
                        questForm.reward_amount,
                        deadlineISO,
                        user.id
                      )
                      if (result.error) {
                        alert(`エラー: ${result.error}`)
                        console.error('Quest creation error:', result.error)
                      } else {
                        alert('クエストを作成しました。全ユーザーに通知が送信されます。')
                        setShowQuestForm(false)
                        setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' })
                        loadData()
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    作成
                  </button>
                  <button
                    onClick={() => {
                      setShowQuestForm(false)
                      setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' })
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

