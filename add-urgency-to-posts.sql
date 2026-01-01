-- 質問に緊急度設定を追加
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent'));

-- インデックスを追加（緊急度でフィルタリングするため）
CREATE INDEX IF NOT EXISTS idx_posts_urgency_level ON posts(urgency_level) WHERE category = 'question';

-- コメント
COMMENT ON COLUMN posts.urgency_level IS '質問の緊急度: low=低, normal=通常, high=高, urgent=緊急';

