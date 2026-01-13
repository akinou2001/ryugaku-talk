-- is_organization_ownerカラムを追加
-- このファイルをSupabaseのSQL Editorで実行してください

-- profilesテーブルにis_organization_ownerカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_organization_owner BOOLEAN DEFAULT FALSE;

-- 既存のデータに対して、認証済みの組織アカウントをオーナーとして設定（オプション）
-- 既に認証済みの組織アカウントがある場合、それらをオーナーとして設定
UPDATE profiles 
SET is_organization_owner = TRUE 
WHERE account_type IN ('educational', 'company', 'government') 
  AND verification_status = 'verified' 
  AND is_organization_owner IS NULL;

