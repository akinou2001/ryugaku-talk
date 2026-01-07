-- CSVファイルから日本語名（name_ja）を更新するSQL
-- このSQLは、CSVファイルのデータを一時テーブルにインポートしてから、
-- universitiesテーブルのname_jaを更新します

-- 方法1: 一時テーブルを使用する方法（推奨）
-- まず、CSVファイルをSupabaseのダッシュボードからインポートするか、
-- 以下のように一時テーブルを作成してデータを投入します

-- 一時テーブルを作成
CREATE TEMP TABLE temp_university_updates (
  id UUID,
  name_en TEXT,
  name_ja TEXT,
  country_code VARCHAR(2),
  city TEXT,
  website TEXT
);

-- CSVファイルのデータを一時テーブルにインポート
-- 注意: Supabaseのダッシュボードの「Table Editor」→「Import data from CSV」を使用するか、
-- 以下のように手動でINSERT文を実行してください

-- 例: 最初の数件を手動でINSERT（実際にはCSV全体をインポートする必要があります）
-- INSERT INTO temp_university_updates (id, name_en, name_ja, country_code, city, website) VALUES
-- ('bc136f55-cf9d-49f9-bff3-21f7feb8d4b2', 'Aichi Bunkyo University', '愛知文教大学', 'JP', NULL, 'http://www.abu.ac.jp/'),
-- ('1c404c42-739e-4be1-ab60-39716d3e1f60', 'Aichi Gakuin University', '愛知学院大学', 'JP', NULL, 'http://www.aichi-gakuin.ac.jp/');

-- 一時テーブルにデータが投入されたら、以下のUPDATE文を実行
UPDATE universities u
SET 
  name_ja = t.name_ja,
  updated_at = NOW()
FROM temp_university_updates t
WHERE u.id = t.id
  AND u.country_code = 'JP'
  AND t.name_ja IS NOT NULL
  AND t.name_ja != '';

-- 更新された件数を確認
SELECT COUNT(*) as updated_count
FROM universities u
INNER JOIN temp_university_updates t ON u.id = t.id
WHERE u.country_code = 'JP'
  AND u.name_ja IS NOT NULL;

-- 一時テーブルを削除（セッション終了時に自動削除されます）
-- DROP TABLE IF EXISTS temp_university_updates;

