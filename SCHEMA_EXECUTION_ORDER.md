# データベーススキーマ実行順序ガイド

## 実行順序

以下の順序でSQLファイルを実行してください：

### 1. 基本スキーマ（必須）
**ファイル**: `supabase-schema.sql`
- 最初に実行する必要があります
- `profiles`, `posts`, `comments`, `likes`, `messages`, `reports` テーブルを作成

### 2. 組織アカウント機能（推奨）
**ファイル**: `supabase-schema-organization-accounts.sql`
- 組織アカウント機能を使用する場合に実行
- `profiles`テーブルに`account_type`などのカラムを追加
- **注意**: コミュニティ機能を使用する場合は必須です

### 3. 管理者機能（オプション）
**ファイル**: `supabase-schema-admin.sql`
- 管理者機能を使用する場合に実行
- `profiles`テーブルに`is_admin`などのカラムを追加

### 4. コミュニティ機能（オプション）
**ファイル**: `supabase-schema-community.sql`
- コミュニティ機能を使用する場合に実行
- **注意**: このファイルは自動的に必要なカラムを追加しますが、`supabase-schema-organization-accounts.sql`を先に実行することを推奨します

## エラーが発生した場合

### エラー: `column profiles.account_type does not exist`

**原因**: `profiles`テーブルに`account_type`カラムが存在しない

**解決方法**:
1. `supabase-schema-organization-accounts.sql`を先に実行する
2. または、`supabase-schema-community.sql`を実行（自動的にカラムを追加します）

### エラー: `relation "profiles" already exists`

**原因**: 既にテーブルが存在している

**解決方法**: 
- このエラーは無視して問題ありません
- `IF NOT EXISTS`が使用されているため、既存のテーブルはそのまま使用されます

### エラー: `policy already exists`

**原因**: 既にRLSポリシーが存在している

**解決方法**:
- スキーマファイル内で`DROP POLICY IF EXISTS`を使用しているため、通常は問題ありません
- エラーが続く場合は、既存のポリシーを手動で削除してから再実行してください

## 推奨実行コマンド（Supabase SQL Editor）

```sql
-- 1. 基本スキーマ
-- supabase-schema.sql の内容をコピー＆ペーストして実行

-- 2. 組織アカウント機能（コミュニティ機能を使用する場合は必須）
-- supabase-schema-organization-accounts.sql の内容をコピー＆ペーストして実行

-- 3. 管理者機能（オプション）
-- supabase-schema-admin.sql の内容をコピー＆ペーストして実行

-- 4. コミュニティ機能（オプション）
-- supabase-schema-community.sql の内容をコピー＆ペーストして実行
```

## 確認方法

各スキーマ実行後、以下のクエリでテーブルが正しく作成されているか確認できます：

```sql
-- テーブル一覧を確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- profilesテーブルのカラムを確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```





