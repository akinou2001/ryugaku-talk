-- postsテーブルにcover_image_urlカラムを追加
-- 日記投稿などのカバー画像用

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- インデックスは不要（カバー画像は検索条件として使用されないため）