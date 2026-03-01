'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { isAdmin, getVerificationRequests, approveVerificationRequest, rejectVerificationRequest, getUsers, getAdminStats, getReports, getGlobalAnnouncements, getGlobalQuests } from '@/lib/admin'
import type { User, OrganizationVerificationRequest, Report, GlobalAnnouncement, Quest } from '@/lib/supabase'

import AdminSidebar, { type AdminTab } from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsTab from '@/components/admin/tabs/StatsTab'
import VerificationsTab from '@/components/admin/tabs/VerificationsTab'
import UsersTab from '@/components/admin/tabs/UsersTab'
import ReportsTab from '@/components/admin/tabs/ReportsTab'
import UniversitiesTab from '@/components/admin/tabs/UniversitiesTab'
import AnnouncementsTab from '@/components/admin/tabs/AnnouncementsTab'

const tabTitles: Record<AdminTab, string> = {
  stats: '統計情報',
  verifications: '認証申請',
  users: 'ユーザー管理',
  reports: '通報管理',
  universities: '大学管理',
  announcements: 'お知らせ管理',
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminStatus, setAdminStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')

  // Stats
  const [stats, setStats] = useState<any>(null)

  // Verifications
  const [verificationRequests, setVerificationRequests] = useState<OrganizationVerificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<OrganizationVerificationRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  // Users
  const [users, setUsers] = useState<User[]>([])
  const [userFilters, setUserFilters] = useState({
    accountType: 'all',
    verificationStatus: 'all',
    isActive: 'all',
    search: ''
  })

  // Reports
  const [reports, setReports] = useState<Report[]>([])
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [processingReport, setProcessingReport] = useState(false)

  // Announcements
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([])
  const [globalQuests, setGlobalQuests] = useState<Quest[]>([])

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess()
    }
  }, [user, authLoading])

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
        if (data) setStats(data)
      } else if (activeTab === 'verifications') {
        const { data, error } = await getVerificationRequests('pending')
        if (error) {
          console.error('Error loading verification requests:', error)
          alert(`認証申請の取得に失敗しました: ${error.message || error}`)
        }
        setVerificationRequests(data || [])
      } else if (activeTab === 'users') {
        const filters: any = {}
        if (userFilters.accountType !== 'all') filters.accountType = userFilters.accountType
        if (userFilters.verificationStatus !== 'all') filters.verificationStatus = userFilters.verificationStatus
        if (userFilters.isActive !== 'all') filters.isActive = userFilters.isActive === 'true'
        if (userFilters.search) filters.search = userFilters.search

        const { data, error } = await getUsers(filters)
        if (error) {
          console.error('Error loading users:', error)
          alert(`ユーザー情報の取得に失敗しました: ${error.message || error}`)
        }
        setUsers(data || [])
      } else if (activeTab === 'reports') {
        const status = reportStatusFilter === 'all' ? undefined : reportStatusFilter
        const { data, error } = await getReports(status)
        if (error) {
          console.error('Error loading reports:', error)
          alert(`通報の取得に失敗しました: ${error.message || error}`)
        }
        setReports(data || [])
      } else if (activeTab === 'announcements') {
        const [announcementsRes, questsRes] = await Promise.all([
          getGlobalAnnouncements(),
          getGlobalQuests(),
        ])
        if (announcementsRes.error) console.error('Error loading announcements:', announcementsRes.error)
        if (questsRes.error) console.error('Error loading quests:', questsRes.error)
        setAnnouncements(announcementsRes.data || [])
        setGlobalQuests(questsRes.data || [])
      }
      // universities tab manages its own data loading
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

  const handleReportFilterChange = (f: 'all' | 'pending' | 'reviewed' | 'resolved') => {
    setReportStatusFilter(f)
    setTimeout(() => loadData(), 100)
  }

  // Sidebar badges
  const badges: Partial<Record<AdminTab, number>> = {}
  if (verificationRequests.length > 0) badges.verifications = verificationRequests.length
  const pendingReports = reports.filter(r => r.status === 'pending').length
  if (pendingReports > 0) badges.reports = pendingReports

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-4 w-full max-w-md px-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!adminStatus) {
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} badges={badges} />

      <main className="flex-1 min-w-0 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdminHeader title={tabTitles[activeTab]} />

          {activeTab === 'stats' && (
            <StatsTab stats={stats} />
          )}

          {activeTab === 'verifications' && (
            <VerificationsTab
              requests={verificationRequests}
              selectedRequest={selectedRequest}
              onSelectRequest={setSelectedRequest}
              reviewNotes={reviewNotes}
              onReviewNotesChange={setReviewNotes}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              filters={userFilters}
              onFiltersChange={setUserFilters}
              onSearch={loadData}
              currentUserId={user?.id}
              onReload={loadData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              reports={reports}
              reportStatusFilter={reportStatusFilter}
              onFilterChange={handleReportFilterChange}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              processingReport={processingReport}
              setProcessingReport={setProcessingReport}
              currentUserId={user?.id}
              onReload={loadData}
            />
          )}

          {activeTab === 'universities' && (
            <UniversitiesTab onReload={loadData} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsTab
              announcements={announcements}
              globalQuests={globalQuests}
              currentUserId={user?.id}
              onReload={loadData}
            />
          )}
        </div>
      </main>
    </div>
  )
}
