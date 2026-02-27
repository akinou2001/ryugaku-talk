# Phase 4: ストレージ設定

ファイル添付機能とストレージ設定です。Phase 3の完了後に実行してください。

## 📋 実行順序

以下の順序で実行してください：

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

## ⚠️ 注意事項

- Phase 3の完了後に実行してください
- ストレージバケットの作成には適切な権限が必要です
