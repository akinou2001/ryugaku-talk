// src/app/api/ai-search/route.ts
import { NextResponse } from "next/server";
import { searchByTitleAndContent } from "@/lib/searchByTitleAndContent";

export async function POST(req: Request) {
  const { query, limit = 100, topK = 5, mode = 'chat' } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  // modeパラメータは現在のsearchByTitleAndContentでは使用されていないが、
  // 将来的な拡張のために受け取っておく
  const answer = await searchByTitleAndContent(query, limit, topK);

  return NextResponse.json({ answer });
}
