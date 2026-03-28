"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, Plus, X, Eye, Download, SlidersHorizontal, ScanLine,
  Check, Package, Clock, PackageCheck, Truck, ScanBarcode,
  CheckCircle2, AlertTriangle, Info, RefreshCw, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown, SquareCheckBig,
  // Tab icons (matching ReturnStatusBadge)
  Warehouse, MapPin, Send, Ban,
} from "lucide-react";
import ReturnStatusBadge, { type ReturnStatus, statusConfig } from "@/components/devoluciones/ReturnStatusBadge";
import ModuleTabs from "@/components/layout/ModuleTabs";
import { DEVOLUCIONES_MODULE_TABS } from "./_tabs";
import Button from "@/components/ui/Button";
import CopyableId from "@/components/ui/CopyableId";
import ScanToSelectModal from "@/components/devoluciones/ScanToSelectModal";
import { getRole, can } from "@/lib/roles";
import {
  MOCK_RETURNS, OR_STATS,
  type ReturnRecord,
} from "./_data";

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

// ─── Column sorting ─────────────────────────────────────────────────────────
type SortField = "createdAt" | "seller" | "branch" | "status" | null;
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-400 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />;
}

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

// ─── KPI icon mapping ───────────────────────────────────────────────────────
function getKpiIcon(title: string) {
  if (title.includes("Total")) return <Package className="w-4 h-4" />;
  if (title.includes("Pendientes")) return <Clock className="w-4 h-4" />;
  if (title.includes("Listas")) return <PackageCheck className="w-4 h-4" />;
  if (title.includes("Entregadas")) return <Truck className="w-4 h-4" />;
  return <Package className="w-4 h-4" />;
}

// ─── Tab configuration ──────────────────────────────────────────────────────
const STATUS_TABS = [
  "Todas",
  "Creada",
  "Recibida en bodega",
  "Lista para devolver",
  "En transferencia",
  "Recibida en CD",
  "Retirada en bodega",
  "Enviada al seller",
  "Cancelada",
] as const;

const TAB_TO_STATUS: Record<string, ReturnStatus[]> = {
  "Todas": ["creada", "recibida_en_bodega", "lista_para_devolver", "en_transferencia", "recibida_en_cd", "retirada_en_bodega", "enviada_al_seller", "cancelada"],
  "Creada": ["creada"],
  "Recibida en bodega": ["recibida_en_bodega"],
  "Lista para devolver": ["lista_para_devolver"],
  "En transferencia": ["en_transferencia"],
  "Recibida en CD": ["recibida_en_cd"],
  "Retirada en bodega": ["retirada_en_bodega"],
  "Enviada al seller": ["enviada_al_seller"],
  "Cancelada": ["cancelada"],
};

