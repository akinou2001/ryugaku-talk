'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './Providers'
import { Menu, X, User, LogOut, Settings, MessageCircle, Shield, Users, Building2 } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { TopTabNavigation } from './TopTabNavigation'
import { UserAvatar } from './UserAvatar'

export function Header() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    } else {
      setIsAdminUser(false)
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return
    const admin = await isAdmin(user.id)
    setIsAdminUser(admin)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
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
            <Link href="/timeline" className="text-gray-700 hover:text-primary-600 transition-colors">
              タイムライン
            </Link>
            <Link href="/map" className="text-gray-700 hover:text-primary-600 transition-colors">
              眺める
            </Link>
            {user && (
              <Link href="/communities" className="text-gray-700 hover:text-primary-600 transition-colors">
                コミュニティ
              </Link>
            )}
          </nav>

          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation()
                      if (user.icon_url) {
                        setIsAvatarModalOpen(true)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <UserAvatar 
                      iconUrl={user.icon_url} 
                      name={user.name} 
                      size="sm"
                    />
                  </div>
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
                    {user.account_type !== 'individual' && (
                      <>
                        <Link
                          href="/communities"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          コミュニティ
                        </Link>
                        {(user.verification_status === 'unverified' || user.verification_status === 'pending' || user.verification_status === 'rejected') && (
                          <Link
                            href="/verification/request"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            {user.verification_status === 'pending' ? '認証申請を確認' : '認証申請をする'}
                          </Link>
                        )}
                      </>
                    )}
                    {isAdminUser && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        管理者ダッシュボード
                      </Link>
                    )}
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
              <Link href="/timeline" className="text-gray-700 hover:text-primary-600 transition-colors">
                タイムライン
              </Link>
              <Link href="/map" className="text-gray-700 hover:text-primary-600 transition-colors">
                眺める
              </Link>
              {user && (
                <Link href="/communities" className="text-gray-700 hover:text-primary-600 transition-colors">
                  コミュニティ
                </Link>
              )}
              {user && user.account_type !== 'individual' && (user.verification_status === 'unverified' || user.verification_status === 'pending' || user.verification_status === 'rejected') && (
                <Link href="/verification/request" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {user.verification_status === 'pending' ? '認証申請を確認' : '認証申請'}
                </Link>
              )}
              
              {user ? (
                <div className="border-t border-gray-200 pt-4">
                  <Link href={`/profile/${user.id}`} className="block text-gray-700 hover:text-primary-600 transition-colors mb-2">
                    プロフィール
                  </Link>
                  {user.account_type !== 'individual' && (
                    <>
                      {user.verification_status === 'pending' && (
                        <div className="text-xs text-yellow-600 mb-2">
                          <Building2 className="h-4 w-4 inline mr-1" />
                          認証審査中
                        </div>
                      )}
                    </>
                  )}
                  {isAdminUser && (
                    <Link href="/admin" className="block text-gray-700 hover:text-primary-600 transition-colors mb-2">
                      管理者ダッシュボード
                    </Link>
                  )}
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
      <TopTabNavigation />
      
      {/* アバター拡大表示モーダル */}
      {isAvatarModalOpen && user?.icon_url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] p-4">
            <button
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={user.icon_url}
              alt={`${user.name}のアイコン`}
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
