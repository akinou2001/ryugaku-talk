'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Map, Users, ShieldCheck } from 'lucide-react'
import { useAuth } from './Providers'

export function BottomTabNavigation() {
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.path)
          
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 flex-shrink-0 ${active ? 'text-primary-600' : ''}`} />
              <span className={`text-xs hidden sm:inline ${active ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

