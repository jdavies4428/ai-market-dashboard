import { SectorConfig } from "./types";

export const WATCHLIST = [
  // Hyperscalers
  "AMZN", "GOOGL", "META", "MSFT", "ORCL",
  // Chips
  "AMD", "ARM", "AVGO", "INTC", "MRVL", "NVDA",
  // Memory
  "MU", "SNDK", "STX", "WDC",
  // Networking
  "ALAB", "CRDO",
  // Optical
  "AAOI", "CIEN", "COHR", "GLW", "LITE", "LUMN",
  // Neoclouds
  "APLD", "CIFR", "CRWV", "IREN", "NBIS",
  // Servers
  "DELL", "SMCI",
  // Power
  "BE", "CEG", "IESC", "OKLO", "PSIX", "SMR", "VRT", "VST",
];

export const INDICES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^DJI": "Dow Jones",
  "^IXIC": "Nasdaq",
  "BTC-USD": "Bitcoin",
};

export const SECTORS: SectorConfig[] = [
  { name: "HYPERSCALERS", tickers: ["AMZN", "GOOGL", "META", "MSFT", "ORCL"] },
  { name: "CHIPS", tickers: ["AMD", "ARM", "AVGO", "INTC", "MRVL", "NVDA"] },
  { name: "MEMORY", tickers: ["MU", "SNDK", "STX", "WDC"] },
  { name: "NETWORKING", tickers: ["ALAB", "CRDO"] },
  { name: "OPTICAL", tickers: ["AAOI", "CIEN", "COHR", "GLW", "LITE", "LUMN"] },
  { name: "NEOCLOUDS", tickers: ["APLD", "CIFR", "CRWV", "IREN", "NBIS"] },
  { name: "SERVERS", tickers: ["DELL", "SMCI"] },
  { name: "POWER", tickers: ["BE", "CEG", "IESC", "OKLO", "PSIX", "SMR", "VRT", "VST"] },
];

export const SMA_PERIODS = [5, 10, 20, 50, 100, 200] as const;

export const INDEX_DISPLAY: Record<string, string> = {
  GSPC: "S&P 500",
  DJI: "Dow Jones",
  IXIC: "Nasdaq",
  "BTC-USD": "Bitcoin",
};
