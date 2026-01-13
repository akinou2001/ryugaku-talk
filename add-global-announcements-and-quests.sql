-- 全員向けお知らせテーブル
CREATE TABLE IF NOT EXISTS global_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown形式
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クエストテーブルのcommunity_idをnullableに変更（全員向けクエスト対応）
ALTER TABLE quests
  ALTER COLUMN community_id DROP NOT NULL;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_global_announcements_created_at ON global_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quests_community_id_null ON quests(community_id) WHERE community_id IS NULL;

-- RLS (Row Level Security) ポリシー
ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;

-- 全員向けお知らせのRLSポリシー
DROP POLICY IF EXISTS "全員が全員向けお知らせを閲覧可能" ON global_announcements;
CREATE POLICY "全員が全員向けお知らせを閲覧可能" ON global_announcements 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "管理者は全員向けお知らせを作成可能" ON global_announcements;
CREATE POLICY "管理者は全員向けお知らせを作成可能" ON global_announcements 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "管理者は全員向けお知らせを更新・削除可能" ON global_announcements;
CREATE POLICY "管理者は全員向けお知らせを更新・削除可能" ON global_announcements 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "管理者は全員向けお知らせを削除可能" ON global_announcements;
CREATE POLICY "管理者は全員向けお知らせを削除可能" ON global_announcements 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- 全員向けクエストのRLSポリシー（community_idがNULLの場合）
-- 既存のクエストRLSポリシーを確認し、必要に応じて更新
-- 全員向けクエスト（community_id IS NULL）は誰でも閲覧可能
DROP POLICY IF EXISTS "全員が全員向けクエストを閲覧可能" ON quests;
CREATE POLICY "全員が全員向けクエストを閲覧可能" ON quests 
  FOR SELECT USING (community_id IS NULL);

-- 通知タイプにglobal_announcementとglobal_questを追加
-- notificationsテーブルのtypeカラムのCHECK制約を更新
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'announcement', 
    'community_event', 
    'community_quest', 
    'urgent_question', 
    'safety_check', 
    'dm', 
    'comment', 
    'like', 
    'organization_verification',
    'global_announcement',
    'global_quest'
  ));

-- updated_atトリガー
DROP TRIGGER IF EXISTS trigger_update_global_announcements_updated_at ON global_announcements;
CREATE TRIGGER trigger_update_global_announcements_updated_at
  BEFORE UPDATE ON global_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

