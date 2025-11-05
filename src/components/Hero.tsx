import Link from 'next/link'
import { MessageCircle, Users, Globe, Shield } from 'lucide-react'

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            留学コミュニティ
            <span className="text-primary-600 block">RyugakuTalk</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            留学中・留学希望者・関係者が質問・共有・交流できる安全なオンラインコミュニティ。
            多言語対応で国籍を問わず参加可能なグローバル留学ネットワークを形成します。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
              今すぐ始める
            </Link>
            <Link href="/board" className="btn-secondary text-lg px-8 py-3">
              掲示板を見る
            </Link>
          </div>

          {/* 特徴 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Q&A掲示板</h3>
              <p className="text-gray-600">
                留学に関する質問を投稿し、経験者から回答を得ることができます
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">コミュニティ</h3>
              <p className="text-gray-600">
                同じ大学や留学先の仲間とつながり、情報を共有できます
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">多言語対応</h3>
              <p className="text-gray-600">
                日本語・英語対応で、国籍を問わず参加可能です
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


