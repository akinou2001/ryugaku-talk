-- コミュニティテーブルのRLSポリシーを修正
-- 個人アカウントはギルド（community_type = 'guild'）を作成可能
-- 組織アカウント（認証済み）は公式コミュニティ（community_type = 'official'）を作成可能

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "組織アカウントのみコミュニティを作成可能" ON communities;

-- 新しいINSERTポリシーを作成
-- 個人アカウントはギルドを作成可能、組織アカウント（認証済み）は公式コミュニティを作成可能
CREATE POLICY "コミュニティ作成ポリシー" ON communities 
  FOR INSERT WITH CHECK (
    -- 個人アカウントはギルドのみ作成可能
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.account_type = 'individual'
      )
      AND community_type = 'guild'
    )
    OR
    -- 組織アカウント（認証済み）は公式コミュニティのみ作成可能
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.account_type != 'individual'
        AND profiles.verification_status = 'verified'
      )
      AND community_type = 'official'
    )
  );

