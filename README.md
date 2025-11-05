# RyugakuTalk - 留学支援Webプラットフォーム

留学中・留学希望者・関係者が質問・共有・交流できる安全なオンラインコミュニティです。

## 🚀 機能

### MVP機能
- ✅ ユーザー登録・認証（Google/メール）
- ✅ プロフィール編集
- ✅ ゲストユーザー機能（閲覧のみ）
- ✅ 掲示板機能（Q&A / 留学日記）
- ✅ カテゴリー分け
- ✅ 検索・フィルタリング
- ✅ DM・チャット
- ✅ 多言語対応（日本語・英語）
- ✅ 貢献度の可視化

## 🛠 技術スタック

| 分類 | 技術 | 備考 |
|------|------|------|
| フロントエンド | React (Next.js 14) | 高速SSR・多言語対応 |
| UIライブラリ | Tailwind CSS | 軽量で開発効率が高い |
| バックエンド | Next.js API Routes / Supabase | 認証・DB・API連携 |
| データベース | PostgreSQL (Supabase) | スキーマ設計・リアルタイム対応 |
| 認証 | Supabase Auth | Google・Emailログイン対応 |
| デプロイ先 | Vercel | Next.jsと相性が良く、無料枠で十分 |
| 言語 | TypeScript | 型安全な開発 |

## 📋 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd RyugakuTalk
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクトのURLとAPIキーを取得
3. `supabase-schema.sql`の内容をSupabaseのSQLエディタで実行
4. 認証設定でGoogle OAuthを有効化（必要に応じて）

### 5. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認してください。

## 📁 プロジェクト構造

```
RyugakuTalk/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # 認証ページ
│   │   ├── board/             # 掲示板ページ
│   │   ├── globals.css        # グローバルスタイル
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx           # ホームページ
│   ├── components/            # Reactコンポーネント
│   │   ├── Header.tsx         # ヘッダー
│   │   ├── Footer.tsx         # フッター
│   │   ├── Hero.tsx          # ヒーローセクション
│   │   ├── RecentPosts.tsx   # 最近の投稿
│   │   ├── Features.tsx      # 機能紹介
│   │   ├── Providers.tsx     # 認証プロバイダー
│   │   └── LanguageSwitcher.tsx # 言語切替
│   └── lib/
│       ├── supabase.ts       # Supabaseクライアント
│       └── i18n.ts          # 多言語設定
├── supabase-schema.sql        # データベーススキーマ
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 主要機能の説明

### 認証システム
- Supabase Authを使用した認証
- Google OAuthとメール認証に対応
- ゲストユーザーは閲覧のみ可能

### 掲示板機能
- Q&A、留学日記、情報共有の3カテゴリ
- 投稿、コメント、いいね機能
- 検索・フィルタリング機能

### 多言語対応
- 日本語・英語対応
- Next.js i18nを使用
- 動的言語切替

### 貢献度システム
- 回答数、いいね数、継続利用に基づくスコア
- ユーザーのモチベーション維持

## 🚀 デプロイ

### Vercelでのデプロイ
1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. 自動デプロイが開始されます

### 環境変数の設定（本番）
Vercelのダッシュボードで以下の環境変数を設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesでお知らせください。

---

**RyugakuTalk** - 留学コミュニティの未来を築く


