"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight, Trash2, Scan, ImageOff,
  Clock, User, PlayCircle, StopCircle,
  ChevronDown, ChevronUp, MoreHorizontal, Package,
  X, Check, Upload,
} from "lucide-react";
import {
  Plus, ClipboardCheck, LockUnlocked01, AlertTriangle,
} from "@untitled-ui/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductConteo = {
  id: string;
  sku: string;
  nombre: string;
  barcode: string;
  imagen?: string;
  esperadas: number;
  contadasSesion: number;
};

type SesionItem = {
  pid: string;
  sku: string;
  nombre: string;
  cantidad: number;
};

type Sesion = {
  id: string;
  operador: string;
  inicio: string;
  fin: string;
  items: SesionItem[];
};

type OrdenData = {
  id: string;
  seller: string;
  sucursal: string;
  fechaAgendada: string;
  products: ProductConteo[];
};

type IncidenciaTagKey =
  | "sin-codigo-barra" | "codigo-incorrecto" | "codigo-ilegible"
  | "sin-nutricional"  | "sin-vencimiento"
  | "danio-parcial"    | "danio-total"
  | "no-en-sistema";

type IncidenciaRow = {
  rowId: string;
  skuId: string;
  tag: IncidenciaTagKey | "";
  cantidad: number;
  imagenes: File[];
  nota: string;
  descripcion: string;    // only for "no-en-sistema"
};

type NewProductForm = {
  nombre: string;
  sku: string;
  barcode: string;
  cantidad: string;
  imagen: File | null;
  comentarios: string;
  categoria: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDENES: Record<string, OrdenData> = {
  "RO-BARRA-180": {
    id: "RO-BARRA-180",
    seller: "Extra Life",
    sucursal: "Quilicura",
    fechaAgendada: "08/03/2026 16:30",
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight",  barcode: "8500942860946", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",      barcode: "8500942860625", esperadas: 150, contadasSesion: 0 },
    ],
  },
};

