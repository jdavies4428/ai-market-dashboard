"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MarketData, TickerData, MoverData, SectorPerformance, LiveQuotesResponse } from "@/lib/types";
import { SECTORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IndicesBar } from "./indices-bar";
import { MoversBar } from "./movers-bar";
import { SectorTable } from "./sector-table";
import { MarketCommentary } from "./market-commentary";
import { FlatTable, SortField } from "./flat-table";
import { NewsPanel } from "./news-panel";

type ViewMode = "subsector" | SortField;

const VIEW_BUTTONS: { key: ViewMode; label: string }[] = [
  { key: "subsector", label: "Subsector" },
  { key: "1d", label: "1D%" },
  { key: "1w", label: "1W%" },
  { key: "1m", label: "1M%" },
  { key: "ytd", label: "YTD%" },
];

export function Dashboard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("subsector");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to fetch");
      const json: MarketData = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError("Failed to load market data. Retrying...");
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes");
      if (!res.ok) return;
      const quotes: LiveQuotesResponse = await res.json();

      setData((prev) => {
        if (!prev) return prev;

        const newWatchlist = { ...prev.watchlist };
        for (const [sym, q] of Object.entries(quotes.watchlist)) {
          if (newWatchlist[sym]) {
            newWatchlist[sym] = { ...newWatchlist[sym], ...q };
          }
        }

        const newIndices = { ...prev.indices };
        for (const [sym, q] of Object.entries(quotes.indices)) {
          if (newIndices[sym]) {
            newIndices[sym] = { ...newIndices[sym], ...q };
          }
        }

        // Recompute movers from updated changePct
        const newMovers: MoverData[] = [];
        for (const [sym, t] of Object.entries(newWatchlist)) {
          if (Math.abs(t.changePct) >= 3) {
            newMovers.push({
              symbol: sym,
              price: t.price,
              changePct: t.changePct,
              direction: t.changePct > 0 ? "up" : "down",
            });
          }
        }
        newMovers.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

        // Recompute sector performance
        const newSectorPerf = SECTORS.map((sector): SectorPerformance => {
          const tickers = sector.tickers
            .map((s) => ({ symbol: s, data: newWatchlist[s] }))
            .filter((t) => t.data);
          if (tickers.length === 0) {
            return { name: sector.name, avgChangePct: 0, bestName: "", bestChangePct: 0, worstName: "", worstChangePct: 0 };
          }
          const avgChangePct = tickers.reduce((sum, t) => sum + t.data.changePct, 0) / tickers.length;
          const sorted = [...tickers].sort((a, b) => b.data.changePct - a.data.changePct);
          return {
            name: sector.name,
            avgChangePct: Math.round(avgChangePct * 100) / 100,
            bestName: sorted[0].symbol,
            bestChangePct: sorted[0].data.changePct,
            worstName: sorted[sorted.length - 1].symbol,
            worstChangePct: sorted[sorted.length - 1].data.changePct,
          };
        }).sort((a, b) => b.avgChangePct - a.avgChangePct);

        return {
          ...prev,
          timestamp: quotes.timestamp,
          watchlist: newWatchlist,
          indices: newIndices,
          movers: newMovers,
          sectorPerformance: newSectorPerf,
        };
      });

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Quote fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Full refresh every 5 min, live quotes every 15s
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      if (tickCount >= 20) {
        tickCount = 0;
        fetchData();
      } else {
        fetchQuotes();
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [fetchData, fetchQuotes]);

  const sectorData = useMemo(() => {
    if (!data) return [];
    return SECTORS.map((sector) => ({
      name: sector.name,
      tickers: sector.tickers
        .filter((s) => data.watchlist[s])
        .map((s) => ({ symbol: s, ...data.watchlist[s] })),
    }));
  }, [data]);

  const allTickers = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.watchlist).map(
      ([symbol, td]) => ({ symbol, ...td }) as { symbol: string } & TickerData
    );
  }, [data]);

  const handleViewClick = useCallback((key: ViewMode) => {
    if (key === "subsector") {
      setViewMode("subsector");
      setSortAsc(false);
    } else if (key === viewMode) {
      setSortAsc((prev) => !prev);
    } else {
      setViewMode(key);
      setSortAsc(false);
    }
  }, [viewMode]);

  const handleHeaderSort = useCallback((field: SortField) => {
    if (field === viewMode) {
      setSortAsc((prev) => !prev);
    } else {
      setViewMode(field);
      setSortAsc(false);
    }
  }, [viewMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
          <p className="text-sm text-zinc-500">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-8 py-6">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => fetchData()}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <div className="flex items-center justify-between sm:block">
              <div>
                <h1 className="text-base font-bold tracking-tight text-zinc-100 sm:text-lg">
                  AI Market Dashboard
                </h1>
                <p className="hidden text-[11px] text-zinc-500 sm:block">
                  Real-time AI infrastructure & semiconductor tracking
                </p>
              </div>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50 sm:hidden"
              >
                {refreshing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border border-zinc-600 border-t-zinc-300" />
                  </span>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center overflow-hidden rounded-lg border border-zinc-800">
                {VIEW_BUTTONS.map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => handleViewClick(btn.key)}
                    className={cn(
                      "px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-2.5",
                      viewMode === btn.key
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {lastUpdated && (
                <span className="hidden text-[11px] text-zinc-600 sm:inline">
                  {lastUpdated}
                </span>
              )}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="hidden rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50 sm:inline-flex"
              >
                {refreshing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border border-zinc-600 border-t-zinc-300" />
                    Refreshing
                  </span>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <IndicesBar indices={data.indices} />
          <MarketCommentary sectorPerformance={data.sectorPerformance} />
          <MoversBar movers={data.movers} />

          <main>
            {viewMode === "subsector" ? (
              sectorData.map((sector) => (
                <SectorTable
                  key={sector.name}
                  name={sector.name}
                  tickers={sector.tickers}
                />
              ))
            ) : (
              <FlatTable
                tickers={allTickers}
                sortField={viewMode}
                sortAsc={sortAsc}
                onToggleSort={handleHeaderSort}
              />
            )}
          </main>

          {/* News — inline on mobile, hidden on desktop (shown in sidebar) */}
          <div className="lg:hidden">
            <NewsPanel news={data.news || []} />
          </div>

          <footer className="border-t border-zinc-800 px-3 py-3 sm:px-6">
            <p className="text-[10px] text-zinc-600">
              Data from Yahoo Finance. Prices refresh every 15s. Not financial advice.
            </p>
          </footer>
        </div>
      </div>

      {/* News sidebar — desktop only */}
      <div className="hidden w-80 shrink-0 lg:block">
        <NewsPanel news={data.news || []} />
      </div>
    </div>
  );
}
