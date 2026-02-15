export interface TickerData {
  price: number;
  change: number;
  changePct: number;
  ret1w: number;
  ret1m: number;
  retYtd: number;
  smas: Record<string, number | null>;
}

export interface IndexData {
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export interface MoverData {
  symbol: string;
  price: number;
  changePct: number;
  direction: "up" | "down";
}

export interface SectorPerformance {
  name: string;
  avgChangePct: number;
  bestName: string;
  bestChangePct: number;
  worstName: string;
  worstChangePct: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  tickers: string[];
}

export interface MarketData {
  timestamp: string;
  indices: Record<string, IndexData>;
  watchlist: Record<string, TickerData>;
  movers: MoverData[];
  sectorPerformance: SectorPerformance[];
  news: NewsItem[];
}

export interface QuoteData {
  price: number;
  change: number;
  changePct: number;
}

export interface LiveQuotesResponse {
  timestamp: string;
  indices: Record<string, QuoteData>;
  watchlist: Record<string, QuoteData>;
}

export interface SectorConfig {
  name: string;
  tickers: string[];
}
