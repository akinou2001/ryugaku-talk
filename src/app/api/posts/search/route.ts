import { NextResponse } from "next/server";
import { findRelevantPostsForQuery } from "@/lib/searchPosts";

/**
 * 関連投稿検索API（AI以外）
 * 質問に関連する過去投稿を検索
 */
export async function POST(req: Request) {
  try {
    const { query_text, filters, limit = 5 } = await req.json();

    if (!query_text || typeof query_text !== 'string' || !query_text.trim()) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }

    // 関連投稿を検索
    const posts = await findRelevantPostsForQuery(query_text, limit);

    // レスポンス形式に整形
    const result = posts.map(post => ({
      post_id: post.id,
      title: post.title,
      content_snippet: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
      author_id: post.author_id,
      author_name: post.author?.name || '匿名',
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      category: post.category,
    }));

    return NextResponse.json({ posts: result });
  } catch (error: any) {
    console.error("Error in posts search API:", error);
    return NextResponse.json(
      { error: error?.message || "投稿検索に失敗しました" },
      { status: 500 }
    );
  }
}

