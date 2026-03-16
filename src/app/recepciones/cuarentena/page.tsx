"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { ChevronRight, ChevronDown, ChevronUp, Check, X, Search, SlidersHorizontal } from "lucide-react";
import { AlertTriangle, Clock } from "@untitled-ui/icons-react";
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CuarentenaPage() {
  const [records, setRecords] = useState<QuarantineRecord[]>([]);

  // Filters
  const [filterCat,     setFilterCat]     = useState<QuarantineCategory | "all">("all");
  const [filterEstado,  setFilterEstado]  = useState<QuarantineStatus | "all">("all");
  const [filterSeller,  setFilterSeller]  = useState("");
  const [filterSucursal, setFilterSucursal] = useState("");
  const [searchTerm,    setSearchTerm]    = useState("");
  const [showFilters,   setShowFilters]   = useState(false);
  const activeFilterCount = [filterCat !== "all", filterEstado !== "all", filterSeller !== "", filterSucursal !== ""].filter(Boolean).length;

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

  // Filtered list
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterCat    !== "all" && r.categoria !== filterCat)    return false;
      if (filterEstado !== "all" && r.estado    !== filterEstado) return false;
      if (filterSeller  && r.seller   !== filterSeller)          return false;
      if (filterSucursal && r.sucursal !== filterSucursal)       return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!r.sku.toLowerCase().includes(q) &&
            !r.productName.toLowerCase().includes(q) &&
            !r.orId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, filterCat, filterEstado, filterSeller, filterSucursal, searchTerm]);

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
    <div className="min-h-screen bg-neutral-50">

      {/* ── Cat C Modal ── */}
      {catCModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h1 className="text-[1.2rem] sm:text-lg font-bold text-neutral-900">Registrar decisión del seller</h1>
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
      <div className="bg-white border-b border-neutral-100">
        <nav className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-700 font-medium">Stock en cuarentena</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Title ── */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Stock en cuarentena</h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Gestión transversal de unidades con incidencia pendientes de resolución
          </p>
        </div>

        {/* ── Summary chips ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium border border-neutral-200">
            {totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
            {totalEnGestion} en gestión
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
            {totalResueltos} resuelto{totalResueltos !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-neutral-600 ml-auto tabular-nums">
            {records.length} registros totales
          </span>
        </div>

        {/* ── Alerts ── */}
        {alertaPendiente48h.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
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
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Clock className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {alertaGestion7d.length} registro{alertaGestion7d.length !== 1 ? "s" : ""} con más de 7 días en gestión
              </p>
              <p className="text-xs text-red-600 mt-0.5">Alerta Supervisor — resolución excede SLA</p>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          {/* Search + mobile filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
              <input
                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar SKU, producto u OR..."
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors flex-shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">{activeFilterCount}</span>
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Dropdowns: always visible on desktop, collapsible on mobile */}
          <div className={`flex items-center gap-3 flex-wrap mt-3 ${showFilters ? "flex" : "hidden sm:flex"}`}>
            {/* Categoría */}
            <div className="relative w-full sm:w-auto">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value as QuarantineCategory | "all")}
                className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white text-neutral-700">
                <option value="all">Todas las categorías</option>
                <option value="interna">Resolución interna Amplifica</option>
                <option value="devolucion_seller">Devolución obligatoria a seller</option>
                <option value="decision_seller">Decisión del seller</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            </div>

            {/* Estado */}
            <div className="relative w-full sm:w-auto">
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as QuarantineStatus | "all")}
                className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white text-neutral-700">
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_gestion">En gestión</option>
                <option value="resuelto">Resuelto</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            </div>

            {/* Seller */}
            <div className="relative w-full sm:w-auto">
              <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)}
                className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white text-neutral-700">
                <option value="">Todos los sellers</option>
                {sellers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            </div>

            {/* Sucursal */}
            <div className="relative w-full sm:w-auto">
              <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)}
                className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white text-neutral-700">
                <option value="">Todas las sucursales</option>
                {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100">
                  {["OR", "SKU", "Producto / Tag", "Cant.", "Seller", "Sucursal", "Categoría", "Estado", "Antigüedad", "Resolución", "Acciones"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-neutral-600">
                      No se encontraron registros con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filtered.map(rec => {
                    const cat     = catBadge(rec.categoria);
                    const est     = estadoBadge(rec.estado);
                    const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
                    const days    = daysSince(rec.creadoEn);
                    const alert48 = rec.estado === "pendiente"  && days > 2;
                    const alert7d = rec.estado === "en_gestion" && days > 7;

                    return (
                      <tr key={rec.id} className={`transition-colors duration-300 ${
                        alert48 ? "bg-amber-50/40" :
                        alert7d ? "bg-red-50/40"   : "hover:bg-neutral-50/40"
                      }`}>
                        <td className="px-3 py-3 align-top">
                          <Link href={`/recepciones/${rec.orId}`} className="text-xs font-sans text-primary-500 hover:underline">
                            {rec.orId}
                          </Link>
                        </td>
                        <td className="px-3 py-3 font-sans text-xs text-neutral-500 whitespace-nowrap align-top">{rec.sku}</td>
                        <td className="px-3 py-3 align-top max-w-[160px]">
                          <p className="text-xs text-neutral-700 leading-snug">{rec.productName}</p>
                          {tagInfo && (
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1 ${
                              tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200"  :
                              tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200":
                              tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200":
                                                           "bg-red-50 text-red-700 border-red-200"
                            }`}>{tagInfo.label}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 tabular-nums font-semibold text-neutral-800 align-top">{rec.cantidad}</td>
                        <td className="px-3 py-3 text-xs text-neutral-600 align-top">{rec.seller}</td>
                        <td className="px-3 py-3 text-xs text-neutral-600 align-top">{rec.sucursal}</td>
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cat.cls}`}>
                            {cat.short}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${est.cls}`}>
                            {est.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`text-xs tabular-nums font-medium ${
                            alert48 ? "text-amber-600" : alert7d ? "text-red-600" : "text-neutral-500"
                          }`}>
                            {days}d
                          </span>
                          {(alert48 || alert7d) && (
                            <AlertTriangle className={`w-3 h-3 ml-1 inline-block ${alert7d ? "text-red-500" : "text-amber-500"}`} />
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-600 align-top">
                          {rec.resolucion
                            ? <span className="font-medium">{resolucionLabel(rec.resolucion, rec)}</span>
                            : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {rec.estado === "pendiente" && (
                            <button onClick={() => updateRecord(rec.id, { estado: "en_gestion" })}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap">
                              Iniciar gestión
                            </button>
                          )}
                          {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                            <button onClick={() => updateRecord(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                              className="text-xs font-medium px-2.5 py-1.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-300 whitespace-nowrap">
                              Re-etiquetado OK
                            </button>
                          )}
                          {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                            <button onClick={() => updateRecord(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                              className="text-xs font-medium px-2.5 py-1.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-300 whitespace-nowrap">
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
                            <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-500" /> Resuelto
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
        </div>

      </div>
    </div>
  );
}
