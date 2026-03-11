"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight, Trash2, Scan, ScanBarcode, ImageOff,
  Clock, User, PlayCircle, StopCircle,
  ChevronDown, ChevronUp, MoreHorizontal, Package,
  X, Check, Upload, Search, HelpCircle,
} from "lucide-react";
import {
  Plus, ClipboardCheck, LockUnlocked01, AlertTriangle,
} from "@untitled-ui/icons-react";
import {
  QuarantineRecord, QuarantineStatus, QuarantineResolution, QuarantineCategory,
  QR_STORAGE_KEY, SEED_QUARANTINE, ORDENES_SEED,
} from "../_data";
import FormField from "@/components/ui/FormField";
import ProductsModal, { type AddProduct } from "@/components/recepciones/ProductsModal";
import QrDisplaySection from "@/components/recepciones/QrDisplaySection";
import Button from "@/components/ui/Button";

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
  "RO-BARRA-184": {
    id: "RO-BARRA-184",
    seller: "Extra Life",
    sucursal: "Quilicura",
    fechaAgendada: "19/02/2026 10:00",
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight",  barcode: "8500942860946", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",      barcode: "8500942860625", esperadas: 150, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-179": {
    id: "RO-BARRA-179",
    seller: "Gohard",
    sucursal: "La Reina",
    fechaAgendada: "18/02/2026 09:00",
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 80,  contadasSesion: 0 },
      { id: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",   barcode: "7891234560002", esperadas: 60,  contadasSesion: 0 },
    ],
  },
  "RO-BARRA-185": {
    id: "RO-BARRA-185",
    seller: "Gohard",
    sucursal: "Lo Barnechea",
    fechaAgendada: "17/02/2026 14:00",
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 60,  contadasSesion: 0 },
      { id: "p2", sku: "GH-003", nombre: "Gohard Pre-Workout Energy 300g",       barcode: "7891234560003", esperadas: 45,  contadasSesion: 0 },
    ],
  },
  // ─── Completado con diferencias ──────────────────────────────────────────────
  "RO-BARRA-186": {
    id: "RO-BARRA-186",
    seller: "Extra Life",
    sucursal: "Quilicura",
    fechaAgendada: "15/02/2026 08:00",
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight",  barcode: "8500942860946", esperadas: 1200, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",      barcode: "8500942860625", esperadas: 800,  contadasSesion: 0 },
      { id: "p3", sku: "300078", nombre: "Extra Life Electrolitos Effervescentes 10 Tabs Limón",         barcode: "8500942860731", esperadas: 550,  contadasSesion: 0 },
    ],
  },
  "RO-BARRA-201": {
    id: "RO-BARRA-201",
    seller: "VitaFit",
    sucursal: "La Reina",
    fechaAgendada: "01/03/2026 09:00",
    products: [
      { id: "p1", sku: "VF-101", nombre: "VitaFit Proteína Vegana 1kg Vainilla",   barcode: "7801234560101", esperadas: 600,  contadasSesion: 0 },
      { id: "p2", sku: "VF-102", nombre: "VitaFit Omega-3 Cápsulas 120 uds",       barcode: "7801234560102", esperadas: 500,  contadasSesion: 0 },
      { id: "p3", sku: "VF-103", nombre: "VitaFit Multivitamínico Diario 60 Tabs",  barcode: "7801234560103", esperadas: 440,  contadasSesion: 0 },
    ],
  },
  // ─── Completado sin diferencias ──────────────────────────────────────────────
  "RO-BARRA-189": {
    id: "RO-BARRA-189",
    seller: "Le Vice",
    sucursal: "Santiago Centro",
    fechaAgendada: "13/02/2026 15:30",
    products: [
      { id: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",  barcode: "7891234560201", esperadas: 400, contadasSesion: 0 },
      { id: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps", barcode: "7891234560202", esperadas: 350, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-200": {
    id: "RO-BARRA-200",
    seller: "BioNature",
    sucursal: "Quilicura",
    fechaAgendada: "04/03/2026 15:00",
    products: [
      { id: "p1", sku: "BN-001", nombre: "BioNature Spirulina Orgánica 300g",  barcode: "7891234560301", esperadas: 500, contadasSesion: 0 },
      { id: "p2", sku: "BN-002", nombre: "BioNature Chlorella 200 Tabs",       barcode: "7891234560302", esperadas: 300, contadasSesion: 0 },
    ],
  },
};

// ─── Seed sessions for ORs already "En proceso de conteo" ─────────────────────
const SEED_SESIONES: Record<string, Sesion[]> = {
  "RO-BARRA-184": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-19T10:05:00", fin: "2026-02-19T10:48:00",
      items: [
        { pid: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight", cantidad: 58 },
        { pid: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     cantidad: 72 },
      ],
    },
  ],
  "RO-BARRA-179": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-02-18T09:05:00", fin: "2026-02-18T09:52:00",
      items: [
        { pid: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate", cantidad: 40 },
        { pid: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",  cantidad: 25 },
      ],
    },
  ],
  "RO-BARRA-185": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-02-17T14:05:00", fin: "2026-02-17T14:58:00",
      items: [
        { pid: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate", cantidad: 30 },
        { pid: "p2", sku: "GH-003", nombre: "Gohard Pre-Workout Energy 300g",      cantidad: 18 },
      ],
    },
  ],
  // ─── Completado con diferencias ──────────────────────────────────────────────
  "RO-BARRA-186": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-15T08:10:00", fin: "2026-02-15T09:05:00",
      items: [
        { pid: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight", cantidad: 1180 },
        { pid: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     cantidad: 780 },
        { pid: "p3", sku: "300078", nombre: "Extra Life Electrolitos Effervescentes 10 Tabs Limón",        cantidad: 550 },
      ],
    },
  ],
  "RO-BARRA-201": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-03-01T09:15:00", fin: "2026-03-01T10:20:00",
      items: [
        { pid: "p1", sku: "VF-101", nombre: "VitaFit Proteína Vegana 1kg Vainilla",  cantidad: 564 },
        { pid: "p2", sku: "VF-102", nombre: "VitaFit Omega-3 Cápsulas 120 uds",      cantidad: 500 },
        { pid: "p3", sku: "VF-103", nombre: "VitaFit Multivitamínico Diario 60 Tabs", cantidad: 440 },
      ],
    },
  ],
  // ─── Completado sin diferencias ──────────────────────────────────────────────
  "RO-BARRA-189": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-13T15:35:00", fin: "2026-02-13T16:40:00",
      items: [
        { pid: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",     cantidad: 400 },
        { pid: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps",  cantidad: 350 },
      ],
    },
  ],
  "RO-BARRA-200": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-03-04T15:10:00", fin: "2026-03-04T16:15:00",
      items: [
        { pid: "p1", sku: "BN-001", nombre: "BioNature Spirulina Orgánica 300g", cantidad: 500 },
        { pid: "p2", sku: "BN-002", nombre: "BioNature Chlorella 200 Tabs",      cantidad: 300 },
      ],
    },
  ],
};

// ─── Quarantine helpers ────────────────────────────────────────────────────────
function categoryFromTag(tag: IncidenciaTagKey): QuarantineCategory {
  if (tag === "sin-nutricional" || tag === "sin-vencimiento") return "devolucion_seller";
  if (tag === "danio-parcial"   || tag === "danio-total")     return "decision_seller";
  return "interna";
}

function loadAllQuarantine(): QuarantineRecord[] {
  try {
    const s = localStorage.getItem(QR_STORAGE_KEY);
    return s ? JSON.parse(s) : SEED_QUARANTINE;
  } catch { return SEED_QUARANTINE; }
}

