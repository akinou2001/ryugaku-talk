-- 正規化名カラムを追加し、検索性能を向上させるマイグレーション

ALTER TABLE universities
ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- 検索速度向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_universities_normalized_name ON universities (normalized_name);


