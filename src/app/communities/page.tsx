'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { searchCommunities, requestCommunityMembership } from '@/lib/community'
import type { Community } from '@/lib/supabase'
import { Search, Plus, Users, Lock, Globe, Building2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { AccountBadge } from '@/components/AccountBadge'

export default function CommunitiesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [communityTypeFilter, setCommunityTypeFilter] = useState<'all' | 'guild' | 'official'>('all')

  useEffect(() => {
    fetchCommunities()
  }, [communityTypeFilter])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      const data = await searchCommunities(
        searchTerm || undefined,
        communityTypeFilter !== 'all' ? communityTypeFilter : undefined
      )
      
      // 運営中、参加中、その他の順にソート
      const sortedData = [...(data as Community[])].sort((a, b) => {
        const aIsOwner = user && a.owner_id === user.id
        const bIsOwner = user && b.owner_id === user.id
        
        // 運営中のコミュニティを最優先
        if (aIsOwner && !bIsOwner) return -1
        if (!aIsOwner && bIsOwner) return 1
        
        // 次に参加しているコミュニティ
        if (a.is_member && !b.is_member && !aIsOwner && !bIsOwner) return -1
        if (!a.is_member && b.is_member && !aIsOwner && !bIsOwner) return 1
        
        // どちらも同じ状態の場合は作成日時でソート
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      setCommunities(sortedData)
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCommunities()
  }

  const handleJoinRequest = async (communityId: string) => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    try {
      await requestCommunityMembership(communityId)
      alert('加入申請を送信しました。承認をお待ちください。')
      fetchCommunities()
    } catch (error: any) {
      alert(error.message || '加入申請に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP')
  }

  // スケルトンローディング
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-t-2xl"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Building2 className="h-10 w-10 text-primary-600" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                コミュニティ
              </h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">コミュニティを見つけて参加しましょう</p>
          </div>
          <div className="flex items-center gap-2">
            {user && user.account_type !== 'individual' && user.verification_status === 'verified' && (
              <Link href="/communities/new" className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center whitespace-nowrap text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">コミュニティを作成</span>
                <span className="sm:hidden">作成</span>
              </Link>
            )}
            {user && user.account_type !== 'individual' && user.verification_status === 'pending' && (
              <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 rounded-xl font-semibold flex items-center border border-yellow-200 text-xs sm:text-sm whitespace-nowrap">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">認証審査中</span>
                <span className="sm:hidden">審査中</span>
              </div>
            )}
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="コミュニティ名、説明、またはIDで検索..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <select
                value={communityTypeFilter}
                onChange={(e) => {
                  setCommunityTypeFilter(e.target.value as 'all' | 'guild' | 'official')
                }}
                className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all md:w-48"
              >
                <option value="all">すべての種別</option>
                <option value="guild">サークル</option>
                <option value="official">公式コミュニティ</option>
              </select>
              <button type="submit" className="px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap">
                検索
              </button>
            </div>
            {user && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-2 border-t border-gray-200">
                <span className="text-xs sm:text-sm text-gray-600">
                  {user.account_type === 'individual' 
                    ? <span className="hidden sm:inline">個人アカウント: サークルを作成できます</span>
                    : user.verification_status === 'verified'
                    ? <span className="hidden sm:inline">組織アカウント: 公式コミュニティを作成できます</span>
                    : <span className="hidden sm:inline">組織アカウント: 認証後に公式コミュニティを作成できます</span>}
                </span>
                {user.account_type === 'individual' && (
                  <Link href="/communities/new" className="btn-secondary text-sm flex items-center justify-center sm:justify-start whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">サークルを作成</span>
                    <span className="sm:hidden">サークル作成</span>
                  </Link>
                )}
              </div>
            )}
          </form>
        </div>

        {/* コミュニティ一覧 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 text-center py-16">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2 text-lg font-medium">コミュニティが見つかりませんでした</p>
            <p className="text-sm text-gray-400">検索条件を変更して再度お試しください</p>
          </div>
        ) : (
          <>
            {/* 運営中のコミュニティ */}
            {user && communities.filter(c => c.owner_id === user.id).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-primary-600" />
                  運営中のコミュニティ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communities.filter(c => c.owner_id === user.id).map((community) => (
                    <CommunityCard 
                      key={community.id} 
                      community={community} 
                      user={user}
                      onJoinRequest={handleJoinRequest}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 参加しているコミュニティ */}
            {communities.filter(c => c.is_member && (!user || c.owner_id !== user.id)).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
                  参加中のコミュニティ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communities.filter(c => c.is_member && (!user || c.owner_id !== user.id)).map((community) => (
                    <CommunityCard 
                      key={community.id} 
                      community={community} 
                      user={user}
                      onJoinRequest={handleJoinRequest}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 参加していないコミュニティ */}
            {communities.filter(c => !c.is_member).length > 0 && (
              <div>
                {(user && communities.filter(c => c.owner_id === user.id).length > 0) || 
                 communities.filter(c => c.is_member && (!user || c.owner_id !== user.id)).length > 0 ? (
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    その他のコミュニティ
                  </h2>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communities.filter(c => !c.is_member).map((community) => (
                    <CommunityCard 
                      key={community.id} 
                      community={community} 
                      user={user}
                      onJoinRequest={handleJoinRequest}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// コミュニティカードコンポーネント
function CommunityCard({ 
  community, 
  user, 
  onJoinRequest 
}: { 
  community: Community
  user: any
  onJoinRequest: (communityId: string) => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP')
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      {/* カバー画像 */}
      {community.cover_image_url ? (
        <img
          src={community.cover_image_url}
          alt={community.name}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
          <Building2 className="h-12 w-12 text-white opacity-50" />
        </div>
      )}

      <div className="p-5">
        {/* コミュニティ名とアイコン */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {community.icon_url ? (
              <img
                src={community.icon_url}
                alt={community.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-primary-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{community.name}</h3>
              {community.owner && (
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">運営:</span>
                  <span className="text-xs font-medium text-gray-700">
                    {community.owner.organization_name || community.owner.name}
                  </span>
                  {community.owner.verification_status === 'verified' && (
                    <CheckCircle className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {community.visibility === 'private' ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : (
              <Globe className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* 説明 */}
        {community.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {community.description}
          </p>
        )}

        {/* メタ情報 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{community.member_count || 0}名</span>
          </div>
          <span>{formatDate(community.created_at)}</span>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2 pt-2">
          <Link
            href={`/communities/${community.id}`}
            className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            詳細を見る
          </Link>
          {user && !community.is_member && (
            <button
              onClick={() => onJoinRequest(community.id)}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={community.member_status === 'pending'}
            >
              {community.member_status === 'pending' ? '申請中' : '加入申請'}
            </button>
          )}
          {user && community.is_member && (
            <Link
              href={`/communities/${community.id}`}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              参加中
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}


