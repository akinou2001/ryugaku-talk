'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './Providers'
import { Menu, X, User, LogOut, Settings, MessageCircle, Shield, Users, Building2, Bell, ShieldCheck, Home, Eye } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { UserAvatar } from './UserAvatar'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function Header() {
  const { user, signOut } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (user) {
      checkAdminStatus()
      fetchUnreadNotificationCount()
      
      // リアルタイムで通知を監視
      const channel = supabase
        .channel('header-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id.eq.${user.id}`
          },
          () => {
            fetchUnreadNotificationCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      setIsAdminUser(false)
      setUnreadNotificationCount(0)
    }
  }, [user])

  const fetchUnreadNotificationCount = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setUnreadNotificationCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
    }
  }

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

  // メニュー外側をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isUserMenuOpen && !target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
      if (isMainMenuOpen && !target.closest('.main-menu-container')) {
        setIsMainMenuOpen(false)
      }
    }

    if (isUserMenuOpen || isMainMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen, isMainMenuOpen])

  return (
    <>
    <header className="bg-white shadow-sm relative z-[100]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <MessageCircle className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">RyugakuTalk</span>
          </Link>

          {/* ナビゲーションタブ（広い画面で表示） */}
          <nav className="hidden xl:flex items-center space-x-1 flex-1 justify-center">
            {(() => {
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
                  label: '眺める',
                  icon: Eye,
                  path: '/map'
                },
                ...(user ? [{
                  id: 'communities',
                  label: 'コミュニティ',
                  icon: Users,
                  path: '/communities'
                }] : []),
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

              return tabs.map((tab) => {
                const Icon = tab.icon
                const active = isActive(tab.path)
                
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
                    <span className={`font-medium ${active ? 'text-primary-600' : ''}`}>
                      {tab.label}
                    </span>
                  </button>
                )
              })
            })()}
          </nav>

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <>
                {/* メインメニューボタン（xl未満で表示） */}
                <div className="relative main-menu-container xl:hidden">
                  <button
                    onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                    aria-label="メニュー"
                  >
                    {isMainMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                  
                  {isMainMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[100]">
                      <button
                        onClick={() => {
                          router.push('/timeline')
                          setIsMainMenuOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        タイムライン
                      </button>
                      <button
                        onClick={() => {
                          router.push('/map')
                          setIsMainMenuOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        眺める
                      </button>
                      {user && (
                        <button
                          onClick={() => {
                            router.push('/communities')
                            setIsMainMenuOpen(false)
                          }}
                          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          コミュニティ
                        </button>
                      )}
                      {user && user.account_type !== 'individual' && user.verification_status === 'verified' && (
                        <button
                          onClick={() => {
                            router.push('/safety-check')
                            setIsMainMenuOpen(false)
                          }}
                          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          安否確認
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 通知アイコン */}
                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {/* 未読通知バッジ */}
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center min-w-[20px] px-1">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors p-1"
                  >
                    <UserAvatar 
                      iconUrl={user.icon_url} 
                      name={user.name} 
                      size="sm"
                    />
                    <span className="hidden md:inline">{user.name}</span>
                  </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[100]">
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
                    <div className="border-t border-gray-200 my-1"></div>
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
              </>
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
        </div>
      </div>
    </header>
    </>
  )
}
