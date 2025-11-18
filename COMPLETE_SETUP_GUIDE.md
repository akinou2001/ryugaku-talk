# RyugakuTalk 完全セットアップガイド

## 📋 目次

1. [前提条件](#1-前提条件)
2. [Supabaseプロジェクトの作成](#2-supabaseプロジェクトの作成)
3. [環境変数の設定](#3-環境変数の設定)
4. [データベーススキーマの設定](#4-データベーススキーマの設定)
5. [認証設定](#5-認証設定)
6. [最初の管理者アカウントの作成](#6-最初の管理者アカウントの作成)
7. [動作確認](#7-動作確認)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提条件

### 必要なもの
- ✅ Node.js 18以上がインストールされている
- ✅ npm または yarn がインストールされている
- ✅ Git がインストールされている（オプション）
- ✅ Supabaseアカウント（無料で作成可能）

### 確認方法
```bash
# Node.jsのバージョンを確認
node --version
# v18.0.0 以上であることを確認

# npmのバージョンを確認
npm --version
```

---

## 2. Supabaseプロジェクトの作成

### ステップ1: Supabaseアカウントを作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスで登録

### ステップ2: 新しいプロジェクトを作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力：
   - **Organization**: 既存の組織を選択、または新規作成
   - **Name**: `ryugaku-talk`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（**必ず記録しておく**）
   - **Region**: `Northeast Asia (Tokyo)`（最寄りのリージョン）
3. 「Create new project」をクリック
4. プロジェクトの作成完了を待つ（2-3分）

**重要**: データベースパスワードは後で変更できないため、必ず安全な場所に保存してください。

---

## 3. 環境変数の設定

### ステップ1: API Keysを取得

1. Supabaseダッシュボードの左サイドバーで「Settings」→「API」をクリック
2. 以下の情報をコピー：

#### Project URL
```
例: https://abcdefghijklmnop.supabase.co
```
- 「Project URL」の値をコピー

#### API Keys
```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **anon public** キーをコピー（公開しても安全）
- **service_role** キーをコピー（**絶対に公開しない**）

### ステップ2: .env.localファイルを作成

プロジェクトのルートディレクトリ（`package.json`がある場所）に `.env.local` ファイルを作成します。

**Windowsの場合**:
```powershell
# PowerShellで実行
New-Item -Path .env.local -ItemType File
```

**Mac/Linuxの場合**:
```bash
touch .env.local
```

### ステップ3: 環境変数を設定

`.env.local` ファイルを開き、以下の内容を入力：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here
```

**置き換え方法**:
- `https://your-project-id.supabase.co` → 実際のProject URLに置き換え
- `your_anon_public_key_here` → 実際のanon publicキーに置き換え
- `your_service_role_key_here` → 実際のservice_roleキーに置き換え
- `your_random_secret_string_here` → 任意のランダムな文字列（例: `my-super-secret-key-12345`）

**重要**: 
- `.env.local` ファイルはGitにコミットしないでください（`.gitignore`に含まれています）
- 本番環境（Vercel）では、環境変数を別途設定する必要があります

---

## 4. データベーススキーマの設定

### ステップ1: SQLエディタを開く

1. Supabaseダッシュボードの左サイドバーで「SQL Editor」をクリック
2. 「New query」をクリック

### ステップ2: 基本スキーマを実行

1. `supabase-schema.sql` ファイルの内容をすべてコピー
2. SQLエディタに貼り付け
3. 「Run」ボタンをクリック（または Ctrl+Enter / Cmd+Enter）

**実行結果**:
- ✅ 成功: 「Success. No rows returned」と表示される
- ⚠️ 警告: 既にテーブルが存在する場合はエラーが出る場合がありますが、問題ありません

### ステップ3: 組織アカウント機能のスキーマを実行

1. `supabase-schema-organization-accounts.sql` ファイルの内容をすべてコピー
2. SQLエディタに貼り付け
3. 「Run」ボタンをクリック

**実行結果**:
- ✅ 成功: 「Success. No rows returned」と表示される
- ⚠️ 警告: `IF NOT EXISTS` を使用しているため、既存のカラムがある場合はスキップされます

### ステップ4: 管理者機能のスキーマを実行

1. `supabase-schema-admin.sql` ファイルの内容をすべてコピー
2. SQLエディタに貼り付け
3. 「Run」ボタンをクリック

**実行結果**:
- ✅ 成功: 「Success. No rows returned」と表示される

### ステップ5: テーブルの確認

1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認：
   - ✅ `profiles` - ユーザープロフィール
   - ✅ `posts` - 投稿
   - ✅ `comments` - コメント
   - ✅ `likes` - いいね
   - ✅ `messages` - メッセージ
   - ✅ `reports` - 通報
   - ✅ `organization_verification_requests` - 認証申請

---

## 5. 認証設定

### ステップ1: メール認証の設定

1. 左サイドバーの「Authentication」→「Settings」をクリック
2. 「Auth Settings」セクションで以下を確認・設定：

#### Site URL
```
http://localhost:3000
```

#### Redirect URLs
```
http://localhost:3000/**
https://your-domain.com/**
```

### ステップ2: メール確認の設定（開発環境）

開発環境では、メール確認を無効にしても動作します：

1. 「Enable email confirmations」を**無効**にする
2. これにより、メール確認なしでアカウント作成が可能になります

**本番環境では有効にすることを推奨**

### ステップ3: 認証プロバイダーの確認

1. 「Authentication」→「Providers」をクリック
2. 以下が有効になっていることを確認：
   - ✅ **Email** - メール認証（必須）
   - ❌ **Google** - Google認証（有料プランが必要なため、今回は無効）

---

## 6. 最初の管理者アカウントの作成

### 方法1: 既存ユーザーを管理者にする（推奨）

#### ステップ1: 通常通りアカウントを作成

1. アプリケーションで通常通りアカウントを作成
2. ログインしてプロフィールが作成されることを確認

#### ステップ2: SQLで管理者権限を付与

1. Supabaseダッシュボードの「SQL Editor」を開く
2. 以下のSQLを実行（メールアドレスを実際の値に置き換え）：

```sql
-- 特定のユーザーを管理者にする
UPDATE profiles 
SET is_admin = TRUE,
    is_active = TRUE
WHERE email = 'your-admin-email@example.com';
```

3. 「Run」をクリック
4. 「Success. 1 row updated」と表示されれば成功

### 方法2: Supabaseダッシュボードから直接設定

1. 「Table Editor」→ `profiles`テーブルを開く
2. 管理者にしたいユーザーの行を検索（メールアドレスで検索）
3. `is_admin`カラムを`true`に変更
4. `is_active`カラムを`true`に変更
5. 保存

### 方法3: 新規ユーザーを管理者として作成

1. 通常通りアカウントを作成
2. 上記の方法1または2で管理者権限を付与

---

## 7. 動作確認

### ステップ1: 依存関係のインストール

```bash
npm install
```

### ステップ2: 開発サーバーを起動

```bash
npm run dev
```

**成功時の表示**:
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

### ステップ3: ブラウザで確認

1. [http://localhost:3000](http://localhost:3000) にアクセス
2. エラーが出ないことを確認
3. ホームページが表示されることを確認

### ステップ4: 新規登録をテスト

1. [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) にアクセス
2. アカウントタイプを選択（個人・教育機関・企業・政府機関）
3. 必要情報を入力：
   - お名前（または担当者名）
   - メールアドレス
   - パスワード（6文字以上）
   - 組織アカウントの場合は組織情報も入力
4. 「アカウントを作成」をクリック
5. プロフィールが自動作成されることを確認

### ステップ5: ログインをテスト

1. [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) にアクセス
2. 登録したメールアドレスとパスワードでログイン
3. ログインできることを確認

### ステップ6: プロフィールを確認

1. ヘッダーのユーザーメニューから「プロフィール」をクリック
2. プロフィールページが表示されることを確認
3. 組織アカウントの場合は、バッジが表示されることを確認

### ステップ7: 投稿をテスト

1. [http://localhost:3000/posts/new](http://localhost:3000/posts/new) にアクセス
2. 投稿を作成：
   - カテゴリを選択
   - タイトルを入力
   - 内容を入力
   - タグを入力（任意）
3. 「投稿する」をクリック
4. 投稿が保存され、詳細ページに遷移することを確認

### ステップ8: 管理者ダッシュボードを確認

1. 管理者アカウントでログイン
2. ヘッダーのユーザーメニューから「管理者ダッシュボード」をクリック
3. [http://localhost:3000/admin](http://localhost:3000/admin) にアクセス
4. 統計情報、認証申請、ユーザー管理が表示されることを確認

---

## 8. トラブルシューティング

### エラー: "new row violates row-level security policy"

**原因**: RLSポリシーが正しく設定されていない

**解決方法**:
1. Supabaseダッシュボードで「Authentication」→「Policies」を確認
2. `profiles` テーブルにINSERTポリシーが存在するか確認
3. 存在しない場合は、`supabase-schema.sql` を再実行

### エラー: "Invalid API key"

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. `.env.local` ファイルが正しい場所にあるか確認
2. 環境変数の値が正しいか確認（コピー&ペーストでスペースが入っていないか）
3. 開発サーバーを再起動（`Ctrl+C`で停止してから `npm run dev` で再起動）

### エラー: "relation does not exist"

**原因**: データベーススキーマが実行されていない

**解決方法**:
1. `supabase-schema.sql` をSupabaseのSQLエディタで実行
2. `supabase-schema-organization-accounts.sql` を実行
3. `supabase-schema-admin.sql` を実行
4. すべてのテーブルが作成されているか確認

### エラー: "Configuring Next.js via 'next.config.ts' is not supported"

**原因**: Next.js 14.0.4では`next.config.ts`がサポートされていない

**解決方法**:
- `next.config.js` が存在することを確認（既に修正済み）

### エラー: 管理者ダッシュボードにアクセスできない

**原因**: `is_admin`が`true`に設定されていない

**解決方法**:
1. Supabaseダッシュボードで`profiles`テーブルを確認
2. 該当ユーザーの`is_admin`カラムが`true`になっているか確認
3. ブラウザのキャッシュをクリアして再ログイン

### エラー: 組織アカウントのバッジが表示されない

**原因**: データベーススキーマが適用されていない

**解決方法**:
1. `supabase-schema-organization-accounts.sql` を実行
2. ブラウザのキャッシュをクリア
3. プロフィールを再読み込み

---

## ✅ セットアップ完了チェックリスト

以下の項目をすべて確認してください：

### 基本設定
- [ ] Supabaseプロジェクトが作成されている
- [ ] `.env.local` ファイルが作成され、正しい値が設定されている
- [ ] 開発サーバーが正常に起動する（`npm run dev`）

### データベース
- [ ] `supabase-schema.sql` が実行されている
- [ ] `supabase-schema-organization-accounts.sql` が実行されている
- [ ] `supabase-schema-admin.sql` が実行されている
- [ ] すべてのテーブルが作成されている

### 認証
- [ ] メール認証が有効になっている
- [ ] Site URLが設定されている
- [ ] 新規登録ができる
- [ ] ログインができる

### 機能確認
- [ ] プロフィールが表示される
- [ ] 投稿が作成できる
- [ ] 掲示板で投稿が表示される
- [ ] 検索・フィルタリングが動作する

### 組織アカウント機能
- [ ] 組織アカウントとして登録できる
- [ ] プロフィールに組織情報が表示される
- [ ] バッジが表示される

### 管理者機能
- [ ] 管理者アカウントが作成されている
- [ ] 管理者ダッシュボードにアクセスできる
- [ ] 統計情報が表示される
- [ ] 認証申請が表示される（組織アカウントがある場合）

---

## 📝 次のステップ

セットアップが完了したら：

1. **テストデータの作成**（オプション）
   - サンプル投稿を作成
   - 複数のユーザーアカウントを作成
   - 組織アカウントを作成して認証申請をテスト

2. **本番環境へのデプロイ**
   - Vercelへのデプロイ
   - 環境変数の設定
   - 動作確認

3. **機能の拡張**
   - 通知機能の実装
   - 画像アップロード機能の実装
   - その他の機能追加

---

## 📞 サポート

問題が解決しない場合は：

1. **ブラウザの開発者ツール**（F12）のコンソールでエラーを確認
2. **Supabaseダッシュボード**の「Logs」でエラーを確認
3. **ターミナル**のエラーメッセージを確認
4. エラーメッセージを共有してください

---

## 📚 関連ドキュメント

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase設定の詳細
- [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md) - 管理者機能のセットアップ
- [ORGANIZATION_ACCOUNTS_GUIDE.md](./ORGANIZATION_ACCOUNTS_GUIDE.md) - 組織アカウント機能のガイド
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Vercelデプロイガイド

