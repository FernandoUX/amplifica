"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, LabelList,
} from "recharts";
import { BRANCHES, BRANCH_COLORS, fmtShort } from "../_data";
import ChartCard from "./ChartCard";

// Sort desc by value
const sorted = [...BRANCHES].sort((a, b) => b.value - a.value);

export default function SalesBranchChart() {
  return (
    <ChartCard title="Ventas por sucursal" subtitle="Ranking por monto total">
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 60, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={fmtShort}
              tick={{ fontSize: 11, fill: "#737378" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#414144" }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              formatter={(v) => fmtShort(Number(v))}
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E6", fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {sorted.map((entry) => (
                <Cell key={entry.name} fill={BRANCH_COLORS[entry.name] ?? "#D1D5DB"} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => fmtShort(Number(v))}
                style={{ fontSize: 11, fontWeight: 600, fill: "#414144" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
