-- 認証申請の取得テスト用SQL
-- SupabaseダッシュボードのSQL Editorで実行して、データが存在するか確認してください

-- 1. 全認証申請を確認（RLSポリシーを無視）
SELECT 
  ovr.id,
  ovr.organization_name,
  ovr.status,
  ovr.profile_id,
  ovr.created_at,
  p.name as profile_name,
  p.email as profile_email,
  p.is_admin as profile_is_admin
FROM organization_verification_requests ovr
LEFT JOIN profiles p ON p.id = ovr.profile_id
ORDER BY ovr.created_at DESC;

-- 2. pendingステータスの申請を確認
SELECT 
  ovr.id,
  ovr.organization_name,
  ovr.status,
  ovr.profile_id,
  ovr.created_at
FROM organization_verification_requests ovr
WHERE ovr.status = 'pending'
ORDER BY ovr.created_at DESC;

-- 3. 現在ログインしているユーザーが管理者か確認
SELECT 
  id,
  email,
  name,
  is_admin
FROM profiles
WHERE id = auth.uid();

-- 4. 管理者アカウント一覧
SELECT 
  id,
  email,
  name,
  is_admin
FROM profiles
WHERE is_admin = true;

-- 5. RLSポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organization_verification_requests';



