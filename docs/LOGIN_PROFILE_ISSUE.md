# ログイン後のプロフィール問題の解決方法

ログインは成功しているが、プロフィールが存在しないため正常に動作しない問題の解決方法です。

## 🔍 問題の症状

- ログインは成功している（Supabaseダッシュボードで確認済み）
- しかし、アプリケーションではログイン状態が反映されない
- 通常のLP（ランディングページ）に戻る

## 📋 原因

ログインは成功していますが、`profiles`テーブルにプロフィールが存在しない可能性があります。

アプリケーションは、認証成功後にプロフィールを取得しようとしますが、プロフィールが存在しない場合は自動的に作成しようとします。しかし、何らかの理由でプロフィール作成に失敗している可能性があります。

## 🔧 解決方法

### 方法1: Supabaseダッシュボードでプロフィールを確認・作成

1. **本番環境のSupabaseダッシュボード**で「Table Editor」を開く
2. **`profiles`テーブル**を選択
3. **ユーザーIDで検索**：
   - ユーザーID: `40b51cf8-11b9-407d-aa7c-af984feba2c7`
   - または、メールアドレス: `akinou2001@gmail.com`で検索

4. **プロフィールが存在しない場合**：
   - 「Insert row」をクリック
   - 以下の情報を入力：
     ```sql
     id: 40b51cf8-11b9-407d-aa7c-af984feba2c7
     email: akinou2001@gmail.com
     name: [お好みの名前]
     account_type: individual
     contribution_score: 0
     languages: []
     verification_status: unverified
     is_admin: false
     is_active: true
     ```
   - 「Save」をクリック

### 方法2: SQLでプロフィールを作成

Supabaseダッシュボードの「SQL Editor」で以下を実行：

```sql
-- プロフィールが存在しない場合のみ作成
INSERT INTO profiles (
  id,
  email,
  name,
  account_type,
  contribution_score,
  languages,
  verification_status,
  is_admin,
  is_active
)
VALUES (
  '40b51cf8-11b9-407d-aa7c-af984feba2c7',
  'akinou2001@gmail.com',
  'ユーザー',  -- お好みの名前に変更してください
  'individual',
  0,
  '{}',
  'unverified',
  false,
  true
)
ON CONFLICT (id) DO NOTHING;
```

### 方法3: ブラウザのコンソールでエラーを確認

1. **ブラウザの開発者ツール**（F12）を開く
2. **Consoleタブ**を開く
3. **ログインボタンをクリック**
4. **エラーメッセージを確認**
   - `Error creating profile` などのエラーが表示されていないか確認
   - エラーメッセージの内容をメモしてください

## ✅ 確認手順

プロフィールを作成した後、以下を確認してください：

1. **Supabaseダッシュボードでプロフィールが作成されたか確認**
   - 「Table Editor」→「profiles」テーブル
   - ユーザーIDで検索して、プロフィールが存在するか確認

2. **ブラウザで再度ログインを試す**
   - ログアウトしてから再度ログイン
   - 正常にログインできるか確認

3. **ログイン後の動作を確認**
   - タイムラインにリダイレクトされるか確認
   - ユーザーメニューが表示されるか確認

## 🔍 デバッグ方法

### ブラウザのコンソールでログを確認

1. ブラウザの開発者ツール（F12）を開く
2. Consoleタブを開く
3. ログインボタンをクリック
4. 以下のようなログが表示されるか確認：
   - `Creating profile for user: ...`
   - `Profile created successfully`
   - または、エラーメッセージ

### ネットワークタブでリクエストを確認

1. ブラウザの開発者ツール（F12）を開く
2. Networkタブを開く
3. ログインボタンをクリック
4. Supabaseへのリクエストを確認
5. プロフィール作成のリクエストが成功しているか確認

## ⚠️ 注意事項

- プロフィールを作成する際、`id`は必ずユーザーID（`40b51cf8-11b9-407d-aa7c-af984feba2c7`）と一致させる必要があります
- プロフィールが既に存在する場合は、`ON CONFLICT DO NOTHING`によりエラーになりません
- プロフィール作成後、ブラウザを再読み込みするか、一度ログアウトしてから再度ログインしてください

## 🔗 関連ドキュメント

- [LOGIN_TROUBLESHOOTING.md](./LOGIN_TROUBLESHOOTING.md) - ログイン問題のトラブルシューティング
- [AUTH_MIGRATION_GUIDE.md](./AUTH_MIGRATION_GUIDE.md) - 認証設定の移行ガイド
