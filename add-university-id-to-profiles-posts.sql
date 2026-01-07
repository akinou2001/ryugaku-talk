-- profilesとpostsテーブルにuniversity_idカラムを追加するマイグレーション

-- profilesテーブルにuniversity_idカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;

-- postsテーブルにuniversity_idカラムを追加
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_posts_university_id ON posts(university_id);

