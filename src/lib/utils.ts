import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined) return "-";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPrice(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  if (num >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return num.toFixed(2);
}

export function formatChange(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  const prefix = num >= 0 ? "+" : "";
  return `${prefix}${formatNumber(num)}`;
}

export function formatPct(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  const prefix = num >= 0 ? "+" : "";
  return `${prefix}${formatNumber(num)}%`;
}

export function changeColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "text-zinc-400";
  return value > 0 ? "text-emerald-500" : "text-red-500";
}

export function formatMarketCap(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";

  const trillion = 1_000_000_000_000;
  const billion = 1_000_000_000;
  const million = 1_000_000;

  if (num >= trillion) {
    return `$${(num / trillion).toFixed(2)}T`;
  } else if (num >= billion) {
    return `$${(num / billion).toFixed(2)}B`;
  } else if (num >= million) {
    return `$${(num / million).toFixed(2)}M`;
  } else {
    return `$${num.toLocaleString("en-US")}`;
  }
}
