#!/usr/bin/env node

/**
 * 環境変数のチェックスクリプト
 * 必要な環境変数が設定されているか確認します
 * 
 * 使用方法:
 *   npm run check-env              # 開発環境のチェック（.env.localから読み込み）
 *   npm run check-env -- --env=dev # 開発環境のチェック（明示的）
 *   npm run check-env -- --env=prod # 本番環境のチェック（環境変数から読み込み）
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// コマンドライン引数の解析
type Environment = 'dev' | 'prod'
const args = process.argv.slice(2)
const envArg = args.find(arg => arg.startsWith('--env='))
const environment: Environment = envArg ? (envArg.split('=')[1] as Environment) || 'dev' : 'dev'

// 環境に応じて.env.localファイルを読み込む（開発環境のみ）
if (environment === 'dev') {
  config({ path: resolve(process.cwd(), '.env.local') })
  console.log('📁 開発環境モード: .env.local ファイルから環境変数を読み込みます\n')
} else {
  console.log('🌐 本番環境モード: 現在の環境変数から読み込みます')
  console.log('   （Vercelの環境変数やシステム環境変数を確認します）\n')
}

// 必須環境変数
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

// 推奨環境変数（本番環境では必須）
const recommendedEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SITE_DOMAIN',
]

// オプション環境変数
const optionalEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY',
  'DASHSCOPE_API_KEY',
]

interface EnvCheckResult {
  name: string
  isSet: boolean
  isRequired: boolean
  isRecommended: boolean
  value?: string
}

function checkEnvVars(): EnvCheckResult[] {
  const results: EnvCheckResult[] = []

  // 必須環境変数のチェック
  requiredEnvVars.forEach((varName) => {
    const value = process.env[varName]
    results.push({
      name: varName,
      isSet: !!value,
      isRequired: true,
      isRecommended: false,
      value: value ? maskSensitiveValue(varName, value) : undefined,
    })
  })

  // 推奨環境変数のチェック
  recommendedEnvVars.forEach((varName) => {
    const value = process.env[varName]
    results.push({
      name: varName,
      isSet: !!value,
      isRequired: environment === 'prod', // 本番環境では必須
      isRecommended: true,
      value: value ? maskSensitiveValue(varName, value) : undefined,
    })
  })

  // オプション環境変数のチェック
  optionalEnvVars.forEach((varName) => {
    const value = process.env[varName]
    results.push({
      name: varName,
      isSet: !!value,
      isRequired: false,
      isRecommended: false,
      value: value ? maskSensitiveValue(varName, value) : undefined,
    })
  })

  return results
}

// 機密情報をマスクする関数
function maskSensitiveValue(varName: string, value: string): string {
  // APIキーやシークレットはマスクする
  if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')) {
    if (value.length > 20) {
      return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
    }
    return '***'
  }
  // URLは最初の部分だけ表示
  if (varName.includes('URL')) {
    try {
      const url = new URL(value)
      return `${url.protocol}//${url.hostname}...`
    } catch {
      return value.length > 50 ? `${value.substring(0, 30)}...` : value
    }
  }
  return value.length > 50 ? `${value.substring(0, 30)}...` : value
}

function main() {
  console.log('🔍 環境変数のチェックを開始します...')
  console.log(`   環境: ${environment === 'dev' ? '開発環境' : '本番環境'}\n`)

  const results = checkEnvVars()
  let hasErrors = false
  let hasWarnings = false

  // 必須環境変数のチェック
  const requiredResults = results.filter((r) => r.isRequired)
  console.log('📋 必須環境変数:')
  if (requiredResults.length === 0) {
    console.log('  （なし）')
  } else {
    requiredResults.forEach((result) => {
      if (result.isSet) {
        console.log(`  ✅ ${result.name}`)
        if (result.value) {
          console.log(`     → ${result.value}`)
        }
      } else {
        console.log(`  ❌ ${result.name} - 未設定`)
        hasErrors = true
      }
    })
  }

  // 推奨環境変数のチェック
  const recommendedResults = results.filter((r) => r.isRecommended && !r.isRequired)
  if (recommendedResults.length > 0) {
    console.log('\n📋 推奨環境変数:')
    recommendedResults.forEach((result) => {
      if (result.isSet) {
        console.log(`  ✅ ${result.name}`)
        if (result.value) {
          console.log(`     → ${result.value}`)
        }
      } else {
        console.log(`  ⚠️  ${result.name} - 未設定（推奨）`)
        if (environment === 'prod') {
          hasWarnings = true
        }
      }
    })
  }

  // オプション環境変数のチェック
  const optionalResults = results.filter((r) => !r.isRequired && !r.isRecommended)
  if (optionalResults.length > 0) {
    console.log('\n📋 オプション環境変数:')
    optionalResults.forEach((result) => {
      if (result.isSet) {
        console.log(`  ✅ ${result.name}`)
        if (result.value && !result.value.includes('***')) {
          console.log(`     → ${result.value}`)
        }
      } else {
        console.log(`  ⚠️  ${result.name} - 未設定（オプション）`)
      }
    })
  }

  console.log('')

  // 環境ごとの追加チェック
  if (environment === 'dev') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && !supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1')) {
      console.log('💡 ヒント: 開発環境では開発用Supabaseプロジェクトを使用することを推奨します')
    }
  } else {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      console.log('💡 本番環境のSupabase URLが設定されています')
      if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
        console.warn('⚠️  警告: 本番環境でlocalhostのURLが設定されています')
        hasWarnings = true
      }
    }
  }

  console.log('')

  if (hasErrors) {
    console.error('❌ エラー: 必須環境変数が設定されていません')
    if (environment === 'dev') {
      console.error('   .env.local ファイルに必要な環境変数を設定してください')
    } else {
      console.error('   Vercelダッシュボードで環境変数を設定してください')
      console.error('   Settings → Environment Variables → Production')
    }
    process.exit(1)
  }

  if (hasWarnings) {
    console.warn('⚠️  警告: 一部の推奨環境変数が設定されていません')
    console.warn('   一部の機能が制限される可能性があります')
    process.exit(0)
  } else {
    console.log('✅ すべての環境変数が正しく設定されています')
    process.exit(0)
  }
}

main()

