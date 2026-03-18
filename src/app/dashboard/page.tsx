"use client";

import { Calendar } from "lucide-react";
import { KPIS } from "./_data";
import KpiCard from "./_components/KpiCard";
import SalesTrendChart from "./_components/SalesTrendChart";
import SalesChannelChart from "./_components/SalesChannelChart";
import SalesBranchChart from "./_components/SalesBranchChart";
import SalesStoreChart from "./_components/SalesStoreChart";
import TopProductsTable from "./_components/TopProductsTable";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Resumen ejecutivo de ventas</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="tabular-nums">18/02/2026 – 18/03/2026</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(kpi => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* ── ROW 2: Ventas por día (line chart — full width) ────────────── */}
      <SalesTrendChart />

      {/* ── ROW 3: Donut canales + Bar horizontal sucursales ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesChannelChart />
        <SalesBranchChart />
      </div>

      {/* ── ROW 4: Ventas por tienda (stacked bar — full width) ─────────── */}
      <SalesStoreChart />

      {/* ── ROW 5: Top productos (tabla con tabs) ──────────────────────── */}
      <TopProductsTable />
    </div>
  );
}
