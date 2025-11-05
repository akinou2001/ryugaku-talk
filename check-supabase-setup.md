# Supabase設定確認チェックリスト

## 🔍 現在の設定状態を確認

### 1. 環境変数の確認

#### .env.localファイルの確認
プロジェクトのルートディレクトリに `.env.local` ファイルがあるか確認：

```bash
# ファイルが存在するか確認（PowerShell）
Test-Path .env.local
```

**必要な環境変数**:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - SupabaseプロジェクトのURL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon publicキー
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - service_roleキー（オプション）
- ✅ `NEXTAUTH_URL` - `http://localhost:3000`
- ✅ `NEXTAUTH_SECRET` - 任意の文字列

**確認方法**:
1. `.env.local` ファイルを開く
2. 各変数に値が設定されているか確認
3. `your_...` というプレースホルダーが残っていないか確認

---

### 2. Supabaseダッシュボードでの確認

#### プロジェクトの存在確認
1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト一覧に `ryugaku-talk` または作成したプロジェクト名があるか確認

#### テーブルの確認
1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが存在するか確認：
   - ✅ `profiles`
   - ✅ `posts`
   - ✅ `comments`
   - ✅ `likes`
   - ✅ `messages`
   - ✅ `reports`

#### RLSポリシーの確認
1. 左サイドバーの「Authentication」→「Policies」をクリック
2. `profiles` テーブルを選択
3. 以下のポリシーが存在するか確認：
   - ✅ `プロフィールは誰でも閲覧可能` (SELECT)
   - ✅ `ユーザーは自分のプロフィールを更新可能` (UPDATE)
   - ✅ `ユーザーは自分のプロフィールを挿入可能` (INSERT)

---

### 3. 接続テスト

#### 開発サーバーでの確認
1. ターミナルで以下を実行：
```bash
npm run dev
```

2. ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス
3. エラーが出ないか確認

#### ブラウザのコンソールで確認
1. ブラウザの開発者ツール（F12）を開く
2. 「Console」タブを選択
3. エラーメッセージがないか確認
4. 特に以下のエラーがないか確認：
   - ❌ `Invalid API key`
   - ❌ `Failed to fetch`
   - ❌ `new row violates row-level security policy`

---

### 4. 認証機能のテスト

#### 新規登録のテスト
1. [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) にアクセス
2. メールアドレス、パスワード、名前を入力
3. 「アカウントを作成」をクリック
4. エラーが出ないか確認

**成功の目安**:
- ✅ エラーが出ない
- ✅ プロフィールページにリダイレクトされる（またはホームページ）
- ✅ ヘッダーにユーザー名が表示される

#### ログインのテスト
1. [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) にアクセス
2. 登録したメールアドレスとパスワードでログイン
3. ログインできることを確認

---

### 5. データベース操作のテスト

#### プロフィール編集のテスト
1. ログイン後、プロフィールページにアクセス
2. 「編集」ボタンをクリック
3. プロフィール情報を編集
4. 「保存」をクリック
5. 変更が保存されることを確認

#### 投稿作成のテスト
1. [http://localhost:3000/posts/new](http://localhost:3000/posts/new) にアクセス
2. 投稿を作成
3. 「投稿する」をクリック
4. 投稿が保存されることを確認

---

## 🛠️ 問題が見つかった場合

### 環境変数が設定されていない
→ `SUPABASE_SETUP.md` の「2. 環境変数の取得」を参照

### テーブルが存在しない
→ `SUPABASE_SETUP.md` の「3. データベーススキーマの設定」を参照

### RLSポリシーエラー
→ `SUPABASE_SETUP.md` の「4. RLSポリシーの確認」を参照

### 認証エラー
→ `SUPABASE_SETUP.md` の「5. 認証設定の確認」を参照

---

## 📝 確認結果の記録

以下の項目をチェックして、問題があれば記録してください：

- [ ] `.env.local` ファイルが存在する
- [ ] 環境変数が正しく設定されている
- [ ] Supabaseプロジェクトが存在する
- [ ] 必要なテーブルがすべて存在する
- [ ] RLSポリシーが正しく設定されている
- [ ] 開発サーバーが正常に起動する
- [ ] 新規登録ができる
- [ ] ログインができる
- [ ] プロフィール編集ができる
- [ ] 投稿作成ができる

**問題があった項目**: 
（記録してください）

**エラーメッセージ**:
（記録してください）
