'use client'

const statusStyles: Record<string, { dot: string; bg: string; text: string }> = {
  pending: { dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  reviewed: { dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  resolved: { dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  approved: { dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
  active: { dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  completed: { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' },
  cancelled: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
  verified: { dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  unverified: { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' },
}

const statusLabels: Record<string, string> = {
  pending: '未対応',
  reviewed: '確認済み',
  resolved: '解決済み',
  approved: '承認済み',
  rejected: '拒否',
  active: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
  verified: '認証済み',
  unverified: '未認証',
}

interface StatusBadgeProps {
  status: string
  label?: string
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] || { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' }
  const displayLabel = label || statusLabels[status] || status

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {displayLabel}
    </span>
  )
}
