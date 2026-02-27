# Phase 1: ベーススキーマ

基本的なテーブル構造を作成するSQLファイルです。**必ず最初に実行**してください。

## 📋 実行順序

以下の順序で実行してください：

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
   - 既存のスキーマファイルで不足している部分を補完

## ⚠️ 注意事項

- このPhaseは**必ず最初に実行**してください
- 他のPhaseはこのPhaseの完了後に実行してください
- エラーが発生した場合は、そのSQLファイルの内容を確認してください
