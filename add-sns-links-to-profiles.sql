-- profilesテーブルにSNSリンク用カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sns_x TEXT,
ADD COLUMN IF NOT EXISTS sns_tiktok TEXT,
ADD COLUMN IF NOT EXISTS sns_instagram TEXT,
ADD COLUMN IF NOT EXISTS sns_facebook TEXT,
ADD COLUMN IF NOT EXISTS sns_linkedin TEXT,
ADD COLUMN IF NOT EXISTS sns_url TEXT;

-- コメントを追加
COMMENT ON COLUMN profiles.sns_x IS 'X（旧Twitter）のURL';
COMMENT ON COLUMN profiles.sns_tiktok IS 'TikTokのURL';
COMMENT ON COLUMN profiles.sns_instagram IS 'InstagramのURL';
COMMENT ON COLUMN profiles.sns_facebook IS 'FacebookのURL';
COMMENT ON COLUMN profiles.sns_linkedin IS 'LinkedInのURL';
COMMENT ON COLUMN profiles.sns_url IS 'その他のURL';

