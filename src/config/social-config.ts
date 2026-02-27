/**
 * ソーシャルメディア・連絡先設定
 * 
 * SNSアカウント、連絡先情報を管理します。
 */

import { SNS_URLS } from './constants'

/**
 * メールアドレス
 * 環境変数 NEXT_PUBLIC_CONTACT_EMAIL が設定されていない場合はデフォルト値を使用
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@ryugakutalk.com'

/**
 * Twitter設定
 */
export const TWITTER = {
  handle: '@ryugakutalk',
  url: SNS_URLS.TWITTER,
  cardType: 'summary_large_image' as const,
} as const

/**
 * その他のSNSアカウント（必要に応じて追加）
 */
export const SOCIAL_LINKS = {
  twitter: TWITTER.url,
  // facebook: 'https://facebook.com/ryugakutalk',
  // instagram: 'https://instagram.com/ryugakutalk',
  // linkedin: 'https://linkedin.com/company/ryugakutalk',
  // youtube: 'https://youtube.com/@ryugakutalk',
} as const

/**
 * 連絡先情報
 */
export const CONTACT_INFO = {
  email: CONTACT_EMAIL,
  // phone: '+81-XX-XXXX-XXXX', // 必要に応じて追加
  // address: '...', // 必要に応じて追加
} as const
