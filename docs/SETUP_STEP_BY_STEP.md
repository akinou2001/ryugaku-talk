# セットアップ手順 - ステップバイステップ

## 🎯 このガイドについて

このガイドでは、RyugakuTalkを最初からセットアップする手順を、画面キャプチャの説明付きで詳しく説明します。

---

## 📋 全体の流れ

```
1. Supabaseプロジェクト作成
   ↓
2. 環境変数の設定
   ↓
3. データベーススキーマの実行（3つのSQLファイル）
   ↓
4. 認証設定
   ↓
5. 管理者アカウントの作成
   ↓
6. 動作確認
```

**所要時間**: 約15-20分

---

## ステップ1: Supabaseプロジェクトの作成

### 1-1. Supabaseにアクセス

1. ブラウザで [https://supabase.com](https://supabase.com) を開く
2. 「Start your project」ボタンをクリック

### 1-2. アカウント作成

1. GitHubアカウントでログイン（推奨）またはメールアドレスで登録
2. 必要に応じてメール確認を行う

### 1-3. プロジェクト作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力：

| 項目 | 値 | 説明 |
|------|-----|------|
| Organization | 既存または新規 | 組織を選択または作成 |
| Name | `ryugaku-talk` | プロジェクト名（任意） |
| Database Password | 強力なパスワード | **必ず記録しておく** |
| Region | `Northeast Asia (Tokyo)` | 最寄りのリージョン |

3. 「Create new project」をクリック
4. プロジェクトの作成完了を待つ（2-3分）

**重要**: データベースパスワードは後で変更できないため、必ず安全な場所に保存してください。

---

## ステップ2: 環境変数の取得と設定

### 2-1. API Keysを取得

1. Supabaseダッシュボードの左サイドバーで「Settings」をクリック
2. 「API」をクリック
3. 以下の情報をコピー：

#### Project URL
```
例: https://abcdefghijklmnop.supabase.co
```
- 「Project URL」の値をコピー

#### API Keys
- **anon public** キーをコピー
  - 「anon public」の横にある「Copy」ボタンをクリック
- **service_role** キーをコピー
  - 「service_role」の横にある「Copy」ボタンをクリック
  - ⚠️ **このキーは絶対に公開しないでください**

### 2-2. .env.localファイルを作成

#### Windowsの場合

1. プロジェクトのルートディレクトリでPowerShellを開く
2. 以下のコマンドを実行：

```powershell
New-Item -Path .env.local -ItemType File
```

または、エクスプローラーで直接作成：
1. プロジェクトフォルダを開く
2. 右クリック → 「新規作成」→ 「テキストドキュメント」
3. ファイル名を `.env.local` に変更（拡張子も含む）

#### Mac/Linuxの場合

```bash
touch .env.local
```

### 2-3. 環境変数を設定

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

1. `https://your-project-id.supabase.co`
   → 実際のProject URLに置き換え
   → 例: `https://abcdefghijklmnop.supabase.co`

2. `your_anon_public_key_here`
   → 実際のanon publicキーに置き換え
   → 例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. `your_service_role_key_here`
   → 実際のservice_roleキーに置き換え

4. `your_random_secret_string_here`
   → 任意のランダムな文字列
   → 例: `my-super-secret-key-12345-abcdefghijklmnop`

**完成例**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=my-super-secret-key-12345-abcdefghijklmnop
```

**重要**: 
- 値の前後にスペースや改行がないか確認
- 引用符（`"`や`'`）は不要
- ファイルを保存

---

## ステップ3: データベーススキーマの実行

### 3-1. SQLエディタを開く

1. Supabaseダッシュボードの左サイドバーで「SQL Editor」をクリック
2. 「New query」をクリック

### 3-2. 基本スキーマを実行

1. `supabase-schema.sql` ファイルを開く
2. ファイルの内容をすべてコピー（Ctrl+A → Ctrl+C）
3. SQLエディタに貼り付け（Ctrl+V）
4. 「Run」ボタンをクリック（または Ctrl+Enter / Cmd+Enter）

**実行結果の確認**:
- ✅ **成功**: 「Success. No rows returned」と表示される
- ⚠️ **警告**: 既にテーブルが存在する場合はエラーが出る場合がありますが、`IF NOT EXISTS`を使用しているため問題ありません

**よくあるエラー**:
- `relation "profiles" already exists` → 既にテーブルが存在する（問題なし）
- `policy "..." already exists` → 既にポリシーが存在する（問題なし）

### 3-3. 組織アカウント機能のスキーマを実行

1. 「New query」をクリック（新しいクエリを作成）
2. `supabase-schema-organization-accounts.sql` ファイルの内容をすべてコピー
3. SQLエディタに貼り付け
4. 「Run」ボタンをクリック

**実行結果**:
- ✅ 成功: 「Success. No rows returned」と表示される
- ⚠️ 警告: `IF NOT EXISTS` を使用しているため、既存のカラムがある場合はスキップされます

### 3-4. 管理者機能のスキーマを実行

1. 「New query」をクリック
2. `supabase-schema-admin.sql` ファイルの内容をすべてコピー
3. SQLエディタに貼り付け
4. 「Run」ボタンをクリック

**実行結果**:
- ✅ 成功: 「Success. No rows returned」と表示される

### 3-5. テーブルの確認

1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認：

| テーブル名 | 説明 |
|-----------|------|
| `profiles` | ユーザープロフィール |
| `posts` | 投稿 |
| `comments` | コメント |
| `likes` | いいね |
| `messages` | メッセージ |
| `reports` | 通報 |
| `organization_verification_requests` | 認証申請 |

3. 各テーブルをクリックして、カラムが正しく作成されているか確認

---

## ステップ4: 認証設定

### 4-1. 認証設定を開く

1. 左サイドバーの「Authentication」をクリック
2. 「Settings」をクリック

### 4-2. Site URLを設定

1. 「Site URL」セクションを確認
2. 以下のように設定：

```
http://localhost:3000
```

3. 「Save」をクリック

### 4-3. Redirect URLsを設定

1. 「Redirect URLs」セクションを確認
2. 以下のURLを追加（「Add URL」ボタンをクリック）：

```
http://localhost:3000/**
```

3. 本番環境のURLも追加（オプション）：
```
https://your-domain.com/**
```

4. 「Save」をクリック

### 4-4. メール確認の設定（開発環境）

1. 「Enable email confirmations」のトグルを**オフ**にする
   - 開発環境では、メール確認なしでアカウント作成が可能になります
2. 「Save」をクリック

**注意**: 本番環境では、セキュリティのためメール確認を有効にすることを推奨します。

### 4-5. 認証プロバイダーの確認

1. 「Authentication」→「Providers」をクリック
2. 以下が有効になっていることを確認：
   - ✅ **Email** - メール認証（必須）
   - ❌ **Google** - Google認証（有料プランが必要なため、今回は無効）

---

## ステップ5: 最初の管理者アカウントの作成

### 5-1. 通常通りアカウントを作成

1. 開発サーバーを起動（まだ起動していない場合）：
   ```bash
   npm run dev
   ```

2. ブラウザで [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) にアクセス
3. アカウントを作成：
   - アカウントタイプ: 個人
   - お名前: 任意（例: 管理者）
   - メールアドレス: 管理者用のメールアドレス（例: `admin@example.com`）
   - パスワード: 強力なパスワード
4. 「アカウントを作成」をクリック
5. ログインできることを確認

### 5-2. 管理者権限を付与

#### 方法A: SQLで設定（推奨）

1. Supabaseダッシュボードの「SQL Editor」を開く
2. 「New query」をクリック
3. 以下のSQLを実行（メールアドレスを実際の値に置き換え）：

```sql
-- 管理者権限を付与
UPDATE profiles 
SET is_admin = TRUE,
    is_active = TRUE
WHERE email = 'admin@example.com';
```

4. 「Run」をクリック
5. 「Success. 1 row updated」と表示されれば成功

#### 方法B: ダッシュボードから設定

1. 「Table Editor」→ `profiles`テーブルを開く
2. 作成したユーザーを検索（メールアドレスで検索）
3. 該当する行をクリック
4. `is_admin`カラムを`true`に変更
5. `is_active`カラムを`true`に変更
6. 「Save」をクリック

### 5-3. 管理者権限の確認

1. ブラウザでアプリケーションにログイン
2. ヘッダーのユーザーメニューをクリック
3. 「管理者ダッシュボード」が表示されることを確認
4. クリックして [http://localhost:3000/admin](http://localhost:3000/admin) にアクセス
5. 管理者ダッシュボードが表示されれば成功

---

## ステップ6: 動作確認

### 6-1. 開発サーバーの起動

```bash
npm run dev
```

**成功時の表示**:
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### 6-2. ホームページの確認

1. ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス
2. エラーが出ないことを確認
3. ホームページが表示されることを確認

### 6-3. 新規登録のテスト

1. [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) にアクセス
2. アカウントタイプを選択
3. 必要情報を入力
4. 「アカウントを作成」をクリック
5. プロフィールが自動作成されることを確認

### 6-4. ログインのテスト

1. [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) にアクセス
2. 登録したメールアドレスとパスワードでログイン
3. ログインできることを確認

### 6-5. 投稿機能のテスト

1. [http://localhost:3000/posts/new](http://localhost:3000/posts/new) にアクセス
2. 投稿を作成
3. 投稿が保存されることを確認

### 6-6. 管理者ダッシュボードの確認

1. 管理者アカウントでログイン
2. [http://localhost:3000/admin](http://localhost:3000/admin) にアクセス
3. 統計情報が表示されることを確認

---

## 🔧 よくある問題と解決方法

### 問題1: 環境変数が読み込まれない

**症状**: 
- `Supabase環境変数が設定されていません` というエラー
- アプリケーションが動作しない

**解決方法**:
1. `.env.local` ファイルが正しい場所にあるか確認（`package.json`と同じディレクトリ）
2. ファイル名が `.env.local` であることを確認（`.env.local.txt` ではない）
3. 環境変数の値にスペースや改行がないか確認
4. 開発サーバーを再起動（`Ctrl+C`で停止してから `npm run dev` で再起動）

### 問題2: RLSポリシーエラー

**症状**: 
- `new row violates row-level security policy` というエラー
- プロフィールが作成できない

**解決方法**:
1. `supabase-schema.sql` を再実行
2. Supabaseダッシュボードで「Authentication」→「Policies」を確認
3. `profiles` テーブルにINSERTポリシーが存在するか確認

### 問題3: テーブルが存在しない

**症状**: 
- `relation "profiles" does not exist` というエラー

**解決方法**:
1. `supabase-schema.sql` をSupabaseのSQLエディタで実行
2. 「Table Editor」でテーブルが作成されているか確認

### 問題4: 管理者ダッシュボードにアクセスできない

**症状**: 
- `/admin` にアクセスしてもリダイレクトされる
- 「管理者ダッシュボード」メニューが表示されない

**解決方法**:
1. Supabaseダッシュボードで`profiles`テーブルを確認
2. 該当ユーザーの`is_admin`カラムが`true`になっているか確認
3. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
4. ログアウトして再ログイン

---

## ✅ セットアップ完了チェックリスト

すべての項目にチェックを入れてください：

### 基本設定
- [ ] Supabaseプロジェクトが作成されている
- [ ] `.env.local` ファイルが作成されている
- [ ] 環境変数が正しく設定されている
- [ ] 開発サーバーが正常に起動する

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

### 機能
- [ ] プロフィールが表示される
- [ ] 投稿が作成できる
- [ ] 掲示板で投稿が表示される
- [ ] 検索・フィルタリングが動作する

### 組織アカウント
- [ ] 組織アカウントとして登録できる
- [ ] プロフィールに組織情報が表示される
- [ ] バッジが表示される

### 管理者機能
- [ ] 管理者アカウントが作成されている
- [ ] 管理者ダッシュボードにアクセスできる
- [ ] 統計情報が表示される

---

## 📞 次のステップ

セットアップが完了したら：

1. **テストデータの作成**
   - 複数のユーザーアカウントを作成
   - サンプル投稿を作成
   - 組織アカウントを作成して認証申請をテスト

2. **本番環境へのデプロイ**
   - [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) を参照
   - Vercelへのデプロイ
   - 環境変数の設定

3. **機能の拡張**
   - 通知機能の実装
   - 画像アップロード機能の実装

---

## 📚 参考資料

- [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) - 完全セットアップガイド
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase設定の詳細
- [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md) - 管理者機能のセットアップ
- [ORGANIZATION_ACCOUNTS_GUIDE.md](./ORGANIZATION_ACCOUNTS_GUIDE.md) - 組織アカウント機能のガイド

