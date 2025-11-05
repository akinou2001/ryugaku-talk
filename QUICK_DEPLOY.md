# 🚀 クイックデプロイガイド

URLを叩けば誰でもアクセスできるようにする最短手順です。

## 📋 前提条件

- GitHubアカウント（ない場合は [https://github.com](https://github.com) で作成）
- Vercelアカウント（GitHubでログインできるので自動作成）

## ⚡ 5分でデプロイ完了！

### ステップ1: GitHubリポジトリを作成（2分）

1. [https://github.com/new](https://github.com/new) にアクセス
2. Repository name: `ryugaku-talk`
3. Publicを選択
4. 「Create repository」をクリック

### ステップ2: プロジェクトをGitにプッシュ（1分）

プロジェクトのフォルダで以下を実行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[あなたのユーザー名]/ryugaku-talk.git
git push -u origin main
```

**注意**: `[あなたのユーザー名]`をGitHubのユーザー名に置き換えてください。

### ステップ3: Vercelでデプロイ（2分）

1. [https://vercel.com/new](https://vercel.com/new) にアクセス
2. GitHubでログイン
3. 「Import Git Repository」で`ryugaku-talk`を選択
4. 「Import」をクリック

### ステップ4: 環境変数を設定

「Environment Variables」で以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL = [SupabaseのURL]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [Supabaseのanonキー]
SUPABASE_SERVICE_ROLE_KEY = [Supabaseのservice_roleキー]
NEXTAUTH_SECRET = [ランダムな文字列]
```

### ステップ5: デプロイ実行

1. 「Deploy」をクリック
2. 2-3分待つ
3. 完了！

### ステップ6: Supabaseの設定を更新

1. Supabaseダッシュボード → 「Authentication」→「URL Configuration」
2. 「Redirect URLs」に以下を追加：
   ```
   https://[vercel-url]/**
   ```
   （`[vercel-url]`はVercelで生成されたURL）

3. Vercelダッシュボードで`NEXTAUTH_URL`環境変数を追加：
   ```
   NEXTAUTH_URL = https://[vercel-url]
   ```
4. 「Redeploy」をクリック

## ✅ 完了！

これで、以下のURLで世界中からアクセスできます：
```
https://[vercel-url]
```

## 🆘 困ったときは

詳細は `DEPLOY_GUIDE.md` を参照してください。
