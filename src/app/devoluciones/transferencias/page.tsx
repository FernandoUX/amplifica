"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Plus, Check, Eye, ArrowLeftRight,
  Clock, Package, Truck, AlertTriangle, CheckCircle2, Ban,
} from "lucide-react";
import TransferStatusBadge, { type TransferStatus, transferStatusConfig } from "@/components/devoluciones/TransferStatusBadge";
import Button from "@/components/ui/Button";
import CopyableId from "@/components/ui/CopyableId";
import { MOCK_TRANSFER_ORDERS, type TransferOrder } from "../_data";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return (
      date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) +
      " " +
      date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return d;
  }
}

// ─── Pagination helper ────────────────────────────────────────────────────────
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= Math.min(3, total); i++) pages.push(i);
  const mid = new Set<number>();
  for (let i = current - 1; i <= current + 1; i++) {
    if (i > 3 && i < total - 2) mid.add(i);
  }
  if (mid.size > 0) {
    if (Math.min(...mid) > 4) pages.push("...");
    [...mid].sort((a, b) => a - b).forEach(p => pages.push(p));
    if (Math.max(...mid) < total - 3) pages.push("...");
  } else { pages.push("..."); }
  for (let i = Math.max(total - 2, 4); i <= total; i++) pages.push(i);
  return pages;
}

// ─── Tab config ───────────────────────────────────────────────────────────────
type TabConfig = {
  key: TransferStatus | "todas";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  activeIconColor?: string;
  activeBadgeColor: string;
  inactiveBadgeColor: string;
};

const TABS: TabConfig[] = [
  { key: "todas", label: "Todas", activeBadgeColor: "bg-primary-25 text-primary-900", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "pendiente", label: "Pendiente", icon: Clock, activeIconColor: "text-neutral-600", activeBadgeColor: "bg-neutral-200 text-neutral-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "en_preparacion", label: "En preparación", icon: Package, activeIconColor: "text-amber-500", activeBadgeColor: "bg-amber-100 text-amber-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "en_transito", label: "En tránsito", icon: Truck, activeIconColor: "text-sky-500", activeBadgeColor: "bg-sky-100 text-sky-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "recibida_parcial", label: "Parcial", icon: AlertTriangle, activeIconColor: "text-orange-500", activeBadgeColor: "bg-orange-100 text-orange-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "recibida_completa", label: "Completada", icon: CheckCircle2, activeIconColor: "text-green-500", activeBadgeColor: "bg-green-100 text-green-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "cancelada", label: "Cancelada", icon: Ban, activeIconColor: "text-neutral-400", activeBadgeColor: "bg-neutral-200 text-neutral-600", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
];

// ─── Page component ───────────────────────────────────────────────────────────
export default function TransferenciasPage() {
  const allOrders = useMemo(() => MOCK_TRANSFER_ORDERS, []);
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "todas">("todas");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    return allOrders.filter(o => {
      if (statusFilter !== "todas" && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.displayId.toLowerCase().includes(q) ||
          o.sellerName.toLowerCase().includes(q) ||
          o.destinationBranch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allOrders, statusFilter, search]);

  const activas = allOrders.filter(o => !["recibida_completa", "cancelada"].includes(o.status)).length;

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx    = (clampedPage - 1) * pageSize;
  const fromRow     = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow       = Math.min(startIdx + pageSize, filtered.length);

  return (
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/devoluciones" className="hover:text-primary-500 transition-colors">Devoluciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Transferencias</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary-500" />
            Transferencias entre sucursales
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {activas} transferencias activas &middot; {allOrders.length} total
          </p>
        </div>
        <Button href="/devoluciones/transferencias/crear" iconLeft={<Plus className="w-4 h-4" />}>
          Crear transferencia
        </Button>
      </div>

      {/* Pill tabs */}
      <div className="flex items-center gap-3">
        <div role="tablist" aria-label="Filtrar por estado" className="flex items-center gap-1 overflow-x-auto overflow-y-hidden bg-neutral-100 rounded-xl p-1 flex-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map(tab => {
            const isActive = statusFilter === tab.key;
            const count = tab.key === "todas" ? allOrders.length : allOrders.filter(o => o.status === tab.key).length;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? "bg-white text-neutral-900 font-medium shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50/60"
                }`}
                style={{ letterSpacing: "-0.02em" }}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? tab.activeIconColor : "text-neutral-400"}`} />}
                {tab.label}
                <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full font-medium leading-none ${
                  isActive ? tab.activeBadgeColor : tab.inactiveBadgeColor
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID, seller..."
            className="pl-9 pr-3 h-8 w-full bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
          <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal" style={{ whiteSpace: "nowrap" }}>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>ID</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Seller</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Destino</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Estado</th>
                <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Progreso</th>
                <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Tramos</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Fecha creación</th>
                <th className="w-[80px] py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50" style={{ ...NW, ...stickyRight }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowLeftRight className="w-10 h-10 text-neutral-200" />
                      <p className="text-sm text-neutral-500">No hay transferencias registradas</p>
                      <Button href="/devoluciones/transferencias/crear" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />}>
                        Crear transferencia
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.slice(startIdx, startIdx + pageSize).map(o => (
                  <tr key={o.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-2 px-2">
                      <CopyableId value={o.displayId} />
                    </td>
                    <td className="py-2 px-2 text-sm text-neutral-700">{o.sellerName}</td>
                    <td className="py-2 px-2 text-sm text-neutral-600">{o.destinationBranch}</td>
                    <td className="py-2 px-2">
                      <TransferStatusBadge status={o.status} />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="text-sm font-mono text-neutral-700">
                        {o.totalReceived}/{o.totalReturns}
                      </span>
                      <span className="text-xs text-neutral-500 ml-1">recibidas</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                        {o.legs.length}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs text-neutral-500">{fmtDate(o.createdAt)}</td>
                    <td className="py-2 px-2 text-right bg-white" style={stickyRight}>
                      <Link
                        href={`/devoluciones/transferencias/${o.id}`}
                        className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors inline-flex"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
                <span className="text-neutral-500">Mostrar</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-transparent font-medium focus:outline-none cursor-pointer">
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <span className="text-sm text-neutral-500 tabular-nums">{fromRow}–{toRow} de {filtered.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={clampedPage <= 1} onClick={() => setPage(1)} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Primera página">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button disabled={clampedPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Anterior">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="hidden sm:flex items-center gap-0.5">
                {getPageNumbers(clampedPage, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-neutral-400 text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${clampedPage === p ? "bg-primary-25 text-primary-900" : "text-neutral-600 hover:bg-neutral-100"}`}>{p}</button>
                  )
                )}
              </div>
              <button disabled={clampedPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Siguiente">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button disabled={clampedPage >= totalPages} onClick={() => setPage(totalPages)} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Última página">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
