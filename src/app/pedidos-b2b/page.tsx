"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, Plus, X, Eye, Printer, FileText, Download, Columns3,
  Copy, Check, ShoppingBag, CalendarDays, Truck, Building2,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, ChevronDown,
  // Tab icons (matching B2BStatusBadge)
  Inbox, FileWarning, CheckCircle2, ArrowLeftRight, ClipboardList,
  PackageCheck, CircleCheckBig, Ban, AlertTriangle,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import B2BStatusBadge, { B2B_STATUS_MAP } from "@/components/b2b/B2BStatusBadge";
import Button from "@/components/ui/Button";
import {
  PEDIDOS_B2B, KPIS_B2B, TABS_B2B, TAB_TO_STATUS, TAB_BADGE_COLORS,
  ALL_B2B_STATUSES,
  type PedidoB2B, type B2BStatus, type KpiB2B,
} from "@/app/pedidos-b2b/_data";

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

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── SLA urgency indicator ─────────────────────────────────────────────────
function getSlaIndicator(estado: B2BStatus, fechaCreacion: string): { color: string; label: string } | null {
  const now = Date.now();
  const created = new Date(fechaCreacion).getTime();
  const hoursElapsed = (now - created) / (1000 * 60 * 60);

  if (estado === "Recibido" && hoursElapsed > 24) {
    return { color: "bg-amber-400", label: "Más de 24h en Recibido" };
  }
  if ((estado === "Validado" || estado === "En preparación") && hoursElapsed > 48) {
    return { color: "bg-red-400", label: `Más de 48h en ${estado}` };
  }
  return null;
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

// ─── Copyable ID — uses shared component with clipboard fallback ───────────
import CopyableId from "@/components/ui/CopyableId";

// ─── Design-system Checkbox ─────────────────────────────────────────────────
function Checkbox({
  checked,
  indeterminate,
  onChange,
  className = "",
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <label
      className={`inline-flex items-center justify-center w-[44px] h-[44px] cursor-pointer -m-3 ${className}`}
      aria-label={ariaLabel}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange?.()}
        className="sr-only peer"
        aria-checked={indeterminate ? "mixed" : checked}
      />
      <span
        className={`flex w-[18px] h-[18px] rounded items-center justify-center flex-shrink-0 transition-colors duration-200 border-[1.5px] ${
          checked || indeterminate
            ? "bg-primary-500 border-primary-500"
            : "bg-white border-neutral-300 peer-hover:border-neutral-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 peer-focus-visible:ring-offset-1"
        }`}
      >
        {checked && !indeterminate && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {indeterminate && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M3 6h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </label>
  );
}

// ─── KPI sparkline data (inline, since _data doesn't include it) ────────────
const SPARKLINE_DATA: Record<string, number[]> = {
  "Pedidos activos": [12, 15, 18, 14, 20, 22, 24],
  "Requieren acción": [8, 6, 7, 5, 4, 6, 5],
  "Redistribuciones": [3, 5, 4, 6, 7, 5, 8],
  "Sellers autónomos": [4, 4, 5, 5, 6, 6, 7],
};

// ─── KPI icon mapping ───────────────────────────────────────────────────────
function getKpiIcon(title: string) {
  if (title.includes("activos")) return <ShoppingBag className="w-4 h-4" />;
  if (title.includes("acción")) return <AlertTriangle className="w-4 h-4" />;
  if (title.includes("Redistribuciones")) return <ArrowLeftRight className="w-4 h-4" />;
  if (title.includes("Sellers")) return <Building2 className="w-4 h-4" />;
  return <ShoppingBag className="w-4 h-4" />;
}

// ─── Tab icon mapping (matching B2BStatusBadge) ─────────────────────────────
const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }> | null> = {
  "Todos": null,
  "Recibido": Inbox,
  "Doc. pendiente": FileWarning,
  "Validado": CheckCircle2,
  "Redistribución": ArrowLeftRight,
  "En preparación": ClipboardList,
  "Empacado": PackageCheck,
  "Despachados": Truck,
  "Entregados": CircleCheckBig,
  "Cancelados": Ban,
};

// Tab icon active colors (matching B2BStatusBadge iconClass)
const TAB_ICON_ACTIVE_COLORS: Record<string, string> = {
  "Recibido": "text-sky-500",
  "Doc. pendiente": "text-amber-500",
  "Validado": "text-green-500",
  "Redistribución": "text-orange-500",
  "En preparación": "text-primary-500",
  "Empacado": "text-indigo-500",
  "Despachados": "text-blue-500",
  "Entregados": "text-green-600",
  "Cancelados": "text-neutral-400",
};

// ─── Actions dropdown ───────────────────────────────────────────────────────
type MenuItem = { label: string; icon?: React.ComponentType<{ className?: string }>; danger?: boolean; onClick?: () => void };

const B2B_ACTIONS: MenuItem[] = [
  { label: "Ver detalle", icon: Eye },
  { label: "Ver comanda", icon: FileText },
  { label: "Imprimir etiqueta", icon: Printer },
  { label: "Exportar", icon: Download },
];

function ActionsCell({ pedido }: { pedido: PedidoB2B }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const openMenu = useCallback(() => {
    if (!dotsRef.current) return;
    const rect = dotsRef.current.getBoundingClientRect();
    const menuH = B2B_ACTIONS.length * 44 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (window.innerWidth < 640) {
      setMenuStyle({});
    } else if (spaceBelow < menuH) {
      setMenuStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, zIndex: 2147483647 });
    } else {
      setMenuStyle({ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 2147483647 });
    }
    setShowMenu(true);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showMenu]);

  const menuItems = B2B_ACTIONS.map((item, i) => {
    const ItemIcon = item.icon;
    const hasSeparator = i > 0 && B2B_ACTIONS[i - 1]?.danger !== item.danger;
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
      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => {}}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="-m-1.5 p-3 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
        >
          <Link href={`/pedidos-b2b/${pedido.id}`} className="flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </Link>
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
            Ver detalle
          </div>,
          document.body
        )}
      </div>
      <button
        ref={dotsRef}
        onClick={e => { e.stopPropagation(); showMenu ? setShowMenu(false) : openMenu(); }}
        className="-m-1.5 p-3 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-200"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {mounted && showMenu && createPortal(
        isMobile ? (
          /* ── Mobile: bottom sheet ── */
          <div className="fixed inset-0 z-50" onMouseDown={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Escape") setShowMenu(false); }}>
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
            tabIndex={0}
            ref={el => { if (el) el.focus(); }}
            style={menuStyle}
            className="bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 min-w-[192px] outline-none"
            onMouseDown={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === "Escape") setShowMenu(false); }}
          >
            {menuItems}
          </div>
        ),
        document.body,
      )}
    </div>
  );
}

