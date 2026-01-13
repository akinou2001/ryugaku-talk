'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLからcodeとerrorパラメータを取得
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          console.error('OAuth error:', error, errorDescription)
          router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        if (code) {
          // OAuthコードをセッションに交換
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Exchange error:', exchangeError)
            router.push(`/auth/signin?error=${encodeURIComponent('認証に失敗しました')}`)
            return
          }

          if (data?.session) {
            // 認証成功 - タイムラインにリダイレクト
            router.push('/timeline')
          } else {
            // セッションが取得できない場合、少し待ってから再試行
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession()
              if (session) {
                router.push('/timeline')
              } else {
                router.push('/auth/signin?error=' + encodeURIComponent('認証に失敗しました。もう一度お試しください。'))
              }
            }, 1000)
          }
        } else {
          // codeパラメータがない場合、既存のセッションを確認
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            router.push('/timeline')
          } else {
            router.push('/auth/signin?error=' + encodeURIComponent('認証パラメータが不正です'))
          }
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/auth/signin?error=' + encodeURIComponent('認証処理中にエラーが発生しました'))
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
}




