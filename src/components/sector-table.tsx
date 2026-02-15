"use client";

import { memo, useMemo } from "react";
import { TickerData } from "@/lib/types";
import { SMA_PERIODS } from "@/lib/constants";
import { formatPrice, formatChange, formatPct, changeColor, cn } from "@/lib/utils";
import { SmaArrow } from "./sma-arrow";

interface SectorTableProps {
  name: string;
  tickers: Array<{ symbol: string } & TickerData>;
}

export const SectorTable = memo(function SectorTable({ name, tickers }: SectorTableProps) {
  const { sorted, maxDistance } = useMemo(() => {
    if (tickers.length === 0) return { sorted: [], maxDistance: 10 };

    let max = 0;
    for (const t of tickers) {
      for (const p of SMA_PERIODS) {
        const sma = t.smas[`SMA${p}`];
        if (sma && sma > 0) {
          const d = Math.abs(((t.price - sma) / sma) * 100);
          if (d > max) max = d;
        }
      }
    }

    return {
      sorted: [...tickers].sort((a, b) => a.symbol.localeCompare(b.symbol)),
      maxDistance: max || 10,
    };
  }, [tickers]);

  if (sorted.length === 0) return null;

  return (
    <div>
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-3 py-2 sm:px-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          {name}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed text-xs">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            {SMA_PERIODS.map((p) => (
              <col key={p} className="w-[5.5%]" />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-800/30 bg-zinc-950/50">
              <th colSpan={7} className="border-r border-zinc-800" />
              <th colSpan={SMA_PERIODS.length} className="py-1 text-center text-[9px] font-medium tracking-wider text-zinc-600">
                <span className="text-emerald-600">▲</span> Above / <span className="text-red-600">▼</span> Below Moving Average
              </th>
            </tr>
            <tr className="border-b border-zinc-800/60 bg-zinc-950/50">
              <th className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Ticker
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Price
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Chg
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                %Chg
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                1W
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                1M
              </th>
              <th className="border-r border-zinc-800 px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                YTD
              </th>
              {SMA_PERIODS.map((p) => (
                <th
                  key={p}
                  className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ticker) => (
              <tr
                key={ticker.symbol}
                className="border-b border-zinc-800/30 transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-5 py-2 text-left font-semibold text-zinc-200">
                  {ticker.symbol}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-200">
                  {formatPrice(ticker.price)}
                </td>
                <td className={cn("px-3 py-2 text-right font-mono", changeColor(ticker.change))}>
                  {formatChange(ticker.change)}
                </td>
                <td className={cn("px-3 py-2 text-right font-mono font-semibold", changeColor(ticker.changePct))}>
                  {formatPct(ticker.changePct)}
                </td>
                <td className={cn("px-3 py-2 text-right font-mono", changeColor(ticker.ret1w))}>
                  {formatPct(ticker.ret1w)}
                </td>
                <td className={cn("px-3 py-2 text-right font-mono", changeColor(ticker.ret1m))}>
                  {formatPct(ticker.ret1m)}
                </td>
                <td className={cn("border-r border-zinc-800 px-3 py-2 text-right font-mono", changeColor(ticker.retYtd))}>
                  {formatPct(ticker.retYtd)}
                </td>
                {SMA_PERIODS.map((p) => (
                  <SmaArrow
                    key={p}
                    price={ticker.price}
                    smaValue={ticker.smas[`SMA${p}`]}
                    maxDistance={maxDistance}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
