import Link from 'next/link'
import { MessageCircle, Sparkles, ArrowRight, Globe, Users, Zap } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-600 via-blue-600 to-purple-600">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* ロゴ・アイコン */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-2xl">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="block">RyugakuTalk</span>
            </h1>
          </div>
          
          {/* 説明文 */}
          <p className="text-xl md:text-2xl text-blue-50 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
          </p>

          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up">
            <Link 
              href="/auth/signup" 
              className="group bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
            >
              <span>今すぐ無料で始める</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/timeline" 
              className="group bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>タイムラインを見る</span>
            </Link>
          </div>

          {/* 主要機能のハイライト */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto animate-fade-in-up-delay">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">質問・投稿</h3>
              <p className="text-xs md:text-sm text-blue-100">
                交流できる
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">コミュニティ</h3>
              <p className="text-xs md:text-sm text-blue-100">
                つながる
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">クエスト</h3>
              <p className="text-xs md:text-sm text-blue-100">
                スコア獲得
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">グローバル</h3>
              <p className="text-xs md:text-sm text-blue-100">
                世界中とつながる
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
