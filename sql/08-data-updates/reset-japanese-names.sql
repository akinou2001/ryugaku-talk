-- 日本語名（name_ja）をすべてNULLにリセット
UPDATE universities
SET name_ja = NULL
WHERE name_ja IS NOT NULL;

-- 更新件数を確認
SELECT 
  COUNT(*) FILTER (WHERE name_ja IS NOT NULL) as with_japanese_name,
  COUNT(*) FILTER (WHERE name_ja IS NULL) as without_japanese_name,
  COUNT(*) as total
FROM universities;

