# レンタルサーバー移行計画（詳細版）

## 📋 移行概要

**現状**: Supabase（PostgreSQL）→ **移行先**: レンタルサーバー（SQL）  
**期間**: 約1ヶ月  
**優先度**: 高

---

## 🗄️ データベース移行計画

### Step 1: レンタルサーバー仕様の確認

#### 確認事項
- [ ] データベース種別（MySQL/MariaDB/PostgreSQL）
- [ ] データベースバージョン
- [ ] 接続情報（ホスト、ポート、ユーザー名、パスワード）
- [ ] データベース名の命名規則
- [ ] 最大接続数
- [ ] 文字コード設定（UTF-8必須）

#### 確認方法
レンタルサーバーの管理画面または共同開発者に確認

### Step 2: スキーマ変換

#### PostgreSQL → MySQL/MariaDB変換が必要な場合

**主な変換ポイント**:

1. **UUID型**
   ```sql
   -- PostgreSQL
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY
   
   -- MySQL/MariaDB
   id VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY
   ```

2. **配列型**
   ```sql
   -- PostgreSQL
   languages TEXT[] DEFAULT '{}'
   
   -- MySQL/MariaDB
   languages JSON DEFAULT '[]'
   -- または
   languages TEXT  -- カンマ区切りで保存
   ```

3. **タイムスタンプ**
   ```sql
   -- PostgreSQL
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   
   -- MySQL/MariaDB
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ```

4. **外部キー参照**
   ```sql
   -- PostgreSQL
   id UUID REFERENCES auth.users(id) ON DELETE CASCADE
   
   -- MySQL/MariaDB（認証テーブルが別途必要）
   id VARCHAR(36) NOT NULL,
   FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
   ```

#### 変換スクリプトの作成

`migrate-schema.sql`ファイルを作成（データベース種別に応じて）

### Step 3: 認証システムの移行

#### 現状: Supabase Auth
- ユーザー認証はSupabaseが管理
- `auth.users`テーブルに依存

#### 移行先: 自前認証

**必要なテーブル**:
```sql
CREATE TABLE users (
  id VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**認証ライブラリの選択**:
- NextAuth.js（推奨）
- または自前実装

### Step 4: コード修正

#### 1. データベース接続の変更

**現状** (`src/lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**移行後** (`src/lib/db.ts`):
```typescript
// MySQL/MariaDBの場合
import mysql from 'mysql2/promise'

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4'
})

// PostgreSQLの場合
import { Pool } from 'pg'

export const db = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
```

#### 2. クエリの書き換え

**Supabase形式**:
```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('author_id', userId)
```

**直接SQL形式**:
```typescript
const [rows] = await db.query(
  'SELECT * FROM posts WHERE author_id = ?',
  [userId]
)
```

#### 3. 認証の書き換え

**Supabase Auth**:
```typescript
await supabase.auth.signUp({ email, password })
```

**NextAuth.js**:
```typescript
// NextAuth.js設定ファイルで実装
```

### Step 5: データ移行

#### 1. 既存データのエクスポート

```bash
# Supabaseからデータエクスポート
# Supabaseダッシュボードの「Table Editor」から
# または pg_dump を使用
```

#### 2. データ変換

- UUID形式の調整
- 配列データの変換
- タイムスタンプの調整

#### 3. データインポート

```bash
# MySQL/MariaDBの場合
mysql -u username -p database_name < migrated_data.sql

# PostgreSQLの場合
psql -U username -d database_name -f migrated_data.sql
```

---

## 🚀 デプロイ手順

### レンタルサーバーへのデプロイ

#### 1. サーバー環境の確認

```bash
# Node.jsバージョン確認
node --version  # 18以上が必要

# npmバージョン確認
npm --version

# ディレクトリ構造の確認
pwd
ls -la
```

#### 2. プロジェクトのアップロード

**方法A: Git経由（推奨）**
```bash
# サーバー上で
git clone https://github.com/akinou2001/ryugaku-talk.git
cd ryugaku-talk
npm install
```

**方法B: FTP経由**
- プロジェクトファイルをZIPで圧縮
- FTPでアップロード
- サーバー上で展開・`npm install`

#### 3. 環境変数の設定

