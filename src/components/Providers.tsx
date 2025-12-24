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
                account_type: 'individual',
                contribution_score: 0,
                languages: [],
                verification_status: 'unverified'
              })
            if (profileError) {
              console.error('Error creating profile:', profileError)
              console.error('Profile error details:', profileError)
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
        throw new Error(error.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      }
    } catch (error: any) {
      if (error.message) {
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
        // より詳細なエラーメッセージ
        if (error.message.includes('invalid') || error.message.includes('Email')) {
          throw new Error('メールアドレスの形式が正しくありません。有効なメールアドレスを入力してください。')
        }
        throw new Error(error.message || 'アカウント作成に失敗しました。')
      }

      // プロフィール作成
      if (data.user) {
        const profileData: any = {
          id: data.user.id,
          email: normalizedEmail,
          name,
          account_type: accountType,
          contribution_score: 0,
          languages: [],
          verification_status: accountType === 'individual' ? 'unverified' : 'pending',
          is_admin: false,
          is_active: true
        }

        // 組織アカウントの場合、組織情報を追加
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
        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error(profileError.message || 'プロフィールの作成に失敗しました。データベースの設定を確認してください。')
        }

        // 組織アカウントの場合、認証申請は手動で提出する必要がある
        // ユーザーは /verification/request から申請フォームを提出する
      }
    } catch (error: any) {
      if (error.message) {
        throw error
      }
      throw new Error('ネットワークエラーが発生しました。接続を確認してください。')
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
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
