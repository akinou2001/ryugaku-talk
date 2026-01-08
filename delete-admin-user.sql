-- admin@gmail.com ユーザーを削除するためのSQL
-- SupabaseダッシュボードのSQL Editorで実行してください

-- エラーメッセージから、ユーザーIDは 6e52f9fe-b26d-4902-9af8-f070e43520e2 です

-- ステップ1: 該当ユーザーのIDを確認
SELECT id, email, name 
FROM profiles 
WHERE email = 'admin@gmail.com';

-- ステップ2: organization_verification_requestsテーブルで該当ユーザーを参照しているレコードを確認
SELECT id, reviewed_by, status, created_at, organization_name
FROM organization_verification_requests
WHERE reviewed_by = '6e52f9fe-b26d-4902-9af8-f070e43520e2';

-- ステップ3: organization_verification_requestsテーブルのreviewed_byをNULLに更新
-- （削除前に外部キー制約を解除）
-- 注意: この更新により、レビュー担当者の情報は失われますが、申請自体は残ります
UPDATE organization_verification_requests
SET reviewed_by = NULL
WHERE reviewed_by = '6e52f9fe-b26d-4902-9af8-f070e43520e2';

-- ステップ4: profilesテーブルから削除
DELETE FROM profiles
WHERE email = 'admin@gmail.com';

-- ステップ5: auth.usersテーブルからも削除（認証ユーザーも削除）
-- 注意: auth.usersテーブルから削除するには、適切な権限が必要です
-- SupabaseダッシュボードのAuthentication > Usersから手動で削除することをお勧めします
DELETE FROM auth.users
WHERE email = 'admin@gmail.com';

-- 確認用クエリ（削除後に実行）
-- SELECT id, email, name FROM profiles WHERE email = 'admin@gmail.com';
-- 結果が0件なら削除成功

