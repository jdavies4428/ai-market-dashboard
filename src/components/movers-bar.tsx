"use client";

import { memo } from "react";
import { MoverData } from "@/lib/types";
import { formatPct, cn } from "@/lib/utils";

interface MoversBarProps {
  movers: MoverData[];
}

export const MoversBar = memo(function MoversBar({ movers }: MoversBarProps) {
  if (movers.length === 0) return null;

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/30 px-6 py-2.5">
      <div className="flex items-center gap-4 overflow-x-auto">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-amber-500">
          Big Movers
        </span>
        {movers.map((m) => (
          <div
            key={m.symbol}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs font-semibold",
              m.direction === "up"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            <span>{m.symbol}</span>
            <span>{formatPct(m.changePct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
