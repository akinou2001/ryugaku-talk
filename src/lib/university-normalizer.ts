export const STOP_WORDS: Set<string> = new Set([
  // 基本の接続詞・前置詞
  'of', 'and', 'for', 'the', 'at', 'in', 'on', 'de', 'la', 'le', 'les',
  // MEXT特有の設置形態
  'national', 'public', 'private'
])

/**
 * 大学名の表記ゆれを正規化する
 * 例:
 *  - "The University of Tokyo" -> "tokyo univ"
 *  - "Tokyo, University of" -> "tokyo univ"
 *  - "Tokyo University (National)" -> "tokyo univ"
 */
export function normalizeUniversityName(originalName: string): string {
  if (!originalName) return ''
  let normalized = originalName.trim()

  // 1. カンマ区切りの反転対応: "Tokyo, University of" -> "University of Tokyo"
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(p => p.trim())
    if (parts.length === 2 && parts[0] && parts[1]) {
      normalized = `${parts[1]} ${parts[0]}`.trim()
    }
  }

  // 2. 先頭の"The "を削除
  normalized = normalized.replace(/^the\s+/i, '')

  // 3. 大文字小文字を統一
  normalized = normalized.toLowerCase()

  // 4. 略称の統一
  normalized = normalized
    .replace(/\buniversity\b/g, 'univ')
    .replace(/\bcollege\b/g, 'coll')
    .replace(/\binstitute\b/g, 'inst')
    .replace(/\btechnology\b/g, 'tech')

  // 5. 特殊文字の除去（括弧内も含む）
  normalized = normalized.replace(/\([^)]*\)/g, ' ') // 括弧とその中身を削除
  normalized = normalized.replace(/[^\w\s]/g, ' ') // 記号除去

  // 6. ストップワードの除去
  const words = normalized.split(/\s+/)
  normalized = words
    .filter(word => word.length > 0 && !STOP_WORDS.has(word))
    .join(' ')

  // 7. 空白の正規化
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}


