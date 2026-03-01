-- ============================================================
-- 008: コミュニティ管理者機能（招待リンク・所有権移管）
-- 元: sql/05-rls-policies/add-community-admin-features.sql
-- ============================================================

-- コミュニティ招待テーブル
CREATE TABLE IF NOT EXISTS community_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_invites_token ON community_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_community_invites_community ON community_invites(community_id);
CREATE INDEX IF NOT EXISTS idx_community_invites_active ON community_invites(is_active, expires_at);

-- コミュニティ所有者移管履歴テーブル
CREATE TABLE IF NOT EXISTS community_ownership_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_ownership_transfers_community ON community_ownership_transfers(community_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_from_user ON community_ownership_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_to_user ON community_ownership_transfers(to_user_id);

-- RLS: community_invites
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "コミュニティ所有者・管理者は招待を作成可能" ON community_invites;
CREATE POLICY "コミュニティ所有者・管理者は招待を作成可能" ON community_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_invites.community_id
      AND communities.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'approved'
      AND community_members.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "コミュニティ所有者・管理者は招待を閲覧可能" ON community_invites;
CREATE POLICY "コミュニティ所有者・管理者は招待を閲覧可能" ON community_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_invites.community_id
      AND communities.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'approved'
      AND community_members.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "有効なトークンで招待を閲覧可能" ON community_invites;
CREATE POLICY "有効なトークンで招待を閲覧可能" ON community_invites
  FOR SELECT USING (
    invite_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_active = TRUE
    AND (max_uses IS NULL OR used_count < max_uses)
  );

DROP POLICY IF EXISTS "コミュニティ所有者・管理者は招待を更新可能" ON community_invites;
CREATE POLICY "コミュニティ所有者・管理者は招待を更新可能" ON community_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_invites.community_id
      AND communities.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'approved'
      AND community_members.role IN ('admin', 'moderator')
    )
  );

-- RLS: community_ownership_transfers
ALTER TABLE community_ownership_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "コミュニティメンバーは移管履歴を閲覧可能" ON community_ownership_transfers;
CREATE POLICY "コミュニティメンバーは移管履歴を閲覧可能" ON community_ownership_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_ownership_transfers.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "コミュニティ所有者のみ移管履歴を作成可能" ON community_ownership_transfers;
CREATE POLICY "コミュニティ所有者のみ移管履歴を作成可能" ON community_ownership_transfers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_ownership_transfers.community_id
      AND communities.owner_id = auth.uid()
    )
  );
