'use client'

import dynamic from 'next/dynamic'
import { Users, Shield, AlertCircle, FileText, MessageSquare, Star } from 'lucide-react'
import StatCard from '../cards/StatCard'

const UserGrowthChart = dynamic(() => import('../charts/UserGrowthChart'), { ssr: false, loading: () => <ChartSkeleton /> })
const UserTypeDistribution = dynamic(() => import('../charts/UserTypeDistribution'), { ssr: false, loading: () => <ChartSkeleton /> })
const PostActivityChart = dynamic(() => import('../charts/PostActivityChart'), { ssr: false, loading: () => <ChartSkeleton /> })
const ReportStatusChart = dynamic(() => import('../charts/ReportStatusChart'), { ssr: false, loading: () => <ChartSkeleton /> })

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-[240px] bg-gray-100 rounded"></div>
      </div>
    </div>
  )
}

interface StatsTabProps {
  stats: any
}

export default function StatsTab({ stats }: StatsTabProps) {
  if (!stats) return null

  const orgCount = (stats.educational_users || 0) + (stats.company_users || 0) + (stats.government_users || 0)

  return (
    <div className="space-y-6">
      {/* Row 1: Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="総ユーザー数"
          value={stats.total_users || 0}
          icon={Users}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          label="組織アカウント"
          value={orgCount}
          icon={Shield}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="認証待ち"
          value={stats.pending_verifications || 0}
          icon={AlertCircle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
          valueColor="text-yellow-600"
        />
        <StatCard
          label="未対応通報"
          value={stats.pending_reports || 0}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* Row 2: User growth + type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <UserGrowthChart />
        </div>
        <div>
          <UserTypeDistribution />
        </div>
      </div>

      {/* Row 3: Post activity + report status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PostActivityChart />
        <ReportStatusChart />
      </div>

      {/* Row 4: Content stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="総投稿数"
          value={stats.total_posts || 0}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="公式投稿"
          value={stats.official_posts || 0}
          icon={Star}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="総コメント数"
          value={stats.total_comments || 0}
          icon={MessageSquare}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
      </div>
    </div>
  )
}
