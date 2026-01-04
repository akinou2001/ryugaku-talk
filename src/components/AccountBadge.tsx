'use client'

import { GraduationCap, Briefcase, Shield, CheckCircle } from 'lucide-react'
import type { AccountType, VerificationStatus } from '@/lib/supabase'

interface AccountBadgeProps {
  accountType: AccountType
  verificationStatus: VerificationStatus
  organizationName?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AccountBadge({ 
  accountType, 
  verificationStatus, 
  organizationName,
  size = 'md' 
}: AccountBadgeProps) {
  const isVerified = verificationStatus === 'verified'
  const isOrganization = accountType !== 'individual'

  if (!isOrganization) return null

  const getAccountTypeLabel = () => {
    switch (accountType) {
      case 'educational': return '教育機関'
      case 'company': return '企業'
      case 'government': return '政府機関'
      default: return ''
    }
  }

  const getAccountTypeIcon = () => {
    switch (accountType) {
      case 'educational': return <GraduationCap className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      case 'company': return <Briefcase className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      case 'government': return <Shield className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      default: return null
    }
  }

  const getAccountTypeColor = () => {
    // 組織アカウントは重厚感のある金色基調に変更
    // メインカラー: #B39855, グラデーション背景: #FFF9E6
    // 背景はグラデーション色（メインカラー系統の白色）を使用
    const bgColor = 'bg-[#FFF9E6]'
    const textColor = 'text-[#B39855]'
    const borderColor = 'border-[#B39855]'
    
    switch (accountType) {
      case 'educational': return `${bgColor} ${textColor} ${borderColor}`
      case 'company': return `${bgColor} ${textColor} ${borderColor}`
      case 'government': return `${bgColor} ${textColor} ${borderColor}`
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${sizeClasses[size]} rounded-full border ${getAccountTypeColor()}`}>
      {getAccountTypeIcon()}
      <span className="font-medium">{getAccountTypeLabel()}</span>
      {isVerified && (
        <CheckCircle className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      )}
      {organizationName && size !== 'sm' && (
        <span className="ml-1 opacity-75">({organizationName})</span>
      )}
    </div>
  )
}

