-- チャンネルメッセージ用のStorageバケットを作成
-- SupabaseダッシュボードのSQL Editorで実行してください

-- バケットを作成（既に存在する場合は何もしない）
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-attachments', 'channel-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシーを設定
-- 認証済みユーザーはファイルをアップロード可能
CREATE POLICY IF NOT EXISTS "認証済みユーザーはチャンネルファイルをアップロード可能"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'channel-attachments');

-- 認証済みユーザーはファイルを閲覧可能
CREATE POLICY IF NOT EXISTS "認証済みユーザーはチャンネルファイルを閲覧可能"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'channel-attachments');

-- 認証済みユーザーは自分のファイルを削除可能
CREATE POLICY IF NOT EXISTS "認証済みユーザーはチャンネルファイルを削除可能"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'channel-attachments');

-- 注意: このSQLを実行するには、SupabaseダッシュボードのSQL Editorを使用してください
-- Storage APIから直接バケットを作成することはできません

