-- 管理者が認証申請を閲覧できるようにするRLSポリシーの修正
-- SupabaseダッシュボードのSQL Editorで実行してください

-- ============================================
-- 1. 既存のポリシーを削除
-- ============================================
DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "申請者は自分の申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "申請者は自分の申請を作成可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "申請者は自分の申請を更新可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "認証申請は申請者のみ閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "認証ユーザーは認証申請を作成可能" ON organization_verification_requests;

-- ============================================
-- 2. 新しいRLSポリシーを作成
-- ============================================

-- 管理者は認証申請を閲覧可能
-- 注意: RLSポリシー内でprofilesテーブルを参照する際の無限再帰を避けるため、
-- 直接auth.uid()を使用してis_adminをチェックします
CREATE POLICY "管理者は認証申請を閲覧可能" ON organization_verification_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- 申請者は自分の申請を閲覧可能
CREATE POLICY "申請者は自分の申請を閲覧可能" ON organization_verification_requests
  FOR SELECT
  USING (profile_id = auth.uid());

-- 申請者は自分の申請を作成可能
CREATE POLICY "申請者は自分の申請を作成可能" ON organization_verification_requests
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- 管理者は認証申請を更新可能
CREATE POLICY "管理者は認証申請を更新可能" ON organization_verification_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- 申請者は自分の申請を更新可能（pending状態の場合のみ）
CREATE POLICY "申請者は自分の申請を更新可能" ON organization_verification_requests
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    AND status = 'pending'
  );

-- ============================================
-- profiles テーブルのRLSポリシー（管理者が更新できるように）
-- ============================================

-- 既存のポリシーを確認し、管理者用の更新ポリシーを追加
DROP POLICY IF EXISTS "管理者はプロフィールを更新可能" ON profiles;

-- 管理者はプロフィールを更新可能
CREATE POLICY "管理者はプロフィールを更新可能" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- ============================================
-- 3. 確認: 現在ログインしているユーザーが管理者か確認
-- ============================================
SELECT 
  id,
  email,
  name,
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ 管理者です'
    ELSE '❌ 管理者ではありません'
  END as admin_status
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 4. 確認: 認証申請がRLSポリシーで見えるかテスト
-- ============================================
-- このクエリは、現在ログインしているユーザーのRLSポリシーが適用されます
SELECT 
  id,
  organization_name,
  status,
  profile_id,
  created_at
FROM organization_verification_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- ============================================
-- 5. デバッグ: 管理者アカウント一覧
-- ============================================
SELECT 
  id,
  email,
  name,
  is_admin
FROM profiles
WHERE is_admin = true;

