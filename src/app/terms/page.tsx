import type { Metadata } from 'next'
import { FileText, AlertCircle, Shield, Ban, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: '利用規約 - RyugakuTalk',
  description: 'RyugakuTalkの利用規約',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <FileText className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">利用規約</h1>
            <p className="text-lg text-gray-600">
              最終更新日: 2024年1月1日
            </p>
          </div>

          {/* 本文 */}
          <div className="card space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-primary-600" />
                1. はじめに
              </h2>
              <p className="text-gray-700 leading-relaxed">
                本利用規約（以下「本規約」）は、RyugakuTalk（以下「当サービス」）の利用条件を定めるものです。
                当サービスをご利用になることで、本規約に同意したものとみなされます。
                本規約に同意いただけない場合は、当サービスをご利用いただけません。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-primary-600" />
                2. アカウント
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1 アカウントの作成</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスを利用するには、アカウントの作成が必要です。
                    アカウント作成時には、正確で最新の情報を提供する必要があります。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.2 アカウントの管理</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    ユーザーは、以下の責任を負います：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>アカウント情報の正確性の維持</li>
                    <li>パスワードの機密保持</li>
                    <li>アカウント下で行われるすべての活動に対する責任</li>
                    <li>不正アクセスの疑いがある場合の速やかな報告</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.3 アカウントの停止・削除</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスは、本規約に違反した場合や、その他当サービスが不適切と判断した場合、
                    事前の通知なく、アカウントの停止または削除を行うことができます。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. サービスの利用</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3.1 利用目的</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスは、留学中・留学希望者・関係者が質問・共有・交流できるコミュニティプラットフォームです。
                    この目的に沿った利用をしてください。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3.2 利用可能な機能</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    当サービスでは、以下の機能を利用できます：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>掲示板への投稿・閲覧・コメント</li>
                    <li>留学日記の作成・共有</li>
                    <li>ユーザー間のチャット</li>
                    <li>コミュニティの作成・参加</li>
                    <li>相談機能の利用</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Ban className="h-6 w-6 mr-2 text-primary-600" />
                4. 禁止行為
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ユーザーは、以下の行為を行ってはなりません：
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>他のユーザーに対する誹謗中傷、脅迫、嫌がらせ、またはプライバシーの侵害</li>
                <li>差別的、攻撃的、または不適切なコンテンツの投稿</li>
                <li>スパム、チェーンメール、または不適切な宣伝・勧誘</li>
                <li>虚偽の情報や誤解を招く情報の投稿</li>
                <li>他者の知的財産権（著作権、商標権など）を侵害する行為</li>
                <li>個人情報の不正な収集・利用</li>
                <li>当サービスの運営を妨害する行為</li>
                <li>他のユーザーのアカウントへの不正アクセス</li>
                <li>自動化された手段による情報の収集（スクレイピングなど）</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 投稿内容</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5.1 投稿の権利</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ユーザーが投稿したコンテンツ（テキスト、画像、動画など）に関する権利は、ユーザーに帰属します。
                    ただし、当サービス上に投稿されたコンテンツについて、当サービスは、サービス提供のために必要な範囲で使用する権利を有します。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5.2 投稿の削除</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスは、本規約に違反する投稿や、その他不適切と判断した投稿を、
                    事前の通知なく削除することができます。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5.3 投稿の責任</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ユーザーは、自身が投稿したコンテンツについて、すべての責任を負います。
                    投稿内容が他者の権利を侵害した場合、ユーザーが責任を負うものとします。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-primary-600" />
                6. 免責事項
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">6.1 サービスの提供</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスは、現状のまま提供され、完全性、正確性、有用性、特定目的への適合性について、
                    いかなる保証も行いません。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">6.2 サービスの中断・変更・終了</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスは、事前の通知なく、サービスの全部または一部の提供を中断、変更、または終了することがあります。
                    これにより生じた損害について、当サービスは責任を負いません。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">6.3 ユーザー間のトラブル</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ユーザー間で生じたトラブルについて、当サービスは一切の責任を負いません。
                    ユーザー間のトラブルは、当事者間で解決してください。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">6.4 情報の正確性</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービス上に投稿された情報の正確性、信頼性、完全性について、
                    当サービスは保証しません。
                    ユーザーは、投稿された情報を自己の責任において判断・利用してください。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 知的財産権</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスのコンテンツ、デザイン、ロゴ、商標などに関する知的財産権は、
                当サービスまたは正当な権利者に帰属します。
                ユーザーは、当サービスの事前の書面による許可なく、これらの知的財産を複製、転載、改変、配布することはできません。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 個人情報の取り扱い</h2>
              <p className="text-gray-700 leading-relaxed">
                個人情報の取り扱いについては、別途定めるプライバシーポリシーに従います。
                プライバシーポリシーは、本規約の一部を構成します。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 規約の変更</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、必要に応じて本規約を変更することができます。
                重要な変更がある場合は、サービス内で通知いたします。
                変更後の規約は、本ページに掲載された時点で効力を生じます。
                変更後に当サービスを利用した場合、変更後の規約に同意したものとみなされます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. 準拠法と管轄裁判所</h2>
              <p className="text-gray-700 leading-relaxed">
                本規約は、日本法に準拠して解釈されます。
                本規約に関する紛争については、当サービスの本店所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-6 w-6 mr-2 text-primary-600" />
                11. お問い合わせ
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本規約に関するご質問やご意見がございましたら、以下の連絡先までお問い合わせください。
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>メールアドレス:</strong> legal@ryugakutalk.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}


