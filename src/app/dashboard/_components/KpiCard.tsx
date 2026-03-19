"use client";

import type { ReactNode } from "react";

type KpiCardProps = {
  title: string;
  value: string;
  prefix?: string;
  delta: { value: string; label: string; color: "green" | "red" | "blue" | "amber" | "neutral" };
  icon: ReactNode;
};

const deltaColorMap = {
  green:   "text-green-600",
  red:     "text-red-500",
  blue:    "text-primary-500",
  amber:   "text-amber-500",
  neutral: "text-neutral-500",
};

export default function KpiCard({ title, value, prefix, delta, icon }: KpiCardProps) {
  const color = deltaColorMap[delta.color];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-5 flex flex-col gap-3">
      {/* Header: title + icon */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span className="text-neutral-400">{icon}</span>
      </div>

      {/* Value + delta */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[1.75rem] font-bold text-neutral-900 leading-tight tracking-tight tabular-nums">
          {prefix}{value}
        </span>
        <span className={`text-xs font-medium ${color}`}>
          {delta.value} {delta.label}
        </span>
      </div>
    </div>
  );
}

export type { KpiCardProps };
