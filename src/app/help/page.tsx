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
                <h3 className="text-xl font-semibold text-gray-900 mb-3">タイムライン</h3>
                <p className="text-gray-700 mb-2">
                  タイムラインでは、最新の投稿やコミュニティの活動を一覧で確認できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>最新タブ：すべての投稿を時系列で表示</li>
                  <li>コミュニティタブ：参加しているコミュニティの投稿・イベント・クエストを表示</li>
                  <li>検索バーで投稿を検索</li>
                  <li>フィルターでカテゴリ、地域、詳細カテゴリで絞り込み</li>
                  <li>投稿種別：質問、日記、つぶやき、公式投稿</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">投稿機能</h3>
                <p className="text-gray-700 mb-2">
                  質問、日記、つぶやき、公式投稿など様々な種類の投稿ができます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>質問：留学に関する質問を投稿し、解決済みにマーク可能</li>
                  <li>日記：Markdown形式で留学体験を記録（画像最大4枚添付可能）</li>
                  <li>つぶやき：短い投稿で気軽に情報共有</li>
                  <li>公式投稿：組織アカウントが公式情報を発信</li>
                  <li>コメントで他のユーザーと交流</li>
                  <li>いいね機能で投稿を応援</li>
                  <li>共有機能（X（旧Twitter）、URLコピー）</li>
                  <li>通報機能で不適切な投稿を報告</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">留学日記</h3>
                <p className="text-gray-700 mb-2">
                  留学中の体験や思い出を日記形式で記録・共有できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Markdown形式でリッチな文章を作成</li>
                  <li>画像を最大4枚添付可能</li>
                  <li>カバー写真を設定してタイムラインで目立たせる</li>
                  <li>国や大学でフィルタリングして他のユーザーの日記を閲覧</li>
                  <li>コメントで交流</li>
                  <li>日記専用ページで一覧表示</li>
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
                  <li>サークル：個人が作成できるコミュニティ（公開/非公開設定可能）</li>
                  <li>公式コミュニティ：組織アカウントが作成・運営（認証済み組織のみ）</li>
                  <li>コミュニティ内で投稿・交流</li>
                  <li>イベントを企画・参加（日時、場所、参加者管理）</li>
                  <li>クエストを投稿・達成（ポイント報酬あり）</li>
                  <li>コミュニティIDで検索して参加</li>
                  <li>非公開コミュニティはURL共有またはID検索でのみ発見可能</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">マップ機能</h3>
                <p className="text-gray-700 mb-2">
                  投稿を地図上で確認できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>2Dマップ表示：投稿を地図上で確認</li>
                  <li>3D地球儀表示：グローブ形式で投稿を確認</li>
                  <li>地域やカテゴリでフィルタリング</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">通知機能</h3>
                <p className="text-gray-700 mb-2">
                  メッセージ、コメント、いいね、安全確認などの通知を受け取れます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>通知一覧で確認</li>
                  <li>検索バーで通知を検索</li>
                  <li>フィルターで通知タイプで絞り込み（メッセージ、安全確認、コメント、いいねなど）</li>
                  <li>既読/未読の管理</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">組織アカウント</h3>
                <p className="text-gray-700 mb-2">
                  教育機関・企業・政府機関が公式コミュニティを作成・運営できます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>組織アカウントとして登録（認証審査が必要、通常1-3営業日）</li>
                  <li>公式コミュニティを作成・運営</li>
                  <li>公式投稿で公式情報を発信</li>
                  <li>イベントやクエストを開催</li>
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
                  Q. 組織アカウントの認証にはどのくらい時間がかかりますか？
                </h3>
                <p className="text-gray-700">
                  A. 通常1-3営業日で審査が完了します。審査完了後、公式コミュニティの作成や公式投稿が可能になります。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. コミュニティの作成方法を教えてください
                </h3>
                <p className="text-gray-700">
                  A. 「コミュニティ」ページから「新しいコミュニティを作成」をクリックし、コミュニティ名、説明、種別（サークル/公式コミュニティ）、公開設定などを入力して作成できます。組織アカウントのみ公式コミュニティを作成できます。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. 非公開コミュニティに参加するにはどうすればいいですか？
                </h3>
                <p className="text-gray-700">
                  A. 非公開コミュニティは、運営者が共有したURLからアクセスするか、コミュニティIDを検索バーで検索することで発見・参加できます。通常の検索結果には表示されません。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. 日記に画像を添付する方法を教えてください
                </h3>
                <p className="text-gray-700">
                  A. 日記投稿時にMarkdownエディタ内で画像を選択できます。最大4枚まで添付可能です。カバー写真を設定すると、タイムラインで目立つように表示されます。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Q. クエストとは何ですか？
                </h3>
                <p className="text-gray-700">
                  A. コミュニティ内で投稿できる課題やミッションです。達成するとポイントを獲得できます。コミュニティの運営者がクエストを投稿し、メンバーが達成を報告します。
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


