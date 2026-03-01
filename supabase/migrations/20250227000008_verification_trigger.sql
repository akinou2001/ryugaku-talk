-- ============================================================
-- 009: 組織認証承認トリガー（承認/拒否時にprofilesを自動更新）
-- 元: sql/06-triggers/supabase-trigger-verification.sql
-- ============================================================

CREATE OR REPLACE FUNCTION update_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE profiles
    SET
      verification_status = 'verified',
      updated_at = NOW()
    WHERE id = NEW.profile_id;
  END IF;

  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE profiles
    SET
      verification_status = 'rejected',
      updated_at = NOW()
    WHERE id = NEW.profile_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_verification_status ON organization_verification_requests;
CREATE TRIGGER trigger_update_profile_verification_status
  AFTER UPDATE OF status ON organization_verification_requests
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION update_profile_verification_status();
