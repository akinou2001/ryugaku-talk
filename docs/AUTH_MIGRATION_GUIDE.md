# 認証設定の移行ガイド

開発環境から本番環境へ認証設定（Googleログイン、メール認証など）を移行する手順です。

## 📋 概要

Supabaseの認証設定は、プロジェクトごとに個別に設定する必要があります。開発環境で設定した認証設定を、本番環境のSupabaseプロジェクトにも同じように設定してください。

## 🔐 移行が必要な認証設定

以下の認証設定を本番環境に移行する必要があります：

1. **メール認証設定**
2. **Google OAuth設定**（使用している場合）
3. **その他のOAuthプロバイダー**（使用している場合）
4. **リダイレクトURL設定**
5. **メールテンプレート設定**（カスタマイズしている場合）

## 📝 移行手順

### ステップ1: 開発環境の設定を確認

まず、開発環境のSupabaseプロジェクトで現在の設定を確認します：

1. 開発環境のSupabaseダッシュボードにログイン
2. 開発用プロジェクトを選択
3. 以下の設定を確認・メモ：
   - 「Authentication」→「Settings」→「Auth Settings」
   - 「Authentication」→「Providers」→ 有効になっているプロバイダー
   - 「Authentication」→「URL Configuration」→「Redirect URLs」

### ステップ2: メール認証設定の移行

#### 2.1 本番環境でメール認証を設定

1. **本番環境のSupabaseダッシュボードにログイン**

   - [Supabaseダッシュボード](https://app.supabase.com)にアクセス
   - 本番用プロジェクトを選択
2. **「Authentication」→「Settings」を開く**
3. **「Auth Settings」セクションで以下を設定**：

   - **Enable email confirmations**: 本番環境では有効にすることを推奨
   - **Site URL**: `https://ryugakutalk.com`
   - **Redirect URLs**: `https://ryugakutalk.com/**`
4. **「Email Templates」セクションで確認**（必要に応じて）：

   - メールテンプレートをカスタマイズしている場合、同じ内容を本番環境にも設定

#### 2.2 メール送信設定（オプション）

本番環境でメール送信をカスタマイズする場合：

1. 「Authentication」→「Settings」→「SMTP Settings」を開く
2. カスタムSMTPサーバーを設定（開発環境と同じ設定を使用）

### ステップ3: Google OAuth設定の移行

Googleログインを使用している場合、以下の手順で設定します。

#### 3.1 Google Cloud Consoleでの設定確認

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（開発環境で使用しているプロジェクト、または新規作成）
3. 「APIとサービス」→「認証情報」を開く
4. OAuth 2.0 クライアント IDを確認または作成

#### 3.2 本番環境用のリダイレクトURIを追加

Google Cloud Consoleで、本番環境用のリダイレクトURIを追加：

1. OAuth 2.0 クライアント IDを選択
2. 「承認済みのリダイレクト URI」に以下を追加：

   ```
   https://[本番プロジェクトID].supabase.co/auth/v1/callback
   ```

   （`[本番プロジェクトID]`は本番環境のSupabaseプロジェクトID）
3. 「保存」をクリック

**注意**: 開発環境用のリダイレクトURIも残しておいてください：

```
https://[開発プロジェクトID].supabase.co/auth/v1/callback
```

#### 3.3 SupabaseでGoogle認証を有効化

1. **本番環境のSupabaseダッシュボード**で「Authentication」→「Providers」を開く
2. **「Google」を有効にする**
3. **以下を入力**：
   - **Client ID**: Google Cloud Consoleで取得したClient ID（開発環境と同じものを使用可能）
   - **Client Secret**: Google Cloud Consoleで取得したClient Secret（開発環境と同じものを使用可能）
4. **「Save」をクリック**

### ステップ4: リダイレクトURL設定の移行

#### 4.1 本番環境のリダイレクトURLを設定

1. 本番環境のSupabaseダッシュボードで「Authentication」→「URL Configuration」を開く
2. **「Redirect URLs」に以下を追加**：
   ```
   https://ryugakutalk.com/**
   https://ryugakutalk.com/auth/callback
   ```
3. **「Site URL」を設定**：
   ```
   https://ryugakutalk.com
   ```

#### 4.2 開発環境のリダイレクトURL（参考）

開発環境では以下のURLが設定されているはずです：

```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### ステップ5: その他のOAuthプロバイダー（使用している場合）

GitHub、Twitter、FacebookなどのOAuthプロバイダーを使用している場合も、同様の手順で設定：

1. 各プロバイダーの開発者コンソールで、本番環境用のリダイレクトURIを追加
2. Supabaseダッシュボードで、本番環境のプロジェクトに各プロバイダーを設定

## ✅ 設定確認チェックリスト

本番環境の認証設定が正しく移行されたか確認：

- [X] メール認証が有効になっている
- [X] Site URLが本番環境のURL（`https://ryugakutalk.com`）に設定されている
- [X] Redirect URLsに本番環境のURLが追加されている
- [X] Google OAuthが有効になっている（使用している場合）
- [X] Google Cloud Consoleに本番環境用のリダイレクトURIが追加されている
- [X] その他のOAuthプロバイダーが設定されている（使用している場合）

## 🧪 動作確認

### 1. メール認証のテスト

1. 本番環境のアプリケーション（`https://ryugakutalk.com`）にアクセス
2. 新規登録を試す
3. 確認メールが送信されることを確認
4. メール内のリンクをクリックして認証が完了することを確認

### 2. Googleログインのテスト

1. 本番環境のアプリケーションにアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントを選択
4. 正常にログインできることを確認

### 3. リダイレクトの確認

1. ログイン後、正しいページにリダイレクトされることを確認
2. ログアウト後、正しいページにリダイレクトされることを確認

## ⚠️ 注意事項

### 1. Google OAuthのClient ID/Secret

- 開発環境と本番環境で**同じClient ID/Secretを使用可能**です
- ただし、両方のリダイレクトURIをGoogle Cloud Consoleに登録する必要があります
- セキュリティを重視する場合は、本番環境専用のClient ID/Secretを作成することも可能です

### 2. メール確認の有効化

- **開発環境**: メール確認を無効にしても動作します（テスト用）
- **本番環境**: メール確認を有効にすることを強く推奨します（セキュリティのため）

### 3. リダイレクトURLの管理

- 開発環境と本番環境で異なるリダイレクトURLを設定してください
- 誤ったURLを設定すると、認証後にエラーが発生します

## 🔧 トラブルシューティング

### 問題1: Googleログインでエラーが発生する

**症状**: 「redirect_uri_mismatch」エラー

**解決方法**:

1. Google Cloud Consoleで、本番環境用のリダイレクトURIが正しく追加されているか確認
2. SupabaseのプロジェクトIDが正しいか確認
3. リダイレクトURIの形式が正しいか確認：
   ```
   https://[プロジェクトID].supabase.co/auth/v1/callback
   ```

### 問題2: メール認証のメールが届かない

**解決方法**:

1. Supabaseダッシュボードで「Authentication」→「Settings」→「SMTP Settings」を確認
2. メール送信の設定が正しいか確認
3. スパムフォルダを確認

### 問題3: リダイレクト後にエラーが発生する

**解決方法**:

1. Supabaseダッシュボードで「Authentication」→「URL Configuration」を確認
2. Redirect URLsに正しいURLが追加されているか確認
3. Site URLが正しく設定されているか確認

## 🔗 関連ドキュメント

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabaseの基本設定
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - 環境分離の設定
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - 本番環境運用チェックリスト
