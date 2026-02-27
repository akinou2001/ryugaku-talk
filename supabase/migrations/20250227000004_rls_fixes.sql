-- ============================================================
-- 005: RLS 修正（無限再帰回避・管理者ポリシーは is_admin_user 使用）
-- 元: sql/05-rls-policies/fix-profiles-rls-recursion.sql, fix-community-members-rls-recursion.sql
-- ============================================================

DROP FUNCTION IF EXISTS is_admin_user(UUID);
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_admin = TRUE);
END;
$$;

DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles;
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は認証ステータスを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者はプロフィールを更新可能" ON profiles;

CREATE POLICY "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin_user(auth.uid()));
CREATE POLICY "管理者は全ユーザーのプロフィールを更新可能" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin_user(auth.uid()));
CREATE POLICY "管理者は認証ステータスを更新可能" ON profiles FOR UPDATE USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "管理者はプロフィールを更新可能" ON profiles FOR UPDATE USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;
CREATE POLICY "管理者は認証申請を閲覧可能" ON organization_verification_requests FOR SELECT USING (auth.uid() = profile_id OR is_admin_user(auth.uid()));
CREATE POLICY "管理者は認証申請を更新可能" ON organization_verification_requests FOR UPDATE USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "管理者は投稿を削除可能" ON posts;
CREATE POLICY "管理者は投稿を削除可能" ON posts FOR DELETE USING (auth.uid() = author_id OR is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "管理者はコメントを削除可能" ON comments;
CREATE POLICY "管理者はコメントを削除可能" ON comments FOR DELETE USING (auth.uid() = author_id OR is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "管理者は通報を閲覧可能" ON reports;
DROP POLICY IF EXISTS "管理者は通報を更新可能" ON reports;
CREATE POLICY "管理者は通報を閲覧可能" ON reports FOR SELECT USING (auth.uid() = reporter_id OR is_admin_user(auth.uid()));
CREATE POLICY "管理者は通報を更新可能" ON reports FOR UPDATE USING (is_admin_user(auth.uid()));

-- community_members: 再帰回避（メンバー一覧で community_members を参照しない形に）
DROP POLICY IF EXISTS "コミュニティメンバー情報はメンバーとコミュニティ所有者が閲覧可能" ON community_members;
CREATE POLICY "コミュニティメンバー情報は自分とコミュニティ所有者が閲覧可能" ON community_members FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM communities WHERE communities.id = community_members.community_id AND communities.owner_id = auth.uid())
);
