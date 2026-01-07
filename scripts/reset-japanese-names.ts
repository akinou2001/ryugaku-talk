#!/usr/bin/env node

/**
 * 日本語名（name_ja）をすべてNULLにリセットするスクリプト
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
  console.log('🔄 日本語名をリセット中...\n')

  // 現在の日本語名がある件数を確認
  const { count: beforeCount } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true } as any)
    .not('name_ja', 'is', null)

  console.log(`📊 リセット前: 日本語名がある件数 = ${beforeCount || 0}件\n`)

  if ((beforeCount || 0) === 0) {
    console.log('✅ 日本語名が設定されているデータはありません。リセット不要です。')
    return
  }

  // すべてのname_jaをNULLに更新
  const { error } = await supabase
    .from('universities')
    .update({ name_ja: null })
    .not('name_ja', 'is', null)

  if (error) {
    console.error('❌ リセットエラー:', error.message)
    process.exit(1)
  }

  // リセット後の確認
  const { count: afterCount } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true } as any)
    .not('name_ja', 'is', null)

  console.log('📊 リセット結果:')
  console.log(`  更新前: ${beforeCount || 0}件に日本語名あり`)
  console.log(`  更新後: ${afterCount || 0}件に日本語名あり`)
  console.log(`  ✅ ${beforeCount || 0}件をリセットしました`)
  console.log('\n✨ 完了')
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err)
  process.exit(1)
})

