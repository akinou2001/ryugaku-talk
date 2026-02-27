-- クエスト作成をコミュニティ管理者（所有者）のみに制限

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "quests_insert" ON quests;

-- コミュニティの所有者のみクエストを作成可能
CREATE POLICY "quests_insert" ON quests 
  FOR INSERT WITH CHECK (
    -- コミュニティクエストの場合、コミュニティの所有者のみ作成可能
    (
      community_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM communities 
        WHERE id = quests.community_id 
        AND owner_id = auth.uid()
      )
    )
    OR
    -- 全員向けクエスト（community_id IS NULL）は管理者のみ作成可能
    (
      community_id IS NULL
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
      )
    )
  );

