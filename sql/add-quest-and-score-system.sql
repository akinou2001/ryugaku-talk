-- クエスト機能とスコアシステムのマイグレーション

-- 1. communitiesテーブルにcommunity_typeカラムを追加
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'official' CHECK (community_type IN ('guild', 'official'));

-- 2. クエストテーブルを作成
CREATE TABLE IF NOT EXISTS quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_profile JSONB, -- 作成者のプロフィール情報（スナップショット）
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  reward_type TEXT DEFAULT 'candle' CHECK (reward_type IN ('candle', 'torch')),
  reward_amount INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. クエスト完了テーブルを作成
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- クリア判定を行ったユーザー（通常はクエスト作成者）
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_text TEXT, -- 完了証明（テキスト）
  proof_url TEXT, -- 完了証明（URL）
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

-- 4. スコアテーブルを作成（火、キャンドル、トーチを管理）
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  flame_count INTEGER DEFAULT 0, -- 通常のいいねや質問への回答で獲得
  candle_count INTEGER DEFAULT 0, -- サークルのクエストクリアで獲得
  torch_count INTEGER DEFAULT 0, -- 公式コミュニティのクエストクリアで獲得
  candles_received_count INTEGER DEFAULT 0, -- 週1回のキャンドル送信で受け取った数
  last_candle_sent_at TIMESTAMP WITH TIME ZONE, -- 最後にキャンドルを送った日時
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. キャンドル送信履歴テーブル（週1回制限の管理用）
CREATE TABLE IF NOT EXISTS candle_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- チャットメッセージと紐付け
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_start DATE NOT NULL, -- 週の開始日（月曜日）を記録
  UNIQUE(sender_id, week_start) -- 1週間に1回のみ送信可能
);

-- 6. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_quests_community_id ON quests(community_id);
CREATE INDEX IF NOT EXISTS idx_quests_created_by ON quests(created_by);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest_id ON quest_completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_id ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_status ON quest_completions(status);
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_candle_sends_sender_id ON candle_sends(sender_id);
CREATE INDEX IF NOT EXISTS idx_candle_sends_receiver_id ON candle_sends(receiver_id);
CREATE INDEX IF NOT EXISTS idx_candle_sends_week_start ON candle_sends(week_start);

-- 7. RLS (Row Level Security) を有効化
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE candle_sends ENABLE ROW LEVEL SECURITY;

-- 8. 基本的なRLSポリシー（全ユーザーが読み取り可能、自分のデータは更新可能）
-- 注意: 実際の運用では、より詳細なポリシーを設定してください

-- quests: コミュニティメンバーは読み取り可能、作成者は更新可能
CREATE POLICY "quests_select" ON quests FOR SELECT USING (true);
CREATE POLICY "quests_insert" ON quests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quests_update" ON quests FOR UPDATE USING (auth.uid() = created_by);

-- quest_completions: 自分の完了記録は読み取り・作成可能、クエスト作成者は承認可能
CREATE POLICY "quest_completions_select" ON quest_completions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = completed_by);
CREATE POLICY "quest_completions_insert" ON quest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quest_completions_update" ON quest_completions FOR UPDATE USING (auth.uid() = completed_by);

-- user_scores: 全ユーザーが読み取り可能、自分のスコアは更新不可（システムが更新）
CREATE POLICY "user_scores_select" ON user_scores FOR SELECT USING (true);
CREATE POLICY "user_scores_insert" ON user_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 更新はシステム（サービスロール）のみ可能

-- candle_sends: 自分の送信履歴は読み取り可能、送信は自分のみ
CREATE POLICY "candle_sends_select" ON candle_sends FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "candle_sends_insert" ON candle_sends FOR INSERT WITH CHECK (auth.uid() = sender_id);

