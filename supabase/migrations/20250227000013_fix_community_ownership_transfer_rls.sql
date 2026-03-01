-- ============================================================
-- 013: コミュニティ所有者移管時のRLSポリシー修正
--
-- 問題: UPDATE ポリシーが USING のみで WITH CHECK がないため、
-- owner_id を変更すると新しい行が USING 条件 (owner_id = auth.uid())
-- に違反してエラーになる。
-- 修正: WITH CHECK (true) を追加し、現在の所有者が owner_id を
-- 変更できるようにする。
-- ============================================================

-- 既存の UPDATE ポリシーを削除して再作成
DROP POLICY IF EXISTS "コミュニティ所有者は更新可能" ON communities;

CREATE POLICY "コミュニティ所有者は更新可能" ON communities
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (true);
