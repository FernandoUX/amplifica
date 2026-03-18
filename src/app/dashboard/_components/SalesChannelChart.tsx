"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHANNELS, fmtShort } from "../_data";
import ChartCard from "./ChartCard";

const total = CHANNELS.reduce((s, c) => s + c.value, 0);

export default function SalesChannelChart() {
  return (
    <ChartCard title="Ventas por canal" subtitle="Top 5 + Otros">
      <div className="h-[280px] flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={CHANNELS}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {CHANNELS.map((c, i) => (
                <Cell key={i} fill={c.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => fmtShort(Number(v))}
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E6", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-neutral-900">{fmtShort(total)}</span>
          <span className="text-[10px] text-neutral-500">Total</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
        {CHANNELS.map(c => (
          <div key={c.name} className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            {c.name}
            <span className="text-neutral-400 tabular-nums">{((c.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
