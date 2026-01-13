# Supabase Storage バケット設定ガイド

## 問題
チャンネルメッセージでファイルをアップロードする際に「Bucket not found」エラーが発生します。

## 解決方法

### ステップ1: SupabaseダッシュボードでStorageを開く
1. [Supabaseダッシュボード](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. 左サイドバーの「Storage」をクリック

### ステップ2: バケットを作成
1. 「Create bucket」ボタンをクリック
2. 以下の情報を入力：
   - **Name**: `channel-attachments`
   - **Public bucket**: ✅ **チェックを入れる**（公開バケットとして設定）
3. 「Create bucket」をクリック

### ステップ3: バケットポリシーを設定
バケットを作成したら、RLSポリシーを設定する必要があります。

#### 方法1: Supabaseダッシュボードから設定
1. 作成した`channel-attachments`バケットをクリック
2. 「Policies」タブをクリック
3. 「New Policy」をクリック
4. 以下のポリシーを追加：

**ポリシー1: 認証済みユーザーはファイルをアップロード可能**
- Policy name: `認証済みユーザーはアップロード可能`
- Allowed operation: `INSERT`
- Policy definition:
```sql
bucket_id = 'channel-attachments' AND auth.role() = 'authenticated'
```

**ポリシー2: 認証済みユーザーはファイルを閲覧可能**
- Policy name: `認証済みユーザーは閲覧可能`
- Allowed operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'channel-attachments' AND auth.role() = 'authenticated'
```

**ポリシー3: 認証済みユーザーは自分のファイルを削除可能**
- Policy name: `認証済みユーザーは削除可能`
- Allowed operation: `DELETE`
- Policy definition:
```sql
bucket_id = 'channel-attachments' AND auth.role() = 'authenticated'
```

#### 方法2: SQLエディタから設定
Supabaseダッシュボードの「SQL Editor」で以下を実行：

```sql
-- バケットポリシーを設定
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-attachments', 'channel-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシーを設定
CREATE POLICY "認証済みユーザーはアップロード可能"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'channel-attachments');

CREATE POLICY "認証済みユーザーは閲覧可能"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'channel-attachments');

CREATE POLICY "認証済みユーザーは削除可能"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'channel-attachments');
```

### ステップ4: 動作確認
1. アプリケーションでチャンネルメッセージにファイルを添付
2. ファイルが正常にアップロードされることを確認

## 既存のバケットを使用する場合

もし既に他のバケット（例: `event-attachments`、`post-images`など）が存在する場合は、それを使用することもできます。

その場合は、`src/app/communities/[id]/page.tsx`の以下の行を変更：

```typescript
// 変更前
attachments = await uploadFiles(channelMessageFiles, 'channel-attachments', `channel-${selectedChannelId}`)

// 変更後（既存のバケット名に変更）
attachments = await uploadFiles(channelMessageFiles, '既存のバケット名', `channel-${selectedChannelId}`)
```

## トラブルシューティング

### エラー: "new row violates row-level security policy"
→ バケットのRLSポリシーが正しく設定されていない可能性があります。上記のポリシー設定を確認してください。

### エラー: "Bucket is not public"
→ バケットが公開設定になっていない可能性があります。バケット設定で「Public bucket」にチェックを入れてください。

### ファイルサイズ制限
→ Supabaseの無料プランでは、ファイルサイズに制限があります。大きなファイルをアップロードする場合は、Supabaseの設定を確認してください。

