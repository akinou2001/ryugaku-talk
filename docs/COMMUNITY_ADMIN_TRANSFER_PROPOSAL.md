# コミュニティ管理者権限譲渡・招待機能 実装提案

## 📋 概要

コミュニティの管理者権限譲渡と招待方法についての実装提案です。

## 🔍 現状分析

### 現在の実装状況

1. **所有者（owner_id）**
   - コミュニティ作成時に設定
   - 所有者のみがコミュニティの編集・削除が可能
   - 移管機能なし

2. **メンバーロール**
   - `member`: 一般メンバー
   - `moderator`: モデレーター
   - `admin`: 管理者（コミュニティ内）
   - ロール変更機能は部分的に実装済み

3. **招待方法**
   - 現在は加入申請方式のみ
   - URL共有や招待リンクの機能なし

## 🎯 実装すべき機能

### 1. コミュニティへの招待リンク生成

#### 機能概要
- トークン付きの招待URLを生成
- 招待リンクをクリックすると自動的に加入申請が送信される
- トークンに有効期限を設定可能

#### データベーススキーマ追加

```sql
-- コミュニティ招待テーブル
CREATE TABLE IF NOT EXISTS community_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL, -- NULLの場合は無制限
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_community_invites_token ON community_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_community_invites_community ON community_invites(community_id);

-- RLSポリシー
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

-- コミュニティ所有者・管理者は招待を作成・閲覧可能
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

-- 誰でも有効なトークンで招待を閲覧可能（招待URL使用時）
CREATE POLICY "有効なトークンで招待を閲覧可能" ON community_invites
  FOR SELECT USING (
    invite_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_active = TRUE
    AND (max_uses IS NULL OR used_count < max_uses)
  );
```

#### 実装する関数

```typescript
// src/lib/community.ts に追加

/**
 * 招待リンクを生成
 */
export async function createCommunityInvite(
  communityId: string,
  options?: {
    expiresInDays?: number
    maxUses?: number
  }
): Promise<{ inviteToken: string; inviteUrl: string }>

/**
 * 招待トークンでコミュニティに参加
 */
export async function joinCommunityByInvite(
  inviteToken: string
): Promise<void>

/**
 * 招待リンク一覧を取得
 */
export async function getCommunityInvites(
  communityId: string
): Promise<CommunityInvite[]>

/**
 * 招待リンクを無効化
 */
export async function revokeCommunityInvite(
  inviteId: string
): Promise<void>
```

### 2. 所有者権限の移管

#### 機能概要
- 現在の所有者が他のメンバーに所有者権限を移管
- 移管後、元の所有者は自動的に管理者ロールに変更
- 移管履歴を記録

#### データベーススキーマ追加

```sql
-- コミュニティ所有者移管履歴テーブル
CREATE TABLE IF NOT EXISTS community_ownership_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_community ON community_ownership_transfers(community_id);
```

#### 実装する関数

```typescript
// src/lib/community.ts に追加

/**
 * コミュニティの所有者権限を移管
 */
export async function transferCommunityOwnership(
  communityId: string,
  newOwnerId: string
): Promise<void>
```

#### 実装の注意点

1. **移管前の確認**
   - 移管先のユーザーがコミュニティメンバーであることを確認
   - 移管先のユーザーが既に承認済みメンバーであることを確認

2. **移管処理**
   - `communities.owner_id` を更新
   - 元の所有者を `admin` ロールに変更（既にメンバーでない場合は追加）
   - 移管履歴を記録

3. **セキュリティ**
   - 所有者のみが移管可能
   - 移管は不可逆的な操作として扱う
   - 確認ダイアログを表示

### 3. 管理者ロールの管理

#### 機能概要
- 所有者がメンバーに管理者ロールを付与・剥奪
- 複数の管理者を設定可能
- 管理者はコミュニティの編集・メンバー管理が可能

#### 実装する関数

```typescript
// src/lib/community.ts に追加

/**
 * メンバーに管理者ロールを付与
 */
export async function promoteToAdmin(
  communityId: string,
  userId: string
): Promise<void>

/**
 * 管理者ロールを剥奪
 */
export async function demoteFromAdmin(
  communityId: string,
  userId: string
): Promise<void>
```

#### 権限の整理

| ロール | 権限 |
|--------|------|
| **owner** | 全権限（編集、削除、所有者移管、管理者任命） |
| **admin** | コミュニティ編集、メンバー管理、招待作成、クエスト管理 |
| **moderator** | メンバー承認・拒否、投稿管理 |
| **member** | 投稿、イベント参加、クエスト参加 |

## 📝 実装手順

### Phase 1: データベーススキーマの追加
1. `community_invites` テーブルの作成
2. `community_ownership_transfers` テーブルの作成
3. RLSポリシーの設定

### Phase 2: バックエンド関数の実装
1. 招待リンク生成・使用機能
2. 所有者権限移管機能
3. 管理者ロール管理機能

### Phase 3: フロントエンドUIの実装
1. コミュニティ詳細ページに「招待リンク」セクションを追加
2. 管理者一覧に「所有者移管」ボタンを追加
3. メンバー一覧に「管理者に任命」ボタンを追加

### Phase 4: セキュリティ強化
1. 招待トークンの検証
2. 権限チェックの強化
3. 操作ログの記録

## 🔒 セキュリティ考慮事項

1. **招待リンク**
   - トークンは推測困難なランダム文字列を使用
   - 有効期限を設定可能
   - 使用回数制限を設定可能
   - 無効化機能を提供

2. **権限移管**
   - 所有者のみが実行可能
   - 確認ダイアログを必須
   - 移管履歴を記録

3. **管理者任命**
   - 所有者のみが実行可能
   - 既存の管理者も他の管理者を任命可能（オプション）

## 📊 UI/UX設計

### 招待リンク管理画面

```
[コミュニティ設定] > [招待リンク]

- 新しい招待リンクを作成
  - 有効期限: [7日] [30日] [無期限]
  - 使用回数制限: [ ] 無制限 [ ] 制限する [10] 回
  
- 招待リンク一覧
  - リンクURL（コピーボタン付き）
  - 作成日時
  - 有効期限
  - 使用回数 / 最大使用回数
  - ステータス（有効/無効）
  - 無効化ボタン
```

### 所有者移管画面

```
[コミュニティ設定] > [管理者] > [所有者を移管]

- 現在の所有者: [名前]
- 新しい所有者を選択: [ドロップダウン: 承認済みメンバー一覧]
- 移管理由（任意）: [テキストエリア]

[確認] この操作は取り消せません。本当に所有者を移管しますか？
[キャンセル] [移管する]
```

### 管理者任命画面

```
[コミュニティ設定] > [管理者]

- 現在の管理者一覧
  - [名前] [ロール] [任命日] [操作: 管理者権限を剥奪]
  
- メンバーから管理者を任命
  - [ドロップダウン: 承認済みメンバー一覧]
  - [管理者に任命] ボタン
```

## 🚀 次のステップ

1. この提案をレビュー・承認
2. データベーススキーマの実装
3. バックエンド関数の実装
4. フロントエンドUIの実装
5. テスト・デバッグ
6. ドキュメント作成
