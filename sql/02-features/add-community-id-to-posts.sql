-- postsテーブルにcommunity_idカラムを追加
-- コミュニティ限定投稿機能のためのマイグレーション

-- 1. community_idカラムを追加（NULL許可、外部キー参照）
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

-- 2. categoryのCHECK制約を更新（'chat'を追加）
-- 既存のCHECK制約を削除
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_category_check;

-- 新しいCHECK制約を追加（'chat'を含む）
ALTER TABLE posts
ADD CONSTRAINT posts_category_check 
CHECK (category IN ('question', 'diary', 'information', 'chat', 'official'));

-- 3. community_id用のインデックスを作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);

-- 4. community_idがNULLでない場合のインデックス（コミュニティ限定投稿の検索用）
CREATE INDEX IF NOT EXISTS idx_posts_community_id_not_null ON posts(community_id) 
WHERE community_id IS NOT NULL;

