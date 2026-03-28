"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  Plus, Eye, Clock, PackageCheck, Truck, CheckCircle2, Ban, Package,
  Send, Store,
} from "lucide-react";
import Button from "@/components/ui/Button";
import CopyableId from "@/components/ui/CopyableId";

// ─── Types ────────────────────────────────────────────────────────────────────
type EntregaEstado = "pendiente" | "lista_para_envio" | "en_transito" | "entregada" | "cancelada";
type EntregaTipo = "envio" | "retiro";

type Entrega = {
  id: string;
  seller: string;
  sucursal: string;
  tipo: EntregaTipo;
  courier: string | null;
  bultos: number;
  estado: EntregaEstado;
  fecha: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

// ─── Status config ────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<EntregaEstado, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendiente:        { label: "Pendiente",         className: "bg-amber-50 text-amber-700",   icon: Clock },
  lista_para_envio: { label: "Lista para envio",  className: "bg-indigo-50 text-indigo-700", icon: PackageCheck },
  en_transito:      { label: "En transito",       className: "bg-sky-50 text-sky-700",       icon: Truck },
  entregada:        { label: "Entregada",          className: "bg-green-50 text-green-700",   icon: CheckCircle2 },
  cancelada:        { label: "Cancelada",          className: "bg-red-50 text-red-700",       icon: Ban },
};

function EntregaStatusBadge({ estado }: { estado: EntregaEstado }) {
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
  key: EntregaEstado | "todas";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  activeIconColor?: string;
  activeBadgeColor: string;
  inactiveBadgeColor: string;
};

