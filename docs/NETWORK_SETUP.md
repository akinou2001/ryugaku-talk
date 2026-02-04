# ネットワーク公開設定ガイド

他のPCからアプリケーションにアクセスできるようにする方法を説明します。

## 🌐 方法1: ローカルネットワークで公開（推奨）

同じWi-Fiネットワークに接続されているPCからアクセスできます。

### ステップ1: 開発サーバーを再起動

```bash
npm run dev
```

これで、`0.0.0.0:3000`でリッスンするようになります。

### ステップ2: 自分のIPアドレスを確認

#### Windowsの場合
```powershell
ipconfig
```
「IPv4 アドレス」を確認します（例: `192.168.1.100`）

#### Mac/Linuxの場合
```bash
ifconfig
# または
ip addr
```

### ステップ3: 他のPCからアクセス

他のPCのブラウザで以下のURLにアクセス：
```
http://[あなたのIPアドレス]:3000
```

例: `http://192.168.1.100:3000`

### ステップ4: ファイアウォールの設定

Windowsファイアウォールがポート3000をブロックしている場合があります。

#### Windowsファイアウォールを許可する方法：
1. 「Windows セキュリティ」を開く
2. 「ファイアウォールとネットワーク保護」をクリック
3. 「詳細設定」をクリック
4. 「受信の規則」→「新しい規則」をクリック
5. 「ポート」を選択
6. 「TCP」を選択し、特定のローカルポートに「3000」を入力
7. 「接続を許可する」を選択
8. すべてのプロファイルに適用
9. 名前を「Next.js Dev Server」などに設定

または、PowerShellを管理者として実行して：
```powershell
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### ⚠️ 注意事項

- 同じWi-Fiネットワークに接続されている必要があります
- セキュリティ上、開発環境でのみ使用してください
- 本番環境には適していません

---

## 🌍 方法2: インターネット経由で公開（ngrokなど）

インターネット上のどこからでもアクセスできるようにする場合は、トンネルサービスを使用します。

### ngrokを使用する場合

1. **ngrokをインストール**
   - [https://ngrok.com](https://ngrok.com) からダウンロード
   - アカウントを作成（無料）

2. **ngrokを起動**
   ```bash
   ngrok http 3000
   ```

3. **提供されたURLを使用**
   ```
   https://xxxx-xxxx-xxxx.ngrok.io
   ```
   このURLを他のPCで開きます

### Cloudflare Tunnelを使用する場合

1. **Cloudflare Tunnelをインストール**
   ```bash
   # Windowsの場合、Cloudflare Tunnelをダウンロード
   ```

2. **トンネルを作成**
   ```bash
   cloudflared tunnel create ryugaku-talk
   ```

3. **トンネルを起動**
   ```bash
   cloudflared tunnel run ryugaku-talk
   ```

### ⚠️ 注意事項

- 無料プランではURLが頻繁に変わる場合があります
- セキュリティ上、本番環境には適していません
- トラフィック制限がある場合があります

---

## 🚀 方法3: Vercelにデプロイ（本番環境）

本番環境として公開する場合は、Vercelにデプロイすることをお勧めします。

### ステップ1: GitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin [GitHubリポジトリURL]
git push -u origin main
```

### ステップ2: Vercelでデプロイ

1. [https://vercel.com](https://vercel.com) にアクセス
2. GitHubアカウントでログイン
3. 「New Project」をクリック
4. GitHubリポジトリを選択
5. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL`（自動生成されるURL）
   - `NEXTAUTH_SECRET`
6. 「Deploy」をクリック

### ステップ3: Supabaseの設定を更新

Supabaseダッシュボードで：
1. 「Authentication」→「URL Configuration」
2. 「Redirect URLs」にVercelのURLを追加：
   ```
   https://your-app.vercel.app/**
   ```

### ✅ メリット

- 無料でHTTPS対応
- 自動デプロイ
- 世界中からアクセス可能
- 本番環境として適している

---

## 🔒 セキュリティに関する注意事項

### 開発環境（ローカルネットワーク）

- ✅ 同じWi-Fiネットワーク内の信頼できるデバイスのみ
- ⚠️ パブリックWi-Fiでは使用しない
- ⚠️ 本番データは使用しない

### トンネルサービス

- ⚠️ 無料プランはURLが公開される
- ⚠️ 本番データは使用しない
- ⚠️ 適切な認証を実装する

### 本番環境（Vercel）

- ✅ 適切な認証を実装
- ✅ 環境変数を保護
- ✅ 定期的なセキュリティアップデート

---

## 📝 まとめ

| 方法 | 用途 | アクセス範囲 | セキュリティ |
|------|------|-------------|------------|
| ローカルネットワーク | 開発・テスト | 同じWi-Fi内 | ⚠️ 中 |
| トンネルサービス | デモ・テスト | インターネット全体 | ⚠️ 低 |
| Vercelデプロイ | 本番環境 | インターネット全体 | ✅ 高 |

開発・テスト目的であれば**方法1（ローカルネットワーク）**が最も簡単です。
本番環境として公開する場合は**方法3（Vercelデプロイ）**をお勧めします。
