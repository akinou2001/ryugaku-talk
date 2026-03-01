-- ============================================================
-- 011: posts テーブル不足カラム追加
-- images, is_pro, post_type, attachments が手動追加されていた
-- ============================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS images JSONB DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'normal';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
