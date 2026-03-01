# 開発環境 / 本番環境 分離ガイド

## 概要

RyugakuTalk では開発用と本番用で Supabase プロジェクトを分離し、安全な開発フローを実現している。

| 環境 | Supabase プロジェクト | 用途 |
|------|----------------------|------|
| dev  | `fujrsewwhmdfryinverw.supabase.co` | 開発・テスト |
| prod | `nsriudhbbkoxorrhyitd.supabase.co` | 本番 |

---

## 開発フロー

```
[1. 開発]        →  [2. テスト]       →  [3. PR/CI]         →  [4. マージ&デプロイ]
localhost           dev Supabase         GitHub Actions        Vercel + prod Supabase
+ dev DB            でテスト実行          CI自動テスト            マイグレーション自動適用
```

### 1. 開発 (localhost + dev Supabase)

```bash
# feature ブランチを切る
git checkout -b feature/xxx

# 開発サーバー起動 (.env.local → dev Supabase に接続)
npm run dev:local
```

### 2. DB スキーマ変更が必要な場合

```bash
# マイグレーションファイルを作成
npm run db:migration:new add_xxx_table

# SQL を記述後、dev DB に適用
npm run db:push:dev
```

マイグレーションファイルが唯一のソースとなり、dev/prod 両方に同じ SQL を適用できる。

### 3. テスト

```bash
# 型チェック + lint
npm run type-check && npm run lint

# ユニットテスト
npm test

# DB マイグレーション整合性テスト (dev ↔ prod スキーマ一致確認)
npm run test:migration

# E2E テスト
npm run test:e2e

# まとめて全部
npm run test:all
```

### 4. PR → CI → マージ → デプロイ

```bash
git push origin feature/xxx
# GitHub で PR 作成 → main へ
```

CI (GitHub Actions) が自動実行:
- lint + type-check + ユニットテスト
- DB マイグレーション整合性テスト (dev ↔ prod)
- ビルド確認
- E2E テスト

マージ後:
- Vercel が main ブランチを自動デプロイ
- `deploy-migrations.yml` が `supabase/migrations/**` の変更を検知し、本番 DB にマイグレーション自動適用

---

## 追加された npm スクリプト

| コマンド | 用途 |
|----------|------|
| `npm run db:push:dev` | dev DB にマイグレーション適用 |
| `npm run db:push:prod` | prod DB にマイグレーション適用 |
| `npm run db:link:dev` | dev プロジェクトにリンク |
| `npm run db:link:prod` | prod プロジェクトにリンク |
| `npm run test:migration` | dev/prod 両方のスキーマ整合性テスト |
| `npm run test:migration:dev` | dev のみテスト |
| `npm run test:migration:prod` | prod のみテスト |

---

## CI/CD ワークフロー

### test.yml (CI)

| ジョブ | トリガー | 内容 |
|--------|---------|------|
| `test` | push/PR to main, develop | lint → type-check → Jest → Codecov |
| `migration-integrity` | PR or push to main | dev/prod スキーマ一致検証 |
| `build` | push/PR to main, develop | `next build` 成功確認 |
| `e2e` | build 成功後 | Playwright 3ブラウザテスト |

### deploy-migrations.yml (CD)

| トリガー | 内容 |
|---------|------|
| main への push (`supabase/migrations/**` に変更あり) | Supabase CLI で本番 DB にマイグレーション自動適用 |

---

## GitHub Secrets

以下の Secrets がリポジトリに設定済み:

| Secret 名 | 用途 |
|-----------|------|
| `DEV_SUPABASE_URL` | CI: dev スキーマ検証 |
| `DEV_SUPABASE_SERVICE_ROLE_KEY` | CI: dev DB 読み取り |
| `PROD_SUPABASE_URL` | CI: prod スキーマ検証 |
| `PROD_SUPABASE_SERVICE_ROLE_KEY` | CI: prod DB 読み取り |
| `PROD_SUPABASE_PROJECT_REF` | CD: 本番プロジェクト参照 (`nsriudhbbkoxorrhyitd`) |
| `SUPABASE_ACCESS_TOKEN` | CD: Supabase CLI 認証 |

---

## テスト構成

### ユニット / コンポーネントテスト (Jest)

| ファイル | テスト内容 |
|----------|-----------|
| `src/components/__tests__/AccountBadge.test.tsx` | アカウント種別バッジ |
| `src/components/__tests__/MarkdownEditor.test.tsx` | マークダウンエディタ (10テスト) |
| `src/components/__tests__/StudentStatusBadge.test.tsx` | 学生ステータスバッジ |
| `src/components/__tests__/UserAvatar.test.tsx` | アバター表示・フォールバック |
| `src/app/posts/[id]/__tests__/page.test.tsx` | 投稿詳細ページ |
| `src/lib/__tests__/notifications.test.ts` | 通知作成・DM通知 |
| `src/lib/__tests__/storage.test.ts` | ファイルバリデーション |

カバレッジ閾値: 60% (branches, functions, lines, statements)

### DB マイグレーション整合性テスト (Jest)

`tests/db-migration-integrity.test.ts` で以下を検証:
- 28 テーブルの存在
- 6 関数、12 トリガー、4 ストレージバケット
- 全テーブルの RLS 有効確認
- posts (19カラム), profiles (33カラム) の型チェック
- UNIQUE制約 14個、CHECK制約、インデックス 19個
- dev ↔ prod クロス環境スキーマ一致

### E2E テスト (Playwright)

| ファイル | テスト内容 |
|----------|-----------|
| `e2e/auth.spec.ts` | ログイン/サインアップページアクセス |
| `e2e/posts.spec.ts` | タイムライン表示・投稿詳細・投稿作成フォーム |

ブラウザ: Chromium, Firefox, WebKit

---

## 環境設定ファイル

| ファイル | 用途 |
|---------|------|
| `.env.local` | 開発環境 (dev Supabase 接続) |
| `.env.test` | テスト環境 (dev/prod 両方の接続情報) |
| `.env.example` | テンプレート |

---

## 作業履歴

- 2025-02-27: dev/prod Supabase プロジェクト分離
- 2025-02-27: Supabase CLI マイグレーション基盤構築 (13マイグレーションファイル)
- 2025-02-27: DB マイグレーション整合性テスト作成
- 2025-02-27: 環境別スクリプト追加 (db:push:dev/prod, db:link:dev/prod, test:migration)
- 2025-02-27: CI に migration-integrity ジョブ追加
- 2025-02-27: CD ワークフロー作成 (deploy-migrations.yml)
- 2025-02-27: GitHub Secrets 設定 (6個)
- 2026-03-02: 管理者ダッシュボード UI リデザイン (recharts グラフ追加、サイドバーレイアウト、17コンポーネント分離)
- 2026-03-02: コミュニティ メンバー数表示の一貫性修正 (承認済みメンバーのみカウント、オーナー補正)
- 2026-03-02: 承認待ちメンバーの名前をプロフィールへのリンクに変更
- 2026-03-02: コミュニティ所有者移管の RLS 修正 (WITH CHECK (true) 追加 - migration 013)
- 2026-03-02: 所有者移管を管理者ユーザーのみに制限
- 2026-03-02: アカウント削除時のコミュニティ移管警告を全ユーザーに適用 (account_type チェック除去)
- 2026-03-02: community_members SELECT RLS 修正 - 承認済みメンバーも他メンバーを閲覧可能に (is_community_member 関数 - migration 014)
- 2026-03-02: メンバー一覧でオーナーに「所有者」ラベル表示
