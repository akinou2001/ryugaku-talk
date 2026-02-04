# エラー修正ガイド

## 発生しているエラー

1. **"Failed to fetch"** - 新規登録・ログイン時に表示
2. **"column profiles_1.account_type does not exist"** - 投稿をクリックした時に表示

## 原因

データベースに`account_type`カラムが存在しないため、アプリケーションが正常に動作していません。

## 解決方法

### ステップ1: 不足しているカラムを追加

1. Supabaseダッシュボードを開く
2. 左サイドバーの「SQL Editor」をクリック
3. 「New query」をクリック
4. `fix-missing-columns.sql`ファイルの内容をすべてコピー
5. SQLエディタに貼り付け
6. 「Run」ボタンをクリック

**実行結果**:
- ✅ 成功: 「Success. No rows returned」と表示される
- ⚠️ 警告: 既にカラムが存在する場合はスキップされます（問題ありません）

### ステップ2: 環境変数の確認

`.env.local`ファイルが正しく設定されているか確認してください：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here
```

**確認ポイント**:
- 値の前後にスペースがないか
- 引用符（`"`や`'`）が含まれていないか
- すべての環境変数が設定されているか

### ステップ3: 開発サーバーの再起動

環境変数を変更した場合は、開発サーバーを再起動してください：

```bash
# 現在のサーバーを停止（Ctrl+C）
# その後、再起動
npm run dev
```

### ステップ4: 動作確認

1. ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス
2. 新規登録を試す
3. ログインを試す
4. 投稿をクリックして表示できるか確認

## トラブルシューティング

### エラー: "relation does not exist"

**原因**: 基本スキーマが実行されていない

**解決方法**:
1. `supabase-schema.sql`を実行
2. `fix-missing-columns.sql`を実行

### エラー: "Failed to fetch"

**原因**: 環境変数が正しく設定されていない、またはSupabaseへの接続に問題がある

**解決方法**:
1. `.env.local`ファイルを確認
2. Supabaseプロジェクトがアクティブか確認
3. 開発サーバーを再起動
4. ブラウザの開発者ツール（F12）のコンソールでエラーを確認

### エラー: "column does not exist"

**原因**: `fix-missing-columns.sql`が実行されていない

**解決方法**:
1. `fix-missing-columns.sql`を実行
2. 実行結果を確認
3. エラーが出た場合は、エラーメッセージを確認して対処

## 確認方法

### データベースのカラムを確認

1. Supabaseダッシュボードの「Table Editor」を開く
2. `profiles`テーブルを選択
3. 以下のカラムが存在することを確認：
   - ✅ `account_type`
   - ✅ `verification_status`
   - ✅ `is_admin`
   - ✅ `is_active`
   - ✅ `organization_name`（オプション）

### 環境変数を確認

ブラウザの開発者ツール（F12）のコンソールで以下を実行：

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

**注意**: これはクライアントサイドでのみ動作します。サーバーサイドでは環境変数が表示されません。

## 完了後の確認

以下の機能が正常に動作することを確認してください：

- [ ] 新規登録ができる
- [ ] ログインができる
- [ ] 投稿一覧が表示される
- [ ] 投稿をクリックして詳細が表示される
- [ ] プロフィールが表示される

すべてチェックが付いたら、問題は解決しています！




