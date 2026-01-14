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
      router.push('/ai')
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-[9999]">
      <button
        onClick={handleClick}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
        title="AIコンシェルジュ"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    </div>
  )
}

