-- universitiesテーブルにname_enとcountry_codeの組み合わせでユニーク制約を追加
-- 注意: このSQLを実行する前に、remove-duplicate-universities.sqlを実行して
--       重複データを削除してください

-- 重複がないことを確認
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT name_en, country_code, COUNT(*) as cnt
    FROM universities
    GROUP BY name_en, country_code
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION '重複データが存在します。先にremove-duplicate-universities.sqlを実行してください。重複件数: %', duplicate_count;
  END IF;
END $$;

-- ユニーク制約を追加（既に存在する場合はスキップ）
DO $$
BEGIN
  -- 制約が既に存在するか確認
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'universities'::regclass
      AND conname = 'universities_name_en_country_code_unique'
  ) THEN
    -- 制約が存在しない場合のみ追加
    ALTER TABLE universities 
    ADD CONSTRAINT universities_name_en_country_code_unique 
    UNIQUE (name_en, country_code);
    
    RAISE NOTICE 'ユニーク制約を追加しました: universities_name_en_country_code_unique';
  ELSE
    RAISE NOTICE 'ユニーク制約は既に存在します: universities_name_en_country_code_unique';
  END IF;
END $$;

-- 確認: 制約が正しく作成されているか確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    ELSE 'OTHER'
  END as constraint_type_name
FROM pg_constraint
WHERE conrelid = 'universities'::regclass
  AND conname = 'universities_name_en_country_code_unique';

