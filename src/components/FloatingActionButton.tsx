'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageCircle, X, HelpCircle, BookOpen, MessageSquare, Sparkles } from 'lucide-react'

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const actions = [
    {
      id: 'ai',
      label: 'AIコンシェルジュ',
      icon: Sparkles,
      onClick: () => {
        router.push('/ai')
        setIsOpen(false)
      }
    },
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
    <div className="fixed bottom-6 right-6 z-50">
      {/* アクションボタン */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end space-y-3 mb-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex items-center space-x-2 bg-white rounded-full shadow-lg px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all fab-action-button"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>
      )}

      {/* メインボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-primary-600 hover:bg-primary-700 rotate-0'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}

