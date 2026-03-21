"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Download, Plus,
  Eye, Printer, FileText, Upload, Receipt, Columns3,
  Trash2, X, ShoppingBag, CalendarDays, AlertTriangle, Truck, Store, MapPin,
  CheckSquare, CheckCircle, Layers, Clock,
  PackageCheck, Tag, Ban, ClipboardCheck, Box,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import PedidoStatusBadge, { STATUS_MAP as PEDIDO_STATUS_MAP, type PedidoStatus } from "@/components/pedidos/PedidoStatusBadge";
import EnvioStatusBadge, { ALL_ENVIO_STATUSES, type EnvioStatus } from "@/components/pedidos/EnvioStatusBadge";
import Button from "@/components/ui/Button";
import { usePedidoColumnConfig } from "@/hooks/usePedidoColumnConfig";
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

// ─── Design-system Checkbox ──────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange, className = "" }: {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: () => void;
  className?: string;
}) {
  return (
    <span
      onClick={onChange}
      className={`flex w-3.5 h-3.5 rounded-[3px] items-center justify-center flex-shrink-0 transition-colors duration-200 cursor-pointer border-[1.5px] ${
        checked || indeterminate ? "bg-primary-500 border-primary-500" : "bg-white border-neutral-300 hover:border-neutral-400"
      } ${className}`}
    >
      {checked && !indeterminate && (
        <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && (
        <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M3 6h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
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
          <span key={i} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0 rounded-full whitespace-nowrap w-fit ${colors[b.color] || colors.blue}`}>
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
              <Checkbox checked={selected.has(opt)} onChange={() => onToggle(opt)} />
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

// Acciones para vista actual (sin navegación dinámica — iconos-only)
const PEDIDO_ACTIONS: MenuItem[] = [
  { label: "Ver detalle", icon: Eye },
  { label: "Ver comanda", icon: FileText },
  { label: "Cotizar", icon: Receipt },
  { label: "Subir etiqueta de envío", icon: Upload },
  { label: "Reimprimir etiqueta de envío", icon: Printer },
  { label: "Eliminar pedido", icon: Trash2, danger: true },
];

// Acciones para vista mejorada (con navegación)
function buildPedidoMenu(pedidoId: number, push: (url: string) => void): MenuItem[] {
  return [
    { label: "Ver detalle", icon: Eye, onClick: () => push(`/pedidos/${pedidoId}`) },
    { label: "Ver comanda", icon: FileText },
    { label: "Cotizar", icon: Receipt },
    { label: "Subir etiqueta de envío", icon: Upload },
    { label: "Reimprimir etiqueta de envío", icon: Printer },
    { label: "Eliminar pedido", icon: Trash2, danger: true },
  ];
}

function getPedidoActions(pedidoId: number, push: (url: string) => void): ActionConfig {
  return {
    primary: { tooltip: "Ver detalle", icon: Eye },
    menu: buildPedidoMenu(pedidoId, push),
  };
}

function MejoradaActionsCell({ pedido, hidePrimary }: { pedido: Pedido; hidePrimary?: boolean }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  useEffect(() => { setMounted(true); }, []);

  const { primary, menu } = getPedidoActions(pedido.id, router.push);

  const openMenu = useCallback(() => {
    if (!dotsRef.current) return;
    const rect = dotsRef.current.getBoundingClientRect();
    const menuH = menu.length * 44 + 12; // approx menu height
    const spaceBelow = window.innerHeight - rect.bottom;
    // On mobile: bottom sheet. On desktop: positioned dropdown (open up if near bottom)
    if (window.innerWidth < 640) {
      setMenuStyle({});
    } else if (spaceBelow < menuH) {
      setMenuStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, zIndex: 2147483647 });
    } else {
      setMenuStyle({ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 2147483647 });
    }
    setShowMenu(true);
  }, [menu.length]);

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showMenu]);

  const menuItems = menu.map((item, i) => {
    const ItemIcon = item.icon;
    const hasSeparator = i > 0 && menu[i - 1]?.danger !== item.danger;
    return (
      <button
        key={item.label}
        onClick={() => { setShowMenu(false); item.onClick?.(); }}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
          item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
        } ${hasSeparator ? "border-t border-neutral-100 mt-1 pt-2.5" : ""}`}
      >
        {ItemIcon && <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-600"}`} />}
        {item.label}
      </button>
    );
  });

  return (
    <div className="flex items-center gap-1">
      {primary && !hidePrimary && (
        <div className="relative">
          <button
            ref={btnRef}
            onClick={() => router.push(`/pedidos/${pedido.id}`)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
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
        onClick={e => { e.stopPropagation(); showMenu ? setShowMenu(false) : openMenu(); }}
        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-200"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {mounted && showMenu && createPortal(
        isMobile ? (
          /* ── Mobile: bottom sheet ── */
          <div className="fixed inset-0 z-50" onMouseDown={e => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl pb-8 animate-in slide-in-from-bottom duration-200">
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-neutral-200 rounded-full" />
              </div>
              <div className="px-2">{menuItems}</div>
            </div>
          </div>
        ) : (
          /* ── Desktop: positioned dropdown ── */
          <div
            style={menuStyle}
            className="bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 min-w-[192px]"
            onMouseDown={e => e.stopPropagation()}
          >
            {menuItems}
          </div>
        ),
        document.body
      )}
    </div>
  );
}

// ─── Mini Sparkline for actual KPI strip ──────────────────────────────────────
function MiniSparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const points = data.map(v => ({ v }));
  return (
    <div className="w-20 h-8 mt-1 relative">
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #111759 0%, transparent 40%)" }} />
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

  // ── Column config (Vista Mejorada) ─────────────────────────────────────────
  const { activeCols: mejCols } = usePedidoColumnConfig();

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
  const [filterEnvio, setFilterEnvio] = useState<Set<string>>(new Set());

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Envio column header dropdown (Vista Actual)
  const [showEnvioDropdown, setShowEnvioDropdown] = useState(false);
  const [envioDropdownSearch, setEnvioDropdownSearch] = useState("");
  const envioHeaderRef = useRef<HTMLTableCellElement>(null);
  const envioDropdownRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = filterSellers.size + filterSucursales.size + filterCanales.size + filterMetodos.size + filterEnvio.size;

  // Sync pageSize on view switch
  useEffect(() => {
    setPageSize(viewMode === "actual" ? 10 : 20);
    setPage(1);
  }, [viewMode]);

  // Reset page on filter/tab change
  useEffect(() => { setPage(1); }, [activeTab, search, filterSellers, filterSucursales, filterCanales, filterMetodos, filterEnvio]);

  // Close envio dropdown on click outside
  useEffect(() => {
    if (!showEnvioDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        envioDropdownRef.current && !envioDropdownRef.current.contains(e.target as Node) &&
        envioHeaderRef.current && !envioHeaderRef.current.contains(e.target as Node)
      ) {
        setShowEnvioDropdown(false);
        setEnvioDropdownSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEnvioDropdown]);

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
  const envioStatusesInData = useMemo(() => {
    const present = new Set(PEDIDOS.map(p => p.estadoEnvio));
    return ALL_ENVIO_STATUSES.filter(s => present.has(s));
  }, []);

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
    if (filterEnvio.size) rows = rows.filter(p => filterEnvio.has(p.estadoEnvio));
    // Search
    if (search.trim()) rows = rows.filter(p => searchMatch(p, search.trim()));
    // Sort
    if (sortField === "id") {
      rows.sort((a, b) => sortDir === "asc" ? a.id - b.id : b.id - a.id);
    } else if (sortField === "fechaCreacion") {
      rows.sort((a, b) => sortDir === "asc" ? a.id - b.id : b.id - a.id); // simplification: use id as proxy
    }
    return rows;
  }, [activeTab, search, sortField, sortDir, filterSellers, filterSucursales, filterCanales, filterMetodos, filterEnvio]);

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

  // Bulk selection helpers
  const pageIds = paginatedRows.map(p => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const somePageSelected = pageIds.some(id => selectedIds.has(id));
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => { const next = new Set(prev); pageIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); pageIds.forEach(id => next.add(id)); return next; });
    }
  };
  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // ── Bulk actions (contextual) ─────────────────────────────────────────────
  const selectedPedidos = useMemo(() => PEDIDOS.filter(p => selectedIds.has(p.id)), [selectedIds]);
  const bulkActions = useMemo(() => {
    if (selectedPedidos.length === 0) return [];
    const estados = new Set(selectedPedidos.map(p => p.estadoPreparacion));
    const allSame = estados.size === 1;
    const theState = allSame ? [...estados][0] : null;
    const noneTerminal = selectedPedidos.every(p => p.estadoPreparacion !== "Cancelado" && p.estadoPreparacion !== "Entregado");

    const actions: MenuItem[] = [];

    // 1. Consulta
    if (selectedPedidos.length === 1) actions.push({ label: "Ver detalle", icon: Eye });
    actions.push({ label: "Exportar selección", icon: Download });

    // 2. Documentos
    actions.push({ label: "Imprimir comandas", icon: FileText });
    actions.push({ label: "Imprimir etiquetas", icon: Printer });

    // 3. Transiciones de estado
    if (theState === "Pendiente") actions.push({ label: "Validar", icon: ClipboardCheck });
    if (theState === "Validado") actions.push({ label: "Marcar en preparación", icon: Box });
    if (theState === "En preparación" || theState === "Por empacar") actions.push({ label: "Marcar empacado", icon: PackageCheck });
    if (theState === "Empacado") actions.push({ label: "Marcar listo para retiro", icon: PackageCheck });

    // 4. Envío
    if (allSame && (theState === "Pendiente" || theState === "Validado" || theState === "En preparación"))
      actions.push({ label: "Cotizar envío", icon: Receipt });
    if (allSame && (theState === "Empacado" || theState === "Listo para retiro"))
      actions.push({ label: "Solicitar retiro courier", icon: Truck });

    // 5. Organización
    actions.push({ label: "Agregar tag", icon: Tag });

    // 6. Destructiva
    if (noneTerminal) actions.push({ label: "Cancelar pedidos", icon: Ban, danger: true });

    return actions;
  }, [selectedPedidos]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilterSellers(new Set());
    setFilterSucursales(new Set());
    setFilterCanales(new Set());
    setFilterMetodos(new Set());
    setFilterEnvio(new Set());
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
  const activeCols = viewMode === "actual" ? COLS_ACTUAL : mejCols;
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
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Button variant="tertiary" iconLeft={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" iconLeft={<Plus className="w-4 h-4" />}>
            Crear pedido
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW: ACTUAL                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "actual" && (
        <>
          {/* ── KPI Strip ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-[#111759] overflow-x-auto table-scroll mb-4">
            <div className="flex divide-x divide-white/10">
              {KPIS_ACTUAL.map(kpi => (
                <div key={kpi.label} className="flex-shrink-0 px-5 py-4 min-w-[130px] flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium mb-1" style={NW}>{kpi.label}</p>
                    <p className={`text-xl font-bold tabular-nums leading-tight ${kpi.alert ? "text-red-400" : "text-white"}`}>
                      {kpi.alert && <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5 text-red-400" />}
                      {kpi.value}
                    </p>
                  </div>
                  {kpi.sparkline && <MiniSparkline data={kpi.sparkline} color="#818cf8" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Toolbar actual ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
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
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll">
              <table className="w-full table-auto text-sm border-collapse font-sans tracking-normal">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[90px] cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("id")}>
                      ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} />
                    </th>
                    {COLS_ACTUAL.map(key => (
                      key === "estadoEnvio" ? (
                        <th
                          key={key}
                          ref={envioHeaderRef}
                          className={`text-left py-3 px-4 text-xs font-semibold cursor-pointer select-none hover:bg-neutral-100 transition-colors ${COL_WIDTHS_ACTUAL[key]} ${filterEnvio.size ? "text-primary-600" : "text-neutral-700"}`}
                          style={NW}
                          onClick={() => { setShowEnvioDropdown(prev => !prev); setEnvioDropdownSearch(""); }}
                        >
                          <span className="inline-flex items-center gap-1">
                            {COL_LABELS[key]}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showEnvioDropdown ? "rotate-180" : ""}`} />
                            {filterEnvio.size > 0 && (
                              <span className="bg-primary-100 text-primary-700 text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">{filterEnvio.size}</span>
                            )}
                          </span>
                        </th>
                      ) : (
                        <th key={key} className={`text-left py-3 px-4 text-xs font-semibold text-neutral-700 ${COL_WIDTHS_ACTUAL[key]}`} style={NW}>
                          {COL_LABELS[key]}
                        </th>
                      )
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
                        <span className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 text-xs font-mono cursor-pointer" onClick={() => router.push(`/pedidos/${p.id}`)}>
                          {p.id}
                        </span>
                      </td>
                      {COLS_ACTUAL.map(key => (
                        <td key={key} className="py-3 px-4 text-neutral-600" style={NW}>
                          {key === "estadoPreparacion" ? (
                            <PedidoStatusBadge status={p.estadoPreparacion} />
                          ) : key === "estadoEnvio" ? (
                            <EnvioStatusBadge status={p.estadoEnvio} />
                          ) : key === "preparacion" ? (
                            <SLABadges badges={p.preparacion} />
                          ) : key === "entrega" ? (
                            <SLABadges badges={p.entrega} />
                          ) : key === "tags" ? (
                            p.tags.length > 0 ? p.tags.join(", ") : <span className="text-neutral-300">—</span>
                          ) : key === "idAmplifica" ? (
                            <span className="font-mono">{p.idAmplifica}</span>
                          ) : (
                            String(p[key as keyof Pedido] ?? "—")
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 bg-white group-hover:bg-white/80 group-hover:backdrop-blur-[4px] transition-all duration-300" style={{ ...NW, ...stickyRight }}>
                        <div className="flex items-center gap-0.5">
                          {PEDIDO_ACTIONS.map((action) => {
                            const ActionIcon = action.icon!;
                            return (
                              <button
                                key={action.label}
                                title={action.label}
                                className={`p-1.5 rounded transition-colors ${
                                  action.danger
                                    ? "text-neutral-400 hover:text-red-500 hover:bg-red-50"
                                    : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                                }`}
                              >
                                <ActionIcon className="w-4 h-4" />
                              </button>
                            );
                          })}
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

          {/* ── Envio column header dropdown (portal) ────────────────────── */}
          {showEnvioDropdown && envioHeaderRef.current && createPortal(
            <div
              ref={envioDropdownRef}
              className="fixed z-50 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 w-60 max-h-80 flex flex-col"
              style={{
                top: envioHeaderRef.current.getBoundingClientRect().bottom + 4,
                left: Math.min(
                  envioHeaderRef.current.getBoundingClientRect().left,
                  window.innerWidth - 256
                ),
              }}
            >
              {/* Search */}
              <div className="px-3 py-2 border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar estado..."
                    value={envioDropdownSearch}
                    onChange={e => setEnvioDropdownSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-neutral-50 border-0 rounded-md text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                    autoFocus
                  />
                </div>
              </div>
              {/* Options */}
              <div className="overflow-y-auto flex-1 py-1">
                {envioStatusesInData
                  .filter(s => !envioDropdownSearch || s.toLowerCase().includes(envioDropdownSearch.toLowerCase()))
                  .map(status => (
                    <label
                      key={status}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-neutral-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={filterEnvio.has(status)}
                        onChange={() => toggleInSet(setFilterEnvio, status as string)}
                      />
                      <EnvioStatusBadge status={status} />
                    </label>
                  ))}
                {envioStatusesInData.filter(s => !envioDropdownSearch || s.toLowerCase().includes(envioDropdownSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-3">Sin resultados</p>
                )}
              </div>
              {/* Footer */}
              {filterEnvio.size > 0 && (
                <div className="border-t border-neutral-100 px-3 py-2">
                  <button
                    onClick={() => { setFilterEnvio(new Set()); }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Limpiar filtros ({filterEnvio.size})
                  </button>
                </div>
              )}
            </div>,
            document.body
          )}

          {/* ── Mobile cards actual ────────────────────────────────────────── */}
          <div className="sm:hidden flex flex-col gap-3">
            {paginatedRows.map(p => (
              <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-block bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs font-mono">{p.id}</span>
                </div>
                <div className="flex items-center gap-3 text-sm mb-2.5">
                  <span className="flex items-center gap-1 text-neutral-800 font-medium truncate">
                    <Store className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    {p.seller}
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span className="flex items-center gap-1 text-neutral-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    {p.sucursal}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide min-w-[72px] flex-shrink-0">Preparación</span>
                    <PedidoStatusBadge status={p.estadoPreparacion} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide min-w-[72px] flex-shrink-0">Envío</span>
                    <EnvioStatusBadge status={p.estadoEnvio} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <CalendarDays className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{p.fechaCreacion}</span>
                  <span className="text-neutral-300">·</span>
                  <span>{p.canalVenta}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Truck className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{p.metodoEntrega}</span>
                </div>
                {p.entrega.length > 0 && (
                  <div className="mt-2">
                    <SLABadges badges={p.entrega} />
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-center gap-1">
                    {PEDIDO_ACTIONS.map((action) => {
                      const ActionIcon = action.icon!;
                      return (
                        <button
                          key={action.label}
                          title={action.label}
                          className={`p-2 rounded-lg transition-colors ${
                            action.danger
                              ? "text-neutral-400 hover:text-red-500 hover:bg-red-50"
                              : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          <ActionIcon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
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
          <div className="rounded-2xl bg-[#111759] overflow-x-auto overflow-y-visible table-scroll mb-5">
            <div className="flex divide-x divide-white/10">
              {KPIS_MEJORADA.map(kpi => {
                const iconNode = kpi.title.includes("atraso")
                  ? <AlertTriangle className="w-4 h-4" />
                  : kpi.title.includes("Hoy")
                    ? <CalendarDays className="w-4 h-4" />
                    : kpi.title.includes("SLA")
                      ? <CheckCircle className="w-4 h-4" />
                      : kpi.title.includes("fulfillment")
                        ? <Clock className="w-4 h-4" />
                        : kpi.title.includes("Backlog")
                          ? <Layers className="w-4 h-4" />
                          : <ShoppingBag className="w-4 h-4" />;
                const chartColor = kpi.sparklineColor ?? (kpi.delta.color === "red" ? "#f87171" : kpi.delta.color === "amber" ? "#f59e0b" : "#4ade80");
                const sparkData = kpi.sparkline?.map(v => ({ v })) ?? [];
                const deltaBg = kpi.delta.color === "green"
                  ? "bg-green-500/15 text-green-400"
                  : kpi.delta.color === "red"
                    ? "bg-red-500/15 text-red-400"
                    : kpi.delta.color === "amber"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-neutral-500/15 text-neutral-400";
                return (
                  <div key={kpi.title} className="min-w-[65vw] sm:min-w-[200px] px-5 py-5 flex flex-col gap-0.5 flex-1 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-300">{iconNode}</span>
                      <span className="text-xs font-semibold text-neutral-300">{kpi.title}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex flex-col min-w-0 gap-1 relative z-20">
                        <span className="text-xl font-bold text-white leading-none tracking-tight tabular-nums">
                          {kpi.value}
                        </span>
                        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap leading-none w-fit ${deltaBg}`}>
                          {kpi.delta.value} {kpi.delta.label}
                        </span>
                      </div>
                      {sparkData.length > 0 && (
                        <div className="w-16 h-10 2xl:w-24 2xl:h-12 flex-shrink-0 relative">
                          <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #111759 0%, transparent 40%)" }} />
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`sparkM-${kpi.title.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#sparkM-${kpi.title.replace(/[^a-zA-Z0-9]/g, "")})`} dot={false} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Toolbar mejorada ───────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            {/* Mobile: tab select */}
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              className="sm:hidden h-10 bg-neutral-100 rounded-lg pl-3 pr-8 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              {TABS_PEDIDOS.map(tab => (
                <option key={tab} value={tab}>{tab} ({statusCounts[tab] ?? 0})</option>
              ))}
            </select>

            {/* Desktop: pill tabs */}
            <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0 relative">
              {showLeftArrow && (
                <button onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                  className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-neutral-100 via-neutral-100/90 to-transparent rounded-l-xl">
                  <ChevronLeft className="w-4 h-4 text-neutral-400" />
                </button>
              )}
              <div ref={tabsRef} className="flex items-center gap-1 overflow-x-auto tabs-scroll bg-neutral-100 rounded-xl p-1" style={{ scrollbarWidth: "none" }}>
                {TABS_PEDIDOS.map(tab => {
                  const isActive = activeTab === tab;
                  const count = statusCounts[tab] ?? 0;
                  const colors = TAB_BADGE_COLORS[tab] ?? TAB_BADGE_COLORS["Todos"];
                  const badgeClass = isActive ? colors.active : colors.inactive;
                  const statusCfg = PEDIDO_STATUS_MAP[tab as PedidoStatus];
                  const TabIcon = statusCfg?.icon ?? ShoppingBag;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ letterSpacing: "-0.02em" }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                        isActive
                          ? "bg-white text-neutral-900 font-medium shadow-sm"
                          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50/60"
                      }`}
                    >
                      {tab !== "Todos" && <TabIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? (statusCfg?.iconClass ?? "text-primary-500") : "text-neutral-400"}`} />}
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
                  className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-neutral-100 via-neutral-100/90 to-transparent rounded-r-xl">
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Right side: search + filters + columns */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar pedido..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 h-9 w-full sm:w-56 bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(true)}
                className={`relative h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors duration-200 ${
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
              <Link
                href="/pedidos/columnas"
                className="hidden sm:flex h-9 w-9 flex-shrink-0 bg-neutral-100 rounded-lg hover:bg-neutral-200 items-center justify-center transition-colors duration-300"
                title="Editor de columnas"
              >
                <Columns3 className="w-4 h-4 text-neutral-500" />
              </Link>
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
              {[...filterEnvio].map(v => (
                <span key={`e-${v}`} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">
                  {v}
                  <button onClick={() => toggleInSet(setFilterEnvio, v)} className="text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <button onClick={clearAllFilters} className="text-xs text-primary-500 hover:text-primary-700 font-medium ml-1">
                Limpiar todos
              </button>
            </div>
          )}

          {/* ── Table mejorada (desktop) ───────────────────────────────────── */}
          <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll">
              <table className="w-full table-auto text-sm border-collapse font-sans tracking-normal">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="py-3 px-3 w-[40px] align-middle">
                      <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected && !allPageSelected}
                        onChange={toggleSelectAll}
                        className="mx-auto"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[100px] cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("id")}>
                      ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} />
                    </th>
                    {mejCols.map(key => (
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
                    <tr key={p.id} className={`hover:bg-neutral-50/60 transition-colors duration-300 group ${selectedIds.has(p.id) ? "bg-primary-50/40" : ""}`} style={p.conAtraso ? { boxShadow: "inset 3px 0 0 0 #f87171" } : undefined}>
                      <td className="py-3 px-3 align-middle">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelectOne(p.id)}
                          className="mx-auto"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 text-xs font-mono cursor-pointer" onClick={() => router.push(`/pedidos/${p.id}`)}>
                          {p.id}
                        </span>
                      </td>
                      {mejCols.map(key => (
                        <td key={key} className="py-3 px-4 text-neutral-600" style={key === "estadoPreparacion" || key === "estadoEnvio" || key === "entrega" ? undefined : NW}>
                          {key === "estadoPreparacion" ? (
                            <PedidoStatusBadge status={p.estadoPreparacion} />
                          ) : key === "estadoEnvio" ? (
                            <EnvioStatusBadge status={p.estadoEnvio} />
                          ) : key === "preparacion" ? (
                            <SLABadges badges={p.preparacion} />
                          ) : key === "entrega" ? (
                            <SLABadges badges={p.entrega} />
                          ) : key === "idAmplifica" ? (
                            <span className="font-mono">{p.idAmplifica}</span>
                          ) : (
                            String(p[key as keyof Pedido] ?? "—")
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 bg-white group-hover:bg-white/80 group-hover:backdrop-blur-[4px] transition-all duration-300" style={{ ...NW, ...stickyRight }}>
                        <MejoradaActionsCell pedido={p} />
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={mejCols.length + 3} className="text-center py-16 text-neutral-400 text-sm">
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
              <div key={p.id} className={`rounded-2xl p-4 ${p.conAtraso ? "bg-red-50/30 border border-red-200 border-l-[3px] border-l-red-400" : "bg-white border border-neutral-200"}`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-block bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs font-mono">{p.id}</span>
                </div>
                <div className="flex items-center gap-3 text-sm mb-2.5">
                  <span className="flex items-center gap-1 text-neutral-800 font-medium truncate">
                    <Store className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    {p.seller}
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span className="flex items-center gap-1 text-neutral-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    {p.sucursal}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide min-w-[72px] flex-shrink-0">Preparación</span>
                    <PedidoStatusBadge status={p.estadoPreparacion} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide min-w-[72px] flex-shrink-0">Envío</span>
                    <EnvioStatusBadge status={p.estadoEnvio} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <CalendarDays className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{p.fechaCreacion}</span>
                  <span className="text-neutral-300">·</span>
                  <span>{p.canalVenta}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <Truck className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{p.metodoEntrega}</span>
                </div>
                {p.entrega.length > 0 && (
                  <div className="mt-2">
                    <SLABadges badges={p.entrega} />
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                  <Button variant="secondary" size="sm" iconLeft={<Eye className="w-4 h-4" />} className="flex-1" href={`/pedidos/${p.id}`}>
                    Ver detalle
                  </Button>
                  <MejoradaActionsCell pedido={p} hidePrimary />
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
      {/* BULK ACTION BAR                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-3 bg-[#1d1d1f] rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/30 border border-white/10 whitespace-nowrap overflow-x-auto table-scroll">
            {/* Count */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/15">
              <CheckSquare className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-white tabular-nums">{selectedIds.size}</span>
              <span className="text-sm text-neutral-400">seleccionados</span>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {bulkActions.map(action => {
                const ActionIcon = action.icon!;
                return (
                  <button
                    key={action.label}
                    title={action.label}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 flex-shrink-0 ${
                      action.danger
                        ? "text-red-400 hover:bg-red-500/15 hover:text-red-300"
                        : "text-neutral-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <ActionIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden lg:inline">{action.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Deselect all */}
            <div className="pl-3 border-l border-white/15">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-white/10 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
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
                title="Sucursal"
                options={sucursales}
                selected={filterSucursales}
                onToggle={val => toggleInSet(setFilterSucursales, val)}
              />
              <FilterSection
                title="Seller"
                options={sellers}
                selected={filterSellers}
                onToggle={val => toggleInSet(setFilterSellers, val)}
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
              <FilterSection
                title="Estado Envío"
                options={envioStatusesInData}
                selected={filterEnvio}
                onToggle={val => toggleInSet(setFilterEnvio, val)}
                renderOption={(val) => <EnvioStatusBadge status={val as EnvioStatus} />}
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
