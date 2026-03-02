'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { Post } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import type { University } from '@/lib/universities'
import type { UserPostData, MapComponentProps } from '@/lib/mapUtils'
import { getCategoryStyle, getOffsetCoordinates } from '@/lib/mapUtils'
import { getCountryCoordinates, countryCoordinates } from '@/lib/countryCoordinates'
import * as THREE from 'three'

// ─── Mono White カラー定数 ────────────────────────
// 2D マップ (CARTO light_all) に近いカラーパレット
const COLORS = {
  bgColor: '#f2f0eb',
  globeBg: 'rgba(242, 240, 235, 1)',
  seaColor: '#c6d8de',
  atmosphereColor: '#b8c8d0',
  landDefault: 'rgba(238, 236, 230, 0.9)',
  landDefaultHover: 'rgba(220, 218, 212, 0.95)',
  landActive: 'rgba(180, 190, 200, 0.6)',
  landActiveMid: 'rgba(150, 165, 180, 0.7)',
  landActiveHigh: 'rgba(120, 140, 160, 0.8)',
  landActiveHover: 'rgba(90, 110, 135, 0.85)',
  polygonStroke: 'rgba(180, 180, 175, 0.3)',
  polygonSide: 'rgba(238, 236, 230, 0.15)',
  labelColor: 'rgba(51, 65, 85, 0.9)',
  labelColorDim: 'rgba(51, 65, 85, 0.25)',
  hoverBg: 'rgba(245, 243, 238, 0.95)',
  hoverText: '#334155',
} as const

// ─── GeoJSON types ────────────────────────────────
interface GeoFeature {
  type: string
  properties: {
    NAME?: string
    NAME_JA?: string
    ADMIN?: string
    ISO_A2?: string
    ISO_A3?: string
    [key: string]: any
  }
  geometry: any
}

interface GeoJSON {
  type: string
  features: GeoFeature[]
}

// ─── 国名マッピング ───────────────────────────────
const countryNameMap: Record<string, string> = {
  'United States of America': 'アメリカ',
  'Canada': 'カナダ',
  'Mexico': 'メキシコ',
  'United Kingdom': 'イギリス',
  'Germany': 'ドイツ',
  'France': 'フランス',
  'Spain': 'スペイン',
  'Italy': 'イタリア',
  'Netherlands': 'オランダ',
  'Switzerland': 'スイス',
  'Sweden': 'スウェーデン',
  'Norway': 'ノルウェー',
  'Denmark': 'デンマーク',
  'Finland': 'フィンランド',
  'Poland': 'ポーランド',
  'Austria': 'オーストリア',
  'Belgium': 'ベルギー',
  'Portugal': 'ポルトガル',
  'Greece': 'ギリシャ',
  'Czechia': 'チェコ',
  'Czech Republic': 'チェコ',
  'Hungary': 'ハンガリー',
  'Ireland': 'アイルランド',
  'Japan': '日本',
  'South Korea': '韓国',
  'Korea': '韓国',
  'Republic of Korea': '韓国',
  'China': '中国',
  'Taiwan': '台湾',
  'Singapore': 'シンガポール',
  'Thailand': 'タイ',
  'Malaysia': 'マレーシア',
  'Indonesia': 'インドネシア',
  'Philippines': 'フィリピン',
  'Vietnam': 'ベトナム',
  'Viet Nam': 'ベトナム',
  'India': 'インド',
  'Australia': 'オーストラリア',
  'New Zealand': 'ニュージーランド',
  'Brazil': 'ブラジル',
  'Argentina': 'アルゼンチン',
  'Chile': 'チリ',
  'South Africa': '南アフリカ',
  'Egypt': 'エジプト',
  'Turkey': 'トルコ',
  'Türkiye': 'トルコ',
  'Russia': 'ロシア',
  'United Arab Emirates': 'アラブ首長国連邦',
  'Saudi Arabia': 'サウジアラビア',
  'Israel': 'イスラエル',
  'Hong Kong': '香港',
  'N. Cyprus': '北キプロス',
  'Somaliland': 'ソマリランド',
}

