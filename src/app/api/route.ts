// src/app/api/ai-search/route.ts
import { NextResponse } from "next/server";
import { searchByTitleAndContent } from "@/lib/searchByTitleAndContent";

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  const answer = await searchByTitleAndContent(query, 100, 5);

  return NextResponse.json({ answer });
}
