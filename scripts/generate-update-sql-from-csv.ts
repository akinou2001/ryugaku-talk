#!/usr/bin/env node

/**
 * CSVファイルからUPDATE文を生成するスクリプト
 * このスクリプトは、CSVファイルを読み込んで、PostgreSQLのUPDATE文を生成します
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

/**
 * CSV行をパース（カンマ区切り、引用符対応）
 */
function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"'
        i++
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // カラムの区切り
      cols.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // 最後のカラム
  cols.push(current.trim())
  
  return cols
}

/**
 * SQL文字列をエスケープ
 */
function escapeSqlString(str: string | null | undefined): string {
  if (!str) return 'NULL'
  return `'${str.replace(/'/g, "''")}'`
}

/**
 * CSVファイルからUPDATE文を生成
 */
function generateUpdateSql(inputPath: string, outputPath: string) {
  console.log('📖 CSVファイルを読み込み中...')
  const content = readFileSync(inputPath, 'utf-8')
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    console.error('❌ CSVファイルが空です')
    process.exit(1)
  }

  // ヘッダー行を処理
  const header = lines[0]
  const headerCols = header.split(',')
  const idIdx = headerCols.findIndex(col => col === 'id')
  const nameEnIdx = headerCols.findIndex(col => col === 'name_en')
  const nameJaIdx = headerCols.findIndex(col => col === 'name_ja')

  if (idIdx === -1 || nameJaIdx === -1) {
    console.error('❌ 必要なカラム（id, name_ja）が見つかりません')
    process.exit(1)
  }

  console.log(`📊 データ行数: ${lines.length - 1}件\n`)

  // SQL文を生成
  const sqlStatements: string[] = []
  
  // ヘッダーコメント
  sqlStatements.push('-- CSVファイルから日本語名（name_ja）を更新するSQL')
  sqlStatements.push('-- 生成日時: ' + new Date().toISOString())
  sqlStatements.push('-- 総件数: ' + (lines.length - 1) + '件')
  sqlStatements.push('')
  sqlStatements.push('BEGIN;')
  sqlStatements.push('')

  let processedCount = 0
  let skippedCount = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const cols = parseCsvLine(line)
    
    if (cols.length <= Math.max(idIdx, nameJaIdx)) {
      console.warn(`⚠️ 行 ${i + 1}: カラム数が不足しています。スキップします。`)
      skippedCount++
      continue
    }

    const id = cols[idIdx]?.trim()
    const nameJa = cols[nameJaIdx]?.trim()

    if (!id || !nameJa || nameJa === '') {
      console.warn(`⚠️ 行 ${i + 1}: idまたはname_jaが空です。スキップします。`)
      skippedCount++
      continue
    }

    // UUIDの形式チェック（簡易）
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      console.warn(`⚠️ 行 ${i + 1}: idの形式が不正です。スキップします。`)
      skippedCount++
      continue
    }

    // UPDATE文を生成
    const updateSql = `UPDATE universities 
SET name_ja = ${escapeSqlString(nameJa)}, updated_at = NOW()
WHERE id = ${escapeSqlString(id)} AND country_code = 'JP';`

    sqlStatements.push(updateSql)
    processedCount++

    if (processedCount % 50 === 0) {
      console.log(`  ✅ ${processedCount}件のSQL文を生成...`)
    }
  }

  sqlStatements.push('')
  sqlStatements.push('COMMIT;')
  sqlStatements.push('')
  sqlStatements.push('-- 更新された件数を確認')
  sqlStatements.push('SELECT COUNT(*) as updated_count')
  sqlStatements.push('FROM universities')
  sqlStatements.push("WHERE country_code = 'JP' AND name_ja IS NOT NULL;")

  // 結果をファイルに書き込み
  console.log(`\n💾 SQL文をファイルに書き込み中: ${outputPath}`)
  writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8')

  console.log('\n📊 処理結果:')
  console.log(`  ✅ 処理完了: ${processedCount}件`)
  console.log(`  ⚠️  スキップ: ${skippedCount}件`)
  console.log(`  📁 出力ファイル: ${outputPath}`)
  console.log('\n✨ 完了')
  console.log('\n📝 次のステップ:')
  console.log('  1. 生成されたSQLファイルをSupabaseのSQL Editorで実行')
  console.log('  2. または、psqlコマンドで実行: psql -f update-japanese-names.sql')
}

// メイン処理
const inputFile = resolve(process.cwd(), 'exports/japanese-universities-001-with-ja.csv')
const outputFile = resolve(process.cwd(), 'update-japanese-names.sql')

console.log('🚀 SQL生成スクリプト開始\n')
console.log(`📂 入力ファイル: ${inputFile}`)
console.log(`📂 出力ファイル: ${outputFile}\n`)

try {
  generateUpdateSql(inputFile, outputFile)
} catch (error: any) {
  console.error('❌ エラーが発生しました:', error.message)
  process.exit(1)
}

