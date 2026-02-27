/**
 * アプリケーション定数
 * 
 * ハードコードされた数値定数、設定値、閾値を管理します。
 * これらの値を変更すると、アプリ全体に反映されます。
 */

/**
 * 検索・取得リミット
 */
export const SEARCH_LIMITS = {
  /** AI関連投稿検索のデフォルト件数 */
  AI_RELATED_POSTS: 5,
  /** 類似ユーザー検索のデフォルト件数 */
  SIMILAR_USERS: 3,
  /** 投稿検索のデフォルト件数 */
  POST_SEARCH: 5,
  /** 大学検索のデフォルト件数 */
  UNIVERSITY_SEARCH: 10,
  /** 大学検索の最大件数 */
  UNIVERSITY_SEARCH_MAX: 50,
  /** AI検索のデフォルト件数 */
  AI_SEARCH: 100,
  /** マップ表示の投稿取得件数 */
  MAP_POSTS: 500,
  /** キーワード抽出の最大数 */
  MAX_KEYWORDS: 5,
  /** クエスト投稿者の表示件数 */
  QUEST_AUTHORS: 10,
  /** クエスト投稿の表示件数 */
  QUEST_POSTS: 10,
  /** 管理者ページの投稿取得件数 */
  ADMIN_POSTS: 100,
} as const

/**
 * 文字列切り取り長
 */
export const TEXT_LIMITS = {
  /** タイトル・コンテンツの短いプレビュー */
  SHORT_PREVIEW: 10,
  /** タイトルのプレビュー */
  TITLE_PREVIEW: 20,
  /** タイトルの表示 */
  TITLE_DISPLAY: 30,
  /** コンテンツのプレビュー（短） */
  CONTENT_PREVIEW_SHORT: 50,
  /** コンテンツのプレビュー（中） */
  CONTENT_PREVIEW_MEDIUM: 100,
  /** コンテンツのプレビュー（長） */
  CONTENT_PREVIEW_LONG: 200,
  /** コンテンツスニペット */
  CONTENT_SNIPPET: 300,
  /** コンテンツの切り取り（中） */
  CONTENT_TRUNCATE_MEDIUM: 500,
  /** コンテンツの切り取り（長） */
  CONTENT_TRUNCATE_LONG: 800,
  /** メッセージプレビュー */
  MESSAGE_PREVIEW: 50,
  /** 通知内容の最大長 */
  NOTIFICATION_CONTENT: 500,
} as const

/**
 * AI設定
 */
export const AI_CONFIG = {
  /** OpenAI APIのTemperature設定 */
  TEMPERATURE: 0.7,
  /** OpenAI APIのMax Tokens設定 */
  MAX_TOKENS: 1500,
  /** Geminiモデル名 */
  GEMINI_MODEL: 'gemini-3-flash-preview',
  /** OpenAI GPTモデル名 */
  OPENAI_MODEL: 'gpt-3.5-turbo',
  /** DashScope Qwenモデル名 */
  DASHSCOPE_MODEL: 'qwen-flash',
} as const

/**
 * バリデーション設定
 */
export const VALIDATION = {
  /** 最小キーワード長 */
  MIN_KEYWORD_LENGTH: 2,
  /** パスワードの最小長 */
  MIN_PASSWORD_LENGTH: 6,
  /** APIキーの最小長 */
  MIN_API_KEY_LENGTH: 10,
  /** メールアドレス検証の遅延時間（ms） */
  EMAIL_CHECK_DELAY: 500,
} as const

/**
 * タイムアウト設定（ミリ秒）
 */
export const TIMEOUTS = {
  /** Playwrightテストのタイムアウト */
  PLAYWRIGHT_TEST: 120000, // 120秒
} as const

/**
 * プレースホルダーパターン（APIキー検証用）
 */
export const PLACEHOLDER_PATTERNS = [
  'your_dashscope_api_key',
  'your_dashscope',
  'placeholder',
  'example',
  'sk-xxxxxxxx',
] as const

/**
 * SNS URLテンプレート
 */
export const SNS_URLS = {
  TWITTER: 'https://twitter.com',
  X: 'https://x.com',
  TIKTOK: 'https://www.tiktok.com/@',
  INSTAGRAM: 'https://www.instagram.com/',
  FACEBOOK: 'https://www.facebook.com/',
  LINKEDIN: 'https://www.linkedin.com/in/',
  TWITTER_SHARE: 'https://twitter.com/intent/tweet',
} as const

/**
 * CDN URL
 */
export const CDN_URLS = {
  TWEMOJI_CSS: 'https://cdn.jsdelivr.net/npm/twemoji@latest/dist/twemoji.css',
  TWEMOJI_BASE: 'https://cdn.jsdelivr.net',
} as const

/**
 * プレースホルダー値
 */
export const PLACEHOLDERS = {
  SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_KEY: 'placeholder-key',
} as const

/**
 * 開発環境URL
 */
export const DEV_URLS = {
  LOCALHOST: 'http://localhost:3000',
} as const

/**
 * 画像サイズ設定
 */
export const IMAGE_SIZES = {
  /** OG画像の幅 */
  OG_WIDTH: 1200,
  /** OG画像の高さ */
  OG_HEIGHT: 630,
  /** Apple Touch Iconのサイズ */
  APPLE_ICON: 180,
} as const

/**
 * Sitemap優先度設定
 */
export const SITEMAP_PRIORITIES = {
  /** ホームページの優先度 */
  HOME_PRIORITY: 1.0,
  /** その他ページの優先度 */
  OTHER_PRIORITY: 0.8,
} as const

/**
 * 型定義
 */
export type SearchLimits = typeof SEARCH_LIMITS
export type TextLimits = typeof TEXT_LIMITS
export type AIConfig = typeof AI_CONFIG
export type Validation = typeof VALIDATION
export type Timeouts = typeof TIMEOUTS
