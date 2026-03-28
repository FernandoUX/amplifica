"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  Plus, Eye, Clock, Settings, CheckCircle2, Package, LayoutGrid, List,
  MapPin, User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import CopyableId from "@/components/ui/CopyableId";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaqueteEstado = "pendiente" | "en_gestion" | "resuelto";

type PaqueteDesconocido = {
  id: string;
  ubicacion: string;
  sucursal: string;
  estado: PaqueteEstado;
  fechaRegistro: string;
  registradoPor: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

// ─── Status config ────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<PaqueteEstado, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendiente:  { label: "Pendiente",   className: "bg-amber-50 text-amber-700",  icon: Clock },
  en_gestion: { label: "En gestion",  className: "bg-sky-50 text-sky-700",      icon: Settings },
  resuelto:   { label: "Resuelto",    className: "bg-green-50 text-green-700",  icon: CheckCircle2 },
};

function PaqueteStatusBadge({ estado }: { estado: PaqueteEstado }) {
  const cfg = ESTADO_CONFIG[estado];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${cfg.className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {cfg.label}
    </span>
  );
}

// ─── Tab config (pill variant B) ──────────────────────────────────────────────
type TabConfig = {
  key: PaqueteEstado | "todos";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  activeIconColor?: string;
  activeBadgeColor: string;
  inactiveBadgeColor: string;
};

