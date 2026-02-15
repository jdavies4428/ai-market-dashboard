"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface SmaArrowProps {
  price: number;
  smaValue: number | null;
  maxDistance: number;
}

export const SmaArrow = memo(function SmaArrow({ price, smaValue, maxDistance }: SmaArrowProps) {
  if (!smaValue || smaValue <= 0) {
    return (
      <td className="text-center font-mono text-xs text-zinc-600">-</td>
    );
  }

  const distance = ((price - smaValue) / smaValue) * 100;
  const absDistance = Math.abs(distance);
  const opacity = 0.35 + (Math.min(absDistance, maxDistance) / maxDistance) * 0.65;

  let arrow: string;
  let colorClass: string;

  if (Math.abs(distance) < 0.1) {
    arrow = "~";
    colorClass = "text-zinc-500";
  } else if (distance > 0) {
    arrow = "▲";
    colorClass = "text-emerald-500";
  } else {
    arrow = "▼";
    colorClass = "text-red-500";
  }

  return (
    <td className="text-center">
      <span
        className={cn("text-sm font-bold", colorClass)}
        style={{ opacity }}
        title={`${distance >= 0 ? "+" : ""}${distance.toFixed(1)}% from SMA`}
      >
        {arrow}
      </span>
    </td>
  );
});
