#!/usr/bin/env node

/**
 * 日本の大学（country_code = 'JP'）に日本語名を付与するスクリプト
 * - DB 側の name_en を正規化して normalized_name に保存（未保存の場合）
 * - 文科省(MEXT)データの英語名を同じ正規化関数で正規化
 * - 正規化名での完全一致、次にJaro-Winkler類似度でマッチング
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { normalizeUniversityName } from '../src/lib/university-normalizer'
import jaroWinkler from 'jaro-winkler'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const mextCsvUrl = process.env.MEXT_CSV_URL || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

type UnivRow = {
  id: string
  name_en: string
  name_ja: string | null
  normalized_name: string | null
  country_code: string
}

type MextEntry = {
  en: string
  ja: string
}

function parseCsv(content: string): MextEntry[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
  // 期待カラム: english_name,japanese_name
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const enIdx = header.findIndex(h => /english/i.test(h) || h === 'en' || /name_en/i.test(h))
  const jaIdx = header.findIndex(h => /japanese/i.test(h) || h === 'ja' || /name_ja/i.test(h))
  const entries: MextEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const en = cols[enIdx] || ''
    const ja = cols[jaIdx] || ''
    if (en && ja) {
      entries.push({ en, ja })
    }
  }
  return entries
}

async function loadMextMapping(): Promise<Map<string, string>> {
  // 1) 環境変数でCSV URLが指定されていれば優先
  if (mextCsvUrl) {
    try {
      const res = await fetch(mextCsvUrl)
      if (res.ok) {
        const text = await res.text()
        const entries = parseCsv(text)
        const map = new Map<string, string>()
        for (const e of entries) {
          const key = normalizeUniversityName(e.en)
          if (key) map.set(key, e.ja)
        }
        if (map.size > 0) return map
      } else {
        console.warn(`⚠️ MEXT CSV 取得失敗: ${res.status} ${res.statusText}`)
      }
    } catch (e: any) {
      console.warn('⚠️ MEXT CSV 読込エラー:', e.message)
    }
  }
  // 2) ローカルの手動マッピングをフォールバック
  try {
    const localJsonPath = resolve(process.cwd(), 'data/japanese-university-names.json')
    const raw = readFileSync(localJsonPath, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, string>
    const map = new Map<string, string>()
    for (const [en, ja] of Object.entries(obj)) {
      const key = normalizeUniversityName(en)
      if (key) map.set(key, ja)
    }
    return map
  } catch {
    console.warn('⚠️ ローカルの手動マッピングが見つかりませんでした（data/japanese-university-names.json）')
  }
  return new Map<string, string>()
}

async function main() {
  console.log('🚀 日本語名付与スクリプト開始')

  const mapping = await loadMextMapping()
  console.log(`📚 MEXT/ローカルマッピング件数: ${mapping.size}`)

  const batchSize = 200
  let offset = 0
  let totalMatched = 0
  let totalUpdated = 0
  let totalSkipped = 0

  while (true) {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name_en, name_ja, normalized_name, country_code')
      .eq('country_code', 'JP')
      .is('name_ja', null)
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('❌ 取得エラー:', error.message)
      break
    }

    const rows = (data || []) as UnivRow[]
    if (rows.length === 0) break

    console.log(`📦 バッチ取得: ${offset} - ${offset + rows.length - 1}`)

    for (const row of rows) {
      const normalized = row.normalized_name || normalizeUniversityName(row.name_en)
      if (!normalized) {
        totalSkipped++
        continue
      }
      // normalized_name を保存（未設定の場合）
      if (!row.normalized_name) {
        await supabase
          .from('universities')
          .update({ normalized_name: normalized })
          .eq('id', row.id)
      }

      // 1) 正規化名で完全一致
      const exactJa = mapping.get(normalized)
      if (exactJa) {
        const { error: upErr } = await supabase
          .from('universities')
          .update({ name_ja: exactJa, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (!upErr) {
          totalUpdated++
          totalMatched++
          continue
        }
      }

      // 2) 類似度（Jaro-Winkler）
      let bestScore = 0
      let bestJa = ''
      mapping.forEach((ja, k) => {
        const score = jaroWinkler(normalized, k)
        if (score > bestScore) {
          bestScore = score
          bestJa = ja
        }
      })
      if (bestScore >= 0.85 && bestJa) {
        const { error: upErr2 } = await supabase
          .from('universities')
          .update({ name_ja: bestJa, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (!upErr2) {
          totalUpdated++
          totalMatched++
        } else {
          totalSkipped++
        }
      } else {
        totalSkipped++
      }
    }

    offset += rows.length
    if (rows.length < batchSize) break
  }

  console.log('\n📊 処理結果')
  console.log(`  マッチ: ${totalMatched}件`)
  console.log(`  更新: ${totalUpdated}件`)
  console.log(`  スキップ: ${totalSkipped}件`)
  console.log('✨ 完了')
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err)
  process.exit(1)
})


