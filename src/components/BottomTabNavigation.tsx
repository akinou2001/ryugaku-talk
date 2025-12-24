'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search } from 'lucide-react'

export function BottomTabNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    {
      id: 'timeline',
      label: 'タイムライン',
      icon: Home,
      path: '/timeline'
    },
    {
      id: 'ai-search',
      label: 'AI検索',
      icon: Search,
      path: '/ai'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/timeline') {
      return pathname === '/timeline' || pathname === '/board' || pathname === '/diary'
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
              <Icon className={`h-6 w-6 mb-1 ${active ? 'text-primary-600' : ''}`} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

