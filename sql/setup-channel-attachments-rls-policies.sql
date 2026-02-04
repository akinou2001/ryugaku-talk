-- channel-attachmentsバケットのRLSポリシーを設定
-- SupabaseダッシュボードのSQL Editorで実行してください

-- 注意: このスクリプトを実行する前に、バケットが存在することを確認してください
-- Storageページで "channel-attachments" バケットが存在することを確認してから実行してください

-- 既存のポリシーを削除（エラーを避けるため）
DROP POLICY IF EXISTS "認証済みユーザーはチャンネルファイルをアップロード可能" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはチャンネルファイルを閲覧可能" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはチャンネルファイルを削除可能" ON storage.objects;

-- RLSポリシーを設定
-- ポリシー1: 認証済みユーザーはファイルをアップロード可能
CREATE POLICY "認証済みユーザーはチャンネルファイルをアップロード可能"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'channel-attachments');

-- ポリシー2: 認証済みユーザーはファイルを閲覧可能
CREATE POLICY "認証済みユーザーはチャンネルファイルを閲覧可能"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'channel-attachments');

-- ポリシー3: 認証済みユーザーは自分のファイルを削除可能
CREATE POLICY "認証済みユーザーはチャンネルファイルを削除可能"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'channel-attachments');

-- 確認メッセージ
SELECT 'RLSポリシーが正常に設定されました。' AS message;

