-- 組織アカウント機能の追加スキーマ
-- 既存のsupabase-schema.sqlに追加で実行してください

-- profilesテーブルに組織アカウント用カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'educational', 'company', 'government')),
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS organization_type TEXT, -- 大学名、企業名、省庁名など
ADD COLUMN IF NOT EXISTS organization_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents TEXT, -- 認証用書類のURLやパス
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT;

-- 組織アカウント用のインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_name ON profiles(organization_name);

-- 投稿テーブルに組織アカウント用カラムを追加
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE, -- 公式投稿かどうか
ADD COLUMN IF NOT EXISTS official_category TEXT; -- 公式投稿のカテゴリ（奨学金情報、イベント情報など）

-- 公式投稿用のインデックス
CREATE INDEX IF NOT EXISTS idx_posts_is_official ON posts(is_official);
CREATE INDEX IF NOT EXISTS idx_posts_official_category ON posts(official_category);

-- 組織アカウントのRLSポリシー（既存のポリシーに追加）
-- 組織アカウントは自分のプロフィールを更新可能（認証済みの場合）
CREATE POLICY IF NOT EXISTS "組織アカウントは自分のプロフィールを更新可能" 
ON profiles FOR UPDATE 
USING (
  auth.uid() = id OR 
  (account_type IN ('educational', 'company', 'government') AND verification_status = 'verified')
);

-- 組織アカウントは公式投稿を作成可能
CREATE POLICY IF NOT EXISTS "認証済み組織アカウントは公式投稿を作成可能" 
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

-- コメント：既存のポリシーで問題なし

-- いいね：既存のポリシーで問題なし

-- メッセージ：既存のポリシーで問題なし

-- 通報：既存のポリシーで問題なし

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

CREATE POLICY IF NOT EXISTS "認証申請は申請者のみ閲覧可能" 
ON organization_verification_requests FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "認証ユーザーは認証申請を作成可能" 
ON organization_verification_requests FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "申請者は自分の申請を更新可能" 
ON organization_verification_requests FOR UPDATE 
USING (auth.uid() = profile_id AND status = 'pending');

