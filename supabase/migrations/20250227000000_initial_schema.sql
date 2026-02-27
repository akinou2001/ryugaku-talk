-- ============================================================
-- 001: 初期スキーマ（ベース + 大学 + 組織アカウント + 管理者 + コミュニティ）
-- 元: sql/01-base-schema/ の適用順
-- ============================================================

-- ----- 1. ベース（profiles, posts, comments, likes, messages, reports + RLS + トリガー） -----
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  university TEXT,
  study_abroad_destination TEXT,
  major TEXT,
  bio TEXT,
  languages TEXT[] DEFAULT '{}',
  contribution_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('question', 'diary', 'information')),
  tags TEXT[] DEFAULT '{}',
  university TEXT,
  study_abroad_destination TEXT,
  major TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のプロフィールを更新可能" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "ユーザーは自分のプロフィールを挿入可能" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "投稿は誰でも閲覧可能" ON posts FOR SELECT USING (true);
CREATE POLICY "認証ユーザーは投稿を作成可能" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "投稿者は自分の投稿を更新・削除可能" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "投稿者は自分の投稿を削除可能" ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "コメントは誰でも閲覧可能" ON comments FOR SELECT USING (true);
CREATE POLICY "認証ユーザーはコメントを作成可能" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "コメント作成者は自分のコメントを更新・削除可能" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "コメント作成者は自分のコメントを削除可能" ON comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "いいねは誰でも閲覧可能" ON likes FOR SELECT USING (true);
CREATE POLICY "認証ユーザーはいいねを作成可能" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のいいねを削除可能" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "メッセージの送信者・受信者のみ閲覧可能" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "認証ユーザーはメッセージを送信可能" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "メッセージ受信者は既読に更新可能" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "通報は誰でも閲覧可能" ON reports FOR SELECT USING (true);
CREATE POLICY "認証ユーザーは通報を作成可能" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ----- 2. 大学マスター -----
CREATE TABLE IF NOT EXISTS continents (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL UNIQUE,
  name_ja TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  continent_id INTEGER REFERENCES continents(id),
  name_en TEXT NOT NULL,
  name_ja TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS university_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  alias TEXT NOT NULL,
  alias_type TEXT CHECK (alias_type IN ('abbreviation', 'variant', 'old_name', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(university_id, alias)
);

CREATE INDEX IF NOT EXISTS idx_universities_country_code ON universities(country_code);
CREATE INDEX IF NOT EXISTS idx_universities_continent_id ON universities(continent_id);
CREATE INDEX IF NOT EXISTS idx_universities_name_en ON universities(name_en);
CREATE INDEX IF NOT EXISTS idx_universities_name_ja ON universities(name_ja);
CREATE INDEX IF NOT EXISTS idx_university_aliases_university_id ON university_aliases(university_id);
CREATE INDEX IF NOT EXISTS idx_university_aliases_alias ON university_aliases(alias);

ALTER TABLE continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "大陸データは誰でも閲覧可能" ON continents FOR SELECT USING (true);
CREATE POLICY "大学データは誰でも閲覧可能" ON universities FOR SELECT USING (true);
CREATE POLICY "エイリアスデータは誰でも閲覧可能" ON university_aliases FOR SELECT USING (true);

INSERT INTO continents (name_en, name_ja) VALUES
  ('North America', '北アメリカ'),
  ('Asia', 'アジア'),
  ('Europe', 'ヨーロッパ'),
  ('Oceania', 'オセアニア'),
  ('South America', '南アメリカ'),
  ('Africa', 'アフリカ')
ON CONFLICT (name_en) DO NOTHING;

-- ----- 3. 組織アカウント（profiles/posts 拡張 + organization_verification_requests, organization_members） -----
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'educational', 'company', 'government')),
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS organization_type TEXT,
ADD COLUMN IF NOT EXISTS organization_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents TEXT,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS is_organization_owner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS official_category TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_name ON profiles(organization_name);
CREATE INDEX IF NOT EXISTS idx_posts_is_official ON posts(is_official);
CREATE INDEX IF NOT EXISTS idx_posts_official_category ON posts(official_category);