const STATUS_TABS: TabConfig[] = [
  { key: "todos",      label: "Todos",       activeBadgeColor: "bg-primary-25 text-primary-900",    inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "pendiente",  label: "Pendiente",   icon: Clock,        activeIconColor: "text-amber-500",  activeBadgeColor: "bg-amber-100 text-amber-700",  inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "en_gestion", label: "En gestion",  icon: Settings,     activeIconColor: "text-sky-500",    activeBadgeColor: "bg-sky-100 text-sky-700",      inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "resuelto",   label: "Resuelto",    icon: CheckCircle2, activeIconColor: "text-green-500",  activeBadgeColor: "bg-green-100 text-green-700",  inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PAQUETES: PaqueteDesconocido[] = [
  { id: "PKG-100001", ubicacion: "Pasillo 1, Rack A3",     sucursal: "CD Quilicura",    estado: "pendiente",  fechaRegistro: "2025-03-26T09:15:00", registradoPor: "Carlos Mendez" },
  { id: "PKG-100002", ubicacion: "Zona staging",           sucursal: "Santiago Centro", estado: "pendiente",  fechaRegistro: "2025-03-26T10:30:00", registradoPor: "Ana Torres" },
  { id: "PKG-100003", ubicacion: "Pasillo 2, Rack B1",     sucursal: "CD Quilicura",    estado: "pendiente",  fechaRegistro: "2025-03-25T14:00:00", registradoPor: "Pedro Soto" },
  { id: "PKG-100004", ubicacion: "Dock recepcion",         sucursal: "Quilicura",       estado: "pendiente",  fechaRegistro: "2025-03-25T16:45:00", registradoPor: "Maria Lopez" },
  { id: "PKG-100005", ubicacion: "Pasillo 3, Rack C2",     sucursal: "CD Quilicura",    estado: "en_gestion", fechaRegistro: "2025-03-24T08:00:00", registradoPor: "Carlos Mendez" },
  { id: "PKG-100006", ubicacion: "Zona staging",           sucursal: "La Reina",        estado: "en_gestion", fechaRegistro: "2025-03-24T11:20:00", registradoPor: "Ana Torres" },
  { id: "PKG-100007", ubicacion: "Pasillo 1, Rack A1",     sucursal: "CD Quilicura",    estado: "en_gestion", fechaRegistro: "2025-03-23T15:30:00", registradoPor: "Pedro Soto" },
  { id: "PKG-100008", ubicacion: "Pasillo 2, Rack B4",     sucursal: "CD Quilicura",    estado: "resuelto",   fechaRegistro: "2025-03-22T09:00:00", registradoPor: "Maria Lopez" },
  { id: "PKG-100009", ubicacion: "Dock recepcion",         sucursal: "Santiago Centro", estado: "resuelto",   fechaRegistro: "2025-03-21T10:45:00", registradoPor: "Carlos Mendez" },
  { id: "PKG-100010", ubicacion: "Zona staging",           sucursal: "Lo Barnechea",    estado: "resuelto",   fechaRegistro: "2025-03-20T14:15:00", registradoPor: "Ana Torres" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  } else {
    pages.push("...");
  }
  for (let i = Math.max(total - 2, 4); i <= total; i++) pages.push(i);
  return pages;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-2 px-2">
          <div className="h-4 bg-neutral-100 rounded animate-pulse" style={{ width: i === 0 ? "40px" : i === 4 ? "100px" : "70px" }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white animate-pulse">
      <div className="w-full h-40 bg-neutral-100" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-neutral-100 rounded w-24" />
        <div className="h-3 bg-neutral-100 rounded w-32" />
        <div className="h-3 bg-neutral-100 rounded w-20" />
      </div>
    </div>
  );
}

// ─── Photo placeholder ────────────────────────────────────────────────────────
function PhotoPlaceholder({ size = "sm" }: { size?: "sm" | "lg" }) {
  if (size === "lg") {
    return (
      <div className="w-full h-40 bg-neutral-100 flex items-center justify-center">
        <Package className="w-10 h-10 text-neutral-300" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
      <Package className="w-5 h-5 text-neutral-300" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PaquetesDesconocidosPage() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "gallery">("table");
  const [statusFilter, setStatusFilter] = useState<PaqueteEstado | "todos">("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Simulated loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Filtered data
  const filtered = useMemo(() => {
    return MOCK_PAQUETES.filter(p => {
      if (statusFilter !== "todos" && p.estado !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.id.toLowerCase().includes(q) || p.ubicacion.toLowerCase().includes(q);
      }
      return true;
    });
  }, [statusFilter, search]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: MOCK_PAQUETES.length };
    STATUS_TABS.forEach(t => {
      if (t.key !== "todos") {
        counts[t.key] = MOCK_PAQUETES.filter(p => p.estado === t.key).length;
      }
    });
    return counts;
  }, []);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const fromRow = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow = Math.min(startIdx + pageSize, filtered.length);
  const paginatedItems = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Link href="/devoluciones" className="hover:text-primary-500 transition-colors">Devoluciones</Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-neutral-700 font-medium">Paquetes desconocidos</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Paquetes desconocidos
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {MOCK_PAQUETES.filter(p => p.estado === "pendiente").length} pendientes de resolver  ·  {MOCK_PAQUETES.length} total
              </p>
            </div>
            <Button variant="primary" size="md" iconLeft={<Plus className="w-4 h-4" />}>
              Registrar paquete
            </Button>
          </div>

          {/* Status pill tabs + View toggle + Search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden bg-neutral-100 rounded-xl p-1 flex-1" style={{ scrollbarWidth: "none" }}>
              {STATUS_TABS.map(tab => {
                const isActive = statusFilter === tab.key;
                const count = statusCounts[tab.key] ?? 0;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
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

            {/* View toggle */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
                title="Vista tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("gallery")}
                className={`flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200 ${
                  viewMode === "gallery"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
                title="Vista galeria"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por ID o ubicacion..."
                className="pl-9 pr-3 h-10 w-full bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          {/* Content — Table view */}
          {viewMode === "table" && (
            <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
                <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal" style={{ whiteSpace: "nowrap" }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 w-[56px]" style={NW}>Foto</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>ID</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Ubicacion</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Sucursal</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Estado</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Fecha registro</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Registrado por</th>
                      <th className="w-[80px] text-right py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50" style={{ ...NW, ...stickyRight }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-2 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-neutral-300" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-600">No hay paquetes desconocidos registrados</p>
                              <p className="text-xs text-neutral-400 mt-1">Registra un paquete cuando llegue uno sin identificar</p>
                            </div>
                            <Button variant="primary" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />}>
                              Registrar paquete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-2 px-2">
                            <PhotoPlaceholder size="sm" />
                          </td>
                          <td className="py-2 px-2">
                            <CopyableId value={p.id} />
                          </td>
                          <td className="py-2 px-2">
                            <span className="inline-flex items-center gap-1 text-sm text-neutral-700">
                              <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                              {p.ubicacion}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-sm text-neutral-600">{p.sucursal}</td>
                          <td className="py-2 px-2">
                            <PaqueteStatusBadge estado={p.estado} />
                          </td>
                          <td className="py-2 px-2 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(p.fechaRegistro)}</td>
                          <td className="py-2 px-2">
                            <span className="inline-flex items-center gap-1 text-sm text-neutral-600">
                              <User className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                              {p.registradoPor}
                            </span>
                          </td>
                          <td className="py-2 px-2 bg-white" style={stickyRight}>
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/devoluciones/paquetes-desconocidos/${p.id}`}
                                className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors inline-flex"
                                title="Ver paquete"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              {p.estado !== "resuelto" && (
                                <button
                                  className="p-2 rounded-md hover:bg-green-50 text-neutral-400 hover:text-green-600 transition-colors inline-flex"
                                  title="Resolver"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination — inside table container */}
              {!loading && filtered.length > 0 && (
                <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
                      <span className="text-neutral-500">Mostrar</span>
                      <select
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="bg-transparent font-medium focus:outline-none cursor-pointer"
                      >
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
          )}

          {/* Content — Gallery view */}
          {viewMode === "gallery" && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-neutral-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-neutral-600">No hay paquetes desconocidos registrados</p>
                    <p className="text-xs text-neutral-400 mt-1">Registra un paquete cuando llegue uno sin identificar</p>
                  </div>
                  <Button variant="primary" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />}>
                    Registrar paquete
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedItems.map(p => (
                    <div
                      key={p.id}
                      className="border border-neutral-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-200 group"
                    >
                      {/* Photo */}
                      <PhotoPlaceholder size="lg" />

                      {/* Info */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <CopyableId value={p.id} />
                          <PaqueteStatusBadge estado={p.estado} />
                        </div>

                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          {p.ubicacion}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">{fmtDate(p.fechaRegistro)}</span>
                          <span className="text-xs text-neutral-400">{p.sucursal}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-neutral-100">
                          <Link
                            href={`/devoluciones/paquetes-desconocidos/${p.id}`}
                            className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors inline-flex"
                            title="Ver paquete"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {p.estado !== "resuelto" && (
                            <button
                              className="p-2 rounded-md hover:bg-green-50 text-neutral-400 hover:text-green-600 transition-colors inline-flex"
                              title="Resolver"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination — gallery view */}
              {!loading && filtered.length > 0 && (
                <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border border-neutral-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
                      <span className="text-neutral-500">Mostrar</span>
                      <select
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="bg-transparent font-medium focus:outline-none cursor-pointer"
                      >
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
            </>
          )}
    </div>
  );
}
