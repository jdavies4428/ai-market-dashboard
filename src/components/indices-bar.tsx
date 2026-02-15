"use client";

import { memo } from "react";
import { IndexData } from "@/lib/types";
import { formatPrice, formatPct, changeColor, cn } from "@/lib/utils";

const INDEX_ORDER = ["GSPC", "DJI", "IXIC", "BTC-USD"];
const INDEX_LABELS: Record<string, string> = {
  GSPC: "S&P 500",
  DJI: "Dow Jones",
  IXIC: "Nasdaq",
  "BTC-USD": "Bitcoin",
};

interface IndicesBarProps {
  indices: Record<string, IndexData>;
}

export const IndicesBar = memo(function IndicesBar({ indices }: IndicesBarProps) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-zinc-800 bg-zinc-900/50 px-6 py-3">
      {INDEX_ORDER.map((key) => {
        const data = indices[key];
        if (!data) return null;
        const label = INDEX_LABELS[key] || data.name;
        return (
          <div key={key} className="flex shrink-0 items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {label}
            </span>
            <span className="font-mono text-sm font-semibold text-zinc-100">
              {formatPrice(data.price)}
            </span>
            <span className={cn("font-mono text-xs font-medium", changeColor(data.changePct))}>
              {formatPct(data.changePct)}
            </span>
          </div>
        );
      })}
    </div>
  );
});
