# 🚀 Vercel環境変数設定ガイド - 完全版

このガイドでは、`.env.local`ファイルの環境変数をVercelに設定する手順を詳しく説明します。

## 📋 必要な環境変数一覧

あなたの`.env.local`ファイルには以下の環境変数が設定されています：

| 変数名 | 現在の値（例） | Vercelでの設定値 |
|--------|---------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fujrsewwhmdfryinverw.supabase.co` | **そのままコピー** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **そのままコピー** |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **そのままコピー** |
| `NEXTAUTH_URL` | `http://localhost:3000` | **後で設定（デプロイ後）** |
| `NEXTAUTH_SECRET` | `your_nextauth_secret` | **ランダムな文字列に変更** |

**注意**: `OPENAI_API_KEY`は`.env.local`にありませんが、AI機能を使用する場合は追加が必要です。

---

## 🔧 ステップ1: Vercelにプロジェクトをインポート

1. **[Vercel](https://vercel.com)** にアクセス
2. GitHubアカウントでログイン（推奨）
3. 「Add New...」→「Project」をクリック
4. GitHubリポジトリを選択（`ryugaku-talk`）
5. 「Import」をクリック

---

## 🔑 ステップ2: 環境変数を設定（デプロイ前）

「**Environment Variables**」セクションで以下の環境変数を追加します。

### 手順（各環境変数の設定方法）

1. **「Environment Variables」セクションを探す**
   - プロジェクト設定画面の「Environment Variables」をクリック
   - または、デプロイ前に表示される設定画面で設定

2. **以下の環境変数を1つずつ追加**

#### ① `NEXT_PUBLIC_SUPABASE_URL`

```
名前: NEXT_PUBLIC_SUPABASE_URL
値: https://fujrsewwhmdfryinverw.supabase.co
環境: Production, Preview, Development すべてにチェック
```

**コピペする値**:
```
https://fujrsewwhmdfryinverw.supabase.co
```

---

#### ② `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```
名前: NEXT_PUBLIC_SUPABASE_ANON_KEY
値: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDYwMjYsImV4cCI6MjA3NjY4MjAyNn0.5ihqpr2oFrbtGFn8ORxG04tQTUDBCMMS3FMrIHCffbY
環境: Production, Preview, Development すべてにチェック
```

**コピペする値**（`.env.local`からそのまま）:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDYwMjYsImV4cCI6MjA3NjY4MjAyNn0.5ihqpr2oFrbtGFn8ORxG04tQTUDBCMMS3FMrIHCffbY
```

---

#### ③ `SUPABASE_SERVICE_ROLE_KEY`

```
名前: SUPABASE_SERVICE_ROLE_KEY
値: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEwNjAyNiwiZXhwIjoyMDc2NjgyMDI2fQ.nO68c0TLjDsK1GbayntiFm2NcEuxTcBRWbRvTON671Q
環境: Production, Preview, Development すべてにチェック
```

**コピペする値**（`.env.local`からそのまま）:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEwNjAyNiwiZXhwIjoyMDc2NjgyMDI2fQ.nO68c0TLjDsK1GbayntiFm2NcEuxTcBRWbRvTON671Q
```

---

#### ④ `NEXTAUTH_SECRET`（**設定不要 - このプロジェクトでは使用されていません**）

⚠️ **重要事項**:
- **このプロジェクトでは現在NextAuth.jsは使用されていません**（Supabase Authを使用）
- **設定しなくてもアプリケーションは正常に動作します**
- 環境変数チェックスクリプトでも「オプション」として扱われ、エラーにはなりません
- 将来的にNextAuth.jsへ移行する予定がない限り、**設定する必要はありません**

**詳細な説明**: `NEXTAUTH_SECRET_EXPLANATION.md` を参照してください。

**結論**: **この環境変数は設定をスキップしてOKです！** 以下の設定はスキップして、次のステップに進んでください。

---

**（参考）設定する場合のみ**:

もし将来的にNextAuth.jsへ移行する予定がある場合のみ、以下の手順で設定してください。

**`NEXTAUTH_SECRET`とは？**
- パスワードのようなものですが、**より強力でランダムである必要があります**
- JWTトークンの署名・暗号化に使用される**秘密鍵**です
- セキュリティ上非常に重要で、**推測不可能**である必要があります
- パスワードと違い、**人間が覚える必要はありません**（自動生成が推奨）

⚠️ **重要**: `.env.local`の`your_nextauth_secret`はプレースホルダーです。**実際のランダムな文字列に変更してください**。

```
名前: NEXTAUTH_SECRET
値: [ランダムな文字列を生成]
環境: Production, Preview, Development すべてにチェック
```

**ランダムな文字列の生成方法**（推奨順）:

- **方法1: オンラインツールを使用（最も簡単・推奨）**
  - [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) にアクセス
  - 生成された文字列をコピー（32文字以上のランダムな文字列が生成されます）

- **方法2: OpenSSLコマンドを使用**（Windowsの場合、Git Bashが必要）
  ```bash
  openssl rand -base64 32
  ```

- **方法3: PowerShellで生成**
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```
  または、より強力なバージョン（64文字）:
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
  ```

- **方法4: 手動で作成（非推奨）**
  - 32文字以上のランダムな文字列
  - 例: `K8j3mN9pQ2rS5tV8wX1zA4bC6dE7fG0hI2jL4nO6pR8sT0uV2wY4z`
  - ⚠️ 完全にランダムであることが重要です（意味のある単語は避ける）

**コピペする値の例**（実際にはオンラインツールで生成した値を使用してください）:
```
K8j3mN9pQ2rS5tV8wX1zA4bC6dE7fG0hI2jL4nO6pR8sT0uV2wY4zA1b2c3d4e5f6
```

**重要なポイント**:
- ✅ **最低32文字以上**（64文字以上がより安全）
- ✅ **完全にランダム**（意味のある文字列は避ける）
- ✅ **推測不可能**（誕生日、名前、単語などは使わない）
- ✅ **本番環境と開発環境で異なる値**（今回の場合は同じでOK）
- ❌ **パスワードとは違う**（人間が覚える必要はない）
- ❌ **共有してはいけない**（GitHubにコミットしない）

---

#### ⑤ `NEXTAUTH_URL`（現在は使用されていませんが、設定推奨）

⚠️ **注意**: このプロジェクトでは現在NextAuthを使用していないため、必須ではありません。

**デプロイ前**: 空欄のまま、または設定しない（OK）
**デプロイ後**: Vercelから提供されたURLを設定（ステップ4参照）

デプロイ後に設定する値の例:
```
https://ryugaku-talk.vercel.app
```

---

#### ⑥ `OPENAI_API_KEY`（オプション）

AI機能を使用する場合のみ必要です。

```
名前: OPENAI_API_KEY
値: [OpenAI API Key]
環境: Production, Preview, Development すべてにチェック
```

**取得方法**:
1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. 「Create new secret key」をクリック
3. 生成されたキーをコピー（**一度しか表示されないので注意**）

**コピペする値の例**:
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 ステップ3: デプロイ実行

1. すべての環境変数を追加したら、「**Deploy**」ボタンをクリック
2. デプロイが完了するまで待つ（2-3分）
3. デプロイ完了後、以下のようなURLが表示されます：
   ```
   https://ryugaku-talk.vercel.app
   ```
   （実際のURLは異なる場合があります）

---

## 🔄 ステップ4: デプロイ後の設定

### 4-1. `NEXTAUTH_URL`を設定

1. **Vercelダッシュボード**でプロジェクトを開く
2. 「**Settings**」タブをクリック
3. 「**Environment Variables**」をクリック
4. `NEXTAUTH_URL`を追加（または編集）:
   ```
   名前: NEXTAUTH_URL
   値: https://your-app.vercel.app
   ```
   （`your-app.vercel.app`は実際のVercelのURLに置き換え）

5. 「**Save**」をクリック
6. 「**Redeploy**」をクリックして再デプロイ

---

### 4-2. Supabaseの設定を更新

1. **[Supabaseダッシュボード](https://supabase.com/dashboard)** にアクセス
2. プロジェクトを選択（`fujrsewwhmdfryinverw`）
3. 左サイドバーの「**Authentication**」をクリック
4. 「**URL Configuration**」をクリック

5. **「Redirect URLs」に以下を追加**:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```
   （`your-app.vercel.app`は実際のVercelのURLに置き換え）

6. **「Site URL」を更新**:
   ```
   https://your-app.vercel.app
   ```

7. 「**Save**」をクリック

---

## 📝 環境変数設定のまとめ（コピペ用）

以下をVercelの「Environment Variables」に設定してください：

### Production, Preview, Developmentすべてに設定する変数（必須）

**必須の環境変数**（Supabaseを使用するため必要）:

```
NEXT_PUBLIC_SUPABASE_URL=https://fujrsewwhmdfryinverw.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDYwMjYsImV4cCI6MjA3NjY4MjAyNn0.5ihqpr2oFrbtGFn8ORxG04tQTUDBCMMS3FMrIHCffbY

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1anJzZXd3aG1kZnJ5aW52ZXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEwNjAyNiwiZXhwIjoyMDc2NjgyMDI2fQ.nO68c0TLjDsK1GbayntiFm2NcEuxTcBRWbRvTON671Q
```

### 設定不要の環境変数（このプロジェクトでは使用されていません）

**❌ `NEXTAUTH_SECRET`**: 設定不要
- このプロジェクトではNextAuth.jsを使用していないため、設定する必要はありません
- 詳細: `NEXTAUTH_SECRET_EXPLANATION.md` を参照

**❌ `NEXTAUTH_URL`**: 設定不要
- このプロジェクトではNextAuth.jsを使用していないため、設定する必要はありません

### オプション（AI機能を使用する場合）

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ 確認チェックリスト

デプロイ前に以下を確認してください：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`を設定した（必須）
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`を設定した（必須）
- [ ] `SUPABASE_SERVICE_ROLE_KEY`を設定した（必須）
- [ ] すべての環境変数で「Production」「Preview」「Development」にチェックを入れた
- [ ] デプロイ後にSupabaseのRedirect URLsを更新することを覚えている（必須）
- [ ] `NEXTAUTH_SECRET`と`NEXTAUTH_URL`は**設定しない**ことを確認した（このプロジェクトでは不要）

---

## 🆘 トラブルシューティング

### エラー: "Invalid API key"
→ Supabaseの環境変数が正しくコピーされているか確認。値の前後に余分なスペースがないか確認。

### エラー: "Redirect URL mismatch"
→ Supabaseの「URL Configuration」でVercelのURLが正しく設定されているか確認。

### エラー: "Build failed"
→ Vercelの「Deployments」タブでログを確認。環境変数が正しく設定されているか確認。

### 認証が機能しない
→ `NEXTAUTH_URL`と`NEXTAUTH_SECRET`が正しく設定されているか確認。再デプロイが必要な場合があります。

---

## 📚 関連ドキュメント

- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - より詳細なデプロイガイド
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - クイックデプロイガイド
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase設定ガイド

---

**🎉 これで準備完了です！Vercelへのデプロイを開始しましょう！**

