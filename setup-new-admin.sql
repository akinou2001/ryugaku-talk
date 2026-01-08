-- 新しい管理者アカウントを設定するためのSQL
-- SupabaseダッシュボードのSQL Editorで実行してください

-- ステップ1: 管理者にしたいユーザーのメールアドレスを指定
-- 例: 'your-email@example.com' を実際のメールアドレスに変更してください
-- UPDATE profiles
-- SET is_admin = true
-- WHERE email = 'your-email@example.com';

-- 実際に実行する場合は、上記のコメントを外してメールアドレスを変更してください
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';  -- ここを実際のメールアドレスに変更

-- 確認用クエリ（設定後、管理者権限が付与されたか確認）
SELECT id, email, name, is_admin, account_type
FROM profiles
WHERE email = @admin_email;

-- 複数の管理者を設定する場合（複数のメールアドレスを指定）
-- UPDATE profiles
-- SET is_admin = true
-- WHERE email IN ('admin1@example.com', 'admin2@example.com', 'admin3@example.com');

-- すべての管理者を確認する場合
-- SELECT id, email, name, is_admin, account_type, created_at
-- FROM profiles
-- WHERE is_admin = true
-- ORDER BY created_at DESC;

