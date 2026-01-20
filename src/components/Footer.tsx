import Link from 'next/link'
import { MessageCircle, Mail, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ロゴと説明 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">RyugakuTalk</span>
            </div>
            <p className="text-gray-600 mb-4">
              みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
            </p>
            <div className="flex space-x-4">
              {process.env.NEXT_PUBLIC_CONTACT_FORM_URL && (
                <a 
                  href={process.env.NEXT_PUBLIC_CONTACT_FORM_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                  title="お問い合わせ"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* リンク */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/timeline" className="text-gray-600 hover:text-primary-600 transition-colors">
                  タイムライン
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-gray-600 hover:text-primary-600 transition-colors">
                  マップ
                </Link>
              </li>
              <li>
                <Link href="/communities" className="text-gray-600 hover:text-primary-600 transition-colors">
                  コミュニティ
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">サポート</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-primary-600 transition-colors">
                  ヘルプ
                </Link>
              </li>
              {process.env.NEXT_PUBLIC_CONTACT_FORM_URL && (
                <li>
                  <a
                    href={process.env.NEXT_PUBLIC_CONTACT_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>お問い合わせ</span>
                    <Mail className="h-3 w-3" />
                  </a>
                </li>
              )}
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary-600 transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-primary-600 transition-colors">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2026 RyugakuTalk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
