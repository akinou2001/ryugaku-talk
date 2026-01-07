#!/usr/bin/env node

/**
 * 座標データの付与状況を確認するスクリプト
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('📊 座標データの付与状況を確認中...\n')

  // 全件数
  const { count: totalCount } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })

  // 座標あり
  const { count: withCoordinates } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  // 座標なし
  const { count: withoutCoordinates } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .or('latitude.is.null,longitude.is.null')

  // 正規化名あり
  const { count: withNormalizedName } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .not('normalized_name', 'is', null)

  // 正規化名なし
  const { count: withoutNormalizedName } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .is('normalized_name', null)

  // 座標なし＆正規化名ありの件数（再試行可能）
  const { count: retryable } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .is('latitude', null)
    .not('normalized_name', 'is', null)

  // 国別の座標付与状況
  const { data: countryStats } = await supabase
    .from('universities')
    .select('country_code')
  
  const countryMap = new Map<string, { total: number, withCoords: number }>()
  
  if (countryStats) {
    for (const row of countryStats) {
      const code = row.country_code || 'UNKNOWN'
      if (!countryMap.has(code)) {
        countryMap.set(code, { total: 0, withCoords: 0 })
      }
      countryMap.get(code)!.total++
    }
  }

  // 座標ありの国別統計
  const { data: withCoordsData } = await supabase
    .from('universities')
    .select('country_code')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
  
  if (withCoordsData) {
    for (const row of withCoordsData) {
      const code = row.country_code || 'UNKNOWN'
      if (countryMap.has(code)) {
        countryMap.get(code)!.withCoords++
      }
    }
  }

  console.log('📈 全体統計')
  console.log(`  全件数: ${totalCount?.toLocaleString()}件`)
  console.log(`  座標あり: ${withCoordinates?.toLocaleString()}件 (${totalCount ? ((withCoordinates || 0) / totalCount * 100).toFixed(1) : 0}%)`)
  console.log(`  座標なし: ${withoutCoordinates?.toLocaleString()}件 (${totalCount ? ((withoutCoordinates || 0) / totalCount * 100).toFixed(1) : 0}%)`)
  console.log(`  正規化名あり: ${withNormalizedName?.toLocaleString()}件`)
  console.log(`  正規化名なし: ${withoutNormalizedName?.toLocaleString()}件`)
  console.log(`  再試行可能（座標なし＆正規化名あり）: ${retryable?.toLocaleString()}件`)

  console.log('\n🌍 国別の座標付与率（上位20カ国）')
  const sortedCountries = Array.from(countryMap.entries())
    .map(([code, stats]) => ({
      code,
      total: stats.total,
      withCoords: stats.withCoords,
      rate: stats.total > 0 ? (stats.withCoords / stats.total * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  for (const country of sortedCountries) {
    console.log(`  ${country.code}: ${country.withCoords}/${country.total}件 (${country.rate.toFixed(1)}%)`)
  }

  // 座標なしのサンプルを表示
  console.log('\n⚠️  座標なしのサンプル（最初の10件）')
  const { data: samples } = await supabase
    .from('universities')
    .select('id, name_en, country_code, normalized_name')
    .is('latitude', null)
    .limit(10)

  if (samples && samples.length > 0) {
    for (const sample of samples) {
      console.log(`  - ${sample.name_en} (${sample.country_code})${sample.normalized_name ? ` [正規化名: ${sample.normalized_name}]` : ' [正規化名なし]'}`)
    }
  } else {
    console.log('  （座標なしのデータはありません）')
  }

  console.log('\n✨ 完了')
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err)
  process.exit(1)
})

