import { NextResponse } from "next/server";
import { fetchLiveQuotes } from "@/lib/yahoo-finance";

let cachedQuotes: { data: Awaited<ReturnType<typeof fetchLiveQuotes>>; ts: number } | null = null;
const CACHE_TTL = 15_000; // 15 seconds

export async function GET() {
  const now = Date.now();

  if (cachedQuotes && now - cachedQuotes.ts < CACHE_TTL) {
    return NextResponse.json(cachedQuotes.data);
  }

  try {
    const data = await fetchLiveQuotes();
    cachedQuotes = { data, ts: now };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
