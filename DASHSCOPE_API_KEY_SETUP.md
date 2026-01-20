# DashScope APIキー設定ガイド

## エラー: "DASHSCOPE_API_KEYが正しく設定されていません"

このエラーが発生する場合、以下の手順を確認してください。

## 1. `.env.local`ファイルの場所を確認

`.env.local`ファイルは**プロジェクトのルートディレクトリ**（`package.json`がある場所）に配置する必要があります。

```
RyugakuTalk/
├── package.json
├── .env.local          ← ここに配置
├── next.config.js
└── src/
```

## 2. `.env.local`ファイルの形式を確認

### ✅ 正しい形式

```env
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ❌ 間違った形式（よくある間違い）

```env
# 引用符で囲んでいる（不要）
DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 余分なスペースがある
DASHSCOPE_API_KEY = sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# プレースホルダーが残っている
DASHSCOPE_API_KEY=your_dashscope_api_key

# 改行が含まれている
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
（余分な改行）
```

## 3. 開発サーバーの再起動

環境変数を変更した後は、**必ず開発サーバーを再起動**してください。

```bash
# 1. 現在のサーバーを停止（Ctrl+C）
# 2. 再起動
npm run dev
```

## 4. デバッグ方法

サーバー側のコンソールログで、環境変数が正しく読み込まれているか確認できます。

エラーが発生した際に、サーバー側のログに以下のような情報が表示されます：

```
[DEBUG] DASHSCOPE_API_KEY check: {
  exists: true/false,
  length: 数字,
  startsWith: "sk-" or "N/A",
  hasPlaceholder: true/false
}
```

## 5. よくある問題と解決方法

### 問題1: 環境変数が読み込まれない

**原因**: 開発サーバーが再起動されていない

**解決方法**: 
1. 開発サーバーを停止（Ctrl+C）
2. `npm run dev`で再起動

### 問題2: プレースホルダーが残っている

**原因**: `.env.local`ファイルで`your_dashscope_api_key`が置き換えられていない

**解決方法**: 
- `.env.local`ファイルを開き、`your_dashscope_api_key`を実際のAPIキーに置き換える

### 問題3: 引用符やスペースが含まれている

**原因**: APIキーの前後に引用符やスペースがある

**解決方法**: 
- 引用符を削除
- 前後のスペースを削除
- `DASHSCOPE_API_KEY=sk-xxxxxxxx` の形式にする

### 問題4: ファイルの場所が間違っている

**原因**: `.env.local`がプロジェクトルートにない

**解決方法**: 
- `package.json`と同じディレクトリに`.env.local`を配置

## 6. DashScope APIキーの取得方法

1. [DashScopeコンソール](https://dashscope.console.aliyun.com/)にアクセス
2. アカウントを作成またはログイン
3. 「API-KEY管理」からAPIキーを生成
4. 生成されたAPIキーをコピー（`sk-`で始まる形式）

## 7. 確認チェックリスト

- [ ] `.env.local`ファイルがプロジェクトルートにある
- [ ] `DASHSCOPE_API_KEY=sk-xxxxxxxx`の形式で記述されている
- [ ] 引用符で囲んでいない
- [ ] 前後にスペースがない
- [ ] プレースホルダー（`your_dashscope_api_key`）が残っていない
- [ ] 開発サーバーを再起動した

## 8. それでも解決しない場合

サーバー側のコンソールログを確認し、`[DEBUG] DASHSCOPE_API_KEY check:`の出力を確認してください。

- `exists: false` → 環境変数が読み込まれていない
- `hasPlaceholder: true` → プレースホルダーが残っている
- `length: 0` → APIキーが空

これらの情報を元に、問題を特定してください。

