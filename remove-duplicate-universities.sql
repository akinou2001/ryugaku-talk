-- 重複している大学データを確認・削除するスクリプト
-- name_en と country_code の組み合わせで重複しているレコードを削除

-- 1. 重複データを確認
SELECT 
  name_en, 
  country_code, 
  COUNT(*) as duplicate_count
FROM universities
GROUP BY name_en, country_code
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name_en;

-- 2. 重複データを削除（各組み合わせで最新の1件のみ残す）
-- 注意: このクエリは実行前に必ずバックアップを取ってください

-- 方法1: ROW_NUMBER()を使用（推奨）
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

-- 方法2: DISTINCT ONを使用（方法1が動作しない場合）
-- DELETE FROM universities
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (name_en, country_code) id
--   FROM universities
--   ORDER BY name_en, country_code, created_at DESC
-- );

-- 3. 削除後の確認（重複がなくなったことを確認）
SELECT 
  name_en, 
  country_code, 
  COUNT(*) as count
FROM universities
GROUP BY name_en, country_code
HAVING COUNT(*) > 1;

-- このクエリが0件を返すことを確認してから、ユニーク制約を追加してください

