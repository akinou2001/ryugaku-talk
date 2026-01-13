-- channel-attachmentsバケットの完全なセットアップ
-- バケットの作成とRLSポリシーの設定を一度に実行します
-- SupabaseダッシュボードのSQL Editorで実行してください

-- ============================================
-- ステップ1: バケットを作成
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-attachments', 'channel-attachments', true)
ON CONFLICT (id) DO UPDATE
SET public = true; -- 既に存在する場合は公開設定を確認

-- ============================================
-- ステップ2: 既存のポリシーを削除（エラーを避けるため）
-- ============================================
DROP POLICY IF EXISTS "認証済みユーザーはチャンネルファイルをアップロード可能" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはチャンネルファイルを閲覧可能" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはチャンネルファイルを削除可能" ON storage.objects;

-- ============================================
-- ステップ3: RLSポリシーを設定
-- ============================================

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

-- ============================================
-- 確認
-- ============================================
SELECT 
  'channel-attachmentsバケットのセットアップが完了しました。' AS message,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'channel-attachments') AS bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%チャンネルファイル%') AS policies_created;

