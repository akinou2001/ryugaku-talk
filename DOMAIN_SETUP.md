# 🌐 カスタムドメイン設定ガイド（ryugakutalk.com）

`ryugakutalk.com`ドメインを本番環境で使用するための設定手順です。

## 📋 前提条件

- `ryugakutalk.com`ドメインを取得済み
- Vercelアカウント（または他のホスティングサービス）
- Supabaseプロジェクト

## 🚀 設定手順

### ステップ1: Vercelでカスタムドメインを設定

1. **Vercelダッシュボードにアクセス**
   - [https://vercel.com](https://vercel.com) にログイン
   - プロジェクトを選択

2. **Settings → Domains を開く**

3. **カスタムドメインを追加**
   - 「Add Domain」をクリック
   - `ryugakutalk.com` を入力
   - 「Add」をクリック

4. **DNS設定を確認**
   - Vercelが表示するDNSレコードを確認
   - 通常は以下のいずれか：
     - **Aレコード**: `76.76.21.21` を `@` に設定
     - **CNAMEレコード**: `cname.vercel-dns.com.` を `@` に設定
     - **CNAMEレコード**: `cname.vercel-dns.com.` を `www` に設定（wwwサブドメイン用）

5. **ドメイン管理画面でDNS設定**
   - ドメインを購入したサービス（例: Namecheap, GoDaddy, Google Domains）にログイン
   - DNS設定画面を開く
   - Vercelが表示したレコードを追加
   - 保存して反映を待つ（通常5分〜24時間）

6. **SSL証明書の確認**
   - Vercelが自動的にSSL証明書を発行します
   - 数分〜数時間かかる場合があります
   - 「Valid Configuration」と表示されるまで待ちます

### ステップ2: 環境変数を更新

#### Vercelダッシュボードで設定

1. **Settings → Environment Variables を開く**

2. **以下の環境変数を追加/更新**:

   ```
   NEXT_PUBLIC_APP_URL=https://ryugakutalk.com
   NEXTAUTH_URL=https://ryugakutalk.com
   ```

3. **既存の環境変数も確認**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY`

4. **「Save」をクリック**

5. **再デプロイ**
   - 「Deployments」タブを開く
   - 最新のデプロイメントの「⋯」メニューから「Redeploy」を選択

### ステップ3: Supabaseの設定を更新

1. **Supabaseダッシュボードにアクセス**
   - [https://app.supabase.com](https://app.supabase.com) にログイン
   - プロジェクトを選択

2. **Authentication → URL Configuration を開く**

3. **Site URL を更新**:
   ```
   https://ryugakutalk.com
   ```

4. **Redirect URLs に追加**:
   ```
   https://ryugakutalk.com/**
   https://ryugakutalk.com/auth/callback
   http://localhost:3000/auth/callback
   ```
   （開発環境用のlocalhostも残しておくと便利です）

5. **「Save」をクリック**

### ステップ4: Google Cloud Consoleの設定（Google認証を使用している場合）

1. **Google Cloud Consoleにアクセス**
   - [https://console.cloud.google.com](https://console.cloud.google.com)
   - プロジェクトを選択

2. **APIとサービス → 認証情報 を開く**

3. **OAuth 2.0 クライアントIDを選択**

4. **承認済みのリダイレクト URI に追加**:
   ```
   https://[your-supabase-project].supabase.co/auth/v1/callback
   ```
   （Supabaseが自動的に処理するため、通常は変更不要）

5. **承認済みのJavaScript生成元 に追加**（必要に応じて）:
   ```
   https://ryugakutalk.com
   ```

6. **「保存」をクリック**

### ステップ5: 動作確認

1. **ドメインにアクセス**
   - ブラウザで `https://ryugakutalk.com` にアクセス
   - SSL証明書が正しく設定されているか確認（🔒マークが表示される）

2. **認証機能をテスト**
   - ログインページにアクセス
   - Google認証を試す
   - 正常にリダイレクトされるか確認

3. **コンソールでエラーを確認**
   - ブラウザの開発者ツール（F12）を開く
   - エラーがないか確認

## 🔧 トラブルシューティング

### DNS設定が反映されない

- **確認事項**:
  - DNS設定が正しく保存されているか
  - TTL（Time To Live）の設定を確認
  - 通常は5分〜24時間かかります

- **確認方法**:
  ```bash
  # コマンドプロンプトまたはターミナルで実行
  nslookup ryugakutalk.com
  # または
  dig ryugakutalk.com
  ```

### SSL証明書が発行されない

- **確認事項**:
  - DNS設定が正しく反映されているか
  - Vercelのドメイン設定で「Valid Configuration」と表示されているか

- **対処法**:
  - 数時間待つ（最大24時間かかる場合があります）
  - Vercelのサポートに問い合わせる

### 認証が動作しない

- **確認事項**:
  - Supabaseの「Redirect URLs」に `https://ryugakutalk.com/auth/callback` が登録されているか
  - 環境変数 `NEXT_PUBLIC_APP_URL` が `https://ryugakutalk.com` に設定されているか
  - Vercelで再デプロイが完了しているか

- **対処法**:
  - ブラウザのキャッシュをクリア
  - シークレットモードでテスト
  - ブラウザのコンソールでエラーを確認

### wwwサブドメインも設定したい場合

1. **Vercelでwwwサブドメインを追加**
   - Settings → Domains
   - `www.ryugakutalk.com` を追加

2. **DNS設定**
   - `www` サブドメインにCNAMEレコードを設定
   - 値: `cname.vercel-dns.com.`

3. **リダイレクト設定（オプション）**
   - Vercelの設定で、`ryugakutalk.com` から `www.ryugakutalk.com` へのリダイレクトを設定できます

## ✅ 完了チェックリスト

- [ ] Vercelでカスタムドメインを追加
- [ ] DNS設定を完了（反映を確認）
- [ ] SSL証明書が発行されている（🔒マークが表示）
- [ ] 環境変数 `NEXT_PUBLIC_APP_URL` を `https://ryugakutalk.com` に設定
- [ ] 環境変数 `NEXTAUTH_URL` を `https://ryugakutalk.com` に設定
- [ ] Supabaseの「Site URL」を `https://ryugakutalk.com` に更新
- [ ] Supabaseの「Redirect URLs」に `https://ryugakutalk.com/**` を追加
- [ ] Vercelで再デプロイを実行
- [ ] ブラウザで `https://ryugakutalk.com` にアクセスして動作確認
- [ ] 認証機能（Googleログイン）をテスト

## 📝 注意事項

- **開発環境と本番環境の切り替え**: ローカル開発時は `http://localhost:3000` を使用し、本番環境では `https://ryugakutalk.com` を使用します
- **環境変数の管理**: `.env.local` は開発環境用、Vercelの環境変数は本番環境用です
- **セキュリティ**: 本番環境では必ずHTTPSを使用してください（Vercelが自動的に設定します）

## 🆘 サポート

問題が解決しない場合は、以下を確認してください：

1. Vercelのドキュメント: [https://vercel.com/docs/concepts/projects/domains](https://vercel.com/docs/concepts/projects/domains)
2. Supabaseのドキュメント: [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
3. ブラウザのコンソールでエラーメッセージを確認

