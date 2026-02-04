#!/usr/bin/env node

/**
 * 日本の大学データをCSVでエクスポート（1000件ずつに分割）
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

type UnivRow = {
  id: string
  name_en: string
  name_ja: string | null
  country_code: string
  city: string | null
  website: string | null
  normalized_name: string | null
}

function escapeCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  // ダブルクォートが含まれる場合はエスケープ
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function createCsv(rows: UnivRow[]): string {
  const header = 'id,name_en,name_ja,country_code,city,website,normalized_name'
  const lines = [header]
  
  for (const row of rows) {
    const line = [
      escapeCsvField(row.id),
      escapeCsvField(row.name_en),
      escapeCsvField(row.name_ja),
      escapeCsvField(row.country_code),
      escapeCsvField(row.city),
      escapeCsvField(row.website),
      escapeCsvField(row.normalized_name),
    ].join(',')
    lines.push(line)
  }
  
  return lines.join('\n')
}

async function main() {
  console.log('📤 日本の大学データをCSVエクスポート中...\n')

  // 日本の大学の総件数を取得
  const { count: totalCount } = await supabase
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .eq('country_code', 'JP')

  if (!totalCount || totalCount === 0) {
    console.log('❌ 日本の大学データが見つかりませんでした')
    return
  }

  console.log(`📊 日本の大学: ${totalCount}件\n`)

  const batchSize = 1000
  const totalBatches = Math.ceil(totalCount / batchSize)
  const outputDir = resolve(process.cwd(), 'exports')
  
  // 出力ディレクトリを作成
  try {
    mkdirSync(outputDir, { recursive: true })
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error('❌ 出力ディレクトリの作成に失敗:', error.message)
      return
    }
  }

  console.log(`📁 出力先: ${outputDir}\n`)

  let offset = 0
  let batchNumber = 1

  while (offset < totalCount) {
    console.log(`📦 バッチ ${batchNumber}/${totalBatches} を処理中... (${offset + 1} - ${Math.min(offset + batchSize, totalCount)})`)

    const { data, error } = await supabase
      .from('universities')
      .select('id, name_en, name_ja, country_code, city, website, normalized_name')
      .eq('country_code', 'JP')
      .order('name_en', { ascending: true })
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error(`❌ バッチ ${batchNumber} の取得エラー:`, error.message)
      break
    }

    if (!data || data.length === 0) {
      console.log('⚠️  データが取得できませんでした')
      break
    }

    // CSVに変換
    const csv = createCsv(data as UnivRow[])
    
    // ファイルに保存
    const fileName = `japanese-universities-${String(batchNumber).padStart(3, '0')}.csv`
    const filePath = resolve(outputDir, fileName)
    writeFileSync(filePath, csv, 'utf-8')

    console.log(`  ✅ ${data.length}件を ${fileName} に保存しました`)

    offset += data.length
    batchNumber++
  }

  console.log(`\n✨ 完了: ${batchNumber - 1}個のファイルを作成しました`)
  console.log(`📁 出力ディレクトリ: ${outputDir}`)
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err)
  process.exit(1)
})





















