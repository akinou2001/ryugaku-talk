-- いいね数の自動更新トリガーを修正
-- このファイルをSupabaseのSQL Editorで実行してください

-- 既存のトリガー関数を削除（存在する場合）
DROP TRIGGER IF EXISTS trigger_update_likes_count ON likes;
DROP FUNCTION IF EXISTS update_likes_count();

-- トリガー関数：いいね数を更新
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガー：いいね数の自動更新
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 既存のいいね数が正しくない場合、再計算する関数
CREATE OR REPLACE FUNCTION recalculate_likes_count()
RETURNS void AS $$
BEGIN
  -- 投稿のいいね数を再計算
  UPDATE posts
  SET likes_count = (
    SELECT COUNT(*)
    FROM likes
    WHERE likes.post_id = posts.id
  );
  
  -- コメントのいいね数を再計算
  UPDATE comments
  SET likes_count = (
    SELECT COUNT(*)
    FROM likes
    WHERE likes.comment_id = comments.id
  );
END;
$$ LANGUAGE plpgsql;

-- いいね数を再計算（オプション：必要に応じて実行）
-- 注意: この関数を実行すると、すべての投稿とコメントのいいね数が再計算されます
-- SELECT recalculate_likes_count();

