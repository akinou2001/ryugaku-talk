'use client'

import { Award } from 'lucide-react'
import Link from 'next/link'

interface QuestBadgeProps {
  questId: string
  questTitle?: string
  communityId?: string
  approved?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function QuestBadge({ questId, questTitle, communityId, approved, size = 'sm' }: QuestBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const badgeContent = (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${
      approved 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
        : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
    } ${sizeClasses[size]}`}>
      <Award className={iconSizes[size]} />
      <span>{approved ? '承認済み' : 'クエスト'}</span>
    </span>
  )

  if (communityId && questId) {
    return (
      <Link 
        href={`/communities/${communityId}/quests/${questId}`}
        className="hover:opacity-80 transition-opacity"
        title={questTitle}
      >
        {badgeContent}
      </Link>
    )
  }

  // 全員向けクエスト（communityIdがない場合）
  if (questId) {
    return (
      <Link 
        href={`/quests/${questId}`}
        className="hover:opacity-80 transition-opacity"
        title={questTitle}
      >
        {badgeContent}
      </Link>
    )
  }

  return badgeContent
}

