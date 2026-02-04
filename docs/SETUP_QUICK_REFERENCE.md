# セットアップ クイックリファレンス

## 🚀 5分で始める

### 1. Supabaseプロジェクト作成
```
1. https://supabase.com にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力して作成
```

### 2. 環境変数の設定
```bash
# .env.local ファイルを作成
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
```

### 3. データベーススキーマの実行
```
Supabaseダッシュボード → SQL Editor で以下を順番に実行：
1. supabase-schema.sql
2. supabase-schema-organization-accounts.sql
3. supabase-schema-admin.sql
```

### 4. 認証設定
```
Authentication → Settings:
- Site URL: http://localhost:3000
- Enable email confirmations: OFF (開発環境)
```

### 5. 管理者アカウント作成
```sql
-- SQL Editor で実行
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'your-admin-email@example.com';
```

### 6. 起動
```bash
npm install
npm run dev
```

---

## 📋 実行順序チェックリスト

- [ ] Supabaseプロジェクト作成
- [ ] 環境変数を取得（Project URL, anon key, service_role key）
- [ ] `.env.local` ファイル作成・設定
- [ ] `supabase-schema.sql` 実行
- [ ] `supabase-schema-organization-accounts.sql` 実行
- [ ] `supabase-schema-admin.sql` 実行
- [ ] 認証設定（Site URL, Redirect URLs）
- [ ] メール確認を無効化（開発環境）
- [ ] アカウント作成
- [ ] 管理者権限を付与
- [ ] `npm install`
- [ ] `npm run dev`
- [ ] 動作確認

---

## 🔑 必要な情報

### Supabaseから取得
- Project URL
- anon public key
- service_role key

### 自分で設定
- NEXTAUTH_SECRET（任意のランダムな文字列）

---

## ⚡ よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# ローカルホストのみ（他のPCからアクセス不可）
npm run dev:local

# ビルド
npm run build

# 本番サーバー起動
npm start
```

---

## 🐛 トラブルシューティング

| エラー | 解決方法 |
|--------|----------|
| 環境変数が設定されていません | `.env.local` を確認、サーバー再起動 |
| RLSポリシーエラー | `supabase-schema.sql` を再実行 |
| テーブルが存在しない | スキーマファイルを実行 |
| 管理者ダッシュボードにアクセスできない | `is_admin = TRUE` を確認 |

---

詳細は [SETUP_STEP_BY_STEP.md](./SETUP_STEP_BY_STEP.md) を参照

