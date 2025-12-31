'use client'

import { User as UserIcon } from 'lucide-react'
import { useState } from 'react'

interface UserAvatarProps {
  iconUrl?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 40,
  xl: 50
}

export function UserAvatar({ iconUrl, name, size = 'md', className = '' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  if (iconUrl && !imageError) {
    return (
      <img
        src={iconUrl}
        alt={name ? `${name}のアイコン` : 'ユーザーアイコン'}
        className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 ${className}`}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <div className={`${sizeClass} bg-primary-100 rounded-full flex items-center justify-center ${className}`}>
      <UserIcon className="text-primary-600" style={{ width: iconSize, height: iconSize }} />
    </div>
  )
}
