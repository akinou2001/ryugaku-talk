# SQL実行後の次のステップ

SQLファイルの実行が完了したら、以下の手順を進めてください。

## ✅ 完了したこと

- [x] データベーススキーマの適用（Phase 1-7）
- [x] 管理者アカウント設定（Phase 9、必要に応じて）

## 📋 次のステップ

### ステップ1: RLSポリシーの確認（推奨）

本番環境のSupabaseダッシュボードで、RLSポリシーが正しく設定されているか確認します。

1. Supabaseダッシュボードで「Authentication」→「Policies」を開く
2. 主要なテーブル（profiles, posts, communities等）のポリシーを確認
3. 必要に応じて、`sql/10-checks/check-rls-policies.sql`を実行して確認

### ステップ2: Vercel環境変数の設定（必須）

本番環境のVercelプロジェクトに環境変数を設定します。

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を**Production環境**に設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://[本番プロジェクトID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[本番用anon key]
SUPABASE_SERVICE_ROLE_KEY=[本番用service role key]
NEXT_PUBLIC_APP_URL=https://ryugakutalk.com
NEXT_PUBLIC_SITE_URL=https://ryugakutalk.com
NEXT_PUBLIC_SITE_DOMAIN=ryugakutalk.com
NEXT_PUBLIC_CONTACT_EMAIL=contact@ryugakutalk.com
NEXTAUTH_URL=https://ryugakutalk.com
NEXTAUTH_SECRET=[本番用のランダムなシークレット]
OPENAI_API_KEY=[本番用OpenAI API key]
DASHSCOPE_API_KEY=[本番用DashScope API key]
```

**重要**: 
- 各環境変数を追加する際、「Environment」で「Production」を選択
- 環境変数を追加・変更した後は、**デプロイを再実行**してください

### ステップ3: ローカル開発環境の確認（推奨）

開発環境用の`.env.local`ファイルが正しく設定されているか確認します。

1. プロジェクトのルートディレクトリに`.env.local`ファイルがあることを確認
2. 開発用Supabaseプロジェクトの認証情報が設定されていることを確認
3. 環境変数を確認：

```bash
npm run check-env
```

### ステップ4: 動作確認（必須）

本番環境と開発環境が正しく動作するか確認します。

#### 開発環境の確認

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000` にアクセス
3. 基本的な機能（ログイン、投稿作成等）が動作するか確認

#### 本番環境の確認

1. Vercelダッシュボードで最新のデプロイを確認
2. デプロイログでエラーがないか確認
3. 本番URL（`https://ryugakutalk.com`）にアクセス
4. 基本的な機能が動作するか確認
5. 本番環境のSupabaseプロジェクトに接続されているか確認（開発環境のデータが表示されないことを確認）

### ステップ5: 管理者アカウントの設定（必要に応じて）

本番環境で管理者アカウントを設定する場合：

1. 本番環境のSupabaseダッシュボードで「SQL Editor」を開く
2. `sql/09-admin-setup/setup-new-admin.sql` または `setup-admin-account.sql` を実行
3. **実際のメールアドレスやユーザーIDに置き換えてから実行**してください
4. 管理者権限が正しく設定されたか確認

## 🔍 トラブルシューティング

### 問題1: 本番環境で開発環境のデータが表示される

**原因**: Vercelの環境変数が正しく設定されていない

**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. `NEXT_PUBLIC_SUPABASE_URL`が本番用プロジェクトのURLになっているか確認
3. Production環境にのみ適用されているか確認
4. 環境変数を変更した後、デプロイを再実行

### 問題2: 環境変数が読み込まれない

**原因**: デプロイが再実行されていない、または環境変数名が間違っている

**解決方法**:
1. Vercelダッシュボードで「Deployments」を開く
2. 最新のデプロイを選択
3. 「Redeploy」をクリック
4. デプロイログで環境変数の読み込みエラーがないか確認

### 問題3: RLSポリシーエラー

**原因**: RLSポリシーが正しく設定されていない

**解決方法**:
1. Supabaseダッシュボードで「Authentication」→「Policies」を確認
2. `sql/10-checks/check-rls-policies.sql`を実行して確認
3. 必要に応じて、`sql/05-rls-policies/`内のSQLファイルを再実行

## 📝 チェックリスト

以下の項目を確認してください：

- [ ] RLSポリシーが正しく設定されている
- [ ] VercelのProduction環境に環境変数が設定されている
- [ ] ローカル開発環境の`.env.local`が正しく設定されている
- [ ] 開発環境でアプリケーションが正常に動作する
- [ ] 本番環境でアプリケーションが正常に動作する
- [ ] 本番環境が本番用Supabaseプロジェクトに接続されている（開発環境のデータが表示されない）
- [ ] 管理者アカウントが設定されている（必要に応じて）

## 🔗 関連ドキュメント

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - 環境分離の詳細な設定手順
- [SQL_MIGRATION_ORDER.md](./SQL_MIGRATION_ORDER.md) - SQLファイルの実行順序
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabaseの基本設定
