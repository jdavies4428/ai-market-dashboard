"use client";

import { memo, useMemo, useState } from "react";
import { TickerData } from "@/lib/types";
import { SECTORS, SMA_PERIODS } from "@/lib/constants";
import { formatPrice, formatPct, cn } from "@/lib/utils";

type HeatmapPeriod = "1d" | "1w" | "1m" | "ytd";

interface HeatmapViewProps {
  watchlist: Record<string, TickerData>;
}

const PERIOD_OPTIONS: { key: HeatmapPeriod; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "ytd", label: "YTD" },
];

function getValue(ticker: TickerData, period: HeatmapPeriod): number {
  switch (period) {
    case "1d":
      return ticker.changePct;
    case "1w":
      return ticker.ret1w;
    case "1m":
      return ticker.ret1m;
    case "ytd":
      return ticker.retYtd;
  }
}

function getHeatColor(value: number, maxAbs: number): string {
  if (maxAbs === 0) return "rgb(24, 24, 27)";

  const intensity = Math.min(Math.abs(value) / maxAbs, 1);
  // Power curve for better mid-range visibility
  const t = Math.pow(intensity, 0.6);

  if (value >= 0) {
    // zinc-900 rgb(24,24,27) → emerald-800 rgb(6,95,70)
    const r = Math.round(24 + (6 - 24) * t);
    const g = Math.round(24 + (95 - 24) * t);
    const b = Math.round(27 + (70 - 27) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // zinc-900 rgb(24,24,27) → red-800 rgb(153,27,27)
    const r = Math.round(24 + (153 - 24) * t);
    const g = Math.round(24 + (27 - 24) * t);
    const b = Math.round(27 + (27 - 27) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function getGlowShadow(value: number, maxAbs: number): string {
  if (maxAbs === 0) return "none";
  const intensity = Math.min(Math.abs(value) / maxAbs, 1);
  if (intensity < 0.4) return "none";
  const alpha = (intensity - 0.4) * 0.25;
  const color = value > 0 ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
  return `0 0 ${Math.round(intensity * 16)}px ${color}`;
}

function getSmaScore(ticker: TickerData): { above: number; total: number } {
  let above = 0;
  let total = 0;
  for (const p of SMA_PERIODS) {
    const sma = ticker.smas[`SMA${p}`];
    if (sma && sma > 0) {
      total++;
      if (ticker.price > sma) above++;
    }
  }
  return { above, total };
}

function getSmaDotColors(ticker: TickerData): string[] {
  return SMA_PERIODS.map((p) => {
    const sma = ticker.smas[`SMA${p}`];
    if (!sma || sma <= 0) return "bg-zinc-700";
    const dist = ((ticker.price - sma) / sma) * 100;
    if (Math.abs(dist) < 0.1) return "bg-zinc-500";
    return dist > 0 ? "bg-emerald-500" : "bg-red-500";
  });
}

const HeatmapTile = memo(function HeatmapTile({
  symbol,
  ticker,
  period,
  maxAbs,
}: {
  symbol: string;
  ticker: TickerData;
  period: HeatmapPeriod;
  maxAbs: number;
}) {
  const value = getValue(ticker, period);
  const bgColor = getHeatColor(value, maxAbs);
  const glow = getGlowShadow(value, maxAbs);
  const smaScore = getSmaScore(ticker);
  const smaDots = getSmaDotColors(ticker);

  const tooltipText = [
    `${symbol}  $${formatPrice(ticker.price)}`,
    `1D: ${formatPct(ticker.changePct)}  |  1W: ${formatPct(ticker.ret1w)}`,
    `1M: ${formatPct(ticker.ret1m)}  |  YTD: ${formatPct(ticker.retYtd)}`,
    `SMA: ${smaScore.above}/${smaScore.total} above`,
  ].join("\n");

  return (
    <div
      className="flex min-h-[88px] flex-col justify-between rounded-lg border border-zinc-800/50 px-3 py-2.5 transition-all duration-300 hover:border-zinc-500 hover:brightness-[1.2]"
      style={{ backgroundColor: bgColor, boxShadow: glow }}
      title={tooltipText}
    >
      {/* Ticker & Price */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-zinc-100">{symbol}</span>
        <span className="font-mono text-[11px] text-zinc-400">
          ${formatPrice(ticker.price)}
        </span>
      </div>

      {/* Change value */}
      <div className="mt-1.5">
        <span
          className={cn(
            "font-mono text-[17px] font-bold leading-tight",
            value > 0
              ? "text-emerald-400"
              : value < 0
                ? "text-red-400"
                : "text-zinc-400"
          )}
        >
          {formatPct(value)}
        </span>
      </div>

      {/* SMA dots row */}
      <div className="mt-2 flex items-center gap-[3px]">
        {smaDots.map((color, i) => (
          <div
            key={SMA_PERIODS[i]}
            className={cn("h-[5px] w-[5px] rounded-full", color)}
          />
        ))}
        <span
          className={cn(
            "ml-auto font-mono text-[9px]",
            smaScore.total === 0
              ? "text-zinc-600"
              : smaScore.above >= smaScore.total / 2
                ? "text-emerald-500/70"
                : "text-red-500/70"
          )}
        >
          {smaScore.above}/{smaScore.total}
        </span>
      </div>
    </div>
  );
});

const SectorGroup = memo(function SectorGroup({
  name,
  tickers,
  watchlist,
  period,
  maxAbs,
}: {
  name: string;
  tickers: string[];
  watchlist: Record<string, TickerData>;
  period: HeatmapPeriod;
  maxAbs: number;
}) {
  const sortedTickers = useMemo(() => {
    return tickers
      .filter((s) => watchlist[s])
      .sort((a, b) => getValue(watchlist[b], period) - getValue(watchlist[a], period));
  }, [tickers, watchlist, period]);

  // Compute sector avg dynamically for the selected period
  const sectorAvg = useMemo(() => {
    if (sortedTickers.length === 0) return 0;
    const sum = sortedTickers.reduce((acc, s) => acc + getValue(watchlist[s], period), 0);
    return Math.round((sum / sortedTickers.length) * 100) / 100;
  }, [sortedTickers, watchlist, period]);

  if (sortedTickers.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center gap-3 px-0.5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          {name}
        </h3>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
            sectorAvg > 0
              ? "bg-emerald-500/10 text-emerald-400"
              : sectorAvg < 0
                ? "bg-red-500/10 text-red-400"
                : "bg-zinc-800 text-zinc-500"
          )}
        >
          avg {formatPct(sectorAvg)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {sortedTickers.map((symbol) => (
          <HeatmapTile
            key={symbol}
            symbol={symbol}
            ticker={watchlist[symbol]}
            period={period}
            maxAbs={maxAbs}
          />
        ))}
      </div>
    </div>
  );
});

export const HeatmapView = memo(function HeatmapView({
  watchlist,
}: HeatmapViewProps) {
  const [period, setPeriod] = useState<HeatmapPeriod>("1d");

  // Use percentile-based scaling so outliers don't wash out mid-range colors
  const { colorScale, dataMin, dataMax } = useMemo(() => {
    const values = Object.values(watchlist).map((t) => getValue(t, period));
    const absValues = values.map(Math.abs).sort((a, b) => a - b);
    if (absValues.length === 0) return { colorScale: 1, dataMin: 0, dataMax: 0 };

    const rawMax = absValues[absValues.length - 1];
    const p75Index = Math.floor(absValues.length * 0.75);
    const p75 = absValues[p75Index];
    // Cap at 3x the 75th percentile — outliers get full saturation
    const scale = Math.max(Math.min(rawMax, p75 * 3), 1);

    const sorted = [...values].sort((a, b) => a - b);
    return {
      colorScale: scale,
      dataMin: sorted[0],
      dataMax: sorted[sorted.length - 1],
    };
  }, [watchlist, period]);

  return (
    <div className="px-3 py-3 sm:px-5">
      {/* Toolbar: period selector + legend */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          Color by
        </span>
        <div className="flex items-center overflow-hidden rounded-md border border-zinc-800">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium transition-colors",
                period === opt.key
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* Gradient legend */}
        <div className="ml-auto hidden items-center gap-1.5 sm:flex">
          <span className="font-mono text-[9px] text-red-400/70">
            {formatPct(dataMin)}
          </span>
          <div
            className="h-2.5 w-24 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${getHeatColor(-colorScale, colorScale)}, rgb(24, 24, 27) 50%, ${getHeatColor(colorScale, colorScale)})`,
            }}
          />
          <span className="font-mono text-[9px] text-emerald-400/70">
            {formatPct(dataMax)}
          </span>
        </div>
      </div>

      {/* Sector groups */}
      {SECTORS.map((sector) => (
        <SectorGroup
          key={sector.name}
          name={sector.name}
          tickers={sector.tickers}
          watchlist={watchlist}
          period={period}
          maxAbs={colorScale}
        />
      ))}
    </div>
  );
});
