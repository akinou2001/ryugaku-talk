import { supabase } from './supabase'
import type { User } from './supabase'
import { SEARCH_LIMITS, VALIDATION } from '@/config/constants'

/**
 * 質問内容に近い経験を持つユーザーを検索
 */
export async function findSimilarUsers(
  query: string,
  limit: number = SEARCH_LIMITS.SIMILAR_USERS
): Promise<User[]> {
  try {
    // キーワードを抽出
    const keywords = query
      .split(/\s+/)
      .filter(word => word.length > VALIDATION.MIN_KEYWORD_LENGTH)
      .slice(0, SEARCH_LIMITS.MAX_KEYWORDS)

    if (keywords.length === 0) {
      return []
    }

    // 留学先、大学、専攻、bioで検索
    const searchConditions = keywords.map(keyword => 
      `study_abroad_destination.ilike.%${keyword}%,university.ilike.%${keyword}%,major.ilike.%${keyword}%,bio.ilike.%${keyword}%`
    ).join(',')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(searchConditions)
      .eq('is_active', true)
      .order('contribution_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error finding similar users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in findSimilarUsers:', error)
    return []
  }
}

