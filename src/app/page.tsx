import { Hero } from '@/components/Hero'
import { RecentPosts } from '@/components/RecentPosts'
import { Features } from '@/components/Features'
import Link from 'next/link'
import { ArrowRight, Users, MessageSquare, Building2, Sparkles, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <Hero />

      {/* 最近の投稿セクション */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">最近の投稿</h2>
            <Link href="/timeline" className="text-primary-600 hover:text-primary-800 flex items-center space-x-2 text-base md:text-lg font-semibold">
              <span>すべて見る</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <RecentPosts />
        </div>
      </section>

      {/* 機能紹介セクション */}
      <Features />

      {/* CTAセクション */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              RyugakuTalkで留学体験を共有しよう
            </h2>
            <p className="text-lg md:text-xl mb-10 text-white/90">
              個人アカウントから組織アカウントまで、様々な形で参加できます。
              <br />
              今すぐ無料で始めて、留学コミュニティに参加しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/signup" className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                <span>無料で始める</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/communities" className="group bg-white/10 backdrop-blur-lg hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                <Users className="h-5 w-5" />
                <span>コミュニティを探す</span>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-white/80">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>質問・投稿</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>コミュニティ</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>組織アカウント</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
