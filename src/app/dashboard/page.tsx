"use client";

import {
  Calendar,
  DollarSign,
  ShoppingCart,
  Receipt,
  ShoppingBag,
} from "lucide-react";
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

      {/* ── ROW 1: KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ingresos totales"
          prefix="$"
          value="3.395M"
          delta={{ value: "+25.2%", label: "vs mismo período 2025", color: "green" }}
          icon={<DollarSign className="w-5 h-5" />}
          sparkline={[20,25,22,30,28,35,32,40,38,45,42,50,48,55,60]}
        />
        <KpiCard
          title="Suscripciones"
          value="353"
          delta={{ value: "+180.2%", label: "vs mismo período 2025", color: "green" }}
          icon={<ShoppingCart className="w-5 h-5" />}
          sparkline={[5,8,6,12,10,15,14,20,18,25,30,28,35,40,45]}
        />
        <KpiCard
          title="Ventas"
          value="1.835"
          delta={{ value: "+19.1%", label: "vs mismo período 2025", color: "green" }}
          icon={<Receipt className="w-5 h-5" />}
          sparkline={[30,32,28,35,33,38,36,40,42,45,43,48,50,52,55]}
        />
        <KpiCard
          title="Activos ahora"
          value="86"
          delta={{ value: "+30", label: "vs mismo período 2025", color: "blue" }}
          icon={<ShoppingBag className="w-5 h-5" />}
          sparkline={[40,38,42,35,45,40,48,42,50,45,38,42,48,44,46]}
          sparklineColor="#6366f1"
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
