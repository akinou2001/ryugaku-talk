-- AIコンシェルジュチャット履歴テーブルの存在確認とデバッグ用クエリ

-- テーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'ai_concierge_chats'
) AS table_exists;

-- テーブル構造の確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ai_concierge_chats'
ORDER BY ordinal_position;

-- RLSポリシーの確認
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'ai_concierge_chats';

-- インデックスの確認
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'ai_concierge_chats';

-- データ件数の確認（認証が必要なため、RLSポリシーが適用されます）
SELECT COUNT(*) AS total_chats FROM ai_concierge_chats;
