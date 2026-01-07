import { supabase } from './supabase'

// 型定義
export interface Continent {
  id: number
  name_en: string
  name_ja: string
  created_at: string
}

export interface University {
  id: string
  country_code: string
  continent_id: number | null
  continent?: Continent
  name_en: string
  name_ja: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  website: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface UniversityAlias {
  id: string
  university_id: string
  university?: University
  alias: string
  alias_type: 'abbreviation' | 'variant' | 'old_name' | 'other'
  created_at: string
}

export interface UniversitySearchOptions {
  query?: string
  countryCode?: string
  continentId?: number
  tags?: string[]
  limit?: number
  offset?: number
}

/**
 * 大陸一覧を取得
 */
export async function getContinents(): Promise<{ data: Continent[] | null; error: any }> {
  const { data, error } = await supabase
    .from('continents')
    .select('*')
    .order('name_ja')

  return { data, error }
}

/**
 * 大学を検索
 * エイリアスも含めて検索可能
 */
export async function searchUniversities(
  options: UniversitySearchOptions = {}
): Promise<{ data: University[] | null; error: any }> {
  const {
    query,
    countryCode,
    continentId,
    tags,
    limit = 50,
    offset = 0,
  } = options

  let queryBuilder = supabase
    .from('universities')
    .select(`
      *,
      continent:continents(*)
    `)

  // クエリ文字列で検索（エイリアスも含む）
  if (query) {
    // まずエイリアスで検索
    const { data: aliasResults } = await supabase
      .from('university_aliases')
      .select('university_id')
      .ilike('alias', `%${query}%`)

    const aliasUniversityIds = aliasResults?.map(a => a.university_id) || []

    // 大学名でも検索
    const { data: nameResults } = await supabase
      .from('universities')
      .select('id')
      .or(`name_en.ilike.%${query}%,name_ja.ilike.%${query}%`)

    const nameUniversityIds = nameResults?.map(u => u.id) || []

    // エイリアスと名前の結果を結合（重複を除去）
    const allIds = Array.from(new Set([...aliasUniversityIds, ...nameUniversityIds]))

    if (allIds.length > 0) {
      queryBuilder = queryBuilder.in('id', allIds)
    } else {
      // マッチするものがない場合は空の結果を返す
      return { data: [], error: null }
    }
  }

  // 国コードでフィルタ
  if (countryCode) {
    queryBuilder = queryBuilder.eq('country_code', countryCode)
  }

  // 大陸IDでフィルタ
  if (continentId) {
    queryBuilder = queryBuilder.eq('continent_id', continentId)
  }

  // タグでフィルタ
  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags)
  }

  // ソートとページネーション
  const { data, error } = await queryBuilder
    .order('name_ja', { ascending: true, nullsFirst: false })
    .order('name_en', { ascending: true })
    .range(offset, offset + limit - 1)

  return { data, error }
}

/**
 * 大学IDで取得
 */
export async function getUniversityById(
  id: string
): Promise<{ data: University | null; error: any }> {
  const { data, error } = await supabase
    .from('universities')
    .select(`
      *,
      continent:continents(*)
    `)
    .eq('id', id)
    .single()

  return { data, error }
}

/**
 * エイリアスから大学を検索
 */
export async function findUniversityByAlias(
  alias: string
): Promise<{ data: University | null; error: any }> {
  // まずエイリアステーブルで検索
  const { data: aliasData, error: aliasError } = await supabase
    .from('university_aliases')
    .select(`
      *,
      university:universities(
        *,
        continent:continents(*)
      )
    `)
    .ilike('alias', alias)
    .limit(1)
    .single()

  if (aliasError || !aliasData) {
    // エイリアスが見つからない場合は、大学名で直接検索
    const { data: universityData, error: universityError } = await supabase
      .from('universities')
      .select(`
        *,
        continent:continents(*)
      `)
      .or(`name_en.ilike.%${alias}%,name_ja.ilike.%${alias}%`)
      .limit(1)
      .single()

    return { data: universityData || null, error: universityError }
  }

  return { data: aliasData.university as University || null, error: null }
}

/**
 * 大学のエイリアス一覧を取得
 */
export async function getUniversityAliases(
  universityId: string
): Promise<{ data: UniversityAlias[] | null; error: any }> {
  const { data, error } = await supabase
    .from('university_aliases')
    .select('*')
    .eq('university_id', universityId)
    .order('alias_type')
    .order('alias')

  return { data, error }
}

/**
 * 国コード一覧を取得（大学が存在する国のみ）
 */
export async function getCountryCodes(): Promise<{ data: { country_code: string }[] | null; error: any }> {
  const { data, error } = await supabase
    .from('universities')
    .select('country_code')
    .order('country_code')

  // 重複を除去
  const uniqueCodes = data
    ? Array.from(new Set(data.map(d => d.country_code)))
        .map(code => ({ country_code: code }))
    : null

  return { data: uniqueCodes, error }
}

/**
 * 大学を追加（管理者用）
 */
export async function createUniversity(
  university: Omit<University, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: University | null; error: any }> {
  const { data, error } = await supabase
    .from('universities')
    .insert(university)
    .select(`
      *,
      continent:continents(*)
    `)
    .single()

  return { data, error }
}

/**
 * 大学を更新（管理者用）
 */
export async function updateUniversity(
  id: string,
  updates: Partial<Omit<University, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: University | null; error: any }> {
  const { data, error } = await supabase
    .from('universities')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      continent:continents(*)
    `)
    .single()

  return { data, error }
}

/**
 * 大学を削除（管理者用）
 */
export async function deleteUniversity(
  id: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * エイリアスを追加（管理者用）
 */
export async function createAlias(
  alias: Omit<UniversityAlias, 'id' | 'created_at'>
): Promise<{ data: UniversityAlias | null; error: any }> {
  const { data, error } = await supabase
    .from('university_aliases')
    .insert(alias)
    .select('*')
    .single()

  return { data, error }
}

/**
 * エイリアスを削除（管理者用）
 */
export async function deleteAlias(
  id: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('university_aliases')
    .delete()
    .eq('id', id)

  return { error }
}

