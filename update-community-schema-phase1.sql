-- 1. communitiesテーブルの更新
-- is_publicカラムを追加（誰でも参加可能か、承認制か）
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 既存のvisibilityカラムがある場合は、is_publicに変換
-- visibility = 'public' → is_public = TRUE
-- visibility = 'private' → is_public = FALSE
UPDATE communities
SET is_public = (visibility = 'public')
WHERE is_public IS NULL;

-- 2. postsテーブルの更新
-- post_typeカラムを追加（コミュニティ限定投稿の種別を管理）
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS post_type TEXT CHECK (post_type IN ('announcement', 'event', 'quest', 'normal'));

-- デフォルト値を設定（既存の投稿は'normal'）
UPDATE posts
SET post_type = 'normal'
WHERE post_type IS NULL;

-- attachmentsカラムを追加（JSONB形式で複数ファイルを保存）
-- 形式: [{"url": "...", "filename": "...", "type": "pdf|image|..."}, ...]
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- community_idカラムが既に存在するか確認（add-community-id-to-posts.sqlで追加済みの可能性）
-- 存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE posts
    ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
    
    -- インデックスを作成
    CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
    CREATE INDEX IF NOT EXISTS idx_posts_community_id_not_null ON posts(community_id) 
    WHERE community_id IS NOT NULL;
  END IF;
END $$;

-- 3. eventsテーブルの更新
-- registration_deadlineをdeadlineにリネーム（要求仕様に合わせる）
-- 既にregistration_deadlineがある場合はそのまま使用
-- 新しくdeadlineカラムを追加（registration_deadlineがない場合の代替）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'deadline'
  ) THEN
    -- registration_deadlineをdeadlineにコピー（既存データの移行）
    ALTER TABLE events
    ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
    
    UPDATE events
    SET deadline = registration_deadline
    WHERE registration_deadline IS NOT NULL;
  END IF;
END $$;

-- 4. インデックスの追加・更新
CREATE INDEX IF NOT EXISTS idx_communities_is_public ON communities(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_community_id_post_type ON posts(community_id, post_type)
WHERE community_id IS NOT NULL;

-- 5. RLSポリシーの更新
-- postsテーブルのRLSポリシーを更新（コミュニティ限定投稿の表示制御）
-- コミュニティメンバーのみコミュニティ限定投稿を閲覧可能

-- 既存のポリシーを確認し、必要に応じて更新
DROP POLICY IF EXISTS "コミュニティメンバーはコミュニティ限定投稿を閲覧可能" ON posts;
CREATE POLICY "コミュニティメンバーはコミュニティ限定投稿を閲覧可能" ON posts
  FOR SELECT USING (
    -- 通常の投稿（community_idがNULL）は誰でも閲覧可能
    community_id IS NULL
    OR
    -- コミュニティ限定投稿は、メンバーまたは投稿者本人が閲覧可能
    (
      EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = posts.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
      )
      OR author_id = auth.uid()
    )
  );

-- コミュニティメンバーはコミュニティ限定投稿を作成可能
DROP POLICY IF EXISTS "コミュニティメンバーはコミュニティ限定投稿を作成可能" ON posts;
CREATE POLICY "コミュニティメンバーはコミュニティ限定投稿を作成可能" ON posts
  FOR INSERT WITH CHECK (
    -- 通常の投稿（community_idがNULL）は認証ユーザーなら誰でも作成可能
    (community_id IS NULL AND auth.uid() = author_id)
    OR
    -- コミュニティ限定投稿は、メンバーのみ作成可能
    (
      community_id IS NOT NULL
      AND auth.uid() = author_id
      AND EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = posts.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
      )
    )
  );

-- 6. コミュニティ限定投稿の種別制約
-- 質問・日記のみコミュニティ限定投稿可能（つぶやきは不可）
-- この制約はアプリケーション層で実装するか、CHECK制約で実装
-- 今回はアプリケーション層で制御するため、CHECK制約は追加しない

