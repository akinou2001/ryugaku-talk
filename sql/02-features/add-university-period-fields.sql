-- プロフィールテーブルに所属大学・留学先大学の在籍・滞在期間フィールドを追加

-- 所属大学の在籍期間
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS university_start_date DATE,
ADD COLUMN IF NOT EXISTS university_end_date DATE;

-- 留学先大学の滞在期間
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS study_abroad_start_date DATE,
ADD COLUMN IF NOT EXISTS study_abroad_end_date DATE;

-- コメントを追加
COMMENT ON COLUMN profiles.university_start_date IS '所属大学の在籍開始日';
COMMENT ON COLUMN profiles.university_end_date IS '所属大学の在籍終了日（NULLの場合は現在在籍中）';
COMMENT ON COLUMN profiles.study_abroad_start_date IS '留学先大学の滞在開始日';
COMMENT ON COLUMN profiles.study_abroad_end_date IS '留学先大学の滞在終了日（NULLの場合は現在滞在中）';
