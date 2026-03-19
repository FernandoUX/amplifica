"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { STORES, BRANCH_COLORS, fmtShort } from "../_data";
import ChartCard from "./ChartCard";

const BRANCH_KEYS = Object.keys(BRANCH_COLORS);

const chartConfig = Object.fromEntries(
  BRANCH_KEYS.map(b => [b, { label: b, color: BRANCH_COLORS[b] }])
) satisfies ChartConfig;

export default function SalesStoreChart() {
  return (
    <ChartCard title="Ventas por tienda" subtitle="Desglose por sucursal">
      <ChartContainer config={chartConfig} className="h-[360px] w-full">
        <BarChart accessibilityLayer data={STORES} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="tienda" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={60} tickMargin={8} />
          <YAxis tickFormatter={fmtShort} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {BRANCH_KEYS.map(b => (
            <Bar key={b} dataKey={b} fill={BRANCH_COLORS[b]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
