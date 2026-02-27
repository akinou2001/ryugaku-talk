-- ============================================================
-- 002: コミュニティスキーマ（communities, community_members, rooms, announcements, faqs, events）
-- 元: sql/01-base-schema/supabase-schema-community.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  icon_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'banned')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_permission TEXT NOT NULL DEFAULT 'auto' CHECK (member_permission IN ('auto', 'request')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES community_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  attachment_url TEXT,
  attachment_filename TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  online_url TEXT,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  capacity INTEGER,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_communities_owner_id ON communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_visibility ON communities(visibility);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);
CREATE INDEX IF NOT EXISTS idx_community_rooms_community_id ON community_rooms(community_id);
CREATE INDEX IF NOT EXISTS idx_community_room_messages_room_id ON community_room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_community_room_messages_sender_id ON community_room_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_announcements_community_id ON announcements(community_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_community_id ON faqs(community_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コミュニティは誰でも閲覧可能" ON communities FOR SELECT USING (true);
CREATE POLICY "組織アカウントのみコミュニティを作成可能" ON communities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.account_type != 'individual' AND profiles.verification_status = 'verified')
);
CREATE POLICY "コミュニティ所有者は更新可能" ON communities FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "コミュニティ所有者は削除可能" ON communities FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "コミュニティメンバー情報はメンバーとコミュニティ所有者が閲覧可能" ON community_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM communities WHERE communities.id = community_members.community_id AND communities.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = community_members.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
);
CREATE POLICY "認証ユーザーは加入申請可能" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "コミュニティ所有者はメンバーを承認・拒否可能" ON community_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = community_members.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "ユーザーは自分の申請を削除可能" ON community_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "コミュニティメンバーはルームを閲覧可能" ON community_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = community_rooms.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
  OR EXISTS (SELECT 1 FROM communities WHERE communities.id = community_rooms.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はルームを作成可能" ON community_rooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = community_rooms.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はルームを更新・削除可能" ON community_rooms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = community_rooms.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はルームを削除可能" ON community_rooms FOR DELETE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = community_rooms.community_id AND communities.owner_id = auth.uid())
);

CREATE POLICY "ルームメンバーはメッセージを閲覧可能" ON community_room_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_rooms cr
    JOIN community_members cm ON cm.community_id = cr.community_id
    WHERE cr.id = community_room_messages.room_id AND cm.user_id = auth.uid() AND cm.status = 'approved'
  )
);
CREATE POLICY "ルームメンバーはメッセージを送信可能" ON community_room_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM community_rooms cr
    JOIN community_members cm ON cm.community_id = cr.community_id
    WHERE cr.id = community_room_messages.room_id AND cm.user_id = auth.uid() AND cm.status = 'approved'
  )
);

CREATE POLICY "コミュニティメンバーはお知らせを閲覧可能" ON announcements FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = announcements.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
  OR EXISTS (SELECT 1 FROM communities WHERE communities.id = announcements.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はお知らせを作成可能" ON announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = announcements.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はお知らせを更新・削除可能" ON announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = announcements.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はお知らせを削除可能" ON announcements FOR DELETE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = announcements.community_id AND communities.owner_id = auth.uid())
);

CREATE POLICY "コミュニティメンバーはFAQを閲覧可能" ON faqs FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = faqs.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
  OR EXISTS (SELECT 1 FROM communities WHERE communities.id = faqs.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はFAQを作成可能" ON faqs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = faqs.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はFAQを更新・削除可能" ON faqs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = faqs.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はFAQを削除可能" ON faqs FOR DELETE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = faqs.community_id AND communities.owner_id = auth.uid())
);

CREATE POLICY "コミュニティメンバーはイベントを閲覧可能" ON events FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = events.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
  OR EXISTS (SELECT 1 FROM communities WHERE communities.id = events.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はイベントを作成可能" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = events.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はイベントを更新・削除可能" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = events.community_id AND communities.owner_id = auth.uid())
);
CREATE POLICY "コミュニティ所有者はイベントを削除可能" ON events FOR DELETE USING (
  EXISTS (SELECT 1 FROM communities WHERE communities.id = events.community_id AND communities.owner_id = auth.uid())
);

CREATE POLICY "コミュニティメンバーは参加者情報を閲覧可能" ON event_participants FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events e JOIN communities c ON c.id = e.community_id
    WHERE e.id = event_participants.event_id AND (c.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM community_members cm WHERE cm.community_id = e.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved'
    ))
  )
);
CREATE POLICY "コミュニティメンバーは参加登録可能" ON event_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM events e JOIN community_members cm ON cm.community_id = e.community_id
    WHERE e.id = event_participants.event_id AND cm.user_id = auth.uid() AND cm.status = 'approved'
  )
);
CREATE POLICY "ユーザーは自分の参加登録を更新可能" ON event_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分の参加登録を削除可能" ON event_participants FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_communities_updated_at ON communities;
CREATE TRIGGER trigger_update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_community_members_updated_at ON community_members;
CREATE TRIGGER trigger_update_community_members_updated_at BEFORE UPDATE ON community_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_community_rooms_updated_at ON community_rooms;
CREATE TRIGGER trigger_update_community_rooms_updated_at BEFORE UPDATE ON community_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_faqs_updated_at ON faqs;
CREATE TRIGGER trigger_update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
CREATE TRIGGER trigger_update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_joined_at_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.joined_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_joined_at_on_approval ON community_members;
CREATE TRIGGER trigger_set_joined_at_on_approval BEFORE UPDATE ON community_members FOR EACH ROW EXECUTE FUNCTION set_joined_at_on_approval();
