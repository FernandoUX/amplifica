"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Check, X,
  Search, SlidersHorizontal, AlertTriangle, Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  QuarantineRecord, QuarantineStatus, QuarantineResolution, QuarantineCategory,
  QR_STORAGE_KEY, SEED_QUARANTINE,
} from "../_data";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadAllQuarantine(): QuarantineRecord[] {
  try {
    const s = localStorage.getItem(QR_STORAGE_KEY);
    return s ? JSON.parse(s) : SEED_QUARANTINE;
  } catch { return SEED_QUARANTINE; }
}

function saveAllQuarantine(records: QuarantineRecord[]) {
  try { localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}

function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function catBadge(cat: QuarantineCategory) {
  if (cat === "interna")           return { label: "Resolución interna Amplifica",   short: "Res. interna", cls: "bg-primary-50 text-primary-600 border-primary-200" };
  if (cat === "devolucion_seller") return { label: "Devolución obligatoria a seller", short: "Dev. obligatoria", cls: "bg-red-50 text-red-700 border-red-200" };
  return                                  { label: "Decisión del seller",             short: "Dec. seller", cls: "bg-amber-50 text-amber-700 border-amber-200" };
}

function estadoBadge(estado: QuarantineStatus) {
  if (estado === "pendiente")  return { label: "Pendiente",  cls: "bg-neutral-100  text-neutral-600  border-neutral-200"  };
  if (estado === "en_gestion") return { label: "En gestión", cls: "bg-blue-50   text-blue-700  border-blue-200"  };
  return                              { label: "Resuelto",   cls: "bg-green-50  text-green-700 border-green-200" };
}

function resolucionLabel(r: QuarantineResolution, rec: QuarantineRecord) {
  if (!r) return "—";
  if (r === "stock_disponible") {
    if (rec.stockCantidad && rec.mermaCantidad)
      return `Stock (${rec.stockCantidad}) + Merma (${rec.mermaCantidad})`;
    return "Stock disponible";
  }
  if (r === "merma") return "Merma";
  return "Devolución";
}

const INCIDENCIA_TAGS: { key: string; label: string; color: "amber" | "red" | "orange" | "purple" }[] = [
  { key: "sin-codigo-barra",  label: "Sin código de barra",        color: "amber"  },
  { key: "codigo-incorrecto", label: "Código incorrecto",          color: "amber"  },
  { key: "codigo-ilegible",   label: "Código ilegible",            color: "amber"  },
  { key: "sin-nutricional",   label: "Sin etiqueta nutricional",   color: "red"    },
  { key: "sin-vencimiento",   label: "Sin fecha de vencimiento",   color: "red"    },
  { key: "danio-parcial",     label: "Daño parcial",               color: "orange" },
  { key: "danio-total",       label: "Daño total",                 color: "red"    },
  { key: "no-en-sistema",     label: "No creado en sistema",       color: "purple" },
];

// ─── Filter accordion (same pattern as OR page) ─────────────────────────────
function FilterAccordion({
  title, options, selected, onToggle, renderOption, defaultOpen = true,
}: {
  title: string;
  options: string[];
  selected: Set<string>;
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
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
              />
              {renderOption ? renderOption(opt) : <span className="text-sm text-neutral-700">{opt}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CuarentenaPage() {
  const [records, setRecords] = useState<QuarantineRecord[]>([]);

  // Category tab (pill tabs like OR page)
  const [activeTab, setActiveTab] = useState<QuarantineCategory | "all">("all");

  // Filters (modal)
  const [filterEstados,   setFilterEstados]   = useState<Set<string>>(new Set());
  const [filterSellers,   setFilterSellers]   = useState<Set<string>>(new Set());
  const [filterSucursales, setFilterSucursales] = useState<Set<string>>(new Set());
  const [searchTerm,    setSearchTerm]    = useState("");
  const [showFilters,   setShowFilters]   = useState(false);
  const activeFilterCount = filterEstados.size + filterSellers.size + filterSucursales.size;

  const toggleInSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) =>
    setter(prev => { const next = new Set(prev); next.has(val) ? next.delete(val) : next.add(val); return next; });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Cat C modal
  const [catCModal,    setCatCModal]    = useState<QuarantineRecord | null>(null);
  const [decisionMode, setDecisionMode] = useState<"stock" | "merma" | "mixto">("stock");
  const [stockQty,     setStockQty]     = useState(0);
  const [mermaQty,     setMermaQty]     = useState(0);
  const [decisionNota, setDecisionNota] = useState("");

  // Load from localStorage
  useEffect(() => { setRecords(loadAllQuarantine()); }, []);

  const updateRecord = (qrId: string, patch: Partial<QuarantineRecord>) => {
    setRecords(prev => {
      const next = prev.map(r => r.id === qrId ? { ...r, ...patch } : r);
      saveAllQuarantine(next);
      return next;
    });
  };

  // Unique sellers / sucursales
  const sellers    = useMemo(() => [...new Set(records.map(r => r.seller))].sort(),    [records]);
  const sucursales = useMemo(() => [...new Set(records.map(r => r.sucursal))].sort(),  [records]);

  // Category counts (for tab badges)
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: records.length };
    for (const r of records) counts[r.categoria] = (counts[r.categoria] || 0) + 1;
    return counts;
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (activeTab       !== "all" && r.categoria !== activeTab)       return false;
      if (filterEstados.size   > 0  && !filterEstados.has(r.estado))   return false;
      if (filterSellers.size   > 0  && !filterSellers.has(r.seller))   return false;
      if (filterSucursales.size > 0 && !filterSucursales.has(r.sucursal)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!r.sku.toLowerCase().includes(q) &&
            !r.productName.toLowerCase().includes(q) &&
            !r.orId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, activeTab, filterEstados, filterSellers, filterSucursales, searchTerm]);

  const clearAllFilters = () => {
    setFilterEstados(new Set());
    setFilterSellers(new Set());
    setFilterSucursales(new Set());
  };

  // Pagination computed
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const fromRow = filtered.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const toRow = Math.min(clampedPage * pageSize, filtered.length);
  const paginatedRows = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  // Stats
  const totalPendientes = records.filter(r => r.estado === "pendiente").length;
  const totalEnGestion  = records.filter(r => r.estado === "en_gestion").length;
  const totalResueltos  = records.filter(r => r.estado === "resuelto").length;

  // Alerts
  const alertaPendiente48h = records.filter(r => r.estado === "pendiente"  && daysSince(r.creadoEn) > 2);
  const alertaGestion7d    = records.filter(r => r.estado === "en_gestion" && daysSince(r.creadoEn) > 7);

  // Cat C modal helpers
  function openCatC(rec: QuarantineRecord) {
    setCatCModal(rec);
    setDecisionMode("stock");
    setStockQty(rec.cantidad);
    setMermaQty(0);
    setDecisionNota("");
  }

  function confirmCatC() {
    if (!catCModal) return;
    const res: QuarantineResolution = decisionMode === "merma" ? "merma" : "stock_disponible";
    updateRecord(catCModal.id, {
      estado:         "resuelto",
      resolucion:     res,
      stockCantidad:  decisionMode === "stock" ? catCModal.cantidad : decisionMode === "mixto" ? stockQty : 0,
      mermaCantidad:  decisionMode === "merma" ? catCModal.cantidad : decisionMode === "mixto" ? mermaQty : 0,
      decisionSeller: decisionNota || undefined,
      resueltoen:     new Date().toISOString(),
    });
    setCatCModal(null);
  }

  return (
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">

      {/* ── Cat C Modal ── */}
      {catCModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Registrar decisión del seller</h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {catCModal.productName}
                  <span className="font-sans ml-1 text-neutral-600">· {catCModal.sku}</span>
                  <span className="ml-1 text-neutral-600">· {catCModal.cantidad} uds.</span>
                </p>
              </div>
              <button onClick={() => setCatCModal(null)} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300 flex-shrink-0">
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-4 space-y-4">
              <div className="space-y-2">
                {(["stock", "merma", "mixto"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setDecisionMode(mode);
                      if (mode === "stock") { setStockQty(catCModal.cantidad); setMermaQty(0); }
                      if (mode === "merma") { setStockQty(0); setMermaQty(catCModal.cantidad); }
                      if (mode === "mixto") {
                        const half = Math.floor(catCModal.cantidad / 2);
                        setStockQty(half); setMermaQty(catCModal.cantidad - half);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors duration-300 ${
                      decisionMode === mode
                        ? "border-primary-300 bg-primary-50 text-primary-600 font-medium"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {mode === "stock" ? "Ingresar a stock (tal como está)" :
                     mode === "merma" ? "Mermar (dar de baja)" :
                                       "Dividir lote — parcial stock + parcial merma"}
                  </button>
                ))}
              </div>
              {decisionMode === "mixto" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Uds. a stock</label>
                    <input type="number" min={0} max={catCModal.cantidad} value={stockQty}
                      onChange={e => { const v = Math.max(0, Math.min(catCModal.cantidad, parseInt(e.target.value) || 0)); setStockQty(v); setMermaQty(catCModal.cantidad - v); }}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Uds. a mermar</label>
                    <input type="number" min={0} max={catCModal.cantidad} value={mermaQty}
                      onChange={e => { const v = Math.max(0, Math.min(catCModal.cantidad, parseInt(e.target.value) || 0)); setMermaQty(v); setStockQty(catCModal.cantidad - v); }}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 tabular-nums"
                    />
                  </div>
                  <p className={`col-span-2 text-xs font-medium ${stockQty + mermaQty === catCModal.cantidad ? "text-green-600" : "text-red-500"}`}>
                    Total: {stockQty + mermaQty} / {catCModal.cantidad} uds
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Nota del seller <span className="font-normal">(opcional)</span></label>
                <textarea value={decisionNota} onChange={e => setDecisionNota(e.target.value)} rows={2}
                  placeholder="Ej: Seller acepta daño cosmético, autoriza venta con descuento"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none placeholder-neutral-300"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex-shrink-0">
              <Button variant="secondary" size="lg" onClick={() => setCatCModal(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={confirmCatC}
                disabled={decisionMode === "mixto" && stockQty + mermaQty !== catCModal.cantidad}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <nav className="pb-1 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-neutral-500">
        <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Stock en cuarentena</span>
      </nav>

      <div className="space-y-5 sm:flex-1 sm:flex sm:flex-col sm:min-h-0 sm:overflow-hidden">

        {/* ── Title ── */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-neutral-900">Stock en cuarentena</h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Gestión transversal de unidades con incidencia pendientes de resolución
          </p>
        </div>

        {/* ── Summary chips ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
          <span className="inline-flex items-center px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
            {totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
            {totalEnGestion} en gestión
          </span>
          <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
            {totalResueltos} resuelto{totalResueltos !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-neutral-500 tabular-nums whitespace-nowrap flex-shrink-0">
            {records.length} registros
          </span>
        </div>

        {/* ── Alerts ── */}
        {alertaPendiente48h.length > 0 && (
          <div className="bg-amber-50 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {alertaPendiente48h.length} registro{alertaPendiente48h.length !== 1 ? "s" : ""} con más de 48h en estado pendiente
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Alerta KAM — iniciar gestión a la brevedad</p>
            </div>
          </div>
        )}
        {alertaGestion7d.length > 0 && (
          <div className="bg-red-50 rounded-xl px-4 py-3 flex items-start gap-3">
            <Clock className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {alertaGestion7d.length} registro{alertaGestion7d.length !== 1 ? "s" : ""} con más de 7 días en gestión
              </p>
              <p className="text-xs text-red-600 mt-0.5">Alerta Supervisor — resolución excede SLA</p>
            </div>
          </div>
        )}

        {/* ── Filter Modal ── */}
        {showFilters && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)" }}
            onMouseDown={() => setShowFilters(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col overflow-hidden"
              onMouseDown={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
                  </div>
                  <h2 className="text-base font-semibold text-neutral-900">Filtros</h2>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowFilters(false)} className="text-neutral-600 hover:text-neutral-600 transition-colors duration-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
                <FilterAccordion
                  title="Estado"
                  options={["pendiente", "en_gestion", "resuelto"]}
                  selected={filterEstados}
                  onToggle={v => toggleInSet(setFilterEstados, v)}
                  renderOption={v => {
                    const labels: Record<string, string> = { pendiente: "Pendiente", en_gestion: "En gestión", resuelto: "Resuelto" };
                    return <span className="text-sm text-neutral-700">{labels[v] ?? v}</span>;
                  }}
                />
                <FilterAccordion
                  title="Seller"
                  options={sellers}
                  selected={filterSellers}
                  onToggle={v => toggleInSet(setFilterSellers, v)}
                />
                <FilterAccordion
                  title="Sucursal"
                  options={sucursales}
                  selected={filterSucursales}
                  onToggle={v => toggleInSet(setFilterSucursales, v)}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 bg-neutral-50">
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-neutral-500 hover:text-neutral-700 font-medium transition-colors duration-300 disabled:opacity-40"
                  disabled={activeFilterCount === 0}
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Toolbar: tabs left, controls right ── */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:flex-shrink-0">
          {/* Category pill tabs */}
          <div className="relative flex-1 min-w-0">
            {/* Mobile: select */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={e => setActiveTab(e.target.value as QuarantineCategory | "all")}
                className="w-full h-9 bg-neutral-100 rounded-lg pl-3 pr-8 text-sm text-neutral-700 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {([ "all", "interna", "devolucion_seller", "decision_seller" ] as const).map(tab => {
                  const labels: Record<string, string> = { all: "Todas", interna: "Res. interna", devolucion_seller: "Dev. obligatoria", decision_seller: "Dec. seller" };
                  return <option key={tab} value={tab}>{labels[tab]}{catCounts[tab] ? ` (${catCounts[tab]})` : ""}</option>;
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            </div>

            {/* Desktop: pill tabs */}
            <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto bg-neutral-100 rounded-lg select-none h-9 px-0.5" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
              {([ "all", "interna", "devolucion_seller", "decision_seller" ] as const).map(tab => {
                const labels: Record<string, string> = { all: "Todas", interna: "Res. interna", devolucion_seller: "Dev. obligatoria", decision_seller: "Dec. seller" };
                const isActive = activeTab === tab;
                const count = catCounts[tab] || 0;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={NW}
                    className={`px-2.5 rounded-md text-[13px] leading-tight transition-all duration-200 flex-shrink-0 flex items-center h-8 ${
                      isActive ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {labels[tab]}
                    {count > 0 && (
                      <span className={`ml-1.5 text-[10px] tabular-nums rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 font-medium ${
                        isActive ? "bg-primary-500 text-white" : "bg-neutral-200/70 text-neutral-500"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right controls: filter button + search */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowFilters(true)}
              className={`relative h-9 w-9 flex items-center justify-center border border-transparent rounded-lg transition-colors duration-300 ${
                activeFilterCount > 0
                  ? "bg-primary-50 text-primary-500 hover:bg-primary-100"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ lineHeight: 1 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
              <input
                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar OR..."
                className="pl-9 pr-8 py-2 h-9 bg-neutral-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 w-52"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search — full width below toolbar */}
        <div className="sm:hidden relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
          <input
            type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar SKU, producto u OR..."
            className="w-full pl-9 pr-8 py-2.5 bg-neutral-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-500 font-medium">Filtros activos:</span>
            {[...filterEstados].map(k => {
              const labels: Record<string, string> = { pendiente: "Pendiente", en_gestion: "En gestión", resuelto: "Resuelto" };
              return (
                <span key={k} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full font-medium">
                  {labels[k] ?? k}
                  <button onClick={() => toggleInSet(setFilterEstados, k)} className="ml-0.5 text-primary-400 hover:text-primary-500"><X className="w-3 h-3" /></button>
                </span>
              );
            })}
            {[...filterSellers].map(k => (
              <span key={k} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full font-medium">
                {k}
                <button onClick={() => toggleInSet(setFilterSellers, k)} className="ml-0.5 text-primary-400 hover:text-primary-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {[...filterSucursales].map(k => (
              <span key={k} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full font-medium">
                {k}
                <button onClick={() => toggleInSet(setFilterSucursales, k)} className="ml-0.5 text-primary-400 hover:text-primary-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-neutral-600 hover:text-neutral-600 underline underline-offset-2">
              Limpiar todo
            </button>
          </div>
        )}

        {/* ── Table (desktop) ── */}
        <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
          <div
            className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            onScroll={e => {
              const el = e.currentTarget;
              el.classList.toggle("scrolled-end", el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
            }}
          >
            <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[130px]" style={NW}>OR</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[90px]" style={NW}>SKU</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[180px]" style={NW}>Producto / Tag</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[65px]" style={NW}>Cant.</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[100px]" style={NW}>Seller</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[100px]" style={NW}>Sucursal</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[140px]" style={NW}>Categoría</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[110px]" style={NW}>Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[90px]" style={NW}>Antigüedad</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 w-[160px]" style={NW}>Resolución</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 bg-neutral-50 w-[150px]" style={{ ...NW, ...stickyRight }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-14 text-center text-sm text-neutral-600" style={NW}>
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map(rec => {
                    const cat     = catBadge(rec.categoria);
                    const est     = estadoBadge(rec.estado);
                    const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
                    const days    = daysSince(rec.creadoEn);
                    const alert48 = rec.estado === "pendiente"  && days > 2;
                    const alert7d = rec.estado === "en_gestion" && days > 7;

                    return (
                      <tr key={rec.id} className={`transition-colors duration-300 group ${
                        alert48 ? "bg-amber-50/40" :
                        alert7d ? "bg-red-50/40"   : "hover:bg-neutral-50/60"
                      }`}>
                        <td className="py-3 px-4" style={NW}>
                          <Link href={`/recepciones/${rec.orId}`}
                            className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 text-xs font-mono transition-colors">
                            {rec.orId}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-500 font-mono tabular-nums" style={NW}>{rec.sku}</td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-neutral-700 leading-snug">{rec.productName}</p>
                          {tagInfo && (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium mt-1 ${
                              tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700"  :
                              tagInfo.color === "orange" ? "bg-orange-50 text-orange-700" :
                              tagInfo.color === "purple" ? "bg-purple-50 text-purple-700" :
                                                           "bg-red-50 text-red-700"
                            }`}>{tagInfo.label}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 tabular-nums font-semibold text-neutral-700" style={NW}>{rec.cantidad}</td>
                        <td className="py-3 px-4 text-xs text-neutral-600" style={NW}>{rec.seller}</td>
                        <td className="py-3 px-4 text-xs text-neutral-600" style={NW}>{rec.sucursal}</td>
                        <td className="py-3 px-4" style={NW}>
                          <span className={`inline-flex items-center whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${cat.cls}`}>
                            {cat.short}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={NW}>
                          <span className={`inline-flex items-center whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${est.cls}`}>
                            {est.label}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={NW}>
                          <span className={`text-xs tabular-nums font-medium ${
                            alert48 ? "text-amber-600" : alert7d ? "text-red-600" : "text-neutral-500"
                          }`}>
                            {days}d
                          </span>
                          {(alert48 || alert7d) && (
                            <AlertTriangle className={`w-3 h-3 ml-1 inline-block ${alert7d ? "text-red-500" : "text-amber-500"}`} />
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-600" style={NW}>
                          {rec.resolucion
                            ? <span className="font-medium">{resolucionLabel(rec.resolucion, rec)}</span>
                            : <span className="text-neutral-300">—</span>}
                        </td>
                        <td
                          className="py-3 px-4 bg-white group-hover:bg-neutral-50/60"
                          style={{ ...NW, ...stickyRight }}
                        >
                          {rec.estado === "pendiente" && (
                            <button onClick={() => updateRecord(rec.id, { estado: "en_gestion" })}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap">
                              Iniciar gestión
                            </button>
                          )}
                          {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                            <button onClick={() => updateRecord(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                              className="text-xs font-medium px-2.5 py-1.5 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg transition-colors duration-100 whitespace-nowrap">
                              Re-etiquetado OK
                            </button>
                          )}
                          {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                            <button onClick={() => updateRecord(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                              className="text-xs font-medium px-2.5 py-1.5 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg transition-colors duration-100 whitespace-nowrap">
                              Confirmar retiro
                            </button>
                          )}
                          {rec.estado === "en_gestion" && rec.categoria === "decision_seller" && (
                            <button onClick={() => openCatC(rec)}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap">
                              Registrar decisión
                            </button>
                          )}
                          {rec.estado === "resuelto" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                              <Check className="w-3 h-3" /> Resuelto
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
            <div className="flex items-center gap-2">
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
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
                className="px-3 h-[44px] bg-neutral-100 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center gap-1.5"
                style={NW}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-neutral-500 tabular-nums" style={NW}>
                {fromRow}–{toRow} de {filtered.length}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={clampedPage >= totalPages}
                className="px-3 h-[44px] bg-neutral-100 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center gap-1.5"
                style={NW}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile cards ── */}
        <div className="sm:hidden space-y-3">
          {paginatedRows.length === 0 ? (
            <p className="text-center text-sm text-neutral-600 py-10">
              No se encontraron registros con los filtros seleccionados.
            </p>
          ) : (
            paginatedRows.map(rec => {
              const cat     = catBadge(rec.categoria);
              const est     = estadoBadge(rec.estado);
              const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
              const days    = daysSince(rec.creadoEn);
              const alert48 = rec.estado === "pendiente"  && days > 2;
              const alert7d = rec.estado === "en_gestion" && days > 7;

              return (
                <div key={rec.id} className={`bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 ${
                  alert48 ? "border-amber-200 bg-amber-50/30" :
                  alert7d ? "border-red-200 bg-red-50/30" : ""
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/recepciones/${rec.orId}`}
                        className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 text-xs font-mono transition-colors">
                        {rec.orId}
                      </Link>
                      <p className="text-sm text-neutral-700 font-medium mt-1.5">{rec.productName}</p>
                      <p className="text-xs text-neutral-500 font-mono">{rec.sku} · {rec.cantidad} uds.</p>
                    </div>
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${est.cls}`}>
                      {est.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${cat.cls}`}>
                      {cat.short}
                    </span>
                    {tagInfo && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                        tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700"  :
                        tagInfo.color === "orange" ? "bg-orange-50 text-orange-700" :
                        tagInfo.color === "purple" ? "bg-purple-50 text-purple-700" :
                                                     "bg-red-50 text-red-700"
                      }`}>{tagInfo.label}</span>
                    )}
                    <span className={`text-xs tabular-nums font-medium ${
                      alert48 ? "text-amber-600" : alert7d ? "text-red-600" : "text-neutral-500"
                    }`}>
                      {days}d
                      {(alert48 || alert7d) && (
                        <AlertTriangle className={`w-3 h-3 ml-1 inline-block ${alert7d ? "text-red-500" : "text-amber-500"}`} />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{rec.seller} · {rec.sucursal}</span>
                    {rec.resolucion && <span className="font-medium text-neutral-700">{resolucionLabel(rec.resolucion, rec)}</span>}
                  </div>
                  <div>
                    {rec.estado === "pendiente" && (
                      <button onClick={() => updateRecord(rec.id, { estado: "en_gestion" })}
                        className="w-full text-xs font-semibold px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300">
                        Iniciar gestión
                      </button>
                    )}
                    {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                      <button onClick={() => updateRecord(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                        className="w-full text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg transition-colors duration-100">
                        Re-etiquetado OK
                      </button>
                    )}
                    {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                      <button onClick={() => updateRecord(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                        className="w-full text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg transition-colors duration-100">
                        Confirmar retiro
                      </button>
                    )}
                    {rec.estado === "en_gestion" && rec.categoria === "decision_seller" && (
                      <button onClick={() => openCatC(rec)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300">
                        Registrar decisión
                      </button>
                    )}
                    {rec.estado === "resuelto" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                        <Check className="w-3 h-3" /> Resuelto
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile pagination */}
          <div className="flex items-center justify-between pb-8">
            <span className="text-xs text-neutral-600 tabular-nums">
              {fromRow}–{toRow} de {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
                className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={clampedPage >= totalPages}
                className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
