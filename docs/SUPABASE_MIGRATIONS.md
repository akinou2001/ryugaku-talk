# Supabase マイグレーション運用（dev / prod 共通）

## 方針

- **Supabase プロジェクト**: dev と prod の2つに分ける
- **DB変更**: SQL Editor での手流しはやめ、**マイグレーション（番号付きSQLのGit管理）** で行う
- **リポジトリ**: 1つのまま。main＝本番、develop/feature＝開発

## セットアップ（初回）

### 1. Supabase CLI

```bash
npm install
npx supabase --version
```

### 2. リモートプロジェクトとリンク

**開発用プロジェクト:**

```bash
npx supabase link --project-ref YOUR_DEV_PROJECT_REF
# 対話で DB パスワードを入力
```

**本番用プロジェクト（本番に push するときだけ）:**

```bash
npx supabase link --project-ref YOUR_PROD_PROJECT_REF
```

`supabase/.temp/project-ref` に現在リンクしているプロジェクトが保存されます。切り替えるたびに `supabase link` を実行します。

### 3. 環境変数

- 開発: `.env.local` または `.env.development` に dev プロジェクトの `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- 本番: `.env.production` に prod プロジェクトの同じ3つ

`.env.example` をコピーして各環境用に編集してください。

## 日常の運用

### マイグレーションを適用する（dev / prod どちらにも同じ手順）

1. 適用先のプロジェクトをリンクする（上記 `supabase link`）
2. 未適用のマイグレーションを流す:

```bash
npm run db:push
```

- **dev**: 開発用 Supabase に適用
- **prod**: 本番用 Supabase に適用（本番は `supabase link` で prod を指定した状態で実行）

### 新しい変更をマイグレーションとして追加する

1. 新しいマイグレーションファイルを作成:

```bash
npm run db:migration:new add_xxx_column
```

2. `supabase/migrations/` に `YYYYMMDDHHMMSS_add_xxx_column.sql` ができるので、中に SQL を書く
3. 開発DBで確認:

```bash
npx supabase link --project-ref YOUR_DEV_PROJECT_REF
npm run db:push
```

4. 問題なければ Git にコミット。本番には後から同じ `db:push` で適用

### 本番DBをマイグレーションから作り直す（データなしの場合のみ）

本番が空でよい場合:

1. Supabase Dashboard の本番プロジェクトで「Database」→「Reset database」などでリセット
2. ローカルで本番をリンクして一括適用:

```bash
npx supabase link --project-ref YOUR_PROD_PROJECT_REF
npm run db:push
```

これで「本番に手でSQLを流す」運用をやめられます。

## マイグレーション一覧（現在）

| ファイル | 内容 |
|----------|------|
| `20250227000000_initial_schema.sql` | ベース・大学・組織・管理者 |
| `20250227000001_community_schema.sql` | コミュニティ関連テーブル・RLS |
| `20250227000002_features_and_columns.sql` | 機能・カラム追加（通知、クエスト、AI等） |
| `20250227000003_storage.sql` | Storage バケット・ポリシー |
| `20250227000004_rls_fixes.sql` | RLS 無限再帰回避（is_admin_user） |
| `20250227000005_triggers.sql` | いいね数トリガー修正 |
| `20250227000006_constraints.sql` | universities ユニーク制約 |

既存の `sql/` フォルダは「手流し用」の参照用として残しています。**今後のスキーマ変更は `supabase/migrations/` に番号付きで追加**し、dev/prod の両方で `db:push` だけで揃えます。

## 参考

- [Supabase CLI - Local development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase - Managing migrations](https://supabase.com/docs/guides/cli/managing-environments)
