-- コミュニティカバー画像用バケットの作成と設定

-- 1. コミュニティカバー画像用バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-covers', 'community-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. ストレージポリシーの設定

-- コミュニティカバー画像: 認証ユーザーはアップロード可能、誰でも閲覧可能
DROP POLICY IF EXISTS "認証ユーザーはコミュニティカバー画像をアップロード可能" ON storage.objects;
CREATE POLICY "認証ユーザーはコミュニティカバー画像をアップロード可能"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-covers' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "誰でもコミュニティカバー画像を閲覧可能" ON storage.objects;
CREATE POLICY "誰でもコミュニティカバー画像を閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-covers');

-- コミュニティカバー画像: 認証ユーザーは更新・削除可能
DROP POLICY IF EXISTS "認証ユーザーはコミュニティカバー画像を更新可能" ON storage.objects;
CREATE POLICY "認証ユーザーはコミュニティカバー画像を更新可能"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-covers' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "認証ユーザーはコミュニティカバー画像を削除可能" ON storage.objects;
CREATE POLICY "認証ユーザーはコミュニティカバー画像を削除可能"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-covers' AND
  auth.role() = 'authenticated'
);

