-- 管理者機能の追加スキーマ
-- 既存のsupabase-schema.sqlに追加で実行してください

-- profilesテーブルに管理者フラグを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 管理者用のインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- 管理者は全ユーザーのプロフィールを閲覧可能
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles;
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
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを更新可能" ON profiles;
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
DROP POLICY IF EXISTS "管理者は認証ステータスを更新可能" ON profiles;
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

-- 管理者は認証申請を閲覧可能
DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
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
DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;
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

-- 管理者は投稿を削除可能
DROP POLICY IF EXISTS "管理者は投稿を削除可能" ON posts;
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
DROP POLICY IF EXISTS "管理者はコメントを削除可能" ON comments;
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
DROP POLICY IF EXISTS "管理者は通報を閲覧可能" ON reports;
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

DROP POLICY IF EXISTS "管理者は通報を更新可能" ON reports;
CREATE POLICY "管理者は通報を更新可能" 
ON reports FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 統計情報用のビュー（オプション）
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

