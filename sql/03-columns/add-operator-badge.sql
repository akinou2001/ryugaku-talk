-- 運営バッジ機能の追加
-- このファイルをSupabaseのSQL Editorで実行してください

-- profilesテーブルに運営フラグを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_operator BOOLEAN DEFAULT FALSE;

-- 運営フラグのインデックスを作成（オプション）
CREATE INDEX IF NOT EXISTS idx_profiles_is_operator ON profiles(is_operator) WHERE is_operator = TRUE;

-- 既存の運営アカウントを設定する場合（必要に応じて実行）
-- UPDATE profiles SET is_operator = TRUE WHERE email = 'your-email@example.com';

