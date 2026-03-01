'use client'

import { BarChart3, FileCheck, Users, Flag, GraduationCap, Megaphone, X, Menu } from 'lucide-react'
import { useState } from 'react'

export type AdminTab = 'stats' | 'verifications' | 'users' | 'reports' | 'universities' | 'announcements'

interface NavItem {
  id: AdminTab
  label: string
  icon: typeof BarChart3
}

const navItems: NavItem[] = [
  { id: 'stats', label: '統計情報', icon: BarChart3 },
  { id: 'verifications', label: '認証申請', icon: FileCheck },
  { id: 'users', label: 'ユーザー管理', icon: Users },
  { id: 'reports', label: '通報管理', icon: Flag },
  { id: 'universities', label: '大学管理', icon: GraduationCap },
  { id: 'announcements', label: 'お知らせ管理', icon: Megaphone },
]

interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  badges?: Partial<Record<AdminTab, number>>
}

export default function AdminSidebar({ activeTab, onTabChange, badges = {} }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        const badge = badges[item.id]

        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
            <span className="flex-1">{item.label}</span>
            {badge != null && badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-xl shadow-md border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">メニュー</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>
    </>
  )
}
