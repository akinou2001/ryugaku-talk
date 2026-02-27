-- プロフィールテーブルに留学先大学IDフィールドを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS study_abroad_university_id UUID REFERENCES universities(id) ON DELETE SET NULL;

-- インデックスを作成（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_profiles_study_abroad_university_id ON profiles(study_abroad_university_id);

-- コメントを追加
COMMENT ON COLUMN profiles.study_abroad_university_id IS '留学先大学ID（正規留学の場合のみ使用）';

