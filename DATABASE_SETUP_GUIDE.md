# 大学データベース準備ガイド

このドキュメントでは、Supabaseデータベースに大学マスターデータを準備するまでの全工程を説明します。

## 📋 目次

1. [データベーススキーマの作成](#1-データベーススキーマの作成)
2. [大学データのインポート](#2-大学データのインポート)
3. [データクリーンアップ](#3-データクリーンアップ)
4. [日本語名の追加](#4-日本語名の追加)
5. [実行順序のまとめ](#5-実行順序のまとめ)

---

## 1. データベーススキーマの作成

### 1.1 テーブル構造

大学マスターデータを管理するためのテーブルを作成します。

**ファイル**: `supabase-schema-universities.sql`

#### 作成されるテーブル

1. **`continents`** - 大陸マスターテーブル
   - `id`: 主キー（SERIAL）
   - `name_en`: 英語名（UNIQUE）
   - `name_ja`: 日本語名
   - `created_at`: 作成日時

2. **`universities`** - 大学マスターテーブル
   - `id`: 主キー（UUID）
   - `country_code`: 国コード（VARCHAR(2)）
   - `continent_id`: 大陸ID（外部キー）
   - `name_en`: 英語名
   - `name_ja`: 日本語名（初期はNULL）
   - `city`: 都市名
   - `latitude`: 緯度
   - `longitude`: 経度
   - `website`: ウェブサイトURL
   - `tags`: タグ配列
   - `created_at`: 作成日時
   - `updated_at`: 更新日時

3. **`university_aliases`** - 大学エイリアステーブル（表記ゆれ・略称管理）
   - `id`: 主キー（UUID）
   - `university_id`: 大学ID（外部キー）
   - `alias`: エイリアス名
   - `alias_type`: エイリアスタイプ（abbreviation, variant, old_name, other）
   - `created_at`: 作成日時

#### インデックス

- `idx_universities_country_code`: 国コードでの検索を高速化
- `idx_universities_continent_id`: 大陸IDでの検索を高速化
- `idx_universities_name_en`: 英語名での検索を高速化
- `idx_universities_name_ja`: 日本語名での検索を高速化

#### RLS（Row Level Security）ポリシー

すべてのテーブルでSELECT権限は全ユーザーに開放されています。

### 1.2 実行方法

SupabaseダッシュボードのSQL Editorで実行：

```sql
-- supabase-schema-universities.sql の内容を実行
```

または、psqlコマンドで実行：

```bash
psql -h [ホスト名] -U [ユーザー名] -d [データベース名] -f supabase-schema-universities.sql
```

### 1.3 初期データ

大陸マスターデータが自動的に投入されます：
- North America（北アメリカ）
- Asia（アジア）
- Europe（ヨーロッパ）
- Oceania（オセアニア）
- South America（南アメリカ）
- Africa（アフリカ）

---

## 2. 大学データのインポート

### 2.1 データソース

Hipo/university-domains-list APIから大学データを取得します。

**ファイル**: `scripts/import-universities.ts`

### 2.2 インポート処理の流れ

1. **大陸マスタの取得**
   - データベースから大陸マスタを取得
   - 国コードと大陸のマッピングを作成

2. **大学データの取得**
   - Hipo APIから全大学データを取得
   - 国名を国コードに変換
   - 大陸マッピングを適用

3. **データの正規化**
   - 大学名を正規化（`normalized_name`）
   - 重複チェック
   - バッチ処理（200件ずつ）

4. **データベースへの投入**
   - `upsert`を使用して重複を自動スキップ
   - `name_en`と`country_code`の組み合わせでユニーク制約を利用

### 2.3 実行方法

```bash
npx tsx scripts/import-universities.ts
```

### 2.4 処理結果

- ✅ 成功: インポートされた大学数
- ⏭️ スキップ: 重複やマッピングエラーでスキップされた件数
- ❌ エラー: エラーが発生した件数

---

## 3. データクリーンアップ

### 3.1 重複データの削除

**ファイル**: `remove-duplicate-universities.sql`

`name_en`と`country_code`の組み合わせで重複しているレコードを削除します。

#### 実行前の確認

```sql
-- 重複データを確認
SELECT 
  name_en, 
  country_code, 
  COUNT(*) as duplicate_count
FROM universities
GROUP BY name_en, country_code
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name_en;
```

#### 重複削除

```sql
-- 各組み合わせで最新の1件のみ残す
DELETE FROM universities
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY name_en, country_code 
        ORDER BY created_at DESC
      ) as row_num
    FROM universities
  ) ranked
  WHERE row_num > 1
);
```

### 3.2 ユニーク制約の追加

**ファイル**: `add-unique-constraint-universities-safe.sql`

重複削除後、`name_en`と`country_code`の組み合わせにユニーク制約を追加します。

#### 制約の追加

```sql
ALTER TABLE universities 
ADD CONSTRAINT universities_name_en_country_code_unique 
UNIQUE (name_en, country_code);
```

この制約により、同じ大学名と国コードの組み合わせが重複して登録されることを防ぎます。

### 3.3 正規化名カラムの追加

**ファイル**: `add-normalized-name-column.sql`（存在する場合）

大学名を正規化した値を保存するカラムを追加します。これにより、表記ゆれのある大学名でも検索できるようになります。

---

## 4. 日本語名の追加

### 4.1 日本の大学データのエクスポート

**ファイル**: `scripts/export-japanese-universities-csv.ts`

日本の大学データ（`country_code = 'JP'`）をCSV形式でエクスポートします。

#### 実行方法

```bash
npx tsx scripts/export-japanese-universities-csv.ts
```

#### 出力ファイル

- `exports/japanese-universities-001.csv`（1000件ごとに分割）

### 4.2 日本語名の翻訳と追加

**ファイル**: `scripts/add-japanese-names-to-csv.ts`

CSVファイルの英語名（`name_en`）を日本語に翻訳して、`name_ja`カラムに追加します。

#### 翻訳方法

1. **特殊な大学名のマッピング**
   - 主要大学（東京大学、京都大学、早稲田大学など）は正確な日本語名をマッピング

2. **一般的な翻訳パターン**
   - 地名の置換（Aichi → 愛知、Tokyo → 東京など）
   - 大学の種類の置換（University → 大学、College → 大学など）
   - 専門分野の置換（Medical → 医科、Technology → 工業など）

#### 実行方法

```bash
npx tsx scripts/add-japanese-names-to-csv.ts
```

#### 出力ファイル

- `exports/japanese-universities-001-with-ja.csv`

### 4.3 SQL文の生成

**ファイル**: `scripts/generate-update-sql-from-csv.ts`

CSVファイルから、データベースを更新するためのSQL文を生成します。

#### 実行方法

```bash
npx tsx scripts/generate-update-sql-from-csv.ts
```

#### 出力ファイル

- `update-japanese-names.sql` - 570件のUPDATE文を含むSQLファイル

#### 生成されるSQLの形式

```sql
BEGIN;

UPDATE universities 
SET name_ja = '愛知文教大学', updated_at = NOW()
WHERE id = 'bc136f55-cf9d-49f9-bff3-21f7feb8d4b2' AND country_code = 'JP';

-- ... 570件のUPDATE文 ...

COMMIT;

-- 更新された件数を確認
SELECT COUNT(*) as updated_count
FROM universities
WHERE country_code = 'JP' AND name_ja IS NOT NULL;
```

### 4.4 データベースへの反映

#### 方法1: Supabaseダッシュボードで実行（推奨）

1. Supabaseダッシュボードにログイン
2. 左メニューから「SQL Editor」を選択
3. 「New query」をクリック
4. `update-japanese-names.sql`の内容をコピー＆ペースト
5. 「Run」をクリックして実行

#### 方法2: psqlコマンドで実行

```bash
psql -h [ホスト名] -U [ユーザー名] -d [データベース名] -f update-japanese-names.sql
```

#### 実行後の確認

```sql
-- 更新された件数を確認
SELECT COUNT(*) as updated_count
FROM universities
WHERE country_code = 'JP' AND name_ja IS NOT NULL;

-- サンプルデータを確認
SELECT id, name_en, name_ja, country_code
FROM universities
WHERE country_code = 'JP' AND name_ja IS NOT NULL
LIMIT 10;
```

---

## 5. 実行順序のまとめ

### 完全なセットアップ手順

1. **スキーマ作成**
   ```bash
   # Supabase SQL Editorで実行
   # supabase-schema-universities.sql
   ```

2. **大学データのインポート**
   ```bash
   npx tsx scripts/import-universities.ts
   ```

3. **データクリーンアップ**
   ```bash
   # Supabase SQL Editorで実行
   # remove-duplicate-universities.sql
   # add-unique-constraint-universities-safe.sql
   ```

4. **日本の大学データのエクスポート**
   ```bash
   npx tsx scripts/export-japanese-universities-csv.ts
   ```

5. **日本語名の追加**
   ```bash
   npx tsx scripts/add-japanese-names-to-csv.ts
   ```

6. **SQL文の生成**
   ```bash
   npx tsx scripts/generate-update-sql-from-csv.ts
   ```

7. **データベースへの反映**
   ```bash
   # Supabase SQL Editorで実行
   # update-japanese-names.sql
   ```

### 必要なファイル一覧

#### SQLファイル
- `supabase-schema-universities.sql` - スキーマ作成
- `remove-duplicate-universities.sql` - 重複削除
- `add-unique-constraint-universities-safe.sql` - ユニーク制約追加
- `update-japanese-names.sql` - 日本語名更新

#### TypeScriptスクリプト
- `scripts/import-universities.ts` - 大学データインポート
- `scripts/export-japanese-universities-csv.ts` - CSVエクスポート
- `scripts/add-japanese-names-to-csv.ts` - 日本語名追加
- `scripts/generate-update-sql-from-csv.ts` - SQL生成

#### データファイル
- `exports/japanese-universities-001.csv` - エクスポートされたCSV
- `exports/japanese-universities-001-with-ja.csv` - 日本語名追加済みCSV

---

## 6. トラブルシューティング

### 6.1 重複エラーが発生する場合

ユニーク制約を追加する前に、必ず重複データを削除してください。

```sql
-- 重複を確認
SELECT name_en, country_code, COUNT(*) 
FROM universities 
GROUP BY name_en, country_code 
HAVING COUNT(*) > 1;
```

### 6.2 日本語名が更新されない場合

- `id`が正しいか確認
- `country_code = 'JP'`の条件が満たされているか確認
- トランザクションが正常にコミットされたか確認

### 6.3 パフォーマンスの問題

大量のデータをインポートする際は、バッチサイズを調整してください。

```typescript
// scripts/import-universities.ts 内
const batchSize = 200; // 必要に応じて調整
```

---

## 7. 今後の拡張

### 7.1 座標情報の追加

**ファイル**: `scripts/enrich-universities-coordinates.ts`

大学の緯度・経度情報を追加するスクリプトが用意されています。

### 7.2 エイリアスの管理

`university_aliases`テーブルを使用して、大学名の表記ゆれや略称を管理できます。

---

## 8. 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Hipo/university-domains-list](https://github.com/Hipo/university-domains-list)

---

## 更新履歴

- 2026-01-07: 初版作成
  - データベーススキーマの作成
  - 大学データのインポート
  - 日本語名の追加機能

