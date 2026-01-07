#!/usr/bin/env node

/**
 * 大学データの件数を詳細に確認するスクリプト
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyCount() {
  console.log('🔍 大学データの詳細確認中...\n')

  // 総件数を取得
  const { count: totalCount, error: countError } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ 件数取得エラー:', countError.message)
    return
  }

  console.log(`📊 総件数: ${totalCount || 0}件\n`)

  // 国別の件数
  const { data: countryData, error: countryError } = await supabase
    .from('universities')
    .select('country_code')
  
  if (!countryError && countryData) {
    const countryCount = new Map<string, number>()
    countryData.forEach(u => {
      const code = u.country_code || 'UNKNOWN'
      countryCount.set(code, (countryCount.get(code) || 0) + 1)
    })
    
    const sortedCountries = Array.from(countryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
    
    console.log('📊 国別件数（上位20カ国）:')
    sortedCountries.forEach(([code, count]) => {
      console.log(`  ${code}: ${count}校`)
    })
    console.log()
  }

  // 大陸別の件数
  const { data: continentData, error: continentError } = await supabase
    .from('universities')
    .select(`
      continent_id,
      continents!inner(name_en)
    `)
  
  if (!continentError && continentData) {
    const continentCount = new Map<string, number>()
    continentData.forEach((u: any) => {
      const continentName = u.continents?.name_en || 'Unknown'
      continentCount.set(continentName, (continentCount.get(continentName) || 0) + 1)
    })
    
    console.log('📊 大陸別件数:')
    Array.from(continentCount.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        console.log(`  ${name}: ${count}校`)
      })
    console.log()
  } else if (continentError) {
    console.log('⚠️  大陸別件数の取得に失敗:', continentError.message)
    console.log()
  }

  // 手動で重複をチェック
  const { data: allUnis } = await supabase
    .from('universities')
    .select('name_en, country_code')
  
  if (allUnis) {
    const keyCount = new Map<string, number>()
    allUnis.forEach(u => {
      const key = `${u.name_en}|${u.country_code}`
      keyCount.set(key, (keyCount.get(key) || 0) + 1)
    })
    
    const duplicateKeys = Array.from(keyCount.entries())
      .filter(([_, count]) => count > 1)
    
    if (duplicateKeys.length > 0) {
      console.log(`⚠️  重複データ: ${duplicateKeys.length}組`)
      duplicateKeys.slice(0, 10).forEach(([key, count]) => {
        const [name, code] = key.split('|')
        console.log(`  - ${name} (${code}): ${count}件`)
      })
      if (duplicateKeys.length > 10) {
        console.log(`  ... 他${duplicateKeys.length - 10}組`)
      }
    } else {
      console.log('✅ 重複データなし')
    }
  }

  // 最新の10件
  const { data: latest, error: latestError } = await supabase
    .from('universities')
    .select('name_en, country_code, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!latestError && latest) {
    console.log('\n📋 最新の10件:')
    latest.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.name_en} (${u.country_code})`)
    })
  }
}

verifyCount().catch(console.error)

