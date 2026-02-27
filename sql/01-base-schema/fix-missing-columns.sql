-- 既存のデータベースに不足しているカラムを追加するスクリプト
-- このスクリプトは supabase-schema-organization-accounts.sql と supabase-schema-admin.sql の内容を含みます

-- profilesテーブルに組織アカウント用カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'educational', 'company', 'government')),
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS organization_type TEXT,
ADD COLUMN IF NOT EXISTS organization_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents TEXT,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT;

-- 既存のプロフィールにaccount_typeのデフォルト値を設定
UPDATE profiles 
SET account_type = 'individual' 
WHERE account_type IS NULL;

-- 既存のプロフィールにverification_statusのデフォルト値を設定
UPDATE profiles 
SET verification_status = 'unverified' 
WHERE verification_status IS NULL;

-- profilesテーブルに管理者用カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 既存のプロフィールに管理者フラグのデフォルト値を設定
UPDATE profiles 
SET is_admin = FALSE 
WHERE is_admin IS NULL;

UPDATE profiles 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- 組織アカウント用のインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_name ON profiles(organization_name);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- 投稿テーブルに組織アカウント用カラムを追加
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS official_category TEXT;

-- 公式投稿用のインデックス
CREATE INDEX IF NOT EXISTS idx_posts_is_official ON posts(is_official);
CREATE INDEX IF NOT EXISTS idx_posts_official_category ON posts(official_category);

-- 組織アカウント認証申請テーブル（オプション：管理用）
CREATE TABLE IF NOT EXISTS organization_verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('educational', 'company', 'government')),
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  organization_url TEXT,
  contact_person_name TEXT NOT NULL,
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

-- 認証申請のインデックス
CREATE INDEX IF NOT EXISTS idx_verification_requests_profile_id ON organization_verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON organization_verification_requests(status);

-- 認証申請のRLSポリシー
ALTER TABLE organization_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証申請は申請者のみ閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "認証ユーザーは認証申請を作成可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "申請者は自分の申請を更新可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;

CREATE POLICY "認証申請は申請者のみ閲覧可能" 
ON organization_verification_requests FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "認証ユーザーは認証申請を作成可能" 
ON organization_verification_requests FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "申請者は自分の申請を更新可能" 
ON organization_verification_requests FOR UPDATE 
USING (auth.uid() = profile_id AND status = 'pending');

-- 管理者は認証申請を閲覧可能
CREATE POLICY "管理者は認証申請を閲覧可能" 
ON organization_verification_requests FOR SELECT 
USING (
  auth.uid() = profile_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 管理者は認証申請を更新可能（承認・拒否）
CREATE POLICY "管理者は認証申請を更新可能" 
ON organization_verification_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 組織アカウントのRLSポリシー（既存のポリシーに追加）
DROP POLICY IF EXISTS "組織アカウントは自分のプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "認証済み組織アカウントは公式投稿を作成可能" ON posts;
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles;
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は認証ステータスを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は投稿を削除可能" ON posts;
DROP POLICY IF EXISTS "管理者はコメントを削除可能" ON comments;
DROP POLICY IF EXISTS "管理者は通報を閲覧可能" ON reports;
DROP POLICY IF EXISTS "管理者は通報を更新可能" ON reports;

-- 組織アカウントは自分のプロフィールを更新可能（認証済みの場合）
CREATE POLICY "組織アカウントは自分のプロフィールを更新可能" 
ON profiles FOR UPDATE 
USING (
  auth.uid() = id OR 
  (account_type IN ('educational', 'company', 'government') AND verification_status = 'verified')
);

-- 組織アカウントは公式投稿を作成可能
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

-- 管理者は全ユーザーのプロフィールを閲覧可能
CREATE POLICY "管理者は全ユーザーのプロフィールを閲覧可能" 
ON profiles FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 管理者は全ユーザーのプロフィールを更新可能
CREATE POLICY "管理者は全ユーザーのプロフィールを更新可能" 
ON profiles FOR UPDATE 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 管理者は組織アカウントの認証ステータスを更新可能
CREATE POLICY "管理者は認証ステータスを更新可能" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 管理者は投稿を削除可能
CREATE POLICY "管理者は投稿を削除可能" 
ON posts FOR DELETE 
USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 管理者はコメントを削除可能
CREATE POLICY "管理者はコメントを削除可能" 
ON comments FOR DELETE 
USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 管理者は通報を閲覧・更新可能
CREATE POLICY "管理者は通報を閲覧可能" 
ON reports FOR SELECT 
USING (
  auth.uid() = reporter_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

CREATE POLICY "管理者は通報を更新可能" 
ON reports FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);




