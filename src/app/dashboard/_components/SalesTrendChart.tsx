"use client";

import { CartesianGrid, Area, AreaChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DAILY_SALES, BRANCH_COLORS, fmtShort } from "../_data";
import ChartCard from "./ChartCard";

const BRANCHES = Object.keys(BRANCH_COLORS);

const chartConfig = Object.fromEntries(
  BRANCHES.map(b => [b, { label: b, color: BRANCH_COLORS[b] }])
) satisfies ChartConfig;

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export default function SalesTrendChart() {
  return (
    <ChartCard title="Ventas por día" subtitle="Tendencia diaria por sucursal">
      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <AreaChart accessibilityLayer data={DAILY_SALES} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {BRANCHES.map(b => (
              <linearGradient key={b} id={`fill-${b.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRANCH_COLORS[b]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={BRANCH_COLORS[b]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtDate} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickFormatter={fmtShort} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => fmtDate(String(l))} indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          {BRANCHES.map(b => (
            <Area
              key={b}
              type="monotone"
              dataKey={b}
              stroke={BRANCH_COLORS[b]}
              strokeWidth={2}
              fill={`url(#fill-${b.replace(/\s/g, "")})`}
              dot={false}
              stackId="1"
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
