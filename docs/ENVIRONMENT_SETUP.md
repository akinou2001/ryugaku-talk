# 環境分離セットアップガイド

本番環境と開発環境を分離するための完全なガイドです。

## 📋 目次

1. [概要](#概要)
2. [Supabase環境の分離](#supabase環境の分離)
3. [Vercel環境変数の設定](#vercel環境変数の設定)
4. [ローカル開発環境の設定](#ローカル開発環境の設定)
5. [環境変数の確認](#環境変数の確認)
6. [トラブルシューティング](#トラブルシューティング)

## 概要

本アプリケーションでは、以下の3つの環境を分離して管理します：

- **開発環境（Development）**: ローカル開発用（`.env.local`ファイル）
- **プレビュー環境（Preview）**: Vercelのブランチデプロイ用
- **本番環境（Production）**: 本番運用用（VercelのProduction環境）

### 環境分離のメリット

- 開発中のデータが本番データに影響しない
- 本番環境の安全性が向上
- テスト環境での自由な実験が可能
- データベースのパフォーマンス分離

## Supabase環境の分離

### ステップ1: 本番用Supabaseプロジェクトの作成

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: `ryugaku-talk-production`（例）
   - **Database Password**: 強力なパスワードを設定（後で変更不可）
   - **Region**: 最適なリージョンを選択
4. プロジェクトの作成を待つ（2-3分）

### ステップ2: 本番環境のAPIキーを取得

1. 作成した本番プロジェクトのダッシュボードを開く
2. 左サイドバーで「Settings」→「API」をクリック
3. 以下の情報をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（⚠️ 機密情報）

### ステップ3: データベーススキーマの適用

開発環境のスキーマを本番環境に適用します：

**重要**: SQLファイルには実行順序があります。詳細は [SQL_MIGRATION_ORDER.md](./SQL_MIGRATION_ORDER.md) を参照してください。

#### 基本的な実行手順

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `sql/`ディレクトリ内のフォルダを順番に開く（`01-base-schema/` → `02-features/` → ...）
3. 各フォルダ内のREADME.mdを確認して、SQLファイルを順番に実行
4. 各SQLファイルを1つずつ実行し、エラーがないか確認

#### フォルダ構成

SQLファイルは実行順序に基づいて、以下のフォルダに分類されています：

- `sql/01-base-schema/` - ベーススキーマ（必須・最初に実行）
- `sql/02-features/` - 機能追加（必須）
- `sql/03-columns/` - カラム追加（必須）
- `sql/04-storage/` - ストレージ設定（必須）
- `sql/05-rls-policies/` - RLSポリシー修正（必須）
- `sql/06-triggers/` - トリガー・関数（必須）
- `sql/07-constraints/` - 制約・インデックス（推奨）
- `sql/08-data-updates/` - データ更新（本番環境では通常不要）
- `sql/09-admin-setup/` - 管理者アカウント設定（必要に応じて）
- `sql/10-checks/` - 検証・チェック（任意）

各フォルダにはREADME.mdがあり、そのフォルダ内のSQLファイルの説明と実行順序が記載されています。

#### 実行順序の概要

- **Phase 1**: ベーススキーマ（必須）- `supabase-schema.sql`など
- **Phase 2-6**: 機能追加と修正（必須）
- **Phase 7**: 制約・インデックス（推奨）
- **Phase 8**: データ更新（本番環境では通常不要）
- **Phase 9**: 管理者アカウント設定（必要に応じて）

**重要**: 本番環境に適用する前に、必ず開発環境でテストしてください。

### ステップ4: RLSポリシーの確認

本番環境でも開発環境と同じRLS（Row Level Security）ポリシーが適用されているか確認します。

1. 本番環境のSupabaseダッシュボードで「Authentication」→「Policies」を確認
2. 各テーブルのポリシーが正しく設定されているか確認

詳細は [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) を参照してください。

### ステップ5: 認証設定の移行（重要）

**重要**: 認証設定（Googleログイン、メール認証など）は、本番環境のSupabaseプロジェクトに個別に設定する必要があります。

1. 開発環境の認証設定を確認
2. 本番環境に同じ設定を適用

詳細な手順は [AUTH_MIGRATION_GUIDE.md](./AUTH_MIGRATION_GUIDE.md) を参照してください。

## Vercel環境変数の設定

### ステップ1: Vercelダッシュボードにアクセス

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択

### ステップ2: 環境変数の設定

1. プロジェクトの「Settings」→「Environment Variables」を開く
2. 以下の環境変数を各環境に設定：

#### Production環境（本番環境）

```
NEXT_PUBLIC_SUPABASE_URL=https://[本番プロジェクトID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[本番用anon key]
SUPABASE_SERVICE_ROLE_KEY=[本番用service role key]
NEXT_PUBLIC_APP_URL=https://ryugakutalk.com
NEXT_PUBLIC_SITE_URL=https://ryugakutalk.com
NEXT_PUBLIC_SITE_DOMAIN=ryugakutalk.com
NEXT_PUBLIC_CONTACT_EMAIL=contact@ryugakutalk.com
NEXTAUTH_URL=https://ryugakutalk.com
NEXTAUTH_SECRET=[本番用のランダムなシークレット]
OPENAI_API_KEY=[本番用OpenAI API key]
DASHSCOPE_API_KEY=[本番用DashScope API key]
```

#### Preview環境（ブランチデプロイ）

Preview環境では、開発環境または本番環境の設定を使用できます。
テスト目的の場合は開発環境の設定、本番環境のテストの場合は本番環境の設定を使用してください。

#### Development環境（Vercel CLI用）

Vercel CLIでローカル開発する場合に使用されます。通常は`.env.local`を使用するため、設定は任意です。

### ステップ3: 環境変数の適用

1. 各環境変数を追加する際、「Environment」で適用先を選択：
   - ✅ Production（本番環境のみ）
   - ✅ Preview（プレビュー環境）
   - ✅ Development（開発環境、オプション）

2. 「Save」をクリック

3. **重要**: 環境変数を追加・変更した後は、デプロイを再実行してください

## ローカル開発環境の設定

### ステップ1: `.env.local`ファイルの確認

プロジェクトのルートディレクトリに`.env.local`ファイルがあることを確認します。

```bash
# Windows (PowerShell)
Test-Path .env.local

# Mac/Linux
test -f .env.local
```

### ステップ2: 開発環境用の設定

`.env.local`ファイルに開発用Supabaseプロジェクトの認証情報を設定します：

```env
# 開発環境用Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://[開発プロジェクトID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[開発用anon key]
SUPABASE_SERVICE_ROLE_KEY=[開発用service role key]

# 開発環境用URL設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_DOMAIN=localhost

# その他の設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[開発用のランダムなシークレット]
OPENAI_API_KEY=[開発用OpenAI API key]
DASHSCOPE_API_KEY=[開発用DashScope API key]
```

**重要**: `.env.local`ファイルはGitにコミットされません（`.gitignore`で除外済み）

### ステップ3: 環境変数の確認

設定が正しいか確認します：

```bash
npm run check-env
```

または、本番環境の設定を確認する場合：

```bash
npm run check-env -- --env=prod
```

## 環境変数の確認

### ローカル開発環境の確認

```bash
npm run check-env
```

このコマンドは`.env.local`ファイルから環境変数を読み込み、必須項目が設定されているか確認します。

### 本番環境の確認

Vercelにデプロイ後、以下の方法で環境変数が正しく設定されているか確認できます：

1. Vercelダッシュボードの「Deployments」で最新のデプロイを確認
2. デプロイログで環境変数の読み込みエラーがないか確認
3. アプリケーションの動作を確認

### 環境変数チェックスクリプトの詳細

`scripts/check-env.ts`を使用して、環境変数を検証できます：

```bash
# 開発環境のチェック（.env.localから読み込み）
npm run check-env

# 本番環境のチェック（現在の環境変数から読み込み）
npm run check-env -- --env=prod
```

## トラブルシューティング

### 問題1: 環境変数が読み込まれない

**症状**: アプリケーションで環境変数が`undefined`になる

**解決方法**:
1. `.env.local`ファイルがプロジェクトのルートディレクトリにあるか確認
2. 環境変数名が正しいか確認（`NEXT_PUBLIC_`プレフィックスが必要な場合がある）
3. 開発サーバーを再起動（`npm run dev`）
4. Vercelの場合は、環境変数を設定後に再デプロイ

### 問題2: 本番環境で開発環境のデータベースに接続している

**症状**: 本番環境で開発環境のデータが表示される

**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. `NEXT_PUBLIC_SUPABASE_URL`が本番用プロジェクトのURLになっているか確認
3. Production環境にのみ適用されているか確認

### 問題3: 環境変数の優先順位が分からない

Next.jsの環境変数の優先順位：

1. `process.env`（システム環境変数）
2. `.env.local`（ローカル開発環境、Gitにコミットされない）
3. `.env.development` / `.env.production`（環境別設定）
4. `.env`（デフォルト設定）

Vercelでは、Vercelダッシュボードで設定した環境変数が最優先されます。

### 問題4: 本番環境のSupabaseプロジェクトにスキーマが適用されていない

**解決方法**:
1. `sql/`ディレクトリ内のSQLファイルを確認
2. 本番環境のSupabaseダッシュボードで「SQL Editor」を開く
3. 開発環境と同じSQLを実行
4. テーブルとRLSポリシーが正しく作成されているか確認

## ベストプラクティス

### 1. 環境ごとに異なるSupabaseプロジェクトを使用

開発環境と本番環境で同じSupabaseプロジェクトを使用すると、以下のリスクがあります：
- 開発中のデータが本番データに影響する
- 本番環境のパフォーマンスが低下する
- セキュリティリスクが増加する

**推奨**: 必ず別々のプロジェクトを使用してください。

### 2. 環境変数の機密情報管理

- `.env.local`ファイルはGitにコミットしない（既に`.gitignore`で除外済み）
- Vercelの環境変数は適切な権限管理を行う
- `service_role`キーは絶対に公開しない

### 3. 定期的な環境変数の確認

- デプロイ前に環境変数が正しく設定されているか確認
- `npm run check-env`を定期的に実行
- Vercelダッシュボードで環境変数を定期的に確認

### 4. データベースのバックアップ

本番環境のSupabaseプロジェクトでは、定期的なバックアップを設定してください：
1. Supabaseダッシュボードで「Database」→「Backups」を開く
2. 自動バックアップを有効化
3. 必要に応じて手動バックアップを実行

## 関連ドキュメント

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabaseの詳細な設定手順
- [SQL_MIGRATION_ORDER.md](./SQL_MIGRATION_ORDER.md) - SQLファイルの実行順序ガイド（**重要**）
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - デプロイガイド
- [env.example](../env.example) - 環境変数のテンプレート

## サポート

問題が解決しない場合は、以下を確認してください：

1. 環境変数が正しく設定されているか（`npm run check-env`）
2. Vercelのデプロイログにエラーがないか
3. Supabaseダッシュボードでプロジェクトが正常に動作しているか
