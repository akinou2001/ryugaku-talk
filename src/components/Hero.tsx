'use client'

import Link from 'next/link'
import { MessageCircle, Users, Sparkles, MessageSquare, Award, Map, ArrowRight } from 'lucide-react'
import { APP_NAME, APP_DESCRIPTION_SHORT } from '@/config/app-config'
import { EARTH_GRADIENT } from '@/config/theme-config'

export function Hero() {
  // 地球カラーの薄いグラデーション背景
  const earthBgGradient = `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}40 0%, ${EARTH_GRADIENT.colors.middle}40 50%, ${EARTH_GRADIENT.colors.end}40)`
  
  return (
    <section 
      className="relative py-12 sm:py-16 md:py-24 min-h-[85vh] sm:min-h-[90vh] md:min-h-[95vh] flex items-center overflow-hidden w-full"
      style={{ background: earthBgGradient }}
    >
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${EARTH_GRADIENT.colors.middle}30 0%, transparent 70%)` }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${EARTH_GRADIENT.colors.start}30 0%, transparent 70%)` }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${EARTH_GRADIENT.colors.end}20 0%, transparent 70%)` }}></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10 w-full max-w-full">
        <div className="max-w-6xl mx-auto text-center w-full">
          {/* ロゴ */}
          <div className="mb-8 sm:mb-10 md:mb-12 animate-fade-in">
            <div className="relative inline-block mb-6 sm:mb-8">
              {/* 背景のグロー効果 */}
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse"
                style={{ background: EARTH_GRADIENT.css }}
              ></div>
              {/* アイコンコンテナ */}
              <div className="relative flex items-center justify-center transform hover:scale-110 transition-all duration-300">
                <div 
                  className="rounded-full flex items-center justify-center shadow-2xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 p-3 sm:p-4 md:p-5 lg:p-6"
                  style={{ background: EARTH_GRADIENT.css, filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))' }}
                >
                  <MessageCircle 
                    className="h-full w-full text-white" 
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                  />
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold mb-4 sm:mb-6 tracking-tight px-2">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent animate-gradient drop-shadow-lg">
                {APP_NAME}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-800 font-light mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2 lg:whitespace-nowrap drop-shadow-sm">
              {APP_DESCRIPTION_SHORT}
            </p>
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center mb-12 sm:mb-16 md:mb-20 animate-fade-in-up px-2">
            <Link 
              href="/auth/signup" 
              className="group relative text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2 sm:space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 transform whitespace-nowrap w-full sm:w-auto"
              style={{ 
                background: EARTH_GRADIENT.css,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <span className="relative z-10" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>今すぐ無料で始める</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 transform group-hover:translate-x-1 transition-transform flex-shrink-0" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
            </Link>
            <Link 
              href="/timeline" 
              className="group relative backdrop-blur-lg border-2 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2 sm:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 transform whitespace-nowrap w-full sm:w-auto text-gray-900"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
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
              className="group relative backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center transition-all duration-500 border hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
              style={{ 
                background: 'rgba(255, 255, 255, 0.6)',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}33 0%, ${EARTH_GRADIENT.colors.middle}33 50%, ${EARTH_GRADIENT.colors.end}33)` }}></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" style={{ background: EARTH_GRADIENT.css }}></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: EARTH_GRADIENT.css, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}>
                    <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-sm">投稿</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed drop-shadow-sm">
                  質問、日記、つぶやきで<br />留学の様子を共有
                </p>
              </div>
            </Link>

            {/* コミュニティ */}
            <Link 
              href="/auth/signin"
              className="group relative backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center transition-all duration-500 border hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
              style={{ 
                background: 'rgba(255, 255, 255, 0.6)',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}33 0%, ${EARTH_GRADIENT.colors.middle}33 50%, ${EARTH_GRADIENT.colors.end}33)` }}></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" style={{ background: EARTH_GRADIENT.css }}></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: EARTH_GRADIENT.css, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}>
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-sm">コミュニティ</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed drop-shadow-sm">
                  コミュニティで<br />つながる
                </p>
              </div>
            </Link>

            {/* AIコンシェルジュ */}
            <Link 
              href="/ai/concierge"
              className="group relative backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center transition-all duration-500 border hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
              style={{ 
                background: 'rgba(255, 255, 255, 0.6)',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}33 0%, ${EARTH_GRADIENT.colors.middle}33 50%, ${EARTH_GRADIENT.colors.end}33)` }}></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" style={{ background: EARTH_GRADIENT.css }}></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: EARTH_GRADIENT.css, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}>
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-sm">AIコンシェルジュ</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed drop-shadow-sm">
                  留学に関する疑問について<br />AIが的確に回答
                </p>
              </div>
            </Link>

            {/* マップ */}
            <Link 
              href="/map"
              className="group relative backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center transition-all duration-500 border hover:scale-105 transform shadow-xl hover:shadow-2xl cursor-pointer"
              style={{ 
                background: 'rgba(255, 255, 255, 0.6)',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(141deg, ${EARTH_GRADIENT.colors.start}33 0%, ${EARTH_GRADIENT.colors.middle}33 50%, ${EARTH_GRADIENT.colors.end}33)` }}></div>
              <div className="relative">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" style={{ background: EARTH_GRADIENT.css }}></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: EARTH_GRADIENT.css, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}>
                    <Map className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-sm">マップ</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed drop-shadow-sm">
                  みんなの活動を<br />マップで眺める
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </section>
  )
}
