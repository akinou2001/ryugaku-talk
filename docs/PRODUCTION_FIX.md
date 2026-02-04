# 🔧 本番環境でローカルホストにリダイレクトされる問題の修正

## ✅ 実施した修正

### コードの修正
`src/components/Providers.tsx`の`signInWithGoogle`関数を修正しました。

**変更内容**:
- `window.location.origin`を最優先で使用するように変更
- これにより、現在アクセスしているドメイン（`ryugakutalk.com`）が自動的に使用されます
- 環境変数に依存せず、ブラウザの現在のURLを使用するため、より確実です

## 🔍 確認すべき点

### 1. Vercelで再デプロイを実行

コードを修正したので、Vercelで再デプロイが必要です：

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Fix OAuth redirect URL for production"
   git push
   ```

2. **Vercelで自動デプロイを確認**
   - Vercelダッシュボードでデプロイが自動的に開始されます
   - デプロイが完了するまで待ちます（2-3分）

### 2. Supabaseの設定を確認

Supabaseダッシュボードで以下を確認してください：

1. **Authentication → URL Configuration**
2. **Site URL** が以下に設定されているか：
   ```
   https://ryugakutalk.com
   ```
3. **Redirect URLs** に以下が含まれているか：
   ```
   https://ryugakutalk.com/**
   https://ryugakutalk.com/auth/callback
   http://localhost:3000/auth/callback
   ```
   （開発環境用のlocalhostも残しておくと便利です）

### 3. ブラウザのキャッシュをクリア

古いJavaScriptがキャッシュされている可能性があります：

1. **ハードリフレッシュを実行**
   - Windows/Linux: `Ctrl + Shift + R` または `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **シークレットモードでテスト**
   - 新しいシークレットウィンドウを開く
   - `https://ryugakutalk.com` にアクセス
   - ログインを試す

### 4. デバッグログを確認

ブラウザのコンソール（F12）で以下を確認：

1. **開発者ツールを開く**（F12）
2. **Consoleタブを開く**
3. **Googleログインボタンをクリック**
4. **以下のログが表示されるか確認**：
   ```
   OAuth redirect URL: https://ryugakutalk.com/auth/callback
   ```
   - もし `http://localhost:3000/auth/callback` と表示される場合は、まだ古いコードが実行されています
   - その場合は、再デプロイを確認してください

## 🐛 トラブルシューティング

### まだローカルホストにリダイレクトされる場合

#### 1. デプロイが完了しているか確認
- Vercelダッシュボードで最新のデプロイメントを確認
- 「Ready」と表示されているか確認

#### 2. ブラウザのキャッシュを完全にクリア
- ブラウザの設定からキャッシュをクリア
- または、シークレットモードでテスト

#### 3. Supabaseの設定を再確認
- Supabaseダッシュボードで「Redirect URLs」を確認
- `https://ryugakutalk.com/**` が含まれているか確認
- 保存後、数分待ってから再試行

#### 4. 環境変数を確認（オプション）
Vercelダッシュボードで以下を確認：
- `NEXT_PUBLIC_APP_URL` が `https://ryugakutalk.com` に設定されているか
- 設定後、再デプロイを実行

**注意**: 今回の修正により、`NEXT_PUBLIC_APP_URL`が設定されていなくても、`window.location.origin`を使用するため、環境変数は必須ではありません。ただし、設定しておくとサーバーサイドでも正しいURLを使用できます。

### エラーメッセージが表示される場合

ブラウザのコンソール（F12）でエラーメッセージを確認：

- **`redirect_uri_mismatch`**: Supabaseの「Redirect URLs」に `https://ryugakutalk.com/auth/callback` が登録されていない
- **`Invalid redirect URL`**: Supabaseの「Site URL」が正しく設定されていない

## ✅ 動作確認手順

1. **ブラウザで `https://ryugakutalk.com` にアクセス**
2. **ログインページに移動** (`/auth/signin`)
3. **「Googleでログイン」をクリック**
4. **Googleアカウントを選択**
5. **認証後、`https://ryugakutalk.com/timeline` にリダイレクトされることを確認**
   - ❌ `http://localhost:3000` にリダイレクトされる場合は、まだ問題が残っています
   - ✅ `https://ryugakutalk.com/timeline` にリダイレクトされれば成功です

## 📝 まとめ

今回の修正により、`window.location.origin`を優先的に使用するようになったため、現在アクセスしているドメインが自動的に使用されます。これにより、環境変数の設定に依存せず、より確実に動作するようになりました。

ただし、以下の点を確認してください：
- ✅ Vercelで再デプロイが完了している
- ✅ Supabaseの「Redirect URLs」に `https://ryugakutalk.com/**` が登録されている
- ✅ ブラウザのキャッシュをクリアしている

