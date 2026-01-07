import { NextResponse } from "next/server";
import { findSimilarUsers } from "@/lib/searchUsers";

/**
 * 類似ユーザー検索API（AI以外）
 * 質問内容に近い経験を持つユーザーを抽出
 */
export async function POST(req: Request) {
  try {
    const { query_text, limit = 5 } = await req.json();

    if (!query_text || typeof query_text !== 'string' || !query_text.trim()) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }

    // 類似ユーザーを検索
    const users = await findSimilarUsers(query_text, limit);

    // レスポンス形式に整形
    const result = users.map(user => ({
      user_id: user.id,
      display_name: user.name,
      attributes: {
        study_abroad_destination: user.study_abroad_destination,
        university: user.university,
        major: user.major,
        account_type: user.account_type,
      },
      contribution_score: user.contribution_score || 0,
      icon_url: user.icon_url,
    }));

    return NextResponse.json({ users: result });
  } catch (error: any) {
    console.error("Error in users recommend API:", error);
    return NextResponse.json(
      { error: error?.message || "ユーザー検索に失敗しました" },
      { status: 500 }
    );
  }
}