// ─── Sorting helper ──────────────────────────────────────────────────────────
type SortField = "fechaCreacion" | "seller" | "estado" | "canalVenta" | "metodoEnvio" | null;
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-400 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />;
}

// ─── Filter section accordion ────────────────────────────────────────────────
function FilterSection({ title, options, selected, onToggle, defaultOpen = true }: {
  title: string; options: string[]; selected: Set<string>; onToggle: (v: string) => void; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const count = selected.size;
  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
          {title}
          {count > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold leading-none">{count}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className={`space-y-1 mt-2 ${options.length >= 4 ? "overflow-y-auto max-h-[176px] pr-1" : ""}`}>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors duration-300">
              <input type="checkbox" checked={selected.has(opt)} onChange={() => onToggle(opt)} className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 cursor-pointer" />
              <span className="text-sm text-neutral-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function PedidosB2BPage() {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("Todos");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sorting
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");
  const [filterSellers, setFilterSellers] = useState<Set<string>>(new Set());
  const [filterCanales, setFilterCanales] = useState<Set<string>>(new Set());
  const [filterMetodos, setFilterMetodos] = useState<Set<string>>(new Set());

  const uniqueSellers = useMemo(() => [...new Set(PEDIDOS_B2B.map(p => p.seller))].sort(), []);
  const uniqueCanales = useMemo(() => [...new Set(PEDIDOS_B2B.map(p => p.canalVenta))].sort(), []);
  const uniqueMetodos = useMemo(() => [...new Set(PEDIDOS_B2B.map(p => p.metodoEnvio))].sort(), []);

  // ── Persistent filters (SP-3) ──────────────────────────────────────────
  const FILTERS_KEY = "amplifica_b2b_filters";
  const filtersRestoredRef = useRef(false);

  // Restore filters from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FILTERS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.activeTab) setActiveTab(s.activeTab);
        if (s.filterSellers?.length) setFilterSellers(new Set(s.filterSellers));
        if (s.filterCanales?.length) setFilterCanales(new Set(s.filterCanales));
        if (s.filterMetodos?.length) setFilterMetodos(new Set(s.filterMetodos));
        if (s.filterFechaDesde) setFilterFechaDesde(s.filterFechaDesde);
        if (s.filterFechaHasta) setFilterFechaHasta(s.filterFechaHasta);
      }
    } catch { /* ignore parse errors */ }
    filtersRestoredRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save filters to sessionStorage on change
  useEffect(() => {
    if (!filtersRestoredRef.current) return;
    const state = {
      activeTab,
      filterSellers: [...filterSellers],
      filterCanales: [...filterCanales],
      filterMetodos: [...filterMetodos],
      filterFechaDesde,
      filterFechaHasta,
    };
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(state));
  }, [activeTab, filterSellers, filterCanales, filterMetodos, filterFechaDesde, filterFechaHasta]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterFechaDesde) count++;
    if (filterFechaHasta) count++;
    count += filterSellers.size;
    count += filterCanales.size;
    count += filterMetodos.size;
    return count;
  }, [filterFechaDesde, filterFechaHasta, filterSellers, filterCanales, filterMetodos]);

  function clearAllFilters() {
    setFilterFechaDesde("");
    setFilterFechaHasta("");
    setFilterSellers(new Set());
    setFilterCanales(new Set());
    setFilterMetodos(new Set());
  }

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Skeleton loading
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 400); return () => clearTimeout(t); }, []);

  // Simulated real-time updates (mock polling every 60s — Phase 4: DP-1)
  const [lastUpdated, setLastUpdated] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Reset page on filter/tab change
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, filterFechaDesde, filterFechaHasta, filterSellers, filterCanales, filterMetodos]);

  // ── Tabs overflow scroll ──────────────────────────────────────────────────
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

  // ── Status counts (for tab badges) ────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of TABS_B2B) {
      const statuses = TAB_TO_STATUS[tab] ?? ALL_B2B_STATUSES;
      counts[tab] = PEDIDOS_B2B.filter(p => statuses.includes(p.estado)).length;
    }
    return counts;
  }, []);

  // ── Filtered + sorted data ────────────────────────────────────────────────
  const ACTION_STATES: B2BStatus[] = ["Documentación pendiente", "Redistribución pendiente", "Entrega fallida"];

  const filtered = useMemo(() => {
    return PEDIDOS_B2B
      .filter(p => {
        const tabStatuses = TAB_TO_STATUS[activeTab] ?? ALL_B2B_STATUSES;
        if (!tabStatuses.includes(p.estado)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !p.idAmplifica.toLowerCase().includes(q) &&
            !p.seller.toLowerCase().includes(q) &&
            !p.destinatario.razonSocial.toLowerCase().includes(q)
          ) return false;
        }
        // Advanced filters
        if (filterFechaDesde && p.fechaCreacion < filterFechaDesde) return false;
        if (filterFechaHasta && p.fechaCreacion > filterFechaHasta + "T23:59:59") return false;
        if (filterSellers.size > 0 && !filterSellers.has(p.seller)) return false;
        if (filterCanales.size > 0 && !filterCanales.has(p.canalVenta)) return false;
        if (filterMetodos.size > 0 && !filterMetodos.has(p.metodoEnvio)) return false;
        return true;
      })
      .sort((a, b) => {
        const aAction = ACTION_STATES.includes(a.estado) ? 0 : 1;
        const bAction = ACTION_STATES.includes(b.estado) ? 0 : 1;
        return aAction - bAction;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, filterFechaDesde, filterFechaHasta, filterSellers, filterCanales, filterMetodos]);

  // ── Sorting ──────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let va: string, vb: string;
      switch (sortField) {
        case "fechaCreacion": va = a.fechaCreacion; vb = b.fechaCreacion; break;
        case "seller": va = a.seller; vb = b.seller; break;
        case "estado": va = a.estado; vb = b.estado; break;
        case "canalVenta": va = a.canalVenta; vb = b.canalVenta; break;
        case "metodoEnvio": va = a.metodoEnvio; vb = b.metodoEnvio; break;
        default: return 0;
      }
      const cmp = va.localeCompare(vb, "es-CL");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const paginatedRows = sorted.slice(startIdx, startIdx + pageSize);
  const fromRow = sorted.length === 0 ? 0 : startIdx + 1;
  const toRow = Math.min(startIdx + pageSize, sorted.length);

  // ── Bulk selection helpers ────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Ignore if a modal/overlay is open (check for portal overlays)
      if (document.querySelector("[role='dialog'], .fixed.inset-0")) return;

      // Ctrl+N or Cmd+N — Create new pedido
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        router.push("/pedidos-b2b/crear");
      }

      // Ctrl+F or Cmd+F — Focus search input
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
        searchInput?.focus();
      }

      // Escape — Deselect all
      if (e.key === "Escape") {
        if (selectedIds.size > 0) {
          setSelectedIds(new Set());
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, selectedIds]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center sm:text-left" style={NW}>
          Pedidos B2B
        </h1>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Button variant="tertiary" iconLeft={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" href="/pedidos-b2b/crear" iconLeft={<Plus className="w-4 h-4" />}>
            Crear pedido B2B
          </Button>
        </div>
      </div>

      {/* ── KPI Cards (dark navy strip — matches B2C mejorada) ─────────── */}
      <div className="rounded-2xl bg-[#111759] overflow-x-auto overflow-y-visible table-scroll mb-5">
        <div className="flex divide-x divide-white/10">
          {KPIS_B2B.map(kpi => {
            const chartColor = kpi.delta.color === "neutral" ? "#a3a3a3" : kpi.delta.color === "red" ? "#f87171" : kpi.delta.color === "amber" ? "#f59e0b" : "#4ade80";
            const sparkRaw = SPARKLINE_DATA[kpi.title] ?? [];
            const sparkData = sparkRaw.map(v => ({ v }));
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
                  <span className="text-neutral-300">{getKpiIcon(kpi.title)}</span>
                  <span className="text-xs font-semibold text-neutral-300">{kpi.title}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col min-w-0 gap-1 relative z-20">
                    <span className="text-xl font-bold text-white leading-none tracking-tight tabular-nums">
                      {kpi.value}
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap leading-none w-fit ${deltaBg}`}
                      title={`Variación: ${kpi.delta.value} ${kpi.delta.label}`}
                    >
                      {kpi.delta.value} {kpi.delta.label}
                    </span>
                  </div>
                  {sparkData.length > 0 && (
                    <div className="w-16 h-10 2xl:w-24 2xl:h-12 flex-shrink-0 relative">
                      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #111759 0%, transparent 40%)" }} />
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`sparkB2B-${kpi.title.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.[0]) return null;
                              return (
                                <div className="bg-neutral-900 text-white text-xs px-2 py-1 rounded-lg shadow-lg">
                                  {payload[0].value}
                                </div>
                              );
                            }}
                            cursor={false}
                          />
                          <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#sparkB2B-${kpi.title.replace(/[^a-zA-Z0-9]/g, "")})`} dot={false} isAnimationActive={false} />
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

      {/* ── Toolbar: Tabs + Search ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        {/* Mobile: tab select */}
        <select
          value={activeTab}
          onChange={e => setActiveTab(e.target.value)}
          className="sm:hidden h-10 bg-neutral-100 rounded-lg pl-3 pr-8 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          {TABS_B2B.map(tab => (
            <option key={tab} value={tab}>{tab} ({statusCounts[tab] ?? 0})</option>
          ))}
        </select>

        {/* Desktop: pill tabs (matches B2C mejorada exactly) */}
        <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0 relative">
          {showLeftArrow && (
            <button onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
              className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-neutral-100 via-neutral-100/90 to-transparent rounded-l-xl">
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
            </button>
          )}
          <div ref={tabsRef} role="tablist" aria-label="Filtrar por estado" className="flex items-center gap-0.5 overflow-x-auto tabs-scroll bg-neutral-100 rounded-lg px-0.5 select-none h-9" style={{ scrollbarWidth: "none" }}>
            {TABS_B2B.map(tab => {
              const isActive = activeTab === tab;
              const count = statusCounts[tab] ?? 0;
              const colors = TAB_BADGE_COLORS[tab] ?? TAB_BADGE_COLORS["Todos"];
              const badgeClass = isActive ? colors.active : colors.inactive;
              const TabIcon = TAB_ICONS[tab];
              const iconActiveColor = TAB_ICON_ACTIVE_COLORS[tab] ?? "text-primary-500";
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab)}
                  style={{ whiteSpace: "nowrap", letterSpacing: "-0.02em" }}
                  className={`px-2.5 gap-1.5 rounded-md text-[13px] leading-tight transition-all duration-200 flex-shrink-0 flex items-center h-8 ${
                    isActive
                      ? "bg-white text-neutral-900 font-medium shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {TabIcon && <TabIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? iconActiveColor : "text-neutral-400"}`} />}
                  {tab}
                  <span className={`ml-0.5 text-[10px] tabular-nums rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 font-medium font-sans ${badgeClass}`}>
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

        {/* Right side: search + filters */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <button onClick={() => setShowFilters(true)} className="relative h-9 w-9 flex-shrink-0 flex items-center justify-center border border-transparent rounded-lg transition-colors duration-300 bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por ID, seller o destino..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9 pr-9 h-9 w-full sm:w-56 bg-neutral-100 border-0 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Link
            href="/pedidos-b2b/columnas"
            className="hidden sm:flex h-9 w-9 flex-shrink-0 bg-neutral-100 rounded-lg hover:bg-neutral-200 items-center justify-center transition-colors duration-300"
            title="Editor de columnas"
          >
            <Columns3 className="w-4 h-4 text-neutral-500" />
          </Link>
        </div>
      </div>

      {/* ── Bulk actions bar (DS: floating dark bar) ──────────────────────── */}
      {!isLoading && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-3 bg-[#1d1d1f] rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/30 border border-white/10 whitespace-nowrap overflow-x-auto table-scroll">
            <div className="flex items-center gap-2 pr-3 border-r border-white/15">
              <span className="text-sm font-semibold text-white tabular-nums">{selectedIds.size}</span>
              <span className="text-sm text-neutral-400">{selectedIds.size === 1 ? "seleccionado" : "seleccionados"}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { showToast(`${selectedIds.size} pedidos exportados`, "success"); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Exportar</span>
              </button>
              <button
                onClick={() => { showToast(`Etiquetas de ${selectedIds.size} pedidos enviadas a impresión`, "success"); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Etiquetas</span>
              </button>
            </div>
            <div className="pl-3 border-l border-white/15">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table (desktop) ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="animate-pulse p-4 space-y-3">
            <div className="h-9 bg-neutral-100 rounded-lg w-full" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-neutral-50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative animate-in fade-in duration-300">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll">
          <table className="w-full table-auto text-sm border-collapse font-sans tracking-normal">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="py-2 px-2 w-[40px] align-middle">
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleSelectAll}
                    className="mx-auto"
                  />
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={{ ...NW, minWidth: 130 }}>
                  ID
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={{ ...NW, minWidth: 120 }} onClick={() => toggleSort("seller")}>
                  Seller<SortIcon field="seller" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={{ ...NW, minWidth: 110 }} onClick={() => toggleSort("canalVenta")}>
                  Canal<SortIcon field="canalVenta" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={{ ...NW, minWidth: 160 }}>
                  Destino
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={{ ...NW, minWidth: 160 }} onClick={() => toggleSort("estado")}>
                  Estado<SortIcon field="estado" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={{ ...NW, minWidth: 150 }} onClick={() => toggleSort("metodoEnvio")}>
                  Método envío<SortIcon field="metodoEnvio" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={{ ...NW, minWidth: 120 }} onClick={() => toggleSort("fechaCreacion")}>
                  Fecha<SortIcon field="fechaCreacion" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50 w-[100px]"
                  style={{ ...NW, ...stickyRight }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 transition-all duration-200">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Search className="w-5 h-5 text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-600">
                        {activeTab === "Todos"
                          ? "No se encontraron pedidos B2B"
                          : `No hay pedidos en estado "${activeTab}"`}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {searchQuery || activeFilterCount > 0
                          ? "Intenta ajustar los filtros o la búsqueda"
                          : "Los pedidos aparecerán aquí cuando se creen"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map(pedido => {
                  const isSelected = selectedIds.has(pedido.id);
                  const isActionRequired = ACTION_STATES.includes(pedido.estado);
                  return (
                    <tr
                      key={pedido.id}
                      className={`hover:bg-neutral-50/60 transition-colors duration-300 group h-[40px] ${
                        isSelected ? "bg-primary-50/40" : isActionRequired ? "bg-red-50/30" : ""
                      }`}
                      style={isActionRequired ? { boxShadow: "inset 3px 0 0 0 #ef4444" } : undefined}
                    >
                      <td className="py-1 px-2 align-middle">
                        <Checkbox checked={isSelected} onChange={() => toggleSelectOne(pedido.id)} className="mx-auto" />
                      </td>
                      <td className="py-2 px-3" style={NW}>
                        <CopyableId value={pedido.idAmplifica} />
                      </td>
                      <td className="py-2 px-3 text-sm text-neutral-700 font-medium" style={NW} title={pedido.seller}>
                        {pedido.seller}
                      </td>
                      <td className="py-2 px-3 text-sm text-neutral-600" style={NW} title={pedido.canalVenta}>
                        {pedido.canalVenta}
                      </td>
                      <td className="py-2 px-3 text-sm text-neutral-600" style={NW} title={pedido.destinatario.razonSocial}>
                        {truncate(pedido.destinatario.razonSocial, 24)}
                      </td>
                      <td className="py-2 px-3" style={NW}>
                        <B2BStatusBadge status={pedido.estado} />
                      </td>
                      <td className="py-2 px-3 text-sm text-neutral-600" style={NW}>
                        {pedido.metodoEnvio}
                      </td>
                      <td className="py-2 px-3 text-sm text-neutral-500 tabular-nums" style={NW}>
                        {(() => {
                          const sla = getSlaIndicator(pedido.estado, pedido.fechaCreacion);
                          return (
                            <span className="inline-flex items-center gap-1.5">
                              {sla && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sla.color}`} title={sla.label} />}
                              {fmtDate(pedido.fechaCreacion)}
                            </span>
                          );
                        })()}
                      </td>
                      <td
                        className="py-1 px-2 bg-white group-hover:bg-white/80 group-hover:backdrop-blur-[4px] transition-all duration-300 w-[100px]"
                        style={{ ...NW, ...stickyRight }}
                      >
                        <ActionsCell pedido={pedido} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — DS standard (numbered pages) */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
              <span className="text-neutral-500">Mostrar</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-transparent font-medium focus:outline-none cursor-pointer">
                <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
              </select>
            </label>
            <span className="text-sm text-neutral-500 tabular-nums">
              {fromRow}–{toRow} de {sorted.length}
              <span className="text-xs text-neutral-400 ml-2">· Actualizado {lastUpdated.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button disabled={clampedPage === 1} onClick={() => setCurrentPage(1)} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Primera página">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button disabled={clampedPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Anterior">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-0.5">
              {getPageNumbers(clampedPage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-neutral-400 text-sm">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p as number)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${clampedPage === p ? "bg-primary-25 text-primary-900" : "text-neutral-600 hover:bg-neutral-100"}`}>{p}</button>
                )
              )}
            </div>
            <button disabled={clampedPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Siguiente">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button disabled={clampedPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Última página">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── Mobile results counter ───────────────────────────────────────── */}
      <div className="sm:hidden flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-neutral-500">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          <span className="text-xs text-neutral-400 ml-1">· Actualizado {lastUpdated.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
        </span>
      </div>

      {/* ── Cards (mobile) ────────────────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col gap-3">
        {paginatedRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">
              {activeTab === "Todos"
                ? "No se encontraron pedidos B2B"
                : `No hay pedidos en estado "${activeTab}"`}
            </p>
            <p className="text-xs text-neutral-500">
              {searchQuery || activeFilterCount > 0
                ? "Intenta ajustar los filtros o la búsqueda"
                : "Los pedidos aparecerán aquí cuando se creen"}
            </p>
          </div>
        ) : (
          paginatedRows.map(pedido => {
            const isActionRequired = ACTION_STATES.includes(pedido.estado);
            return (
              <div
                key={pedido.id}
                className={`rounded-2xl p-4 ${
                  isActionRequired
                    ? "bg-red-50/30 border border-red-200 border-l-[3px] border-l-red-400"
                    : "bg-white border border-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <CopyableId value={pedido.idAmplifica} />
                  <B2BStatusBadge status={pedido.estado} />
                </div>
                <div className="flex items-center gap-3 text-sm mb-2.5">
                  <span className="flex items-center gap-1 text-neutral-800 font-medium truncate">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    {pedido.seller}
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs text-neutral-500 truncate">{pedido.canalVenta}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <span className="truncate" title={pedido.destinatario.razonSocial}>
                    {truncate(pedido.destinatario.razonSocial, 28)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <CalendarDays className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{fmtDate(pedido.fechaCreacion)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Truck className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{pedido.metodoEnvio}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                  <Button variant="secondary" size="sm" iconLeft={<Eye className="w-4 h-4" />} className="flex-1" href={`/pedidos-b2b/${pedido.id}`}>
                    Ver detalle
                  </Button>
                  <ActionsCell pedido={pedido} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile pagination */}
      <div className="sm:hidden flex items-center justify-between mt-3 pb-8">
        <span className="text-xs text-neutral-600 tabular-nums">{fromRow}–{toRow} de {sorted.length}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={clampedPage <= 1}
            className="p-2.5 bg-white border border-neutral-200 rounded-lg disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={clampedPage >= totalPages}
            className="p-2.5 bg-white border border-neutral-200 rounded-lg disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Filters modal ─────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setShowFilters(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-900">Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold leading-none">{activeFilterCount}</span>
                )}
              </div>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Date range */}
              <div>
                <p className="text-sm font-semibold text-neutral-700 mb-2">Rango de fecha</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">Desde</label>
                    <input
                      type="date"
                      value={filterFechaDesde}
                      onChange={e => setFilterFechaDesde(e.target.value)}
                      className="w-full h-8 px-3 text-sm border border-neutral-300 rounded-md bg-white text-neutral-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">Hasta</label>
                    <input
                      type="date"
                      value={filterFechaHasta}
                      onChange={e => setFilterFechaHasta(e.target.value)}
                      className="w-full h-8 px-3 text-sm border border-neutral-300 rounded-md bg-white text-neutral-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                    />
                  </div>
                </div>
              </div>

              {/* Sellers */}
              <FilterSection
                title="Seller"
                options={uniqueSellers}
                selected={filterSellers}
                onToggle={v => setFilterSellers(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; })}
              />

              {/* Canales */}
              <FilterSection
                title="Canal de venta"
                options={uniqueCanales}
                selected={filterCanales}
                onToggle={v => setFilterCanales(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; })}
              />

              {/* Métodos de envío */}
              <FilterSection
                title="Método de envío"
                options={uniqueMetodos}
                selected={filterMetodos}
                onToggle={v => setFilterMetodos(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; })}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100">
              <button
                onClick={clearAllFilters}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Limpiar filtros
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="h-9 px-5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB mobile ────────────────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-6 right-4 z-40">
        <Link
          href="/pedidos-b2b/crear"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* ── Toast notification ─────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in fade-in slide-in-from-bottom-4 duration-200 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800"
            : toast.type === "error" ? "bg-red-50 border-red-200 text-red-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            : toast.type === "error" ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            : <Inbox className="w-5 h-5 text-blue-500 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