DROP POLICY IF EXISTS "組織アカウントは自分のプロフィールを更新可能" ON profiles;
CREATE POLICY "組織アカウントは自分のプロフィールを更新可能"
ON profiles FOR UPDATE
USING (
  auth.uid() = id OR
  (account_type IN ('educational', 'company', 'government') AND verification_status = 'verified')
);

DROP POLICY IF EXISTS "認証済み組織アカウントは公式投稿を作成可能" ON posts;
CREATE POLICY "認証済み組織アカウントは公式投稿を作成可能"
ON posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = author_id
    AND account_type IN ('educational', 'company', 'government')
    AND verification_status = 'verified'
  )
);

CREATE TABLE IF NOT EXISTS organization_verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('educational', 'company', 'government')),
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  organization_url TEXT,
  contact_person_name TEXT,
  contact_person_email TEXT NOT NULL,
  contact_person_phone TEXT,
  verification_documents TEXT,
  request_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_profile_id ON organization_verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON organization_verification_requests(status);

ALTER TABLE organization_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証申請は申請者のみ閲覧可能" ON organization_verification_requests FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "認証ユーザーは認証申請を作成可能" ON organization_verification_requests FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "申請者は自分の申請を更新可能" ON organization_verification_requests FOR UPDATE USING (auth.uid() = profile_id AND status = 'pending');

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_member_id ON organization_members(member_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "組織メンバーは誰でも閲覧可能" ON organization_members FOR SELECT USING (true);
CREATE POLICY "組織オーナーはメンバーを招待可能" ON organization_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = organization_id AND is_organization_owner = true AND verification_status = 'verified' AND auth.uid() = id
  )
);
CREATE POLICY "組織オーナーはメンバー情報を更新可能" ON organization_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = organization_id AND is_organization_owner = true AND verification_status = 'verified' AND auth.uid() = id
  )
);
CREATE POLICY "招待されたメンバーは自分の招待を更新可能" ON organization_members FOR UPDATE USING (auth.uid() = member_id AND status = 'pending');
CREATE POLICY "組織オーナーはメンバーを削除可能" ON organization_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = organization_id AND is_organization_owner = true AND verification_status = 'verified' AND auth.uid() = id
  )
);

-- ----- 4. 管理者（profiles is_admin 等 + 管理者RLS + admin_stats） -----
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles;
CREATE POLICY "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles FOR SELECT
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを更新可能" ON profiles;
CREATE POLICY "管理者は全ユーザーのプロフィールを更新可能" ON profiles FOR UPDATE
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は認証ステータスを更新可能" ON profiles;
CREATE POLICY "管理者は認証ステータスを更新可能" ON profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
CREATE POLICY "管理者は認証申請を閲覧可能" ON organization_verification_requests FOR SELECT
USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;
CREATE POLICY "管理者は認証申請を更新可能" ON organization_verification_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は投稿を削除可能" ON posts;
CREATE POLICY "管理者は投稿を削除可能" ON posts FOR DELETE
USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者はコメントを削除可能" ON comments;
CREATE POLICY "管理者はコメントを削除可能" ON comments FOR DELETE
USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は通報を閲覧可能" ON reports;
CREATE POLICY "管理者は通報を閲覧可能" ON reports FOR SELECT
USING (auth.uid() = reporter_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "管理者は通報を更新可能" ON reports;
CREATE POLICY "管理者は通報を更新可能" ON reports FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE account_type = 'individual') as individual_users,
  (SELECT COUNT(*) FROM profiles WHERE account_type = 'educational') as educational_users,
  (SELECT COUNT(*) FROM profiles WHERE account_type = 'company') as company_users,
  (SELECT COUNT(*) FROM profiles WHERE account_type = 'government') as government_users,
  (SELECT COUNT(*) FROM profiles WHERE verification_status = 'pending') as pending_verifications,
  (SELECT COUNT(*) FROM profiles WHERE verification_status = 'verified') as verified_organizations,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM posts WHERE is_official = TRUE) as official_posts,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports;
