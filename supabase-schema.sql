-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  university TEXT,
  study_abroad_destination TEXT,
  major TEXT,
  bio TEXT,
  languages TEXT[] DEFAULT '{}',
  contribution_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投稿テーブル
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('question', 'diary', 'information')),
  tags TEXT[] DEFAULT '{}',
  university TEXT,
  study_abroad_destination TEXT,
  major TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コメントテーブル
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいねテーブル
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- メッセージテーブル
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通報テーブル
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- インデックス作成
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- プロフィールのRLSポリシー
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のプロフィールを更新可能" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "ユーザーは自分のプロフィールを挿入可能" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 投稿のRLSポリシー
CREATE POLICY "投稿は誰でも閲覧可能" ON posts FOR SELECT USING (true);
CREATE POLICY "認証ユーザーは投稿を作成可能" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "投稿者は自分の投稿を更新・削除可能" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "投稿者は自分の投稿を削除可能" ON posts FOR DELETE USING (auth.uid() = author_id);

-- コメントのRLSポリシー
CREATE POLICY "コメントは誰でも閲覧可能" ON comments FOR SELECT USING (true);
CREATE POLICY "認証ユーザーはコメントを作成可能" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "コメント作成者は自分のコメントを更新・削除可能" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "コメント作成者は自分のコメントを削除可能" ON comments FOR DELETE USING (auth.uid() = author_id);

-- いいねのRLSポリシー
CREATE POLICY "いいねは誰でも閲覧可能" ON likes FOR SELECT USING (true);
CREATE POLICY "認証ユーザーはいいねを作成可能" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のいいねを削除可能" ON likes FOR DELETE USING (auth.uid() = user_id);

-- メッセージのRLSポリシー
CREATE POLICY "メッセージの送信者・受信者のみ閲覧可能" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "認証ユーザーはメッセージを送信可能" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "メッセージ受信者は既読に更新可能" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 通報のRLSポリシー
CREATE POLICY "通報は誰でも閲覧可能" ON reports FOR SELECT USING (true);
CREATE POLICY "認証ユーザーは通報を作成可能" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- トリガー関数：投稿のコメント数を更新
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガー：コメント数の自動更新
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- トリガー関数：いいね数を更新
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガー：いいね数の自動更新
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();
