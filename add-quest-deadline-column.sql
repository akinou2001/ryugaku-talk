-- クエストに期限（deadline）カラムを追加

ALTER TABLE quests
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- インデックスを作成（期限でフィルタリングする場合に使用）
CREATE INDEX IF NOT EXISTS idx_quests_deadline ON quests(deadline)
WHERE deadline IS NOT NULL;

