import { MessageSquare, Users, Building2, Calendar, Clock, Shield, Star, Award, Zap, Globe, Heart, MessageCircle, Map, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { APP_NAME } from '@/config/app-config'
import { EARTH_GRADIENT } from '@/config/theme-config'

export function Features() {
  // 地球カラーの薄いバージョン（背景用）
  const earthBgGradient = `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}15 0%, ${EARTH_GRADIENT.colors.middle}15 50%, ${EARTH_GRADIENT.colors.end}15)`
  const earthIconBgGradient = `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}25 0%, ${EARTH_GRADIENT.colors.middle}25 50%, ${EARTH_GRADIENT.colors.end}25)`

  const features = [
    {
      icon: MessageSquare,
      title: '質問・投稿機能',
      description: '質問、留学日記、つぶやきを投稿して交流できます。カテゴリ別に整理され、地域や目的で絞り込み検索も可能です。',
      link: '/timeline'
    },
    {
      icon: Clock,
      title: 'タイムライン',
      description: 'おすすめや最新の投稿を一覧で確認。参加しているコミュニティのイベントやクエストも一緒に表示されます。',
      link: '/timeline'
    },
    {
      icon: Users,
      title: 'コミュニティ',
      description: '個人はサークル、組織は公式コミュニティを作成可能。メンバーと情報を共有し、イベントやクエストを開催できます。',
      link: '/communities'
    },
    {
      icon: Building2,
      title: '組織アカウント',
      description: '教育機関・企業・政府機関が公式コミュニティを作成し、イベントを開催。認証により信頼性を確保します。',
      link: '/auth/signup'
    },
    {
      icon: Sparkles,
      title: 'AIコンシェルジュ',
      description: '投稿データベースから関連情報を検索し、AIが要約・引用しながら質問に回答します。',
      link: '/ai/concierge'
    },
    {
      icon: Award,
      title: 'クエストシステム',
      description: 'コミュニティ内でクエストを投稿し、達成するとポイントを獲得できます。',
      link: '/communities'
    },
    {
      icon: Calendar,
      title: 'イベント機能',
      description: '公式コミュニティでイベントを開催。参加登録、締切管理、定員設定など、本格的なイベント管理が可能です。',
      link: '/communities'
    },
    {
      icon: MessageCircle,
      title: 'チャット機能',
      description: 'ユーザー同士で直接メッセージを交換できます。リアルタイムで会話を楽しめます。',
      link: '/chat'
    },
    {
      icon: Star,
      title: 'スコアシステム',
      description: '投稿やコメントで貢献度を可視化します。積極的な参加が評価されます。',
      link: '/timeline'
    },
    {
      icon: Shield,
      title: '安全な環境',
      description: '通報機能とモデレーションにより、安全で建設的なコミュニティを維持します。',
      link: null
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {APP_NAME}の主要機能
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            留学コミュニティに特化した豊富な機能で、より良い留学体験をサポートします
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const content = (
              <div 
                className="rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 border border-gray-100"
                style={{ background: earthBgGradient }}
              >
                <div 
                  className="rounded-xl w-16 h-16 flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110"
                  style={{ background: earthIconBgGradient }}
                >
                  <div 
                    className="rounded-lg w-12 h-12 flex items-center justify-center shadow-lg"
                    style={{ background: EARTH_GRADIENT.css, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
                  >
                    <Icon className="h-6 w-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            )

            return feature.link ? (
              <Link key={index} href={feature.link} className="group block">
                {content}
              </Link>
            ) : (
              <div key={index} className="group">
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
