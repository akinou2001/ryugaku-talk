#!/usr/bin/env node

/**
 * 大学データインポートスクリプト
 * Hipo/university-domains-listから大学情報を抽出してSupabaseに投入
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { normalizeUniversityName } from '../src/lib/university-normalizer'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  console.error('   NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 国名 → 国コードマッピング
const countryNameToCode: Record<string, string> = {
  // North America
  'United States': 'US',
  'United States of America': 'US',
  'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Puerto Rico': 'PR',
  'Dominican Republic': 'DO',
  'Costa Rica': 'CR',
  'El Salvador': 'SV',
  'Guatemala': 'GT',
  'Panama': 'PA',
  'Cuba': 'CU',
  'Jamaica': 'JM',
  'Haiti': 'HT',
  'Honduras': 'HN',
  'Nicaragua': 'NI',
  'Belize': 'BZ',
  'Trinidad and Tobago': 'TT',
  'Bahamas': 'BS',
  'Barbados': 'BB',
  
  // Asia
  'Japan': 'JP',
  'China': 'CN',
  'Korea, Republic of': 'KR',
  'Korea, Democratic People\'s Republic of': 'KP',
  'South Korea': 'KR',
  'Korea': 'KR',
  'Singapore': 'SG',
  'Viet Nam': 'VN',
  'Vietnam': 'VN',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'India': 'IN',
  'Taiwan, Province of China': 'TW',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Macao': 'MO',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'Afghanistan': 'AF',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  'Kuwait': 'KW',
  'Qatar': 'QA',
  'Oman': 'OM',
  'Bahrain': 'BH',
  'Yemen': 'YE',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Syrian Arab Republic': 'SY',
  'Palestine, State of': 'PS',
  'Israel': 'IL',
  'Turkiye': 'TR',
  'Turkey': 'TR',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'Azerbaijan': 'AZ',
  'Armenia': 'AM',
  'Georgia': 'GE',
  'Kyrgyzstan': 'KG',
  'Tajikistan': 'TJ',
  'Turkmenistan': 'TM',
  'Mongolia': 'MN',
  'Cambodia': 'KH',
  'Lao People\'s Democratic Republic': 'LA',
  'Laos': 'LA',
  'Myanmar': 'MM',
  'Brunei Darussalam': 'BN',
  'Maldives': 'MV',
  'Bhutan': 'BT',
  
  // Europe
  'United Kingdom': 'GB',
  'UK': 'GB',
  'France': 'FR',
  'Germany': 'DE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Ireland': 'IE',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Russian Federation': 'RU',
  'Russia': 'RU',
  'Ukraine': 'UA',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Hungary': 'HU',
  'Czech Republic': 'CZ',
  'Slovakia': 'SK',
  'Croatia': 'HR',
  'Serbia': 'RS',
  'Slovenia': 'SI',
  'Bosnia and Herzegovina': 'BA',
  'Albania': 'AL',
  'North Macedonia': 'MK',
  'Moldova, Republic of': 'MD',
  'Belarus': 'BY',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Iceland': 'IS',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Liechtenstein': 'LI',
  'Monaco': 'MC',
  'San Marino': 'SM',
  'Andorra': 'AD',
  'Montenegro': 'ME',
  'Kosovo': 'XK',
  
  // Oceania
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Fiji': 'FJ',
  'Papua New Guinea': 'PG',
  'Samoa': 'WS',
  'French Polynesia': 'PF',
  'New Caledonia': 'NC',
  'Guam': 'GU',
  'French Guiana': 'GF',
  'Greenland': 'GL',
  'Faroe Islands': 'FO',
  'Réunion': 'RE',
  'Niue': 'NU',
  'Saint Kitts and Nevis': 'KN',
  
  // South America
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Venezuela, Bolivarian Republic of': 'VE',
  'Venezuela': 'VE',
  'Ecuador': 'EC',
  'Bolivia, Plurinational State of': 'BO',
  'Bolivia': 'BO',
  'Paraguay': 'PY',
  'Uruguay': 'UY',
  'Guyana': 'GY',
  'Suriname': 'SR',
  
  // Africa
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Kenya': 'KE',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Uganda': 'UG',
  'Tanzania, United Republic of': 'TZ',
  'Tanzania': 'TZ',
  'Ethiopia': 'ET',
  'Sudan': 'SD',
  'Morocco': 'MA',
  'Algeria': 'DZ',
  'Tunisia': 'TN',
  'Libya': 'LY',
  'Senegal': 'SN',
  'Cameroon': 'CM',
  'Côte d\'Ivoire': 'CI',
  'Ivory Coast': 'CI',
  'Madagascar': 'MG',
  'Mozambique': 'MZ',
  'Zimbabwe': 'ZW',
  'Zambia': 'ZM',
  'Malawi': 'MW',
  'Rwanda': 'RW',
  'Somalia': 'SO',
  'Guinea': 'GN',
  'Sierra Leone': 'SL',
  'Burkina Faso': 'BF',
  'Niger': 'NE',
  'Mali': 'ML',
  'Chad': 'TD',
  'Mauritania': 'MR',
  'Eritrea': 'ER',
  'Gambia': 'GM',
  'Botswana': 'BW',
  'Namibia': 'NA',
  'Gabon': 'GA',
  'Lesotho': 'LS',
  'Guinea-Bissau': 'GW',
  'Equatorial Guinea': 'GQ',
  'Mauritius': 'MU',
  'Eswatini': 'SZ',
  'Swaziland': 'SZ',
  'Djibouti': 'DJ',
  'Congo': 'CG',
  'Congo, the Democratic Republic of the': 'CD',
  'Central African Republic': 'CF',
  'Angola': 'AO',
  'Cape Verde': 'CV',
  'Seychelles': 'SC',
  'Burundi': 'BI',
  'Liberia': 'LR',
  'Benin': 'BJ',
  'Togo': 'TG',
}

// 大陸マッピング（国コード → 大陸名）
const continentMapping: Record<string, string> = {
  // North America
  'US': 'North America',
  'CA': 'North America',
  'MX': 'North America',
  'PR': 'North America',
  'DO': 'North America',
  'CR': 'North America',
  'SV': 'North America',
  'GT': 'North America',
  'PA': 'North America',
  'CU': 'North America',
  'JM': 'North America',
  'HT': 'North America',
  'HN': 'North America',
  'NI': 'North America',
  'BZ': 'North America',
  'TT': 'North America',
  'BS': 'North America',
  'BB': 'North America',
  'AG': 'North America', // Antigua and Barbuda
  'VG': 'North America', // British Virgin Islands
  'KY': 'North America', // Cayman Islands
  'BM': 'North America', // Bermuda
  'GD': 'North America', // Grenada
  'LC': 'North America', // Saint Lucia
  'VC': 'North America', // Saint Vincent and the Grenadines
  'KN': 'North America', // Saint Kitts and Nevis
  'DM': 'North America', // Dominica
  'MS': 'North America', // Montserrat
  'TC': 'North America', // Turks and Caicos Islands
  
  // Asia
  'JP': 'Asia',
  'CN': 'Asia',
  'KR': 'Asia',
  'KP': 'Asia',
  'SG': 'Asia',
  'VN': 'Asia',
  'TH': 'Asia',
  'MY': 'Asia',
  'ID': 'Asia',
  'PH': 'Asia',
  'IN': 'Asia',
  'TW': 'Asia',
  'HK': 'Asia',
  'MO': 'Asia',
  'PK': 'Asia',
  'BD': 'Asia',
  'LK': 'Asia',
  'NP': 'Asia',
  'AF': 'Asia',
  'IR': 'Asia',
  'IQ': 'Asia',
  'SA': 'Asia',
  'AE': 'Asia',
  'KW': 'Asia',
  'QA': 'Asia',
  'OM': 'Asia',
  'BH': 'Asia',
  'YE': 'Asia',
  'JO': 'Asia',
  'LB': 'Asia',
  'SY': 'Asia',
  'PS': 'Asia',
  'IL': 'Asia',
  'TR': 'Asia',
  'KZ': 'Asia',
  'UZ': 'Asia',
  'AZ': 'Asia',
  'AM': 'Asia',
  'GE': 'Asia',
  'KG': 'Asia',
  'TJ': 'Asia',
  'TM': 'Asia',
  'MN': 'Asia',
  'KH': 'Asia',
  'LA': 'Asia',
  'MM': 'Asia',
  'BN': 'Asia',
  'MV': 'Asia',
  'BT': 'Asia',
  
  // Europe
  'GB': 'Europe',
  'FR': 'Europe',
  'DE': 'Europe',
  'ES': 'Europe',
  'IT': 'Europe',
  'NL': 'Europe',
  'BE': 'Europe',
  'CH': 'Europe',
  'AT': 'Europe',
  'SE': 'Europe',
  'NO': 'Europe',
  'DK': 'Europe',
  'FI': 'Europe',
  'PL': 'Europe',
  'IE': 'Europe',
  'PT': 'Europe',
  'GR': 'Europe',
  'RU': 'Europe',
  'UA': 'Europe',
  'RO': 'Europe',
  'BG': 'Europe',
  'HU': 'Europe',
  'CZ': 'Europe',
  'SK': 'Europe',
  'HR': 'Europe',
  'RS': 'Europe',
  'SI': 'Europe',
  'BA': 'Europe',
  'AL': 'Europe',
  'MK': 'Europe',
  'MD': 'Europe',
  'BY': 'Europe',
  'EE': 'Europe',
  'LV': 'Europe',
  'LT': 'Europe',
  'IS': 'Europe',
  'LU': 'Europe',
  'MT': 'Europe',
  'CY': 'Europe',
  'LI': 'Europe',
  'MC': 'Europe',
  'SM': 'Europe',
  'AD': 'Europe',
  'ME': 'Europe',
  'XK': 'Europe',
  
  // Oceania
  'AU': 'Oceania',
  'NZ': 'Oceania',
  'FJ': 'Oceania',
  'PG': 'Oceania',
  'WS': 'Oceania',
  'PF': 'Oceania',
  'NC': 'Oceania',
  'GU': 'Oceania',
  'GF': 'South America', // French Guiana
  'GL': 'North America', // Greenland
  'FO': 'Europe', // Faroe Islands
  'NU': 'Oceania', // Niue
  'VA': 'Europe', // Vatican City
  'ST': 'Africa', // São Tomé and Príncipe
  'KM': 'Africa', // Comoros
  'GP': 'North America', // Guadeloupe
  'MQ': 'North America', // Martinique
  'PM': 'North America', // Saint Pierre and Miquelon
  
  // South America
  'BR': 'South America',
  'AR': 'South America',
  'CL': 'South America',
  'CO': 'South America',
  'PE': 'South America',
  'VE': 'South America',
  'EC': 'South America',
  'BO': 'South America',
  'PY': 'South America',
  'UY': 'South America',
  'GY': 'South America',
  'SR': 'South America',
  
  // Africa
  'ZA': 'Africa',
  'EG': 'Africa',
  'KE': 'Africa',
  'NG': 'Africa',
  'GH': 'Africa',
  'UG': 'Africa',
  'TZ': 'Africa',
  'ET': 'Africa',
  'SD': 'Africa',
  'MA': 'Africa',
  'DZ': 'Africa',
  'TN': 'Africa',
  'LY': 'Africa',
  'SN': 'Africa',
  'CM': 'Africa',
  'CI': 'Africa',
  'MG': 'Africa',
  'MZ': 'Africa',
  'ZW': 'Africa',
  'ZM': 'Africa',
  'MW': 'Africa',
  'RW': 'Africa',
  'SO': 'Africa',
  'GN': 'Africa',
  'SL': 'Africa',
  'BF': 'Africa',
  'NE': 'Africa',
  'ML': 'Africa',
  'TD': 'Africa',
  'MR': 'Africa',
  'ER': 'Africa',
  'GM': 'Africa',
  'BW': 'Africa',
  'NA': 'Africa',
  'GA': 'Africa',
  'LS': 'Africa',
  'GW': 'Africa',
  'GQ': 'Africa',
  'MU': 'Africa',
  'SZ': 'Africa',
  'DJ': 'Africa',
  'RE': 'Africa',
  'CG': 'Africa',
  'CD': 'Africa',
  'CF': 'Africa',
  'AO': 'Africa',
  'CV': 'Africa',
  'SC': 'Africa',
  'BI': 'Africa',
  'LR': 'Africa',
  'BJ': 'Africa',
  'TG': 'Africa',
}

// 追加の小さな島国・地域のマッピング
const additionalCountryMappings: Record<string, string> = {
  'Holy See (Vatican City State)': 'VA',
  'Vatican City': 'VA',
  'Kosovo': 'XK',
  'Palestine, State of': 'PS',
  'Taiwan, Province of China': 'TW',
  'Korea, Republic of': 'KR',
  'Korea, Democratic People\'s Republic of': 'KP',
  'Venezuela, Bolivarian Republic of': 'VE',
  'Bolivia, Plurinational State of': 'BO',
  'Tanzania, United Republic of': 'TZ',
  'Congo, the Democratic Republic of the': 'CD',
  'Syrian Arab Republic': 'SY',
  'Lao People\'s Democratic Republic': 'LA',
  'Brunei Darussalam': 'BN',
  'Moldova, Republic of': 'MD',
  'North Macedonia': 'MK',
  'Côte d\'Ivoire': 'CI',
  'Guinea-Bissau': 'GW',
  'São Tomé and Príncipe': 'ST',
  'Comoros': 'KM',
  'Antigua and Barbuda': 'AG',
  'Bermuda': 'BM',
  'Cayman Islands': 'KY',
  'Dominica': 'DM',
  'Grenada': 'GD',
  'Guadeloupe': 'GP',
  'Martinique': 'MQ',
  'Saint Pierre and Miquelon': 'PM',
  'French Guiana': 'GF',
  'Greenland': 'GL',
  'Faroe Islands': 'FO',
  'Niue': 'NU',
  'British Virgin Islands': 'VG',
  'Virgin Islands, British': 'VG',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Saint Kitts and Nevis': 'KN',
  'Montserrat': 'MS',
  'Turks and Caicos Islands': 'TC',
}

interface UniversityData {
  name: string
  country: string
  domains?: string[]
  web_pages?: string[]
}

interface Continent {
  id: number
  name_en: string
}

/**
 * 大陸マスタを取得
 */