function getFallbackOrden(id: string): OrdenData {
  return {
    id, seller: "Extra Life", sucursal: "Quilicura", fechaAgendada: "—",
    products: [
      { id: "p1", sku: "SKU-001", nombre: "Producto de muestra A", barcode: "1234567890001", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "SKU-002", nombre: "Producto de muestra B", barcode: "1234567890002", esperadas: 100, contadasSesion: 0 },
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ProductStatus = "completo" | "diferencia" | "exceso" | "pendiente";

function getProductStatus(total: number, esperadas: number): ProductStatus {
  if (total === 0 && esperadas > 0) return "pendiente";
  if (esperadas === 0 && total > 0)  return "exceso";
  if (total === esperadas)            return "completo";
  return "diferencia";
}

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function sesionId(n: number) { return `SES-${String(n).padStart(3, "0")}`; }

// ─── Incidencia tags ──────────────────────────────────────────────────────────
const INCIDENCIA_TAGS: {
  key: IncidenciaTagKey;
  label: string;
  color: "amber" | "red" | "orange" | "purple";
  resuelve: string;
}[] = [
  { key: "sin-codigo-barra",  label: "Sin código de barra",        color: "amber",  resuelve: "Amplifica — re-etiquetado" },
  { key: "codigo-incorrecto", label: "Código de barra incorrecto", color: "amber",  resuelve: "Amplifica — re-etiquetado" },
  { key: "codigo-ilegible",   label: "Código de barra ilegible",   color: "amber",  resuelve: "Amplifica — re-etiquetado" },
  { key: "sin-nutricional",   label: "Sin etiqueta nutricional",   color: "red",    resuelve: "Seller — devolución obligatoria" },
  { key: "sin-vencimiento",   label: "Sin fecha de vencimiento",   color: "red",    resuelve: "Seller — devolución obligatoria" },
  { key: "danio-parcial",     label: "Daño parcial",               color: "orange", resuelve: "Seller decide (KAM consulta)" },
  { key: "danio-total",       label: "Daño total",                 color: "red",    resuelve: "Seller decide (KAM consulta)" },
  { key: "no-en-sistema",     label: "No creado en sistema",       color: "purple", resuelve: "Amplifica — creación de SKU" },
];

// ─── Categorizar button (per-SKU, opens IncidenciasSKUModal) ─────────────────
function CategorizarBtn({ incidencias, onOpen, disabled }: {
  incidencias: IncidenciaRow[];
  onOpen: () => void;
  disabled?: boolean;
}) {
  const count = incidencias.length;
  return (
    <button
      onClick={disabled ? undefined : onOpen}
      disabled={disabled}
      title={disabled ? "Inicia una sesión de conteo para registrar incidencias" : undefined}
      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        disabled
          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
          : count > 0
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {count > 0 && !disabled && (
        <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {count}
        </span>
      )}
      Categorizar
    </button>
  );
}

// ─── Confirm Remove Modal ─────────────────────────────────────────────────────
function ConfirmRemoveModal({ nombre, onCancel, onConfirm }: {
  nombre: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Eliminar producto</p>
            <p className="text-xs text-gray-500">Esta acción no puede deshacerse.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          ¿Confirmas que deseas eliminar{" "}
          <span className="font-semibold text-gray-800">{nombre}</span>{" "}
          de esta orden?
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Close Modal ──────────────────────────────────────────────────────
type OrOutcome = "Completado sin diferencias" | "Completado con diferencias";

function ConfirmCloseModal({ id, sesiones, totalContadas, totalEsperadas, onCancel, onConfirm }: {
  id: string; sesiones: Sesion[]; totalContadas: number; totalEsperadas: number;
  onCancel: () => void; onConfirm: (outcome: OrOutcome) => void;
}) {
  const diff    = totalEsperadas - totalContadas;
  const outcome: OrOutcome = diff === 0 ? "Completado sin diferencias" : "Completado con diferencias";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <ClipboardCheck className="w-7 h-7 text-green-600" />
        </div>

        {/* Title + subtitle */}
        <h3 className="text-lg font-bold text-gray-900 mb-1">Terminar recepción</h3>
        <p className="text-sm text-gray-500 mb-5">Esta acción es definitiva y no puede deshacerse</p>

        {/* Body */}
        <p className="text-sm text-gray-700 mb-7 leading-relaxed">
          ¿Confirmas el cierre de la orden{" "}
          <span className="font-bold text-gray-900">{id}</span>?{" "}
          Se registrarán{" "}
          <span className="font-bold text-gray-900">
            {totalContadas.toLocaleString("es-CL")} Unidades
          </span>{" "}
          en{" "}
          <span className="font-bold text-gray-900">
            {sesiones.length} Sesión{sesiones.length !== 1 ? "es" : ""}
          </span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirm(outcome)}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Sí, terminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product, acumulado, sesionActiva, onChange, onRemove, incidencias, onCategorizar }: {
  product: ProductConteo;
  acumulado: number;
  sesionActiva: boolean;
  onChange: (id: string, val: number) => void;
  onRemove: (id: string) => void;
  incidencias: IncidenciaRow[];
  onCategorizar: () => void;
}) {
  const incidenciasTotal = incidencias.reduce((s, r) => s + r.cantidad, 0);
  const total  = acumulado + product.contadasSesion + incidenciasTotal;
  const status = getProductStatus(total, product.esperadas);
  const pct    = product.esperadas > 0 ? Math.min(100, (total / product.esperadas) * 100) : 0;

  const barColor =
    status === "completo"   ? "bg-green-500" :
    status === "diferencia" ? "bg-amber-400" :
    status === "exceso"     ? "bg-red-400"   : "bg-gray-200";

  // Display: editing active session counts; or accumulated total when idle
  const displayVal = sesionActiva ? product.contadasSesion : total;

  return (
    <div className="p-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-4">

        {/* Image */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {product.imagen
            ? <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
            : <ImageOff className="w-7 h-7 text-gray-300" />}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">

          {/* Name + trash */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{product.nombre}</p>
            <button
              onClick={() => onRemove(product.id)}
              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* SKU + barcode */}
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="font-semibold text-gray-500">SKU:</span> {product.sku}
            <span className="mx-2 text-gray-200">|</span>
            <span className="font-semibold text-gray-500">C. DE BARRA:</span> {product.barcode}
          </p>

          {/* Counter row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              onClick={() => sesionActiva && onChange(product.id, Math.max(0, product.contadasSesion - 1))}
              disabled={!sesionActiva}
              className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold text-lg transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >−</button>

            <input
              type="number" min={0}
              value={displayVal}
              readOnly={!sesionActiva}
              onChange={e => sesionActiva && onChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-16 border border-gray-200 rounded-lg text-center text-sm font-semibold py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums transition-colors
                ${sesionActiva ? "text-gray-800 bg-white" : "text-gray-600 bg-gray-50 cursor-default"}`}
            />

            <button
              onClick={() => sesionActiva && onChange(product.id, product.contadasSesion + 1)}
              disabled={!sesionActiva}
              className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold text-lg transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >+</button>

            {/* Esperadas */}
            <span className="flex items-center gap-1.5 text-sm text-gray-500 ml-1">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="tabular-nums font-medium text-gray-700">
                {total.toLocaleString("es-CL")}/{product.esperadas.toLocaleString("es-CL")}
              </span>
              <span className="text-gray-400">esperadas</span>
            </span>

            {/* Categorizar */}
            <div className="ml-auto">
              <CategorizarBtn incidencias={incidencias} onOpen={onCategorizar} disabled={!sesionActiva} />
            </div>
          </div>

          {/* Progress bar */}
          {product.esperadas > 0 && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Session history row ──────────────────────────────────────────────────────
function SesionRow({ sesion, incidencias, products, acumulado }: {
  sesion: Sesion;
  incidencias: Record<string, IncidenciaRow[]>;
  products: ProductConteo[];
  acumulado: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  // Total uds = session counted + incidencias for this session's SKUs
  const totalUds = sesion.items.reduce((s, i) => {
    const incTotal = (incidencias[i.pid] ?? []).reduce((rs, r) => rs + r.cantidad, 0);
    return s + i.cantidad + incTotal;
  }, 0);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
        <span className="text-sm font-bold text-indigo-600 w-20 flex-shrink-0">{sesion.id}</span>
        <span className="flex items-center gap-1.5 text-sm text-gray-600 flex-shrink-0">
          <User className="w-3.5 h-3.5 text-gray-400" />
          {sesion.operador}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-400 flex-1 min-w-0 truncate">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          {fmtDT(sesion.inicio)}
          <span className="text-gray-300 mx-0.5">→</span>
          {fmtDT(sesion.fin)}
        </span>
        <span className="text-sm text-gray-500 flex-shrink-0">
          {sesion.items.length} SKU{sesion.items.length !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-bold text-gray-800 tabular-nums w-14 text-right flex-shrink-0">
          {totalUds.toLocaleString("es-CL")} uds
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
               : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && sesion.items.length > 0 && (
        <div className="px-4 pb-3 bg-gray-50/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-semibold">SKU</th>
                <th className="text-left py-2 font-semibold">Producto</th>
                <th className="text-left py-2 font-semibold">Incidencias</th>
                <th className="text-left py-2 font-semibold">Estado</th>
                <th className="text-right py-2 font-semibold">Contadas</th>
              </tr>
            </thead>
            <tbody>
              {sesion.items.map(item => {
                const rows      = incidencias[item.pid] ?? [];
                const incTotal  = rows.reduce((s, r) => s + r.cantidad, 0);
                const esperadas = products.find(p => p.id === item.pid)?.esperadas ?? 0;
                // Overall status: total across ALL sessions + incidencias vs expected
                const overallTotal = (acumulado[item.pid] ?? 0) + incTotal;
                const status = getProductStatus(overallTotal, esperadas);
                return (
                  <tr key={item.pid} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 font-mono text-gray-500 text-xs align-top">{item.sku}</td>
                    <td className="py-2 text-gray-700 align-top">{item.nombre}</td>
                    <td className="py-2 align-top">
                      {rows.length === 0 ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {rows.map(r => {
                            const tag = INCIDENCIA_TAGS.find(t => t.key === r.tag);
                            if (!tag) return null;
                            return (
                              <span key={r.rowId} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                tag.color === "amber"  ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                tag.color === "orange" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                                tag.color === "purple" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                                         "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {tag.label}
                                <span className="opacity-60 font-normal">· {r.cantidad} uds</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-2 align-top">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        status === "completo"   ? "bg-green-50  text-green-700  border-green-200"  :
                        status === "diferencia" ? "bg-amber-50  text-amber-700  border-amber-200"  :
                        status === "exceso"     ? "bg-red-50    text-red-600    border-red-200"    :
                                                  "bg-gray-100  text-gray-500   border-gray-200"
                      }`}>
                        {status === "completo"   ? "Completo"          :
                         status === "diferencia" ? "Con diferencias"   :
                         status === "exceso"     ? "Exceso"            : "Pendiente"}
                        <span className="ml-1 font-normal opacity-70 tabular-nums">
                          {overallTotal}/{esperadas}
                        </span>
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-800 tabular-nums align-top">
                      {(item.cantidad + incTotal).toLocaleString("es-CL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── IncidenciaRowCard ────────────────────────────────────────────────────────
function IncidenciaRowCard({ row, index, product, onUpdate, onRemove, onAddImages, onRemoveImage }: {
  row: IncidenciaRow;
  index: number;
  product: ProductConteo;
  onUpdate: (rowId: string, update: Partial<IncidenciaRow>) => void;
  onRemove: (rowId: string) => void;
  onAddImages: (rowId: string, files: FileList) => void;
  onRemoveImage: (rowId: string, idx: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const tag = INCIDENCIA_TAGS.find(t => t.key === row.tag);

  return (
    <div className="px-4 py-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Incidencia #{index + 1}</span>
        <button onClick={() => onRemove(row.rowId)} className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tag + Cantidad */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 font-medium mb-1.5">Tipo de incidencia *</label>
          <div className="relative">
            <select
              value={row.tag}
              onChange={e => onUpdate(row.rowId, { tag: e.target.value as IncidenciaTagKey | "" })}
              className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8"
            >
              <option value="">Seleccione</option>
              {INCIDENCIA_TAGS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 font-medium mb-1.5">Cantidad afectada *</label>
          <input
            type="number" min={1} max={product.esperadas}
            value={row.cantidad}
            onChange={e => onUpdate(row.rowId, { cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Description — only for "no-en-sistema" */}
      {row.tag === "no-en-sistema" && (
        <div>
          <label className="block text-xs text-gray-400 font-medium mb-1.5">Descripción del producto *</label>
          <textarea
            value={row.descripcion}
            onChange={e => onUpdate(row.rowId, { descripcion: e.target.value })}
            placeholder="Nombre, código visible, descripción del producto no identificado..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder-gray-300"
          />
        </div>
      )}

      {/* Image upload */}
      <div>
        <label className="block text-xs text-gray-400 font-medium mb-1.5">
          Imágenes * <span className="text-gray-300 font-normal">({row.imagenes.length}/5 · JPG o PNG · 5 MB máx)</span>
        </label>
        <input
          ref={fileRef} type="file" className="hidden"
          accept="image/jpeg,image/png" multiple
          onChange={e => e.target.files && onAddImages(row.rowId, e.target.files)}
        />
        {row.imagenes.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {row.imagenes.map((img, i) => (
              <div key={i} className="relative w-16 h-16 flex-shrink-0">
                <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                <button
                  onClick={() => onRemoveImage(row.rowId, i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {row.imagenes.length < 5 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {row.imagenes.length === 0 ? "Subir imagen" : "Agregar más"}
          </button>
        )}
        {row.imagenes.length === 0 && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Requerida al menos 1 imagen
          </p>
        )}
      </div>

      {/* Nota */}
      <div>
        <label className="block text-xs text-gray-400 font-medium mb-1.5">Nota adicional <span className="font-normal">(opcional)</span></label>
        <textarea
          value={row.nota}
          onChange={e => onUpdate(row.rowId, { nota: e.target.value })}
          placeholder="Observaciones adicionales..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder-gray-300"
        />
      </div>

      {/* Tag resolution badge */}
      {tag && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
          tag.color === "amber"  ? "bg-amber-50 text-amber-700 border border-amber-200" :
          tag.color === "orange" ? "bg-orange-50 text-orange-700 border border-orange-200" :
          tag.color === "purple" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                   "bg-red-50 text-red-700 border border-red-200"
        }`}>
          Resuelve: <span className="font-semibold">{tag.resuelve}</span>
        </div>
      )}
    </div>
  );
}

// ─── IncidenciasSKUModal — per-SKU incidencias form ───────────────────────────
function IncidenciasSKUModal({ product, initialRows, onClose, onSave, onLiveUpdate }: {
  product: ProductConteo;
  initialRows: IncidenciaRow[];
  onClose: () => void;
  onSave: (rows: IncidenciaRow[]) => void;
  onLiveUpdate?: (rows: IncidenciaRow[]) => void;
}) {
  const [rows, setRows] = useState<IncidenciaRow[]>(initialRows);

  // Propagate live changes to parent so progress bars update in real-time
  useEffect(() => {
    onLiveUpdate?.(rows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const addRow = () =>
    setRows(prev => [...prev, {
      rowId: Math.random().toString(36).slice(2),
      skuId: product.id,
      tag: "", cantidad: 1, imagenes: [], nota: "", descripcion: "",
    }]);

  const updateRow = (rowId: string, update: Partial<IncidenciaRow>) =>
    setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, ...update } : r));

  const removeRow = (rowId: string) =>
    setRows(prev => prev.filter(r => r.rowId !== rowId));

  const addImages = (rowId: string, files: FileList) => {
    const row = rows.find(r => r.rowId === rowId);
    if (!row) return;
    const toAdd = Array.from(files)
      .slice(0, 5 - row.imagenes.length)
      .filter(f => (f.type === "image/jpeg" || f.type === "image/png") && f.size <= 5 * 1024 * 1024);
    updateRow(rowId, { imagenes: [...row.imagenes, ...toAdd] });
  };

  const removeImage = (rowId: string, idx: number) => {
    const row = rows.find(r => r.rowId === rowId);
    if (!row) return;
    updateRow(rowId, { imagenes: row.imagenes.filter((_, i) => i !== idx) });
  };

  const saveEnabled = rows.length === 0 || rows.every(r =>
    r.tag !== "" && r.cantidad >= 1 && r.imagenes.length >= 1 &&
    (r.tag !== "no-en-sistema" || r.descripcion.trim() !== "")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {product.imagen
              ? <img src={product.imagen} alt="" className="w-full h-full object-cover rounded-lg" />
              : <ImageOff className="w-5 h-5 text-gray-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{product.nombre}</p>
            <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku} · {product.esperadas} uds declaradas</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Sin incidencias registradas</p>
                <p className="text-xs text-gray-400 mt-0.5">Agrega una incidencia si este SKU presenta algún problema.</p>
              </div>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar incidencia
              </button>
            </div>
          ) : (
            <div>
              {rows.map((row, idx) => (
                <IncidenciaRowCard
                  key={row.rowId}
                  row={row} index={idx} product={product}
                  onUpdate={updateRow} onRemove={removeRow}
                  onAddImages={addImages} onRemoveImage={removeImage}
                />
              ))}
              <div className="px-4 py-3 border-t border-dashed border-gray-200">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors px-2 py-1.5 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar otra incidencia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => saveEnabled && onSave(rows)}
            disabled={!saveEnabled}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              saveEnabled ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── AddProductModal ──────────────────────────────────────────────────────────
const CATEGORIAS = ["Sin diferencias", "Con diferencias", "No pickeable", "Exceso"];

function AddProductModal({ onCancel, onConfirm }: {
  onCancel: () => void;
  onConfirm: (product: ProductConteo) => void;
}) {
  const [form, setForm] = useState<NewProductForm>({
    nombre: "", sku: "", barcode: "", cantidad: "1",
    imagen: null, comentarios: "", categoria: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const canConfirm = form.nombre.trim() !== "" && (parseInt(form.cantidad) || 0) >= 1;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      id: `custom-${Date.now()}`,
      sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      nombre: form.nombre.trim(),
      barcode: form.barcode.trim() || `${Date.now()}`,
      imagen: form.imagen ? URL.createObjectURL(form.imagen) : undefined,
      esperadas: parseInt(form.cantidad) || 1,
      contadasSesion: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">Añadir producto</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre del producto *</label>
            <input
              type="text" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Tropical Delight 20 Sachets"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
              autoFocus
            />
          </div>

          {/* SKU + Código de barras */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">SKU <span className="text-gray-300 font-normal">(opcional)</span></label>
              <input
                type="text" value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="300034"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Código de barras <span className="text-gray-300 font-normal">(opcional)</span></label>
              <input
                type="text" value={form.barcode}
                onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                placeholder="8500942860946"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Cantidad + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Cantidad *</label>
              <input
                type="number" min={1} value={form.cantidad}
                onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Categoría <span className="text-gray-300 font-normal">(opcional)</span></label>
              <div className="relative">
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white pr-9"
                >
                  <option value="">Sin categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Foto */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Foto <span className="text-gray-300 font-normal">(opcional · JPG o PNG · 5 MB máx)</span></label>
            <input
              ref={fileRef} type="file" className="hidden"
              accept="image/jpeg,image/png" capture="environment"
              onChange={e => e.target.files?.[0] && setForm(f => ({ ...f, imagen: e.target.files![0] }))}
            />
            {form.imagen ? (
              <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl p-3">
                <img src={URL.createObjectURL(form.imagen)} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{form.imagen.name}</p>
                  <p className="text-xs text-gray-400">{(form.imagen.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, imagen: null }))} className="text-gray-400 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir o tomar foto
              </button>
            )}
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Comentarios <span className="text-gray-300 font-normal">(opcional)</span></label>
            <textarea
              value={form.comentarios}
              onChange={e => setForm(f => ({ ...f, comentarios: e.target.value }))}
              placeholder="Observaciones sobre el producto..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder-gray-300"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onCancel} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleConfirm} disabled={!canConfirm}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              canConfirm ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" />
            Añadir producto
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConteoORPage() {
  const params   = useParams();
  const router   = useRouter();
  const rawId    = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const id       = decodeURIComponent(rawId);
  const baseData = MOCK_ORDENES[id] ?? getFallbackOrden(id);

  // ── State ──────────────────────────────────────────────────────────────────
  const [products,      setProducts]      = useState<ProductConteo[]>(baseData.products);
  const [sesiones,      setSesiones]      = useState<Sesion[]>([]);
  const [sesionActiva,  setSesionActiva]  = useState(false);
  const [sesionInicio,  setSesionInicio]  = useState("");
  const [scanner,       setScanner]       = useState("");
  const [confirmClose,   setConfirmClose]   = useState(false);
  const [pendingRemove,  setPendingRemove]  = useState<string | null>(null);
  const [showDotsMenu,   setShowDotsMenu]   = useState(false);
  const [orEstado,       setOrEstado]       = useState<OrOutcome | null>(null);
  const [incidencias,      setIncidencias]      = useState<Record<string, IncidenciaRow[]>>({});
  const [incidenciaTarget, setIncidenciaTarget] = useState<string | null>(null);
  // Snapshot of incidencias[target] at the moment the modal opens (to revert on cancel)
  const incidenciaSnapshotRef = useRef<IncidenciaRow[]>([]);
  const [showAddProduct,   setShowAddProduct]   = useState(false);

  // Capture snapshot of incidencias for a SKU when the modal opens (to revert on cancel)
  useEffect(() => {
    if (incidenciaTarget !== null) {
      incidenciaSnapshotRef.current = incidencias[incidenciaTarget] ?? [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidenciaTarget]); // intentionally only re-run when target changes, not incidencias

  // Restore closed state from localStorage (e.g. after back-navigation)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`amplifica_or_${id}`);
      if (stored) {
        const { estado } = JSON.parse(stored) as { estado: OrOutcome };
        if (estado === "Completado sin diferencias" || estado === "Completado con diferencias") {
          setOrEstado(estado);
        }
      }
    } catch { /* ignore */ }
  }, [id]);

  const dotsRef = useRef<HTMLDivElement>(null);
  const OPERADOR = "Fernando Roblero";

  // Close dots menu on outside click
  useEffect(() => {
    function oc(e: MouseEvent) {
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) setShowDotsMenu(false);
    }
    document.addEventListener("mousedown", oc);
    return () => document.removeEventListener("mousedown", oc);
  }, []);

  // ── Accumulated from closed sessions ─────────────────────────────────────
  const acumulado = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const ses of sesiones)
      for (const item of ses.items)
        map[item.pid] = (map[item.pid] ?? 0) + item.cantidad;
    return map;
  }, [sesiones]);

  const totalPP = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of products)
      map[p.id] = (acumulado[p.id] ?? 0) + p.contadasSesion;
    return map;
  }, [products, acumulado]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalEsperadas   = products.reduce((s, p) => s + p.esperadas, 0);
    const totalAcum        = Object.values(acumulado).reduce((s, v) => s + v, 0);
    const totalSesionAct   = products.reduce((s, p) => s + p.contadasSesion, 0);
    const totalIncidencias = Object.values(incidencias).reduce(
      (s, rows) => s + rows.reduce((rs, r) => rs + r.cantidad, 0), 0
    );
    const totalContadas  = totalAcum + totalSesionAct + totalIncidencias;
    const pct            = totalEsperadas > 0 ? Math.round((totalContadas / totalEsperadas) * 100) : 0;
    const sinDiferencias = products.filter(p => getProductStatus(totalPP[p.id] ?? 0, p.esperadas) === "completo").length;
    const conDiferencias = products.filter(p => {
      const s = getProductStatus(totalPP[p.id] ?? 0, p.esperadas);
      return s === "diferencia" || s === "exceso";
    }).length;
    const pendientes = products.filter(p => getProductStatus(totalPP[p.id] ?? 0, p.esperadas) === "pendiente").length;
    return { totalEsperadas, totalContadas, totalSesionAct, pct, sinDiferencias, conDiferencias, pendientes };
  }, [products, acumulado, totalPP, incidencias]);

  // ── Incidencias breakdown by tag (for progress bar chips) ───────────────
  const incidenciasPorTag = useMemo(() => {
    const map: Partial<Record<IncidenciaTagKey, number>> = {};
    for (const rows of Object.values(incidencias)) {
      for (const row of rows) {
        if (row.tag) map[row.tag] = (map[row.tag] ?? 0) + row.cantidad;
      }
    }
    return map;
  }, [incidencias]);

  // ── Session actions ──────────────────────────────────────────────────────
  const iniciarSesion = () => {
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
    setSesionInicio(new Date().toISOString());
    setSesionActiva(true);
  };

  const finalizarSesion = () => {
    if (!sesionActiva) return;
    const fin   = new Date().toISOString();
    const items = products
      .filter(p => p.contadasSesion > 0)
      .map(p => ({ pid: p.id, sku: p.sku, nombre: p.nombre, cantidad: p.contadasSesion }));
    setSesiones(prev => [
      ...prev,
      { id: sesionId(prev.length + 1), operador: OPERADOR, inicio: sesionInicio, fin, items },
    ]);
    setSesionActiva(false);
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
    // Reflect "En proceso de conteo" in the recepciones list (≥1 session completed)
    try {
      localStorage.setItem(`amplifica_or_${id}`, JSON.stringify({ estado: "En proceso de conteo" }));
    } catch { /* ignore */ }
  };

  // Liberar: discard current session without saving
  const liberarSesion = () => {
    setSesionActiva(false);
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
  };

  const updateContadas = (pid: string, val: number) =>
    setProducts(ps => ps.map(p => p.id === pid ? { ...p, contadasSesion: val } : p));

  const removeProduct = (pid: string) => {
    setProducts(ps => ps.filter(p => p.id !== pid));
    setPendingRemove(null);
  };

  const handleScan = () => {
    const code = scanner.trim();
    if (!code || !sesionActiva) return;
    const match = products.find(p => p.barcode === code || p.sku === code);
    if (match) { updateContadas(match.id, match.contadasSesion + 1); setScanner(""); }
  };

  const sesionNumActual  = sesiones.length + 1;
  const totalAcumUds     = sesiones.reduce((s, ses) => s + ses.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const pendingProduct   = products.find(p => p.id === pendingRemove);

  // Terminar recepción button styles
  const orCerrada        = orEstado !== null;
  const terminarDisabled = sesionActiva || orCerrada || sesiones.length === 0;
  const terminarClass = terminarDisabled
    ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
    : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Modals ── */}
      {incidenciaTarget !== null && (() => {
        const prod = products.find(p => p.id === incidenciaTarget);
        return prod ? (
          <IncidenciasSKUModal
            product={prod}
            initialRows={incidenciaSnapshotRef.current}
            onClose={() => {
              // Revert live changes on cancel
              setIncidencias(prev => ({
                ...prev,
                [incidenciaTarget]: incidenciaSnapshotRef.current,
              }));
              setIncidenciaTarget(null);
            }}
            onSave={(rows) => {
              setIncidencias(prev => ({ ...prev, [incidenciaTarget]: rows }));
              setIncidenciaTarget(null);
            }}
            onLiveUpdate={(rows) => {
              setIncidencias(prev => ({ ...prev, [incidenciaTarget]: rows }));
            }}
          />
        ) : null;
      })()}

      {showAddProduct && (
        <AddProductModal
          onCancel={() => setShowAddProduct(false)}
          onConfirm={(product) => { setProducts(ps => [...ps, product]); setShowAddProduct(false); }}
        />
      )}

      {confirmClose && (
        <ConfirmCloseModal
          id={id} sesiones={sesiones}
          totalContadas={stats.totalContadas}
          totalEsperadas={stats.totalEsperadas}
          onCancel={() => setConfirmClose(false)}
          onConfirm={(outcome) => {
            setOrEstado(outcome);
            try {
              localStorage.setItem(`amplifica_or_${id}`, JSON.stringify({ estado: outcome }));
              localStorage.setItem("amplifica_pending_toast", JSON.stringify({
                title: outcome === "Completado sin diferencias"
                  ? "Recepción completada sin diferencias"
                  : "Recepción completada con diferencias",
                subtitle: `${id} fue cerrada correctamente`,
              }));
            } catch { /* ignore */ }
            setConfirmClose(false);
            router.push("/recepciones");
          }}
        />
      )}

      {pendingProduct && (
        <ConfirmRemoveModal
          nombre={pendingProduct.nombre}
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => removeProduct(pendingProduct.id)}
        />
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <nav className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/recepciones" className="hover:text-indigo-600 transition-colors">Recepciones</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-700 font-medium">Orden de Recepción</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* ── Title row ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Orden de Recepción{" "}
              <span className="font-mono text-gray-900">#{id}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {baseData.sucursal} - {baseData.fechaAgendada}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">

            {/* ── Session control button: Iniciar (indigo) or Finalizar (outline) ── */}
            {!orCerrada && (
              sesionActiva ? (
                <button
                  onClick={finalizarSesion}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <StopCircle className="w-4 h-4 text-gray-500" />
                  Finalizar sesión
                </button>
              ) : (
                <button
                  onClick={iniciarSesion}
                  className="flex items-center gap-2.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4" />
                  Iniciar sesión de conteo
                </button>
              )
            )}
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[
              { label: "Seller",              value: baseData.seller },
              { label: "SKUs",                value: String(products.length) },
              { label: "Unidades declaradas", value: stats.totalEsperadas.toLocaleString("es-CL") },
              { label: "Sesiones",            value: String(sesiones.length + (sesionActiva ? 1 : 0)) },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-4">
                <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                <p className="text-base font-bold text-gray-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active session banner ── */}
        {sesionActiva && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-bold text-indigo-700">{sesionId(sesionNumActual)}</span>
              <span className="text-indigo-400 ml-2 text-xs">
                Iniciada {fmtDT(sesionInicio)}
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-600 tabular-nums flex-shrink-0">
              {stats.totalSesionAct.toLocaleString("es-CL")} uds esta sesión
            </span>
          </div>
        )}

        {/* ── Scanner (active session only) ── */}
        {sesionActiva && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-base font-semibold text-gray-800 mb-3">
              Escanear código de barras
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={scanner}
                  onChange={e => setScanner(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="Ingresa o escanea  SKU / Código de barras"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
                  autoFocus
                />
              </div>
              <button
                onClick={handleScan}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Registrar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Presiona{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono border border-gray-200">Enter</kbd>{" "}
              o haz clic en <span className="font-semibold text-gray-600">Registrar</span> para escanear una unidad.
            </p>
          </div>
        )}

        {/* ── Progreso de conteo ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-gray-800">Progreso de conteo</span>
            <span className="text-sm font-bold text-gray-700 tabular-nums">
              {stats.totalContadas.toLocaleString("es-CL")}/{stats.totalEsperadas.toLocaleString("es-CL")}
              <span className="ml-1 text-gray-500 font-normal">({stats.pct}%)</span>
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.pct === 100 ? "bg-green-500" :
                stats.conDiferencias > 0 ? "bg-amber-400" : "bg-indigo-500"
              }`}
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {stats.conDiferencias > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                {stats.conDiferencias} con diferencias
              </span>
            )}
            {stats.sinDiferencias > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">
                {stats.sinDiferencias.toLocaleString("es-CL")} sin diferencias
              </span>
            )}
            {stats.pendientes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full">
                {stats.pendientes} pendientes
              </span>
            )}
            {/* Incidencia category chips */}
            {(Object.entries(incidenciasPorTag) as [IncidenciaTagKey, number][]).map(([tagKey, total]) => {
              const tag = INCIDENCIA_TAGS.find(t => t.key === tagKey);
              if (!tag || total === 0) return null;
              return (
                <span key={tagKey} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  tag.color === "amber"  ? "bg-amber-50  text-amber-700  border-amber-200"  :
                  tag.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  tag.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                           "bg-red-50    text-red-700    border-red-200"
                }`}>
                  {tag.label}
                  <span className="opacity-60 font-normal tabular-nums ml-0.5">· {total} uds</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── OR closed result banner ── */}
        {orCerrada && (() => {
          const sinDif = orEstado === "Completado sin diferencias";
          return (
            <div className={`rounded-xl px-4 py-4 flex items-center gap-4 border ${
              sinDif ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                sinDif ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
              }`}>✓</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${sinDif ? "text-green-700" : "text-amber-700"}`}>
                  Recepción cerrada
                </p>
                <p className={`text-xs mt-0.5 ${sinDif ? "text-green-600" : "text-amber-600"}`}>
                  {sinDif
                    ? "Todas las unidades fueron contadas sin diferencias."
                    : "Se registraron diferencias entre lo declarado y lo contado."}
                </p>
              </div>
              <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                sinDif ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>
                {orEstado}
              </span>
            </div>
          );
        })()}

        {/* ── Products container ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Sin productos</p>
                <p className="text-xs text-gray-400 mt-0.5">Agrega los productos que llegaron en esta OR.</p>
              </div>
            </div>
          ) : (
            products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                acumulado={acumulado[p.id] ?? 0}
                sesionActiva={sesionActiva}
                onChange={updateContadas}
                onRemove={pid => setPendingRemove(pid)}
                incidencias={incidencias[p.id] ?? []}
                onCategorizar={() => setIncidenciaTarget(p.id)}
              />
            ))
          )}

          {/* Añadir producto */}
          <div className="border-t border-dashed border-gray-200">
            <button onClick={() => setShowAddProduct(true)} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-medium">
              <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                <Plus className="w-3 h-3" />
              </span>
              Añadir producto
            </button>
          </div>
        </div>

        {/* ── Session history ── */}
        {sesiones.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">Historial de sesiones</span>
              <span className="text-sm text-gray-400 tabular-nums">
                {totalAcumUds.toLocaleString("es-CL")} uds acumuladas
              </span>
            </div>
            {sesiones.map(ses => (
              <SesionRow
                key={ses.id}
                sesion={ses}
                incidencias={incidencias}
                products={products}
                acumulado={acumulado}
              />
            ))}
          </div>
        )}

        {/* ── Footer: Liberar + Terminar recepción (always visible when OR open) ── */}
        {!orCerrada && (
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              onClick={liberarSesion}
              disabled={!sesionActiva}
              className={`flex items-center gap-2 px-5 py-2.5 border text-sm font-medium rounded-lg transition-colors ${
                !sesionActiva
                  ? "border-gray-200 bg-white text-gray-300 cursor-not-allowed"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
              }`}
            >
              <LockUnlocked01 className="w-4 h-4" />
              Liberar
            </button>

            <button
              onClick={() => !terminarDisabled && setConfirmClose(true)}
              disabled={terminarDisabled}
              title={
                sesiones.length === 0 ? "Registra al menos una sesión antes de terminar" :
                sesionActiva ? "Finaliza la sesión activa antes de terminar" : undefined
              }
              className={`flex items-center gap-2 px-5 py-2.5 border text-sm font-medium rounded-lg transition-colors ${terminarClass}`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Terminar recepción
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
