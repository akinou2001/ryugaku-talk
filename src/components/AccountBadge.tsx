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
    switch (accountType) {
      case 'educational': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'company': return 'bg-green-100 text-green-800 border-green-300'
      case 'government': return 'bg-purple-100 text-purple-800 border-purple-300'
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

