'use client'

import { Search } from 'lucide-react'
import type { User } from '@/lib/supabase'
import { updateVerificationStatus } from '@/lib/admin'
import StatusBadge from '../shared/StatusBadge'

interface UserFilters {
  accountType: string
  verificationStatus: string
  isActive: string
  search: string
}

interface UsersTabProps {
  users: User[]
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onSearch: () => void
  currentUserId: string | undefined
  onReload: () => void
}

export default function UsersTab({ users, filters, onFiltersChange, onSearch, currentUserId, onReload }: UsersTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">アカウントタイプ</label>
            <select
              value={filters.accountType}
              onChange={(e) => onFiltersChange({ ...filters, accountType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">すべて</option>
              <option value="individual">個人</option>
              <option value="educational">教育機関</option>
              <option value="company">企業</option>
              <option value="government">政府機関</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">認証ステータス</label>
            <select
              value={filters.verificationStatus}
              onChange={(e) => onFiltersChange({ ...filters, verificationStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">すべて</option>
              <option value="unverified">未認証</option>
              <option value="pending">審査中</option>
              <option value="verified">認証済み</option>
              <option value="rejected">拒否</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">アカウント状態</label>
            <select
              value={filters.isActive}
              onChange={(e) => onFiltersChange({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">すべて</option>
              <option value="true">有効</option>
              <option value="false">停止中</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">検索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="名前・メール・組織名"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={onSearch}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
            >
              検索
            </button>
          </div>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-3">
        {users.map((targetUser) => (
          <div key={targetUser.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-900">{targetUser.name}</h3>
                  {!targetUser.is_active && <StatusBadge status="rejected" label="停止中" />}
                  {targetUser.is_admin && <StatusBadge status="verified" label="管理者" />}
                </div>
                <div className="space-y-0.5 text-sm text-gray-600">
                  <p>{targetUser.email}</p>
                  {targetUser.organization_name && (
                    <p className="text-gray-500">{targetUser.organization_name}</p>
                  )}
                  <p className="text-xs text-gray-400">{new Date(targetUser.created_at).toLocaleDateString('ja-JP')} 登録</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <a
                  href={`/profile/${targetUser.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  target="_blank"
                >
                  プロフィール
                </a>
                {targetUser.account_type !== 'individual' && (
                  <select
                    value={targetUser.verification_status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as 'pending' | 'verified' | 'rejected'
                      if (confirm(`認証状態を「${newStatus === 'verified' ? '認証済み' : newStatus === 'rejected' ? '拒否' : '審査中'}」に変更しますか？`)) {
                        if (!currentUserId) {
                          alert('管理者情報が取得できません')
                          return
                        }
                        const result = await updateVerificationStatus(targetUser.id, newStatus, currentUserId, '')
                        if (result.success) {
                          alert('認証状態を更新しました')
                          onReload()
                        } else {
                          alert(`エラー: ${result.error}`)
                        }
                      } else {
                        e.target.value = targetUser.verification_status
                      }
                    }}
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">審査中</option>
                    <option value="verified">認証済み</option>
                    <option value="rejected">拒否</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
