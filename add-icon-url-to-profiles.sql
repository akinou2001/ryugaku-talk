-- profilesテーブルにicon_urlカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- コメントを追加（オプション）
COMMENT ON COLUMN profiles.icon_url IS 'ユーザーのアイコン画像URL';

