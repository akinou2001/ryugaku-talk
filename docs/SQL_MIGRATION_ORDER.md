# SQLマイグレーション実行順序ガイド

本番環境にデータベーススキーマを適用する際の、SQLファイルの実行順序を説明します。

## 📁 フォルダ構成

SQLファイルは実行順序に基づいて、`sql/`ディレクトリ内で以下のフォルダに分類されています：

- **`01-base-schema/`** - ベーススキーマ（必須・最初に実行）
- **`02-features/`** - 機能追加（必須）
- **`03-columns/`** - カラム追加（必須）
- **`04-storage/`** - ストレージ設定（必須）
- **`05-rls-policies/`** - RLSポリシー修正（必須）
- **`06-triggers/`** - トリガー・関数（必須）
- **`07-constraints/`** - 制約・インデックス（推奨）
- **`08-data-updates/`** - データ更新（本番環境では通常不要）
- **`09-admin-setup/`** - 管理者アカウント設定（必要に応じて）
- **`10-checks/`** - 検証・チェック（任意）

各フォルダにはREADME.mdがあり、そのフォルダ内のSQLファイルの説明と実行順序が記載されています。

## 📋 概要

SQLファイルは以下のカテゴリに分類されます：

1. **ベーススキーマ**: 基本的なテーブル構造を作成
2. **機能追加スキーマ**: 特定の機能を追加
3. **修正ファイル**: バグ修正やポリシー更新
4. **セットアップファイル**: ストレージや初期データの設定
5. **データ更新ファイル**: 既存データの更新（本番環境では通常不要）

## 🚀 推奨実行順序

### Phase 1: ベーススキーマ（必須）

基本的なテーブル構造を作成します。**必ず最初に実行**してください。

フォルダ: `sql/01-base-schema/`

1. **`supabase-schema.sql`**
   - 基本テーブル（profiles, posts, comments, likes, messages）
   - 基本的なRLSポリシー

2. **`supabase-schema-universities.sql`**
   - 大学マスターテーブル（continents, universities, university_aliases）
   - ユーザーと大学の関連テーブル

3. **`supabase-schema-organization-accounts.sql`**
   - 組織アカウント機能の追加
   - profilesテーブルへのカラム追加

4. **`supabase-schema-admin.sql`**
   - 管理者機能の追加
   - profilesテーブルへの管理者フラグ追加

5. **`supabase-schema-community.sql`**
   - コミュニティ機能（communities, community_members, community_rooms等）
   - コミュニティ関連のRLSポリシー

6. **`fix-missing-columns.sql`**
   - 不足しているカラムの修正

### Phase 2: 機能追加（必須）

主要な機能を追加するSQLファイルです。

フォルダ: `sql/02-features/`

1. **`add-multiple-universities-support.sql`**
   - 複数大学対応機能

2. **`add-university-id-to-profiles-posts.sql`**
   - プロフィールと投稿への大学ID追加

3. **`add-university-period-fields.sql`**
   - 大学在籍期間フィールドの追加

4. **`add-study-abroad-university-field.sql`**
   - 留学先大学フィールドの追加

5. **`add-community-id-to-posts.sql`**
   - 投稿へのコミュニティID追加

6. **`add-quest-and-score-system.sql`**
   - クエスト・スコアシステム

7. **`add-global-announcements-and-quests.sql`**
   - グローバルお知らせとクエスト機能

8. **`add-notifications-table.sql`**
   - 通知テーブル

9. **`add-ai-concierge-chats-table.sql`**
   - AIコンシェルジュチャット履歴テーブル

### Phase 3: カラム追加（必須）

既存テーブルへのカラム追加です。

フォルダ: `sql/03-columns/`

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

### Phase 4: 添付ファイル・ストレージ（必須）

ファイル添付機能とストレージ設定です。

フォルダ: `sql/04-storage/`

1. **`setup-supabase-storage.sql`**
   - Supabaseストレージの基本設定

2. **`setup-community-covers-storage.sql`**
   - コミュニティカバー画像用ストレージ

3. **`create-channel-attachments-bucket.sql`**
   - チャンネル添付ファイル用バケット

4. **`add-channel-message-attachments.sql`**
   - チャンネルメッセージへの添付ファイル機能

5. **`add-attachments-to-events.sql`**
   - イベントへの添付ファイル機能

6. **`setup-channel-attachments-complete.sql`**
   - チャンネル添付ファイルの完全セットアップ

7. **`setup-channel-attachments-rls-policies.sql`**
   - チャンネル添付ファイルのRLSポリシー

### Phase 5: RLSポリシー修正（必須）

セキュリティポリシーの修正と改善です。

フォルダ: `sql/05-rls-policies/`

1. **`fix-profiles-insert-policy.sql`**
   - プロフィール挿入ポリシーの修正

2. **`fix-rls-policy-for-admin.sql`**
   - 管理者用RLSポリシーの修正

3. **`fix-admin-rls-policies.sql`**
   - 管理者RLSポリシーの修正

4. **`fix-communities-rls-policy.sql`**
   - コミュニティRLSポリシーの修正

