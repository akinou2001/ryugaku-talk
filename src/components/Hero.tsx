import Link from 'next/link'
import { MessageCircle, Users, Sparkles, MessageSquare, Award, Calendar, ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-24 min-h-[95vh] flex items-center overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* ロゴ */}
          <div className="mb-12 animate-fade-in">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-14 w-14 text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent animate-gradient">
                RyugakuTalk
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
              みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
            </p>
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20 animate-fade-in-up">
            <Link 
              href="/auth/signup" 
              className="group relative bg-white text-indigo-700 hover:text-indigo-800 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 inline-flex items-center justify-center space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 transform"
            >
              <span className="relative z-10">今すぐ無料で始める</span>
              <ArrowRight className="h-5 w-5 relative z-10 transform group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </Link>
            <Link 
              href="/timeline" 
              className="group relative bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 inline-flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:bg-white/20"
            >
              <Sparkles className="h-5 w-5 transform group-hover:rotate-12 transition-transform" />
              <span>タイムラインを見る</span>
            </Link>
          </div>

          {/* 特徴カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 animate-fade-in-up-delay">
            {/* 質問・投稿 */}
            <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">質問・投稿</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  質問、日記、つぶやきで<br />交流できる
                </p>
              </div>
            </div>

            {/* コミュニティ */}
            <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">コミュニティ</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  サークルや公式コミュニティで<br />つながる
                </p>
              </div>
            </div>

            {/* クエスト */}
            <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">クエスト</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  ミッションを達成して<br />スコア獲得
                </p>
              </div>
            </div>

            {/* イベント */}
            <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center hover:bg-white/20 transition-all duration-500 border border-white/20 hover:border-white/40 hover:scale-105 transform shadow-xl hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <Calendar className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">イベント</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  公式コミュニティの<br />イベントに参加
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