const TAB_BADGE_COLORS: Record<string, { active: string; inactive: string }> = {
  "Todas":                 { active: "bg-primary-500 text-white",       inactive: "bg-neutral-200/70 text-neutral-500" },
  "Creada":                { active: "bg-neutral-200 text-neutral-700", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Recibida en bodega":    { active: "bg-amber-100 text-amber-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Lista para devolver":   { active: "bg-indigo-100 text-indigo-700",   inactive: "bg-neutral-200/70 text-neutral-500" },
  "En transferencia":      { active: "bg-sky-100 text-sky-700",         inactive: "bg-neutral-200/70 text-neutral-500" },
  "Recibida en CD":        { active: "bg-primary-100 text-primary-700", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Retirada en bodega":    { active: "bg-green-100 text-green-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Enviada al seller":     { active: "bg-green-200 text-green-800",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Cancelada":             { active: "bg-red-100 text-red-700",         inactive: "bg-neutral-200/70 text-neutral-500" },
};

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }> | null> = {
  "Todas": null,
  "Creada": Plus,
  "Recibida en bodega": Warehouse,
  "Lista para devolver": PackageCheck,
  "En transferencia": Truck,
  "Recibida en CD": MapPin,
  "Retirada en bodega": Check,
  "Enviada al seller": Send,
  "Cancelada": Ban,
};

const TAB_ICON_ACTIVE_COLORS: Record<string, string> = {
  "Creada": "text-neutral-600",
  "Recibida en bodega": "text-amber-500",
  "Lista para devolver": "text-indigo-500",
  "En transferencia": "text-sky-500",
  "Recibida en CD": "text-primary-500",
  "Retirada en bodega": "text-green-500",
  "Enviada al seller": "text-green-600",
  "Cancelada": "text-red-400",
};

// ─── Actions dropdown ───────────────────────────────────────────────────────
type MenuItem = { label: string; icon?: React.ComponentType<{ className?: string }>; danger?: boolean };

const ROW_ACTIONS: MenuItem[] = [
  { label: "Ver detalle", icon: Eye },
  { label: "Exportar", icon: Download },
];

function ActionsCell({ ret }: { ret: ReturnRecord }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const dotsRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const openMenu = useCallback(() => {
    if (!dotsRef.current) return;
    const rect = dotsRef.current.getBoundingClientRect();
    const menuH = ROW_ACTIONS.length * 44 + 12;
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

  const menuItems = ROW_ACTIONS.map((item, i) => {
    const ItemIcon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => { setShowMenu(false); }}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
          item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        {ItemIcon && <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-600"}`} />}
        {item.label}
      </button>
    );
  });

  const menuEl = (
    <>
      {/* Backdrop (mobile) */}
      <div className="sm:hidden fixed inset-0 bg-black/40 z-[2147483646]" onClick={() => setShowMenu(false)} />
      {/* Menu */}
      <div
        style={menuStyle}
        className={`${
          window.innerWidth < 640
            ? "fixed bottom-0 left-0 right-0 z-[2147483647] rounded-t-2xl"
            : "w-48 rounded-xl"
        } bg-white shadow-lg border border-neutral-200 py-1.5 overflow-hidden`}
      >
        {window.innerWidth < 640 && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-sm font-semibold text-neutral-900">{ret.displayId}</span>
            <button onClick={() => setShowMenu(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {menuItems}
      </div>
    </>
  );

  return (
    <div className="flex items-center gap-1 justify-end">
      <Link
        href={`/devoluciones/${ret.id}`}
        className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
        title="Ver detalle"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <button
        ref={dotsRef}
        onClick={e => { e.stopPropagation(); openMenu(); }}
        className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
        title="Más acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {mounted && showMenu && createPortal(menuEl, document.body)}
    </div>
  );
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

// ─── KPI type ───────────────────────────────────────────────────────────────
type KpiCard = {
  title: string;
  value: number;
  delta: { value: string; label: string; color: "green" | "red" | "amber" | "neutral" };
};

// ─── Main Page Component ────────────────────────────────────────────────────
export default function DevolucionesPage() {
  // ── Toast state ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{message: string; type: "success"|"error"|"info"} | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  // ── Role-based permissions ────────────────────────────────────────────────
  const role = getRole();

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("Todas");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filterSucursales, setFilterSucursales] = useState<Set<string>>(new Set());
  const [filterSellers, setFilterSellers] = useState<Set<string>>(new Set());
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");

  const uniqueSucursales = useMemo(() => [...new Set(MOCK_RETURNS.map(r => r.branchName))].sort(), []);
  const uniqueSellers = useMemo(() => [...new Set(MOCK_RETURNS.map(r => r.sellerName))].sort(), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterFechaDesde) count++;
    if (filterFechaHasta) count++;
    count += filterSucursales.size;
    count += filterSellers.size;
    return count;
  }, [filterFechaDesde, filterFechaHasta, filterSucursales, filterSellers]);

  function clearAllFilters() {
    setFilterFechaDesde("");
    setFilterFechaHasta("");
    setFilterSucursales(new Set());
    setFilterSellers(new Set());
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Loading sim
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Tab scroll arrows
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const check = () => {
      setShowLeftArrow(el.scrollLeft > 4);
      setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [isLoading]);

  // Toggle sort
  const toggleSort = (f: SortField) => {
    if (sortField === f) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortField(null); setSortDir("desc"); }
    } else {
      setSortField(f);
      setSortDir("asc");
    }
  };

  // ── Helper: apply advanced filters ──────────────────────────────────────
  const applyFilters = useCallback((data: ReturnRecord[]) => {
    let result = data;
    if (filterSucursales.size > 0) {
      result = result.filter(r => filterSucursales.has(r.branchName));
    }
    if (filterSellers.size > 0) {
      result = result.filter(r => filterSellers.has(r.sellerName));
    }
    if (filterFechaDesde) {
      const from = new Date(filterFechaDesde);
      result = result.filter(r => new Date(r.createdAt) >= from);
    }
    if (filterFechaHasta) {
      const to = new Date(filterFechaHasta + "T23:59:59");
      result = result.filter(r => new Date(r.createdAt) <= to);
    }
    return result;
  }, [filterSucursales, filterSellers, filterFechaDesde, filterFechaHasta]);

  // ── Filtered & paginated data ─────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of STATUS_TABS) {
      const statuses = TAB_TO_STATUS[tab] ?? [];
      let data = MOCK_RETURNS.filter(r => statuses.includes(r.status));
      data = applyFilters(data);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter(r =>
          r.displayId.toLowerCase().includes(q) ||
          r.sellerName.toLowerCase().includes(q) ||
          (r.orderDisplayId?.toLowerCase().includes(q) ?? false) ||
          r.branchName.toLowerCase().includes(q)
        );
      }
      counts[tab] = data.length;
    }
    return counts;
  }, [searchQuery, applyFilters]);

  const filtered = useMemo(() => {
    const statuses = TAB_TO_STATUS[activeTab] ?? TAB_TO_STATUS["Todas"];
    let data = MOCK_RETURNS.filter(r => statuses.includes(r.status));
    data = applyFilters(data);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r =>
        r.displayId.toLowerCase().includes(q) ||
        r.sellerName.toLowerCase().includes(q) ||
        (r.orderDisplayId?.toLowerCase().includes(q) ?? false) ||
        r.branchName.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortField) {
      data = [...data].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "createdAt":
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case "seller":
            cmp = a.sellerName.localeCompare(b.sellerName);
            break;
          case "branch":
            cmp = a.branchName.localeCompare(b.branchName);
            break;
          case "status":
            cmp = a.status.localeCompare(b.status);
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [activeTab, searchQuery, applyFilters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);
  const fromRow = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow = Math.min(startIdx + pageSize, filtered.length);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allOnPageSelected = paginated.length > 0 && paginated.every(r => selectedIds.has(r.id));
  const someOnPageSelected = paginated.some(r => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allOnPageSelected) {
      const next = new Set(selectedIds);
      paginated.forEach(r => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach(r => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  // Reset page on tab change
  useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [activeTab]);

  // ── Scan-to-select: check if selected returns qualify ──────────────────────
  const selectedReturns = useMemo(
    () => MOCK_RETURNS.filter(r => selectedIds.has(r.id)),
    [selectedIds]
  );

  const scanEligibleSeller = useMemo(() => {
    // All selected must be from same seller and status recibida_en_bodega
    const eligible = selectedReturns.filter(r => r.status === "recibida_en_bodega");
    if (eligible.length === 0) return null;
    const sellerId = eligible[0].sellerId;
    if (eligible.every(r => r.sellerId === sellerId)) {
      return { sellerId, sellerName: eligible[0].sellerName, returns: eligible };
    }
    return null;
  }, [selectedReturns]);

  // ── KPI data ──────────────────────────────────────────────────────────────
  const kpis: KpiCard[] = [
    { title: "Total devoluciones", value: OR_STATS.total, delta: { value: "+8", label: "vs mes anterior", color: "neutral" } },
    { title: "Pendientes", value: OR_STATS.pendientes, delta: { value: "+3", label: "esta semana", color: "amber" } },
    { title: "Listas para devolver", value: OR_STATS.listasParaDevolver, delta: { value: "−2", label: "vs ayer", color: "green" } },
    { title: "Entregadas este mes", value: OR_STATS.entregadasEsteMes, delta: { value: "+5", label: "vs mes anterior", color: "green" } },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center sm:text-left" style={NW}>
            Devoluciones
          </h1>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Button variant="tertiary" iconLeft={<Download className="w-4 h-4" />}>
              Exportar
            </Button>
            {/* Seller-only: "Iniciar devolución" — visible when can ret:initiate but NOT ret:create */}
            {can(role, "ret:initiate") && !can(role, "ret:create") && (
              <Button variant="primary" href="/devoluciones/crear?flow=seller" iconLeft={<RefreshCw className="w-4 h-4" />}>
                Iniciar devolución
              </Button>
            )}
            {can(role, "ret:receive") && (
              <Button variant="secondary" href="/devoluciones/recibir" iconLeft={<ScanLine className="w-4 h-4" />}>
                Recibir devolución
              </Button>
            )}
            {can(role, "ret:create") && (
              <Button variant="primary" href="/devoluciones/crear" iconLeft={<Plus className="w-4 h-4" />}>
                Crear devolución
              </Button>
            )}
          </div>
        </div>

        {/* ── KPI Cards (dark navy strip) ─────────────────────────────────── */}
        <div className="rounded-2xl bg-[#111759] overflow-x-auto overflow-y-visible table-scroll mb-5">
          <div className="flex divide-x divide-white/10">
            {kpis.map(kpi => {
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
            onChange={e => { setActiveTab(e.target.value); }}
            className="sm:hidden h-10 bg-neutral-100 rounded-lg pl-3 pr-8 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
          >
            {STATUS_TABS.map(tab => (
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
            <div ref={tabsRef} role="tablist" aria-label="Filtrar por estado" className="flex items-center gap-0.5 overflow-x-auto tabs-scroll bg-neutral-100 rounded-lg px-0.5 select-none h-9" style={{ scrollbarWidth: "none" }}>
              {STATUS_TABS.map(tab => {
                const isActive = activeTab === tab;
                const count = statusCounts[tab] ?? 0;
                const colors = TAB_BADGE_COLORS[tab] ?? TAB_BADGE_COLORS["Todas"];
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

          {/* Right side: search + filter */}
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
                placeholder="Buscar por ID, seller o pedido..."
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
          </div>
        </div>

        {/* ── Bulk actions bar (DS canonical dark) ─────────────────────────── */}
        {!isLoading && selectedIds.size > 0 && (can(role, "ret:ready") || can(role, "ret:retiro")) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3 bg-[#1d1d1f] rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/30 border border-white/10 whitespace-nowrap overflow-x-auto table-scroll">
              <div className="flex items-center gap-2 pr-3 border-r border-white/15">
                <SquareCheckBig className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white tabular-nums">{selectedIds.size}</span>
                <span className="text-sm text-neutral-400">{selectedIds.size === 1 ? "seleccionado" : "seleccionados"}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button title="Exportar" onClick={() => { setToast({ message: `Exportando ${selectedIds.size} devoluciones`, type: "info" }); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 flex-shrink-0 text-neutral-300 hover:bg-white/10 hover:text-white">
                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden lg:inline">Exportar</span>
                </button>
                {scanEligibleSeller && (
                  <button title="Preparar devoluciones" onClick={() => setShowScanModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 flex-shrink-0 text-neutral-300 hover:bg-white/10 hover:text-white">
                    <ScanBarcode className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden lg:inline">Preparar</span>
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="pl-3 border-l border-white/15 flex-shrink-0" title="Deseleccionar">
                <X className="w-4 h-4 text-neutral-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white flex-1">
            <div className="animate-pulse">
              <div className="h-10 bg-neutral-50 border-b border-neutral-100" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 border-b border-neutral-100 flex items-center px-4 gap-4">
                  <div className="w-3.5 h-3.5 bg-neutral-200 rounded" />
                  <div className="w-24 h-3 bg-neutral-200 rounded" />
                  <div className="w-20 h-3 bg-neutral-200 rounded" />
                  <div className="w-16 h-3 bg-neutral-200 rounded" />
                  <div className="w-28 h-3 bg-neutral-200 rounded" />
                  <div className="w-20 h-3 bg-neutral-200 rounded" />
                  <div className="w-32 h-4 bg-neutral-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white flex flex-col items-center justify-center py-20 px-6 flex-1">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-700 mb-1">No hay devoluciones registradas</p>
            <p className="text-xs text-neutral-500 mb-5 text-center">
              {searchQuery
                ? `No se encontraron resultados para "${searchQuery}"`
                : "Aún no se han registrado devoluciones en esta bandeja."}
            </p>
            <Button variant="primary" href="/devoluciones/crear" iconLeft={<Plus className="w-4 h-4" />}>
              Crear devolución
            </Button>
          </div>
        ) : (
          <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
              <table className="w-full text-sm border-collapse font-sans tracking-normal">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="w-[44px] px-3 py-2 text-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        indeterminate={someOnPageSelected && !allOnPageSelected}
                        onChange={toggleAll}
                        ariaLabel="Seleccionar todos"
                      />
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>ID</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("createdAt")}>
                      Fecha creación <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={NW}>ID Pedido</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("seller")}>
                      Seller <SortIcon field="seller" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("branch")}>
                      Sucursal <SortIcon field="branch" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none" style={NW} onClick={() => toggleSort("status")}>
                      Estado <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className="w-[80px] text-right py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50" style={{ ...NW, ...stickyRight }}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {paginated.map(ret => {
                    const isSelected = selectedIds.has(ret.id);
                    return (
                      <tr
                        key={ret.id}
                        className={`hover:bg-neutral-50/60 transition-colors ${
                          isSelected ? "bg-primary-50/50" : ""
                        }`}
                      >
                        <td className="px-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleOne(ret.id)}
                            ariaLabel={`Seleccionar ${ret.displayId}`}
                          />
                        </td>
                        <td className="py-2 px-2" style={NW}>
                          <Link href={`/devoluciones/${ret.id}`} className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 rounded px-1 py-0.5 text-xs font-mono transition-colors">
                            {ret.displayId}
                          </Link>
                        </td>
                        <td className="py-2 px-2 text-neutral-600" style={NW}>
                          {fmtDate(ret.createdAt)}
                        </td>
                        <td className="py-2 px-2" style={NW}>
                          {ret.orderDisplayId ? (
                            <CopyableId value={ret.orderDisplayId} />
                          ) : (
                            <span className="text-xs text-neutral-500 italic">Sin pedido</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-neutral-700 font-medium" style={NW}>
                          {ret.sellerName}
                        </td>
                        <td className="py-2 px-2 text-neutral-600" style={NW}>
                          {ret.branchName}
                        </td>
                        <td className="py-2 px-2" style={NW}>
                          <ReturnStatusBadge status={ret.status} />
                        </td>
                        <td className="py-2 px-2" style={{ ...NW, ...stickyRight, background: isSelected ? "rgb(239 246 255 / 0.5)" : "white" }}>
                          <ActionsCell ret={ret} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ─────────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
              {/* Left: Mostrar select + counter */}
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
              {/* Right: numbered pagination with first/last */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage(1)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                {/* Previous */}
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-0.5">
                  {getPageNumbers(safePage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-neutral-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          safePage === p
                            ? "bg-primary-25 text-primary-900"
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                {/* Next */}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Last page */}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile FAB — role-conditional */}
        {can(role, "ret:create") && (
          <div className="sm:hidden fixed bottom-6 right-6 z-50">
            <Link
              href="/devoluciones/crear"
              className="w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <Plus className="w-6 h-6" />
            </Link>
          </div>
        )}
        {/* Seller-only mobile FAB */}
        {can(role, "ret:initiate") && !can(role, "ret:create") && (
          <div className="sm:hidden fixed bottom-6 right-6 z-50">
            <Link
              href="/devoluciones/crear?flow=seller"
              className="w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Filters modal ──────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setShowFilters(false)}>
          <div className="absolute inset-0 bg-black/30" />
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

              {/* Sucursales */}
              <FilterSection
                title="Sucursal"
                options={uniqueSucursales}
                selected={filterSucursales}
                onToggle={v => setFilterSucursales(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; })}
              />

              {/* Sellers */}
              <FilterSection
                title="Seller"
                options={uniqueSellers}
                selected={filterSellers}
                onToggle={v => setFilterSellers(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; })}
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

      {/* ── Scan-to-select modal ── */}
      {scanEligibleSeller && (
        <ScanToSelectModal
          open={showScanModal}
          onClose={() => setShowScanModal(false)}
          sellerName={scanEligibleSeller.sellerName}
          returns={scanEligibleSeller.returns.map(r => ({
            id: r.id,
            displayId: r.displayId,
            status: r.status,
          }))}
          onConfirm={(scannedIds) => {
            setShowScanModal(false);
            setSelectedIds(new Set());
            setToast({ message: `${scannedIds.length} devoluciones marcadas como listas para devolver`, type: "success" });
          }}
        />
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" :
          toast.type === "error" ? "bg-red-600 text-white" :
          "bg-neutral-800 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
           toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> :
           <Info className="w-4 h-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </>
  );
}
