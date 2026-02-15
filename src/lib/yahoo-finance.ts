import { TickerData, IndexData, MarketData, SectorPerformance, NewsItem, QuoteData, LiveQuotesResponse } from "./types";
import { WATCHLIST, INDICES, SMA_PERIODS, SECTORS } from "./constants";

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: (number | null)[];
        }>;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

function calculateSMAs(prices: number[]): Record<string, number | null> {
  const smas: Record<string, number | null> = {};
  for (const period of SMA_PERIODS) {
    if (prices.length >= period) {
      const slice = prices.slice(-period);
      const sum = slice.reduce((a, b) => a + b, 0);
      smas[`SMA${period}`] = Math.round((sum / period) * 100) / 100;
    } else {
      smas[`SMA${period}`] = null;
    }
  }
  return smas;
}

async function fetchYahooChart(symbol: string): Promise<YahooChartResult | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Error fetching ${symbol}:`, e);
    return null;
  }
}

function parseTickerData(data: YahooChartResult): TickerData | null {
  const result = data.chart?.result?.[0];
  if (!result) return null;

  const closes = result.indicators.quote[0].close;
  const timestamps = result.timestamp;
  const prices = closes.filter((p): p is number => p !== null);

  if (prices.length < 2) return null;

  // Use live price from meta when available, fall back to last daily close
  const latest = result.meta?.regularMarketPrice ?? prices[prices.length - 1];
  const prev = result.meta?.chartPreviousClose ?? prices[prices.length - 2];
  const change = latest - prev;
  const changePct = (change / prev) * 100;

  const smas = calculateSMAs(prices);

  const now = new Date();

  // 1W return — find close from ~1 calendar week ago using timestamps
  const oneWeekAgo = (now.getTime() / 1000) - (7 * 86400);
  let price1w = prices[0];
  if (timestamps) {
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] <= oneWeekAgo && closes[i] !== null) {
        price1w = closes[i] as number;
        break;
      }
    }
  }
  const ret1w = ((latest - price1w) / price1w) * 100;

  // 1M return — find close from ~1 calendar month ago using timestamps
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime() / 1000;
  let price1m = prices[0]; // fallback
  if (timestamps) {
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] <= oneMonthAgo && closes[i] !== null) {
        price1m = closes[i] as number;
        break;
      }
    }
  }
  const ret1m = ((latest - price1m) / price1m) * 100;

  // YTD return — use last close of prior year (what Yahoo Finance uses)
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
  let priceYtd = prices[0]; // fallback
  if (timestamps) {
    // Walk backwards from start of year to find last valid close of prior year
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] < startOfYear && closes[i] !== null) {
        priceYtd = closes[i] as number;
        break;
      }
    }
  }
  const retYtd = ((latest - priceYtd) / priceYtd) * 100;

  return {
    price: Math.round(latest * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    ret1w: Math.round(ret1w * 100) / 100,
    ret1m: Math.round(ret1m * 100) / 100,
    retYtd: Math.round(retYtd * 100) / 100,
    smas,
  };
}

function parseIndexData(data: YahooChartResult, name: string): IndexData | null {
  const result = data.chart?.result?.[0];
  if (!result) return null;

  const prices = result.indicators.quote[0].close.filter(
    (p): p is number => p !== null
  );

  if (prices.length < 2) return null;

  const latest = result.meta?.regularMarketPrice ?? prices[prices.length - 1];
  const prev = result.meta?.chartPreviousClose ?? prices[prices.length - 2];
  const change = latest - prev;
  const changePct = (change / prev) * 100;

  return {
    name,
    price: Math.round(latest * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
  };
}

async function fetchNews(): Promise<NewsItem[]> {
  try {
    const symbols = WATCHLIST.join(",");
    const url = `https://finance.yahoo.com/rss/headline?s=${symbols}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: NewsItem[] = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;


    // Parse RSS XML items
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
    if (!itemMatches) return [];

    for (const itemXml of itemMatches) {
      const title = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
        || itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        || "";
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
      const pubDateStr = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

      if (!title || !pubDateStr) continue;

      const pubDate = new Date(pubDateStr);
      if (now - pubDate.getTime() > oneDayMs) continue;

      // Match tickers mentioned in title
      const tickers = WATCHLIST.filter(
        (t) => new RegExp(`\\b${t}\\b`, "i").test(title)
      );

      items.push({
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate.toISOString(),
        tickers,
      });
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return items;
  } catch (e) {
    console.error("Error fetching news:", e);
    return [];
  }
}

