'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Map, Users, ShieldCheck } from 'lucide-react'
import { useAuth } from './Providers'

export function TopTabNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const isOrganizationVerified = user && user.account_type !== 'individual' && user.verification_status === 'verified'

  const tabs = [
    {
      id: 'timeline',
      label: 'タイムライン',
      icon: Home,
      path: '/timeline'
    },
    {
      id: 'map',
      label: 'マップ',
      icon: Map,
      path: '/map'
    },
    {
      id: 'communities',
      label: 'コミュニティ',
      icon: Users,
      path: '/communities'
    },
    ...(isOrganizationVerified ? [{
      id: 'safety-check',
      label: '安否確認',
      icon: ShieldCheck,
      path: '/safety-check'
    }] : [])
  ]

  const isActive = (path: string) => {
    if (path === '/timeline') {
      return pathname === '/timeline' || pathname === '/diary'
    }
    if (path === '/map') {
      return pathname === '/map'
    }
    if (path === '/communities') {
      return pathname?.startsWith('/communities')
    }
    if (path === '/safety-check') {
      return pathname?.startsWith('/safety-check')
    }
    return pathname === path
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.path)
            
            // コミュニティタブはログインユーザーのみ表示
            if (tab.id === 'communities' && !user) {
              return null
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`flex items-center space-x-2 px-3 lg:px-6 py-3 border-b-2 transition-colors ${
                  active
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className={`font-medium hidden lg:inline ${active ? 'text-primary-600' : ''}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}


