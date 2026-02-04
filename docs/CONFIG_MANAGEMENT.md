# 設定ファイル管理ガイド

## 概要

アプリケーションの設定は `src/config/` ディレクトリで一元管理されています。設定を変更する場合は、対応するconfigファイルを編集するだけで、アプリ全体に反映されます。

## 設定ファイル一覧

### 1. `app-icons.ts` - アプリアイコン設定
アプリアイコンのパスを管理します。

**使用箇所:**
- ヘッダーのロゴ
- フッターのロゴ
- ヒーローセクションのロゴ
- Favicon

**変更方法:**
```typescript
export const APP_ICONS = {
  main: `${ICON_BASE_PATH}/新しいアイコン名.svg`,
  hero: `${ICON_BASE_PATH}/新しいアイコン名.svg`,
  favicon: '/icon.svg',
}
```

詳細は `docs/APP_ICON_MANAGEMENT.md` を参照してください。

---

### 2. `app-config.ts` - アプリケーション基本設定
アプリケーション名、説明、キャッチコピーなどの基本情報を管理します。

**管理項目:**
- `APP_NAME` - アプリケーション名
- `APP_SHORT_NAME` - 短縮名
- `APP_DESCRIPTION` - 詳細な説明文
- `APP_DESCRIPTION_SHORT` - 短い説明文（キャッチコピー）
- `APP_SUBTITLE` - サブタイトル
- `DEFAULT_TITLE` - デフォルトのページタイトル
- `COPYRIGHT_TEXT` - 著作権表示

**使用箇所:**
- メタデータ（layout.tsx）
- ヒーローセクション
- フッター
- その他の表示箇所

---

### 3. `site-config.ts` - サイト設定
URL、ドメイン、SEO関連の設定を管理します。

**管理項目:**
- `SITE_URL` - サイトのベースURL（環境変数 `NEXT_PUBLIC_SITE_URL` から取得可能）
- `SITE_DOMAIN` - サイトのドメイン
- `SITE_LOCALE` - サイトのロケール
- `SEO_KEYWORDS` - SEOキーワード配列
- `OG_IMAGE` - OG画像の設定
- `APPLE_ICON` - Apple Touch Iconの設定
- `FAVICON` - Faviconの設定
- `SITEMAP_CONFIG` - サイトマップの設定
- `ROBOTS_CONFIG` - Robots.txtの設定

**使用箇所:**
- メタデータ（layout.tsx）
- サイトマップ（sitemap.ts）
- Robots.txt（robots.ts）
- SEO関連の全箇所

**環境変数の設定:**
```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://ryugakutalk.com
```

---

### 4. `social-config.ts` - ソーシャルメディア・連絡先設定
SNSアカウント、連絡先情報を管理します。

**管理項目:**
- `CONTACT_EMAIL` - 連絡先メールアドレス
- `TWITTER` - Twitter設定（ハンドル、URL、カードタイプ）
- `SOCIAL_LINKS` - 各SNSのURL
- `CONTACT_INFO` - その他の連絡先情報

**使用箇所:**
- フッターの連絡先リンク
- メタデータのTwitter設定
- その他のSNSリンク

**追加方法:**
```typescript
export const SOCIAL_LINKS = {
  twitter: TWITTER.url,
  facebook: 'https://facebook.com/ryugakutalk',
  instagram: 'https://instagram.com/ryugakutalk',
  // ...
}
```

---

### 5. `theme-config.ts` - テーマ設定
カラー、テーマカラー、PWA設定などを管理します。

**管理項目:**
- `THEME_COLORS` - テーマカラー（プライマリカラーなど）
- `PWA_CONFIG` - PWA設定（背景色、テーマカラーなど）
- `EARTH_GRADIENT` - 地球風グラデーション設定

**使用箇所:**
- PWA設定（manifest.json）
- カラー設定（必要に応じて）

---

## 設定の変更手順

### 1. アプリケーション名を変更する場合

`src/config/app-config.ts` を編集：
```typescript
export const APP_NAME = '新しいアプリ名'
```

これで、ヘッダー、フッター、メタデータなど、すべての箇所に反映されます。

### 2. サイトURLを変更する場合

`src/config/site-config.ts` を編集：
```typescript
export const SITE_URL = 'https://新しいドメイン.com'
```

または、環境変数を設定：
```bash
NEXT_PUBLIC_SITE_URL=https://新しいドメイン.com
```

### 3. 連絡先メールアドレスを変更する場合

`src/config/social-config.ts` を編集：
```typescript
export const CONTACT_EMAIL = '新しいメールアドレス@example.com'
```

### 4. SEOキーワードを追加・変更する場合

`src/config/site-config.ts` を編集：
```typescript
export const SEO_KEYWORDS = [
  '留学',
  '新しいキーワード',
  // ...
] as const
```

### 5. SNSアカウントを追加する場合

`src/config/social-config.ts` を編集：
```typescript
export const SOCIAL_LINKS = {
  twitter: TWITTER.url,
  facebook: 'https://facebook.com/ryugakutalk',
  // 新しいSNSを追加
}
```

そして、`src/components/Footer.tsx` などで使用します。

---

## 注意事項

1. **環境変数の使用**
   - 本番環境と開発環境で異なる値が必要な場合は、環境変数を使用してください
   - 例: `process.env.NEXT_PUBLIC_SITE_URL || 'https://ryugakutalk.com'`

2. **型安全性**
   - 設定値は `as const` を使用して型安全にしています
   - 配列は `as const` を付けることで、読み取り専用のタプル型になります

3. **manifest.jsonの更新**
   - `public/manifest.json` は手動で更新する必要があります
   - `app-config.ts` や `theme-config.ts` の値を参照して更新してください

4. **キャッシュのクリア**
   - 設定を変更した後、ブラウザのキャッシュをクリアするか、ハードリロードが必要な場合があります

---

## 設定ファイルの構造

```
src/config/
├── app-icons.ts      # アプリアイコン設定
├── app-config.ts     # アプリケーション基本設定
├── site-config.ts    # サイト設定（URL、SEO）
├── social-config.ts  # ソーシャルメディア・連絡先設定
└── theme-config.ts  # テーマ設定（カラー、PWA）
```

各ファイルは独立しており、必要に応じて個別にインポートできます。
