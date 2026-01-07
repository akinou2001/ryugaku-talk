#!/usr/bin/env node

/**
 * 大学データの件数を簡単に確認するスクリプト
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

async function quickCheck() {
  console.log('🔍 大学データの件数を確認中...\n')

  // 総件数
  const { count, error } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('❌ エラー:', error.message)
    return
  }

  console.log(`📊 総件数: ${count?.toLocaleString() || 0}件\n`)

  // 国別のトップ10
  const { data: topCountries } = await supabase
    .from('universities')
    .select('country_code')
    .limit(10000)

  if (topCountries) {
    const countryMap = new Map<string, number>()
    topCountries.forEach(u => {
      const code = u.country_code || 'UNKNOWN'
      countryMap.set(code, (countryMap.get(code) || 0) + 1)
    })

    const top10 = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    console.log('📊 国別件数（上位10カ国）:')
    top10.forEach(([code, count]) => {
      console.log(`  ${code}: ${count}校`)
    })
  }

  console.log('\n✅ 確認完了！')
}

quickCheck().catch(console.error)

