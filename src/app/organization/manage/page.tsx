'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Building2, UserPlus, Mail, Users, Crown, ArrowLeft, CheckCircle, XCircle, AlertCircle, UserX, Edit2, Save, X } from 'lucide-react'
import Link from 'next/link'

interface OrganizationMember {
  id: string
  member_id: string
  member: {
    id: string
    name: string
    email: string
    icon_url?: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  role: 'member' | 'admin'
  invited_by?: string
  created_at: string
}

export default function OrganizationManagePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [isEditingOrgName, setIsEditingOrgName] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [savingOrgName, setSavingOrgName] = useState(false)

  useEffect(() => {
    // 認証状態の読み込みが完了するまで待つ
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/auth/signin')
      return
    }

    // 組織オーナーか確認
    // is_organization_ownerがundefinedの場合はfalseとして扱う
    const isOrganizationOwner = user.is_organization_owner === true
    
    // デバッグ用ログ
    console.log('Organization manage page - User check:', {
      account_type: user.account_type,
      is_organization_owner: user.is_organization_owner,
      verification_status: user.verification_status,
      isOrganizationOwner
    })
    
    if (user.account_type === 'individual' || !isOrganizationOwner || user.verification_status !== 'verified') {
      console.log('Redirecting to home - not an organization owner')
      router.push('/')
      return
    }

    fetchMembers()
    if (user?.organization_name) {
      setOrgName(user.organization_name)
    }
  }, [user, authLoading, router])

  const fetchMembers = async () => {
    if (!user) return

    try {
      // 組織メンバーを取得
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          member:profiles!organization_members_member_id_fkey(id, name, email, icon_url)
        `)
        .eq('organization_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMembers(data || [])
    } catch (error: any) {
      console.error('Error fetching members:', error)
      setError('メンバー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !inviteEmail.trim()) return

    setInviting(true)
    setError('')
    setSuccess('')

    try {
      // メールアドレスでユーザーを検索
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single()

      if (userError || !targetUser) {
        setError('このメールアドレスのユーザーが見つかりません')
        setInviting(false)
        return
      }

      // 既にメンバーか確認
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', user.id)
        .eq('member_id', targetUser.id)
        .single()

      if (existingMember) {
        setError('このユーザーは既にメンバーです')
        setInviting(false)
        return
      }

      // 自分自身を招待できない
      if (targetUser.id === user.id) {
        setError('自分自身を招待することはできません')
        setInviting(false)
        return
      }

      // 招待を作成
      const { error: inviteError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: user.id,
          member_id: targetUser.id,
          invited_by: user.id,
          status: 'pending',
          role: 'member'
        })

      if (inviteError) throw inviteError

      setSuccess(`${targetUser.name}さんへの招待を送信しました`)
      setInviteEmail('')
      fetchMembers()
    } catch (error: any) {
      console.error('Error inviting member:', error)
      setError(error.message || '招待の送信に失敗しました')
    } finally {
      setInviting(false)
    }
  }


  const handleRemoveMember = async (memberId: string) => {
    if (!user) return

    if (!confirm('このメンバーを組織から削除しますか？')) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', user.id)
        .eq('member_id', memberId)

      if (error) throw error

      // プロフィールのparent_organization_idを削除
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          parent_organization_id: null,
          account_type: 'individual' // 個人アカウントに戻す
        })
        .eq('id', memberId)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      setSuccess('メンバーを削除しました')
      fetchMembers()
    } catch (error: any) {
      console.error('Error removing member:', error)
      setError(error.message || 'メンバーの削除に失敗しました')
    }
  }

  const handleUpdateOrganizationName = async () => {
    if (!user || !orgName.trim()) return

    setSavingOrgName(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          organization_name: orgName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('組織名を更新しました')
      setIsEditingOrgName(false)
      
      // ユーザー情報を再取得
      const { data: updatedUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (updatedUser) {
        // useAuthのコンテキストを更新する必要があるが、ここでは直接更新できない
        // ページをリロードするか、親コンポーネントに通知する必要がある
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error updating organization name:', error)
      setError(error.message || '組織名の更新に失敗しました')
    } finally {
      setSavingOrgName(false)
    }
  }

  const handleTransferOwnership = async () => {
    if (!user || !transferTargetId) return

    if (!confirm('オーナー権限を譲渡しますか？この操作は取り消せません。')) return

    setTransferring(true)
    setError('')
    setSuccess('')

    try {
      // 新しいオーナーのプロフィールを取得
      const { data: newOwner, error: newOwnerError } = await supabase
        .from('profiles')
        .select('id, name, account_type')
        .eq('id', transferTargetId)
        .single()

      if (newOwnerError || !newOwner) {
        throw new Error('新しいオーナーの情報を取得できませんでした')
      }

      // 新しいオーナーが組織メンバーか確認
      const { data: memberCheck } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', user.id)
        .eq('member_id', transferTargetId)
        .eq('status', 'accepted')
        .single()

      if (!memberCheck) {
        throw new Error('このユーザーは組織のメンバーではありません')
      }

      // トランザクション的に権限を譲渡
      // 1. 新しいオーナーを設定
      const { error: newOwnerError2 } = await supabase
        .from('profiles')
        .update({
          is_organization_owner: true,
          account_type: user.account_type,
          parent_organization_id: null
        })
        .eq('id', transferTargetId)

      if (newOwnerError2) throw newOwnerError2

      // 2. 旧オーナーを一般メンバーに変更
      const { error: oldOwnerError } = await supabase
        .from('profiles')
        .update({
          is_organization_owner: false,
          parent_organization_id: transferTargetId
        })
        .eq('id', user.id)

      if (oldOwnerError) throw oldOwnerError

      // 3. 組織メンバーテーブルを更新（新しいオーナーを削除、旧オーナーを追加）
      await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', user.id)
        .eq('member_id', transferTargetId)

      await supabase
        .from('organization_members')
        .insert({
          organization_id: transferTargetId,
          member_id: user.id,
          status: 'accepted',
          role: 'member'
        })

      // 4. 既存のメンバーのorganization_idを更新
      const { error: updateMembersError } = await supabase
        .from('organization_members')
        .update({ organization_id: transferTargetId })
        .eq('organization_id', user.id)

      if (updateMembersError) {
        console.error('Error updating members:', updateMembersError)
        // エラーを無視（メンバーは後で手動で修正可能）
      }

      setSuccess('オーナー権限を譲渡しました。ページを再読み込みしてください。')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error('Error transferring ownership:', error)
      setError(error.message || 'オーナー権限の譲渡に失敗しました')
    } finally {
      setTransferring(false)
      setTransferTargetId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.account_type === 'individual' || !user.is_organization_owner || user.verification_status !== 'verified') {
    return null
  }

  const acceptedMembers = members.filter(m => m.status === 'accepted')
  const pendingInvites = members.filter(m => m.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link
              href={`/profile/${user.id}`}
              className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              プロフィールに戻る
            </Link>
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">組織管理</h1>
            </div>
            
            {/* 組織名編集 */}
            <div className="mb-4">
              {isEditingOrgName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="input-field flex-1"
                    placeholder="組織名を入力"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateOrganizationName}
                    disabled={savingOrgName || !orgName.trim()}
                    className="btn-primary flex items-center"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {savingOrgName ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingOrgName(false)
                      setOrgName(user.organization_name || '')
                    }}
                    className="btn-secondary flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600 text-lg font-medium">
                    {user.organization_name || '組織名未設定'}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingOrgName(true)
                      setOrgName(user.organization_name || '')
                    }}
                    className="text-primary-600 hover:text-primary-700 p-1"
                    title="組織名を編集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-gray-600">
              メンバーを管理し、オーナー権限を譲渡できます。
            </p>
          </div>

          {/* エラー・成功メッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* メンバー招待フォーム */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              メンバーを招待
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="inviteEmail"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="member@example.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn-primary whitespace-nowrap"
                  >
                    {inviting ? '招待中...' : '招待する'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  招待されたユーザーは、組織のメンバーとして機能を使用できます。
                </p>
              </div>
            </form>
          </div>

          {/* 承認待ちの招待 */}
          {pendingInvites.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                承認待ちの招待 ({pendingInvites.length})
              </h2>
              <div className="space-y-3">
                {pendingInvites.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">{member.member?.name || '不明'}</p>
                        <p className="text-sm text-gray-600">{member.member?.email || '不明'}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRemoveMember(member.member_id)}
                        className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 inline mr-1" />
                        キャンセル
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* オーナー権限譲渡 */}
          <div className="card mb-6 border-2 border-yellow-200 bg-yellow-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-600" />
              オーナー権限の譲渡
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              オーナー権限を他のメンバーに譲渡できます。この操作は取り消せません。
            </p>
            {acceptedMembers.length > 0 ? (
              <div className="space-y-3">
                {transferTargetId ? (
                  <div className="bg-white p-4 rounded-lg border-2 border-yellow-300">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      以下のメンバーにオーナー権限を譲渡しますか？
                    </p>
                    {acceptedMembers
                      .filter(m => m.member_id === transferTargetId)
                      .map((member) => (
                        <div key={member.id} className="mb-4">
                          <p className="font-semibold text-gray-900">{member.member?.name || '不明'}</p>
                          <p className="text-sm text-gray-600">{member.member?.email || '不明'}</p>
                        </div>
                      ))}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleTransferOwnership}
                        disabled={transferring}
                        className="btn-primary flex items-center"
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        {transferring ? '譲渡中...' : '権限を譲渡する'}
                      </button>
                      <button
                        onClick={() => setTransferTargetId(null)}
                        className="btn-secondary"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setTransferTargetId(e.target.value)
                      }
                    }}
                    className="input-field w-full"
                  >
                    <option value="">メンバーを選択してください</option>
                    {acceptedMembers.map((member) => (
                      <option key={member.id} value={member.member_id}>
                        {member.member?.name || '不明'} ({member.member?.email || '不明'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                オーナー権限を譲渡するには、まずメンバーを招待して承認してもらう必要があります。
              </p>
            )}
          </div>

          {/* メンバー一覧 */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              メンバー一覧 ({acceptedMembers.length + 1})
            </h2>
            <div className="space-y-3">
              {/* オーナー（自分） */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      {user.name}
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        オーナー
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* メンバー */}
              {acceptedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">{member.member?.name || '不明'}</p>
                      <p className="text-sm text-gray-600">{member.member?.email || '不明'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRemoveMember(member.member_id)}
                      className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 inline mr-1" />
                      削除
                    </button>
                  </div>
                </div>
              ))}

              {acceptedMembers.length === 0 && (
                <p className="text-gray-500 text-center py-8">メンバーがいません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

