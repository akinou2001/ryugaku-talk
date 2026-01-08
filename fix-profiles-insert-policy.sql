-- プロフィール自動作成のためのトリガー関数とトリガー
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください

-- 既存のトリガーが存在する場合は削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- プロフィール自動作成関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    contribution_score,
    languages
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1),
      'ユーザー'
    ),
    0,
    ARRAY[]::text[]
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー：auth.usersにユーザーが作成されたときにプロフィールを自動作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLSポリシーの修正（オプション）：トリガー経由の挿入を許可
-- ただし、上記のトリガーを使用すれば、この変更は不要です
-- 既存のポリシーを確認してください

