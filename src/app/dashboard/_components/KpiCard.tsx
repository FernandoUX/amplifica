"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { KpiItem } from "../_data";

const deltaColorMap = {
  green:   "text-green-600",
  red:     "text-red-500",
  blue:    "text-primary-500",
  amber:   "text-amber-500",
  neutral: "text-neutral-500",
};

const sparkColorMap = {
  green:   { stroke: "#10B981", fill: "#D1FAE5" },
  red:     { stroke: "#EF4444", fill: "#FEE2E2" },
  blue:    { stroke: "#2F30FF", fill: "#D6E2FF" },
  amber:   { stroke: "#F59E0B", fill: "#FEF3C7" },
  neutral: { stroke: "#737378", fill: "#F4F4F5" },
};

export default function KpiCard({ title, value, prefix, delta, sparkData }: KpiItem) {
  const color = deltaColorMap[delta.color];
  const spark = sparkColorMap[delta.color];
  const chartData = sparkData.map((v, i) => ({ i, v }));

  const arrow = delta.color === "green" ? "↑" : delta.color === "red" ? "↓" : "";

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-5 flex flex-col justify-between gap-3 min-h-[140px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{title}</span>
          <div className="text-[1.6rem] font-bold text-neutral-900 leading-tight tracking-tight mt-1 tabular-nums">
            {prefix && <span className="text-neutral-400 font-semibold text-lg mr-0.5">{prefix}</span>}
            {value}
          </div>
        </div>
        {/* Mini sparkline */}
        <div className="w-20 h-10 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={spark.fill} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={spark.fill} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={spark.stroke}
                strokeWidth={1.5}
                fill={`url(#spark-${title})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delta */}
      <span className={`text-xs font-medium ${color}`}>
        {arrow} {delta.value} <span className="text-neutral-400 font-normal">{delta.label}</span>
      </span>
    </div>
  );
}
