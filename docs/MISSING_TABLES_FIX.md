# テーブルが存在しない問題の解決方法

`profiles`テーブルやその他の基本テーブルが存在しない場合の解決方法です。

## 🔍 問題の症状

- `profiles`テーブルが存在しない
- ログインできない、またはログイン後にエラーが発生する
- アプリケーションが正常に動作しない

## 📋 原因

ベーススキーマのSQLファイル（`sql/01-base-schema/supabase-schema.sql`）が実行されていない可能性があります。

## 🔧 解決方法

### ステップ1: ベーススキーマを実行

1. **本番環境のSupabaseダッシュボード**で「SQL Editor」を開く

2. **`sql/01-base-schema/supabase-schema.sql`の内容を実行**

   このファイルには以下のテーブルが含まれています：
   - `profiles` - ユーザープロフィール
   - `posts` - 投稿
   - `comments` - コメント
   - `likes` - いいね
   - `messages` - メッセージ
   - `reports` - 通報

3. **実行結果を確認**
   - エラーが発生した場合は、エラーメッセージを確認
   - 成功した場合は、次のステップに進む

### ステップ2: 他のベーススキーマファイルを実行

`sql/01-base-schema/`フォルダ内の他のSQLファイルも順番に実行：

1. **`supabase-schema-universities.sql`**
   - 大学マスターテーブル

2. **`supabase-schema-organization-accounts.sql`**
   - 組織アカウント機能

3. **`supabase-schema-admin.sql`**
   - 管理者機能

4. **`supabase-schema-community.sql`**
   - コミュニティ機能

5. **`fix-missing-columns.sql`**
   - 不足しているカラムの修正

### ステップ3: テーブルの存在を確認

1. **Supabaseダッシュボード**で「Table Editor」を開く
2. **以下のテーブルが存在するか確認**：
   - `profiles`
   - `posts`
   - `comments`
   - `likes`
   - `messages`
   - `reports`
   - `universities`
   - `communities`

### ステップ4: 残りのSQLファイルを実行

ベーススキーマの実行後、残りのSQLファイルも順番に実行：

- `sql/02-features/` - 機能追加
- `sql/03-columns/` - カラム追加
- `sql/04-storage/` - ストレージ設定
- `sql/05-rls-policies/` - RLSポリシー修正
- `sql/06-triggers/` - トリガー・関数
- `sql/07-constraints/` - 制約・インデックス

## ⚠️ 重要な注意事項

### 1. 実行順序を守る

- **必ず`sql/01-base-schema/`から順番に実行**してください
- 依存関係があるため、順序を変えるとエラーが発生します

### 2. エラーハンドリング

- `IF NOT EXISTS`を使用しているため、一部のSQLは重複実行しても安全です
- ただし、エラーが発生した場合は、そのSQLファイルの内容を確認してください

### 3. 既存データがある場合

- 本番環境に既存データがある場合、SQLファイルの実行前にバックアップを取得してください

## 📝 チェックリスト

ベーススキーマの実行後、以下を確認してください：

- [ ] `profiles`テーブルが存在する
- [ ] `posts`テーブルが存在する
- [ ] `comments`テーブルが存在する
- [ ] `likes`テーブルが存在する
- [ ] `messages`テーブルが存在する
- [ ] `reports`テーブルが存在する
- [ ] `universities`テーブルが存在する（`supabase-schema-universities.sql`実行後）
- [ ] `communities`テーブルが存在する（`supabase-schema-community.sql`実行後）

## 🔗 関連ドキュメント

- [SQL_MIGRATION_ORDER.md](./SQL_MIGRATION_ORDER.md) - SQLファイルの実行順序
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - 環境分離の設定
