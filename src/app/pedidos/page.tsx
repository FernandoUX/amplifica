"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Download, Plus,
  Eye, Pencil, Truck, Package, SkipForward, Printer, FileText,
  Share2, Trash2, X, ShoppingBag, CalendarDays, AlertTriangle,
  CheckCircle2, Ban, Play, CircleOff,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import PedidoStatusBadge, { type PedidoStatus } from "@/components/pedidos/PedidoStatusBadge";
import KpiCard from "@/app/dashboard/_components/KpiCard";
import Button from "@/components/ui/Button";
import {
  PEDIDOS, KPIS_ACTUAL, KPIS_MEJORADA,
  TABS_PEDIDOS, TAB_BADGE_COLORS,
  COLS_ACTUAL, COLS_MEJORADA, COL_LABELS, COL_WIDTHS_ACTUAL, COL_WIDTHS_MEJORADA,
  type Pedido, type PedidoColumnKey, type SLABadge,
} from "./_data";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

function toggleInSet<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, val: T) {
  setter(prev => {
    const next = new Set(prev);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  });
}

function searchMatch(p: Pedido, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    String(p.id).includes(lower) ||
    p.fechaCreacion.toLowerCase().includes(lower) ||
    p.idAmplifica.toLowerCase().includes(lower) ||
    p.seller.toLowerCase().includes(lower) ||
    p.sucursal.toLowerCase().includes(lower) ||
    p.canalVenta.toLowerCase().includes(lower) ||
    p.metodoEntrega.toLowerCase().includes(lower) ||
    p.estadoPreparacion.toLowerCase().includes(lower) ||
    p.estadoEnvio.toLowerCase().includes(lower)
  );
}

type SortField = "fechaCreacion" | "id" | null;
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-600 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />;
}

