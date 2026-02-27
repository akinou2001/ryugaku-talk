/**
 * サイト設定
 * 
 * URL、ドメイン、SEO関連の設定を管理します。
 * 環境によって異なる場合は、環境変数を使用してください。
 */

import { APP_NAME, APP_SUBTITLE } from './app-config'
import { IMAGE_SIZES, SITEMAP_PRIORITIES } from './constants'

/**
 * サイトのベースURL（本番環境）
 * 環境変数 NEXT_PUBLIC_SITE_URL が設定されていない場合はデフォルト値を使用
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ryugakutalk.com'

/**
 * サイトのドメイン
 * 環境変数 NEXT_PUBLIC_SITE_DOMAIN が設定されていない場合はデフォルト値を使用
 */
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'ryugakutalk.com'

/**
 * サイトのロケール
 */
export const SITE_LOCALE = 'ja_JP'

/**
 * SEOキーワード
 */
export const SEO_KEYWORDS = [
  '留学',
  '留学コミュニティ',
  '留学支援',
  '留学体験',
  '留学相談',
  '留学情報',
  '留学先',
  '留学準備',
  APP_NAME,
] as const

/**
 * OG画像の設定
 */
export const OG_IMAGE = {
  url: '/og-image.png',
  width: IMAGE_SIZES.OG_WIDTH,
  height: IMAGE_SIZES.OG_HEIGHT,
  alt: `${APP_NAME} - ${APP_SUBTITLE}`,
} as const

/**
 * Apple Touch Iconの設定
 */
export const APPLE_ICON = {
  url: '/apple-icon.png',
  sizes: `${IMAGE_SIZES.APPLE_ICON}x${IMAGE_SIZES.APPLE_ICON}`,
  type: 'image/png',
} as const

/**
 * Faviconの設定
 */
export const FAVICON = {
  url: '/favicon.ico',
  sizes: 'any',
  type: 'image/x-icon',
} as const

/**
 * Sitemapの設定
 */
export const SITEMAP_CONFIG = {
  baseUrl: SITE_URL,
  staticRoutes: [
    '',
    '/posts',
    '/communities',
    '/quests',
    '/ai/concierge',
    '/help',
    '/terms',
    '/privacy',
  ] as const,
  changeFrequency: {
    home: 'daily' as const,
    other: 'weekly' as const,
  },
  priority: {
    home: SITEMAP_PRIORITIES.HOME_PRIORITY,
    other: SITEMAP_PRIORITIES.OTHER_PRIORITY,
  },
} as const

/**
 * Robots.txtの設定
 */
export const ROBOTS_CONFIG = {
  sitemap: `${SITE_URL}/sitemap.xml`,
  disallowPaths: ['/api/', '/admin/'],
} as const
