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
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-3 sm:px-4 w-full max-w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">最近の投稿</h2>
            <Link href="/timeline" className="text-primary-600 hover:text-primary-800 flex items-center space-x-2 text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap">
              <span>すべて見る</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            </Link>
          </div>
          <RecentPosts />
        </div>
      </section>

      {/* 機能紹介セクション */}
      <Features />

      {/* CTAセクション */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-3 sm:px-4 w-full max-w-full">
          <div className="max-w-3xl mx-auto text-center px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              RyugakuTalkで留学体験を共有しよう
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-white/90">
              個人アカウントから組織アカウントまで、様々な形で参加できます。
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              今すぐ無料で始めて、留学コミュニティに参加しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/signup" className="bg-white text-blue-700 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 inline-flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl whitespace-nowrap">
                <span>無料で始める</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
              <Link href="/communities" className="group bg-white/10 backdrop-blur-lg hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 whitespace-nowrap">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>コミュニティを探す</span>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-white/80 px-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>質問・投稿</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>コミュニティ</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>組織アカウント</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
