-- コミュニティのアーカイブ機能を追加
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- アーカイブされたコミュニティは検索結果から除外するためのインデックス
CREATE INDEX IF NOT EXISTS idx_communities_is_archived ON communities(is_archived) WHERE is_archived = FALSE;

