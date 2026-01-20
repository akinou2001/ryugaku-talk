'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string, 
    password: string, 
    name: string,
    accountType?: 'individual' | 'educational' | 'company' | 'government',
    organizationData?: {
      organization_name?: string
      organization_type?: string
      organization_url?: string
      contact_person_name?: string
      contact_person_email?: string
      contact_person_phone?: string
    }
  ) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Error in getSession:', error)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // プロフィールが存在するかチェック
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single()

          // エラーが発生した場合（プロフィールが存在しない場合もエラーになる）
          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileCheckError)
          }

          // プロフィールが存在しない場合は作成
          // 注意: 常にindividualとして作成（組織アカウントは認証申請後に昇格）
          if (!existingProfile && profileCheckError?.code === 'PGRST116') {
            console.log('Creating profile for user:', session.user.id)
            console.log('User email:', session.user.email)
            console.log('Auth UID:', session.user.id)
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'ユーザー',
                account_type: 'individual', // 常にindividualとして作成
                contribution_score: 0,
                languages: [],
                verification_status: 'unverified'
              })
            if (profileError) {
              console.error('Error creating profile:', profileError)
              console.error('Profile error details:', profileError)
              // プロフィールが既に存在する場合は無視（重複エラー）
              if (!profileError.message.includes('duplicate key') && 
                  !profileError.message.includes('already exists')) {
                // その他のエラーはコンソールに記録のみ（ユーザーには表示しない）
                console.error('プロフィール作成エラー（無視）:', profileError.message)
              }
            } else {
              console.log('Profile created successfully')
            }
          }

          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setLoading(false)
        return
      }

      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error('Sign in error:', error)
        // エラーメッセージをユーザーフレンドリーに変換
        let userFriendlyMessage = 'ログインに失敗しました。'
        
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid') ||
            error.message.includes('credentials')) {
          userFriendlyMessage = 'メールアドレスまたはパスワードが正しくありません。入力内容を確認してもう一度お試しください。'
        } else if (error.message.includes('Email not confirmed') || 
                   error.message.includes('email not confirmed')) {
          userFriendlyMessage = 'メールアドレスの確認が完了していません。登録時に送信された確認メールをご確認ください。'
        } else if (error.message.includes('Too many requests') || 
                   error.message.includes('too many requests')) {
          userFriendlyMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください。'
        } else if (error.message.includes('network') || 
                   error.message.includes('Network')) {
          userFriendlyMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。'
        } else if (error.message.includes('User not found')) {
          userFriendlyMessage = 'このメールアドレスで登録されているアカウントが見つかりません。新規登録ページからアカウントを作成してください。'
        }
        
        throw new Error(userFriendlyMessage)
      }
    } catch (error: any) {
      // 既にユーザーフレンドリーなメッセージに変換されている場合はそのまま使用
      if (error.message && 
          !error.message.includes('Invalid login credentials') && 
          !error.message.includes('invalid') &&
          !error.message.includes('credentials') &&
          !error.message.includes('Email not confirmed') &&
          !error.message.includes('Too many requests') &&
          !error.message.includes('network') &&
          !error.message.includes('Network')) {
        throw error
      }
      
      // その他の予期しないエラー
      if (error.message) {
        // 技術的なエラーメッセージをユーザーフレンドリーに変換
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid') ||
            error.message.includes('credentials')) {
          throw new Error('メールアドレスまたはパスワードが正しくありません。入力内容を確認してもう一度お試しください。')
        }
        throw error
      }
      
      throw new Error('ネットワークエラーが発生しました。接続を確認してください。')
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    name: string,
    accountType: 'individual' | 'educational' | 'company' | 'government' = 'individual',
    organizationData?: {
      organization_name?: string
      organization_type?: string
      organization_url?: string
      contact_person_name?: string
      contact_person_email?: string
      contact_person_phone?: string
    }
  ) => {
    try {
      // メールアドレスの正規化（前後の空白を削除、小文字に変換）
      const normalizedEmail = email.trim().toLowerCase()
      
      // メールアドレスのバリデーション
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error('有効なメールアドレスを入力してください（例: user@example.com）')
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      })
      if (error) {
        console.error('Sign up error:', error)
        // エラーメッセージをユーザーフレンドリーに変換
        let userFriendlyMessage = 'アカウント作成に失敗しました。'
        
        if (error.message.includes('invalid') || error.message.includes('Email')) {
          userFriendlyMessage = 'メールアドレスの形式が正しくありません。有効なメールアドレスを入力してください。'
        } else if (error.message.includes('User already registered') || 
                   error.message.includes('already registered') ||
                   error.message.includes('User already exists')) {
          userFriendlyMessage = 'このメールアドレスは既に登録されています。ログインページからログインしてください。'
        } else if (error.message.includes('Password') || error.message.includes('password')) {
          userFriendlyMessage = 'パスワードが要件を満たしていません。6文字以上のパスワードを入力してください。'
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          userFriendlyMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。'
        }
        
        throw new Error(userFriendlyMessage)
      }

      // ユーザーが既に存在し、メール確認済みの場合（認証メールが送信されない）
      // 注意：既存ユーザーの場合、data.userは返されるが、新しいメールは送信されない
      if (data.user) {
        // ユーザーが既にメール確認済みで、セッションがない場合、既存ユーザーの可能性が高い
        // ただし、メール確認が無効な場合でも、初回登録時はセッションが返される可能性がある
        // より確実な判定のため、ユーザーの作成日時をチェック
        const userCreatedAt = new Date(data.user.created_at)
        const now = new Date()
        const timeDiff = now.getTime() - userCreatedAt.getTime()
        const minutesDiff = timeDiff / (1000 * 60)
        
        // ユーザーが5分以内に作成された場合は新規ユーザーとして扱う
        // それ以外で、メール確認済みかつセッションがない場合は既存ユーザー
        if (minutesDiff > 5 && data.user.email_confirmed_at && !data.session) {
          throw new Error('このメールアドレスは既に登録されています。ログインページからログインしてください。')
        }
        
        // ユーザーが既に存在し、メール確認が必要な場合でも、既存ユーザーにはメールが送信されない
        // ただし、メール確認が無効な場合はこのチェックをスキップ
        // Supabaseの設定によっては、既存ユーザーでもパスワードリセットメールが送信される場合がある
      }

      // プロフィール作成（オプション：トリガーで自動作成される可能性があるため、失敗してもエラーにしない）
      if (data.user) {
        // まず、プロフィールが既に存在するか確認（トリガーで既に作成されている可能性がある）
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // プロフィールが存在しない場合のみ作成を試みる
        if (!existingProfile) {
          // 常にindividualとして作成（組織アカウントは認証申請後に昇格）
          const profileData: any = {
            id: data.user.id,
            email: normalizedEmail,
            name,
            account_type: 'individual', // 常にindividualとして作成
            contribution_score: 0,
            languages: [],
            verification_status: 'unverified',
            is_admin: false,
            is_active: true
          }

          // 組織アカウント申請の場合、組織情報を一時的に保存（認証申請時に使用）
          // 注意: account_typeはindividualのまま。認証申請後に昇格
          if (accountType !== 'individual' && organizationData) {
            profileData.organization_name = organizationData.organization_name
            profileData.organization_type = organizationData.organization_type
            profileData.organization_url = organizationData.organization_url
            profileData.contact_person_name = organizationData.contact_person_name
            profileData.contact_person_email = organizationData.contact_person_email
            profileData.contact_person_phone = organizationData.contact_person_phone
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
          
          // プロフィール作成エラーは無視（トリガーで自動作成される可能性があるため）
          if (profileError) {
            console.warn('Profile creation error (ignored, may be created by trigger):', profileError)
            // 重複エラー（既に存在する）またはRLSエラー（トリガーで作成される）の場合は無視
            const isIgnorableError = 
              profileError.message.includes('duplicate key') || 
              profileError.message.includes('already exists') ||
              profileError.message.includes('row-level security policy') || 
              profileError.message.includes('violates row-level security') ||
              profileError.code === '42501' || 
              profileError.code === 'PGRST301'
            
            // 無視できないエラーの場合のみ警告を記録（ただし、アカウント作成は成功として扱う）
            if (!isIgnorableError) {
              console.error('Unexpected profile creation error:', profileError)
            }
          } else {
            console.log('Profile created successfully')
          }
        } else {
          console.log('Profile already exists (created by trigger)')
        }

        // 組織アカウントの場合、認証申請は手動で提出する必要がある
        // ユーザーは /verification/request から申請フォームを提出する
      }
    } catch (error: any) {
      // 既にユーザーフレンドリーなメッセージに変換されている場合はそのまま使用
      if (error.message && !error.message.includes('row-level security') && 
          !error.message.includes('violates row-level security') &&
          !error.message.includes('duplicate key') &&
          !error.message.includes('already exists') &&
          !error.message.includes('invalid') &&
          !error.message.includes('Email')) {
        throw error
      }
      
      // その他の予期しないエラー
      if (error.message) {
        // 技術的なエラーメッセージをユーザーフレンドリーに変換
        if (error.message.includes('row-level security') || 
            error.message.includes('violates row-level security')) {
          throw new Error('アカウントの作成に失敗しました。システムの設定に問題がある可能性があります。しばらく時間をおいて再度お試しください。問題が続く場合は、お問い合わせください。')
        }
        throw error
      }
      
      throw new Error('ネットワークエラーが発生しました。接続を確認してください。')
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // ログアウト後、ランディングページ（ホームページ）にリダイレクト
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const signInWithGoogle = async () => {
    try {
      // アプリのURLを取得（優先順位: window.location.origin > 環境変数 > localhost）
      // window.location.originを使用することで、現在のドメイン（本番環境ではryugakutalk.com）を自動的に使用
      let appUrl = 'http://localhost:3000' // デフォルト値（サーバーサイド用）
      
      if (typeof window !== 'undefined') {
        // クライアントサイドでは、現在のドメインを使用（最も確実）
        appUrl = window.location.origin
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        // サーバーサイドでは環境変数を使用
        appUrl = process.env.NEXT_PUBLIC_APP_URL
      }
      
      // デバッグ用（本番環境では削除してもOK）
      if (typeof window !== 'undefined') {
        console.log('OAuth redirect URL:', `${appUrl}/auth/callback`)
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${appUrl}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) {
        console.error('Google sign in error:', error)
        // エラーメッセージをユーザーフレンドリーに変換
        let userFriendlyMessage = 'Googleログインに失敗しました。'
        
        if (error.message.includes('popup') || error.message.includes('closed')) {
          userFriendlyMessage = 'ログインウィンドウが閉じられました。もう一度お試しください。'
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          userFriendlyMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。'
        } else if (error.message.includes('cancelled') || error.message.includes('user cancelled')) {
          userFriendlyMessage = 'ログインがキャンセルされました。'
        } else if (error.message.includes('redirect_uri_mismatch') || error.message.includes('redirect')) {
          userFriendlyMessage = 'リダイレクトURLの設定に問題があります。管理者に問い合わせてください。'
        }
        
        throw new Error(userFriendlyMessage)
      }
    } catch (error: any) {
      // 既にユーザーフレンドリーなメッセージに変換されている場合はそのまま使用
      if (error.message && 
          !error.message.includes('popup') && 
          !error.message.includes('closed') &&
          !error.message.includes('network') &&
          !error.message.includes('Network') &&
          !error.message.includes('cancelled')) {
        throw error
      }
      
      // その他の予期しないエラー
      if (error.message) {
        throw error
      }
      
      throw new Error('Googleログインに失敗しました。しばらく時間をおいて再度お試しください。')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a Providers')
  }
  return context
}
