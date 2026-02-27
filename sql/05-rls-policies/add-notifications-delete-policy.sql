-- 通知削除のRLSポリシーを追加
-- ユーザーは自分の通知を削除可能

DROP POLICY IF EXISTS "ユーザーは自分の通知を削除可能" ON notifications;

CREATE POLICY "ユーザーは自分の通知を削除可能" ON notifications 
  FOR DELETE USING (auth.uid() = user_id);

