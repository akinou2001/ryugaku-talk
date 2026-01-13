-- クエストシステムの構造変更: postsテーブルにquest_idカラムを追加
-- これにより、投稿がクエストの「子投稿」として紐づけられる

-- postsテーブルにquest_idカラムを追加
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS quest_id UUID REFERENCES quests(id) ON DELETE SET NULL;

-- インデックスを作成（クエストに紐づく投稿の検索を高速化）
CREATE INDEX IF NOT EXISTS idx_posts_quest_id ON posts(quest_id);

-- 投稿にクエスト承認フラグを追加（管理者によるOKスタンプ用）
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS quest_approved BOOLEAN DEFAULT FALSE;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_posts_quest_approved ON posts(quest_approved);

