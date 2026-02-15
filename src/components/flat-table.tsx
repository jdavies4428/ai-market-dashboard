"use client";

import { useMemo } from "react";
import { TickerData } from "@/lib/types";
import { SMA_PERIODS } from "@/lib/constants";
import { formatPrice, formatChange, formatPct, changeColor, cn } from "@/lib/utils";
import { SmaArrow } from "./sma-arrow";

export type SortField = "1d" | "1w" | "1m" | "ytd";

interface FlatTableProps {
  tickers: Array<{ symbol: string } & TickerData>;
  sortField: SortField;
  sortAsc: boolean;
  onToggleSort: (field: SortField) => void;
}

const FIELD_GETTER: Record<SortField, (t: TickerData) => number> = {
  "1d": (t) => t.changePct,
  "1w": (t) => t.ret1w,
  "1m": (t) => t.ret1m,
  ytd: (t) => t.retYtd,
};

export function FlatTable({ tickers, sortField, sortAsc, onToggleSort }: FlatTableProps) {
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

    const getter = FIELD_GETTER[sortField];
    const dir = sortAsc ? 1 : -1;
    const s = [...tickers].sort((a, b) => dir * (getter(a) - getter(b)));

    return { sorted: s, maxDistance: max || 10 };
  }, [tickers, sortField, sortAsc]);

  if (sorted.length === 0) return null;

  const arrow = sortAsc ? " ↑" : " ↓";
  const thBase = "px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider";
  const thSortable = `${thBase} cursor-pointer select-none hover:text-zinc-300 transition-colors`;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-xs">
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
              <th className={cn(thBase, "text-zinc-500")}>
                Price
              </th>
              <th className={cn(thBase, "text-zinc-500")}>
                Chg
              </th>
              <th
                onClick={() => onToggleSort("1d")}
                className={cn(thSortable, sortField === "1d" ? "text-zinc-200" : "text-zinc-500")}
              >
                %Chg{sortField === "1d" && arrow}
              </th>
              <th
                onClick={() => onToggleSort("1w")}
                className={cn(thSortable, sortField === "1w" ? "text-zinc-200" : "text-zinc-500")}
              >
                1W{sortField === "1w" && arrow}
              </th>
              <th
                onClick={() => onToggleSort("1m")}
                className={cn(thSortable, sortField === "1m" ? "text-zinc-200" : "text-zinc-500")}
              >
                1M{sortField === "1m" && arrow}
              </th>
              <th
                onClick={() => onToggleSort("ytd")}
                className={cn("border-r border-zinc-800", thSortable, sortField === "ytd" ? "text-zinc-200" : "text-zinc-500")}
              >
                YTD{sortField === "ytd" && arrow}
              </th>
              {SMA_PERIODS.map((p) => (
                <th
                  key={p}
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
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
}