const STATUS_TABS: TabConfig[] = [
  { key: "todas",            label: "Todas",            activeBadgeColor: "bg-primary-25 text-primary-900",    inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "pendiente",        label: "Pendiente",        icon: Clock,        activeIconColor: "text-amber-500",   activeBadgeColor: "bg-amber-100 text-amber-700",   inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "lista_para_envio", label: "Lista para envio", icon: PackageCheck, activeIconColor: "text-indigo-500",  activeBadgeColor: "bg-indigo-100 text-indigo-700", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "en_transito",      label: "En transito",      icon: Truck,        activeIconColor: "text-sky-500",     activeBadgeColor: "bg-sky-100 text-sky-700",       inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "entregada",        label: "Entregada",        icon: CheckCircle2, activeIconColor: "text-green-500",   activeBadgeColor: "bg-green-100 text-green-700",   inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
  { key: "cancelada",        label: "Cancelada",        icon: Ban,          activeIconColor: "text-neutral-400", activeBadgeColor: "bg-neutral-200 text-neutral-600", inactiveBadgeColor: "bg-neutral-200/70 text-neutral-500" },
];

// ─── Type tabs ────────────────────────────────────────────────────────────────
type TypeTabKey = "envio" | "retiro";
const TYPE_TABS: { key: TypeTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "envio",  label: "Para envio",             icon: Send },
  { key: "retiro", label: "Para retiro en tienda",  icon: Store },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ENTREGAS: Entrega[] = [
  { id: "ENT-0001", seller: "Extra Life",      sucursal: "CD Quilicura",    tipo: "envio",  courier: "Blue Express",  bultos: 3, estado: "pendiente",        fecha: "2025-03-25T10:30:00" },
  { id: "ENT-0002", seller: "Le Vice",         sucursal: "Santiago Centro", tipo: "retiro", courier: null,            bultos: 1, estado: "pendiente",        fecha: "2025-03-25T11:15:00" },
  { id: "ENT-0003", seller: "GoHard",          sucursal: "Quilicura",       tipo: "envio",  courier: "Chilexpress",   bultos: 5, estado: "pendiente",        fecha: "2025-03-25T14:00:00" },
  { id: "ENT-0004", seller: "Bekoko",          sucursal: "CD Quilicura",    tipo: "envio",  courier: "Starken",       bultos: 2, estado: "lista_para_envio", fecha: "2025-03-24T09:00:00" },
  { id: "ENT-0005", seller: "Mundo Fungi",     sucursal: "La Reina",        tipo: "retiro", courier: null,            bultos: 1, estado: "lista_para_envio", fecha: "2025-03-24T10:30:00" },
  { id: "ENT-0006", seller: "Xclusive",        sucursal: "CD Quilicura",    tipo: "envio",  courier: "Blue Express",  bultos: 4, estado: "lista_para_envio", fecha: "2025-03-24T13:45:00" },
  { id: "ENT-0007", seller: "Boqa",            sucursal: "Santiago Centro", tipo: "retiro", courier: null,            bultos: 2, estado: "lista_para_envio", fecha: "2025-03-24T15:20:00" },
  { id: "ENT-0008", seller: "Mind Nutrition",  sucursal: "CD Quilicura",    tipo: "envio",  courier: "Uber Direct",   bultos: 1, estado: "en_transito",      fecha: "2025-03-23T08:00:00" },
  { id: "ENT-0009", seller: "Basics",          sucursal: "Quilicura",       tipo: "envio",  courier: "Chilexpress",   bultos: 6, estado: "en_transito",      fecha: "2025-03-23T10:00:00" },
  { id: "ENT-0010", seller: "Your Goal",       sucursal: "CD Quilicura",    tipo: "envio",  courier: "Blue Express",  bultos: 3, estado: "en_transito",      fecha: "2025-03-23T12:30:00" },
  { id: "ENT-0011", seller: "MamaMia",         sucursal: "Lo Barnechea",    tipo: "retiro", courier: null,            bultos: 2, estado: "entregada",        fecha: "2025-03-22T09:00:00" },
  { id: "ENT-0012", seller: "Saint Venik",     sucursal: "CD Quilicura",    tipo: "envio",  courier: "Starken",       bultos: 4, estado: "entregada",        fecha: "2025-03-22T11:00:00" },
  { id: "ENT-0013", seller: "Teregott",        sucursal: "Santiago Centro", tipo: "retiro", courier: null,            bultos: 1, estado: "entregada",        fecha: "2025-03-22T14:30:00" },
  { id: "ENT-0014", seller: "Ergopouch",       sucursal: "CD Quilicura",    tipo: "envio",  courier: "Blue Express",  bultos: 2, estado: "cancelada",        fecha: "2025-03-21T10:00:00" },
  { id: "ENT-0015", seller: "Okwu",            sucursal: "Quilicura",       tipo: "retiro", courier: null,            bultos: 1, estado: "cancelada",        fecha: "2025-03-21T16:00:00" },
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
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="py-2 px-2">
          <div className="h-4 bg-neutral-100 rounded animate-pulse" style={{ width: i === 4 ? "100px" : "70px" }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EntregasPage() {
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState<TypeTabKey>("envio");
  const [statusFilter, setStatusFilter] = useState<EntregaEstado | "todas">("todas");
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
    return MOCK_ENTREGAS.filter(e => {
      // Filter by type tab
      if (e.tipo !== typeTab) return false;
      // Filter by status
      if (statusFilter !== "todas" && e.estado !== statusFilter) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        return e.id.toLowerCase().includes(q) || e.seller.toLowerCase().includes(q);
      }
      return true;
    });
  }, [typeTab, statusFilter, search]);

  // Counts per type tab
  const envioCount = MOCK_ENTREGAS.filter(e => e.tipo === "envio").length;
  const retiroCount = MOCK_ENTREGAS.filter(e => e.tipo === "retiro").length;
  const typeTabCounts: Record<TypeTabKey, number> = { envio: envioCount, retiro: retiroCount };

  // Status counts (for current type tab)
  const currentTypeEntregas = MOCK_ENTREGAS.filter(e => e.tipo === typeTab);
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: currentTypeEntregas.length };
    STATUS_TABS.forEach(t => {
      if (t.key !== "todas") {
        counts[t.key] = currentTypeEntregas.filter(e => e.estado === t.key).length;
      }
    });
    return counts;
  }, [currentTypeEntregas]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const fromRow = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow = Math.min(startIdx + pageSize, filtered.length);

  return (
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Link href="/devoluciones" className="hover:text-primary-500 transition-colors">Devoluciones</Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-neutral-700 font-medium">Entregas</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                Entregas de devoluciones
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {MOCK_ENTREGAS.length} entregas registradas
              </p>
            </div>
            <Button variant="primary" size="md" iconLeft={<Plus className="w-4 h-4" />}>
              Nueva entrega
            </Button>
          </div>

          {/* Type tabs */}
          <div className="flex items-center gap-1 border-b border-neutral-200 mb-4">
            {TYPE_TABS.map(tab => {
              const isActive = typeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setTypeTab(tab.key); setStatusFilter("todas"); setSearch(""); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? "border-primary-500 text-primary-500"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary-500" : "text-neutral-400"}`} />
                  {tab.label}
                  <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full font-medium leading-none ${
                    isActive ? "bg-primary-100 text-primary-600" : "bg-neutral-200/70 text-neutral-500"
                  }`}>
                    {typeTabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status pill tabs + Search */}
          <div className="flex items-center gap-3 mb-3">
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

            {/* Search */}
            <div className="relative w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por ID o seller..."
                className="pl-9 pr-3 h-10 w-full bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          {/* Table */}
          <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
              <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal" style={{ whiteSpace: "nowrap" }}>
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>ID entrega</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Seller</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Sucursal</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Tipo</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Courier</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Bultos</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Estado</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>Fecha</th>
                    <th className="w-[80px] py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50" style={{ ...NW, ...stickyRight }}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-neutral-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-600">No hay entregas registradas</p>
                            <p className="text-xs text-neutral-400 mt-1">Crea una nueva entrega para comenzar</p>
                          </div>
                          <Button variant="primary" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />}>
                            Nueva entrega
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.slice(startIdx, startIdx + pageSize).map(e => (
                      <tr key={e.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2 px-2">
                          <CopyableId value={e.id} />
                        </td>
                        <td className="py-2 px-2 text-sm text-neutral-700">{e.seller}</td>
                        <td className="py-2 px-2 text-sm text-neutral-600">{e.sucursal}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            e.tipo === "envio" ? "text-sky-700" : "text-amber-700"
                          }`}>
                            {e.tipo === "envio" ? <Send className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                            {e.tipo === "envio" ? "Envio" : "Retiro"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-sm text-neutral-600">
                          {e.courier ?? "Retiro presencial"}
                        </td>
                        <td className="py-2 px-2 text-sm text-right font-mono text-neutral-700">{e.bultos}</td>
                        <td className="py-2 px-2">
                          <EntregaStatusBadge estado={e.estado} />
                        </td>
                        <td className="py-2 px-2 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(e.fecha)}</td>
                        <td className="py-2 px-2 text-right bg-white" style={stickyRight}>
                          <Link
                            href={`/devoluciones/entregas/${e.id}`}
                            className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors inline-flex"
                            title="Ver entrega"
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
    </div>
  );
}
