-- AIコンシェルジュチャット履歴テーブル
CREATE TABLE IF NOT EXISTS ai_concierge_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('grounded', 'reasoning')),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  related_posts JSONB DEFAULT '[]'::jsonb, -- 関連投稿の情報をJSONB形式で保存
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_user_id ON ai_concierge_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_created_at ON ai_concierge_chats(created_at DESC);
-- 検索用インデックス（ilike検索用）
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_question_text ON ai_concierge_chats(question_text);
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_answer_text ON ai_concierge_chats(answer_text);

-- RLS (Row Level Security) ポリシー
ALTER TABLE ai_concierge_chats ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "ai_concierge_chats_select_policy" ON ai_concierge_chats;
DROP POLICY IF EXISTS "ai_concierge_chats_insert_policy" ON ai_concierge_chats;
DROP POLICY IF EXISTS "ai_concierge_chats_delete_policy" ON ai_concierge_chats;
DROP POLICY IF EXISTS "ユーザーは自分のチャット履歴を閲覧可能" ON ai_concierge_chats;
DROP POLICY IF EXISTS "ユーザーは自分のチャット履歴を作成可能" ON ai_concierge_chats;
DROP POLICY IF EXISTS "ユーザーは自分のチャット履歴を削除可能" ON ai_concierge_chats;

-- ユーザーは自分のチャット履歴のみ閲覧可能
CREATE POLICY "ai_concierge_chats_select_policy" ON ai_concierge_chats
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のチャット履歴を作成可能
CREATE POLICY "ai_concierge_chats_insert_policy" ON ai_concierge_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のチャット履歴を削除可能
CREATE POLICY "ai_concierge_chats_delete_policy" ON ai_concierge_chats
  FOR DELETE USING (auth.uid() = user_id);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_ai_concierge_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー：更新日時の自動更新
CREATE TRIGGER trigger_update_ai_concierge_chats_updated_at
  BEFORE UPDATE ON ai_concierge_chats
  FOR EACH ROW EXECUTE FUNCTION update_ai_concierge_chats_updated_at();
