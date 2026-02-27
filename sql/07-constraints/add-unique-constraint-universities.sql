-- universitiesテーブルにname_enとcountry_codeの組み合わせでユニーク制約を追加
-- upsert機能を使用するために必要

-- 既存の制約を削除（存在する場合）
ALTER TABLE universities 
DROP CONSTRAINT IF EXISTS universities_name_en_country_code_unique;

-- 制約を追加
ALTER TABLE universities 
ADD CONSTRAINT universities_name_en_country_code_unique 
UNIQUE (name_en, country_code);

