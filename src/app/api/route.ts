export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { searchByTitleAndContent } from "@/lib/searchByTitleAndContent";

export async function POST(req: Request) {
  try {
    const { query, limit, topK } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const answer = await searchByTitleAndContent(
      query,
      limit || 100,
      topK || 5
    );

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Error in /api route:", error);
    
    // APIキー関連のエラーの場合は401を返す
    if (error?.message?.includes("APIキー") || error?.message?.includes("DASHSCOPE_API_KEY")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "AI検索に失敗しました" },
      { status: 500 }
    );
  }
}

