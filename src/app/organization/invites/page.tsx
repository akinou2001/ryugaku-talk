'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { Building2, Mail, CheckCircle, XCircle, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

interface OrganizationInvite {
  id: string
  organization_id: string
  organization: {
    id: string
    name: string
    organization_name?: string
    account_type: string
    icon_url?: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  role: 'member' | 'admin'
  created_at: string
}

export default function OrganizationInvitesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<OrganizationInvite[]>([])
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    fetchInvites()
  }, [user, router])

  const fetchInvites = async () => {
    if (!user) return

    try {
      // 自分宛ての招待を取得
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:profiles!organization_members_organization_id_fkey(id, name, organization_name, account_type, icon_url)
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvites(data || [])
    } catch (error: any) {
      console.error('Error fetching invites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (inviteId: string, organizationId: string) => {
    if (!user) return

    setProcessing(inviteId)

    try {
      // 招待を承認
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
        .eq('member_id', user.id)

      if (updateError) throw updateError

      // 組織情報を取得
      const { data: orgData } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', organizationId)
        .single()

      // プロフィールのparent_organization_idとaccount_typeを更新
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          parent_organization_id: organizationId,
          account_type: orgData?.account_type || 'individual'
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      setInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'accepted' as const } : inv
      ))
    } catch (error: any) {
      console.error('Error accepting invite:', error)
      alert('招待の承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (inviteId: string) => {
    if (!user) return

    setProcessing(inviteId)

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ status: 'rejected' })
        .eq('id', inviteId)
        .eq('member_id', user.id)

      if (error) throw error

      setInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'rejected' as const } : inv
      ))
    } catch (error: any) {
      console.error('Error rejecting invite:', error)
      alert('招待の拒否に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
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

  if (!user) {
    return null
  }

  const pendingInvites = invites.filter(inv => inv.status === 'pending')
  const acceptedInvites = invites.filter(inv => inv.status === 'accepted')
  const rejectedInvites = invites.filter(inv => inv.status === 'rejected')

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
              <Mail className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">組織招待</h1>
            </div>
            <p className="text-gray-600">
              組織からの招待を確認し、承認または拒否できます。
            </p>
          </div>

          {/* 承認待ちの招待 */}
          {pendingInvites.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-yellow-600" />
                承認待ちの招待 ({pendingInvites.length})
              </h2>
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Building2 className="h-5 w-5 text-yellow-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {invite.organization?.organization_name || invite.organization?.name || '不明な組織'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {invite.organization?.account_type === 'educational' ? '教育機関' :
                               invite.organization?.account_type === 'company' ? '企業' :
                               invite.organization?.account_type === 'government' ? '政府機関' : '組織'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          この組織のメンバーとして招待されています。承認すると、組織の機能を使用できるようになります。
                        </p>
                        <p className="text-xs text-gray-500">
                          招待日: {new Date(invite.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleAccept(invite.id, invite.organization_id)}
                          disabled={processing === invite.id}
                          className="btn-primary text-sm"
                        >
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          {processing === invite.id ? '処理中...' : '承認'}
                        </button>
                        <button
                          onClick={() => handleReject(invite.id)}
                          disabled={processing === invite.id}
                          className="btn-secondary text-sm"
                        >
                          <XCircle className="h-4 w-4 inline mr-1" />
                          拒否
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 承認済みの招待 */}
          {acceptedInvites.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                参加中の組織 ({acceptedInvites.length})
              </h2>
              <div className="space-y-3">
                {acceptedInvites.map((invite) => (
                  <div key={invite.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {invite.organization?.organization_name || invite.organization?.name || '不明な組織'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          参加日: {new Date(invite.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <Link
                        href={`/profile/${invite.organization_id}`}
                        className="btn-secondary text-sm"
                      >
                        組織を見る
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 拒否済みの招待 */}
          {rejectedInvites.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-gray-400" />
                拒否した招待 ({rejectedInvites.length})
              </h2>
              <div className="space-y-3">
                {rejectedInvites.map((invite) => (
                  <div key={invite.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {invite.organization?.organization_name || invite.organization?.name || '不明な組織'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          拒否日: {new Date(invite.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 招待がない場合 */}
          {invites.length === 0 && (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">現在、組織からの招待はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


