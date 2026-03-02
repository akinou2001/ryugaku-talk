-- AI利用回数制限のためのRPC関数
-- ai_concierge_chats テーブルの当月レコード数で利用回数を管理する
-- 別テーブルは作成せず、既存テーブルを活用

-- 当月の利用回数を取得する関数
CREATE OR REPLACE FUNCTION get_ai_monthly_usage(p_user_id UUID)
RETURNS TABLE(usage_count INTEGER, remaining INTEGER, allowed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  monthly_limit INTEGER := 10;
BEGIN
  SELECT COUNT(*)::INTEGER INTO current_count
  FROM ai_concierge_chats
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  RETURN QUERY SELECT
    current_count,
    GREATEST(monthly_limit - current_count, 0)::INTEGER,
    (current_count < monthly_limit);
END;
$$;

-- 権限付与
GRANT EXECUTE ON FUNCTION get_ai_monthly_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_monthly_usage(UUID) TO anon;
