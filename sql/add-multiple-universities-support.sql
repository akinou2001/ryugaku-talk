-- 複数大学登録をサポートするためのテーブル作成

-- ユーザーの所属大学テーブル（複数登録可能）
CREATE TABLE IF NOT EXISTS user_universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE, -- NULLの場合は現在在籍中
  display_order INTEGER DEFAULT 0, -- 表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- ユーザーの留学先大学テーブル（複数登録可能）
CREATE TABLE IF NOT EXISTS user_study_abroad_universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE, -- NULLの場合は現在滞在中
  display_order INTEGER DEFAULT 0, -- 表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_universities_user_id ON user_universities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_universities_university_id ON user_universities(university_id);
CREATE INDEX IF NOT EXISTS idx_user_study_abroad_universities_user_id ON user_study_abroad_universities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_study_abroad_universities_university_id ON user_study_abroad_universities(university_id);

-- プロフィールに表示組織選択用フィールドを追加（組織アカウントのIDを参照）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_organization_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- コメントを追加
COMMENT ON TABLE user_universities IS 'ユーザーの所属大学（複数登録可能）';
COMMENT ON TABLE user_study_abroad_universities IS 'ユーザーの留学先大学（複数登録可能）';
COMMENT ON COLUMN profiles.display_organization_id IS 'プロフィールに表示する組織ID（編集で選択可能）';

-- RLSポリシーを設定
ALTER TABLE user_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_abroad_universities ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own universities" ON user_universities;
DROP POLICY IF EXISTS "Users can insert their own universities" ON user_universities;
DROP POLICY IF EXISTS "Users can update their own universities" ON user_universities;
DROP POLICY IF EXISTS "Users can delete their own universities" ON user_universities;
DROP POLICY IF EXISTS "Users can view all universities" ON user_universities;
DROP POLICY IF EXISTS "Users can view all study abroad universities" ON user_study_abroad_universities;
DROP POLICY IF EXISTS "Users can insert their own study abroad universities" ON user_study_abroad_universities;
DROP POLICY IF EXISTS "Users can update their own study abroad universities" ON user_study_abroad_universities;
DROP POLICY IF EXISTS "Users can delete their own study abroad universities" ON user_study_abroad_universities;

-- 全ユーザーは他のユーザーの大学情報を閲覧可能（所属大学）
CREATE POLICY "Users can view all universities"
  ON user_universities FOR SELECT
  USING (true);

-- ユーザーは自分の大学情報を編集可能（所属大学）
CREATE POLICY "Users can insert their own universities"
  ON user_universities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own universities"
  ON user_universities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own universities"
  ON user_universities FOR DELETE
  USING (auth.uid() = user_id);

-- 全ユーザーは他のユーザーの大学情報を閲覧可能（留学先大学）
CREATE POLICY "Users can view all study abroad universities"
  ON user_study_abroad_universities FOR SELECT
  USING (true);

-- ユーザーは自分の大学情報を編集可能（留学先大学）
CREATE POLICY "Users can insert their own study abroad universities"
  ON user_study_abroad_universities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study abroad universities"
  ON user_study_abroad_universities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study abroad universities"
  ON user_study_abroad_universities FOR DELETE
  USING (auth.uid() = user_id);