// ─── SLA Badge renderer ──────────────────────────────────────────────────────
function SLABadges({ badges }: { badges: SLABadge[] }) {
  if (!badges.length) return <span className="text-neutral-300 text-xs">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {badges.map((b, i) => {
        const colors: Record<string, string> = {
          blue: "bg-blue-50 text-blue-700",
          green: "bg-green-50 text-green-700",
          red: "bg-red-50 text-red-600",
          amber: "bg-amber-50 text-amber-700",
        };
        return (
          <span key={i} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap w-fit ${colors[b.color] || colors.blue}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              b.color === "blue" ? "bg-blue-400" : b.color === "green" ? "bg-green-400" : b.color === "red" ? "bg-red-400" : "bg-amber-400"
            }`} />
            {b.label}
            {b.version && <span className="text-[9px] opacity-60 ml-0.5">{b.version}</span>}
          </span>
        );
      })}
    </div>
  );
}

// ─── Filter Section (accordion checkboxes) ────────────────────────────────────
function FilterSection({
  title, options, selected, onToggle, renderOption, defaultOpen = true,
}: {
  title: string; options: string[]; selected: Set<string>;
  onToggle: (val: string) => void;
  renderOption?: (val: string) => React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const scrollable = options.length >= 4;
  const count = selected.size;
  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full group">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold leading-none">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className={`space-y-1 mt-2 ${scrollable ? "overflow-y-auto max-h-[176px] pr-1 filter-scroll" : ""}`}>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors duration-300">
              <input type="checkbox" checked={selected.has(opt)} onChange={() => onToggle(opt)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 cursor-pointer" />
              {renderOption ? renderOption(opt) : <span className="text-sm text-neutral-700">{opt}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Actions Cell (mejorada version) ──────────────────────────────────────────
type MenuItem = { label: string; icon?: React.ComponentType<{ className?: string }>; danger?: boolean; onClick?: () => void };
type PrimaryAction = { tooltip: string; icon: React.ComponentType<{ className?: string }> };
type ActionConfig = { primary?: PrimaryAction; menu: MenuItem[] };

function getPedidoActions(estado: PedidoStatus): ActionConfig {
  switch (estado) {
    case "Pendiente":
      return { primary: { tooltip: "Validar", icon: CheckCircle2 }, menu: [
        { label: "Ver detalle", icon: Eye },
        { label: "Editar", icon: Pencil },
        { label: "Cancelar pedido", icon: Ban, danger: true },
      ]};
    case "Validado":
      return { primary: { tooltip: "Preparar", icon: Play }, menu: [
        { label: "Ver detalle", icon: Eye },
        { label: "Editar", icon: Pencil },
      ]};
    case "En preparación":
      return { primary: { tooltip: "Ver", icon: Eye }, menu: [
        { label: "Ver detalle", icon: Eye },
      ]};
    case "Por empacar":
      return { primary: { tooltip: "Empacar", icon: Package }, menu: [
        { label: "Ver detalle", icon: Eye },
      ]};
    case "Empacado":
      return { primary: { tooltip: "Ver", icon: Eye }, menu: [
        { label: "Ver detalle", icon: Eye },
      ]};
    case "Listo para retiro":
      return { primary: { tooltip: "Ver", icon: Eye }, menu: [
        { label: "Ver detalle", icon: Eye },
        { label: "Marcar entregado", icon: Truck },
      ]};
    case "Entregado":
      return { menu: [{ label: "Ver detalle", icon: Eye }] };
    case "Con atraso":
      return { primary: { tooltip: "Ver", icon: Eye }, menu: [
        { label: "Ver detalle", icon: Eye },
        { label: "Gestionar atraso", icon: AlertTriangle, danger: true },
      ]};
    case "Cancelado":
      return { menu: [{ label: "Ver detalle", icon: Eye }] };
    default:
      return { menu: [{ label: "Ver detalle", icon: Eye }] };
  }
}

function MejoradaActionsCell({ pedido }: { pedido: Pedido }) {
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { primary, menu } = getPedidoActions(pedido.estadoPreparacion);

  const openMenu = useCallback(() => {
    if (!dotsRef.current) return;
    const rect = dotsRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }, []);

  useEffect(() => {
    if (!menuPos) return;
    const close = () => setMenuPos(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuPos]);

  return (
    <div className="flex items-center gap-1">
      {primary && (
        <div className="relative">
          <button
            ref={btnRef}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors duration-200"
          >
            <primary.icon className="w-4 h-4" />
          </button>
          {showTooltip && mounted && createPortal(
            <div
              style={{
                position: "fixed",
                top: (btnRef.current?.getBoundingClientRect().top ?? 0) - 32,
                left: (btnRef.current?.getBoundingClientRect().left ?? 0) + ((btnRef.current?.offsetWidth ?? 0) / 2),
                transform: "translateX(-50%)",
                zIndex: 2147483647,
              }}
              className="bg-neutral-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none"
            >
              {primary.tooltip}
            </div>,
            document.body
          )}
        </div>
      )}
      <button
        ref={dotsRef}
        onClick={e => { e.stopPropagation(); menuPos ? setMenuPos(null) : openMenu(); }}
        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-200"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {mounted && menuPos && createPortal(
        <div
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 2147483647 }}
          className="bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 min-w-[192px]"
          onMouseDown={e => e.stopPropagation()}
        >
          {menu.map((item, i) => {
            const ItemIcon = item.icon;
            const hasSeparator = i > 0 && menu[i - 1]?.danger !== item.danger;
            return (
              <button
                key={item.label}
                onClick={() => { setMenuPos(null); item.onClick?.(); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
                } ${hasSeparator ? "border-t border-neutral-100 mt-1 pt-2.5" : ""}`}
              >
                {ItemIcon && <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-600"}`} />}
                {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Mini Sparkline for actual KPI strip ──────────────────────────────────────
function MiniSparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const points = data.map(v => ({ v }));
  return (
    <div className="w-20 h-8 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="miniSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#miniSpark)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function PedidosPage() {
  return (
    <Suspense fallback={null}>
      <PedidosPageInner />
    </Suspense>
  );
}

function PedidosPageInner() {
  const router = useRouter();

  // ── View mode toggle ───────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"actual" | "mejorada">(() => {
    if (typeof window === "undefined") return "mejorada";
    return (localStorage.getItem("amplifica_pedidos_view") as "actual" | "mejorada") || "mejorada";
  });
  useEffect(() => { localStorage.setItem("amplifica_pedidos_view", viewMode); }, [viewMode]);

  // ── Shared state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Multiselect filters
  const [filterSellers, setFilterSellers] = useState<Set<string>>(new Set());
  const [filterSucursales, setFilterSucursales] = useState<Set<string>>(new Set());
  const [filterCanales, setFilterCanales] = useState<Set<string>>(new Set());
  const [filterMetodos, setFilterMetodos] = useState<Set<string>>(new Set());

  const activeFilterCount = filterSellers.size + filterSucursales.size + filterCanales.size + filterMetodos.size;

  // Sync pageSize on view switch
  useEffect(() => {
    setPageSize(viewMode === "actual" ? 10 : 20);
    setPage(1);
  }, [viewMode]);

  // Reset page on filter/tab change
  useEffect(() => { setPage(1); }, [activeTab, search, filterSellers, filterSucursales, filterCanales, filterMetodos]);

  // Toggle sort
  const toggleSort = (f: SortField) => {
    if (sortField === f) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortField(null); setSortDir("asc"); }
    } else {
      setSortField(f);
      setSortDir("asc");
    }
  };

  // ── Unique filter options ──────────────────────────────────────────────────
  const sellers = useMemo(() => [...new Set(PEDIDOS.map(p => p.seller))].sort(), []);
  const sucursales = useMemo(() => [...new Set(PEDIDOS.map(p => p.sucursal))].sort(), []);
  const canales = useMemo(() => [...new Set(PEDIDOS.map(p => p.canalVenta))].sort(), []);
  const metodos = useMemo(() => [...new Set(PEDIDOS.map(p => p.metodoEntrega))].sort(), []);

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = [...PEDIDOS];
    // Tab filter
    if (activeTab === "Con atraso") {
      rows = rows.filter(p => p.conAtraso);
    } else if (activeTab !== "Todos") {
      rows = rows.filter(p => p.estadoPreparacion === activeTab);
    }
    // Set filters
    if (filterSellers.size) rows = rows.filter(p => filterSellers.has(p.seller));
    if (filterSucursales.size) rows = rows.filter(p => filterSucursales.has(p.sucursal));
    if (filterCanales.size) rows = rows.filter(p => filterCanales.has(p.canalVenta));
    if (filterMetodos.size) rows = rows.filter(p => filterMetodos.has(p.metodoEntrega));
    // Search
    if (search.trim()) rows = rows.filter(p => searchMatch(p, search.trim()));
    // Sort
    if (sortField === "id") {
      rows.sort((a, b) => sortDir === "asc" ? a.id - b.id : b.id - a.id);
    } else if (sortField === "fechaCreacion") {
      rows.sort((a, b) => sortDir === "asc" ? a.id - b.id : b.id - a.id); // simplification: use id as proxy
    }
    return rows;
  }, [activeTab, search, sortField, sortDir, filterSellers, filterSucursales, filterCanales, filterMetodos]);

  // ── Status counts (for tabs) ───────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: PEDIDOS.length };
    for (const tab of TABS_PEDIDOS) {
      if (tab === "Todos") continue;
      if (tab === "Con atraso") {
        counts[tab] = PEDIDOS.filter(p => p.conAtraso).length;
      } else {
        counts[tab] = PEDIDOS.filter(p => p.estadoPreparacion === tab).length;
      }
    }
    return counts;
  }, []);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const paginatedRows = filtered.slice(startIdx, startIdx + pageSize);
  const fromRow = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow = Math.min(startIdx + pageSize, filtered.length);

  // Clear all filters
  const clearAllFilters = () => {
    setFilterSellers(new Set());
    setFilterSucursales(new Set());
    setFilterCanales(new Set());
    setFilterMetodos(new Set());
  };

  // ── Tabs drag-to-scroll ────────────────────────────────────────────────────
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 4);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow);
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkOverflow); ro.disconnect(); };
  }, [checkOverflow]);

  // Columns for current view
  const activeCols = viewMode === "actual" ? COLS_ACTUAL : COLS_MEJORADA;
  const colWidths = viewMode === "actual" ? COL_WIDTHS_ACTUAL : COL_WIDTHS_MEJORADA;

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center sm:text-left" style={NW}>
            Pedidos
          </h1>
          {/* Toggle */}
          <div className="flex items-center justify-center bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("actual")}
              className={`px-3 py-1.5 rounded-md text-[13px] leading-tight transition-all duration-200 ${
                viewMode === "actual"
                  ? "bg-white text-neutral-900 font-medium shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Vista actual
            </button>
            <button
              onClick={() => setViewMode("mejorada")}
              className={`px-3 py-1.5 rounded-md text-[13px] leading-tight transition-all duration-200 ${
                viewMode === "mejorada"
                  ? "bg-white text-neutral-900 font-medium shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Vista mejorada
            </button>
          </div>
        </div>
        <p className="text-sm text-neutral-500 text-center sm:text-right">
          {filtered.length} pedidos
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW: ACTUAL                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "actual" && (
        <>
          {/* ── KPI Strip ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 overflow-x-auto pb-3 table-scroll mb-4">
            {KPIS_ACTUAL.map(kpi => (
              <div key={kpi.label} className={`flex-shrink-0 border rounded-xl px-4 py-3 min-w-[130px] ${kpi.alert ? "bg-red-50 border-red-200" : "bg-white border-neutral-200"}`}>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-1" style={NW}>{kpi.label}</p>
                <p className={`text-xl font-bold tabular-nums leading-tight ${kpi.alert ? "text-red-600" : "text-neutral-900"}`}>
                  {kpi.alert && <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5 text-red-500" />}
                  {kpi.value}
                </p>
                {kpi.sparkline && <MiniSparkline data={kpi.sparkline} />}
              </div>
            ))}
          </div>

          {/* ── Toolbar actual ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button size="sm" iconLeft={<Plus className="w-4 h-4" />}>Crear</Button>
            <Button size="sm" variant="secondary" iconLeft={<Download className="w-4 h-4" />}>Exportar</Button>
            <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-8 text-sm text-neutral-700 cursor-pointer">
              <span className="text-neutral-500 text-xs">Mostrar</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-sm"
              >
                <option value={10}>10 filas</option>
                <option value={20}>20 filas</option>
                <option value={50}>50 filas</option>
              </select>
            </label>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 h-8 w-48 sm:w-56 bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Table actual (desktop) ─────────────────────────────────────── */}
          <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
              <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[90px] cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("id")}>
                      ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} />
                    </th>
                    {COLS_ACTUAL.map(key => (
                      <th key={key} className={`text-left py-3 px-4 text-xs font-semibold text-neutral-700 ${COL_WIDTHS_ACTUAL[key]}`} style={NW}>
                        {COL_LABELS[key]}
                      </th>
                    ))}
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 bg-neutral-50 w-[220px]" style={{ ...NW, ...stickyRight }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {paginatedRows.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors duration-300 group">
                      <td className="py-3 px-4">
                        <span className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 text-xs font-mono cursor-pointer">
                          {p.id}
                        </span>
                      </td>
                      {COLS_ACTUAL.map(key => (
                        <td key={key} className="py-3 px-4 text-neutral-600" style={NW}>
                          {key === "estadoPreparacion" ? (
                            <PedidoStatusBadge status={p.estadoPreparacion} />
                          ) : key === "preparacion" ? (
                            <SLABadges badges={p.preparacion} />
                          ) : key === "entrega" ? (
                            <SLABadges badges={p.entrega} />
                          ) : key === "tags" ? (
                            p.tags.length > 0 ? p.tags.join(", ") : <span className="text-neutral-300">—</span>
                          ) : (
                            String(p[key as keyof Pedido] ?? "—")
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 bg-white group-hover:bg-neutral-50/60" style={{ ...NW, ...stickyRight }}>
                        <div className="flex items-center gap-0.5">
                          {[Eye, FileText, Truck, Share2, Trash2, Printer].map((Icon, i) => (
                            <button key={i} className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
                              <Icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={COLS_ACTUAL.length + 2} className="text-center py-16 text-neutral-400 text-sm">
                        No se encontraron pedidos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination actual */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-100">
              <span className="text-sm text-neutral-500 tabular-nums">
                Mostrando {fromRow}–{toRow} de {filtered.length} registros
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={clampedPage <= 1}
                  className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:text-neutral-300 disabled:cursor-not-allowed">
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 text-sm rounded ${n === clampedPage ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>
                    {n}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-neutral-400 text-sm px-1">...</span>}
                {totalPages > 5 && (
                  <button onClick={() => setPage(totalPages)} className="w-8 h-8 text-sm rounded hover:bg-neutral-100 text-neutral-600">
                    {totalPages}
                  </button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={clampedPage >= totalPages}
                  className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:text-neutral-300 disabled:cursor-not-allowed">
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* ── Mobile cards actual ────────────────────────────────────────── */}
          <div className="sm:hidden flex flex-col gap-3">
            {paginatedRows.map(p => (
              <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-block bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs font-mono">{p.id}</span>
                  <PedidoStatusBadge status={p.estadoPreparacion} />
                </div>
                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="text-neutral-800 font-medium truncate">{p.seller}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-500 truncate">{p.sucursal}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <span>{p.fechaCreacion}</span>
                  <span className="text-neutral-300">·</span>
                  <span>{p.canalVenta}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{p.metodoEntrega}</span>
                </div>
                {p.entrega.length > 0 && (
                  <div className="mt-2">
                    <SLABadges badges={p.entrega} />
                  </div>
                )}
              </div>
            ))}
            {paginatedRows.length === 0 && (
              <div className="text-center py-16 text-neutral-400 text-sm">No se encontraron pedidos</div>
            )}
          </div>

          {/* Mobile pagination actual */}
          <div className="sm:hidden flex items-center justify-between mt-3 pb-8">
            <span className="text-xs text-neutral-600 tabular-nums">{fromRow}–{toRow} de {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={clampedPage <= 1}
                className="p-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={clampedPage >= totalPages}
                className="p-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW: MEJORADA                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "mejorada" && (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {KPIS_MEJORADA.map(kpi => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                delta={kpi.delta}
                icon={
                  kpi.title.includes("atraso")
                    ? <AlertTriangle className="w-5 h-5" />
                    : kpi.title.includes("Hoy")
                      ? <CalendarDays className="w-5 h-5" />
                      : <ShoppingBag className="w-5 h-5" />
                }
                sparkline={kpi.sparkline}
                sparklineColor={kpi.sparklineColor}
              />
            ))}
          </div>

          {/* ── Toolbar mejorada ───────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            {/* Mobile: tab select */}
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              className="sm:hidden h-10 bg-neutral-100 rounded-lg px-3 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {TABS_PEDIDOS.map(tab => (
                <option key={tab} value={tab}>{tab} ({statusCounts[tab] ?? 0})</option>
              ))}
            </select>

            {/* Desktop: pill tabs */}
            <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0 relative">
              {showLeftArrow && (
                <button onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                  className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-white via-white/90 to-transparent">
                  <ChevronLeft className="w-4 h-4 text-neutral-400" />
                </button>
              )}
              <div ref={tabsRef} className="flex items-center gap-1 overflow-x-auto tabs-scroll" style={{ scrollbarWidth: "none" }}>
                {TABS_PEDIDOS.map(tab => {
                  const isActive = activeTab === tab;
                  const count = statusCounts[tab] ?? 0;
                  const colors = TAB_BADGE_COLORS[tab] ?? TAB_BADGE_COLORS["Todos"];
                  const badgeClass = isActive ? colors.active : colors.inactive;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                        isActive
                          ? "bg-white text-neutral-900 font-medium shadow-sm"
                          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {tab}
                      <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full font-medium leading-none ${badgeClass}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {showRightArrow && (
                <button onClick={() => tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
                  className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-white via-white/90 to-transparent">
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Right side: filters + search */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className={`relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                  activeFilterCount > 0 ? "bg-primary-50 text-primary-500" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold leading-none px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar pedido..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 h-9 w-44 sm:w-56 bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Active filter chips ────────────────────────────────────────── */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {[...filterSellers].map(v => (
                <span key={`s-${v}`} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">
                  {v}
                  <button onClick={() => toggleInSet(setFilterSellers, v)} className="text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {[...filterSucursales].map(v => (
                <span key={`su-${v}`} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">
                  {v}
                  <button onClick={() => toggleInSet(setFilterSucursales, v)} className="text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {[...filterCanales].map(v => (
                <span key={`c-${v}`} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">
                  {v}
                  <button onClick={() => toggleInSet(setFilterCanales, v)} className="text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {[...filterMetodos].map(v => (
                <span key={`m-${v}`} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">
                  {v}
                  <button onClick={() => toggleInSet(setFilterMetodos, v)} className="text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <button onClick={clearAllFilters} className="text-xs text-primary-500 hover:text-primary-700 font-medium ml-1">
                Limpiar todos
              </button>
            </div>
          )}

          {/* ── Table mejorada (desktop) ───────────────────────────────────── */}
          <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
              <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[100px] cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("id")}>
                      ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} />
                    </th>
                    {COLS_MEJORADA.map(key => (
                      <th key={key} className={`text-left py-3 px-4 text-xs font-semibold text-neutral-700 ${COL_WIDTHS_MEJORADA[key]}`} style={NW}>
                        {COL_LABELS[key]}
                      </th>
                    ))}
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 bg-neutral-50 w-[100px]" style={{ ...NW, ...stickyRight }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {paginatedRows.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors duration-300 group">
                      <td className="py-3 px-4">
                        <span className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 text-xs font-mono cursor-pointer">
                          {p.id}
                        </span>
                      </td>
                      {COLS_MEJORADA.map(key => (
                        <td key={key} className="py-3 px-4 text-neutral-600" style={key === "estadoPreparacion" || key === "entrega" ? undefined : NW}>
                          {key === "estadoPreparacion" ? (
                            <PedidoStatusBadge status={p.estadoPreparacion} />
                          ) : key === "entrega" ? (
                            <SLABadges badges={p.entrega} />
                          ) : (
                            String(p[key as keyof Pedido] ?? "—")
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 bg-white group-hover:bg-neutral-50/60" style={{ ...NW, ...stickyRight }}>
                        <MejoradaActionsCell pedido={p} />
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={COLS_MEJORADA.length + 2} className="text-center py-16 text-neutral-400 text-sm">
                        No se encontraron pedidos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination mejorada */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
              <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-[44px] text-sm text-neutral-700 cursor-pointer">
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
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={clampedPage <= 1}
                  className="flex items-center gap-1 px-3 h-[44px] bg-neutral-100 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-sm text-neutral-500 tabular-nums">{fromRow}–{toRow} de {filtered.length}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={clampedPage >= totalPages}
                  className="flex items-center gap-1 px-3 h-[44px] bg-neutral-100 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Mobile cards mejorada ──────────────────────────────────────── */}
          <div className="sm:hidden flex flex-col gap-3">
            {paginatedRows.map(p => (
              <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-block bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs font-mono">{p.id}</span>
                  <PedidoStatusBadge status={p.estadoPreparacion} />
                </div>
                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="text-neutral-800 font-medium truncate">{p.seller}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-500 truncate">{p.sucursal}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <span>{p.fechaCreacion}</span>
                  <span className="text-neutral-300">·</span>
                  <span>{p.canalVenta}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <Truck className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{p.metodoEntrega}</span>
                </div>
                {p.entrega.length > 0 && (
                  <div className="mt-2">
                    <SLABadges badges={p.entrega} />
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-neutral-100">
                  <MejoradaActionsCell pedido={p} />
                </div>
              </div>
            ))}
            {paginatedRows.length === 0 && (
              <div className="text-center py-16 text-neutral-400 text-sm">No se encontraron pedidos</div>
            )}
          </div>

          {/* Mobile pagination mejorada */}
          <div className="sm:hidden flex items-center justify-between mt-3 pb-8">
            <span className="text-xs text-neutral-600 tabular-nums">{fromRow}–{toRow} de {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={clampedPage <= 1}
                className="p-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={clampedPage >= totalPages}
                className="p-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FILTER MODAL (shared, only used in mejorada)                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="text-base font-semibold text-neutral-900">Filtros</h2>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-500 text-white text-[10px] font-bold leading-none">
                    {activeFilterCount}
                  </span>
                )}
                <button onClick={() => setShowFilters(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              <FilterSection
                title="Seller"
                options={sellers}
                selected={filterSellers}
                onToggle={val => toggleInSet(setFilterSellers, val)}
              />
              <FilterSection
                title="Sucursal"
                options={sucursales}
                selected={filterSucursales}
                onToggle={val => toggleInSet(setFilterSucursales, val)}
              />
              <FilterSection
                title="Canal de venta"
                options={canales}
                selected={filterCanales}
                onToggle={val => toggleInSet(setFilterCanales, val)}
              />
              <FilterSection
                title="Método entrega"
                options={metodos}
                selected={filterMetodos}
                onToggle={val => toggleInSet(setFilterMetodos, val)}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Limpiar filtros
              </button>
              <Button size="sm" onClick={() => setShowFilters(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