const isoNumericToJa: Record<string, string> = {
  '840': 'アメリカ', '124': 'カナダ', '484': 'メキシコ',
  '826': 'イギリス', '276': 'ドイツ', '250': 'フランス',
  '724': 'スペイン', '380': 'イタリア', '528': 'オランダ',
  '756': 'スイス', '752': 'スウェーデン', '578': 'ノルウェー',
  '208': 'デンマーク', '246': 'フィンランド', '616': 'ポーランド',
  '040': 'オーストリア', '056': 'ベルギー', '620': 'ポルトガル',
  '300': 'ギリシャ', '203': 'チェコ', '348': 'ハンガリー',
  '372': 'アイルランド', '392': '日本', '410': '韓国',
  '156': '中国', '158': '台湾', '702': 'シンガポール',
  '764': 'タイ', '458': 'マレーシア', '360': 'インドネシア',
  '608': 'フィリピン', '704': 'ベトナム', '356': 'インド',
  '036': 'オーストラリア', '554': 'ニュージーランド',
  '076': 'ブラジル', '032': 'アルゼンチン', '152': 'チリ',
  '710': '南アフリカ', '818': 'エジプト', '792': 'トルコ',
  '643': 'ロシア', '784': 'アラブ首長国連邦', '682': 'サウジアラビア',
  '376': 'イスラエル', '344': '香港',
}

// ISO 3166-1 alpha-2 → 日本語名 (全世界カバー)
const isoA2ToJa: Record<string, string> = {
  US: 'アメリカ', CA: 'カナダ', MX: 'メキシコ', GB: 'イギリス',
  DE: 'ドイツ', FR: 'フランス', ES: 'スペイン', IT: 'イタリア',
  NL: 'オランダ', CH: 'スイス', SE: 'スウェーデン', NO: 'ノルウェー',
  DK: 'デンマーク', FI: 'フィンランド', PL: 'ポーランド', AT: 'オーストリア',
  BE: 'ベルギー', PT: 'ポルトガル', GR: 'ギリシャ', CZ: 'チェコ',
  HU: 'ハンガリー', IE: 'アイルランド', JP: '日本', KR: '韓国',
  CN: '中国', TW: '台湾', SG: 'シンガポール', TH: 'タイ',
  MY: 'マレーシア', ID: 'インドネシア', PH: 'フィリピン', VN: 'ベトナム',
  IN: 'インド', AU: 'オーストラリア', NZ: 'ニュージーランド',
  BR: 'ブラジル', AR: 'アルゼンチン', CL: 'チリ', ZA: '南アフリカ',
  EG: 'エジプト', TR: 'トルコ', RU: 'ロシア', AE: 'アラブ首長国連邦',
  SA: 'サウジアラビア', IL: 'イスラエル', HK: '香港',
  AF: 'アフガニスタン', AM: 'アルメニア', AZ: 'アゼルバイジャン',
  BD: 'バングラデシュ', BN: 'ブルネイ', BT: 'ブータン', KH: 'カンボジア',
  GE: 'ジョージア', IQ: 'イラク', IR: 'イラン', JO: 'ヨルダン',
  KZ: 'カザフスタン', KG: 'キルギス', KW: 'クウェート', LA: 'ラオス',
  LB: 'レバノン', MN: 'モンゴル', MM: 'ミャンマー', NP: 'ネパール',
  KP: '北朝鮮', OM: 'オマーン', PK: 'パキスタン', PS: 'パレスチナ',
  QA: 'カタール', LK: 'スリランカ', SY: 'シリア', TJ: 'タジキスタン',
  TL: '東ティモール', TM: 'トルクメニスタン', UZ: 'ウズベキスタン',
  YE: 'イエメン', XK: 'コソボ',
  AL: 'アルバニア', BY: 'ベラルーシ', BA: 'ボスニア・ヘルツェゴビナ',
  BG: 'ブルガリア', HR: 'クロアチア', CY: 'キプロス', EE: 'エストニア',
  IS: 'アイスランド', LV: 'ラトビア', LT: 'リトアニア', LU: 'ルクセンブルク',
  MK: '北マケドニア', MD: 'モルドバ', ME: 'モンテネグロ', RO: 'ルーマニア',
  RS: 'セルビア', SK: 'スロバキア', SI: 'スロベニア', UA: 'ウクライナ',
  DZ: 'アルジェリア', AO: 'アンゴラ', BJ: 'ベナン', BW: 'ボツワナ',
  BF: 'ブルキナファソ', BI: 'ブルンジ', CM: 'カメルーン', CF: '中央アフリカ',
  TD: 'チャド', CG: 'コンゴ共和国', CD: 'コンゴ民主共和国', CI: 'コートジボワール',
  DJ: 'ジブチ', GQ: '赤道ギニア', ER: 'エリトリア', ET: 'エチオピア',
  GA: 'ガボン', GM: 'ガンビア', GH: 'ガーナ', GN: 'ギニア',
  GW: 'ギニアビサウ', KE: 'ケニア', LS: 'レソト', LR: 'リベリア',
  LY: 'リビア', MG: 'マダガスカル', MW: 'マラウイ', ML: 'マリ',
  MR: 'モーリタニア', MA: 'モロッコ', MZ: 'モザンビーク', NA: 'ナミビア',
  NE: 'ニジェール', NG: 'ナイジェリア', RW: 'ルワンダ', SN: 'セネガル',
  SL: 'シエラレオネ', SO: 'ソマリア', SS: '南スーダン', SD: 'スーダン',
  SZ: 'エスワティニ', TZ: 'タンザニア', TG: 'トーゴ', TN: 'チュニジア',
  UG: 'ウガンダ', EH: '西サハラ', ZM: 'ザンビア', ZW: 'ジンバブエ',
  BS: 'バハマ', BZ: 'ベリーズ', BO: 'ボリビア', CO: 'コロンビア',
  CR: 'コスタリカ', CU: 'キューバ', DO: 'ドミニカ共和国', EC: 'エクアドル',
  SV: 'エルサルバドル', GT: 'グアテマラ', GY: 'ガイアナ', HT: 'ハイチ',
  HN: 'ホンジュラス', JM: 'ジャマイカ', NI: 'ニカラグア', PA: 'パナマ',
  PY: 'パラグアイ', PE: 'ペルー', PR: 'プエルトリコ', SR: 'スリナム',
  TT: 'トリニダード・トバゴ', UY: 'ウルグアイ', VE: 'ベネズエラ',
  FJ: 'フィジー', PG: 'パプアニューギニア', SB: 'ソロモン諸島', VU: 'バヌアツ',
  NC: 'ニューカレドニア',
  GL: 'グリーンランド', FK: 'フォークランド諸島', AQ: '南極', TF: '仏領南方・南極地域',
}

