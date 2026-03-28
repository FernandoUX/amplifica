"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight, Search, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ExternalLink, Clock, Package, Truck, CheckCircle2, XCircle, Ban } from "lucide-react";
import { getAllRedistribuciones } from "@/app/pedidos-b2b/_data";
import type { RedistribucionEstado } from "@/app/pedidos-b2b/_data";
import RedistribucionBadge from "@/components/b2b/RedistribucionBadge";

type TabConfig = {
  key: RedistribucionEstado | "Todas";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  activeIconColor?: string;
  activeBadgeColor: string;
  inactiveBadgeColor: string;
};

const TABS_REDIST: TabConfig[] = [
  { key: "Todas", label: "Todas", activeBadgeColor: "bg-primary-25 text-primary-900", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "Solicitada", label: "Solicitada", icon: Clock, activeIconColor: "text-neutral-600", activeBadgeColor: "bg-neutral-200 text-neutral-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "Reservada en origen", label: "Reservada", icon: Package, activeIconColor: "text-blue-500", activeBadgeColor: "bg-blue-100 text-blue-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "En tránsito", label: "En tránsito", icon: Truck, activeIconColor: "text-amber-500", activeBadgeColor: "bg-amber-100 text-amber-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "Recibida en destino", label: "Recibida", icon: CheckCircle2, activeIconColor: "text-green-500", activeBadgeColor: "bg-green-100 text-green-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "Fallida", label: "Fallida", icon: XCircle, activeIconColor: "text-red-500", activeBadgeColor: "bg-red-100 text-red-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "Cancelada", label: "Cancelada", icon: Ban, activeIconColor: "text-neutral-400", activeBadgeColor: "bg-neutral-200 text-neutral-600", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
];

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) + " " + date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

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

export default function RedistribucionesPage() {
  const allRedist = useMemo(() => getAllRedistribuciones(), []);
  const [estadoFilter, setEstadoFilter] = useState<RedistribucionEstado | "Todas">("Todas");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Skeleton loading (Phase 4)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => {
    return allRedist.filter(r => {
      if (estadoFilter !== "Todas" && r.estado !== estadoFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.sku.toLowerCase().includes(q) || r.productoNombre.toLowerCase().includes(q) || r.idAmplifica.toLowerCase().includes(q) || r.sellerName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allRedist, estadoFilter, search]);

  const activas = allRedist.filter(r => !["Recibida en destino", "Fallida", "Cancelada"].includes(r.estado)).length;

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx    = (clampedPage - 1) * pageSize;
  const fromRow     = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow       = Math.min(startIdx + pageSize, filtered.length);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-6 space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/pedidos-b2b" className="hover:text-primary-500 transition-colors">Pedidos B2B</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Redistribuciones</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-orange-500" />
            Redistribuciones de stock
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {activas} redistribuciones activas · {allRedist.length} total
          </p>
        </div>
      </div>

      {/* Filters — design system Variante B (pill tabs) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden bg-neutral-100 rounded-xl p-1 flex-1" style={{ scrollbarWidth: "none" }}>
          {TABS_REDIST.map(tab => {
            const isActive = estadoFilter === tab.key;
            const count = tab.key === "Todas" ? allRedist.length : allRedist.filter(r => r.estado === tab.key).length;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setEstadoFilter(tab.key); setPage(1); }}
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

        {/* Search — design system pattern */}
        <div className="relative w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9 pr-3 h-10 w-full bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
          <div className="animate-pulse p-4 space-y-3">
            <div className="h-9 bg-neutral-100 rounded-lg w-full" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-neutral-50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div className="border border-neutral-200 rounded-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm" style={{ whiteSpace: "nowrap" }}>
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">ID</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Pedido</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Seller</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">SKU</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Producto</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700">Cant.</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Origen</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Estado</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Estimada</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700 w-[60px] bg-neutral-50 sticky right-0" style={{ boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                        <ArrowLeftRight className="w-5 h-5 text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-600">
                        {search ? "No se encontraron redistribuciones" : "No hay redistribuciones activas"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {search
                          ? "Intenta ajustar la búsqueda o filtros"
                          : "Las redistribuciones se generan automáticamente cuando un pedido B2B requiere stock de otra sucursal"}
                      </p>
                      {!search && (
                        <Link href="/pedidos-b2b" className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                          Volver a pedidos B2B
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.slice(startIdx, startIdx + pageSize).map(r => (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors duration-150">
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 rounded px-1 py-0.5 text-xs font-mono cursor-default transition-colors">
                        {r.id}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Link href={`/pedidos-b2b/${r.pedidoId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                        {r.idAmplifica}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-sm text-neutral-700">{r.sellerName}</td>
                    <td className="py-2 px-2 text-xs font-mono text-neutral-600">{r.sku}</td>
                    <td className="py-2 px-2 text-sm text-neutral-800 truncate max-w-[200px]">{r.productoNombre}</td>
                    <td className="py-2 px-2 text-sm text-right font-mono text-neutral-700">{r.cantidad}</td>
                    <td className="py-2 px-2 text-sm text-neutral-600">{r.sucursalOrigen}</td>
                    <td className="py-2 px-2"><RedistribucionBadge estado={r.estado} /></td>
                    <td className="py-2 px-2 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(r.fechaEstimada)}</td>
                    <td className="py-2 px-2 text-right bg-white sticky right-0" style={{ boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}>
                      <Link
                        href={`/pedidos-b2b/${r.pedidoId}`}
                        className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors inline-flex"
                        title="Ver pedido"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Paginación — patrón design system (numbered pages) */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
            <span className="text-neutral-500">Mostrar</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-transparent font-medium focus:outline-none cursor-pointer">
              <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
            </select>
          </label>
          <span className="text-sm text-neutral-500 tabular-nums">{fromRow}–{toRow} de {filtered.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button disabled={clampedPage === 1} onClick={() => setPage(1)} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Primera página">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button disabled={clampedPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Anterior">
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
          <button disabled={clampedPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Siguiente">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button disabled={clampedPage === totalPages} onClick={() => setPage(totalPages)} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Última página">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
