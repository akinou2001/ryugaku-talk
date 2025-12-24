# コミュニティ機能（組織向け）実装ガイド

## 概要

このドキュメントは、コミュニティ機能の実装状況とセットアップ手順を説明します。

## 実装済み機能

### ✅ 1. データベーススキーマ
- `supabase-schema-community.sql` を作成
- 以下のテーブルを定義：
  - `communities` - コミュニティ情報
  - `community_members` - メンバーと申請状態
  - `community_rooms` - チャットルーム
  - `community_room_messages` - ルームメッセージ
  - `announcements` - お知らせ
  - `faqs` - FAQ
  - `events` - イベント
  - `event_participants` - イベント参加者

### ✅ 2. 型定義
- `src/lib/supabase.ts` にコミュニティ関連の型を追加
- `Community`, `CommunityMember`, `CommunityRoom`, `Announcement`, `FAQ`, `Event` インターフェース

### ✅ 3. コミュニティ基本機能
- `src/lib/community.ts` - コミュニティ操作のヘルパー関数
- `src/app/communities/page.tsx` - コミュニティ一覧・検索ページ
- `src/app/communities/new/page.tsx` - コミュニティ作成ページ

## セットアップ手順

### 1. データベーススキーマの適用

Supabaseダッシュボードで以下のSQLを実行：

```sql
-- supabase-schema-community.sql の内容をすべてコピーして実行
```

### 2. 動作確認

1. 認証済みの組織アカウントでログイン
2. `/communities/new` にアクセスしてコミュニティを作成
3. `/communities` でコミュニティ一覧を確認
4. 一般ユーザーでログインして加入申請をテスト

## 実装予定機能

### 🔄 実装中
- コミュニティ詳細ページ
- メンバー管理機能

### ⏳ 未実装
- チャットルーム機能
- お知らせ機能
- FAQ機能
- イベント機能
- 組織ダッシュボード
- プロフィールへの組織バッジ表示
- 公式バッジの全画面共通表示

## 次のステップ

1. コミュニティ詳細ページの実装
2. メンバー申請・承認機能のUI実装
3. チャットルーム機能の実装
4. お知らせ・FAQ・イベント機能の実装
5. 組織ダッシュボードの実装

## 注意事項

- コミュニティ作成は認証済みの組織アカウントのみ可能
- RLSポリシーにより、適切な権限管理が実装されています
- 画像アップロード機能は今後実装予定（現在はURL入力）