function getJapaneseName(feature: GeoFeature): string | null {
  const name = feature.properties?.NAME || feature.properties?.ADMIN || feature.properties?.name || ''
  if (name && countryNameMap[name]) return countryNameMap[name]
  const iso2 = feature.properties?.ISO_A2
  if (iso2 && iso2 !== '-99' && isoA2ToJa[iso2]) return isoA2ToJa[iso2]
  const id = (feature as any).id as string | undefined
  if (id && isoNumericToJa[id]) return isoNumericToJa[id]
  return null
}

// ─── GeoJSON 重心計算 ─────────────────────────────
function computeCentroid(geometry: any): { lat: number; lng: number } | null {
  let coords: number[][] = []

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0]
  } else if (geometry.type === 'MultiPolygon') {
    // 最大のポリゴン（座標点数が最も多い）の重心を使用
    let maxLen = 0
    for (const poly of geometry.coordinates) {
      if (poly[0].length > maxLen) {
        maxLen = poly[0].length
        coords = poly[0]
      }
    }
  }

  if (coords.length === 0) return null

  let sumLng = 0
  let sumLat = 0
  for (const coord of coords) {
    sumLng += coord[0]
    sumLat += coord[1]
  }

  return { lat: sumLat / coords.length, lng: sumLng / coords.length }
}

// SVGアイコン（カテゴリ別）
const categoryIcons: Record<string, string> = {
  question: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  diary: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
}

