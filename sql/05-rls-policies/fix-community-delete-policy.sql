-- コミュニティ削除ポリシーの修正
-- 所有者がコミュニティを削除できるようにする

-- 既存の削除ポリシーを削除
DROP POLICY IF EXISTS "コミュニティ所有者は削除可能" ON communities;
DROP POLICY IF EXISTS "コミュニティ所有者または管理者は削除可能" ON communities;

-- 所有者が削除可能なポリシーを作成
-- このポリシーにより、owner_idが現在のユーザーIDと一致する場合のみ削除可能
CREATE POLICY "コミュニティ所有者は削除可能" ON communities 
  FOR DELETE USING (owner_id = auth.uid());
