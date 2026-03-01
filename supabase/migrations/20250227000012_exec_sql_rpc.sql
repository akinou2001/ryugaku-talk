-- ============================================================
-- 013: テスト用 exec_sql RPC 関数
-- service_role キーでのみ呼び出し可能な SQL 実行関数
-- information_schema / pg_catalog への SELECT のみを想定
-- ============================================================

CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- service_role のみ呼び出し可能にする
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM authenticated;
