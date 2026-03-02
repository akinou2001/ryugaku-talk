// タイムゾーンユーティリティ（Intl.DateTimeFormat使用、外部ライブラリ不要）

export interface TimezoneOption {
  value: string
  label: string
}

export interface TimezoneGroup {
  label: string
  options: TimezoneOption[]
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = [
  {
    label: 'アジア',
    options: [
      { value: 'Asia/Tokyo', label: '日本 (JST)' },
      { value: 'Asia/Seoul', label: '韓国 (KST)' },
      { value: 'Asia/Shanghai', label: '中国 (CST)' },
      { value: 'Asia/Taipei', label: '台湾 (CST)' },
      { value: 'Asia/Hong_Kong', label: '香港 (HKT)' },
      { value: 'Asia/Singapore', label: 'シンガポール (SGT)' },
      { value: 'Asia/Bangkok', label: 'タイ (ICT)' },
      { value: 'Asia/Ho_Chi_Minh', label: 'ベトナム (ICT)' },
      { value: 'Asia/Manila', label: 'フィリピン (PHT)' },
      { value: 'Asia/Jakarta', label: 'インドネシア (WIB)' },
      { value: 'Asia/Kuala_Lumpur', label: 'マレーシア (MYT)' },
      { value: 'Asia/Kolkata', label: 'インド (IST)' },
      { value: 'Asia/Dubai', label: 'UAE (GST)' },
    ],
  },
  {
    label: '北アメリカ',
    options: [
      { value: 'America/New_York', label: 'ニューヨーク (EST/EDT)' },
      { value: 'America/Chicago', label: 'シカゴ (CST/CDT)' },
      { value: 'America/Denver', label: 'デンバー (MST/MDT)' },
      { value: 'America/Los_Angeles', label: 'ロサンゼルス (PST/PDT)' },
      { value: 'America/Anchorage', label: 'アラスカ (AKST/AKDT)' },
      { value: 'Pacific/Honolulu', label: 'ハワイ (HST)' },
      { value: 'America/Toronto', label: 'トロント (EST/EDT)' },
      { value: 'America/Vancouver', label: 'バンクーバー (PST/PDT)' },
      { value: 'America/Mexico_City', label: 'メキシコシティ (CST/CDT)' },
    ],
  },
  {
    label: 'ヨーロッパ',
    options: [
      { value: 'Europe/London', label: 'ロンドン (GMT/BST)' },
      { value: 'Europe/Paris', label: 'パリ (CET/CEST)' },
      { value: 'Europe/Berlin', label: 'ベルリン (CET/CEST)' },
      { value: 'Europe/Madrid', label: 'マドリード (CET/CEST)' },
      { value: 'Europe/Rome', label: 'ローマ (CET/CEST)' },
      { value: 'Europe/Amsterdam', label: 'アムステルダム (CET/CEST)' },
      { value: 'Europe/Zurich', label: 'チューリッヒ (CET/CEST)' },
      { value: 'Europe/Stockholm', label: 'ストックホルム (CET/CEST)' },
      { value: 'Europe/Dublin', label: 'ダブリン (GMT/IST)' },
      { value: 'Europe/Vienna', label: 'ウィーン (CET/CEST)' },
      { value: 'Europe/Brussels', label: 'ブリュッセル (CET/CEST)' },
      { value: 'Europe/Copenhagen', label: 'コペンハーゲン (CET/CEST)' },
      { value: 'Europe/Helsinki', label: 'ヘルシンキ (EET/EEST)' },
      { value: 'Europe/Oslo', label: 'オスロ (CET/CEST)' },
      { value: 'Europe/Warsaw', label: 'ワルシャワ (CET/CEST)' },
      { value: 'Europe/Lisbon', label: 'リスボン (WET/WEST)' },
      { value: 'Europe/Prague', label: 'プラハ (CET/CEST)' },
      { value: 'Europe/Athens', label: 'アテネ (EET/EEST)' },
    ],
  },
  {
    label: 'オセアニア',
    options: [
      { value: 'Australia/Sydney', label: 'シドニー (AEST/AEDT)' },
      { value: 'Australia/Melbourne', label: 'メルボルン (AEST/AEDT)' },
      { value: 'Australia/Brisbane', label: 'ブリスベン (AEST)' },
      { value: 'Australia/Perth', label: 'パース (AWST)' },
      { value: 'Pacific/Auckland', label: 'オークランド (NZST/NZDT)' },
      { value: 'Pacific/Fiji', label: 'フィジー (FJT)' },
    ],
  },
  {
    label: '南アメリカ',
    options: [
      { value: 'America/Sao_Paulo', label: 'サンパウロ (BRT)' },
      { value: 'America/Buenos_Aires', label: 'ブエノスアイレス (ART)' },
      { value: 'America/Santiago', label: 'サンティアゴ (CLT/CLST)' },
      { value: 'America/Bogota', label: 'ボゴタ (COT)' },
      { value: 'America/Lima', label: 'リマ (PET)' },
    ],
  },
  {
    label: 'アフリカ',
    options: [
      { value: 'Africa/Johannesburg', label: 'ヨハネスブルグ (SAST)' },
      { value: 'Africa/Cairo', label: 'カイロ (EET)' },
      { value: 'Africa/Nairobi', label: 'ナイロビ (EAT)' },
      { value: 'Africa/Lagos', label: 'ラゴス (WAT)' },
      { value: 'Africa/Casablanca', label: 'カサブランカ (WET)' },
    ],
  },
]

/**
 * 現在の現地時刻を取得（コミュニティ詳細用）
 * @returns "14:30" 形式の文字列、無効なTZの場合はnull
 */
export function formatLocalTime(timezone: string): string | null {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  } catch {
    return null
  }
}

/**
 * 投稿のcreated_atを著者のTZで変換（投稿タイムスタンプ用）
 * @returns "14:30" 形式の文字列、無効なTZの場合はnull
 */
export function formatPostLocalTime(createdAt: string, timezone: string): string | null {
  try {
    const date = new Date(createdAt)
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return null
  }
}

/**
 * タイムゾーンの略称を取得
 * @returns "JST" 等の略称、無効なTZの場合はnull
 */
export function getTimezoneAbbreviation(timezone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(new Date())
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    return tzPart?.value ?? null
  } catch {
    return null
  }
}
