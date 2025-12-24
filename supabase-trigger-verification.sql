-- 組織認証申請のstatusがapprovedになったら、profilesテーブルを自動更新するトリガー
-- Supabase DashboardのSQL Editorで実行してください

-- 関数: 認証申請が承認されたときにプロフィールを更新
CREATE OR REPLACE FUNCTION update_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- statusがapprovedに変更された場合
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- profilesテーブルのverification_statusをverifiedに更新
    UPDATE profiles
    SET 
      verification_status = 'verified',
      updated_at = NOW()
    WHERE id = NEW.profile_id;
  END IF;
  
  -- statusがrejectedに変更された場合
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    -- profilesテーブルのverification_statusをrejectedに更新
    UPDATE profiles
    SET 
      verification_status = 'rejected',
      updated_at = NOW()
    WHERE id = NEW.profile_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー: organization_verification_requestsテーブルの更新時に実行
DROP TRIGGER IF EXISTS trigger_update_profile_verification_status ON organization_verification_requests;
CREATE TRIGGER trigger_update_profile_verification_status
  AFTER UPDATE OF status ON organization_verification_requests
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION update_profile_verification_status();