async function getContinents(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('continents')
    .select('id, name_en')

  if (error) {
    throw new Error(`大陸データの取得に失敗しました: ${error.message}`)
  }

  const map = new Map<string, number>()
  data?.forEach((c: Continent) => {
    map.set(c.name_en, c.id)
  })

  return map
}

/**
 * Hipo/university-domains-listからデータを取得
 */
async function fetchUniversityData(): Promise<UniversityData[]> {
  try {
    console.log('📥 大学データを取得中...')
    
    // GitHubのraw URLからデータを取得
    const response = await fetch('https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json')
    
    if (!response.ok) {
      throw new Error(`データ取得に失敗しました: ${response.statusText}`)
    }

    const data = await response.json() as UniversityData[]
    console.log(`✅ ${data.length}校のデータを取得しました`)
    
    return data
  } catch (error: any) {
    console.error('❌ データ取得エラー:', error.message)
    throw error
  }
}


/**
 * 大学データをSupabaseに投入
 */
async function importUniversities(universities: UniversityData[], continents: Map<string, number>) {
  console.log(`\n📤 ${universities.length}校のデータを投入中...`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  let skipReasons = {
    noContinentMapping: 0,
    noContinentId: 0,
    duplicate: 0
  }

  // バッチ処理（100件ずつ）
  const batchSize = 100
  const totalBatches = Math.ceil(universities.length / batchSize)
  
  // バッチ内での重複を防ぐためのSet
  const batchKeySet = new Set<string>()
  
  for (let i = 0; i < universities.length; i += batchSize) {
    const batch = universities.slice(i, i + batchSize)
    const batchData = []
    const currentBatch = Math.floor(i / batchSize) + 1
    batchKeySet.clear() // バッチごとにSetをクリア

    for (const uni of batch) {
      // 国名から国コードに変換（既にコードの場合はそのまま）
      let countryCode = uni.country
      
      // まず追加マッピングを確認
      if (additionalCountryMappings[countryCode]) {
        countryCode = additionalCountryMappings[countryCode]
      } else if (countryNameToCode[countryCode]) {
        countryCode = countryNameToCode[countryCode]
      } else {
        // 大文字に変換して試す
        countryCode = countryCode.toUpperCase()
        if (!countryNameToCode[countryCode] && !additionalCountryMappings[countryCode] && !continentMapping[countryCode]) {
          // 国名でも国コードでもない場合はスキップ
          skipCount++
          skipReasons.noContinentMapping++
          if (skipReasons.noContinentMapping <= 10) {
            console.log(`  ⚠️  大陸マッピングなし: ${uni.name} (${uni.country})`)
          }
          continue
        }
      }
      
      const continentName = continentMapping[countryCode]
      if (!continentName) {
        skipCount++
        skipReasons.noContinentMapping++
        if (skipReasons.noContinentMapping <= 5) {
          console.log(`  ⚠️  大陸マッピングなし: ${uni.name} (${uni.country} → ${countryCode})`)
        }
        continue
      }

      const continentId = continents.get(continentName)
      if (!continentId) {
        skipCount++
        skipReasons.noContinentId++
        continue
      }

      // 同じバッチ内での重複をチェック（ON CONFLICTエラーを防ぐため）
      const batchKey = `${uni.name}|${countryCode}`
      if (batchKeySet.has(batchKey)) {
        skipCount++
        skipReasons.duplicate++
        continue
      }
      batchKeySet.add(batchKey)

      // バッチデータに追加
      batchData.push({
        country_code: countryCode,
        continent_id: continentId,
        name_en: uni.name,
        normalized_name: normalizeUniversityName(uni.name),
        name_ja: null, // 後から管理画面で追加
        city: null,
        latitude: null,
        longitude: null,
        website: uni.web_pages?.[0] || null,
        tags: [],
      })
    }

    if (batchData.length > 0) {
      // upsertを使用して、name_en と country_code が重複していたら無視する
      // これにより、1件ずつの重複チェックが不要になり、大幅に高速化
      // PostgreSQLの複数列ユニーク制約（universities_name_en_country_code_unique）を利用
      // Supabaseのupsertは、ユニーク制約を自動的に検出して使用する
      const { data: insertedData, error } = await supabase
        .from('universities')
        .upsert(batchData, { 
          onConflict: 'name_en,country_code' // 複数列のユニーク制約を指定（PostgreSQLのON CONFLICT句）
        })
        .select()

      if (error) {
        // 重複エラー（23505）の場合は、スキップとしてカウント
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
          skipCount += batchData.length
          skipReasons.duplicate += batchData.length
          const progress = ((currentBatch / totalBatches) * 100).toFixed(1)
          console.log(`⏭️  バッチ ${currentBatch}/${totalBatches} は全て重複のためスキップ (${progress}%)`)
        } else {
          console.error(`❌ バッチ ${currentBatch}/${totalBatches} の投入に失敗:`, error.message)
          errorCount += batchData.length
        }
      } else {
        // 実際に挿入された件数をカウント（重複でスキップされたものは含まれない）
        const insertedCount = insertedData?.length || 0
        const skippedInBatch = batchData.length - insertedCount
        
        successCount += insertedCount
        if (skippedInBatch > 0) {
          skipCount += skippedInBatch
          skipReasons.duplicate += skippedInBatch
        }
        
        const progress = ((currentBatch / totalBatches) * 100).toFixed(1)
        if (insertedCount > 0) {
          console.log(`✅ ${successCount}校を投入しました (${currentBatch}/${totalBatches} バッチ, ${progress}%, このバッチで${insertedCount}校新規${skippedInBatch > 0 ? `, ${skippedInBatch}校重複スキップ` : ''})`)
        }
      }
    }
  }

  console.log(`\n📊 投入結果:`)
  console.log(`  ✅ 成功: ${successCount}校`)
  console.log(`  ⏭️  スキップ: ${skipCount}校`)
  if (skipCount > 0) {
    console.log(`     - 大陸マッピングなし: ${skipReasons.noContinentMapping}校`)
    console.log(`     - 大陸ID取得失敗: ${skipReasons.noContinentId}校`)
    console.log(`     - 重複: ${skipReasons.duplicate}校`)
  }
  console.log(`  ❌ エラー: ${errorCount}校`)
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🚀 大学データインポートを開始します...\n')

    // 大陸マスタを取得
    console.log('🌍 大陸マスタを取得中...')
    const continents = await getContinents()
    if (continents.size === 0) {
      throw new Error('大陸マスタが存在しません。先にsupabase-schema-universities.sqlを実行してください。')
    }
    console.log(`✅ ${continents.size}つの大陸を取得しました\n`)

    // 大学データを取得
    const allUniversities = await fetchUniversityData()
    console.log(`\n📊 全${allUniversities.length}校のデータをインポートします\n`)

    // データを投入（全ての大学）
    await importUniversities(allUniversities, continents)

    console.log('\n✨ インポートが完了しました！')
  } catch (error: any) {
    console.error('\n❌ エラーが発生しました:', error.message)
    process.exit(1)
  }
}

main()

