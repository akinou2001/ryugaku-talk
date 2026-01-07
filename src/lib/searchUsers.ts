import { supabase } from './supabase'
import type { User } from './supabase'

/**
 * 質問内容に近い経験を持つユーザーを検索
 */
export async function findSimilarUsers(
  query: string,
  limit: number = 5
): Promise<User[]> {
  try {
    // キーワードを抽出
    const keywords = query
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5)

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

