# Vercelエラー修正ガイド

## 🔴 エラー内容

```
This Serverless Function has crashed.
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

## 🔍 原因の特定

このエラーは通常、以下の原因で発生します：

1. **環境変数が設定されていない**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Supabase接続エラー**
   - 無効なURLまたはキー
   - ネットワークエラー

3. **サーバーサイドでのエラー**
   - 未処理の例外
   - 型エラー

## ✅ 修正手順

### ステップ1: Vercelの環境変数を確認

1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数が設定されているか確認：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
```

### ステップ2: 環境変数の値を確認

- Supabaseダッシュボードで正しい値を取得
- コピー&ペーストで設定（スペースや改行がないか確認）

### ステップ3: 再デプロイ

1. Vercelダッシュボードで「Deployments」タブを開く
2. 最新のデプロイメントを選択
3. 「Redeploy」をクリック

### ステップ4: ログを確認

1. Vercelダッシュボードで「Functions」タブを開く
2. エラーが発生した関数を選択
3. 「Logs」タブでエラーログを確認

## 🛠️ コード側の修正

以下の修正を実施しました：

1. **環境変数の検証を強化**
   - サーバーサイドとクライアントサイドで適切にエラーハンドリング

2. **エラーハンドリングの改善**
   - try-catchブロックの追加
   - エラーログの出力

3. **Supabaseクライアントの初期化**
   - 環境変数が未設定でもクラッシュしないように修正

## 📝 チェックリスト

- [ ] Vercelの環境変数が設定されている
- [ ] 環境変数の値が正しい
- [ ] 再デプロイを実行した
- [ ] ログでエラー内容を確認した

## 🔧 追加のトラブルシューティング

### エラーが続く場合

1. **ログを確認**
   ```bash
   vercel logs
   ```

2. **ローカルでテスト**
   ```bash
   npm run build
   npm run start
   ```

3. **環境変数を再設定**
   - 一度削除して再追加
   - 値にスペースや特殊文字がないか確認

## 📞 サポート

問題が解決しない場合は、Vercelのログを確認してエラーメッセージを共有してください。