export async function fetchAllMarketData(): Promise<MarketData> {
  const data: MarketData = {
    timestamp: new Date().toISOString(),
    indices: {},
    watchlist: {},
    movers: [],
    sectorPerformance: [],
    news: [],
  };

  // Fetch all symbols in parallel (batched to avoid rate limits)
  const allSymbols = [
    ...Object.keys(INDICES),
    ...WATCHLIST,
  ];

  const BATCH_SIZE = 20;
  const results: Map<string, YahooChartResult | null> = new Map();

  for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
    const batch = allSymbols.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((symbol) => fetchYahooChart(symbol))
    );
    batch.forEach((symbol, idx) => {
      results.set(symbol, batchResults[idx]);
    });
  }

  // Parse indices
  for (const [symbol, name] of Object.entries(INDICES)) {
    const raw = results.get(symbol);
    if (raw) {
      const parsed = parseIndexData(raw, name);
      if (parsed) {
        const displaySymbol = symbol.replace("^", "");
        data.indices[displaySymbol] = parsed;
      }
    }
  }

  // Parse watchlist
  for (const symbol of WATCHLIST) {
    const raw = results.get(symbol);
    if (raw) {
      const parsed = parseTickerData(raw);
      if (parsed) {
        data.watchlist[symbol] = parsed;

        // Track movers > 3%
        if (Math.abs(parsed.changePct) >= 3) {
          data.movers.push({
            symbol,
            price: parsed.price,
            changePct: parsed.changePct,
            direction: parsed.changePct > 0 ? "up" : "down",
          });
        }
      }
    }
  }

  // Sort movers by absolute change
  data.movers.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  // Compute sector performance for commentary
  data.sectorPerformance = SECTORS.map((sector): SectorPerformance => {
    const tickers = sector.tickers
      .map((s) => ({ symbol: s, data: data.watchlist[s] }))
      .filter((t) => t.data);

    if (tickers.length === 0) {
      return { name: sector.name, avgChangePct: 0, bestName: "", bestChangePct: 0, worstName: "", worstChangePct: 0 };
    }

    const avgChangePct = tickers.reduce((sum, t) => sum + t.data.changePct, 0) / tickers.length;
    const sorted = [...tickers].sort((a, b) => b.data.changePct - a.data.changePct);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    return {
      name: sector.name,
      avgChangePct: Math.round(avgChangePct * 100) / 100,
      bestName: best.symbol,
      bestChangePct: best.data.changePct,
      worstName: worst.symbol,
      worstChangePct: worst.data.changePct,
    };
  }).sort((a, b) => b.avgChangePct - a.avgChangePct);

  // Fetch news (non-blocking — don't let it slow down market data)
  data.news = await fetchNews();

  return data;
}

// --- Live quotes (lightweight, for frequent polling) ---

async function fetchQuoteChart(symbol: string): Promise<YahooChartResult | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Error fetching quote for ${symbol}:`, e);
    return null;
  }
}

export async function fetchLiveQuotes(): Promise<LiveQuotesResponse> {
  const response: LiveQuotesResponse = {
    timestamp: new Date().toISOString(),
    indices: {},
    watchlist: {},
  };

  const allSymbols = [...Object.keys(INDICES), ...WATCHLIST];
  const BATCH_SIZE = 20;

  for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
    const batch = allSymbols.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((symbol) => fetchQuoteChart(symbol))
    );
    batch.forEach((symbol, idx) => {
      const data = results[idx];
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice || !meta?.chartPreviousClose) return;

      const price = Math.round(meta.regularMarketPrice * 100) / 100;
      const change = Math.round((meta.regularMarketPrice - meta.chartPreviousClose) * 100) / 100;
      const changePct = Math.round(((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100) * 100) / 100;

      const quote: QuoteData = { price, change, changePct };

      if (symbol in INDICES) {
        response.indices[symbol.replace("^", "")] = quote;
      } else {
        response.watchlist[symbol] = quote;
      }
    });
  }

  return response;
}
