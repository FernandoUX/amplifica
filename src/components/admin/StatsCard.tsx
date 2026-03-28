"use client";

import type { ReactNode } from "react";

type Delta = {
  value: string;       // e.g. "+20.1%"
  label: string;       // e.g. "desde el mes pasado"
  color?: "green" | "red" | "blue" | "amber" | "neutral";
};

type StatsCardProps = {
  title: string;
  value: string;
  delta: Delta;
  icon: ReactNode;
};

const deltaColorMap: Record<NonNullable<Delta["color"]>, string> = {
  green:   "text-green-600",
  red:     "text-red-500",
  blue:    "text-primary-500",
  amber:   "text-amber-500",
  neutral: "text-neutral-500",
};

export default function StatsCard({ title, value, delta, icon }: StatsCardProps) {
  const color = deltaColorMap[delta.color ?? "green"];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span className="text-neutral-400">{icon}</span>
      </div>

      {/* Value + delta */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[1.75rem] font-bold text-neutral-900 leading-tight tracking-tight">
          {value}
        </span>
        <span className={`text-xs font-medium ${color}`}>
          {delta.value} {delta.label}
        </span>
      </div>
    </div>
  );
}
