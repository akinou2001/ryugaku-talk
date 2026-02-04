-- ============================================
-- profilesテーブルにis_activeカラムを追加
-- ============================================
-- エラー: Could not find the 'is_active' column of 'profiles' in the schema cache
-- 解決策: is_activeカラムとis_adminカラムを追加

-- is_adminカラムを追加（管理者フラグ）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- is_activeカラムを追加（アカウント有効化フラグ）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 既存のプロフィールにデフォルト値を設定
UPDATE profiles 
SET is_admin = FALSE 
WHERE is_admin IS NULL;

UPDATE profiles 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- 注意: このSQLを実行後、Supabaseのスキーマキャッシュが更新されるまで
-- 数秒かかる場合があります。エラーが続く場合は、Supabaseダッシュボードで
-- テーブル構造を確認してください。

