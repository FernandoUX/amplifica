"use client";

import { Pie, PieChart, Cell, Label } from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CHANNELS, fmtShort, fmtCLP } from "../_data";
import ChartCard from "./ChartCard";

const total = CHANNELS.reduce((s, c) => s + c.value, 0);

const chartConfig = Object.fromEntries(
  CHANNELS.map(c => [c.name, { label: c.name, color: c.color }])
) satisfies ChartConfig;

export default function SalesChannelChart() {
  return (
    <ChartCard title="Ventas por canal" subtitle="Top 5 + Otros">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie
            data={CHANNELS}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            stroke="none"
          >
            {CHANNELS.map((c, i) => (
              <Cell key={i} fill={c.color} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                        {fmtShort(total)}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                        Total
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}
