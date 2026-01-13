# Supabase設定ガイド - 完全版

## 📋 目次
1. [Supabaseプロジェクトの作成](#1-supabaseプロジェクトの作成)
2. [環境変数の取得](#2-環境変数の取得)
3. [データベーススキーマの設定](#3-データベーススキーマの設定)
4. [RLSポリシーの確認](#4-rlsポリシーの確認)
5. [認証設定の確認](#5-認証設定の確認)
6. [動作確認](#6-動作確認)

---

## 1. Supabaseプロジェクトの作成

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

---

## 2. 環境変数の取得

### ステップ1: API Keysを取得
1. 左サイドバーの「Settings」→「API」をクリック
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
プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の内容を入力：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here
```

**重要**: 
- `your-project-id` を実際のProject URLに置き換え
- `your_anon_public_key_here` を実際のanon publicキーに置き換え
- `your_service_role_key_here` を実際のservice_roleキーに置き換え
- `your_random_secret_string_here` は任意のランダムな文字列（例: `my-super-secret-key-12345`）

---

## 3. データベーススキーマの設定

### ステップ1: SQLエディタを開く
1. Supabaseダッシュボードの左サイドバーで「SQL Editor」をクリック
2. 「New query」をクリック

### ステップ2: スキーマを実行
1. `supabase-schema.sql` ファイルの内容をすべてコピー
2. SQLエディタに貼り付け
3. 「Run」ボタンをクリック（または Ctrl+Enter）

### ステップ3: 実行結果を確認
- ✅ 成功: 「Success. No rows returned」と表示される
- ❌ エラー: エラーメッセージを確認

#### よくあるエラー
- `relation "profiles" already exists`: テーブルが既に存在する（問題なし）
- `policy "..." already exists`: ポリシーが既に存在する（問題なし）

**注意**: 既存のテーブルがある場合は、エラーが出る可能性がありますが、既に設定済みなら問題ありません。

---

## 4. RLSポリシーの確認

### ステップ1: ポリシーを確認
1. 左サイドバーの「Authentication」→「Policies」をクリック
2. `profiles` テーブルを選択
3. 以下のポリシーが存在することを確認：

#### profiles テーブルのポリシー
- ✅ `プロフィールは誰でも閲覧可能` (SELECT)
- ✅ `ユーザーは自分のプロフィールを更新可能` (UPDATE)
- ✅ `ユーザーは自分のプロフィールを挿入可能` (INSERT)

### ステップ2: ポリシーが存在しない場合
以下のSQLを実行：

```sql
-- profiles テーブルのポリシー
DROP POLICY IF EXISTS "プロフィールは誰でも閲覧可能" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールを挿入可能" ON profiles;

CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のプロフィールを更新可能" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "ユーザーは自分のプロフィールを挿入可能" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### ステップ3: 他のテーブルのポリシーも確認
以下のテーブルも同様にポリシーが設定されているか確認：
- `posts` (投稿)
- `comments` (コメント)
- `likes` (いいね)
- `messages` (メッセージ)
- `reports` (通報)

---

## 5. 認証設定の確認

### ステップ1: メール認証の設定
1. 左サイドバーの「Authentication」→「Settings」をクリック
2. 「Auth Settings」セクションで以下を確認：
   - ✅ **Enable email confirmations**: 開発環境では無効でもOK
   - ✅ **Site URL**: `http://localhost:3000`
   - ✅ **Redirect URLs**: `http://localhost:3000/**`

### ステップ2: メール設定（オプション）
開発環境では、メール確認を無効にしても動作します：
1. 「Enable email confirmations」を無効にする
2. テスト用のメールアドレスで登録できるようになります

### ステップ3: Google認証の設定（オプション）

Googleアカウントでのログイン・登録を有効にする場合：

1. **Google Cloud ConsoleでOAuth認証情報を作成**
   - [Google Cloud Console](https://console.cloud.google.com/)にアクセス
   - プロジェクトを作成（または既存のプロジェクトを選択）
   - 「APIとサービス」→「認証情報」を開く
   - 「認証情報を作成」→「OAuth 2.0 クライアント ID」を選択
   - アプリケーションの種類: 「ウェブアプリケーション」
   - 承認済みのリダイレクト URI に以下を追加：
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
     （`your-project-id`はSupabaseのプロジェクトID）

2. **SupabaseでGoogle認証を有効化**
   - Supabaseダッシュボード → 「Authentication」→ 「Providers」を開く
   - 「Google」を有効にする
   - 「Client ID」と「Client Secret」を入力（Google Cloud Consoleで取得した値）
   - 「Save」をクリック

3. **リダイレクトURLの設定**
   - 「Authentication」→「URL Configuration」を開く
   - 「Redirect URLs」に以下を追加：
     ```
     http://localhost:3000/auth/callback
     https://your-app.vercel.app/auth/callback
     ```
     （本番環境のURLがある場合）

**注意**: 開発環境では`http://localhost:3000/auth/callback`を、本番環境では実際のURLを設定してください。

---

## 6. 動作確認

### ステップ1: 開発サーバーを起動
```bash
npm run dev
```

### ステップ2: ブラウザで確認
1. [http://localhost:3000](http://localhost:3000) にアクセス
2. エラーが出ないことを確認

### ステップ3: 新規登録をテスト
1. [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) にアクセス
2. メールアドレス、パスワード、名前を入力
3. 「アカウントを作成」をクリック
4. プロフィールが自動作成されることを確認

### ステップ4: ログインをテスト
1. [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) にアクセス
2. 登録したメールアドレスとパスワードでログイン
3. ログインできることを確認

### ステップ5: プロフィールを確認
1. ヘッダーのユーザーメニューから「プロフィール」をクリック
2. プロフィールページが表示されることを確認

### ステップ6: 投稿をテスト
1. [http://localhost:3000/posts/new](http://localhost:3000/posts/new) にアクセス
2. 投稿を作成
3. 投稿が保存されることを確認

---

## 🔧 トラブルシューティング

### エラー: "new row violates row-level security policy"
**原因**: RLSポリシーが正しく設定されていない

**解決方法**:
1. Supabaseダッシュボードで「Authentication」→「Policies」を確認
2. `profiles` テーブルにINSERTポリシーが存在するか確認
3. 存在しない場合は、上記のステップ4でポリシーを作成

### エラー: "Invalid API key"
**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. `.env.local` ファイルが正しい場所にあるか確認
2. 環境変数の値が正しいか確認
3. 開発サーバーを再起動

### エラー: "relation does not exist"
**原因**: データベーススキーマが実行されていない

**解決方法**:
1. `supabase-schema.sql` をSupabaseのSQLエディタで実行
2. すべてのテーブルが作成されているか確認

---

## ✅ チェックリスト

設定が完了したら、以下を確認：

- [ ] Supabaseプロジェクトが作成されている
- [ ] `.env.local` ファイルが作成され、正しい値が設定されている
- [ ] データベーススキーマが実行されている
- [ ] RLSポリシーが正しく設定されている
- [ ] 認証設定が完了している
- [ ] 開発サーバーが正常に起動する
- [ ] 新規登録ができる
- [ ] ログインができる
- [ ] プロフィールが表示される
- [ ] 投稿が作成できる

---

## 📞 サポート

問題が解決しない場合は：
1. ブラウザの開発者ツール（F12）のコンソールでエラーを確認
2. Supabaseダッシュボードの「Logs」でエラーを確認
3. エラーメッセージを共有してください
