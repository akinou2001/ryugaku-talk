-- profiles, communitiesにタイムゾーン列を追加
-- IANAタイムゾーン名（例: "Asia/Tokyo"）を格納
-- NULL許容: 未設定のユーザー/コミュニティにはタイムゾーンを表示しない

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS timezone TEXT;
