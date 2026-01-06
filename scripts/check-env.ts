#!/usr/bin/env node

/**
 * 環境変数のチェックスクリプト
 * 必要な環境変数が設定されているか確認します
 */

// .env.localファイルを読み込む
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
]

interface EnvCheckResult {
  name: string
  isSet: boolean
  isRequired: boolean
}

function checkEnvVars(): EnvCheckResult[] {
  const results: EnvCheckResult[] = []

  // 必須環境変数のチェック
  requiredEnvVars.forEach((varName) => {
    results.push({
      name: varName,
      isSet: !!process.env[varName],
      isRequired: true,
    })
  })

  // オプション環境変数のチェック
  optionalEnvVars.forEach((varName) => {
    results.push({
      name: varName,
      isSet: !!process.env[varName],
      isRequired: false,
    })
  })

  return results
}

function main() {
  console.log('🔍 環境変数のチェックを開始します...\n')

  const results = checkEnvVars()
  let hasErrors = false
  let hasWarnings = false

  // 必須環境変数のチェック
  const requiredResults = results.filter((r) => r.isRequired)
  console.log('📋 必須環境変数:')
  requiredResults.forEach((result) => {
    if (result.isSet) {
      console.log(`  ✅ ${result.name}`)
    } else {
      console.log(`  ❌ ${result.name} - 未設定`)
      hasErrors = true
    }
  })

  // オプション環境変数のチェック
  const optionalResults = results.filter((r) => !r.isRequired)
  if (optionalResults.length > 0) {
    console.log('\n📋 オプション環境変数:')
    optionalResults.forEach((result) => {
      if (result.isSet) {
        console.log(`  ✅ ${result.name}`)
      } else {
        console.log(`  ⚠️  ${result.name} - 未設定（オプション）`)
        hasWarnings = true
      }
    })
  }

  console.log('')

  if (hasErrors) {
    console.error('❌ エラー: 必須環境変数が設定されていません')
    console.error('   .env.local ファイルに必要な環境変数を設定してください')
    process.exit(1)
  }

  if (hasWarnings) {
    console.warn('⚠️  警告: 一部のオプション環境変数が設定されていません')
    console.warn('   一部の機能が制限される可能性があります')
  } else {
    console.log('✅ すべての環境変数が正しく設定されています')
  }

  process.exit(0)
}

main()

