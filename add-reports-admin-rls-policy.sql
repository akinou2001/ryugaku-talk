-- 通報テーブルの管理者用RLSポリシーを追加
-- 管理者は通報を更新・削除可能にする

-- 既存のポリシーを確認（必要に応じて削除）
DROP POLICY IF EXISTS "管理者は通報を更新可能" ON reports;
DROP POLICY IF EXISTS "管理者は通報を削除可能" ON reports;

-- 管理者は通報を更新可能
CREATE POLICY "管理者は通報を更新可能" ON reports 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 管理者は通報を削除可能（必要に応じて）
CREATE POLICY "管理者は通報を削除可能" ON reports 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );




