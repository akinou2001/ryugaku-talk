'use client'

import { Shield } from 'lucide-react'

interface AdminHeaderProps {
  title: string
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
        <Shield className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">管理者ダッシュボード</p>
      </div>
    </div>
  )
}
