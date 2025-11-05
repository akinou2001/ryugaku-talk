'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './Providers'
import { Menu, X, User, LogOut, Settings, MessageCircle } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <MessageCircle className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">RyugakuTalk</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/board" className="text-gray-700 hover:text-primary-600 transition-colors">
              掲示板
            </Link>
            <Link href="/diary" className="text-gray-700 hover:text-primary-600 transition-colors">
              留学日記
            </Link>
            <Link href="/chat" className="text-gray-700 hover:text-primary-600 transition-colors">
              チャット
            </Link>
            <Link href="/posts/new" className="text-gray-700 hover:text-primary-600 transition-colors">
              投稿する
            </Link>
          </nav>

          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{user.name}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      プロフィール
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      設定
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin" className="btn-secondary">
                  ログイン
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  新規登録
                </Link>
              </div>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/board" className="text-gray-700 hover:text-primary-600 transition-colors">
                掲示板
              </Link>
              <Link href="/diary" className="text-gray-700 hover:text-primary-600 transition-colors">
                留学日記
              </Link>
              <Link href="/chat" className="text-gray-700 hover:text-primary-600 transition-colors">
                チャット
              </Link>
              <Link href="/posts/new" className="text-gray-700 hover:text-primary-600 transition-colors">
                投稿する
              </Link>
              
              {user ? (
                <div className="border-t border-gray-200 pt-4">
                  <Link href={`/profile/${user.id}`} className="block text-gray-700 hover:text-primary-600 transition-colors mb-2">
                    プロフィール
                  </Link>
                  <Link href="/settings" className="block text-gray-700 hover:text-primary-600 transition-colors mb-2">
                    設定
                  </Link>
                  <button onClick={handleSignOut} className="text-gray-700 hover:text-primary-600 transition-colors">
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 flex flex-col space-y-2">
                  <Link href="/auth/signin" className="btn-secondary text-center">
                    ログイン
                  </Link>
                  <Link href="/auth/signup" className="btn-primary text-center">
                    新規登録
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
