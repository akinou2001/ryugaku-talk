-- eventsテーブルにattachmentsカラムを追加（JSONB形式で複数ファイルを保存）
-- 形式: [{"url": "...", "filename": "...", "type": "pdf|image|..."}, ...]
ALTER TABLE events
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- postsテーブルにimage_urlカラムを追加（写真1枚用）
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

