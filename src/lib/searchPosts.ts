import { supabase } from './supabase'
import type { Post } from './supabase'

/**
 * 過去の投稿を検索して、質問に関連する投稿を返す
 */
export async function searchRelevantPosts(
  query: string,
  limit: number = 10
): Promise<Post[]> {
  try {
    // タイトルとコンテンツで検索
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(name, account_type, verification_status, organization_name, icon_url)
      `)
      .is('community_id', null) // コミュニティ限定投稿は除外
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching posts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchRelevantPosts:', error)
    return []
  }
}

/**
 * 質問に関連する投稿を取得（より高度な検索）
 */
export async function findRelevantPostsForQuery(
  query: string,
  topK: number = 5
): Promise<Post[]> {
  try {
    // キーワードを抽出（簡単な実装）
    const keywords = query
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5) // 最大5つのキーワード

    if (keywords.length === 0) {
      return []
    }

    // 各キーワードで検索
    const searchQueries = keywords.map(keyword => 
      `title.ilike.%${keyword}%,content.ilike.%${keyword}%`
    ).join(',')

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(name, account_type, verification_status, organization_name, icon_url)
      `)
      .is('community_id', null)
      .or(searchQueries)
      .order('likes_count', { ascending: false }) // いいね数でソート
      .order('comments_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(topK)

    if (error) {
      console.error('Error finding relevant posts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in findRelevantPostsForQuery:', error)
    return []
  }
}

