-- 管理者がコミュニティを削除できるようにRLSポリシーを追加

-- 既存の削除ポリシーを削除
DROP POLICY IF EXISTS "コミュニティ所有者は削除可能" ON communities;

-- 新しい削除ポリシーを作成（所有者または管理者が削除可能）
CREATE POLICY "コミュニティ所有者または管理者は削除可能" ON communities 
  FOR DELETE USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

