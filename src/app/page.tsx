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
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                最近の投稿
              </h2>
              <p className="text-lg text-gray-600">
                コミュニティで共有されている最新の情報をチェック
              </p>
            </div>
            <Link 
              href="/timeline" 
              className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
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
      <section className="py-24 bg-gradient-to-br from-primary-600 via-blue-600 to-purple-600 text-white relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Sparkles className="h-16 w-16 text-white mx-auto mb-6 opacity-90" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                RyugakuTalkで留学体験を共有しよう
              </h2>
              <p className="text-xl md:text-2xl mb-10 text-blue-100 leading-relaxed">
                個人アカウントから組織アカウントまで、様々な形で参加できます。
                <br className="hidden md:block" />
                今すぐ無料で始めて、留学コミュニティに参加しましょう。
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/auth/signup" 
                className="group bg-white text-primary-600 hover:bg-gray-50 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
              >
                <span>無料で始める</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/communities" 
                className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/30 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>コミュニティを探す</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm md:text-base text-blue-100">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <MessageSquare className="h-5 w-5" />
                <span>質問・投稿</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Users className="h-5 w-5" />
                <span>コミュニティ</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Building2 className="h-5 w-5" />
                <span>組織アカウント</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Globe className="h-5 w-5" />
                <span>グローバルネットワーク</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
