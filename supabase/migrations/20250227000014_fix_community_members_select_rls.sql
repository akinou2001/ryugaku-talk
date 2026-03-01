-- ============================================================
-- 014: community_members の SELECT ポリシーを修正
--
-- 問題: マイグレーション004で再帰回避のためにSELECTポリシーを
-- 「自分自身 OR コミュニティ所有者」に制限したが、
-- 一般メンバーが他のメンバーを閲覧できなくなった。
-- 修正: SECURITY DEFINER 関数で再帰を回避しつつ、
-- 承認済みメンバーも他のメンバーを閲覧可能にする。
-- ============================================================

-- 承認済みメンバーかどうかを判定する関数（再帰回避のため SECURITY DEFINER）
CREATE OR REPLACE FUNCTION is_community_member(p_community_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND status = 'approved'
  );
END;
$$;

-- 既存のSELECTポリシーを削除して再作成
DROP POLICY IF EXISTS "コミュニティメンバー情報は自分とコミュニティ所有者が閲覧可能" ON community_members;
DROP POLICY IF EXISTS "コミュニティメンバー情報はメンバーとコミュニティ所有者が閲覧可能" ON community_members;

CREATE POLICY "コミュニティメンバー情報はメンバーとコミュニティ所有者が閲覧可能" ON community_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM communities WHERE communities.id = community_members.community_id AND communities.owner_id = auth.uid())
  OR is_community_member(community_id, auth.uid())
);
