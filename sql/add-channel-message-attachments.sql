-- チャンネルメッセージにファイル添付機能を追加
ALTER TABLE community_room_messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- インデックス（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_community_room_messages_attachments 
ON community_room_messages USING GIN (attachments);

