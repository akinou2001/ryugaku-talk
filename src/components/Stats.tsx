'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, MessageSquare, Building2, Globe } from 'lucide-react'

interface StatsData {
  users: number
  posts: number
  communities: number
  countries: number
}

export function Stats() {
  const [stats, setStats] = useState<StatsData>({
    users: 0,
    posts: 0,
    communities: 0,
    countries: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // ユーザー数
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 投稿数（コミュニティ限定投稿を除く）
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .is('community_id', null)

      // コミュニティ数
      const { count: communitiesCount } = await supabase
        .from('communities')
        .select('*', { count: 'exact', head: true })

      // 留学先の国数（ユニークな国をカウント）
      const { data: destinations } = await supabase
        .from('profiles')
        .select('study_abroad_destination')
        .not('study_abroad_destination', 'is', null)

      const uniqueCountries = new Set<string>()
      destinations?.forEach(profile => {
        if (profile.study_abroad_destination) {
          const countries: string[] = profile.study_abroad_destination.includes(',')
            ? profile.study_abroad_destination.split(',').map((c: string) => c.trim())
            : [profile.study_abroad_destination]
          countries.forEach((country: string) => {
            if (country) uniqueCountries.add(country)
          })
        }
      })

      setStats({
        users: usersCount || 0,
        posts: postsCount || 0,
        communities: communitiesCount || 0,
        countries: uniqueCountries.size
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const statsItems = [
    {
      icon: Users,
      label: 'ユーザー',
      value: stats.users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MessageSquare,
      label: '投稿',
      value: stats.posts,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Building2,
      label: 'コミュニティ',
      value: stats.communities,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Globe,
      label: '留学先の国',
      value: stats.countries,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            RyugakuTalkの実績
          </h2>
          <p className="text-lg text-gray-600">
            多くのユーザーが参加する、活発な留学コミュニティ
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {statsItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className={`${item.bgColor} rounded-2xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}
              >
                <div className={`bg-gradient-to-br ${item.color} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>
                  {formatNumber(item.value)}
                </div>
                <div className="text-sm md:text-base font-medium text-gray-700">
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

