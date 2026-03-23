"use client";

import type { ReactNode } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type SparklinePoint = { v: number };

type KpiCardProps = {
  title: string;
  value: string;
  prefix?: string;
  delta: { value: string; label: string; color: "green" | "red" | "blue" | "amber" | "neutral" };
  icon: ReactNode;
  sparkline?: number[];
  sparklineColor?: string;
};

const deltaBadgeMap = {
  green:   "bg-green-50 text-green-700",
  red:     "bg-red-50 text-red-600",
  blue:    "bg-primary-50 text-primary-700",
  amber:   "bg-amber-50 text-amber-700",
  neutral: "bg-neutral-100 text-neutral-600",
};

export default function KpiCard({ title, value, prefix, delta, icon, sparkline, sparklineColor }: KpiCardProps) {
  const badgeCls = deltaBadgeMap[delta.color];
  const chartColor = sparklineColor ?? (delta.color === "red" ? "#6366f1" : "#22c55e");

  const data: SparklinePoint[] = sparkline?.map(v => ({ v })) ?? [];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-5 flex flex-col gap-3 relative overflow-hidden">
      {/* Header: title + icon */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span className="text-neutral-400">{icon}</span>
      </div>

      {/* Value + delta + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-neutral-900 leading-tight tracking-tight tabular-nums">
            {prefix}{value}
          </span>
          <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${badgeCls}`}>
            {delta.value} {delta.label}
          </span>
        </div>

        {/* Sparkline with left fade */}
        {data.length > 0 && (
          <div className="w-24 h-12 flex-shrink-0 relative">
            {/* Left-to-right white fade overlay */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, white 0%, transparent 40%)" }}
            />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${title.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${title.replace(/[^a-zA-Z0-9]/g, "")})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export type { KpiCardProps };
