-- 管理者が認証申請を閲覧・更新できるようにするRLSポリシー
-- SupabaseダッシュボードのSQL Editorで実行してください

-- ============================================
-- organization_verification_requests テーブル
-- ============================================

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "申請者は自分の申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "申請者は自分の申請を作成可能" ON organization_verification_requests;

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
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
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
-- profiles テーブル（管理者が更新できるように）
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
-- 確認用クエリ
-- ============================================

-- 管理者アカウントを確認
SELECT id, email, name, is_admin
FROM profiles
WHERE is_admin = true;

-- 認証申請を確認
SELECT 
  ovr.id,
  ovr.organization_name,
  ovr.status,
  ovr.created_at,
  p.name as profile_name,
  p.email as profile_email
FROM organization_verification_requests ovr
LEFT JOIN profiles p ON p.id = ovr.profile_id
ORDER BY ovr.created_at DESC;

