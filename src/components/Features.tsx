import { MessageCircle, Users, Globe, Shield, Star, Heart } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: MessageCircle,
      title: 'Q&A掲示板',
      description: '留学に関する質問を投稿し、経験者から回答を得ることができます。カテゴリ別に整理され、検索機能も充実しています。',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Users,
      title: 'コミュニティ機能',
      description: '同じ大学や留学先の仲間とつながり、情報を共有できます。DM機能で個別の相談も可能です。',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Globe,
      title: '多言語対応',
      description: '日本語・英語対応で、国籍を問わず参加可能です。グローバルな留学ネットワークを形成します。',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Shield,
      title: '安全な環境',
      description: '通報機能とモデレーションにより、安全で建設的なコミュニティを維持します。',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: Star,
      title: '貢献度システム',
      description: '回答数や感謝数に基づく貢献度の可視化により、モチベーション維持と貢献文化を形成します。',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: Heart,
      title: '留学日記',
      description: '留学体験を日記形式で共有し、同じ経験を持つ仲間との交流を促進します。',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">RyugakuTalkの特徴</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            留学コミュニティに特化した機能で、より良い留学体験をサポートします
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center">
              <div className={`${feature.bgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


