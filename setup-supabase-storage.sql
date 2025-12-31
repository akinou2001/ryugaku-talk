-- Supabase Storageバケットの作成と設定

-- 1. イベント添付ファイル用バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-attachments', 'event-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 投稿画像用バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. ストレージポリシーの設定

-- イベント添付ファイル: 認証ユーザーはアップロード可能、誰でも閲覧可能
CREATE POLICY "認証ユーザーはイベント添付ファイルをアップロード可能"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "誰でもイベント添付ファイルを閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-attachments');

-- 投稿画像: 認証ユーザーはアップロード可能、誰でも閲覧可能
CREATE POLICY "認証ユーザーは投稿画像をアップロード可能"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "誰でも投稿画像を閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- 4. ファイルサイズ制限（オプション）
-- 注意: Supabaseのデフォルト制限は50MBです
-- アプリケーション層で10MB（イベント添付）と5MB（投稿画像）の制限を実装しています

