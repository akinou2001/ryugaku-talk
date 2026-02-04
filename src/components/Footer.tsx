import Link from 'next/link'
import { MessageCircle, Mail, Twitter } from 'lucide-react'
import { APP_NAME } from '@/config/app-config'
import { APP_DESCRIPTION_SHORT, COPYRIGHT_TEXT } from '@/config/app-config'
import { CONTACT_EMAIL, SOCIAL_LINKS } from '@/config/social-config'
import { EARTH_GRADIENT } from '@/config/theme-config'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ロゴと説明 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div 
                className="rounded-full flex items-center justify-center shadow-lg h-8 w-8 p-1.5"
                style={{ background: EARTH_GRADIENT.css }}
              >
                <MessageCircle 
                  className="h-full w-full text-white" 
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' }}
                />
              </div>
              <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
            </div>
            <p className="text-gray-600 mb-4">
              {APP_DESCRIPTION_SHORT}
            </p>
            <div className="flex space-x-4">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-400 hover:text-primary-600 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href={SOCIAL_LINKS.twitter} className="text-gray-400 hover:text-primary-600 transition-colors" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5" />
              </a>
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
          <p>{COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </footer>
  )
}
