-- ============================================================
-- 016: コミュニティメンバー数を誰でも取得できるRPC関数
--
-- 問題: community_members の RLS SELECTポリシーにより、
-- 非メンバーはCOUNTも0になる。
-- 修正: SECURITY DEFINER関数でRLSをバイパスし、
-- 承認済みメンバー数+オーナーを返す（個人情報は漏らさない）。
-- ============================================================

CREATE OR REPLACE FUNCTION get_community_member_count(p_community_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
  owner_in_members BOOLEAN;
BEGIN
  SELECT COUNT(*)::INTEGER INTO member_count
  FROM community_members
  WHERE community_id = p_community_id
    AND status = 'approved';

  SELECT EXISTS (
    SELECT 1 FROM community_members cm
    JOIN communities c ON c.id = cm.community_id
    WHERE cm.community_id = p_community_id
      AND cm.user_id = c.owner_id
      AND cm.status = 'approved'
  ) INTO owner_in_members;

  IF NOT owner_in_members THEN
    member_count := member_count + 1;
  END IF;

  RETURN GREATEST(member_count, 1);
END;
$$;
