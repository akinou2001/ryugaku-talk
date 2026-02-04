# Supabase Dashboard での組織認証ガイド

## 📋 認証フロー概要

このシステムでは、**Supabase Dashboardだけで認証を完結**できます。

```
申請（フロント） → 管理者確認（Supabase Dashboard） → 承認（自動更新）
```

## ① 組織認証申請（フロントエンド）

### 申請フォームへのアクセス
1. 組織アカウントでログイン
2. プロフィールページにアクセス
3. 「認証申請をする」ボタンをクリック
4. または `/verification/request` に直接アクセス

### 申請フォームの入力項目
- **組織名**（必須）
- **公式メールアドレス**（必須）
- **ウェブサイトURL**（任意）
- **申請理由・メッセージ**（任意）

### 申請データの保存
申請データは `organization_verification_requests` テーブルに保存されます。

## ② 管理者の作業（Supabase Dashboard）

### ステップ1: Supabase Dashboardにログイン
1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. 左サイドバーから「Table Editor」をクリック

### ステップ2: 認証申請を確認
1. `organization_verification_requests` テーブルを開く
2. `status = 'pending'` の行を確認
3. 以下の情報を確認：
   - `organization_name`: 組織名
   - `contact_person_email`: 公式メールアドレス
   - `organization_url`: ウェブサイトURL
   - `request_reason`: 申請理由
   - `created_at`: 申請日時

### ステップ3: 認証を承認または拒否

#### 承認する場合
1. 該当する行をクリックして編集モードに入る
2. `status` フィールドを `'approved'` に変更
3. （任意）`review_notes` に審査メモを入力
4. 「Save」をクリック

**自動処理**:
- トリガーが自動的に `profiles` テーブルの `verification_status` を `'verified'` に更新します
- ユーザーは次回ログイン時に認証済み状態になります

#### 拒否する場合
1. 該当する行をクリックして編集モードに入る
2. `status` フィールドを `'rejected'` に変更
3. `review_notes` に拒否理由を入力（推奨）
4. 「Save」をクリック

**自動処理**:
- トリガーが自動的に `profiles` テーブルの `verification_status` を `'rejected'` に更新します

## ③ 自動更新の仕組み

### トリガーの設定
`supabase-trigger-verification.sql` を実行すると、以下のトリガーが作成されます：

```sql
-- organization_verification_requests の status が変更されたときに
-- profiles テーブルを自動更新するトリガー
```

### トリガーの動作
- `status` が `'approved'` に変更された場合：
  - `profiles.verification_status` → `'verified'` に更新
- `status` が `'rejected'` に変更された場合：
  - `profiles.verification_status` → `'rejected'` に更新

### トリガーの設定方法
1. Supabase Dashboard → 「SQL Editor」を開く
2. `supabase-trigger-verification.sql` の内容をコピー
3. SQL Editorに貼り付けて実行

## ④ 認証状態の確認

### フロントエンドでの表示
認証状態に応じて、以下のように表示されます：

- **`unverified`（未認証）**: 「認証申請が必要です」メッセージと申請ボタン
- **`pending`（審査中）**: 「認証審査中」メッセージ
- **`verified`（認証済み）**: 「認証済み」バッジ、組織用機能が利用可能
- **`rejected`（拒否）**: 「認証が拒否されました」メッセージと再申請ボタン

### 認証済み組織アカウントの機能
- コミュニティ作成
- 公式投稿の作成
- その他の組織用機能

## 🔍 トラブルシューティング

### トリガーが動作しない場合
1. SQL Editorで以下を実行してトリガーを確認：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_profile_verification_status';
   ```
2. トリガーが存在しない場合は、`supabase-trigger-verification.sql` を再実行

### 認証状態が更新されない場合
1. `organization_verification_requests` テーブルで `status` が正しく更新されているか確認
2. `profiles` テーブルで `verification_status` を直接確認
3. トリガーのログを確認（Supabase Dashboard → Logs）

### RLSポリシーの確認
管理者がSupabase Dashboardから直接操作できるように、RLSポリシーで `status` の変更を制限していません。

## 📝 注意事項

1. **認証は慎重に行う**
   - 組織アカウントは重要な機能が利用可能になるため、慎重に審査してください

2. **審査メモを記録する**
   - `review_notes` フィールドに審査メモを記録しておくと、後で確認できます

3. **定期的に確認する**
   - 認証待ちの申請がないか定期的に確認してください
   - 通常1-3営業日以内に審査を完了することを推奨します

4. **トリガーの設定**
   - 初回セットアップ時に必ず `supabase-trigger-verification.sql` を実行してください
   - トリガーがないと、手動で `profiles` テーブルを更新する必要があります


