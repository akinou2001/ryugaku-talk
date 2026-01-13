# channel-attachmentsバケットの確認手順

## 問題: 写真のアップロードができない

以下の手順でバケットの設定を確認してください。

## 1. バケットの存在確認

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. 左サイドバーの「Storage」をクリック
4. バケット一覧に`channel-attachments`が表示されているか確認

**表示されていない場合**: バケットを作成してください（下記参照）

## 2. バケットの公開設定確認

1. `channel-attachments`バケットをクリック
2. 「Settings」タブをクリック
3. 「Public bucket」が**ON**になっているか確認

**OFFの場合**: スイッチをONにしてください

## 3. RLSポリシーの確認と設定

### 方法A: SQLで一括設定（推奨・簡単）

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `setup-channel-attachments-complete.sql`ファイルの内容をコピー
3. SQLエディタに貼り付けて実行

これで、バケットの作成とRLSポリシーの設定が一度に完了します。

### 方法B: 既存バケットにRLSポリシーのみ設定

バケットは既に存在するが、RLSポリシーが設定されていない場合：

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `setup-channel-attachments-rls-policies.sql`ファイルの内容をコピー
3. SQLエディタに貼り付けて実行

### 方法C: ダッシュボードから手動設定

1. `channel-attachments`バケットをクリック
2. 「Policies」タブをクリック
3. 「New Policy」をクリック
4. 以下の3つのポリシーを作成：

#### ポリシー1: INSERT（アップロード）
- **Policy name**: `認証済みユーザーはチャンネルファイルをアップロード可能`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'channel-attachments'
```

#### ポリシー2: SELECT（閲覧）
- **Policy name**: `認証済みユーザーはチャンネルファイルを閲覧可能`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'channel-attachments'
```

#### ポリシー3: DELETE（削除）
- **Policy name**: `認証済みユーザーはチャンネルファイルを削除可能`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'channel-attachments'
```

### ポリシーの確認

設定後、以下の方法で確認できます：

1. バケットの「Policies」タブで3つのポリシーが表示されているか確認
2. SQL Editorで以下を実行して確認：
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%チャンネルファイル%';
```

## 4. バケットが存在しない場合の作成方法

### 方法A: ダッシュボードから作成（推奨）

1. Storageページで「Create bucket」をクリック
2. 以下の情報を入力：
   - **Name**: `channel-attachments`
   - **Public bucket**: ✅ **チェックを入れる**
3. 「Create bucket」をクリック
4. 上記のRLSポリシーを設定

### 方法B: SQLで作成

Supabaseダッシュボードの「SQL Editor」で以下を実行：

```sql
-- バケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-attachments', 'channel-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシーを設定
CREATE POLICY IF NOT EXISTS "認証済みユーザーはチャンネルファイルをアップロード可能"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'channel-attachments');

CREATE POLICY IF NOT EXISTS "認証済みユーザーはチャンネルファイルを閲覧可能"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'channel-attachments');

CREATE POLICY IF NOT EXISTS "認証済みユーザーはチャンネルファイルを削除可能"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'channel-attachments');
```

## 5. デバッグ方法

### ブラウザのコンソールを確認

1. ブラウザの開発者ツールを開く（F12）
2. 「Console」タブを選択
3. ファイルをアップロードしようとする
4. エラーメッセージを確認

### 確認すべきログ

以下のログが表示されるはずです：
- `ファイルアップロード開始:` - ファイル情報
- `ファイル検証:` - 各ファイルの検証結果
- `バケット: channel-attachments にアップロード開始` - アップロード開始
- `ファイルアップロード成功:` - 成功時の情報
- エラーがある場合は詳細なエラーメッセージ

### よくあるエラーと対処法

#### エラー: "Bucket not found"
→ バケットが存在しないか、名前が間違っています。上記の手順でバケットを作成してください。

#### エラー: "new row violates row-level security policy"
→ RLSポリシーが正しく設定されていません。上記の手順でポリシーを設定してください。

#### エラー: "The resource already exists"
→ 同じファイル名のファイルが既に存在します。これは通常問題ありませんが、エラーとして表示される場合があります。

#### エラー: "ファイル形式がサポートされていません"
→ ファイルタイプが`FILE_TYPES.EVENT_ATTACHMENTS`に含まれていません。画像ファイル（JPEG, PNG, GIF, WebP）はサポートされています。

## 6. 一時的な回避策

バケットの設定が完了するまで、既存の`event-attachments`バケットを使用することもできます：

`src/app/communities/[id]/page.tsx`の899行目を：
```typescript
attachments = await uploadFiles(channelMessageFiles, 'event-attachments', `channel-${selectedChannelId}`)
```
に変更してください。

