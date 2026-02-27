-- コミュニティチャンネル（ルーム）のRLSポリシーを更新
-- 運営者・参加者はチャンネルを作成可能にする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "コミュニティ所有者はルームを作成可能" ON community_rooms;

-- コミュニティメンバー（承認済み）はチャンネルを作成可能
CREATE POLICY "コミュニティメンバーはチャンネルを作成可能" ON community_rooms 
  FOR INSERT WITH CHECK (
    -- コミュニティの所有者
    EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_rooms.community_id 
      AND communities.owner_id = auth.uid()
    )
    -- または承認済みメンバー
    OR EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_rooms.community_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'approved'
    )
  );

-- コミュニティ所有者のみチャンネルを削除可能（既存のポリシーを維持）
-- 既存のDELETEポリシーはそのまま使用

