'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageCircle, X, HelpCircle, BookOpen, MessageSquare } from 'lucide-react'

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const actions = [
    {
      id: 'question',
      label: '質問する',
      icon: HelpCircle,
      onClick: () => {
        router.push('/posts/new?category=question')
        setIsOpen(false)
      }
    },
    {
      id: 'diary',
      label: '日記を書く',
      icon: BookOpen,
      onClick: () => {
        router.push('/posts/new?category=diary')
        setIsOpen(false)
      }
    },
    {
      id: 'chat',
      label: 'つぶやく',
      icon: MessageSquare,
      onClick: () => {
        router.push('/posts/new?category=chat')
        setIsOpen(false)
      }
    },
    {
      id: 'message',
      label: 'チャット',
      icon: MessageCircle,
      onClick: () => {
        router.push('/chat')
        setIsOpen(false)
      }
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* アクションボタン */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end space-y-2 mb-2 z-[9999]">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex items-center space-x-2 bg-white rounded-full shadow-lg px-3 sm:px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-opacity duration-200"
                title={action.label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* メインボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? 'bg-black hover:bg-gray-900 w-14 px-0'
            : 'bg-black hover:bg-gray-900 w-14 lg:w-auto lg:px-6'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white flex-shrink-0" />
        ) : (
          <>
            <Plus className="h-6 w-6 text-white flex-shrink-0" />
            <span className="hidden lg:inline-block ml-2 text-white font-semibold text-sm whitespace-nowrap">
              投稿する
            </span>
          </>
        )}
      </button>
    </div>
  )
}

