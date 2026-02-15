import { NextResponse } from "next/server";
import { fetchAllMarketData } from "@/lib/yahoo-finance";

// Cache the data in memory for 60 seconds
let cachedData: { data: Awaited<ReturnType<typeof fetchAllMarketData>>; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

export async function GET() {
  const now = Date.now();

  if (cachedData && now - cachedData.ts < CACHE_TTL) {
    return NextResponse.json(cachedData.data);
  }

  try {
    const data = await fetchAllMarketData();
    cachedData = { data, ts: now };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
