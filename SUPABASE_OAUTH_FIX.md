# 🔧 Supabase OAuth リダイレクト問題の解決方法

## 問題

Googleアカウントでログインすると、`localhost`にリダイレクトされて接続が拒否される。

## 原因

SupabaseのOAuth設定で、リダイレクトURLが正しく設定されていない可能性があります。

## 解決方法

### ステップ1: Supabaseダッシュボードで設定を確認

1. **Supabaseダッシュボードにアクセス**
   - [https://app.supabase.com](https://app.supabase.com) にログイン
   - プロジェクトを選択

2. **Authentication → URL Configuration を開く**

3. **Site URL を確認・設定**:
   ```
   https://ryugakutalk.com
   ```
   ⚠️ **重要**: `http://localhost:3000` が設定されている場合は、`https://ryugakutalk.com` に変更してください。

4. **Redirect URLs を確認・設定**:
   以下のURLがすべて含まれていることを確認してください：
   ```
   https://ryugakutalk.com/**
   https://ryugakutalk.com/auth/callback
   http://localhost:3000/auth/callback
   ```
   
   **注意**: 
   - `https://ryugakutalk.com/**` はワイルドカードで、すべてのパスを許可します
   - `http://localhost:3000/auth/callback` は開発環境用なので残しておくと便利です

5. **「Save」をクリック**

### ステップ2: ブラウザのキャッシュをクリア

1. **ハードリフレッシュを実行**
   - Windows/Linux: `Ctrl + Shift + R` または `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **シークレットモードでテスト**
   - 新しいシークレットウィンドウを開く
   - `https://ryugakutalk.com` にアクセス
   - ログインを試す

### ステップ3: デバッグログを確認

ブラウザのコンソール（F12）で以下を確認：

1. **開発者ツールを開く**（F12）
2. **Consoleタブを開く**
3. **Googleログインボタンをクリック**
4. **以下のログが表示されるか確認**：
   ```
   Current origin: https://ryugakutalk.com
   OAuth redirect URL: https://ryugakutalk.com/auth/callback
   ```
   
   - もし `http://localhost:3000` と表示される場合は、まだ古いコードが実行されています
   - その場合は、Vercelで再デプロイを確認してください

### ステップ4: Vercelで再デプロイ

コードを修正した場合は、Vercelで再デプロイが必要です：

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Fix OAuth redirect URL"
   git push
   ```

2. **Vercelでデプロイを確認**
   - Vercelダッシュボードでデプロイが自動的に開始されます
   - デプロイが完了するまで待ちます（2-3分）

## トラブルシューティング

### まだ`localhost`にリダイレクトされる場合

#### 1. Supabaseの設定を再確認
- **Site URL** が `https://ryugakutalk.com` になっているか
- **Redirect URLs** に `https://ryugakutalk.com/**` が含まれているか
- 設定を保存して、数分待ってから再試行

#### 2. ブラウザのキャッシュを完全にクリア
- ブラウザの設定からキャッシュをクリア
- または、シークレットモードでテスト

#### 3. Supabaseの設定が反映されるまで待つ
- Supabaseの設定変更は、数分かかる場合があります
- 5-10分待ってから再試行

#### 4. 環境変数を確認
Vercelダッシュボードで以下を確認：
- `NEXT_PUBLIC_APP_URL` が `https://ryugakutalk.com` に設定されているか
- 設定後、再デプロイを実行

**注意**: 今回の修正により、`window.location.origin`を使用するため、環境変数は必須ではありません。ただし、設定しておくとサーバーサイドでも正しいURLを使用できます。

### エラーメッセージが表示される場合

ブラウザのコンソール（F12）でエラーメッセージを確認：

- **`redirect_uri_mismatch`**: Supabaseの「Redirect URLs」に `https://ryugakutalk.com/auth/callback` が登録されていない
- **`Invalid redirect URL`**: Supabaseの「Site URL」が正しく設定されていない

## 確認チェックリスト

- [ ] Supabaseの「Site URL」が `https://ryugakutalk.com` に設定されている
- [ ] Supabaseの「Redirect URLs」に `https://ryugakutalk.com/**` が含まれている
- [ ] ブラウザのキャッシュをクリアした
- [ ] Vercelで最新のコードがデプロイされている
- [ ] ブラウザのコンソールで `Current origin: https://ryugakutalk.com` と表示される
- [ ] シークレットモードでテストした

## 追加の確認事項

### Supabaseの設定画面で確認すべき項目

1. **Authentication → Providers → Google**
   - Google認証が有効になっているか
   - Client IDとClient Secretが正しく設定されているか

2. **Authentication → URL Configuration**
   - Site URL: `https://ryugakutalk.com`
   - Redirect URLs: `https://ryugakutalk.com/**` と `https://ryugakutalk.com/auth/callback`

### Google Cloud Consoleの設定（必要に応じて）

1. **Google Cloud Consoleにアクセス**
   - [https://console.cloud.google.com](https://console.cloud.google.com)
   - プロジェクトを選択

2. **APIとサービス → 認証情報**
   - OAuth 2.0 クライアントIDを選択
   - 「承認済みのリダイレクト URI」に以下が含まれているか確認：
     ```
     https://[your-supabase-project].supabase.co/auth/v1/callback
     ```
     （Supabaseが自動的に設定するため、通常は手動設定不要）

## まとめ

最も重要なのは、**Supabaseの「Site URL」と「Redirect URLs」の設定**です。これらが正しく設定されていないと、`localhost`にリダイレクトされる可能性があります。

設定を変更した後は、数分待ってから再試行してください。


