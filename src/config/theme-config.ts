/**
 * テーマ設定
 * 
 * カラー、テーマカラー、PWA設定などを管理します。
 */

/**
 * プライマリカラー（Tailwind CSSのprimary-600などで使用）
 * 実際のカラー値は tailwind.config.ts で定義されています
 */
export const THEME_COLORS = {
  primary: '#3B82F6', // primary-600相当
  primaryDark: '#2563EB', // primary-700相当
  background: '#ffffff',
  // 必要に応じて他のカラーも追加
} as const

/**
 * PWA設定
 */
export const PWA_CONFIG = {
  display: 'standalone' as const,
  backgroundColor: THEME_COLORS.background,
  themeColor: THEME_COLORS.primary,
  startUrl: '/',
} as const

/**
 * 地球風グラデーション（ランディングページ用）
 */
export const EARTH_GRADIENT = {
  css: 'linear-gradient(141deg, #23f0a3 0%, #37e8ff 50%, #0f9cff)',
  colors: {
    start: '#23f0a3',
    middle: '#37e8ff',
    end: '#0f9cff',
  },
} as const

/**
 * コミュニティのデフォルトカバー写真のリスト
 * public/community-covers/ フォルダ内の画像ファイル名を指定
 */
export const DEFAULT_COMMUNITY_COVERS = [
  '/community-covers/cover_campus.png',
  '/community-covers/cover_beach.png',
  '/community-covers/cover_anthique.png',
] as const

/**
 * 地球系ボタンのスタイル設定
 */
export const EARTH_BUTTON_STYLES = {
  // プライマリボタンのスタイル
  primary: {
    background: EARTH_GRADIENT.css,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    textColor: 'white',
  },
  // セカンダリボタンのスタイル
  secondary: {
    background: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    textColor: 'gray-900',
  },
  // サイズの設定
  sizes: {
    sm: {
      padding: 'px-4 sm:px-6 py-2 sm:py-3',
      fontSize: 'text-xs sm:text-sm',
      borderRadius: 'rounded-lg',
    },
    md: {
      padding: 'px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5',
      fontSize: 'text-sm sm:text-base md:text-lg',
      borderRadius: 'rounded-xl sm:rounded-2xl',
    },
    lg: {
      padding: 'px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6',
      fontSize: 'text-base sm:text-lg md:text-xl',
      borderRadius: 'rounded-2xl',
    },
  },
} as const
