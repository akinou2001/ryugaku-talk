'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useAuth } from './Providers'

export function AIConciergeButton() {
  const router = useRouter()
  const { user } = useAuth()

  const handleClick = () => {
    if (!user) {
      // ログインしていない場合はログイン画面に遷移
      router.push('/auth/signin')
    } else {
      // ログインしている場合はAIコンシェルジュページに遷移
      router.push('/ai/concierge')
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-[9999]">
      <button
        onClick={handleClick}
        className="h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:scale-110 w-12 lg:w-auto lg:px-4"
        title="AIコンシェルジュ"
      >
        <Sparkles className="w-6 h-6 flex-shrink-0 text-black" />
        <span className="hidden lg:inline-block ml-2 text-black font-semibold text-sm whitespace-nowrap">
          AIコンシェルジュ
        </span>
      </button>
    </div>
  )
}

