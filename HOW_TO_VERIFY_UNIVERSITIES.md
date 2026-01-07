# 大学データの確認方法

データベースにインポートされた大学データを確認する方法をいくつか紹介します。

## 方法1: コマンドラインで簡単に確認（推奨）

最も簡単な方法です。以下のコマンドを実行してください：

```bash
npm run quick-check
```

または、詳細な確認：

```bash
npm run verify-universities
```

## 方法2: Supabaseダッシュボードで確認

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. 左メニューから「Table Editor」をクリック
4. `universities` テーブルを選択
5. テーブルの下部に件数が表示されます

### SQLエディタで確認

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 以下のクエリを実行：

```sql
-- 総件数を確認
SELECT COUNT(*) as total_count FROM universities;

-- 国別の件数（上位10カ国）
SELECT 
  country_code, 
  COUNT(*) as count
FROM universities
GROUP BY country_code
ORDER BY count DESC
LIMIT 10;

-- 大陸別の件数
SELECT 
  c.name_en as continent,
  COUNT(*) as count
FROM universities u
JOIN continents c ON u.continent_id = c.id
GROUP BY c.name_en
ORDER BY count DESC;
```

## 方法3: 管理画面で確認

アプリケーションの管理画面から確認できます：

1. アプリケーションにログイン
2. `/admin` ページにアクセス
3. 「大学管理」タブをクリック
4. 大学一覧が表示されます（検索・フィルター機能も使用可能）

## 方法4: アプリケーション内で確認

### プロフィール編集画面
1. プロフィール編集画面（`/profile/[id]/edit`）にアクセス
2. 「所属大学」の検索フィールドで大学を検索
3. 検索結果に多数の大学が表示されることを確認

### 投稿作成画面
1. 投稿作成画面（`/posts/new`）にアクセス
2. 「大学」の検索フィールドで大学を検索
3. 検索結果に多数の大学が表示されることを確認

### タイムライン・日記のフィルター
1. タイムライン（`/timeline`）または日記（`/diary`）にアクセス
2. 大学フィルターで大学を検索
3. 検索結果に多数の大学が表示されることを確認

## 期待される結果

正常にインポートされている場合：
- **総件数**: 約10,000件以上
- **重複**: なし（ユニーク制約により保証）
- **国別**: 200カ国以上
- **大陸別**: 6大陸すべてにデータが存在

## トラブルシューティング

### 件数が少ない場合

1. インポートスクリプトを再実行：
   ```bash
   npm run import-universities
   ```
   （重複は自動的にスキップされます）

2. エラーログを確認：
   - 大陸マッピングなしの国がスキップされている可能性があります
   - スクリプトの実行結果を確認してください

### データが表示されない場合

1. データベース接続を確認
2. RLS（Row Level Security）ポリシーを確認
3. ブラウザのキャッシュをクリア

## 詳細な確認スクリプト

より詳細な情報が必要な場合：

```bash
# 詳細な統計情報を表示
npm run verify-universities

# データベースの状態を確認
npm run check-universities
```

