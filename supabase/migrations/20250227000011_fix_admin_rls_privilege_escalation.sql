-- ============================================================
-- 012: セキュリティ修正 - 管理者権限の自己昇格を防ぐ RLS ポリシー修正
--
-- 問題: profiles テーブルの UPDATE ポリシーに WITH CHECK がなかったため、
--       一般ユーザーが自分のプロフィールの is_admin = true に書き換え可能だった。
-- 修正: ユーザー用と管理者用のポリシーを分離し、WITH CHECK で制約する。
-- ============================================================

-- 既存の全 profiles UPDATE ポリシーを削除（名前が変わっている可能性も含めて網羅）
DROP POLICY IF EXISTS "管理者は全ユーザーのプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は認証ステータスを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者はプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は全プロフィールを更新可能" ON profiles;

-- ポリシー1: 一般ユーザーは自分のプロフィールのみ更新可能
--   WITH CHECK: 更新後も is_admin = FALSE であることを強制する
--   → is_admin を true に書き換えようとしても WITH CHECK で拒否される
CREATE POLICY "ユーザーは自分のプロフィールを更新可能" ON profiles FOR UPDATE
USING (auth.uid() = id AND NOT is_admin_user(auth.uid()))
WITH CHECK (auth.uid() = id AND is_admin = FALSE);

-- ポリシー2: 管理者は全プロフィールを更新可能
--   WITH CHECK: 実行者が管理者であることを確認
--   （認証ステータス更新も含む）
CREATE POLICY "管理者は全プロフィールを更新可能" ON profiles FOR UPDATE
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));
