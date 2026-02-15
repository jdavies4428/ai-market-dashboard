"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MarketData, TickerData } from "@/lib/types";
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
        <header className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                AI Market Dashboard
              </h1>
              <p className="text-[11px] text-zinc-500">
                Real-time AI infrastructure & semiconductor tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-lg border border-zinc-800">
                {VIEW_BUTTONS.map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => handleViewClick(btn.key)}
                    className={cn(
                      "px-2.5 py-1.5 text-[11px] font-medium transition-colors",
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
                <span className="text-[11px] text-zinc-600">
                  {lastUpdated}
                </span>
              )}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
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

          <footer className="border-t border-zinc-800 px-6 py-3">
            <p className="text-[10px] text-zinc-600">
              Data from Yahoo Finance. Auto-refreshes every 60s. Not financial advice.
            </p>
          </footer>
        </div>
      </div>

      {/* News sidebar */}
      <div className="hidden w-80 shrink-0 lg:block">
        <NewsPanel news={data.news || []} />
      </div>
    </div>
  );
}
