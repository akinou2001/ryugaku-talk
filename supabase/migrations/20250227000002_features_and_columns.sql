-- ============================================================
-- 003: 機能追加・カラム追加（02-features + 03-columns の適用順）
-- ============================================================

-- ----- posts に community_id、category に chat/official 追加 -----
ALTER TABLE posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE posts ADD CONSTRAINT posts_category_check CHECK (category IN ('question', 'diary', 'information', 'chat', 'official'));
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id_not_null ON posts(community_id) WHERE community_id IS NOT NULL;

-- ----- profiles / posts に university_id -----
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_posts_university_id ON posts(university_id);

-- ----- 通知・安否確認 -----
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'community_event', 'community_quest', 'urgent_question', 'safety_check', 'dm', 'comment', 'like', 'organization_verification')),
  title TEXT NOT NULL,
  content TEXT,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ユーザーは自分の通知のみ閲覧可能" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "システムは通知を作成可能" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "ユーザーは自分の通知を更新可能" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS safety_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_area JSONB,
  target_user_ids UUID[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  response_count INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
CREATE TABLE IF NOT EXISTS safety_check_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safety_check_id UUID REFERENCES safety_checks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('safe', 'unsafe', 'unknown')),
  message TEXT,
  location JSONB,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(safety_check_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_safety_checks_created_by ON safety_checks(created_by);
CREATE INDEX IF NOT EXISTS idx_safety_checks_community_id ON safety_checks(community_id);
CREATE INDEX IF NOT EXISTS idx_safety_checks_status ON safety_checks(status);
CREATE INDEX IF NOT EXISTS idx_safety_check_responses_safety_check_id ON safety_check_responses(safety_check_id);
CREATE INDEX IF NOT EXISTS idx_safety_check_responses_user_id ON safety_check_responses(user_id);
ALTER TABLE safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_check_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "組織アカウントは安否確認を作成可能" ON safety_checks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type IN ('educational', 'company', 'government') AND verification_status = 'verified')
);
CREATE POLICY "組織アカウントと対象ユーザーは安否確認を閲覧可能" ON safety_checks FOR SELECT USING (
  created_by = auth.uid() OR auth.uid() = ANY(target_user_ids) OR
  EXISTS (SELECT 1 FROM communities WHERE id = community_id AND EXISTS (SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid()))
);
CREATE POLICY "組織アカウントは安否確認を更新可能" ON safety_checks FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "ユーザーは自分の回答のみ閲覧可能" ON safety_check_responses FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM safety_checks WHERE id = safety_check_responses.safety_check_id AND created_by = auth.uid()));
CREATE POLICY "対象ユーザーは回答を作成可能" ON safety_check_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM safety_checks WHERE id = safety_check_responses.safety_check_id AND (auth.uid() = ANY(target_user_ids) OR auth.uid() IN (SELECT user_id FROM community_members WHERE community_id = safety_checks.community_id)))
);
CREATE POLICY "ユーザーは自分の回答を更新可能" ON safety_check_responses FOR UPDATE USING (auth.uid() = user_id);

-- ----- クエスト・スコア -----
ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'official' CHECK (community_type IN ('guild', 'official'));