サーバー上で`.env.production`ファイルを作成：

```env
# データベース設定
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ryugaku_talk

# Next.js設定
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# その他
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### 4. ビルド

```bash
npm run build
```

#### 5. プロセス管理（PM2推奨）

```bash
# PM2をインストール
npm install -g pm2

# アプリケーションを起動
pm2 start npm --name "ryugaku-talk" -- start

# 自動起動設定
pm2 startup
pm2 save
```

#### 6. リバースプロキシ設定（Nginx/Apache）

**Nginx設定例**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 試運転計画

### Phase 1: 内部テスト（1週間）

#### テスト項目
- [ ] ユーザー登録・ログイン
- [ ] プロフィール編集
- [ ] 投稿作成・編集・削除
- [ ] コメント投稿
- [ ] いいね機能
- [ ] チャット機能
- [ ] 検索機能
- [ ] 多言語切替

#### テスト環境
- 開発チーム内でのテスト
- テストデータの投入
- エラーログの確認

### Phase 2: クローズドベータ（2週間）

#### 対象ユーザー
- 10-20名の限定ユーザー
- 開発チームの知人・友人
- 大学関係者

#### 実施内容
- ユーザーフィードバック収集
- バグレポートの収集
- 使い勝手の確認
- パフォーマンステスト

#### フィードバック収集方法
- Google Forms
- GitHub Issues
- メール
- チャット機能

### Phase 3: オープンベータ（1ヶ月）

#### 対象
- 一般ユーザー（限定公開）

#### 実施内容
- 広告・告知
- ユーザー獲得
- 本格的な負荷テスト
- 運用監視

---

## 📊 ユーザーに使ってもらう流れ

### Step 1: 告知・マーケティング

#### 告知チャネル
- [ ] SNS（Twitter、Instagram、Facebook）
- [ ] 大学への案内（メール、掲示板）
- [ ] 留学関連コミュニティへの投稿
- [ ] 口コミ・紹介プログラム

#### 告知内容
- サービス概要
- 主な機能
- 利用開始方法
- 特典・キャンペーン（あれば）

### Step 2: オンボーディング

#### 新規ユーザー向け
- [ ] チュートリアルページ
- [ ] 使い方ガイド
- [ ] サンプル投稿の表示
- [ ] 初回ログイン時の案内

#### サポート体制
- [ ] ヘルプページ
- [ ] FAQ
- [ ] お問い合わせフォーム
- [ ] サポートメール

### Step 3: 継続的な改善

#### モニタリング
- [ ] アクセス解析（Google Analytics等）
- [ ] エラーログ監視
- [ ] パフォーマンス監視
- [ ] ユーザー行動分析

#### 改善サイクル
1. データ収集（週次）
2. 分析・課題抽出（月次）
3. 改善実装（随時）
4. 効果測定（月次）

---

## ⚠️ リスク管理

### 技術的リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| データベース移行失敗 | 高 | バックアップ徹底、段階的移行 |
| パフォーマンス低下 | 中 | 負荷テスト、最適化 |
| セキュリティ問題 | 高 | セキュリティ監査、定期的な更新 |
| サーバー障害 | 中 | 監視体制、バックアップサーバー検討 |

### 運用リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| ユーザー獲得不足 | 中 | マーケティング強化 |
| サポート体制不足 | 中 | ドキュメント整備、FAQ充実 |
| サーバーコスト | 低 | 使用量監視、最適化 |

---

## 📅 スケジュール（例）

```
Week 1-2: 環境構築・データベース移行準備
Week 3-4: コード修正・デプロイ
Week 5:   内部テスト
Week 6-7: クローズドベータ
Week 8:   オープンベータ開始
```

---

## 📝 チェックリスト

### 移行前
- [ ] レンタルサーバー仕様確認
- [ ] データベース設計確認
- [ ] 移行計画の承認

### 移行中
- [ ] データバックアップ
- [ ] スキーマ変換
- [ ] コード修正
- [ ] テスト環境での動作確認

### 移行後
- [ ] 本番環境での動作確認
- [ ] パフォーマンステスト
- [ ] セキュリティチェック
- [ ] ドキュメント更新

---

**最終更新**: 2024年  
**ステータス**: 計画段階