5. **`fix-community-delete-policy.sql`**
   - コミュニティ削除ポリシーの修正

6. **`fix-community-members-rls-recursion.sql`**
   - コミュニティメンバーRLS再帰問題の修正

7. **`update-community-channels-rls.sql`**
   - コミュニティチャンネルRLSの更新

8. **`update-community-schema-phase1.sql`**
   - コミュニティスキーマの更新（Phase 1）

9. **`add-community-admin-features.sql`**
   - コミュニティ管理者機能の追加

10. **`add-reports-admin-rls-policy.sql`**
    - 通報管理者RLSポリシーの追加

11. **`add-notifications-delete-policy.sql`**
    - 通知削除ポリシーの追加

12. **`add-admin-community-delete-policy.sql`**
    - 管理者コミュニティ削除ポリシーの追加

13. **`restrict-quest-creation-to-owners.sql`**
    - クエスト作成権限の制限

### Phase 6: トリガー・関数（必須）

データベーストリガーと関数の設定です。

フォルダ: `sql/06-triggers/`

1. **`supabase-trigger-verification.sql`**
   - 認証トリガー

2. **`fix-likes-count-trigger.sql`**
   - いいね数カウントトリガーの修正

3. **`add-recurring-safety-check.sql`**
   - 定期的な安全性チェック

### Phase 7: 制約・インデックス（推奨）

データ整合性とパフォーマンスのための制約とインデックスです。

フォルダ: `sql/07-constraints/`

1. **`add-unique-constraint-universities-safe.sql`**
   - 大学テーブルのユニーク制約（安全版）

2. **`add-unique-constraint-universities.sql`**
   - 大学テーブルのユニーク制約

### Phase 8: データ更新（本番環境では通常不要）

既存データの更新です。**本番環境では通常実行不要**です。

フォルダ: `sql/08-data-updates/`

- `update-japanese-names.sql` - 日本語名の更新
- `update-japanese-names-from-csv.sql` - CSVからの日本語名更新
- `remove-duplicate-universities.sql` - 重複大学の削除
- `reset-japanese-names.sql` - 日本語名のリセット

### Phase 9: 管理者アカウント設定（本番環境で必要に応じて）

管理者アカウントの作成です。**本番環境では必要に応じて実行**してください。

フォルダ: `sql/09-admin-setup/`

- `setup-admin-account.sql` - 管理者アカウントの作成
- `setup-new-admin.sql` - 新しい管理者の作成
- `delete-admin-user.sql` - 管理者ユーザーの削除（注意）

### Phase 10: 検証・チェック（任意）

データベースの状態を確認するSQLファイルです。実行は任意です。

フォルダ: `sql/10-checks/`

- `check-rls-policies.sql` - RLSポリシーの確認
- `check-ai-concierge-chats-table.sql` - AIコンシェルジュチャットテーブルの確認
- `test-verification-requests.sql` - 認証リクエストのテスト

## ⚠️ 重要な注意事項

### 1. 実行順序の重要性

- **Phase 1-6は必ず順番通りに実行**してください
- 依存関係があるため、順序を変えるとエラーが発生する可能性があります

### 2. 本番環境での実行

- **Phase 8（データ更新）は通常実行不要**です
- 本番環境に既存データがある場合、データ更新SQLは慎重に実行してください

### 3. エラーハンドリング

- `IF NOT EXISTS`や`ADD COLUMN IF NOT EXISTS`を使用しているため、一部のSQLは重複実行しても安全です
- ただし、エラーが発生した場合は、そのSQLファイルの内容を確認してください

### 4. バックアップ

- **本番環境に適用する前に、必ずバックアップを取得**してください
- Supabaseダッシュボードで「Database」→「Backups」からバックアップを作成できます

## 🛠️ 実行方法

### 方法1: Supabaseダッシュボードで手動実行（推奨）

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `sql/`ディレクトリ内のフォルダを順番に開く（01-base-schema → 02-features → ...）
3. 各フォルダ内のREADME.mdを確認して、SQLファイルを順番に実行
4. エラーが発生した場合は、エラーメッセージを確認して対処

### フォルダ構成の利点

- **実行順序が明確**: フォルダ番号で実行順序が分かる
- **各フォルダにREADME**: 各フォルダ内のSQLファイルの説明がある
- **分類が明確**: 機能ごとに分類されているため、必要な部分だけ実行可能

### 実行例

```
1. sql/01-base-schema/ 内のファイルを順番に実行
2. sql/02-features/ 内のファイルを順番に実行
3. sql/03-columns/ 内のファイルを順番に実行
...（以下同様）
```

## 📝 チェックリスト

本番環境に適用する前に、以下を確認してください：

- [ ] バックアップを取得した
- [ ] Phase 1-6のSQLファイルを順番通りに実行する計画を立てた
- [ ] 開発環境でテストした
- [ ] エラーが発生した場合の対応方法を確認した
- [ ] 管理者アカウントの設定方法を確認した

## 🔗 関連ドキュメント

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - 環境分離の設定
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabaseの基本設定
