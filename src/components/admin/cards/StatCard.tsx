'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  valueColor?: string
}

export default function StatCard({ label, value, icon: Icon, iconBg, iconColor, valueColor = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className={`text-2xl font-bold ${valueColor} mt-0.5`}>{value}</p>
        </div>
      </div>
    </div>
  )
}
