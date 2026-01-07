#!/usr/bin/env node

/**
 * 既存の大学データに座標（latitude/longitude）を付与するスクリプト
 * - name_en を正規化して normalized_name に保存
 * - ROR API を検索して座標を取得し、universities を更新
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { normalizeUniversityName } from '../src/lib/university-normalizer'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const contactEmail = process.env.ROR_CONTACT_EMAIL || 'your-email@example.com'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

type UnivRow = {
  id: string
  name_en: string
  country_code: string
  normalized_name: string | null
  latitude: number | null
  longitude: number | null
}

async function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

async function fetchRorLocation(query: string, countryCode?: string): Promise<{ lat: number, lng: number } | null> {
  const url = `https://api.ror.org/organizations?query=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': `RyugakuTalk-Enrichment-Script (mailto:${contactEmail})`,
      }
    })
    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`⚠️ レート制限: 100ms待機後にリトライ...`)
        await delay(1000)
        return fetchRorLocation(query, countryCode)
      }
      console.warn(`⚠️ ROR API エラー: ${res.status} ${res.statusText} for query="${query}"`)
      return null
    }
    const json = await res.json()
    const items = json?.items || []
    if (items.length === 0) return null
    
    // 国コードが一致するものを優先
    let bestMatch = items[0]
    if (countryCode) {
      const countryMatch = items.find((item: any) => {
        const loc = item.locations?.[0]
        const itemCountry = loc?.geonames_details?.country_code
        return itemCountry && itemCountry.toUpperCase() === countryCode.toUpperCase()
      })
      if (countryMatch) {
        bestMatch = countryMatch
      }
    }
    
    const loc = bestMatch?.locations?.[0]
    if (!loc) return null
    
    // geonames_detailsから座標を取得
    const geonames = loc.geonames_details
    if (geonames?.lat != null && geonames?.lng != null) {
      return { lat: Number(geonames.lat), lng: Number(geonames.lng) }
    }
    
    // フォールバック: 直接lat/lngがある場合（古い形式）
    if (loc.lat != null && loc.lng != null) {
      return { lat: Number(loc.lat), lng: Number(loc.lng) }
    }
    
    return null
  } catch (error: any) {
    console.warn(`⚠️ ROR API 例外: ${error.message} for query="${query}"`)
    return null
  }
}

async function main() {
  console.log('🚀 座標付与スクリプト開始')

  const batchSize = 100
  let offset = 0
  let totalUpdated = 0
  let totalSkipped = 0
  let totalNormalized = 0
  let totalFetched = 0

  while (true) {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name_en, country_code, normalized_name, latitude, longitude')
      .is('latitude', null)
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
      if (!row.normalized_name) {
        // normalized_name を保存
        await supabase
          .from('universities')
          .update({ normalized_name: normalized })
          .eq('id', row.id)
        totalNormalized++
      }

      // ROR API 検索（元の名前も試す）
      let coords = await fetchRorLocation(normalized, row.country_code)
      if (!coords) {
        // 正規化名で見つからない場合、元の名前でも試す
        coords = await fetchRorLocation(row.name_en, row.country_code)
      }
      await delay(100) // Polite Pool を尊重してディレイ

      if (!coords) {
        totalSkipped++
        continue
      }

      // 座標更新
      const { error: upErr } = await supabase
        .from('universities')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      if (upErr) {
        console.warn(`⚠️ 更新失敗 id=${row.id}:`, upErr.message)
      } else {
        totalUpdated++
        totalFetched++
      }
    }

    offset += rows.length
    if (rows.length < batchSize) break
  }

  console.log('\n📊 処理結果')
  console.log(`  正規化名更新: ${totalNormalized}件`)
  console.log(`  座標取得成功: ${totalFetched}件`)
  console.log(`  取得失敗/スキップ: ${totalSkipped}件`)
  console.log('✨ 完了')
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err)
  process.exit(1)
})


