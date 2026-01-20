import Link from 'next/link'
import { MessageCircle, Users, Sparkles, MessageSquare, Award, Map, ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-12 sm:py-16 md:py-24 min-h-[85vh] sm:min-h-[90vh] md:min-h-[95vh] flex items-center overflow-hidden w-full">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10 w-full max-w-full">
        <div className="max-w-6xl mx-auto text-center w-full">
          {/* ロゴ */}
          <div className="mb-8 sm:mb-10 md:mb-12 animate-fade-in">
            <div className="relative inline-block mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 hover:bg-white/20 hover:border-white/50 transition-all duration-300">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight px-2">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent animate-gradient">
                RyugakuTalk
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 font-light mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2 lg:whitespace-nowrap">
              みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
            </p>
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center mb-12 sm:mb-16 md:mb-20 animate-fade-in-up px-2">
            <Link 
              href="/auth/signup" 
              className="group relative bg-white text-indigo-700 hover:text-indigo-800 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2 sm:space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 transform whitespace-nowrap w-full sm:w-auto"
            >
              <span className="relative z-10">今すぐ無料で始める</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 transform group-hover:translate-x-1 transition-transform flex-shrink-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </Link>
            <Link 
              href="/timeline" 
              className="group relative bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2 sm:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:bg-white/20 whitespace-nowrap w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 transform group-hover:rotate-12 transition-transform flex-shrink-0" />
              <span>タイムラインを見る</span>
            </Link>
          </div>

          {/* 特徴カード */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 md:mt-20 animate-fade-in-up-delay px-2">
            {/* 質問・投稿 */}
            <Link 
              href="/timeline"
              className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">質問・投稿</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  質問、日記、つぶやきで<br />交流できる
                </p>
              </div>
            </Link>

            {/* コミュニティ */}
            <Link 
              href="/auth/signin"
              className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">コミュニティ</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  コミュニティで<br />つながる
                </p>
              </div>
            </Link>

            {/* マップ */}
            <Link 
              href="/map"
              className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 via-rose-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <Map className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">マップ</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  みんなの活動を<br />マップで眺める
                </p>
              </div>
            </Link>

            {/* クエスト */}
            <Link 
              href="/auth/signin"
              className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">クエスト</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  ミッションを達成して<br />スコア獲得
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </section>
  )
}
