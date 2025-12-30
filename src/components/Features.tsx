import { MessageSquare, Users, Building2, Flame, Calendar, BookOpen, MessageCircle, Sparkles, Shield, Star, Heart, Zap } from 'lucide-react'
import Link from 'next/link'

export function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: '質問・投稿機能',
      description: '質問、留学日記、つぶやきを投稿して交流できます。カテゴリ別に整理され、地域や目的で絞り込み検索も可能です。',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/board'
    },
    {
      icon: Sparkles,
      title: 'タイムライン',
      description: 'おすすめや最新の投稿を一覧で確認。参加しているコミュニティのイベントやクエストも一緒に表示されます。',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/timeline'
    },
    {
      icon: Users,
      title: 'コミュニティ',
      description: '個人はギルド、組織は公式コミュニティを作成可能。メンバーと情報を共有し、イベントやクエストを開催できます。',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/communities'
    },
    {
      icon: Building2,
      title: '組織アカウント',
      description: '教育機関・企業・政府機関が公式コミュニティを作成し、イベントを開催。認証により信頼性を確保します。',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/auth/signup'
    },
    {
      icon: Flame,
      title: 'クエストシステム',
      description: 'コミュニティ内でクエストを投稿し、達成するとFire・Candle・Torchなどのスコアを獲得できます。',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/communities'
    },
    {
      icon: Calendar,
      title: 'イベント機能',
      description: '公式コミュニティでイベントを開催。参加登録、締切管理、定員設定など、本格的なイベント管理が可能です。',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      link: '/communities'
    },
    {
      icon: MessageCircle,
      title: 'チャット機能',
      description: 'ユーザー同士で直接メッセージを交換。週1回キャンドルを送って感謝を伝えることもできます。',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      link: '/chat'
    },
    {
      icon: Star,
      title: 'スコアシステム',
      description: 'Fire（いいね・コメント）、Candle（ギルドクエスト）、Torch（公式クエスト）で貢献度を可視化します。',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/timeline'
    },
    {
      icon: Shield,
      title: '安全な環境',
      description: '通報機能とモデレーションにより、安全で建設的なコミュニティを維持します。',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: null
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">RyugakuTalkの主要機能</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            留学コミュニティに特化した豊富な機能で、より良い留学体験をサポートします
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const content = (
              <div className="card text-center h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`${feature.bgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )

            return feature.link ? (
              <Link key={index} href={feature.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={index}>
                {content}
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2">
            <span>無料で始める</span>
            <Zap className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}


