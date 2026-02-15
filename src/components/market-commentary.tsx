"use client";

import { SectorPerformance } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MarketCommentaryProps {
  sectorPerformance: SectorPerformance[];
}

export function MarketCommentary({
  sectorPerformance,
}: MarketCommentaryProps) {
  if (!sectorPerformance || sectorPerformance.length === 0) return null;

  const outperformers = sectorPerformance.filter((s) => s.avgChangePct > 0.1);
  const underperformers = sectorPerformance.filter((s) => s.avgChangePct < -0.1);
  const flat = sectorPerformance.filter(
    (s) => s.avgChangePct >= -0.1 && s.avgChangePct <= 0.1
  );

  // Find standout individual names (best and worst across all sectors)
  const allNames = sectorPerformance
    .filter((s) => s.bestName)
    .flatMap((s) => [
      { symbol: s.bestName, pct: s.bestChangePct },
      { symbol: s.worstName, pct: s.worstChangePct },
    ]);
  const topName = [...allNames].sort((a, b) => b.pct - a.pct)[0];
  const bottomName = [...allNames].sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/40 px-3 py-2 sm:px-6 sm:py-2.5">
      <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
        {outperformers.length > 0 && (
          <p>
            <span className="font-semibold text-emerald-500">Leading: </span>
            <span className="text-zinc-300">
              {outperformers.map((s, i) => (
                <span key={s.name}>
                  {i > 0 && ", "}
                  <span className="font-medium text-zinc-200">{s.name}</span>
                  <span className="text-emerald-500"> +{s.avgChangePct.toFixed(1)}%</span>
                </span>
              ))}
            </span>
          </p>
        )}
        {underperformers.length > 0 && (
          <p>
            <span className="font-semibold text-red-500">Lagging: </span>
            <span className="text-zinc-300">
              {underperformers.map((s, i) => (
                <span key={s.name}>
                  {i > 0 && ", "}
                  <span className="font-medium text-zinc-200">{s.name}</span>
                  <span className="text-red-500"> {s.avgChangePct.toFixed(1)}%</span>
                </span>
              ))}
            </span>
          </p>
        )}
        {outperformers.length === 0 && underperformers.length === 0 && flat.length > 0 && (
          <p className="text-zinc-400">All sectors trading flat today.</p>
        )}
        {topName && bottomName && topName.symbol !== bottomName.symbol && (
          <p className="text-zinc-500">
            Standouts:{" "}
            <span className={cn("font-mono font-medium", topName.pct > 0 ? "text-emerald-500" : "text-red-500")}>
              {topName.symbol} {topName.pct >= 0 ? "+" : ""}{topName.pct.toFixed(1)}%
            </span>
            {" / "}
            <span className={cn("font-mono font-medium", bottomName.pct > 0 ? "text-emerald-500" : "text-red-500")}>
              {bottomName.symbol} {bottomName.pct >= 0 ? "+" : ""}{bottomName.pct.toFixed(1)}%
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
