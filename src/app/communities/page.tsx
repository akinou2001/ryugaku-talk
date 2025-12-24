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
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')

  useEffect(() => {
    fetchCommunities()
  }, [visibilityFilter])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      const data = await searchCommunities(
        searchTerm || undefined,
        visibilityFilter !== 'all' ? visibilityFilter : undefined
      )
<<<<<<< HEAD
      
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
=======
      setCommunities(data as Community[])
>>>>>>> 74e6d02cb630e1ecc834664bdf7f7c83cc757fe6
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">コミュニティ</h1>
          </div>
          {user && user.account_type !== 'individual' && user.verification_status === 'verified' && (
            <Link href="/communities/new" className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              コミュニティを作成
            </Link>
          )}
          {user && user.account_type !== 'individual' && user.verification_status === 'pending' && (
            <div className="text-sm text-yellow-600 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              認証審査中
            </div>
          )}
        </div>

        {/* 検索・フィルター */}
<<<<<<< HEAD
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
=======
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col md:flex-row gap-4">
>>>>>>> 74e6d02cb630e1ecc834664bdf7f7c83cc757fe6
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
<<<<<<< HEAD
                  placeholder="コミュニティ名や説明で検索..."
=======
                  placeholder="コミュニティを検索..."
>>>>>>> 74e6d02cb630e1ecc834664bdf7f7c83cc757fe6
                  className="input-field pl-10"
                />
              </div>
              <select
                value={visibilityFilter}
<<<<<<< HEAD
                onChange={(e) => {
                  setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')
                }}
                className="input-field md:w-48"
              >
                <option value="all">すべての公開設定</option>
                <option value="public">公開のみ</option>
                <option value="private">非公開のみ</option>
              </select>
              <button type="submit" className="btn-primary whitespace-nowrap">
                検索
              </button>
            </div>
            {user && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {user.account_type === 'individual' 
                    ? '個人アカウント: ギルドを作成できます' 
                    : user.verification_status === 'verified'
                    ? '組織アカウント: 公式コミュニティを作成できます'
                    : '組織アカウント: 認証後に公式コミュニティを作成できます'}
                </span>
                {user.account_type === 'individual' && (
                  <Link href="/communities/new" className="btn-secondary text-sm flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    ギルドを作成
                  </Link>
                )}
              </div>
            )}
=======
                onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
                className="input-field"
              >
                <option value="all">すべて</option>
                <option value="public">公開</option>
                <option value="private">非公開</option>
              </select>
              <button type="submit" className="btn-primary">
                検索
              </button>
            </div>
>>>>>>> 74e6d02cb630e1ecc834664bdf7f7c83cc757fe6
          </form>
        </div>

        {/* コミュニティ一覧 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="card text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">コミュニティが見つかりませんでした</p>
            <p className="text-sm text-gray-400">検索条件を変更して再度お試しください</p>
          </div>
        ) : (
<<<<<<< HEAD
          <>
            {/* 運営中のコミュニティ */}
            {user && communities.filter(c => c.owner_id === user.id).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary-600" />
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
    <div className="card hover:shadow-lg transition-shadow">
      {/* カバー画像 */}
      {community.cover_image_url ? (
        <img
          src={community.cover_image_url}
          alt={community.name}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-lg flex items-center justify-center">
          <Building2 className="h-12 w-12 text-white opacity-50" />
        </div>
      )}

      <div className="p-4">
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
        <div className="flex space-x-2">
          <Link
            href={`/communities/${community.id}`}
            className="btn-secondary flex-1 text-center"
          >
            詳細を見る
          </Link>
          {user && !community.is_member && (
            <button
              onClick={() => onJoinRequest(community.id)}
              className="btn-primary flex-1"
              disabled={community.member_status === 'pending'}
            >
              {community.member_status === 'pending' ? '申請中' : '加入申請'}
            </button>
          )}
          {user && community.is_member && (
            <Link
              href={`/communities/${community.id}`}
              className="btn-primary flex-1 text-center"
            >
              参加中
            </Link>
          )}
        </div>
=======
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div key={community.id} className="card hover:shadow-lg transition-shadow">
                {/* カバー画像 */}
                {community.cover_image_url ? (
                  <img
                    src={community.cover_image_url}
                    alt={community.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-lg flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-white opacity-50" />
                  </div>
                )}

                <div className="p-4">
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
                  <div className="flex space-x-2">
                    <Link
                      href={`/communities/${community.id}`}
                      className="btn-secondary flex-1 text-center"
                    >
                      詳細を見る
                    </Link>
                    {user && !community.is_member && (
                      <button
                        onClick={() => handleJoinRequest(community.id)}
                        className="btn-primary flex-1"
                        disabled={community.member_status === 'pending'}
                      >
                        {community.member_status === 'pending' ? '申請中' : '加入申請'}
                      </button>
                    )}
                    {user && community.is_member && (
                      <Link
                        href={`/communities/${community.id}`}
                        className="btn-primary flex-1 text-center"
                      >
                        参加中
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
>>>>>>> 74e6d02cb630e1ecc834664bdf7f7c83cc757fe6
      </div>
    </div>
  )
}


