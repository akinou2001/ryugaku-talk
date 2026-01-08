import { MessageSquare, Users, Building2, Calendar, Clock, Shield, Star, Award, Zap, Globe, Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: '質問・投稿機能',
      description: '質問、留学日記、つぶやきを投稿して交流できます。カテゴリ別に整理され、地域や目的で絞り込み検索も可能です。',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      link: '/timeline'
    },
    {
      icon: Clock,
      title: 'タイムライン',
      description: 'おすすめや最新の投稿を一覧で確認。参加しているコミュニティのイベントやクエストも一緒に表示されます。',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      link: '/timeline'
    },
    {
      icon: Users,
      title: 'コミュニティ',
      description: '個人はサークル、組織は公式コミュニティを作成可能。メンバーと情報を共有し、イベントやクエストを開催できます。',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      link: '/communities'
    },
    {
      icon: Building2,
      title: '組織アカウント',
      description: '教育機関・企業・政府機関が公式コミュニティを作成し、イベントを開催。認証により信頼性を確保します。',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      link: '/auth/signup'
    },
    {
      icon: Award,
      title: 'クエストシステム',
      description: 'コミュニティ内でクエストを投稿し、達成するとポイントを獲得できます。',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      link: '/communities'
    },
    {
      icon: Calendar,
      title: 'イベント機能',
      description: '公式コミュニティでイベントを開催。参加登録、締切管理、定員設定など、本格的なイベント管理が可能です。',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconBg: 'bg-pink-100',
      link: '/communities'
    },
    {
      icon: MessageCircle,
      title: 'チャット機能',
      description: 'ユーザー同士で直接メッセージを交換できます。リアルタイムで会話を楽しめます。',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      link: '/chat'
    },
    {
      icon: Star,
      title: 'スコアシステム',
      description: '投稿やコメントで貢献度を可視化します。積極的な参加が評価されます。',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      link: '/timeline'
    },
    {
      icon: Shield,
      title: '安全な環境',
      description: '通報機能とモデレーションにより、安全で建設的なコミュニティを維持します。',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
      link: null
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            RyugakuTalkの主要機能
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            留学コミュニティに特化した豊富な機能で、より良い留学体験をサポートします
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const content = (
              <div className={`${feature.bgColor} rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 border border-gray-100`}>
                <div className={`${feature.iconBg} rounded-xl w-16 h-16 flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110`}>
                  <div className={`bg-gradient-to-br ${feature.color} rounded-lg w-12 h-12 flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
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

        <div className="mt-16 text-center">
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <span>無料で始める</span>
            <Zap className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
