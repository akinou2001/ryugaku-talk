-- communitiesテーブルにcover_image_urlカラムを追加（存在しない場合）
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- communitiesテーブルにicon_urlカラムを追加（存在しない場合）
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- communitiesテーブルにcommunity_typeカラムを追加（存在しない場合）
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'official' CHECK (community_type IN ('guild', 'official'));

-- コメントを追加（オプション）
COMMENT ON COLUMN communities.cover_image_url IS 'コミュニティのカバー画像URL';
COMMENT ON COLUMN communities.icon_url IS 'コミュニティのアイコン画像URL';
COMMENT ON COLUMN communities.community_type IS 'コミュニティタイプ（guild: ギルド、official: 公式コミュニティ）';

