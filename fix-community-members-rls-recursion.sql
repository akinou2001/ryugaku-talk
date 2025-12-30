-- ============================================
-- community_membersテーブルのRLSポリシー無限再帰エラー修正
-- ============================================

-- 問題: SELECTポリシー内でcommunity_membersテーブル自体を参照しているため無限再帰が発生
-- 解決策: ポリシーを簡略化し、再帰を避ける

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "コミュニティメンバー情報はメンバーとコミュニティ所有者が閲覧可能" ON community_members;
DROP POLICY IF EXISTS "認証ユーザーは加入申請可能" ON community_members;
DROP POLICY IF EXISTS "コミュニティ所有者はメンバーを承認・拒否可能" ON community_members;
DROP POLICY IF EXISTS "ユーザーは自分の申請を削除可能" ON community_members;

-- 修正後のポリシー
-- SELECT: 自分のレコード、またはコミュニティ所有者が閲覧可能
-- （メンバー一覧の取得は、アプリケーション層でコミュニティメンバーシップを確認してから行う）
CREATE POLICY "コミュニティメンバー情報は自分とコミュニティ所有者が閲覧可能" ON community_members 
  FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_members.community_id 
      AND communities.owner_id = auth.uid()
    )
  );

-- INSERT: 認証ユーザーは自分の加入申請を作成可能
CREATE POLICY "認証ユーザーは加入申請可能" ON community_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: コミュニティ所有者はメンバーを承認・拒否可能
CREATE POLICY "コミュニティ所有者はメンバーを承認・拒否可能" ON community_members 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_members.community_id 
      AND communities.owner_id = auth.uid()
    )
  );

-- DELETE: ユーザーは自分の申請を削除可能
CREATE POLICY "ユーザーは自分の申請を削除可能" ON community_members 
  FOR DELETE USING (auth.uid() = user_id);

-- 注意: メンバー一覧を取得する際は、アプリケーション層（getCommunityMembers関数）で
-- コミュニティメンバーシップを確認してから取得する必要があります。
-- これにより、メンバーは他のメンバーを閲覧できますが、RLSポリシーでは再帰を避けます。

