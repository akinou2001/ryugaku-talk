-- ============================================================
-- 007: 制約追加（universities name_en + country_code ユニーク）
-- 元: sql/07-constraints/add-unique-constraint-universities-safe.sql
-- 本番で重複データがある場合は先に remove-duplicate-universities を実行すること
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'universities'::regclass AND conname = 'universities_name_en_country_code_unique'
  ) THEN
    ALTER TABLE universities ADD CONSTRAINT universities_name_en_country_code_unique UNIQUE (name_en, country_code);
  END IF;
END $$;
