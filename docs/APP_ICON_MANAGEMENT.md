# アプリアイコン管理ガイド

## 概要

アプリアイコンは一元管理されており、`src/config/app-icons.ts` ファイルで設定を変更するだけで、アプリ全体に反映されます。

## アプリアイコンの使用箇所

以下の箇所でアプリアイコンが使用されています：

1. **ヘッダーのロゴ** (`src/components/Header.tsx`)
   - `APP_ICONS.main` を使用

2. **フッターのロゴ** (`src/components/Footer.tsx`)
   - `APP_ICONS.main` を使用

3. **ヒーローセクションのロゴ** (`src/components/Hero.tsx`)
   - `APP_ICONS.hero` を使用

4. **Favicon** (`src/app/icon.svg` および `src/app/layout.tsx`)
   - `APP_ICONS.favicon` を使用

5. **Manifest.json** (`public/manifest.json`)
   - 手動で更新が必要（必要に応じて）

## アプリアイコンを変更する手順

### 1. 新しいSVGファイルを配置

新しいアプリアイコンのSVGファイルを `public/icon/` ディレクトリに配置します。

### 2. 設定ファイルを更新

`src/config/app-icons.ts` ファイルを開き、`APP_ICONS` オブジェクト内のパスを更新します。

```typescript
export const APP_ICONS = {
  // メインアプリアイコン（ヘッダー、フッターなど通常の表示用）
  main: `${ICON_BASE_PATH}/新しいアイコン名.svg`,
  
  // ヒーローセクション用（ランディングページの大きな表示用）
  hero: `${ICON_BASE_PATH}/新しいアイコン名.svg`,
  
  // Favicon用（ブラウザタブに表示）
  favicon: '/icon.svg',
}
```

### 3. Faviconを更新（必要な場合）

Faviconを更新する場合は、`src/app/icon.svg` の内容を新しいアイコンの内容に置き換えます。

### 4. Manifest.jsonを更新（必要な場合）

PWAのアイコンを更新する場合は、`public/manifest.json` の `icons[0].src` も更新します。

```json
{
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

## 現在の設定

現在のアプリアイコンの設定は以下の通りです：

- **メインアイコン**: `/icon/icon_o.svg`
- **ヒーローアイコン**: `/icon/icon_n.svg`
- **Favicon**: `/icon.svg` (Next.jsの `src/app/icon.svg`)

## 注意事項

- アイコンファイルは `public/icon/` ディレクトリに配置してください
- SVGファイルは最適化されていることを推奨します
- Faviconは `src/app/icon.svg` として配置する必要があります（Next.jsの規約）
- 変更後はブラウザのキャッシュをクリアするか、ハードリロードが必要な場合があります
