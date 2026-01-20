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
        // URLからcodeとerrorパラメータを取得（クエリパラメータ）
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // ハッシュフラグメント（#access_token=...）を処理
        let hashParams: { [key: string]: string } = {}
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1) // #を削除
          hash.split('&').forEach(param => {
            const [key, value] = param.split('=')
            if (key && value) {
              hashParams[key] = decodeURIComponent(value)
            }
          })
        }

        // エラーチェック（クエリパラメータまたはハッシュフラグメント）
        const hashError = hashParams.error || hashParams.error_description
        if (error || hashError) {
          console.error('OAuth error:', error || hashError, errorDescription || hashParams.error_description)
          router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || hashError || error || '認証に失敗しました')}`)
          return
        }

        // PKCEフロー: codeパラメータがある場合
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
        } 
        // 暗黙的フロー: ハッシュフラグメントにaccess_tokenがある場合
        else if (hashParams.access_token) {
          // ハッシュフラグメントからセッションを設定
          // Supabaseは自動的にハッシュフラグメントを処理するため、セッションを確認する
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            router.push(`/auth/signin?error=${encodeURIComponent('認証に失敗しました')}`)
            return
          }

          if (session) {
            // 認証成功 - タイムラインにリダイレクト
            router.push('/timeline')
          } else {
            // セッションが取得できない場合、少し待ってから再試行
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession()
              if (retrySession) {
                router.push('/timeline')
              } else {
                router.push('/auth/signin?error=' + encodeURIComponent('認証に失敗しました。もう一度お試しください。'))
              }
            }, 1000)
          }
        } 
        // どちらもない場合、既存のセッションを確認
        else {
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




