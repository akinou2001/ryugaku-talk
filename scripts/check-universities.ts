#!/usr/bin/env node

/**
 * 大学データベースの状態を確認するスクリプト
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

async function checkDatabase() {
  console.log('🔍 データベースの状態を確認中...\n')

  // 大陸データを確認
  const { data: continents, error: continentsError } = await supabase
    .from('continents')
    .select('*')
    .order('name_en')

  if (continentsError) {
    console.error('❌ 大陸データの取得に失敗:', continentsError.message)
    return
  }

  console.log(`📊 大陸データ: ${continents?.length || 0}件`)
  if (continents && continents.length > 0) {
    continents.forEach(c => {
      console.log(`  - ${c.name_en} (ID: ${c.id})`)
    })
  }
  console.log()

  // 大学データを確認
  const { data: universities, error: universitiesError } = await supabase
    .from('universities')
    .select('id, name_en, country_code, continent_id')
    .limit(10)

  if (universitiesError) {
    console.error('❌ 大学データの取得に失敗:', universitiesError.message)
    return
  }

  // 総数を取得
  const { count } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 大学データ: 合計 ${count || 0}件`)
  if (universities && universities.length > 0) {
    console.log('\n最初の10件:')
    universities.forEach(u => {
      console.log(`  - ${u.name_en} (${u.country_code})`)
    })
  } else {
    console.log('  ⚠️  データが存在しません')
  }
  console.log()

  // エイリアスデータを確認
  const { count: aliasCount } = await supabase
    .from('university_aliases')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 エイリアスデータ: 合計 ${aliasCount || 0}件`)
}

checkDatabase().catch(console.error)

