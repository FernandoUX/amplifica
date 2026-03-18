"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { STORES, BRANCH_COLORS, fmtShort } from "../_data";
import ChartCard from "./ChartCard";

const BRANCHES = Object.keys(BRANCH_COLORS);

export default function SalesStoreChart() {
  return (
    <ChartCard title="Ventas por tienda" subtitle="Desglose por sucursal">
      <div className="h-[360px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={STORES} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
            <XAxis
              dataKey="tienda"
              tick={{ fontSize: 11, fill: "#737378" }}
              axisLine={{ stroke: "#E5E5E6" }}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
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
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E6", fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {BRANCHES.map(b => (
              <Bar
                key={b}
                dataKey={b}
                stackId="a"
                fill={BRANCH_COLORS[b]}
                radius={b === "Quilicura" ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