// ─── メインコンポーネント ──────────────────────────
export function GlobeOptionA({ posts, userPostData, onMarkerClick, selectedPostId }: MapComponentProps) {
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [GlobeComponent, setGlobeComponent] = useState<any>(null)
  const [countries, setCountries] = useState<GeoJSON | null>(null)
  const [hoverD, setHoverD] = useState<GeoFeature | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [universityCache, setUniversityCache] = useState<Map<string, University>>(new Map())
  const universityFetchedRef = useRef(false)

  // 海のマテリアル
  const globeMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(COLORS.seaColor),
      shininess: 15,
      transparent: false,
    })
  }, [])

  // 投稿がある国 + カウント（プロフィール or 投稿の留学先）
  const activeCountries = useMemo(() => {
    const set = new Set<string>()
    posts.forEach(p => {
      const dest = p.author?.study_abroad_destination || p.study_abroad_destination
      if (dest) set.add(dest)
    })
    return set
  }, [posts])

  const countryCounts = useMemo(() => {
    const map = new Map<string, number>()
    posts.forEach(p => {
      const dest = p.author?.study_abroad_destination || p.study_abroad_destination
      if (dest) map.set(dest, (map.get(dest) || 0) + 1)
    })
    return map
  }, [posts])

  // 大学座標をバッチ取得
  useEffect(() => {
    const universityIds = Array.from(new Set(
      posts.map(p => p.author?.study_abroad_university_id).filter((id): id is string => !!id)
    ))
    if (universityIds.length === 0 || universityFetchedRef.current) return
    universityFetchedRef.current = true

    supabase
      .from('universities')
      .select('*')
      .in('id', universityIds)
      .then(({ data }) => {
        if (data) {
          const cache = new Map<string, University>()
          data.forEach((uni: University) => cache.set(uni.id, uni))
          setUniversityCache(cache)
        }
      })
  }, [posts])

  // react-globe.gl を動的インポート
  useEffect(() => {
    import('react-globe.gl').then(mod => {
      setGlobeComponent(() => mod.default)
    })
  }, [])

  // GeoJSON を取得
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json()
      })
      .then(geoJson => setCountries(geoJson as GeoJSON))
      .catch(() => {
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
          .then(res => res.json())
          .then(worldData => {
            import('topojson-client').then(topojson => {
              setCountries(topojson.feature(worldData, worldData.objects.countries) as unknown as GeoJSON)
            })
          })
      })
  }, [])

  // マーカーエフェクト用CSSキーフレーム注入
  useEffect(() => {
    const styleId = 'globe-marker-fx'
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes globe-pulse {
        0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.7; }
        100% { transform: translate(-50%,-50%) scale(2.4);  opacity: 0; }
      }
      @keyframes globe-sparkle {
        0%,100% { opacity: 0; transform: translate(-50%,-50%) scale(0) rotate(0deg); }
        50%     { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(180deg); }
      }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])

  // コンテナサイズを監視
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // 国ポリゴンの色
  const getPolygonCapColor = useCallback((d: object) => {
    const feat = d as GeoFeature
    const jaName = getJapaneseName(feat)
    const isHovered = feat === hoverD

    if (jaName && activeCountries.has(jaName)) {
      const count = countryCounts.get(jaName) || 0
      if (isHovered) return COLORS.landActiveHover
      if (count >= 5) return COLORS.landActiveHigh
      if (count >= 2) return COLORS.landActiveMid
      return COLORS.landActive
    }
    if (isHovered) return COLORS.landDefaultHover
    return COLORS.landDefault
  }, [hoverD, activeCountries, countryCounts])

  const getPolygonSideColor = useCallback(() => COLORS.polygonSide, [])
  const getPolygonStrokeColor = useCallback(() => COLORS.polygonStroke, [])

  // ─── ラベル+マーカーを統合した htmlElementsData ───
  type HtmlItem =
    | { type: 'label'; lat: number; lng: number; text: string; isActive: boolean; alt: number }
    | { type: 'marker'; lat: number; lng: number; userData: UserPostData; post: Post; alt: number }

  // GeoJSON 全国の重心座標を計算（countryCoordinatesの手動座標を優先）
  const countryCentroids = useMemo(() => {
    if (!countries) return new Map<string, { lat: number; lng: number }>()

    // countryCoordinates の日本語名 → 座標（手動で精度が高い）
    const manualCoords = new Map<string, { lat: number; lng: number }>()
    Object.entries(countryCoordinates).forEach(([jaName, coords]) => {
      manualCoords.set(jaName, coords)
    })

    const result = new Map<string, { lat: number; lng: number }>()

    for (const feature of countries.features) {
      const jaName = getJapaneseName(feature)
      if (!jaName) continue
      // 重複回避（同じ日本語名が複数featureにマッチする場合）
      if (result.has(jaName)) continue

      // 手動座標があればそちらを優先
      const manual = manualCoords.get(jaName)
      if (manual) {
        result.set(jaName, manual)
      } else {
        // GeoJSON ポリゴンから重心を計算
        const centroid = computeCentroid(feature.geometry)
        if (centroid) {
          result.set(jaName, centroid)
        }
      }
    }

    return result
  }, [countries])

  const htmlItems = useMemo(() => {
    const items: HtmlItem[] = []

    // 1) 全国の国名ラベル（GeoJSON重心 + countryCoordinates手動座標）
    countryCentroids.forEach((coords, jaName) => {
      const count = countryCounts.get(jaName) || 0
      const isActive = activeCountries.has(jaName)
      items.push({
        type: 'label',
        lat: coords.lat,
        lng: coords.lng,
        text: isActive ? `${jaName} (${count})` : jaName,
        isActive,
        alt: 0.01,
      })
    })

    // 2) ユーザーマーカー（大学座標優先、国座標フォールバック）
    if (userPostData && userPostData.length > 0) {
      const byCountry = new Map<string, UserPostData[]>()

      userPostData.forEach(ud => {
        const uniId = ud.user.study_abroad_university_id
        const uni = uniId ? universityCache.get(uniId) : null

        if (uni?.latitude != null && uni?.longitude != null) {
          items.push({ type: 'marker', lat: uni.latitude, lng: uni.longitude, userData: ud, post: ud.displayPost, alt: 0.04 })
        } else {
          // プロフィールの留学先を優先、なければ投稿の留学先をフォールバック
          const dest = ud.user.study_abroad_destination || ud.displayPost.study_abroad_destination
          if (!dest) return
          if (!byCountry.has(dest)) byCountry.set(dest, [])
          byCountry.get(dest)!.push(ud)
        }
      })

      byCountry.forEach((users, country) => {
        const baseCoords = getCountryCoordinates(country)
        if (!baseCoords) return
        users.forEach((ud, index) => {
          const offset = getOffsetCoordinates(baseCoords, index, users.length)
          items.push({ type: 'marker', lat: offset.lat, lng: offset.lng, userData: ud, post: ud.displayPost, alt: 0.04 })
        })
      })
    }

    return items
  }, [countryCentroids, userPostData, universityCache, activeCountries, countryCounts])

  if (!GlobeComponent) {
    return (
      <div className="flex items-center justify-center h-[60vh] min-h-[400px] rounded-2xl" style={{ background: COLORS.bgColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-500 mx-auto"></div>
          <p className="text-gray-500 mt-4 text-sm">Globe.gl を読み込み中...</p>
        </div>
      </div>
    )
  }

  const Globe = GlobeComponent

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[60vh] min-h-[400px] max-h-[800px] rounded-2xl overflow-hidden flex items-center justify-center"
      style={{ background: COLORS.bgColor }}
    >
      {/* Globe - 中央配置 */}
      <div style={{ width: dimensions.width, height: dimensions.height }}>
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={COLORS.globeBg}
          globeImageUrl=""
          globeMaterial={globeMaterial}
          showAtmosphere={true}
          atmosphereColor={COLORS.atmosphereColor}
          atmosphereAltitude={0.15}

          polygonsData={countries?.features || []}
          polygonGeoJsonGeometry={(d: object) => (d as GeoFeature).geometry}
          polygonCapColor={getPolygonCapColor}
          polygonSideColor={getPolygonSideColor}
          polygonStrokeColor={getPolygonStrokeColor}
          polygonAltitude={(d: object) => (d as GeoFeature) === hoverD ? 0.03 : 0.01}
          onPolygonHover={(d: object | null) => setHoverD(d as GeoFeature | null)}
          onPolygonClick={(d: object) => {
            const feat = d as GeoFeature
            const jaName = getJapaneseName(feat)
            if (jaName && activeCountries.has(jaName)) {
              const firstPost = posts.find(p =>
                (p.author?.study_abroad_destination === jaName) ||
                (p.study_abroad_destination === jaName)
              )
              if (firstPost && onMarkerClick) onMarkerClick(firstPost)
            }
          }}

          htmlElementsData={htmlItems}
          htmlLat={(d: object) => (d as any).lat}
          htmlLng={(d: object) => (d as any).lng}
          htmlAltitude={(d: object) => (d as any).alt}
          htmlElement={(d: object) => {
            const item = d as HtmlItem

            // ── 国名ラベル ──
            if (item.type === 'label') {
              const el = document.createElement('div')
              el.style.pointerEvents = 'none'
              el.style.userSelect = 'none'
              el.style.whiteSpace = 'nowrap'
              el.style.textAlign = 'center'
              el.style.transform = 'translate(-50%, -50%)'
              el.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

              if (item.isActive) {
                el.style.fontSize = '11px'
                el.style.fontWeight = '700'
                el.style.color = COLORS.labelColor
                el.style.textShadow = '0 0 4px rgba(242,240,235,0.9), 0 1px 2px rgba(0,0,0,0.08)'
                el.style.padding = '2px 6px'
                el.style.borderRadius = '4px'
                el.style.background = 'rgba(242,240,235,0.7)'
              } else {
                el.style.fontSize = '9px'
                el.style.fontWeight = '500'
                el.style.color = COLORS.labelColorDim
                el.style.textShadow = '0 0 3px rgba(242,240,235,0.8)'
              }

              el.textContent = item.text
              return el
            }

            // ── ユーザーマーカー ──
            const data = item as Extract<HtmlItem, { type: 'marker' }>
            const category = data.userData.displayType
            const catStyle = getCategoryStyle(category, data.post.urgency_level, data.post.is_resolved)

            const wrapper = document.createElement('div')
            wrapper.style.position = 'relative'
            wrapper.style.width = '32px'
            wrapper.style.height = '32px'
            wrapper.style.cursor = 'pointer'
            wrapper.style.pointerEvents = 'auto'
            wrapper.style.transition = 'transform 0.2s ease'
            wrapper.addEventListener('mouseenter', () => { wrapper.style.transform = 'scale(1.3)' })
            wrapper.addEventListener('mouseleave', () => { wrapper.style.transform = 'scale(1)' })

            const avatar = document.createElement('div')
            avatar.style.width = '32px'
            avatar.style.height = '32px'
            avatar.style.borderRadius = '50%'
            avatar.style.border = '2px solid white'
            avatar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
            avatar.style.overflow = 'hidden'
            avatar.style.background = catStyle.bgColor
            avatar.title = `${data.userData.user.name} - ${data.userData.user.study_abroad_destination || ''}`

            const avatarUrl = data.userData.user.icon_url
            if (avatarUrl) {
              const img = document.createElement('img')
              img.src = avatarUrl
              img.style.width = '100%'
              img.style.height = '100%'
              img.style.objectFit = 'cover'
              img.onerror = () => {
                img.remove()
                avatar.textContent = data.userData.user.name?.charAt(0) || '?'
                avatar.style.display = 'flex'
                avatar.style.alignItems = 'center'
                avatar.style.justifyContent = 'center'
                avatar.style.color = 'white'
                avatar.style.fontWeight = 'bold'
                avatar.style.fontSize = '12px'
              }
              avatar.appendChild(img)
            } else {
              avatar.textContent = data.userData.user.name?.charAt(0) || '?'
              avatar.style.display = 'flex'
              avatar.style.alignItems = 'center'
              avatar.style.justifyContent = 'center'
              avatar.style.color = 'white'
              avatar.style.fontWeight = 'bold'
              avatar.style.fontSize = '12px'
            }
            wrapper.appendChild(avatar)

            const badge = document.createElement('div')
            badge.style.position = 'absolute'
            badge.style.top = '-3px'
            badge.style.right = '-3px'
            badge.style.width = '14px'
            badge.style.height = '14px'
            badge.style.borderRadius = category === 'diary' ? '3px' : category === 'chat' ? '3px' : '50%'
            badge.style.background = catStyle.bgColor
            badge.style.border = '1.5px solid white'
            badge.style.display = 'flex'
            badge.style.alignItems = 'center'
            badge.style.justifyContent = 'center'
            badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
            badge.style.zIndex = '2'
            if (category === 'chat') badge.style.transform = 'rotate(45deg)'
            badge.innerHTML = `<div style="width:8px;height:8px;${category === 'chat' ? 'transform:rotate(-45deg);' : ''}">${categoryIcons[category] || categoryIcons.question}</div>`
            wrapper.appendChild(badge)

            // ── 緊急未解決パルス ──
            const isUrgentUnresolved =
              data.post.category === 'question' &&
              data.post.urgency_level === 'urgent' &&
              !data.post.is_resolved

            if (isUrgentUnresolved) {
              for (let i = 0; i < 2; i++) {
                const ring = document.createElement('div')
                ring.style.position = 'absolute'
                ring.style.top = '50%'
                ring.style.left = '50%'
                ring.style.width = '32px'
                ring.style.height = '32px'
                ring.style.borderRadius = '50%'
                ring.style.border = '2px solid #ef4444'
                ring.style.pointerEvents = 'none'
                ring.style.animation = `globe-pulse 2s ease-out ${i * 1}s infinite`
                wrapper.appendChild(ring)
              }
              // アバターのボーダーも赤に
              avatar.style.border = '2.5px solid #ef4444'
              avatar.style.boxShadow = '0 0 10px rgba(239,68,68,0.4), 0 2px 8px rgba(0,0,0,0.3)'
            }

            // ── 1時間以内キラキラ ──
            const postAge = Date.now() - new Date(data.post.created_at).getTime()
            const isRecent = postAge < 60 * 60 * 1000

            if (isRecent) {
              const sparkleAngles = [0, 72, 144, 216, 288]
              const radius = 22
              sparkleAngles.forEach((angle, i) => {
                const rad = (angle * Math.PI) / 180
                const x = 16 + Math.cos(rad) * radius
                const y = 16 + Math.sin(rad) * radius
                const sparkle = document.createElement('div')
                sparkle.textContent = '✦'
                sparkle.style.position = 'absolute'
                sparkle.style.left = `${x}px`
                sparkle.style.top = `${y}px`
                sparkle.style.fontSize = '9px'
                sparkle.style.color = '#fbbf24'
                sparkle.style.textShadow = '0 0 4px rgba(251,191,36,0.8)'
                sparkle.style.pointerEvents = 'none'
                sparkle.style.animation = `globe-sparkle 1.8s ease-in-out ${i * 0.36}s infinite`
                wrapper.appendChild(sparkle)
              })
            }

            wrapper.addEventListener('click', (e) => {
              e.stopPropagation()
              if (onMarkerClick) onMarkerClick(data.post)
            })
            return wrapper
          }}
        />
      </div>

      {/* ホバー国名表示 */}
      {hoverD && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md text-sm font-medium px-4 py-2 rounded-full border border-white/20"
          style={{ background: COLORS.hoverBg, color: COLORS.hoverText }}
        >
          {getJapaneseName(hoverD) || hoverD.properties?.NAME || hoverD.properties?.name || '不明'}
          {(() => {
            const ja = getJapaneseName(hoverD)
            const count = ja ? countryCounts.get(ja) : 0
            return count ? ` - ${count}件の投稿` : ''
          })()}
        </div>
      )}
    </div>
  )
}
