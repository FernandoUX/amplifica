"use client";

import { Calendar } from "lucide-react";
import {
  CurrencyDollar,
  ShoppingCart01,
  Receipt,
  ShoppingBag02,
} from "@untitled-ui/icons-react";
import KpiCard from "./_components/KpiCard";
import SalesTrendChart from "./_components/SalesTrendChart";
import SalesChannelChart from "./_components/SalesChannelChart";
import SalesBranchChart from "./_components/SalesBranchChart";
import SalesStoreChart from "./_components/SalesStoreChart";
import TopProductsTable from "./_components/TopProductsTable";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px]">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="text-xs text-neutral-400">
        <span className="hover:text-neutral-600 cursor-pointer">Inicio</span>
        <span className="mx-1.5">›</span>
        <span className="text-neutral-600">Dashboard</span>
      </nav>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Resumen ejecutivo de ventas</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="tabular-nums">18/02/2026 – 18/03/2026</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI Cards (with icons, no sparklines) ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas Totales"
          prefix="$"
          value="3.395.491.104"
          delta={{ value: "+12,4%", label: "desde el mes pasado", color: "green" }}
          icon={<CurrencyDollar className="w-5 h-5" />}
        />
        <KpiCard
          title="Pedidos Totales"
          value="51.393"
          delta={{ value: "+8,2%", label: "desde el mes pasado", color: "green" }}
          icon={<ShoppingCart01 className="w-5 h-5" />}
        />
        <KpiCard
          title="Ticket Promedio"
          prefix="$"
          value="66.069"
          delta={{ value: "+3,8%", label: "desde el mes pasado", color: "green" }}
          icon={<Receipt className="w-5 h-5" />}
        />
        <KpiCard
          title="Canasta Promedio"
          value="3,2"
          delta={{ value: "-0,1", label: "desde el mes pasado", color: "red" }}
          icon={<ShoppingBag02 className="w-5 h-5" />}
        />
      </div>

      {/* ── ROW 2: Area chart ventas por día (full width) ───────────── */}
      <SalesTrendChart />

      {/* ── ROW 3: Donut canales + Bar horizontal sucursales ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesChannelChart />
        <SalesBranchChart />
      </div>

      {/* ── ROW 4: Bar agrupado tiendas (full width) ────────────────── */}
      <SalesStoreChart />

      {/* ── ROW 5: Top productos tabla ──────────────────────────────── */}
      <TopProductsTable />
    </div>
  );
}
