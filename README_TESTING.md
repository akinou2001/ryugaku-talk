# テスト実行ガイド

このプロジェクトには包括的なテスト環境が構築されています。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Playwrightブラウザのインストール（E2Eテスト用）

E2Eテストを実行する前に、Playwrightのブラウザをインストールする必要があります：

```bash
npm run test:e2e:install
```

または

```bash
npx playwright install
```

## テストの実行

### ユニットテスト

```bash
# すべてのユニットテストを実行
npm run test

# ウォッチモードで実行（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

### E2Eテスト

```bash
# E2Eテストを実行
npm run test:e2e
```

**注意**: E2Eテストを実行する前に、開発サーバーが起動している必要はありません。Playwrightが自動的にサーバーを起動します。

### すべてのテストを実行

```bash
# 型チェック、リント、ユニットテスト、E2Eテストを順番に実行
npm run test:all
```

## テスト構成

### ユニットテスト

- **フレームワーク**: Jest + React Testing Library
- **設定ファイル**: `jest.config.js`, `jest.setup.js`
- **テストファイル**: `src/**/__tests__/**/*.test.{ts,tsx}`

### E2Eテスト

- **フレームワーク**: Playwright
- **設定ファイル**: `playwright.config.ts`
- **テストファイル**: `e2e/**/*.spec.ts`

## テストカバレッジ

カバレッジレポートを生成するには：

```bash
npm run test:coverage
```

レポートは `coverage/` ディレクトリに生成されます。

## トラブルシューティング

### Playwrightのブラウザが見つからない

```bash
npm run test:e2e:install
```

### テストがタイムアウトする

`jest.config.js` または `playwright.config.ts` のタイムアウト設定を確認してください。

### 環境変数が設定されていない

```bash
npm run check-env
```

環境変数の設定を確認できます。

## CI/CD

GitHub Actionsで自動的にテストが実行されます。ワークフローファイルは `.github/workflows/test.yml` にあります。

