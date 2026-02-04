/**
 * アプリアイコンの設定
 * 
 * 【重要】アプリアイコンを変更する場合の手順：
 * 1. 新しいSVGファイルを `public/icon/` ディレクトリに配置
 * 2. このファイルの `APP_ICONS` オブジェクト内のパスを更新
 * 3. faviconを更新する場合は、`src/app/icon.svg` も新しいアイコンの内容に置き換える
 * 4. `public/manifest.json` の `icons[0].src` も更新（必要に応じて）
 * 
 * これだけで、ヘッダー、フッター、ヒーローセクション、faviconなど
 * すべての箇所に自動的に反映されます。
 */

import { APP_NAME } from './app-config'

// アプリアイコンのベースパス
const ICON_BASE_PATH = '/icon'

/**
 * アプリアイコンの種類
 * 用途に応じて異なるアイコンを使用できます
 * 
 * 新しいアプリアイコンを使用する場合は、以下のパスを更新してください。
 * 例: main: `${ICON_BASE_PATH}/新しいアイコン名.svg`
 */
export const APP_ICONS = {
  // メインアプリアイコン（ヘッダー、フッターなど通常の表示用）
  main: `${ICON_BASE_PATH}/icon_o.svg`,
  
  // ヒーローセクション用（ランディングページの大きな表示用）
  hero: `${ICON_BASE_PATH}/icon_n.svg`,
  
  // Favicon用（ブラウザタブに表示）
  // 注意: このパスは `src/app/icon.svg` のファイルパスを指します
  // 新しいfaviconを使用する場合は、`src/app/icon.svg` の内容も更新してください
  favicon: '/icon.svg',
  
  // その他の用途（必要に応じて追加）
  // small: `${ICON_BASE_PATH}/icon_small.svg`,
  // large: `${ICON_BASE_PATH}/icon_large.svg`,
} as const

/**
 * アプリアイコンのaltテキスト
 */
export const APP_ICON_ALT = APP_NAME
