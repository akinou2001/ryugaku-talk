-- ============================================
-- profilesテーブルのRLSポリシー無限再帰エラー修正
-- ============================================

-- 問題: profilesテーブルのRLSポリシー内でprofilesテーブル自体を参照しているため無限再帰が発生
-- 解決策: SECURITY DEFINER関数を使用してRLSをバイパスして管理者チェックを行う

-- ============================================
-- 1. 管理者チェック用のSECURITY DEFINER関数を作成
-- ============================================

-- 既存の関数を削除（存在する場合）
DROP FUNCTION IF EXISTS is_admin_user(UUID);

-- 管理者チェック関数（SECURITY DEFINERでRLSをバイパス）
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND is_admin = TRUE
  );
END;
$$;

-- ============================================
-- 2. profilesテーブルのRLSポリシーを修正
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを閲覧可能" ON profiles;
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は認証ステータスを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者はプロフィールを更新可能" ON profiles;

-- 修正後のポリシー（関数を使用して無限再帰を回避）
CREATE POLICY "管理者は全ユーザーのプロフィールを閲覧可能" 
ON profiles FOR SELECT 
USING (
  auth.uid() = id OR 
  is_admin_user(auth.uid())
);

CREATE POLICY "管理者は全ユーザーのプロフィールを更新可能" 
ON profiles FOR UPDATE 
USING (
  auth.uid() = id OR 
  is_admin_user(auth.uid())
);

CREATE POLICY "管理者は認証ステータスを更新可能" 
ON profiles FOR UPDATE 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "管理者はプロフィールを更新可能" 
ON profiles FOR UPDATE 
USING (is_admin_user(auth.uid()));

-- ============================================
-- 3. 他のテーブルのRLSポリシーも修正（profilesを参照しているもの）
-- ============================================

-- organization_verification_requestsテーブル
DROP POLICY IF EXISTS "管理者は認証申請を閲覧可能" ON organization_verification_requests;
DROP POLICY IF EXISTS "管理者は認証申請を更新可能" ON organization_verification_requests;

CREATE POLICY "管理者は認証申請を閲覧可能" 
ON organization_verification_requests FOR SELECT 
USING (
  auth.uid() = profile_id OR 
  is_admin_user(auth.uid())
);

CREATE POLICY "管理者は認証申請を更新可能" 
ON organization_verification_requests FOR UPDATE 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- postsテーブル
DROP POLICY IF EXISTS "管理者は投稿を削除可能" ON posts;

CREATE POLICY "管理者は投稿を削除可能" 
ON posts FOR DELETE 
USING (
  auth.uid() = author_id OR 
  is_admin_user(auth.uid())
);

-- commentsテーブル
DROP POLICY IF EXISTS "管理者はコメントを削除可能" ON comments;

CREATE POLICY "管理者はコメントを削除可能" 
ON comments FOR DELETE 
USING (
  auth.uid() = author_id OR 
  is_admin_user(auth.uid())
);

-- reportsテーブル
DROP POLICY IF EXISTS "管理者は通報を閲覧可能" ON reports;
DROP POLICY IF EXISTS "管理者は通報を更新可能" ON reports;

CREATE POLICY "管理者は通報を閲覧可能" 
ON reports FOR SELECT 
USING (
  auth.uid() = reporter_id OR 
  is_admin_user(auth.uid())
);

CREATE POLICY "管理者は通報を更新可能" 
ON reports FOR UPDATE 
USING (is_admin_user(auth.uid()));

-- ============================================
-- 4. 確認用クエリ
-- ============================================

-- 関数が正しく動作するか確認
SELECT 
  id,
  email,
  name,
  is_admin,
  is_admin_user(id) as function_check
FROM profiles
LIMIT 5;

-- 現在のユーザーが管理者か確認
SELECT 
  auth.uid() as current_user_id,
  is_admin_user(auth.uid()) as is_admin;
