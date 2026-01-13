'use client'

import { GraduationCap, Plane, BookOpen, Briefcase, Heart } from 'lucide-react'

interface StudentStatusBadgeProps {
  studentStatus?: 'current' | 'experienced' | 'applicant' | 'overseas_work' | 'domestic_supporter' | string
  languages?: string[]
  size?: 'sm' | 'md' | 'lg'
}

export function StudentStatusBadge({ 
  studentStatus,
  languages = [],
  size = 'md' 
}: StudentStatusBadgeProps) {
  // languages配列からstatusを取得（後方互換性のため）
  let status = studentStatus
  if (!status && languages.length > 0) {
    if (languages.some((lang: string) => lang === 'status:current')) {
      status = 'current'
    } else if (languages.some((lang: string) => lang === 'status:experienced')) {
      status = 'experienced'
    } else if (languages.some((lang: string) => lang === 'status:applicant')) {
      status = 'applicant'
    } else if (languages.some((lang: string) => lang === 'status:overseas_work')) {
      status = 'overseas_work'
    } else if (languages.some((lang: string) => lang === 'status:domestic_supporter')) {
      status = 'domestic_supporter'
    }
  }

  if (!status) return null

  const getStatusLabel = () => {
    switch (status) {
      case 'current': return '現役留学生'
      case 'experienced': return '留学経験者'
      case 'applicant': return '留学希望者'
      case 'overseas_work': return '海外ワーク'
      case 'domestic_supporter': return '国内サポーター'
      default: return ''
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'current': return <Plane className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      case 'experienced': return <GraduationCap className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      case 'applicant': return <BookOpen className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      case 'overseas_work': return <Briefcase className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      case 'domestic_supporter': return <Heart className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      default: return null
    }
  }

  const getStatusColor = () => {
    // すべて青色系に統一
    switch (status) {
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'experienced': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'applicant': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'overseas_work': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'domestic_supporter': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${sizeClasses[size]} rounded-full border ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="font-medium">{getStatusLabel()}</span>
    </div>
  )
}

