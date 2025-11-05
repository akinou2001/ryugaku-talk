# Vercelデプロイガイド - インターネット公開

URLを叩けば誰でもアクセスできるようにするための完全ガイドです。

## 🚀 方法1: Vercelにデプロイ（推奨・無料）

VercelはNext.jsを開発した会社が提供するホスティングサービスで、無料でHTTPS対応、自動デプロイが可能です。

### ステップ1: GitHubリポジトリを作成

1. **GitHubにログイン**
   - [https://github.com](https://github.com) にアクセス
   - ログイン（アカウントがない場合は作成）

2. **新しいリポジトリを作成**
   - 「New repository」をクリック
   - Repository name: `ryugaku-talk`（任意）
   - PublicまたはPrivateを選択
   - 「Create repository」をクリック

### ステップ2: プロジェクトをGitに初期化

プロジェクトのフォルダで以下を実行：

```bash
# Gitを初期化
git init

# .gitignoreファイルを作成（既にあればスキップ）
echo "node_modules" > .gitignore
echo ".next" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit"

# GitHubリポジトリを追加（GitHubで表示されたURLを使用）
git remote add origin https://github.com/[あなたのユーザー名]/ryugaku-talk.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

### ステップ3: Vercelアカウントを作成

1. [https://vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントでログイン（推奨）

### ステップ4: プロジェクトをインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリを選択
3. 「Import」をクリック

### ステップ5: 環境変数を設定

「Environment Variables」セクションで以下を追加：

| 名前 | 値 |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseのProject URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのanon publicキー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseのservice_roleキー |
| `NEXTAUTH_URL` | （後で設定） |
| `NEXTAUTH_SECRET` | ランダムな文字列（例: `my-super-secret-key-12345`） |

**重要**: `NEXTAUTH_URL`は最初は空欄でOK。デプロイ後に自動生成されるURLを設定します。

### ステップ6: デプロイ

1. 「Deploy」をクリック
2. デプロイが完了するまで待つ（2-3分）
3. デプロイ完了後、URLが表示されます（例: `https://ryugaku-talk.vercel.app`）

### ステップ7: Supabaseの設定を更新

1. **Supabaseダッシュボード**にアクセス
2. 「Authentication」→「URL Configuration」をクリック
3. 「Redirect URLs」に以下を追加：
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```
   （`your-app`はVercelで生成されたURLに置き換え）

4. 「Site URL」を更新：
   ```
   https://your-app.vercel.app
   ```

### ステップ8: NEXTAUTH_URLを更新

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」をクリック
3. `NEXTAUTH_URL`を編集して、VercelのURLを設定：
   ```
   https://your-app.vercel.app
   ```
4. 「Save」をクリック
5. 「Redeploy」をクリックして再デプロイ

### ✅ 完了！

これで、インターネット上のどこからでも以下のURLでアクセスできます：
```
https://your-app.vercel.app
```

---

## 🌐 方法2: ngrok（一時的なテスト用）

すぐにテストしたい場合の一時的な方法です。

### ステップ1: ngrokをインストール

1. [https://ngrok.com](https://ngrok.com) にアクセス
2. アカウントを作成（無料）
3. ダウンロードしてインストール

### ステップ2: ngrokを起動

```bash
ngrok http 3000
```

### ステップ3: 提供されたURLを使用

以下のようなURLが表示されます：
```
https://xxxx-xxxx-xxxx.ngrok.io
```

このURLを誰かと共有すれば、アクセスできます。

### ⚠️ 注意事項

- 無料プランではURLが頻繁に変わる
- セキュリティ上、本番環境には適していない
- 一時的なテスト用のみ

---

## 🔧 トラブルシューティング

### エラー: "Invalid API key"
→ 環境変数が正しく設定されているか確認

### エラー: "Redirect URL mismatch"
→ SupabaseのRedirect URLsにVercelのURLを追加

### エラー: "Build failed"
→ ブラウザのコンソールでエラーを確認
→ Vercelのログを確認

---

## 📝 まとめ

| 方法 | 用途 | 費用 | セキュリティ |
|------|------|------|------------|
| Vercel | 本番環境 | 無料 | ✅ 高 |
| ngrok | 一時的なテスト | 無料 | ⚠️ 低 |

**本番環境として公開する場合は、Vercelデプロイを強く推奨します！**