CREATE TABLE IF NOT EXISTS quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_profile JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  reward_type TEXT DEFAULT 'candle' CHECK (reward_type IN ('candle', 'torch')),
  reward_amount INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_text TEXT,
  proof_url TEXT,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  flame_count INTEGER DEFAULT 0,
  candle_count INTEGER DEFAULT 0,
  torch_count INTEGER DEFAULT 0,
  candles_received_count INTEGER DEFAULT 0,
  last_candle_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS candle_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_start DATE NOT NULL,
  UNIQUE(sender_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_quests_community_id ON quests(community_id);
CREATE INDEX IF NOT EXISTS idx_quests_created_by ON quests(created_by);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest_id ON quest_completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_id ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_status ON quest_completions(status);
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_candle_sends_sender_id ON candle_sends(sender_id);
CREATE INDEX IF NOT EXISTS idx_candle_sends_receiver_id ON candle_sends(receiver_id);
CREATE INDEX IF NOT EXISTS idx_candle_sends_week_start ON candle_sends(week_start);
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE candle_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quests_select" ON quests FOR SELECT USING (true);
CREATE POLICY "quests_insert" ON quests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quests_update" ON quests FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "quest_completions_select" ON quest_completions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = completed_by);
CREATE POLICY "quest_completions_insert" ON quest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quest_completions_update" ON quest_completions FOR UPDATE USING (auth.uid() = completed_by);
CREATE POLICY "user_scores_select" ON user_scores FOR SELECT USING (true);
CREATE POLICY "user_scores_insert" ON user_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "candle_sends_select" ON candle_sends FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "candle_sends_insert" ON candle_sends FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ----- 全員向けお知らせ・クエスト -----
CREATE TABLE IF NOT EXISTS global_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE quests ALTER COLUMN community_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_global_announcements_created_at ON global_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quests_community_id_null ON quests(community_id) WHERE community_id IS NULL;
ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "全員が全員向けお知らせを閲覧可能" ON global_announcements FOR SELECT USING (true);
CREATE POLICY "管理者は全員向けお知らせを作成可能" ON global_announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "管理者は全員向けお知らせを更新・削除可能" ON global_announcements FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "管理者は全員向けお知らせを削除可能" ON global_announcements FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "全員が全員向けクエストを閲覧可能" ON quests FOR SELECT USING (community_id IS NULL);
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'announcement', 'community_event', 'community_quest', 'urgent_question', 'safety_check', 'dm', 'comment', 'like', 'organization_verification', 'global_announcement', 'global_quest'
));
DROP TRIGGER IF EXISTS trigger_update_global_announcements_updated_at ON global_announcements;
CREATE TRIGGER trigger_update_global_announcements_updated_at BEFORE UPDATE ON global_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- 複数大学・期間・留学先大学 -----
CREATE TABLE IF NOT EXISTS user_universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);
CREATE TABLE IF NOT EXISTS user_study_abroad_universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);
CREATE INDEX IF NOT EXISTS idx_user_universities_user_id ON user_universities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_universities_university_id ON user_universities(university_id);
CREATE INDEX IF NOT EXISTS idx_user_study_abroad_universities_user_id ON user_study_abroad_universities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_study_abroad_universities_university_id ON user_study_abroad_universities(university_id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_organization_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university_end_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_abroad_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_abroad_end_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_abroad_university_id UUID REFERENCES universities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_study_abroad_university_id ON profiles(study_abroad_university_id);
ALTER TABLE user_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_abroad_universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all universities" ON user_universities FOR SELECT USING (true);
CREATE POLICY "Users can insert their own universities" ON user_universities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own universities" ON user_universities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own universities" ON user_universities FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view all study abroad universities" ON user_study_abroad_universities FOR SELECT USING (true);
CREATE POLICY "Users can insert their own study abroad universities" ON user_study_abroad_universities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study abroad universities" ON user_study_abroad_universities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study abroad universities" ON user_study_abroad_universities FOR DELETE USING (auth.uid() = user_id);

-- ----- AIコンシェルジュ -----
CREATE TABLE IF NOT EXISTS ai_concierge_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('grounded', 'reasoning')),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  related_posts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_user_id ON ai_concierge_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_created_at ON ai_concierge_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_question_text ON ai_concierge_chats(question_text);
CREATE INDEX IF NOT EXISTS idx_ai_concierge_chats_answer_text ON ai_concierge_chats(answer_text);
ALTER TABLE ai_concierge_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_concierge_chats_select_policy" ON ai_concierge_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_concierge_chats_insert_policy" ON ai_concierge_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_concierge_chats_delete_policy" ON ai_concierge_chats FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION update_ai_concierge_chats_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ai_concierge_chats_updated_at BEFORE UPDATE ON ai_concierge_chats FOR EACH ROW EXECUTE FUNCTION update_ai_concierge_chats_updated_at();

-- ----- 03-columns: 各種カラム追加 -----
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sns_x TEXT, ADD COLUMN IF NOT EXISTS sns_tiktok TEXT, ADD COLUMN IF NOT EXISTS sns_instagram TEXT, ADD COLUMN IF NOT EXISTS sns_facebook TEXT, ADD COLUMN IF NOT EXISTS sns_linkedin TEXT, ADD COLUMN IF NOT EXISTS sns_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_operator BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS quest_id UUID REFERENCES quests(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS quest_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'official' CHECK (community_type IN ('guild', 'official'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
