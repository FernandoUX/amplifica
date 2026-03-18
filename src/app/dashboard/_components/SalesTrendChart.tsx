"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { DAILY_SALES, BRANCH_COLORS, fmtShort } from "../_data";
import ChartCard from "./ChartCard";

const BRANCHES = Object.keys(BRANCH_COLORS) as (keyof typeof BRANCH_COLORS)[];

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export default function SalesTrendChart() {
  return (
    <ChartCard title="Ventas por día" subtitle="Tendencia diaria por sucursal">
      <div className="h-[320px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={DAILY_SALES} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#737378" }}
              axisLine={{ stroke: "#E5E5E6" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fontSize: 11, fill: "#737378" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={(v) => fmtShort(Number(v))}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E6", fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {BRANCHES.map(b => (
              <Line
                key={b}
                type="monotone"
                dataKey={b}
                stroke={BRANCH_COLORS[b]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
