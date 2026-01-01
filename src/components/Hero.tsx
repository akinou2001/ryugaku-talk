import Link from 'next/link'
import { MessageCircle, Users, Calendar, Sparkles, MessageSquare, Award } from 'lucide-react'

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <MessageCircle className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              <span className="text-primary-600">RyugakuTalk</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 font-medium mb-6">
              留学コミュニティプラットフォーム
            </p>
          </div>
          
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            留学中・留学希望者・関係者が質問・共有・交流できる安全なオンラインコミュニティ。
            <br className="hidden md:block" />
            個人から組織まで、多様なアカウントタイプで参加できるグローバル留学ネットワークを形成します。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3 flex items-center justify-center space-x-2">
              <span>今すぐ始める</span>
            </Link>
            <Link href="/timeline" className="btn-secondary text-lg px-8 py-3 flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>タイムラインを見る</span>
            </Link>
            <Link href="/board" className="btn-secondary text-lg px-8 py-3 flex items-center justify-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>掲示板を見る</span>
            </Link>
          </div>

          {/* 主要機能のハイライト */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">質問・投稿</h3>
              <p className="text-sm text-gray-600">
                質問、日記、つぶやきを投稿して交流
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-green-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">コミュニティ</h3>
              <p className="text-sm text-gray-600">
                ギルドや公式コミュニティでつながる
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">クエスト</h3>
              <p className="text-sm text-gray-600">
                ミッションを達成してスコアを獲得
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">イベント</h3>
              <p className="text-sm text-gray-600">
                公式コミュニティのイベントに参加
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


