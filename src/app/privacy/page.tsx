import type { Metadata } from 'next'
import { Shield, Lock, Eye, FileText } from 'lucide-react'
import { APP_NAME } from '@/config/app-config'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: `${APP_NAME}のプライバシーポリシー`,
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">プライバシーポリシー</h1>
            <p className="text-lg text-gray-600">
              最終更新日: 2026年1月1日
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
                {APP_NAME}（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
                本プライバシーポリシーは、当サービスがどのように個人情報を収集、使用、保護するかについて説明します。
                当サービスをご利用になることで、本ポリシーに同意したものとみなされます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-primary-600" />
                2. 収集する情報
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1 アカウント情報</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    当サービスでは、アカウント作成時に以下の情報を収集します：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                    <li>メールアドレス（必須）</li>
                    <li>パスワード（暗号化して保存、必須）</li>
                    <li>ユーザー名（必須）</li>
                    <li>アカウントタイプ（個人/教育機関/企業/政府機関）</li>
                    <li>プロフィール情報（任意）：自己紹介、大学名、留学先、専攻、言語、アイコン画像、SNSリンクなど</li>
                    <li>学生ステータス（現役留学生、留学経験者、留学希望者）</li>
                    <li>組織アカウントの場合：組織名、組織タイプ、組織URL、連絡担当者情報、認証用書類など</li>
                    <li>Googleアカウントで登録した場合：Googleから提供される基本情報（名前、メールアドレス、プロフィール画像など）</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.2 利用情報</h3>
                  <p className="text-gray-700 leading-relaxed">
                    サービス利用時に以下の情報が自動的に収集される場合があります：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                    <li>IPアドレス</li>
                    <li>ブラウザの種類とバージョン</li>
                    <li>デバイス情報</li>
                    <li>アクセス日時</li>
                    <li>利用ページ</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.3 投稿内容</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    ユーザーが投稿した内容（テキスト、画像、ファイルなど）は、当サービスの利用目的のために保存されます：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                    <li>投稿内容（タイトル、本文、画像、ファイル、タグ、カテゴリなど）</li>
                    <li>コメント内容</li>
                    <li>チャットメッセージ（1対1メッセージ）</li>
                    <li>コミュニティ情報（コミュニティ名、説明、設定、カバー画像など）</li>
                    <li>イベント情報（イベント名、説明、日時、場所、添付ファイルなど）</li>
                    <li>クエスト情報（クエスト名、説明、完了申請など）</li>
                    <li>安全確認の回答（組織アカウントのみ）</li>
                    <li>いいね、通報などのアクション情報</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.4 AI機能の利用情報</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    AIコンシェルジュ機能を使用した場合、以下の情報が処理されます：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                    <li>質問内容（Google Gemini APIに送信されます）</li>
                    <li>関連投稿の検索結果</li>
                    <li>類似ユーザーの検索結果</li>
                    <li>AIが生成した回答</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    質問内容は、回答生成のためにGoogle Gemini APIに送信されます。
                    詳細については、Googleのプライバシーポリシーもご確認ください。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-primary-600" />
                3. 情報の利用目的
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                収集した情報は、以下の目的で利用します：
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>サービスの提供、維持、改善</li>
                <li>ユーザー認証とアカウント管理</li>
                <li>コミュニティ、イベント、クエスト機能の提供</li>
                <li>AIコンシェルジュ機能の提供（質問への回答生成）</li>
                <li>組織アカウントの認証審査</li>
                <li>ユーザーサポートの提供</li>
                <li>不正利用の防止とセキュリティの確保</li>
                <li>利用規約違反の調査と対応</li>
                <li>サービスに関する重要な通知の送信</li>
                <li>統計データの作成（個人を特定できない形式）</li>
                <li>画像・ファイルの保存と配信（Supabase Storageを使用）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 情報の共有と開示</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">4.1 第三者への提供</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                    <li>ユーザーの同意がある場合</li>
                    <li>法令に基づく開示が求められる場合</li>
                    <li>人の生命、身体または財産の保護のために必要な場合</li>
                    <li>サービスの運営に必要な業務委託先への提供（適切な管理下で）</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4 mb-2">
                    <strong>外部サービスへの情報提供：</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                    <li><strong>Supabase</strong>：ユーザー情報、投稿データ、画像・ファイルはSupabaseのサーバーに保存されます。Supabaseのプライバシーポリシーが適用されます。</li>
                    <li><strong>Google Gemini API</strong>：AIコンシェルジュ機能を使用した場合、質問内容がGoogle Gemini APIに送信されます。Googleのプライバシーポリシーが適用されます。</li>
                    <li><strong>Google OAuth</strong>：Googleアカウントで登録した場合、Googleから提供される基本情報を取得します。Googleのプライバシーポリシーが適用されます。</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">4.2 公開情報</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ユーザーが投稿した内容やプロフィール情報は、当サービスの他のユーザーに公開される場合があります。
                    公開範囲は、ユーザーが設定したプライバシー設定に従います。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. データの保存とセキュリティ</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5.1 データの保存</h3>
                  <p className="text-gray-700 leading-relaxed">
                    個人情報は、適切なセキュリティ対策を講じたサーバーに保存されます。
                    データは、サービス提供に必要な期間保存されます。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5.2 セキュリティ対策</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    当サービスは、個人情報の保護のために以下の対策を講じています：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>SSL/TLSによる通信の暗号化</li>
                    <li>パスワードのハッシュ化（Supabase Authによる安全な保存）</li>
                    <li>Row Level Security (RLS)によるデータベースアクセス制御</li>
                    <li>アクセス制御と監視</li>
                    <li>定期的なセキュリティ監査</li>
                    <li>Supabase Storageによる安全なファイル保存</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5.3 データの保存場所</h3>
                  <p className="text-gray-700 leading-relaxed">
                    個人情報や投稿データは、Supabaseのサーバー（クラウド環境）に保存されます。
                    画像やファイルは、Supabase Storageに保存されます。
                    データの保存場所は、Supabaseの利用規約およびプライバシーポリシーに従います。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. ユーザーの権利</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ユーザーは、以下の権利を有します：
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>個人情報の開示を請求する権利</li>
                <li>個人情報の訂正、削除を請求する権利</li>
                <li>個人情報の利用停止を請求する権利</li>
                <li>アカウントの削除を請求する権利</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                これらの権利を行使したい場合は、設定ページから操作するか、お問い合わせフォームからご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookieとローカルストレージの使用</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">7.1 Cookieの使用</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    当サービスでは、サービス提供のため、以下の目的でCookieを使用します：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>ユーザー認証とセッション管理（Supabase Authによる）</li>
                    <li>ユーザー体験の向上</li>
                    <li>セキュリティの確保</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    ブラウザの設定からCookieを無効にすることもできますが、一部の機能（ログイン状態の維持など）が利用できなくなる場合があります。
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">7.2 ローカルストレージ・セッションストレージの使用</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスでは、サービス提供のため、ブラウザのローカルストレージやセッションストレージを使用する場合があります。
                    これらは、プロフィール情報のキャッシュなど、サービス機能の向上のために使用されます。
                    ブラウザの設定から無効にすることもできますが、一部の機能が正常に動作しなくなる場合があります。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 外部サービスの利用</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">8.1 Supabase</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスは、データベース、認証、ストレージサービスとしてSupabaseを使用しています。
                    ユーザー情報、投稿データ、画像・ファイルは、Supabaseのサーバーに保存されます。
                    Supabaseのプライバシーポリシーおよび利用規約が適用されます。
                    詳細については、<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Supabaseのプライバシーポリシー</a>をご確認ください。
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">8.2 Google Gemini API</h3>
                  <p className="text-gray-700 leading-relaxed">
                    AIコンシェルジュ機能では、Google Gemini APIを使用しています。
                    質問内容は、回答生成のためにGoogle Gemini APIに送信されます。
                    Googleのプライバシーポリシーが適用されます。
                    詳細については、<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Googleのプライバシーポリシー</a>をご確認ください。
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">8.3 Google OAuth</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Googleアカウントで登録・ログインする場合、Google OAuthを使用します。
                    Googleから提供される基本情報（名前、メールアドレス、プロフィール画像など）を取得します。
                    Googleのプライバシーポリシーが適用されます。
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">8.4 外部リンク</h3>
                  <p className="text-gray-700 leading-relaxed">
                    当サービスには、外部サイトへのリンクが含まれる場合があります。
                    当サービスは、外部サイトのプライバシー慣行について責任を負いません。
                    外部サイトを訪問する際は、そのサイトのプライバシーポリシーを確認してください。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 未成年者のプライバシー</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、13歳未満の子供を対象としていません。
                13歳未満の子供の個人情報を意図的に収集することはありません。
                13歳未満の子供の個人情報を収集したことが判明した場合、速やかに削除いたします。
                13歳以上18歳未満の方が当サービスを利用する場合は、保護者の同意を得てからご利用ください。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. データの保持期間</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                当サービスは、以下の期間、個人情報を保持します：
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>アカウント情報：アカウントが削除されるまで、またはサービス終了まで</li>
                <li>投稿内容：投稿が削除されるまで、またはアカウントが削除されるまで</li>
                <li>画像・ファイル：投稿が削除されるまで、またはアカウントが削除されるまで</li>
                <li>ログ情報：セキュリティおよび不正利用防止のため、一定期間保持</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-2">
                アカウントを削除した場合、関連する個人情報は速やかに削除されます。
                ただし、他のユーザーに公開された投稿やコメントについては、削除後も一定期間表示される場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. プライバシーポリシーの変更</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、必要に応じて本プライバシーポリシーを変更する場合があります。
                重要な変更がある場合は、サービス内で通知いたします。
                変更後のプライバシーポリシーは、本ページに掲載された時点で効力を生じます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. お問い合わせ</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                プライバシーポリシーに関するご質問やご意見がございましたら、お問い合わせフォームからご連絡ください。
              </p>
              {process.env.NEXT_PUBLIC_CONTACT_FORM_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_CONTACT_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-block"
                >
                  お問い合わせフォーム
                </a>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}


