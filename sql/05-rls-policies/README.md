# Phase 5: RLSポリシー修正

セキュリティポリシーの修正と改善です。Phase 4の完了後に実行してください。

## 📋 実行順序

以下の順序で実行してください：

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

## ⚠️ 注意事項

- Phase 4の完了後に実行してください
- RLSポリシーはセキュリティに関わるため、慎重に実行してください
