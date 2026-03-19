"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BRANCHES, BRANCH_COLORS, fmtShort, fmtCLP } from "../_data";
import ChartCard from "./ChartCard";

const sorted = [...BRANCHES].sort((a, b) => b.value - a.value);

const chartConfig = Object.fromEntries(
  sorted.map(b => [b.name, { label: b.name, color: BRANCH_COLORS[b.name] }])
) satisfies ChartConfig;

export default function SalesBranchChart() {
  return (
    <ChartCard title="Ventas por sucursal" subtitle="Ranking por monto total">
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <BarChart accessibilityLayer data={sorted} layout="vertical" margin={{ top: 4, right: 60, left: 0, bottom: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickFormatter={fmtShort} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
          <ChartTooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0];
            const name = item.payload.name;
            const value = Number(item.value);
            const color = BRANCH_COLORS[name] ?? "#D1D5DB";
            return (
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-xl" style={{ fontFamily: "Inter, sans-serif" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-neutral-500">{name}</span>
                  <span className="font-medium text-neutral-900 tabular-nums">{fmtCLP(value)}</span>
                </div>
              </div>
            );
          }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
            {sorted.map(entry => (
              <Cell key={entry.name} fill={BRANCH_COLORS[entry.name] ?? "#D1D5DB"} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: number) => fmtShort(v)} className="fill-foreground text-[11px] font-semibold" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
