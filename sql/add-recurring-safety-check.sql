-- 定期安否確認機能のためのカラム追加
ALTER TABLE safety_checks
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_time TIME,
ADD COLUMN IF NOT EXISTS next_send_at TIMESTAMP WITH TIME ZONE;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_safety_checks_is_recurring ON safety_checks(is_recurring);
CREATE INDEX IF NOT EXISTS idx_safety_checks_next_send_at ON safety_checks(next_send_at);

