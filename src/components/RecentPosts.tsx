'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { MessageCircle, MessageSquare, Clock, Heart, HelpCircle, BookOpen, MapPin, GraduationCap, CheckCircle, CheckCircle2, Briefcase, Shield } from 'lucide-react'
import { AccountBadge } from '@/components/AccountBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { StudentStatusBadge } from '@/components/StudentStatusBadge'
import { formatPostLocalTime, getTimezoneAbbreviation } from '@/lib/timezone'

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentPosts()
  }, [])

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(name, account_type, verification_status, organization_name, icon_url, languages, study_abroad_destination, university, university_id, is_operator, timezone)
        `)
        .is('community_id', null) // コミュニティ限定投稿は除外
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        console.error('Error fetching posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'たった今'
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return HelpCircle
      case 'diary': return BookOpen
      case 'chat': return MessageCircle
      case 'information': return MessageCircle // 後方互換性
      default: return MessageCircle
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question': return '質問'
      case 'diary': return '日記'
      case 'chat': return 'つぶやき'
      case 'information': return 'つぶやき' // 後方互換性
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'diary': return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'chat': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'information': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' // 後方互換性
      case 'official': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  // 国名から国旗を取得する関数
  const getCountryFlag = (countryName: string): string => {
    const countriesByRegion = {
      'africa': [
        { code: 'ZA', name: '南アフリカ', flag: '🇿🇦' },
        { code: 'EG', name: 'エジプト', flag: '🇪🇬' },
        { code: 'KE', name: 'ケニア', flag: '🇰🇪' },
      ],
      'north-america': [
        { code: 'US', name: 'アメリカ', flag: '🇺🇸' },
        { code: 'CA', name: 'カナダ', flag: '🇨🇦' },
        { code: 'MX', name: 'メキシコ', flag: '🇲🇽' },
      ],
      'south-america': [
        { code: 'BR', name: 'ブラジル', flag: '🇧🇷' },
        { code: 'AR', name: 'アルゼンチン', flag: '🇦🇷' },
        { code: 'CL', name: 'チリ', flag: '🇨🇱' },
      ],
      'asia': [
        { code: 'JP', name: '日本', flag: '🇯🇵' },
        { code: 'KR', name: '韓国', flag: '🇰🇷' },
        { code: 'CN', name: '中国', flag: '🇨🇳' },
        { code: 'TW', name: '台湾', flag: '🇹🇼' },
        { code: 'SG', name: 'シンガポール', flag: '🇸🇬' },
        { code: 'HK', name: '香港', flag: '🇭🇰' },
        { code: 'TH', name: 'タイ', flag: '🇹🇭' },
        { code: 'MY', name: 'マレーシア', flag: '🇲🇾' },
        { code: 'ID', name: 'インドネシア', flag: '🇮🇩' },
        { code: 'PH', name: 'フィリピン', flag: '🇵🇭' },
        { code: 'VN', name: 'ベトナム', flag: '🇻🇳' },
        { code: 'IN', name: 'インド', flag: '🇮🇳' },
      ],
      'europe': [
        { code: 'GB', name: 'イギリス', flag: '🇬🇧' },
        { code: 'DE', name: 'ドイツ', flag: '🇩🇪' },
        { code: 'FR', name: 'フランス', flag: '🇫🇷' },
        { code: 'ES', name: 'スペイン', flag: '🇪🇸' },
        { code: 'IT', name: 'イタリア', flag: '🇮🇹' },
        { code: 'NL', name: 'オランダ', flag: '🇳🇱' },
        { code: 'CH', name: 'スイス', flag: '🇨🇭' },
        { code: 'SE', name: 'スウェーデン', flag: '🇸🇪' },
        { code: 'IE', name: 'アイルランド', flag: '🇮🇪' },
        { code: 'AT', name: 'オーストリア', flag: '🇦🇹' },
        { code: 'BE', name: 'ベルギー', flag: '🇧🇪' },
        { code: 'DK', name: 'デンマーク', flag: '🇩🇰' },
        { code: 'FI', name: 'フィンランド', flag: '🇫🇮' },
        { code: 'NO', name: 'ノルウェー', flag: '🇳🇴' },
        { code: 'PL', name: 'ポーランド', flag: '🇵🇱' },
        { code: 'PT', name: 'ポルトガル', flag: '🇵🇹' },
        { code: 'CZ', name: 'チェコ', flag: '🇨🇿' },
        { code: 'GR', name: 'ギリシャ', flag: '🇬🇷' },
      ],
      'oceania': [
        { code: 'AU', name: 'オーストラリア', flag: '🇦🇺' },
        { code: 'NZ', name: 'ニュージーランド', flag: '🇳🇿' },
        { code: 'FJ', name: 'フィジー', flag: '🇫🇯' },
      ]
    }
    
    for (const region of Object.values(countriesByRegion)) {
      const country = region.find(c => c.name === countryName)
      if (country) {
        return country.flag
      }
    }
    return '🏳️' // デフォルトの国旗
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 bg-gray-200 rounded-full w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-1.5"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="h-6 bg-gray-200 rounded-full w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">まだ投稿がありません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        return (
          <Link 
            key={post.id} 
            href={`/posts/${post.id}`} 
            className="block group"
          >
            <div className={`bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-200 h-full flex flex-col ${
              post.category === 'diary' && post.cover_image_url ? 'p-0 overflow-hidden' : 'p-4'
            }`}>
              <div className={`flex items-center justify-between ${post.category === 'diary' && post.cover_image_url ? 'absolute top-3 left-3 right-3 z-10' : 'mb-2'}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {post.category === 'diary' && post.cover_image_url ? (
                    <span className={`px-3 py-1.5 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-xs font-semibold flex items-center gap-1 text-white shadow-lg ${getCategoryColor(post.category)}`}>
                      {(() => {
                        const Icon = getCategoryIcon(post.category)
                        return <Icon className="h-3 w-3 text-white" />
                      })()}
                      {getCategoryLabel(post.category)}
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 ${getCategoryColor(post.category)}`}>
                      {(() => {
                        const Icon = getCategoryIcon(post.category)
                        return <Icon className="h-2.5 w-2.5 text-white" />
                      })()}
                      {getCategoryLabel(post.category)}
                    </span>
                  )}
                  {/* 解決済みバッジ（質問のみ） */}
                  {post.category === 'question' && post.is_resolved && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white">
                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      解決済み
                    </span>
                  )}
                  {/* ロケーションタグ（日記でカバー画像がある場合は非表示、それ以外は表示） */}
                  {post.study_abroad_destination && !(post.category === 'diary' && post.cover_image_url) && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                      <span className="emoji text-xs" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Segoe UI Symbol, Android Emoji, EmojiSymbols, sans-serif', display: 'inline-block', lineHeight: '1' }}>
                        {getCountryFlag(post.study_abroad_destination)}
                      </span>
                      <span>{post.study_abroad_destination}</span>
                    </span>
                  )}
                </div>
                {post.category === 'diary' && post.cover_image_url ? (
                  <span className="px-3 py-1.5 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-xs font-semibold text-white shadow-lg flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(post.created_at)}
                    {post.author?.timezone && formatPostLocalTime(post.created_at, post.author.timezone) && (
                      <span className="opacity-75 ml-0.5">({formatPostLocalTime(post.created_at, post.author.timezone)} {getTimezoneAbbreviation(post.author.timezone)})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 flex items-center font-medium">
                    <Clock className="h-3 w-3 mr-0.5" />
                    {formatDate(post.created_at)}
                    {post.author?.timezone && formatPostLocalTime(post.created_at, post.author.timezone) && (
                      <span className="text-gray-400 ml-1">({formatPostLocalTime(post.created_at, post.author.timezone)} {getTimezoneAbbreviation(post.author.timezone)})</span>
                    )}
                  </span>
                )}
              </div>
              
              {/* 日記でカバー画像がある場合の特別なレイアウト */}
              {post.category === 'diary' && post.cover_image_url ? (
                <div className="relative">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt="カバー写真"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* グラデーションオーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                    
                    {/* 下部：ユーザー情報（グラスモーフィズム） */}
                    <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-120px)] sm:max-w-none">
                      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-xl p-2.5 shadow-2xl">
                        <div className="flex items-center space-x-2">
                          <UserAvatar 
                            iconUrl={post.author?.icon_url} 
                            name={post.author?.name} 
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-white font-semibold text-xs drop-shadow-lg">
                                {post.author?.name || '匿名'}
                              </span>
                              {post.author && post.author.account_type && post.author.account_type !== 'individual' && post.author.verification_status === 'verified' && (
                                <CheckCircle className={`h-3 w-3 drop-shadow-lg ${post.author.is_operator ? 'text-purple-300' : 'text-[#FFD700]'}`} />
                              )}
                            </div>
                            {post.author && (
                              <>
                                {/* 組織アカウントの場合：組織名を表示 */}
                                {post.author.account_type && post.author.account_type !== 'individual' && post.author.organization_name && (
                                  <span className="text-white text-xs opacity-90 mt-0.5 drop-shadow-lg">
                                    {post.author.organization_name}
                                  </span>
                                )}
                                {/* 個人アカウントの場合：留学先または所属大学を表示 */}
                                {(!post.author.account_type || post.author.account_type === 'individual') && (
                                  <>
                                    {post.author.study_abroad_destination ? (
                                      <span className="text-white text-xs opacity-90 mt-0.5 drop-shadow-lg">
                                        {post.author.study_abroad_destination}
                                      </span>
                                    ) : post.author.university ? (
                                      <span className="text-white text-xs opacity-90 mt-0.5 drop-shadow-lg">
                                        {post.author.university}
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    
                    {/* 上部オーバーレイ（タイトルとタグ用） */}
                    <div className="absolute top-2 left-0 right-0 p-4 z-20">
                      {/* タグチップ（一番上） */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {/* 国ラベル（画像付き日記の場合のみここに表示） */}
                        {post.study_abroad_destination && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200 drop-shadow-lg flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {post.study_abroad_destination}
                          </span>
                        )}
                      </div>
                      
                      {/* タイトル（画像の上に重ねて表示） */}
                      <h2 className="text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-primary-200 transition-colors">
                        {post.title}
                      </h2>
                    </div>
                  </div>
                </div>
              ) : post.category === 'chat' ? (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-snug">
                    {post.content}
                  </h2>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors leading-snug">
                    {post.title}
                  </h2>
                  {/* 日記の内容は非表示 */}
                  {post.category !== 'diary' && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  )}
                  
                  {/* 通常の写真表示（日記以外、またはカバー画像がない場合） */}
                  {post.cover_image_url ? (
                    <div className="mb-2 rounded-lg overflow-hidden border border-primary-200 shadow-sm relative">
                      <img
                        src={post.cover_image_url}
                        alt="カバー写真"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : post.image_url ? (
                    <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={post.image_url}
                        alt="投稿画像"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              )}
              
              {/* フッター情報（日記でカバー画像がない場合、または日記以外の場合） */}
              {!(post.category === 'diary' && post.cover_image_url) && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-xs text-gray-600 flex-wrap gap-2">
                    <div className="flex items-center space-x-1.5">
                      <UserAvatar 
                        iconUrl={post.author?.icon_url} 
                        name={post.author?.name} 
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-medium">{post.author?.name || '匿名'}</span>
                          {post.author && post.author.account_type && post.author.account_type !== 'individual' && post.author.verification_status === 'verified' && (
                            <CheckCircle className={`h-3 w-3 ${post.author.is_operator ? 'text-purple-600' : 'text-[#B39855]'}`} />
                          )}
                        </div>
                        {post.author && (
                          <>
                            {/* 組織アカウントの場合：組織名を表示 */}
                            {post.author.account_type && post.author.account_type !== 'individual' && post.author.organization_name && (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {post.author.organization_name}
                              </span>
                            )}
                            {/* 個人アカウントの場合：留学先または所属大学を表示 */}
                            {(!post.author.account_type || post.author.account_type === 'individual') && (
                              <>
                                {post.author.study_abroad_destination ? (
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {post.author.study_abroad_destination}
                                  </span>
                                ) : post.author.university ? (
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {post.author.university}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}


