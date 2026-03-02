-- ============================================================
-- 016: コミュニティ権限レイヤー（5層モデル: owner/admin/moderator/member/非メンバー）
-- - is_community_role() SECURITY DEFINER関数で再帰回避
-- - events SELECT → 誰でも閲覧可能
-- - events INSERT/UPDATE/DELETE → owner/admin/moderator
-- - event_participants INSERT → 認証ユーザーなら誰でも（メンバーチェック除去）
-- - community_rooms INSERT/UPDATE/DELETE → owner/admin/moderator
-- - community_members UPDATE → owner/admin/moderator
-- ============================================================

-- 1. is_community_role() SECURITY DEFINER関数を作成（再帰回避）
DROP FUNCTION IF EXISTS is_community_role(UUID, UUID, TEXT[]);
CREATE OR REPLACE FUNCTION is_community_role(p_community_id UUID, p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- オーナーチェック（community_membersを参照しない）
  IF 'owner' = ANY(p_roles) THEN
    IF EXISTS (SELECT 1 FROM communities WHERE id = p_community_id AND owner_id = p_user_id) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- admin/moderator/memberチェック（community_membersを参照）
  RETURN EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND status = 'approved'
      AND role = ANY(p_roles)
  );
END;
$$;

-- 2. events SELECT → 誰でも閲覧可能に変更
DROP POLICY IF EXISTS "コミュニティメンバーはイベントを閲覧可能" ON events;
CREATE POLICY "イベントは誰でも閲覧可能" ON events FOR SELECT USING (true);

-- 3. events INSERT → owner/admin/moderatorに拡張
DROP POLICY IF EXISTS "コミュニティ所有者はイベントを作成可能" ON events;
CREATE POLICY "コミュニティ管理者はイベントを作成可能" ON events FOR INSERT WITH CHECK (
  is_community_role(community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);

-- 4. events UPDATE → owner/admin/moderatorに拡張
DROP POLICY IF EXISTS "コミュニティ所有者はイベントを更新・削除可能" ON events;
CREATE POLICY "コミュニティ管理者はイベントを更新可能" ON events FOR UPDATE USING (
  is_community_role(community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);

-- 5. events DELETE → owner/admin/moderatorに拡張
DROP POLICY IF EXISTS "コミュニティ所有者はイベントを削除可能" ON events;
CREATE POLICY "コミュニティ管理者はイベントを削除可能" ON events FOR DELETE USING (
  is_community_role(community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);

-- 6. event_participants INSERT → 認証ユーザーなら誰でも参加登録可能（メンバーチェック除去）
DROP POLICY IF EXISTS "コミュニティメンバーは参加登録可能" ON event_participants;
CREATE POLICY "認証ユーザーは参加登録可能" ON event_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 7. community_rooms INSERT → owner/admin/moderatorに拡張
DROP POLICY IF EXISTS "コミュニティ所有者はルームを作成可能" ON community_rooms;
CREATE POLICY "コミュニティ管理者はルームを作成可能" ON community_rooms FOR INSERT WITH CHECK (
  is_community_role(community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);

-- 8. community_rooms UPDATE → owner/admin/moderatorに拡張
DROP POLICY IF EXISTS "コミュニティ所有者はルームを更新・削除可能" ON community_rooms;
CREATE POLICY "コミュニティ管理者はルームを更新可能" ON community_rooms FOR UPDATE USING (
  is_community_role(community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);

-- 9. community_rooms DELETE → owner/admin/moderatorに拡張
DROP POLICY IF EXISTS "コミュニティ所有者はルームを削除可能" ON community_rooms;
CREATE POLICY "コミュニティ管理者はルームを削除可能" ON community_rooms FOR DELETE USING (
  is_community_role(community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);

-- 10. community_members UPDATE → owner/admin/moderatorが承認・拒否可能に拡張
DROP POLICY IF EXISTS "コミュニティ所有者はメンバーを承認・拒否可能" ON community_members;
CREATE POLICY "コミュニティ管理者はメンバーを承認・拒否可能" ON community_members FOR UPDATE USING (
  is_community_role(community_members.community_id, auth.uid(), ARRAY['owner', 'admin', 'moderator'])
);
