'use client'

import { useMemo, useState } from 'react'
import type { Post, User } from '@/lib/supabase'
import { MapPin, HelpCircle, BookOpen, MessageCircle, ChevronDown, ChevronRight, Users, Clock, ThumbsUp, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { UserAvatar } from '@/components/UserAvatar'
import type { UserPostData, MapComponentProps } from '@/lib/mapUtils'

// 国 → 大陸のマッピング
const countryToContinent: Record<string, string> = {
  'アメリカ': '北米',
  'カナダ': '北米',
  'メキシコ': '北米',
  'イギリス': 'ヨーロッパ',
  'ドイツ': 'ヨーロッパ',
  'フランス': 'ヨーロッパ',
  'スペイン': 'ヨーロッパ',
  'イタリア': 'ヨーロッパ',
  'オランダ': 'ヨーロッパ',
  'スイス': 'ヨーロッパ',
  'スウェーデン': 'ヨーロッパ',
  'ノルウェー': 'ヨーロッパ',
  'デンマーク': 'ヨーロッパ',
  'フィンランド': 'ヨーロッパ',
  'ポーランド': 'ヨーロッパ',
  'オーストリア': 'ヨーロッパ',
  'ベルギー': 'ヨーロッパ',
  'ポルトガル': 'ヨーロッパ',
  'ギリシャ': 'ヨーロッパ',
  'チェコ': 'ヨーロッパ',
  'ハンガリー': 'ヨーロッパ',
  'アイルランド': 'ヨーロッパ',
  '日本': 'アジア',
  '韓国': 'アジア',
  '中国': 'アジア',
  '台湾': 'アジア',
  'シンガポール': 'アジア',
  '香港': 'アジア',
  'タイ': 'アジア',
  'マレーシア': 'アジア',
  'インドネシア': 'アジア',
  'フィリピン': 'アジア',
  'ベトナム': 'アジア',
  'インド': 'アジア',
  'オーストラリア': 'オセアニア',
  'ニュージーランド': 'オセアニア',
  'ブラジル': '南米',
  'アルゼンチン': '南米',
  'チリ': '南米',
  '南アフリカ': 'アフリカ',
  'エジプト': 'アフリカ',
  'トルコ': '中東',
  'ロシア': 'ヨーロッパ',
  'アラブ首長国連邦': '中東',
  'サウジアラビア': '中東',
  'イスラエル': '中東',
}

// 大陸の表示順と色
const continentConfig: Record<string, { order: number; color: string; bgColor: string; emoji: string }> = {
  '北米': { order: 1, color: '#3B82F6', bgColor: '#EFF6FF', emoji: '🌎' },
  '南米': { order: 2, color: '#10B981', bgColor: '#ECFDF5', emoji: '🌎' },
  'ヨーロッパ': { order: 3, color: '#8B5CF6', bgColor: '#F5F3FF', emoji: '🌍' },
  'アフリカ': { order: 4, color: '#F59E0B', bgColor: '#FFFBEB', emoji: '🌍' },
  '中東': { order: 5, color: '#EF4444', bgColor: '#FEF2F2', emoji: '🌍' },
  'アジア': { order: 6, color: '#EC4899', bgColor: '#FDF2F8', emoji: '🌏' },
  'オセアニア': { order: 7, color: '#06B6D4', bgColor: '#ECFEFF', emoji: '🌏' },
  'その他': { order: 8, color: '#6B7280', bgColor: '#F9FAFB', emoji: '🌐' },
}

// カテゴリの色とラベル
function getCategoryStyle(category: string) {
  switch (category) {
    case 'question': return { color: '#3B82F6', bg: '#EFF6FF', label: '質問', icon: HelpCircle }
    case 'diary': return { color: '#10B981', bg: '#ECFDF5', label: '日記', icon: BookOpen }
    case 'chat': return { color: '#8B5CF6', bg: '#F5F3FF', label: 'つぶやき', icon: MessageCircle }
    default: return { color: '#6B7280', bg: '#F9FAFB', label: '投稿', icon: MessageCircle }
  }
}

import { formatRelativeTime } from '@/lib/mapUtils'

export function MapListView({ posts, userPostData, onMarkerClick, selectedPostId }: MapComponentProps) {
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set(['北米', 'ヨーロッパ', 'アジア']))
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())

  // 大陸 → 国 → 投稿の階層構造を構築
  const hierarchy = useMemo(() => {
    const dataSource = userPostData || posts.map(p => ({
      user: p.author as User,
      posts: [p],
      displayPost: p,
      displayType: (p.category || 'question') as 'question' | 'diary' | 'chat' | 'normal',
    }))

    // 国ごとにグループ化
    const countryMap = new Map<string, UserPostData[]>()
    dataSource.forEach(data => {
      const country = data.user?.study_abroad_destination || 'その他'
      if (!countryMap.has(country)) countryMap.set(country, [])
      countryMap.get(country)!.push(data)
    })

    // 大陸ごとにグループ化
    const continentMap = new Map<string, { country: string; users: UserPostData[] }[]>()
    countryMap.forEach((users, country) => {
      const continent = countryToContinent[country] || 'その他'
      if (!continentMap.has(continent)) continentMap.set(continent, [])
      continentMap.get(continent)!.push({ country, users })
    })

    // ソート：大陸を定義順、国をユーザー数降順
    const sorted = Array.from(continentMap.entries())
      .sort(([a], [b]) => (continentConfig[a]?.order || 99) - (continentConfig[b]?.order || 99))
      .map(([continent, countries]) => ({
        continent,
        countries: countries.sort((a, b) => b.users.length - a.users.length),
        totalUsers: countries.reduce((sum, c) => sum + c.users.length, 0),
      }))

    return sorted
  }, [posts, userPostData])

  const toggleContinent = (continent: string) => {
    setExpandedContinents(prev => {
      const next = new Set(prev)
      if (next.has(continent)) next.delete(continent)
      else next.add(continent)
      return next
    })
  }

  const toggleCountry = (key: string) => {
    setExpandedCountries(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="w-full min-h-[600px] max-h-[600px] overflow-y-auto rounded-2xl border-2 border-gray-200 bg-gray-50/50">
      {/* サマリーバー */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span className="font-medium">{userPostData?.length || posts.length}人</span>
          <span className="text-gray-400">・</span>
          <MapPin className="h-4 w-4" />
          <span className="font-medium">
            {hierarchy.reduce((sum, c) => sum + c.countries.length, 0)}カ国
          </span>
          <span className="text-gray-400">・</span>
          <span className="font-medium">{hierarchy.length}地域</span>
        </div>
      </div>

      {/* 大陸ごとのアコーディオン */}
      <div className="p-3 space-y-2">
        {hierarchy.map(({ continent, countries, totalUsers }) => {
          const config = continentConfig[continent] || continentConfig['その他']
          const isExpanded = expandedContinents.has(continent)

          return (
            <div key={continent} className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              {/* 大陸ヘッダー */}
              <button
                onClick={() => toggleContinent(continent)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{config.emoji}</span>
                  <span className="font-bold text-gray-900">{continent}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {totalUsers}人 ・ {countries.length}カ国
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* 国リスト */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {countries.map(({ country, users }) => {
                    const countryKey = `${continent}-${country}`
                    const isCountryExpanded = expandedCountries.has(countryKey)

                    return (
                      <div key={countryKey} className="border-b border-gray-50 last:border-b-0">
                        {/* 国ヘッダー */}
                        <button
                          onClick={() => toggleCountry(countryKey)}
                          className="w-full px-6 py-2.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" style={{ color: config.color }} />
                            <span className="font-medium text-gray-800 text-sm">{country}</span>
                            <span className="text-xs text-gray-400">{users.length}人</span>
                            {/* カテゴリ内訳のドット */}
                            <div className="flex items-center gap-1 ml-1">
                              {(() => {
                                const counts = { question: 0, diary: 0, chat: 0 }
                                users.forEach(u => {
                                  const cat = u.displayType
                                  if (cat in counts) counts[cat as keyof typeof counts]++
                                })
                                return Object.entries(counts)
                                  .filter(([, v]) => v > 0)
                                  .map(([cat, count]) => {
                                    const style = getCategoryStyle(cat)
                                    return (
                                      <span
                                        key={cat}
                                        className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: style.bg, color: style.color }}
                                      >
                                        {count}
                                      </span>
                                    )
                                  })
                              })()}
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isCountryExpanded ? 'rotate-90' : ''}`}
                          />
                        </button>

                        {/* ユーザー/投稿カード */}
                        {isCountryExpanded && (
                          <div className="px-6 pb-3 space-y-2">
                            {users.map(userData => {
                              const post = userData.displayPost
                              const catStyle = getCategoryStyle(userData.displayType)
                              const Icon = catStyle.icon
                              const isSelected = selectedPostId === post.id

                              return (
                                <div
                                  key={post.id}
                                  onClick={() => onMarkerClick?.(post)}
                                  className={`group cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
                                    isSelected
                                      ? 'border-primary-400 bg-primary-50 shadow-md'
                                      : 'border-gray-100 bg-white hover:border-gray-200'
                                  }`}
                                >
                                  <div className="p-3">
                                    {/* ユーザー行 */}
                                    <div className="flex items-center gap-2.5 mb-2">
                                      <UserAvatar
                                        iconUrl={userData.user.icon_url}
                                        name={userData.user.name}
                                        size="sm"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-900 truncate">
                                            {userData.user.name}
                                          </span>
                                          <span
                                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                                          >
                                            <Icon className="h-3 w-3" />
                                            {catStyle.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                          <Clock className="h-3 w-3" />
                                          <span>{formatRelativeTime(post.created_at)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* 投稿内容 */}
                                    <div className="ml-9">
                                      {userData.displayType !== 'chat' && post.title && (
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                          {post.title}
                                        </h4>
                                      )}
                                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {post.content}
                                      </p>

                                      {/* メタ情報 */}
                                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                        {post.likes_count != null && post.likes_count > 0 && (
                                          <span className="flex items-center gap-1">
                                            <ThumbsUp className="h-3 w-3" />
                                            {post.likes_count}
                                          </span>
                                        )}
                                        {post.comments_count != null && post.comments_count > 0 && (
                                          <span className="flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" />
                                            {post.comments_count}
                                          </span>
                                        )}
                                        {userData.displayType === 'question' && !post.is_resolved && (
                                          <span className={`font-semibold ${
                                            post.urgency_level === 'urgent' ? 'text-red-500' : 'text-blue-500'
                                          }`}>
                                            {post.urgency_level === 'urgent' ? '緊急' : '未解決'}
                                          </span>
                                        )}
                                        {userData.posts.length > 1 && (
                                          <span className="text-gray-400">
                                            他{userData.posts.length - 1}件
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {hierarchy.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">投稿が見つかりません</p>
            <p className="text-gray-400 text-xs mt-1">フィルターを変更してみてください</p>
          </div>
        )}
      </div>
    </div>
  )
}
