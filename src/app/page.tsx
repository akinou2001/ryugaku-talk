import { Hero } from '@/components/Hero'
import { RecentPosts } from '@/components/RecentPosts'
import { Features } from '@/components/Features'
import Link from 'next/link'
import { ArrowRight, Users, MessageSquare, Building2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      
      {/* 最近の投稿セクション */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">最近の投稿</h2>
            <Link href="/timeline" className="text-primary-600 hover:text-primary-800 flex items-center space-x-1 text-sm md:text-base">
              <span>すべて見る</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <RecentPosts />
        </div>
      </section>

      {/* 機能紹介セクション */}
      <Features />

      {/* CTAセクション */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              RyugakuTalkで留学体験を共有しよう
            </h2>
            <p className="text-lg md:text-xl mb-8 text-blue-100">
              個人アカウントから組織アカウントまで、様々な形で参加できます。
              <br />
              今すぐ無料で始めて、留学コミュニティに参加しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center space-x-2">
                <span>無料で始める</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/communities" className="bg-primary-700 hover:bg-primary-800 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center space-x-2">
                <Users className="h-5 w-5" />
                <span>コミュニティを探す</span>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>質問・投稿</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>コミュニティ</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>組織アカウント</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