function saveAllQuarantine(records: QuarantineRecord[]) {
  try { localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}

function buildQuarantineRecords(
  orId: string, seller: string, sucursal: string,
  products: ProductConteo[], incidencias: Record<string, IncidenciaRow[]>,
): QuarantineRecord[] {
  return products.flatMap(p =>
    (incidencias[p.id] ?? [])
      .filter(r => r.tag !== "")
      .map(r => ({
        id:          `QR-${orId}-${p.id}-${r.rowId.slice(-6)}`,
        orId, seller, sucursal,
        sku:         p.sku,
        skuId:       p.id,
        productName: p.nombre,
        cantidad:    r.cantidad,
        tag:         r.tag as string,
        categoria:   categoryFromTag(r.tag as IncidenciaTagKey),
        estado:      "pendiente" as QuarantineStatus,
        resolucion:  null,
        creadoEn:    new Date().toISOString(),
        notas:       r.nota || undefined,
      }))
  );
}

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
  const amberCls = count > 0 && !disabled ? "!bg-amber-50 !text-amber-700 hover:!bg-amber-100" : "";
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={disabled ? undefined : onOpen}
      disabled={disabled}
      title={disabled ? "Inicia una sesión de conteo para registrar incidencias" : undefined}
      className={`whitespace-nowrap ${amberCls}`}
    >
      {count > 0 && !disabled && (
        <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {count}
        </span>
      )}
      Categorizar
    </Button>
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
            <p className="text-sm font-bold text-neutral-900">Eliminar producto</p>
            <p className="text-xs text-neutral-500">Esta acción no puede deshacerse.</p>
          </div>
        </div>
        <p className="text-sm text-neutral-600 leading-relaxed">
          ¿Confirmas que deseas eliminar{" "}
          <span className="font-semibold text-neutral-800">{nombre}</span>{" "}
          de esta orden?
        </p>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors duration-300">
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
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <ClipboardCheck className="w-7 h-7 text-green-600" />
        </div>

        {/* Title + subtitle */}
        <h3 className="text-lg font-bold text-neutral-900 mb-1">Terminar recepción</h3>
        <p className="text-sm text-neutral-500 mb-5">Esta acción es definitiva y no puede deshacerse</p>

        {/* Body */}
        <p className="text-sm text-neutral-700 mb-7 leading-relaxed">
          ¿Confirmas el cierre de la orden{" "}
          <span className="font-bold text-neutral-900">{id}</span>?{" "}
          Se registrarán{" "}
          <span className="font-bold text-neutral-900">
            {totalContadas.toLocaleString("es-CL")} Unidades
          </span>{" "}
          en{" "}
          <span className="font-bold text-neutral-900">
            {sesiones.length} Sesión{sesiones.length !== 1 ? "es" : ""}
          </span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <button onClick={() => onConfirm(outcome)}
            className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center gap-2">
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
    status === "exceso"     ? "bg-red-400"   : "bg-neutral-200";

  // Display: editing active session counts; or accumulated total when idle
  const displayVal = sesionActiva ? product.contadasSesion : total;

  return (
    <div className="p-3 sm:p-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-start gap-3 sm:gap-4">

        {/* Image */}
        <div className="flex-shrink-0 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden w-14 h-14 sm:w-[120px] sm:h-[120px]">
          {product.imagen
            ? <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
            : <ImageOff className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-300" />}
        </div>

        {/* Info header */}
        <div className="flex-1 min-w-0">

          {/* Name + trash */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900 leading-tight">{product.nombre}</p>
            <button
              onClick={() => { if (window.confirm(`¿Eliminar "${product.nombre}" de esta OR?`)) onRemove(product.id); }}
              title="Eliminar producto de esta OR"
              className="p-1.5 text-neutral-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors duration-300 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* SKU + barcode */}
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            <span className="font-semibold text-neutral-500">SKU:</span> {product.sku}
            <span className="hidden sm:inline">
              <span className="mx-2 text-neutral-200">|</span>
              <span className="font-semibold text-neutral-500">C. DE BARRA:</span> {product.barcode}
            </span>
          </p>

          {/* Desktop: counter row inline */}
          <div className="hidden sm:flex items-center gap-3 mt-3">
            <Button variant="secondary" size="sm" onClick={() => sesionActiva && onChange(product.id, Math.max(0, product.contadasSesion - 1))} disabled={!sesionActiva} className="!p-0 w-8 h-8 !text-lg !font-bold">−</Button>

            <input
              type="number" min={0}
              value={displayVal}
              readOnly={!sesionActiva}
              onChange={e => sesionActiva && onChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-16 border border-neutral-200 rounded-lg text-center text-sm font-semibold py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-200 tabular-nums transition-colors duration-300
                ${sesionActiva ? "text-neutral-800 bg-white" : "text-neutral-600 bg-neutral-50 cursor-default"}`}
            />

            <Button variant="secondary" size="sm" onClick={() => sesionActiva && onChange(product.id, product.contadasSesion + 1)} disabled={!sesionActiva} className="!p-0 w-8 h-8 !text-lg !font-bold">+</Button>

            <span className="flex items-center gap-1.5 text-sm text-neutral-500 ml-1">
              <Package className="w-4 h-4 text-neutral-400" />
              <span className="tabular-nums font-medium text-neutral-700">
                {total.toLocaleString("es-CL")}/{product.esperadas.toLocaleString("es-CL")}
              </span>
              <span className="text-neutral-400">esperadas</span>
            </span>

            <div className="ml-auto">
              <CategorizarBtn incidencias={incidencias} onOpen={onCategorizar} disabled={!sesionActiva} />
            </div>
          </div>

          {/* Desktop: progress bar */}
          {product.esperadas > 0 && (
            <div className="hidden sm:block mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile-only: counter + progress ── */}
      <div className="sm:hidden mt-3">
        {/* Progress info + Categorizar */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs text-neutral-500">
            <span className="tabular-nums font-semibold text-neutral-700">{total.toLocaleString("es-CL")}</span>/{product.esperadas.toLocaleString("es-CL")} esperadas
          </span>
          <CategorizarBtn incidencias={incidencias} onOpen={onCategorizar} disabled={!sesionActiva} />
        </div>

        {/* Counter controls - full width, larger buttons */}
        <div className="relative">
          <div className={`flex items-center gap-2.5 ${!sesionActiva ? "opacity-30 pointer-events-none" : ""}`}>
            <button
              onClick={() => sesionActiva && onChange(product.id, Math.max(0, product.contadasSesion - 1))}
              disabled={!sesionActiva}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed active:bg-neutral-200 transition-colors"
            >−</button>

            <input
              type="number" min={0}
              value={displayVal}
              readOnly={!sesionActiva}
              onChange={e => sesionActiva && onChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
              className={`flex-1 border border-neutral-200 rounded-xl text-center text-base font-bold py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200 tabular-nums transition-colors duration-300
                ${sesionActiva ? "text-neutral-800 bg-white" : "text-neutral-600 bg-neutral-50 cursor-default"}`}
            />

            <button
              onClick={() => sesionActiva && onChange(product.id, product.contadasSesion + 1)}
              disabled={!sesionActiva}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary-500 text-white text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed active:bg-primary-600 transition-colors"
            >+</button>
          </div>
          {!sesionActiva && (
            <p className="text-center text-[11px] text-neutral-400 mt-1.5">Inicia sesión para contar</p>
          )}
        </div>

        {/* Progress bar */}
        {product.esperadas > 0 && (
          <div className="mt-2.5 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${pct}%` }} />
          </div>
        )}
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
    <div className="border-b border-neutral-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors duration-300 text-left">
        <span className="text-sm font-bold text-primary-500 w-20 flex-shrink-0">{sesion.id}</span>
        <span className="flex items-center gap-1.5 text-sm text-neutral-600 flex-shrink-0">
          <User className="w-3.5 h-3.5 text-neutral-400" />
          {sesion.operador}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-neutral-400 flex-1 min-w-0 truncate">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          {fmtDT(sesion.inicio)}
          <span className="text-neutral-300 mx-0.5">→</span>
          {fmtDT(sesion.fin)}
        </span>
        <span className="text-sm text-neutral-500 flex-shrink-0">
          {sesion.items.length} SKU{sesion.items.length !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-bold text-neutral-800 tabular-nums w-14 text-right flex-shrink-0">
          {totalUds.toLocaleString("es-CL")} uds
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
               : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
      </button>

      {open && sesion.items.length > 0 && (
        <div className="px-4 pb-3 bg-neutral-50/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-100">
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
                  <tr key={item.pid} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2 font-mono text-neutral-500 text-xs align-top">{item.sku}</td>
                    <td className="py-2 text-neutral-700 align-top">{item.nombre}</td>
                    <td className="py-2 align-top">
                      {rows.length === 0 ? (
                        <span className="text-xs text-neutral-300">—</span>
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
                                                  "bg-neutral-100  text-neutral-500   border-neutral-200"
                      }`}>
                        {status === "completo"   ? "Completo"          :
                         status === "diferencia" ? "Con diferencias"   :
                         status === "exceso"     ? "Exceso"            : "Pendiente"}
                        <span className="ml-1 font-normal opacity-70 tabular-nums">
                          {overallTotal}/{esperadas}
                        </span>
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold text-neutral-800 tabular-nums align-top">
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
    <div className="px-4 py-4 border-t border-neutral-100 space-y-3 bg-neutral-50/50">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Incidencia #{index + 1}</span>
        <button onClick={() => onRemove(row.rowId)} className="p-1 text-neutral-300 hover:text-red-400 transition-colors duration-300 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tag + Cantidad */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          as="select"
          label="Tipo de incidencia *"
          value={row.tag}
          onChange={v => onUpdate(row.rowId, { tag: v as IncidenciaTagKey | "" })}
        >
          <option value="">Seleccione</option>
          {INCIDENCIA_TAGS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </FormField>
        <FormField
          label="Cantidad afectada *"
          type="number"
          value={String(row.cantidad)}
          onChange={v => onUpdate(row.rowId, { cantidad: Math.max(1, parseInt(v) || 1) })}
        />
      </div>

      {/* Description — only for "no-en-sistema" */}
      {row.tag === "no-en-sistema" && (
        <FormField
          as="textarea"
          label="Descripción del producto *"
          value={row.descripcion}
          onChange={v => onUpdate(row.rowId, { descripcion: v })}
          placeholder="Nombre, código visible, descripción del producto no identificado..."
          rows={2}
        />
      )}

      {/* Image upload */}
      <div>
        <label className="block text-xs text-neutral-400 font-medium mb-1.5">
          Imágenes * <span className="text-neutral-400 font-normal">({row.imagenes.length}/5 · JPG o PNG · 5 MB máx)</span>
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
                <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 object-cover rounded-lg border border-neutral-200" />
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
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-300"
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
      <FormField
        as="textarea"
        label="Nota adicional"
        value={row.nota}
        onChange={v => onUpdate(row.rowId, { nota: v })}
        placeholder="Observaciones adicionales..."
        rows={2}
        helperText="Opcional"
      />

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
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-neutral-100 flex-shrink-0">
          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {product.imagen
              ? <img src={product.imagen} alt="" className="w-full h-full object-cover rounded-lg" />
              : <ImageOff className="w-5 h-5 text-neutral-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">{product.nombre}</p>
            <p className="text-xs text-neutral-400 mt-0.5">SKU: {product.sku} · {product.esperadas} uds declaradas</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-neutral-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-700">Sin incidencias registradas</p>
                <p className="text-xs text-neutral-400 mt-0.5">Agrega una incidencia si este SKU presenta algún problema.</p>
              </div>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-colors duration-300 mt-1"
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
              <div className="px-4 py-3 border-t border-dashed border-neutral-200">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-primary-500 hover:bg-primary-50/50 transition-colors duration-300 px-2 py-1.5 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar otra incidencia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 flex-shrink-0">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <button
            onClick={() => saveEnabled && onSave(rows)}
            disabled={!saveEnabled}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-300 flex items-center gap-2 ${
              saveEnabled ? "bg-primary-500 hover:bg-primary-600 text-white" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
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
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-neutral-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-neutral-900">Añadir producto</h3>
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Nombre */}
          <FormField
            label="Nombre del producto"
            value={form.nombre}
            onChange={v => setForm(f => ({ ...f, nombre: v }))}
            placeholder="Ej: Tropical Delight 20 Sachets"
          />

          {/* SKU + Código de barras */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="SKU"
              value={form.sku}
              onChange={v => setForm(f => ({ ...f, sku: v }))}
              placeholder="300034"
              helperText="Opcional"
            />
            <FormField
              label="Código de barras"
              value={form.barcode}
              onChange={v => setForm(f => ({ ...f, barcode: v }))}
              placeholder="8500942860946"
              helperText="Opcional"
            />
          </div>

          {/* Cantidad + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              type="number"
              label="Cantidad"
              value={form.cantidad}
              onChange={v => setForm(f => ({ ...f, cantidad: v }))}
            />
            <FormField
              as="select"
              label="Categoría"
              value={form.categoria}
              onChange={v => setForm(f => ({ ...f, categoria: v }))}
              helperText="Opcional"
            >
              <option value="">Sin categoría</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </FormField>
          </div>

          {/* Foto */}
          <div>
            <p className="text-[11px] font-semibold text-neutral-600 mb-1.5">Foto <span className="text-neutral-400 font-normal">(opcional · JPG o PNG · 5 MB máx)</span></p>
            <input
              ref={fileRef} type="file" className="hidden"
              accept="image/jpeg,image/png" capture="environment"
              onChange={e => e.target.files?.[0] && setForm(f => ({ ...f, imagen: e.target.files![0] }))}
            />
            {form.imagen ? (
              <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl p-3">
                <img src={URL.createObjectURL(form.imagen)} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{form.imagen.name}</p>
                  <p className="text-xs text-neutral-400">{(form.imagen.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, imagen: null }))} className="text-neutral-400 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm text-neutral-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/40 transition-colors duration-300"
              >
                <Upload className="w-4 h-4" />
                Subir o tomar foto
              </button>
            )}
          </div>

          {/* Comentarios */}
          <FormField
            as="textarea"
            label="Comentarios"
            value={form.comentarios}
            onChange={v => setForm(f => ({ ...f, comentarios: v }))}
            placeholder="Observaciones sobre el producto..."
            helperText="Opcional"
          />

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 flex-shrink-0">
          <Button variant="secondary" size="lg" onClick={onCancel}>
            Cancelar
          </Button>
          <button
            onClick={handleConfirm} disabled={!canConfirm}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-300 flex items-center gap-2 ${
              canConfirm ? "bg-primary-500 hover:bg-primary-600 text-white" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
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

// ─── AddProductChoiceModal ────────────────────────────────────────────────────
function AddProductChoiceModal({ onRecognized, onUnrecognized, onCancel }: {
  onRecognized: () => void;
  onUnrecognized: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-neutral-900">Añadir producto</h3>
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question */}
        <p className="text-sm text-neutral-600">¿Puedes reconocer el producto?</p>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={onRecognized}
            className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/40 transition-colors duration-300 text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors duration-300">
              <Search className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Sí, lo reconozco</p>
              <p className="text-xs text-neutral-400 mt-0.5">Buscar en el catálogo de productos</p>
            </div>
          </button>

          <button
            onClick={onUnrecognized}
            className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/40 transition-colors duration-300 text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors duration-300">
              <HelpCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">No, no lo reconozco</p>
              <p className="text-xs text-neutral-400 mt-0.5">Ingresar datos manualmente</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GestionCuarentena ───────────────────────────────────────────────────────
function GestionCuarentena({ records, onUpdate, incidencias }: {
  records:  QuarantineRecord[];
  onUpdate: (id: string, patch: Partial<QuarantineRecord>) => void;
  incidencias: Record<string, IncidenciaRow[]>;
}) {
  const [catCModal,    setCatCModal]    = useState<QuarantineRecord | null>(null);
  const [decisionMode, setDecisionMode] = useState<"stock" | "merma" | "mixto">("stock");
  const [stockQty,     setStockQty]     = useState(0);
  const [mermaQty,     setMermaQty]     = useState(0);
  const [decisionNota, setDecisionNota] = useState("");
  const [slideIdx,     setSlideIdx]     = useState(0);

  function openCatC(rec: QuarantineRecord) {
    setCatCModal(rec);
    setDecisionMode("stock");
    setStockQty(rec.cantidad);
    setMermaQty(0);
    setDecisionNota("");
    setSlideIdx(0);
  }

  function confirmCatC() {
    if (!catCModal) return;
    const res: QuarantineResolution =
      decisionMode === "merma" ? "merma" : "stock_disponible";
    onUpdate(catCModal.id, {
      estado:         "resuelto",
      resolucion:     res,
      stockCantidad:  decisionMode === "stock" ? catCModal.cantidad : decisionMode === "mixto" ? stockQty : 0,
      mermaCantidad:  decisionMode === "merma" ? catCModal.cantidad : decisionMode === "mixto" ? mermaQty : 0,
      decisionSeller: decisionNota || undefined,
      resueltoen:     new Date().toISOString(),
    });
    setCatCModal(null);
  }

  function catBadge(cat: QuarantineCategory) {
    if (cat === "interna")           return { label: "Resolución interna Amplifica",   cls: "bg-primary-50 text-primary-600 border-primary-200" };
    if (cat === "devolucion_seller") return { label: "Devolución obligatoria a seller", cls: "bg-red-50 text-red-700 border-red-200" };
    return                                  { label: "Decisión del seller",             cls: "bg-amber-50 text-amber-700 border-amber-200" };
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
    if (r === "merma")    return "Merma";
    return "Devolución";
  }

  const pendientes = records.filter(r => r.estado !== "resuelto").length;

  return (
    <>
      {/* ── Cat C decision modal ── */}
      {catCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Two-column grid: gallery left, form right */}
            {(() => {
              const matchingInc = (incidencias[catCModal.skuId] ?? []).find(r => r.tag === catCModal.tag);
              const tagInfo = INCIDENCIA_TAGS.find(t => t.key === catCModal.tag);
              const realImages = matchingInc?.imagenes ?? [];
              // Demo images by incidence tag — retail products with context-specific details
              const demoImagesByTag: Record<string, string[]> = {
                "sin-codigo-barra": [
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                ],
                "codigo-incorrecto": [
                  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                ],
                "codigo-ilegible": [
                  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                ],
                "sin-nutricional": [
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1625740650964-168e296f04cd?w=480&h=360&fit=crop",
                ],
                "sin-vencimiento": [
                  "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1625740650964-168e296f04cd?w=480&h=360&fit=crop",
                ],
                "danio-parcial": [
                  "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=480&h=360&fit=crop",
                ],
                "danio-total": [
                  "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=480&h=360&fit=crop",
                ],
                "no-en-sistema": [
                  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                ],
              };
              const fallbackImgs = [
                "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
              ];
              const imgUrls: string[] = realImages.length > 0
                ? realImages.map(f => URL.createObjectURL(f))
                : (demoImagesByTag[catCModal.tag] ?? fallbackImgs);
              const total = imgUrls.length;
              const safeIdx = Math.min(slideIdx, total - 1);
              const operatorNote = matchingInc?.nota || catCModal.notas || "";

              return (
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* ── Left column: image gallery ── */}
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-1 min-h-[260px]">
                      <img
                        src={imgUrls[safeIdx]}
                        alt={`Evidencia ${safeIdx + 1}`}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      {total > 1 && (
                        <button
                          onClick={() => setSlideIdx(i => (i - 1 + total) % total)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-neutral-700 rotate-180" />
                        </button>
                      )}
                      {total > 1 && (
                        <button
                          onClick={() => setSlideIdx(i => (i + 1) % total)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-neutral-700" />
                        </button>
                      )}
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-black/50 rounded-full px-2.5 py-0.5 tabular-nums">
                        {safeIdx + 1}/{total}
                      </span>
                    </div>
                    {/* Thumbnails strip */}
                    {total > 1 && (
                      <div className="flex gap-1.5 justify-center">
                        {imgUrls.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setSlideIdx(i)}
                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                              i === safeIdx ? "border-primary-400 ring-1 ring-primary-200" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Right column: info + form ── */}
                  <div className="flex flex-col gap-4">
                    {/* Title + product */}
                    <div>
                      <p className="text-base font-bold text-neutral-900">Registrar decisión del seller</p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        {catCModal.productName}
                        <span className="font-mono ml-1 text-neutral-400">· {catCModal.sku}</span>
                        <span className="ml-1 text-neutral-400">· {catCModal.cantidad} uds</span>
                      </p>
                    </div>

                    {/* Tag badge + operator note */}
                    {tagInfo && (
                      <div className="space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-500">Incidencia:</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            tagInfo.color === "amber"  ? "bg-amber-50  text-amber-700  border-amber-200"  :
                            tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200" :
                            tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                                         "bg-red-50    text-red-700    border-red-200"
                          }`}>{tagInfo.label}</span>
                        </div>
                        {operatorNote && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Comentario del operador</p>
                            <p className="text-sm text-neutral-700 bg-white rounded-md px-3 py-2 border border-neutral-100">
                              {operatorNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Decision options */}
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
                              setStockQty(half);
                              setMermaQty(catCModal.cantidad - half);
                            }
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors duration-300 ${
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

                    {/* Mixto split inputs */}
                    {decisionMode === "mixto" && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          label="Uds a stock disponible"
                          type="number"
                          value={String(stockQty)}
                          onChange={v => {
                            const n = Math.max(0, Math.min(catCModal.cantidad, parseInt(v) || 0));
                            setStockQty(n); setMermaQty(catCModal.cantidad - n);
                          }}
                        />
                        <FormField
                          label="Uds a mermar"
                          type="number"
                          value={String(mermaQty)}
                          onChange={v => {
                            const n = Math.max(0, Math.min(catCModal.cantidad, parseInt(v) || 0));
                            setMermaQty(n); setStockQty(catCModal.cantidad - n);
                          }}
                        />
                        <p className={`col-span-2 text-xs font-medium ${
                          stockQty + mermaQty === catCModal.cantidad ? "text-green-600" : "text-red-500"
                        }`}>
                          Total asignado: {(stockQty + mermaQty).toLocaleString("es-CL")} / {catCModal.cantidad.toLocaleString("es-CL")} uds
                        </p>
                      </div>
                    )}

                    {/* Nota seller */}
                    <FormField
                      as="textarea"
                      label="Nota / decisión del seller (opcional)"
                      value={decisionNota}
                      onChange={setDecisionNota}
                      rows={2}
                      placeholder="Ej: Seller acepta daño cosmético, autoriza venta con descuento"
                    />

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-auto">
                      <Button variant="secondary" size="lg" onClick={() => setCatCModal(null)} className="flex-1">
                        Cancelar
                      </Button>
                      <button
                        onClick={confirmCatC}
                        disabled={decisionMode === "mixto" && stockQty + mermaQty !== catCModal.cantidad}
                        className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-neutral-900">Gestión de cuarentena</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {pendientes} registro{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} de resolución
            </p>
          </div>
          <span className={`whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full border ${
            pendientes === 0
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {pendientes === 0 ? "Todo resuelto" : `${pendientes} en cuarentena`}
          </span>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden flex flex-col divide-y divide-neutral-100">
          {records.map(rec => {
            const cat     = catBadge(rec.categoria);
            const est     = estadoBadge(rec.estado);
            const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
            return (
              <div key={rec.id} className="px-4 py-3.5">
                {/* Row 1: SKU + Estado */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-neutral-500">{rec.sku}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${est.cls}`}>
                    {est.label}
                  </span>
                </div>
                {/* Row 2: Product name + tag */}
                <p className="text-sm text-neutral-800 font-medium leading-snug">{rec.productName}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {tagInfo && (
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200"  :
                      tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200":
                      tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200":
                                                   "bg-red-50 text-red-700 border-red-200"
                    }`}>{tagInfo.label}</span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cat.cls}`}>
                    {cat.label}
                  </span>
                </div>
                {/* Row 3: Cantidad + Resolución */}
                <div className="flex items-center gap-4 mt-2.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Cant.</span>
                    <span className="text-neutral-800 font-semibold tabular-nums">{rec.cantidad}</span>
                  </div>
                  {rec.resolucion && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Resolución</span>
                      <span className="text-neutral-700 font-medium">{resolucionLabel(rec.resolucion, rec)}</span>
                    </div>
                  )}
                </div>
                {rec.decisionSeller && (
                  <p className="text-[10px] text-neutral-400 italic mt-1">&quot;{rec.decisionSeller}&quot;</p>
                )}
                {/* Actions */}
                <div className="mt-3">
                  {rec.estado === "pendiente" && (
                    <button
                      onClick={() => onUpdate(rec.id, { estado: "en_gestion" })}
                      className="w-full text-xs font-semibold px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300"
                    >
                      Iniciar gestión
                    </button>
                  )}
                  {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                    <button
                      onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                      className="w-full text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors duration-300"
                    >
                      Confirmar re-etiquetado
                    </button>
                  )}
                  {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                    <button
                      onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                      className="w-full text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors duration-300"
                    >
                      Confirmar retiro seller
                    </button>
                  )}
                  {rec.estado === "en_gestion" && rec.categoria === "decision_seller" && (
                    <button
                      onClick={() => openCatC(rec)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300"
                    >
                      Registrar decisión
                    </button>
                  )}
                  {rec.estado === "resuelto" && (
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" /> Resuelto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50/60 border-b border-neutral-100">
                {["SKU", "Producto / Tag", "Cant.", "Categoría", "Estado", "Resolución", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {records.map(rec => {
                const cat     = catBadge(rec.categoria);
                const est     = estadoBadge(rec.estado);
                const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
                return (
                  <tr key={rec.id} className="hover:bg-neutral-50/40 transition-colors duration-300">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 whitespace-nowrap align-top">{rec.sku}</td>
                    <td className="px-4 py-3 align-top max-w-[180px]">
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
                    <td className="px-4 py-3 tabular-nums font-semibold text-neutral-800 align-top">{rec.cantidad}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cat.cls}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${est.cls}`}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 align-top">
                      {rec.resolucion
                        ? <span className="font-medium">{resolucionLabel(rec.resolucion, rec)}</span>
                        : <span className="text-neutral-300">—</span>}
                      {rec.decisionSeller && (
                        <p className="text-[10px] text-neutral-400 italic mt-0.5">&quot;{rec.decisionSeller}&quot;</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {rec.estado === "pendiente" && (
                        <button
                          onClick={() => onUpdate(rec.id, { estado: "en_gestion" })}
                          className="text-xs font-semibold px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap"
                        >
                          Iniciar gestión
                        </button>
                      )}
                      {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                        <button
                          onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-300 whitespace-nowrap"
                        >
                          Confirmar re-etiquetado
                        </button>
                      )}
                      {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                        <button
                          onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-300 whitespace-nowrap"
                        >
                          Confirmar retiro seller
                        </button>
                      )}
                      {rec.estado === "en_gestion" && rec.categoria === "decision_seller" && (
                        <button
                          onClick={() => openCatC(rec)}
                          className="text-xs font-semibold px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap"
                        >
                          Registrar decisión
                        </button>
                      )}
                      {rec.estado === "resuelto" && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" /> Resuelto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── ResumenOR ────────────────────────────────────────────────────────────────
function ResumenOR({ id, baseData, orEstado, sesiones, products, incidencias, acumulado, OPERADOR }: {
  id: string; baseData: OrdenData; orEstado: OrOutcome | null;
  sesiones: Sesion[]; products: ProductConteo[];
  incidencias: Record<string, IncidenciaRow[]>;
  acumulado: Record<string, number>; OPERADOR: string;
}) {
  const [viewMode, setViewMode] = useState<"consolidado" | "por-sesion">("consolidado");
  const [lightbox, setLightbox] = useState<File | null>(null);

  const skuRows = products.map(p => {
    const acc     = acumulado[p.id] ?? 0;
    const incRows = (incidencias[p.id] ?? []).filter(r => r.tag !== "");
    const incUds  = incRows.reduce((s, r) => s + r.cantidad, 0);
    const received = acc + incUds;
    const diff    = received - p.esperadas;
    const status  = incRows.length > 0 ? "Con incidencia" :
                    diff === 0 ? "Correcto" : diff > 0 ? "Exceso" : "Diferencia";
    return { p, received, diff, status, incRows };
  });

  const flatInc = products.flatMap(p =>
    (incidencias[p.id] ?? []).filter(r => r.tag !== "").map(r => ({ product: p, row: r }))
  );

  const catGroups = [
    {
      cat: "A", color: "primary" as const,
      label: "Resolución interna Amplifica",
      desc: "Re-etiquetado o creación de SKU en bodega",
      rows: flatInc.filter(({ row }) =>
        row.tag === "sin-codigo-barra" || row.tag === "codigo-incorrecto" ||
        row.tag === "codigo-ilegible"  || row.tag === "no-en-sistema"),
    },
    {
      cat: "B", color: "red" as const,
      label: "Devolución obligatoria al seller",
      desc: "El seller retira, corrige y reingresa como nueva OR",
      rows: flatInc.filter(({ row }) => row.tag === "sin-nutricional" || row.tag === "sin-vencimiento"),
    },
    {
      cat: "C", color: "amber" as const,
      label: "Decisión del seller",
      desc: "El KAM consulta al seller la disposición del producto",
      rows: flatInc.filter(({ row }) => row.tag === "danio-parcial" || row.tag === "danio-total"),
    },
  ].filter(g => g.rows.length > 0);

  function tagCatBadge(tag: IncidenciaTagKey) {
    if (tag === "sin-codigo-barra" || tag === "codigo-incorrecto" || tag === "codigo-ilegible" || tag === "no-en-sistema")
      return { badge: "Cat.A", cls: "bg-primary-100 text-primary-500" };
    if (tag === "sin-nutricional" || tag === "sin-vencimiento")
      return { badge: "Cat.B", cls: "bg-red-100 text-red-600" };
    return { badge: "Cat.C", cls: "bg-amber-100 text-amber-600" };
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <button
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300"
            onClick={e => { e.stopPropagation(); setLightbox(null); }}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={URL.createObjectURL(lightbox)} alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-neutral-900">Resumen de recepción</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""} · detalle por SKU
            </p>
          </div>
          {sesiones.length > 1 && (
            <div className="flex items-center gap-0.5 bg-neutral-100 rounded-lg p-0.5 flex-shrink-0">
              {(["consolidado", "por-sesion"] as const).map(m => (
                <button
                  key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-300 ${
                    viewMode === m ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {m === "consolidado" ? "Consolidado" : "Por sesión"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── OR meta ── */}
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
          {([
            ["ID de OR", id], ["Seller", baseData.seller], ["Sucursal", baseData.sucursal],
            ["Fecha agendada", baseData.fechaAgendada], ["Estado", orEstado ?? "—"], ["Operador", OPERADOR],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Consolidated table ── */}
        {viewMode === "consolidado" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60">
                  {["SKU", "Nombre", "Teórica", "Recibida", "Diferencia", "Estado", "Tag incidencia", "Uds c/inc.", "Imágenes"].map(h => (
                    <th key={h} className={`px-3 py-2.5 text-[11px] font-semibold text-neutral-500 ${
                      ["Teórica","Recibida","Diferencia","Uds c/inc."].includes(h) ? "text-right" :
                      h === "Estado" ? "text-center" : "text-left"
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {skuRows.map(({ p, received, diff, status, incRows }) => {
                  const allImgs = incRows.flatMap(r => r.imagenes);
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/40 transition-colors duration-300">
                      <td className="px-3 py-3 font-mono text-xs text-neutral-500 align-top whitespace-nowrap">{p.sku}</td>
                      <td className="px-3 py-3 text-xs text-neutral-700 align-top leading-relaxed max-w-[160px]">{p.nombre}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-xs text-neutral-500 align-top">{p.esperadas.toLocaleString("es-CL")}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-neutral-800 align-top">{received.toLocaleString("es-CL")}</td>
                      <td className={`px-3 py-3 text-right tabular-nums font-bold align-top ${
                        diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"
                      }`}>
                        {diff === 0 ? "0" : diff > 0 ? `+${diff.toLocaleString("es-CL")}` : diff.toLocaleString("es-CL")}
                      </td>
                      <td className="px-3 py-3 text-center align-top">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                          status === "Correcto"       ? "bg-green-50 text-green-700 border-green-200" :
                          status === "Con incidencia" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          status === "Exceso"         ? "bg-blue-50  text-blue-700  border-blue-200"  :
                                                        "bg-red-50   text-red-600   border-red-200"
                        }`}>{status}</span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {incRows.length === 0
                          ? <span className="text-neutral-200 text-xs">—</span>
                          : <div className="flex flex-col gap-1">
                              {incRows.map(r => {
                                const tag = INCIDENCIA_TAGS.find(t => t.key === r.tag);
                                if (!tag) return null;
                                const { badge, cls } = tagCatBadge(r.tag as IncidenciaTagKey);
                                return (
                                  <div key={r.rowId} className="flex items-center gap-1 flex-wrap">
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                      tag.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200"  :
                                      tag.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200":
                                      tag.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200":
                                                               "bg-red-50 text-red-700 border-red-200"
                                    }`}>{tag.label}</span>
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${cls}`}>{badge}</span>
                                  </div>
                                );
                              })}
                            </div>
                        }
                      </td>
                      <td className="px-3 py-3 text-right align-top">
                        {incRows.length === 0
                          ? <span className="text-neutral-200 text-xs">—</span>
                          : <span className="font-semibold text-amber-700 tabular-nums">
                              {incRows.reduce((s, r) => s + r.cantidad, 0).toLocaleString("es-CL")}
                            </span>
                        }
                      </td>
                      <td className="px-3 py-3 align-top">
                        {allImgs.length === 0
                          ? <span className="text-neutral-200 text-xs">—</span>
                          : <div className="flex gap-1 flex-wrap">
                              {allImgs.slice(0, 3).map((img, i) => (
                                <button
                                  key={i} onClick={() => setLightbox(img)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-400 flex-shrink-0 transition-colors duration-300"
                                >
                                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                              {allImgs.length > 3 && (
                                <button
                                  onClick={() => setLightbox(allImgs[3])}
                                  className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-[10px] font-bold text-neutral-500 hover:border-primary-400 flex-shrink-0 transition-colors duration-300"
                                >
                                  +{allImgs.length - 3}
                                </button>
                              )}
                            </div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Per-session view ── */}
        {viewMode === "por-sesion" && (
          <div className="divide-y divide-neutral-100">
            {sesiones.map(ses => (
              <div key={ses.id}>
                <div className="px-4 py-2.5 bg-primary-50/60 flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-bold text-primary-500">{ses.id}</span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <User className="w-3 h-3" />{ses.operador}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {fmtDT(ses.inicio)} <span className="text-neutral-300">→</span> {fmtDT(ses.fin)}
                  </span>
                  <span className="ml-auto text-xs font-bold text-primary-500 tabular-nums">
                    {ses.items.reduce((s, i) => s + i.cantidad, 0).toLocaleString("es-CL")} uds
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50/60 border-b border-neutral-100">
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-400">SKU</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-400">Producto</th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold text-neutral-400">Contadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {ses.items.map(item => (
                      <tr key={item.pid}>
                        <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">{item.sku}</td>
                        <td className="px-4 py-2.5 text-xs text-neutral-700">{item.nombre}</td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-neutral-800">{item.cantidad.toLocaleString("es-CL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ── Incidencias por categoría de resolución ── */}
        {flatInc.length > 0 && (
          <div className="border-t border-neutral-100 px-5 py-4 space-y-3">
            <p className="text-sm font-semibold text-neutral-800">Incidencias por categoría de resolución</p>
            {catGroups.map(({ cat, label, desc, color, rows }) => {
              const borderCls  = color === "primary" ? "border-primary-200" : color === "red" ? "border-red-200" : "border-amber-200";
              const headerCls  = color === "primary" ? "bg-primary-50"      : color === "red" ? "bg-red-50"      : "bg-amber-50";
              const badgeCls   = color === "primary" ? "bg-primary-500"     : color === "red" ? "bg-red-600"     : "bg-amber-500";
              const titleCls   = color === "primary" ? "text-primary-700"   : color === "red" ? "text-red-800"   : "text-amber-800";
              const subCls     = color === "primary" ? "text-primary-500"   : color === "red" ? "text-red-500"   : "text-amber-600";
              return (
                <div key={cat} className={`rounded-xl border overflow-hidden ${borderCls}`}>
                  <div className={`px-4 py-2.5 flex items-center gap-2.5 ${headerCls}`}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${badgeCls}`}>Cat. {cat}</span>
                    <div>
                      <p className={`text-xs font-semibold ${titleCls}`}>{label}</p>
                      <p className={`text-[10px] ${subCls}`}>{desc}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {rows.map(({ product, row }) => {
                      const tag = INCIDENCIA_TAGS.find(t => t.key === row.tag);
                      return (
                        <div key={row.rowId} className="px-4 py-3 flex items-start gap-4 bg-white">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-neutral-800">{product.nombre}</span>
                              <span className="font-mono text-[10px] text-neutral-400">{product.sku}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {tag && (
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  tag.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200"  :
                                  tag.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200":
                                  tag.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200":
                                                           "bg-red-50 text-red-700 border-red-200"
                                }`}>{tag.label}</span>
                              )}
                              <span className="text-xs text-neutral-500">
                                <span className="font-semibold tabular-nums">{row.cantidad.toLocaleString("es-CL")}</span> uds afectadas
                              </span>
                            </div>
                            {row.nota && <p className="text-xs text-neutral-400 italic mt-1">"{row.nota}"</p>}
                            {row.tag === "no-en-sistema" && row.descripcion && (
                              <p className="text-xs text-purple-700 mt-1.5">{row.descripcion}</p>
                            )}
                          </div>
                          {row.imagenes.length > 0 ? (
                            <div className="flex gap-1.5 flex-wrap flex-shrink-0">
                              {row.imagenes.map((img, i) => (
                                <button
                                  key={i} onClick={() => setLightbox(img)}
                                  className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-400 flex-shrink-0 transition-colors duration-300"
                                >
                                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-neutral-300 flex-shrink-0">
                              <ImageOff className="w-3 h-3" /> Sin imágenes
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
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
  const [sesiones,      setSesiones]      = useState<Sesion[]>(() => SEED_SESIONES[id] ?? []);
  const [sesionActiva,  setSesionActiva]  = useState(false);
  const [sesionInicio,  setSesionInicio]  = useState("");
  const [scanner,       setScanner]       = useState("");
  const [confirmClose,   setConfirmClose]   = useState(false);
  const [noUnitsAlert,   setNoUnitsAlert]   = useState(false);
  const [pendingRemove,  setPendingRemove]  = useState<string | null>(null);
  const [showDotsMenu,   setShowDotsMenu]   = useState(false);
  const [showStickyMenu, setShowStickyMenu] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [showProductTable, setShowProductTable] = useState(false);
  const [orEstado,       setOrEstado]       = useState<OrOutcome | null>(null);
  const [incidencias,      setIncidencias]      = useState<Record<string, IncidenciaRow[]>>({});
  const [incidenciaTarget, setIncidenciaTarget] = useState<string | null>(null);
  // Snapshot of incidencias[target] at the moment the modal opens (to revert on cancel)
  const incidenciaSnapshotRef = useRef<IncidenciaRow[]>([]);
  const [addProductFlow, setAddProductFlow] = useState<"closed" | "choice" | "catalog" | "manual">("closed");
  const [quarantineRecs,   setQuarantineRecs]   = useState<QuarantineRecord[]>([]);

  // Capture snapshot of incidencias for a SKU when the modal opens (to revert on cancel)
  useEffect(() => {
    if (incidenciaTarget !== null) {
      incidenciaSnapshotRef.current = incidencias[incidenciaTarget] ?? [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidenciaTarget]); // intentionally only re-run when target changes, not incidencias

  // Restore closed state from localStorage OR from seed data (completed ORs)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`amplifica_or_${id}`);
      if (stored) {
        const { estado } = JSON.parse(stored) as { estado: OrOutcome };
        if (estado === "Completado sin diferencias" || estado === "Completado con diferencias") {
          setOrEstado(estado);
          return;
        }
      }
    } catch { /* ignore */ }
    // Fallback: check seed data for ORs that are already completed
    const seedEntry = ORDENES_SEED.find(o => o.id === id);
    if (seedEntry) {
      if (seedEntry.estado === "Completado sin diferencias" || seedEntry.estado === "Completado con diferencias") {
        setOrEstado(seedEntry.estado as OrOutcome);
      }
    }
  }, [id]);

  // Load quarantine records when OR is closed
  useEffect(() => {
    if (!orEstado) return;
    const all = loadAllQuarantine();
    setQuarantineRecs(all.filter(r => r.orId === id));
  }, [orEstado, id]);

  // Update a quarantine record (local state + persist to localStorage)
  const updateQuarantineRecord = (qrId: string, patch: Partial<QuarantineRecord>) => {
    setQuarantineRecs(prev => {
      const next = prev.map(r => r.id === qrId ? { ...r, ...patch } : r);
      // Persist: replace all records for this OR in global quarantine store
      const all     = loadAllQuarantine();
      const others  = all.filter(r => r.orId !== id);
      saveAllQuarantine([...others, ...next]);
      return next;
    });
  };

  // Convert ProductsModal output (AddProduct[]) → ProductConteo[] and merge
  const handleCatalogAdd = (incoming: AddProduct[]) => {
    setProducts(prev => {
      const updated = [...prev];
      incoming.forEach(p => {
        const idx = updated.findIndex(e => e.sku === p.sku);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], esperadas: updated[idx].esperadas + p.qty };
        } else {
          updated.push({
            id: `catalog-${p.sku}-${Date.now()}`,
            sku: p.sku,
            nombre: p.nombre,
            barcode: p.barcode,
            esperadas: p.qty,
            contadasSesion: 0,
          });
        }
      });
      return updated;
    });
    setAddProductFlow("closed");
  };

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
    for (const p of products) {
      const incTotal = (incidencias[p.id] ?? []).reduce((s, r) => s + r.cantidad, 0);
      map[p.id] = (acumulado[p.id] ?? 0) + p.contadasSesion + incTotal;
    }
    return map;
  }, [products, acumulado, incidencias]);

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
    ? "bg-neutral-50 border-neutral-200 text-neutral-300 cursor-not-allowed"
    : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

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

      {addProductFlow === "choice" && (
        <AddProductChoiceModal
          onRecognized={() => setAddProductFlow("catalog")}
          onUnrecognized={() => setAddProductFlow("manual")}
          onCancel={() => setAddProductFlow("closed")}
        />
      )}

      {addProductFlow === "catalog" && (
        <ProductsModal
          onClose={() => setAddProductFlow("closed")}
          onAdd={handleCatalogAdd}
        />
      )}

      {addProductFlow === "manual" && (
        <AddProductModal
          onCancel={() => setAddProductFlow("closed")}
          onConfirm={(product) => { setProducts(ps => [...ps, product]); setAddProductFlow("closed"); }}
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
            // Build and persist quarantine records for all incidencias
            const qrRecords = buildQuarantineRecords(
              id, baseData.seller, baseData.sucursal, products, incidencias,
            );
            if (qrRecords.length > 0) {
              const all      = loadAllQuarantine();
              const filtered = all.filter(r => r.orId !== id);
              saveAllQuarantine([...filtered, ...qrRecords]);
              setQuarantineRecs(qrRecords);
            }
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
      <nav className="max-w-4xl mx-auto px-4 lg:px-6 pt-4 pb-1 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Orden de Recepción</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-3 pb-24 lg:pb-6 space-y-5">

        {/* ── Title row ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Orden de Recepción{" "}
              <span className="font-mono text-neutral-900">#{id}</span>
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              {baseData.sucursal}{baseData.fechaAgendada && baseData.fechaAgendada !== "—" ? ` - ${baseData.fechaAgendada}` : ""}
            </p>
          </div>

          {/* Desktop-only session buttons */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {!orCerrada && (
              sesionActiva ? (
                <button
                  onClick={finalizarSesion}
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors duration-300 whitespace-nowrap"
                >
                  <StopCircle className="w-4 h-4 text-neutral-500" />
                  Finalizar sesión
                </button>
              ) : (
                <button
                  onClick={iniciarSesion}
                  className="flex items-center gap-2.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300 whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4" />
                  Iniciar sesión de conteo
                </button>
              )
            )}
          </div>
        </div>

        {/* ── QR Display ── */}
        <QrDisplaySection
          orId={id}
          seller={baseData.seller}
          sucursal={baseData.sucursal}
          fechaAgendada={baseData.fechaAgendada}
          skus={products.length}
          uTotales={stats.totalEsperadas.toLocaleString("es-CL")}
          sesiones={sesiones.length + (sesionActiva ? 1 : 0)}
        />

        {/* ── Active session banner ── */}
        {sesionActiva && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-bold text-primary-600">{sesionId(sesionNumActual)}</span>
              <span className="text-primary-400 ml-2 text-xs">
                Iniciada {fmtDT(sesionInicio)}
              </span>
            </div>
            <span className="text-sm font-bold text-primary-500 tabular-nums flex-shrink-0">
              {stats.totalSesionAct.toLocaleString("es-CL")} uds esta sesión
            </span>
          </div>
        )}

        {/* ── Scanner (active session only) ── */}
        {sesionActiva && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">

            {/* Mobile: camera viewfinder + input (CTA lives in sticky bar) */}
            <div className="sm:hidden">
              <div className="bg-neutral-900 px-6 py-6 flex flex-col items-center gap-3">
                <div className="relative w-44 h-24 flex items-center justify-center">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/25 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/25 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/25 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/25 rounded-br-lg" />
                  {/* Barcode icon */}
                  <ScanBarcode className="w-9 h-9 text-white/20" />
                  {/* Scan line */}
                  <div className="absolute inset-x-3 h-0.5 bg-primary-400/50 top-1/2 animate-pulse rounded-full" />
                </div>
                <p className="text-white/50 text-xs font-medium">Apunta al código de barras del producto</p>
              </div>
              <div className="p-3">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">SKU / Código de barras</label>
                <div className="relative">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    ref={scannerInputRef}
                    type="text"
                    value={scanner}
                    onChange={e => setScanner(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScan()}
                    placeholder="Escanea o ingresa manualmente"
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Desktop: original layout */}
            <div className="hidden sm:block p-4 lg:p-5">
              <p className="text-base font-semibold text-neutral-800 mb-3">
                Escanear código de barras
              </p>
              <div className="flex flex-row gap-2">
                <div className="relative flex-1">
                  <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={scanner}
                    onChange={e => setScanner(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScan()}
                    placeholder="Ingresa o escanea SKU / Código de barras"
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleScan}
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                >
                  Registrar
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Presiona{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[11px] font-mono border border-neutral-200">Enter</kbd>{" "}
                o haz clic en <span className="font-semibold text-neutral-600">Registrar</span> para escanear una unidad.
              </p>
            </div>
          </div>
        )}

        {/* ── Progreso de conteo (solo visible mientras OR abierta) ── */}
        {!orCerrada && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-neutral-800">Progreso de conteo</span>
            <span className="text-sm font-bold text-neutral-700 tabular-nums">
              {stats.totalContadas.toLocaleString("es-CL")}/{stats.totalEsperadas.toLocaleString("es-CL")}
              <span className="ml-1 text-neutral-500 font-normal">({stats.pct}%)</span>
            </span>
          </div>
          <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.pct === 100 ? "bg-green-500" :
                stats.conDiferencias > 0 ? "bg-amber-400" : "bg-primary-500"
              }`}
              style={{ width: `${stats.pct}%` }}
            />
          </div>

          {/* Summary chips */}
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
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                {stats.pendientes} pendientes
              </span>
            )}
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

          {/* Per-product breakdown table (collapsible) */}
          {products.length > 0 && (
            <div className="mt-4">
              {showProductTable && (
                <div className="border border-neutral-100 rounded-lg overflow-hidden mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-500 text-left">
                        <th className="px-3 py-2 font-medium">SKU</th>
                        <th className="px-3 py-2 font-medium">Producto</th>
                        <th className="px-3 py-2 font-medium text-right">Esperado</th>
                        <th className="px-3 py-2 font-medium text-right">Contado</th>
                        <th className="px-3 py-2 font-medium text-right">Diferencia</th>
                        <th className="px-3 py-2 font-medium text-right">Incidencias</th>
                        <th className="px-3 py-2 font-medium text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {products.map(p => {
                        const total      = totalPP[p.id] ?? 0;
                        const diff       = total - p.esperadas;
                        const incCount   = (incidencias[p.id] ?? []).reduce((s, r) => s + r.cantidad, 0);
                        const status     = getProductStatus(total, p.esperadas);
                        const statusConf = {
                          completo:   { label: "Completo",   cls: "bg-green-50 text-green-700" },
                          diferencia: { label: "Diferencia", cls: "bg-amber-50 text-amber-700" },
                          exceso:     { label: "Exceso",     cls: "bg-orange-50 text-orange-700" },
                          pendiente:  { label: "Pendiente",  cls: "bg-neutral-50 text-neutral-500" },
                        }[status];
                        return (
                          <tr key={p.id} className="hover:bg-neutral-50/50">
                            <td className="px-3 py-2 text-neutral-500 font-mono">{p.sku}</td>
                            <td className="px-3 py-2 text-neutral-800 max-w-[180px] truncate">{p.nombre}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-neutral-600">{p.esperadas}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-neutral-800">{total}</td>
                            <td className={`px-3 py-2 text-right tabular-nums font-semibold ${
                              diff === 0 ? "text-green-600" : diff > 0 ? "text-orange-600" : "text-red-600"
                            }`}>
                              {diff === 0 ? "—" : (diff > 0 ? "+" : "") + diff}
                            </td>
                            <td className={`px-3 py-2 text-right tabular-nums ${incCount > 0 ? "text-red-600 font-semibold" : "text-neutral-400"}`}>
                              {incCount > 0 ? incCount : "—"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConf.cls}`}>
                                {statusConf.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowProductTable(v => !v)}
                  iconRight={showProductTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                >
                  {showProductTable ? "Ocultar detalle" : "Ver detalle de productos"}
                </Button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* ── OR closed result banner ── */}
        {orCerrada && (() => {
          const sinDif = orEstado === "Completado sin diferencias";
          return (
            <div className={`rounded-xl px-4 py-4 border ${
              sinDif ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-3 sm:items-center sm:gap-4">
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
                  <span className={`sm:hidden inline-flex mt-2 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    sinDif ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {orEstado}
                  </span>
                </div>
                <span className={`hidden sm:inline-flex flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  sinDif ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {orEstado}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── Resumen (OR cerrada) ── */}
        {orCerrada && (
          <ResumenOR
            id={id} baseData={baseData} orEstado={orEstado}
            sesiones={sesiones} products={products}
            incidencias={incidencias} acumulado={acumulado}
            OPERADOR={OPERADOR}
          />
        )}

        {/* ── Products container (hidden when OR closed — ResumenOR has details) ── */}
        {!orCerrada && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            {products.length === 0 ? (
              <div className="p-12 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-neutral-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Sin productos</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Agrega los productos que llegaron en esta OR.</p>
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
            <div className="border-t border-dashed border-neutral-200">
              <button onClick={() => setAddProductFlow("choice")} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-neutral-400 hover:text-primary-500 hover:bg-primary-50/50 transition-colors duration-300 font-medium">
                <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3 h-3" />
                </span>
                Añadir producto
              </button>
            </div>
          </div>
        )}

        {/* ── Gestión de cuarentena (OR cerrada con registros) ── */}
        {orCerrada && quarantineRecs.length > 0 && (
          <GestionCuarentena records={quarantineRecs} onUpdate={updateQuarantineRecord} incidencias={incidencias} />
        )}

        {/* ── Session history ── */}
        {sesiones.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-base font-semibold text-neutral-800">Historial de sesiones</span>
              <span className="text-sm text-neutral-400 tabular-nums">
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
        {!orCerrada && (<>
          {/* No-units alert */}
          {noUnitsAlert && (
            <div className="flex items-start gap-3 p-4 mb-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">No se puede terminar la recepción</p>
                <p className="text-sm text-amber-700 mt-0.5">Debes ingresar al menos una unidad en las sesiones de conteo antes de terminar la recepción.</p>
              </div>
              <button onClick={() => setNoUnitsAlert(false)} className="p-1 rounded hover:bg-amber-100 transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          )}

          {/* Desktop footer actions */}
          <div className="hidden lg:flex items-center justify-between pt-2 pb-8">
            <Button variant="secondary" size="lg" onClick={liberarSesion} disabled={!sesionActiva} iconLeft={<LockUnlocked01 className="w-4 h-4" />}>
              Liberar
            </Button>

            <button
              onClick={() => {
                if (terminarDisabled) return;
                if (stats.totalContadas === 0) { setNoUnitsAlert(true); return; }
                setNoUnitsAlert(false);
                setConfirmClose(true);
              }}
              disabled={terminarDisabled}
              title={
                sesiones.length === 0 ? "Registra al menos una sesión antes de terminar" :
                sesionActiva ? "Finaliza la sesión activa antes de terminar" : undefined
              }
              className={`flex items-center gap-2 px-5 py-2.5 border text-sm font-medium rounded-lg transition-colors duration-300 ${terminarClass}`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Terminar recepción
            </button>
          </div>
        </>)}

      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!orCerrada && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-30 lg:hidden">
          {sesionActiva ? (
            <div className="flex items-center gap-2 relative">
              {/* More menu + session counter */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setShowStickyMenu(m => !m)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-semibold text-neutral-400 tabular-nums">{stats.totalSesionAct} uds</span>
              </div>

              {/* Primary: Escanear unidad */}
              <button
                onClick={() => {
                  scannerInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => scannerInputRef.current?.focus(), 400);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors duration-300"
              >
                <ScanBarcode className="w-4 h-4" />
                Escanear unidad
              </button>

              {/* Popover menu */}
              {showStickyMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStickyMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50">
                    <button
                      onClick={() => { setShowStickyMenu(false); liberarSesion(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <LockUnlocked01 className="w-4 h-4 text-neutral-400" />
                      Liberar sesión
                    </button>
                    <button
                      onClick={() => { setShowStickyMenu(false); finalizarSesion(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <StopCircle className="w-4 h-4" />
                      Finalizar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={iniciarSesion}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
              >
                <PlayCircle className="w-4 h-4" />
                Iniciar sesión de conteo
              </button>
              {sesiones.length > 0 && (
                <button
                  onClick={() => {
                    if (stats.totalContadas === 0) { setNoUnitsAlert(true); return; }
                    setNoUnitsAlert(false);
                    setConfirmClose(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors duration-300"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Terminar recepción
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
