-- 通知テーブル
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- RLS (Row Level Security) ポリシー
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 通知のRLSポリシー
CREATE POLICY "ユーザーは自分の通知のみ閲覧可能" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "システムは通知を作成可能" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "ユーザーは自分の通知を更新可能" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 安否確認テーブル
CREATE TABLE IF NOT EXISTS safety_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_area JSONB, -- {lat, lng, radius} または {country, region}
  target_user_ids UUID[], -- 特定ユーザーへの送信（オプション）
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  response_count INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 安否確認回答テーブル
CREATE TABLE IF NOT EXISTS safety_check_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safety_check_id UUID REFERENCES safety_checks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('safe', 'unsafe', 'unknown')),
  message TEXT,
  location JSONB, -- {lat, lng} 現在位置（オプション）
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(safety_check_id, user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_safety_checks_created_by ON safety_checks(created_by);
CREATE INDEX IF NOT EXISTS idx_safety_checks_community_id ON safety_checks(community_id);
CREATE INDEX IF NOT EXISTS idx_safety_checks_status ON safety_checks(status);
CREATE INDEX IF NOT EXISTS idx_safety_check_responses_safety_check_id ON safety_check_responses(safety_check_id);
CREATE INDEX IF NOT EXISTS idx_safety_check_responses_user_id ON safety_check_responses(user_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_check_responses ENABLE ROW LEVEL SECURITY;

-- 安否確認のRLSポリシー
CREATE POLICY "組織アカウントは安否確認を作成可能" ON safety_checks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND account_type IN ('educational', 'company', 'government')
    AND verification_status = 'verified'
  )
);
CREATE POLICY "組織アカウントと対象ユーザーは安否確認を閲覧可能" ON safety_checks FOR SELECT USING (
  created_by = auth.uid() OR 
  auth.uid() = ANY(target_user_ids) OR
  EXISTS (
    SELECT 1 FROM communities 
    WHERE id = community_id 
    AND EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = communities.id 
      AND user_id = auth.uid()
    )
  )
);
CREATE POLICY "組織アカウントは安否確認を更新可能" ON safety_checks FOR UPDATE USING (created_by = auth.uid());

-- 安否確認回答のRLSポリシー
CREATE POLICY "ユーザーは自分の回答のみ閲覧可能" ON safety_check_responses FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM safety_checks WHERE id = safety_check_responses.safety_check_id AND created_by = auth.uid()));
CREATE POLICY "対象ユーザーは回答を作成可能" ON safety_check_responses FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM safety_checks 
    WHERE id = safety_check_responses.safety_check_id 
    AND (auth.uid() = ANY(target_user_ids) OR auth.uid() IN (
      SELECT user_id FROM community_members 
      WHERE community_id = safety_checks.community_id
    ))
  )
);
CREATE POLICY "ユーザーは自分の回答を更新可能" ON safety_check_responses FOR UPDATE USING (auth.uid() = user_id);

