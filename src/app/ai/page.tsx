"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Search, ArrowRight, FileSearch } from "lucide-react";

export default function AiSelectionPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AI機能を選ぶ
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              あなたのニーズに合わせて、最適なAI機能をお選びください
            </p>
          </div>

          {/* カード選択エリア */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* オプション1: AIコンシェルジュ */}
            <div
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-primary-500 hover:scale-105"
              onMouseEnter={() => setHoveredCard("concierge")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push("/ai/concierge")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <ArrowRight
                  className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-400 transition-transform duration-300 ${
                    hoveredCard === "concierge" ? "translate-x-2 text-primary-600" : ""
                  }`}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                AIコンシェルジュ
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                過去の投稿や外部情報を参考にしながら、あなたの質問にAIが詳細に回答します。
                引用した投稿やおすすめユーザーも表示されます。
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                  <span>ログインが必要</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                  <span>引用した投稿を表示</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                  <span>おすすめユーザーを表示</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                  <span>Markdown形式の回答</span>
                </div>
              </div>
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/ai/concierge");
                }}
              >
                使ってみる
              </button>
            </div>

            {/* オプション2: AI検索 */}
            <div
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-primary-500 hover:scale-105"
              onMouseEnter={() => setHoveredCard("search")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push("/ai/search")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Search className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <ArrowRight
                  className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-400 transition-transform duration-300 ${
                    hoveredCard === "search" ? "translate-x-2 text-primary-600" : ""
                  }`}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                AI検索（beta）
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                シンプルで高速なAI検索機能。投稿データベースから関連情報を検索し、
                AIが要約・回答を生成します。
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>ログイン不要</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>シンプルなUI</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>高速な検索</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>DashScope API使用</span>
                </div>
              </div>
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/ai/search");
                }}
              >
                使ってみる
              </button>
            </div>

            {/* オプション3: AI検索（拡張版） */}
            <div
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-primary-500 hover:scale-105"
              onMouseEnter={() => setHoveredCard("search-enhanced")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push("/ai/search-enhanced")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileSearch className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <ArrowRight
                  className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-400 transition-transform duration-300 ${
                    hoveredCard === "search-enhanced" ? "translate-x-2 text-primary-600" : ""
                  }`}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                AI検索（拡張版）
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                投稿データベースから関連情報を検索し、要約・引用しながら回答します。
                AIコンシェルジュと同じUIで、引用した投稿を表示します。
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>ログインが必要</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>引用した投稿を表示</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Gemini API使用</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Markdown形式の回答</span>
                </div>
              </div>
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/ai/search-enhanced");
                }}
              >
                使ってみる
              </button>
            </div>
          </div>

          {/* フッター説明 */}
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              すべての機能が、RyugakuTalkの投稿データベースを活用してAIが回答を生成します
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
