# Phase 3: カラム追加

既存テーブルへのカラム追加です。Phase 2の完了後に実行してください。

## 📋 実行順序

以下の順序で実行してください：

1. **`add-icon-url-to-profiles.sql`**
   - プロフィールアイコンURL

2. **`add-sns-links-to-profiles.sql`**
   - SNSリンクフィールド

3. **`add-is-active-column-to-profiles.sql`**
   - アクティブ状態フラグ

4. **`add-is-organization-owner-column.sql`**
   - 組織オーナーフラグ

5. **`add-operator-badge.sql`**
   - 運営バッジ機能

6. **`add-community-cover-image-column.sql`**
   - コミュニティカバー画像

7. **`add-community-archive.sql`**
   - コミュニティアーカイブ機能

8. **`add-urgency-to-posts.sql`**
   - 投稿の緊急度フィールド

9. **`add-quest-id-to-posts.sql`**
   - 投稿へのクエストID追加

10. **`add-quest-deadline-column.sql`**
    - クエスト期限フィールド

11. **`add-normalized-name-column.sql`**
    - 正規化された名前カラム

## ⚠️ 注意事項

- Phase 2の完了後に実行してください
- 各SQLファイルは`ADD COLUMN IF NOT EXISTS`を使用しているため、重複実行しても安全です
