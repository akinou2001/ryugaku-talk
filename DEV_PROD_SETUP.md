# 開発環境と本番環境の切り替えガイド

ローカルホストで開発しながら、本番環境（Vercel）でも動作する設定方法です。

## 📋 解決策の概要

Supabaseの**Redirect URLs**には複数のURLを追加できます。**Site URL**は1つですが、開発環境でも動作するように設定できます。

---

## 🔧 ステップ1: 環境変数を追加

### `.env.local`ファイル（開発環境）

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fujrsewwhmdfryinverw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDYwMjYsImV4cCI6MjA3NjY4MjAyNn0.5ihqpr2oFrbtGFn8ORxG04tQTUDBCMMS3FMrIHCffbY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEwNjAyNiwiZXhwIjoyMDc2NjgyMDI2fQ.nO68c0TLjDsK1GbayntiFm2NcEuxTcBRWbRvTON671Q

# App URL（開発環境）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercelの環境変数（本番環境）

Vercelダッシュボードで以下を追加:

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

（`your-app.vercel.app`は実際のVercelのURLに置き換え）

---

## 🔧 ステップ2: 認証コードを更新（完了）

`src/components/Providers.tsx`の`signInWithGoogle`関数を更新して、環境変数からリダイレクトURLを取得するようにしました。また、認証コールバックページ（`src/app/auth/callback/page.tsx`）も作成しました。

**変更内容**:
- ✅ `signInWithGoogle`関数に`redirectTo`オプションを追加
- ✅ 環境変数`NEXT_PUBLIC_APP_URL`からリダイレクトURLを取得
- ✅ 認証コールバックページを作成（`/auth/callback`）

---

## 🔧 ステップ3: Supabaseの設定

Supabaseダッシュボードで以下を設定:

### URL Configuration

1. **「Authentication」→「URL Configuration」**を開く

2. **「Redirect URLs」**に以下を**両方**追加:
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```
   （`your-app.vercel.app`は実際のVercelのURLに置き換え）

3. **「Site URL」**は本番環境のURLに設定（開発環境でも動作します）:
   ```
   https://your-app.vercel.app
   ```

**重要**: Redirect URLsには複数のURLを追加できるため、開発環境と本番環境の両方を追加してください。

---

## ✅ これで完了！

これで、以下のように動作します：

- ✅ **ローカルホスト（開発）**: `http://localhost:3000`で開発可能
- ✅ **本番環境（Vercel）**: `https://your-app.vercel.app`で動作
- ✅ **Site URLを変更する必要なし**: 本番環境のURLを設定したままで、開発環境でも動作

---

## 🔍 動作確認

### 開発環境での確認

1. `.env.local`に`NEXT_PUBLIC_APP_URL=http://localhost:3000`を設定
2. `npm run dev`で開発サーバーを起動
3. `http://localhost:3000`にアクセス
4. Googleログインが動作することを確認

### 本番環境での確認

1. Vercelで`NEXT_PUBLIC_APP_URL`を本番URLに設定
2. 再デプロイ
3. 本番URLにアクセス
4. Googleログインが動作することを確認

---

## 🆘 トラブルシューティング

### エラー: "Redirect URL mismatch"

→ Supabaseの「Redirect URLs」に該当するURLが追加されているか確認してください。

### ローカルで認証が動作しない

→ `.env.local`に`NEXT_PUBLIC_APP_URL=http://localhost:3000`が設定されているか確認してください。

### 本番環境で認証が動作しない

→ Vercelの環境変数で`NEXT_PUBLIC_APP_URL`が正しく設定されているか確認してください。

