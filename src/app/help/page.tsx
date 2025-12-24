import type { Metadata } from 'next'
import { HelpCircle, MessageCircle, BookOpen, Users, Shield, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ヘルプ - RyugakuTalk',
  description: 'RyugakuTalkの使い方やよくある質問',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">ヘルプセンター</h1>
            <p className="text-lg text-gray-600">
              RyugakuTalkの使い方やよくある質問をご確認ください
            </p>
          </div>

          {/* クイックリンク */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="#getting-started" className="card hover:shadow-md transition-shadow">
              <BookOpen className="h-8 w-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">はじめに</h3>
              <p className="text-gray-600 text-sm">アカウント作成から基本的な使い方まで</p>
            </Link>
            <Link href="#features" className="card hover:shadow-md transition-shadow">
              <MessageCircle className="h-8 w-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">機能ガイド</h3>
              <p className="text-gray-600 text-sm">各機能の詳しい使い方を確認</p>
            </Link>
            <Link href="#faq" className="card hover:shadow-md transition-shadow">
              <Users className="h-8 w-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">よくある質問</h3>
              <p className="text-gray-600 text-sm">よく寄せられる質問と回答</p>
            </Link>
          </div>

          {/* はじめに */}
          <section id="getting-started" className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">はじめに</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. アカウント作成</h3>
                <p className="text-gray-700 mb-2">
                  RyugakuTalkを利用するには、まずアカウントを作成する必要があります。
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>右上の「新規登録」ボタンをクリック</li>
                  <li>メールアドレス、パスワード、ユーザー名を入力</li>
                  <li>メール認証を完了（必要に応じて）</li>
                  <li>プロフィール情報を入力</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. プロフィール設定</h3>
                <p className="text-gray-700 mb-2">
                  プロフィールを充実させることで、他のユーザーとの交流が深まります。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>プロフィール写真を設定</li>
                  <li>留学先の国や都市を登録</li>
                  <li>興味のある分野や専門分野を設定</li>
                  <li>自己紹介文を記入</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. 最初の投稿</h3>
                <p className="text-gray-700 mb-2">
                  掲示板に投稿して、コミュニティに参加しましょう。
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>「投稿する」メニューから新規投稿ページへ</li>
                  <li>タイトルと内容を入力</li>
                  <li>適切なカテゴリを選択</li>
                  <li>投稿を公開</li>
                </ol>
              </div>
            </div>
          </section>

          {/* 機能ガイド */}
          <section id="features" className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">機能ガイド</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">掲示板</h3>
                <p className="text-gray-700 mb-2">
                  掲示板では、質問や情報共有、相談など様々な投稿ができます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>カテゴリ別に投稿を閲覧・検索</li>
                  <li>コメントで他のユーザーと交流</li>
                  <li>いいね機能で投稿を応援</li>
                  <li>ブックマークで後から確認</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">留学日記</h3>
                <p className="text-gray-700 mb-2">
                  留学中の体験や思い出を日記形式で記録・共有できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>日付ごとに日記を投稿</li>
                  <li>写真を添付して記録</li>
                  <li>他のユーザーの日記を閲覧</li>
                  <li>コメントで交流</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">チャット</h3>
                <p className="text-gray-700 mb-2">
                  他のユーザーと1対1でメッセージを交換できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>ユーザープロフィールからチャットを開始</li>
                  <li>リアルタイムでメッセージ交換</li>
                  <li>過去の会話履歴を確認</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">コミュニティ</h3>
                <p className="text-gray-700 mb-2">
                  興味や目的が同じユーザーとコミュニティを作成・参加できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>新しいコミュニティを作成</li>
                  <li>既存のコミュニティに参加</li>
                  <li>コミュニティ内で投稿・交流</li>
                  <li>イベントを企画・参加</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">相談機能</h3>
                <p className="text-gray-700 mb-2">
                  留学に関する相談を投稿し、経験者からアドバイスを受けられます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>相談内容を投稿</li>
                  <li>メンターからアドバイスを受ける</li>
                  <li>相談を解決済みにマーク</li>
                </ul>
              </div>
            </div>
          </section>

          {/* よくある質問 */}
          <section id="faq" className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">よくある質問</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. アカウントを削除したい場合はどうすればいいですか？
                </h3>
                <p className="text-gray-700">
                  A. 設定ページからアカウントを削除できます。アカウントを削除すると、すべてのデータが削除され、復元できませんのでご注意ください。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. パスワードを忘れてしまいました
                </h3>
                <p className="text-gray-700">
                  A. ログインページの「パスワードを忘れた場合」リンクから、メールアドレスを入力してパスワードリセットメールを受信してください。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. 不適切な投稿を見つけました
                </h3>
                <p className="text-gray-700">
                  A. 投稿の報告機能を使用するか、管理者に直接お問い合わせください。適切に対応いたします。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. プライバシー設定はどこで変更できますか？
                </h3>
                <p className="text-gray-700">
                  A. プロフィール設定ページから、プロフィールの公開範囲やメッセージの受信設定などを変更できます。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. メンターになるにはどうすればいいですか？
                </h3>
                <p className="text-gray-700">
                  A. プロフィール設定でメンター登録を申請できます。審査後、メンターとして活動できるようになります。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. コミュニティの作成方法を教えてください
                </h3>
                <p className="text-gray-700">
                  A. 「コミュニティ」ページから「新しいコミュニティを作成」をクリックし、コミュニティ名、説明、設定などを入力して作成できます。
                </p>
              </div>
            </div>
          </section>

          {/* お問い合わせ */}
          <section className="card bg-primary-50 border-primary-200">
            <div className="flex items-start space-x-4">
              <Mail className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">まだ解決しませんか？</h2>
                <p className="text-gray-700 mb-4">
                  上記の情報で解決しない場合は、お気軽にお問い合わせください。
                </p>
                <a
                  href="mailto:support@ryugakutalk.com"
                  className="btn-primary inline-block"
                >
                  お問い合わせ
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


