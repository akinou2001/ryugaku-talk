-- ============================================================
-- 004: Storage バケットとポリシー（04-storage）
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('event-attachments', 'event-attachments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('channel-attachments', 'channel-attachments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('community-covers', 'community-covers', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "認証ユーザーはイベント添付ファイルをアップロード可能" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "誰でもイベント添付ファイルを閲覧可能" ON storage.objects FOR SELECT USING (bucket_id = 'event-attachments');
CREATE POLICY "認証ユーザーは投稿画像をアップロード可能" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');
CREATE POLICY "誰でも投稿画像を閲覧可能" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "認証済みユーザーはチャンネルファイルをアップロード可能" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'channel-attachments');
CREATE POLICY "認証済みユーザーはチャンネルファイルを閲覧可能" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'channel-attachments');
CREATE POLICY "認証済みユーザーはチャンネルファイルを削除可能" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'channel-attachments');

DROP POLICY IF EXISTS "認証ユーザーはコミュニティカバー画像をアップロード可能" ON storage.objects;
CREATE POLICY "認証ユーザーはコミュニティカバー画像をアップロード可能" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community-covers' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "誰でもコミュニティカバー画像を閲覧可能" ON storage.objects;
CREATE POLICY "誰でもコミュニティカバー画像を閲覧可能" ON storage.objects FOR SELECT USING (bucket_id = 'community-covers');
DROP POLICY IF EXISTS "認証ユーザーはコミュニティカバー画像を更新可能" ON storage.objects;
CREATE POLICY "認証ユーザーはコミュニティカバー画像を更新可能" ON storage.objects FOR UPDATE USING (bucket_id = 'community-covers' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "認証ユーザーはコミュニティカバー画像を削除可能" ON storage.objects;
CREATE POLICY "認証ユーザーはコミュニティカバー画像を削除可能" ON storage.objects FOR DELETE USING (bucket_id = 'community-covers' AND auth.role() = 'authenticated');

-- カラム追加（channel attachments, events, posts image）
ALTER TABLE community_room_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_community_room_messages_attachments ON community_room_messages USING GIN (attachments);
ALTER TABLE events ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
