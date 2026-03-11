"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, Suspense, useRef, useCallback } from "react";
import { useColumnConfig, type ColumnKey } from "@/hooks/useColumnConfig";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download01, Sliders01, LayoutGrid01, SearchLg, QrCode02,
  DotsVertical, CheckCircle, AlertTriangle, XCircle, ClockRefresh, InfoCircle, X,
  SwitchVertical01, ArrowUp, ArrowDown, Plus, ChevronDown, ChevronLeft, ChevronRight,
  CalendarPlus01, PackageCheck, Play, ClipboardCheck, FastForward,
  Eye, Edit01, SlashCircle01, LockUnlocked01,
} from "@untitled-ui/icons-react";
import StatusBadge, { Status } from "@/components/recepciones/StatusBadge";
import Button from "@/components/ui/Button";
import QrScannerModal from "@/components/recepciones/QrScannerModal";

// ─── Types ────────────────────────────────────────────────────────────────────
/** Feature 4: multi-label resultado tags (aparecen solo en "Completada") */
type ResultTag = {
  Icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  className: string;
};

type Orden = {
  id: string;
  creacion: string;       // "DD/MM/YYYY"
  fechaAgendada: string;  // "DD/MM/YYYY HH:MM" | "—"
  fechaExtra?: string;
  seller: string;         // Seller / tienda
  sucursal: string;
  estado: Status;
  skus: number;
  uTotales: string;
  tags?: ResultTag[];     // Feature 4: tags de resultado (Completada)
  isSubId?: boolean;      // Feature 2: sub-ID (RO-XXX-P1)
  pallets?: number;       // Seller-declared pallets (for "Programado" ORs)
  bultos?: number;        // Seller-declared bultos (for "Programado" ORs)
  comentarios?: string;   // Optional comment entered when creating the OR (read-only in modals)
};

type SortField = "creacion" | "fechaAgendada" | null;
type SortDir   = "asc" | "desc";

// ─── Feature 4: Result tag builder ────────────────────────────────────────────
function makeTags(opts: {
  sinDiferencias?: number;
  conDiferencias?: number;
  noPickeables?: number;
  pendiente?: boolean;
}): ResultTag[] {
  const tags: ResultTag[] = [];
  if (opts.sinDiferencias)
    tags.push({ Icon: CheckCircle,    iconClass: "text-green-600",  label: `${opts.sinDiferencias.toLocaleString("es-CL")} sin diferencias`, className: "bg-green-50 text-green-700 border border-green-200" });
  if (opts.conDiferencias)
    tags.push({ Icon: AlertTriangle,  iconClass: "text-amber-500",  label: `${opts.conDiferencias} con diferencias`,      className: "bg-amber-50 text-amber-700 border border-amber-200" });
  if (opts.noPickeables)
    tags.push({ Icon: XCircle,        iconClass: "text-red-500",    label: `${opts.noPickeables} no pickeables`,          className: "bg-red-50 text-red-600 border border-red-200" });
  if (opts.pendiente)
    tags.push({ Icon: ClockRefresh,   iconClass: "text-orange-500", label: "Pendiente de aprobación",                     className: "bg-orange-50 text-orange-600 border border-orange-200" });
  return tags;
}

// ─── Tag filter options (for filter modal) ────────────────────────────────────
const TAG_FILTER_OPTIONS: {
  label: string;
  key: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}[] = [
  { label: "Sin diferencias",         key: "sin diferencias",         Icon: CheckCircle,   iconClass: "text-green-600" },
  { label: "Con diferencias",         key: "con diferencias",         Icon: AlertTriangle, iconClass: "text-amber-500" },
  { label: "No pickeables",           key: "no pickeables",           Icon: XCircle,       iconClass: "text-red-500"   },
  { label: "Pendiente de aprobación", key: "pendiente de aprobación", Icon: ClockRefresh,  iconClass: "text-orange-500"},
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ORDENES: Orden[] = [
  // ─── Creado — sin fecha agendada aún ─────────────────────────────────────────
  { id: "RO-BARRA-191", creacion: "01/03/2026", fechaAgendada: "—", seller: "Extra Life", sucursal: "Quilicura", estado: "Creado", skus: 5, uTotales: "100" },
  { id: "RO-BARRA-192", creacion: "08/03/2026", fechaAgendada: "—", seller: "NutriPro", sucursal: "Providencia", estado: "Creado", skus: 12, uTotales: "640" },
  { id: "RO-BARRA-193", creacion: "09/03/2026", fechaAgendada: "—", seller: "BioNature", sucursal: "Las Condes", estado: "Creado", skus: 8, uTotales: "380", comentarios: "Primer envío del seller, coordinar recepción con KAM Carolina." },
  { id: "RO-BARRA-210", creacion: "10/03/2026", fechaAgendada: "—", seller: "Gohard", sucursal: "Lo Barnechea", estado: "Creado", skus: 3, uTotales: "150" },

  // ─── Programado ──────────────────────────────────────────────────────────────
  { id: "RO-BARRA-183", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "Extra Life", sucursal: "Quilicura", estado: "Programado", skus: 320, uTotales: "2.550", pallets: 10, bultos: 32, comentarios: "Llegará en un camión blanco patente XXNN33, preguntar por Carlos." },
  { id: "RO-BARRA-182", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", fechaExtra: "Expirado hace 4 horas", seller: "Extra Life", sucursal: "La Reina", estado: "Programado", skus: 320, uTotales: "2.550", pallets: 8, bultos: 28 },
  { id: "RO-BARRA-190", creacion: "17/02/2026", fechaAgendada: "21/02/2026 09:00", fechaExtra: "Expira en 28 minutos", seller: "Le Vice", sucursal: "Lo Barnechea", estado: "Programado", skus: 15, uTotales: "450", pallets: 3, bultos: 15, comentarios: "Entrega parcial, solo 2 pallets llegarán hoy. El resto el miércoles." },
  { id: "RO-BARRA-194", creacion: "07/03/2026", fechaAgendada: "11/03/2026 10:00", seller: "VitaFit", sucursal: "Quilicura", estado: "Programado", skus: 24, uTotales: "1.800", pallets: 6, bultos: 18, comentarios: "Incluye 4 pallets de colágeno que requieren temperatura controlada." },
  { id: "RO-BARRA-195", creacion: "06/03/2026", fechaAgendada: "12/03/2026 14:30", seller: "NutriPro", sucursal: "La Reina", estado: "Programado", skus: 18, uTotales: "960", pallets: 4, bultos: 12 },
  { id: "RO-BARRA-211", creacion: "09/03/2026", fechaAgendada: "13/03/2026 11:00", seller: "BioNature", sucursal: "Santiago Centro", estado: "Programado", skus: 9, uTotales: "420", pallets: 2, bultos: 6 },

  // ─── Recepcionado en bodega ──────────────────────────────────────────────────
  { id: "RO-BARRA-180", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Recepcionado en bodega", skus: 2, uTotales: "200" },
  { id: "RO-BARRA-196", creacion: "05/03/2026", fechaAgendada: "09/03/2026 09:00", seller: "BioNature", sucursal: "Lo Barnechea", estado: "Recepcionado en bodega", skus: 10, uTotales: "520", pallets: 2, bultos: 8, comentarios: "Bultos paletizados, descargar con grúa horquilla." },
  { id: "RO-BARRA-197", creacion: "04/03/2026", fechaAgendada: "08/03/2026 11:00", seller: "Extra Life", sucursal: "Providencia", estado: "Recepcionado en bodega", skus: 6, uTotales: "310" },

  // ─── En proceso de conteo ────────────────────────────────────────────────────
  { id: "RO-BARRA-184", creacion: "15/02/2026", fechaAgendada: "19/02/2026 10:00", seller: "Extra Life", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-179", creacion: "14/02/2026", fechaAgendada: "18/02/2026 09:00", seller: "Gohard", sucursal: "La Reina", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-185", creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", seller: "Gohard", sucursal: "Lo Barnechea", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-198", creacion: "03/03/2026", fechaAgendada: "07/03/2026 08:30", seller: "VitaFit", sucursal: "Santiago Centro", estado: "En proceso de conteo", skus: 15, uTotales: "1.120" },

  // ─── Pendiente de aprobación — esperando supervisor ──────────────────────────
  { id: "RO-BARRA-187", creacion: "10/02/2026", fechaAgendada: "14/02/2026 13:00", seller: "Le Vice", sucursal: "La Reina", estado: "Pendiente de aprobación", skus: 320, uTotales: "2.550",
    tags: makeTags({ conDiferencias: 20 }) },
  { id: "RO-BARRA-199", creacion: "02/03/2026", fechaAgendada: "06/03/2026 10:00", seller: "NutriPro", sucursal: "Las Condes", estado: "Pendiente de aprobación", skus: 14, uTotales: "780",
    tags: makeTags({ conDiferencias: 45, noPickeables: 12 }) },
  { id: "RO-BARRA-212", creacion: "08/03/2026", fechaAgendada: "10/03/2026 09:30", seller: "Gohard", sucursal: "Providencia", estado: "Pendiente de aprobación", skus: 22, uTotales: "1.340",
    tags: makeTags({ conDiferencias: 8, noPickeables: 3 }) },

  // ─── Cancelado ───────────────────────────────────────────────────────────────
  { id: "RO-BARRA-188", creacion: "12/02/2026", fechaAgendada: "16/02/2026 11:30", seller: "Extra Life", sucursal: "Santiago Centro", estado: "Cancelado", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-213", creacion: "20/02/2026", fechaAgendada: "24/02/2026 10:00", seller: "Le Vice", sucursal: "Providencia", estado: "Cancelado", skus: 7, uTotales: "280", comentarios: "Seller canceló envío por falta de stock." },

  // ─── Completado con diferencias ──────────────────────────────────────────────
  { id: "RO-BARRA-186", creacion: "11/02/2026", fechaAgendada: "15/02/2026 08:00", seller: "Extra Life", sucursal: "Quilicura", estado: "Completado con diferencias", skus: 320, uTotales: "2.550",
    tags: makeTags({ sinDiferencias: 2510, conDiferencias: 20, noPickeables: 20 }) },
  { id: "RO-BARRA-201", creacion: "25/02/2026", fechaAgendada: "01/03/2026 09:00", seller: "VitaFit", sucursal: "La Reina", estado: "Completado con diferencias", skus: 20, uTotales: "1.540",
    tags: makeTags({ sinDiferencias: 1480, conDiferencias: 36, noPickeables: 24 }) },
  { id: "RO-BARRA-214", creacion: "18/02/2026", fechaAgendada: "22/02/2026 14:00", seller: "NutriPro", sucursal: "Lo Barnechea", estado: "Completado con diferencias", skus: 16, uTotales: "890",
    tags: makeTags({ sinDiferencias: 840, conDiferencias: 32, noPickeables: 18 }) },

  // ─── Completado sin diferencias ──────────────────────────────────────────────
  { id: "RO-BARRA-189", creacion: "09/02/2026", fechaAgendada: "13/02/2026 15:30", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Completado sin diferencias", skus: 320, uTotales: "2.550",
    tags: makeTags({ sinDiferencias: 2550 }) },
  { id: "RO-BARRA-200", creacion: "28/02/2026", fechaAgendada: "04/03/2026 15:00", seller: "BioNature", sucursal: "Quilicura", estado: "Completado sin diferencias", skus: 10, uTotales: "520",
    tags: makeTags({ sinDiferencias: 520 }) },
  { id: "RO-BARRA-215", creacion: "22/02/2026", fechaAgendada: "26/02/2026 08:30", seller: "Gohard", sucursal: "Las Condes", estado: "Completado sin diferencias", skus: 28, uTotales: "2.100",
    tags: makeTags({ sinDiferencias: 2100 }) },

  // ─── Adicionales ────────────────────────────────────────────────────────────
  { id: "RO-BARRA-216", creacion: "05/03/2026", fechaAgendada: "—", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Creado", skus: 14, uTotales: "720", comentarios: "Seller solicita recepción urgente esta semana." },
  { id: "RO-BARRA-217", creacion: "02/03/2026", fechaAgendada: "10/03/2026 08:00", seller: "Extra Life", sucursal: "Lo Barnechea", estado: "Programado", skus: 42, uTotales: "3.200", pallets: 12, bultos: 40, comentarios: "Camión refrigerado, requiere andén 3." },
  { id: "RO-BARRA-218", creacion: "01/03/2026", fechaAgendada: "06/03/2026 15:00", seller: "VitaFit", sucursal: "Las Condes", estado: "Recepcionado en bodega", skus: 19, uTotales: "1.450", pallets: 5, bultos: 14 },
  { id: "RO-BARRA-219", creacion: "27/02/2026", fechaAgendada: "03/03/2026 10:30", seller: "NutriPro", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 36, uTotales: "2.840", comentarios: "Conteo parcial, faltan 8 SKUs por verificar." },
  { id: "RO-BARRA-220", creacion: "26/02/2026", fechaAgendada: "02/03/2026 09:00", seller: "BioNature", sucursal: "La Reina", estado: "Pendiente de aprobación", skus: 11, uTotales: "610",
    tags: makeTags({ conDiferencias: 15 }) },
  { id: "RO-BARRA-221", creacion: "24/02/2026", fechaAgendada: "28/02/2026 14:00", seller: "Gohard", sucursal: "Providencia", estado: "Cancelado", skus: 5, uTotales: "200", comentarios: "Proveedor no se presentó en la fecha acordada." },
  { id: "RO-BARRA-222", creacion: "23/02/2026", fechaAgendada: "27/02/2026 11:00", seller: "Le Vice", sucursal: "Lo Barnechea", estado: "Completado con diferencias", skus: 30, uTotales: "2.200",
    tags: makeTags({ sinDiferencias: 2050, conDiferencias: 95, noPickeables: 55 }) },
  { id: "RO-BARRA-223", creacion: "21/02/2026", fechaAgendada: "25/02/2026 16:00", seller: "Extra Life", sucursal: "Las Condes", estado: "Completado sin diferencias", skus: 18, uTotales: "1.360",
    tags: makeTags({ sinDiferencias: 1360 }) },
  { id: "RO-BARRA-224", creacion: "04/03/2026", fechaAgendada: "09/03/2026 12:00", seller: "VitaFit", sucursal: "Providencia", estado: "Recepcionado en bodega", skus: 8, uTotales: "480", pallets: 2, bultos: 5, comentarios: "Productos frágiles, manipular con cuidado." },
  { id: "RO-BARRA-225", creacion: "07/03/2026", fechaAgendada: "—", seller: "NutriPro", sucursal: "La Reina", estado: "Creado", skus: 21, uTotales: "1.580" },
];

// ─── Tabs — alineados con estados del Notion spec ─────────────────────────────
const TABS = [
  "Todas",
  "Creado",
  "Programado",
  "Recepción en bodega",
  "En proceso de conteo",
  "Parcialmente recepcionada",
  "Completada sin diferencias",
  "Completada con diferencias",
  "Cancelada",
] as const;

const TAB_STATUS: Record<string, Status | null> = {
  "Todas":                        null,
  "Creado":                       "Creado",
  "Programado":                   "Programado",
  "Recepción en bodega":          "Recepcionado en bodega",
  "En proceso de conteo":         "En proceso de conteo",
  "Parcialmente recepcionada":    "Pendiente de aprobación",
  "Completada sin diferencias":   "Completado sin diferencias",
  "Completada con diferencias":   "Completado con diferencias",
  "Cancelada":                    "Cancelado",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };


function parseDate(str: string): number {
  if (str === "—") return 0;
  const [dp, tp = "00:00"] = str.split(" ");
  const [d, m, y] = dp.split("/").map(Number);
  const [h, min]  = tp.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

function SortIcon({ field, sortField, sortDir }: {
  field: SortField; sortField: SortField; sortDir: SortDir;
}) {
  if (sortField !== field) return <SwitchVertical01 className="w-3 h-3 text-neutral-400 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp   className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />;
}

// Sticky shadow for the Acciones column
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

// ─── Badge helper for fechaExtra ──────────────────────────────────────────────
function fechaExtraClass(label: string): string {
  const lower = label.toLowerCase();
  if (lower.startsWith("expirado")) return "bg-red-50 text-red-600";
  // "Expira en X minutos" → less than 1 hour → warning
  if (lower.includes("minutos") || lower.includes("min ")) return "bg-amber-50 text-amber-600";
  return "bg-orange-50 text-orange-500";
}

// ─── Feature 1 · Feature Antigua — Contextual actions per status ──────────────
type MenuItem = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  href?: string;
};
type PrimaryAction = {
  tooltip: string;                                         // 1-2 words shown on hover
  icon: React.ComponentType<{ className?: string }>;
  href?: string;                                           // navigation target (uses Link)
};
type ActionConfig = { primary?: PrimaryAction; menu: MenuItem[] };

function getActions(estado: Status, id: string): ActionConfig {
  switch (estado) {
    case "Creado":
      return {
        primary: { tooltip: "Agendar", icon: CalendarPlus01, href: "/recepciones/crear?startStep=2" },
        menu: [
          { label: "Ver",      icon: Eye },
          { label: "Editar",   icon: Edit01 },
          { label: "Cancelar", icon: SlashCircle01, danger: true },
        ],
      };
    case "Programado":
      return {
        primary: { tooltip: "Recibir", icon: PackageCheck },
        menu: [
          { label: "Ver",       icon: Eye },
          { label: "Editar",    icon: Edit01 },
          { label: "Reagendar", icon: CalendarPlus01, href: "/recepciones/crear?startStep=3&mode=reagendar" },
          { label: "Cancelar",  icon: SlashCircle01, danger: true },
        ],
      };
    case "Recepcionado en bodega":
      return {
        primary: { tooltip: "Empezar conteo", icon: Play, href: `/recepciones/${encodeURIComponent(id)}` },
        menu: [
          { label: "Ver",      icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
          { label: "Editar",   icon: Edit01 },
          { label: "Cancelar", icon: SlashCircle01, danger: true },
        ],
      };
    case "En proceso de conteo":
      return {
        primary: { tooltip: "Continuar", icon: ClipboardCheck, href: `/recepciones/${encodeURIComponent(id)}` },
        menu: [
          { label: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        ],
      };
    case "Pendiente de aprobación":
      return {
        primary: { tooltip: "Revisar", icon: ClipboardCheck, href: `/recepciones/${encodeURIComponent(id)}` },
        menu: [
          { label: "Ver",                      icon: Eye,            href: `/recepciones/${encodeURIComponent(id)}` },
          { label: "Aprobar con diferencias",  icon: CheckCircle },
          { label: "Devolver a conteo",        icon: LockUnlocked01 },
        ],
      };
    default: // Completado sin diferencias, Completado con diferencias, Cancelado
      return { menu: [{ label: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` }] };
  }
}

// ─── Recibir Modal ────────────────────────────────────────────────────────────
function RecebirModal({ orden, onCancel, onConfirm }: {
  orden: Orden;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [palletsRecibidos, setPalletsRecibidos] = useState<string>("");
  const [bultosRecibidos,  setBultosRecibidos]  = useState<string>("");

  const declaredPallets = orden.pallets ?? 0;
  const declaredBultos  = orden.bultos  ?? 0;
  const hasValues       = palletsRecibidos !== "" && bultosRecibidos !== "";
  const parsedPallets   = parseInt(palletsRecibidos) || 0;
  const parsedBultos    = parseInt(bultosRecibidos)  || 0;
  const palletsMatch    = palletsRecibidos !== "" && parsedPallets === declaredPallets;
  const bultosMatch     = bultosRecibidos  !== "" && parsedBultos  === declaredBultos;
  const hasDiff         = hasValues && (!palletsMatch || !bultosMatch);

  const maxPallets = Math.max(50, declaredPallets * 2);
  const maxBultos  = Math.max(500, declaredBultos  * 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <h3 className="text-xl font-bold text-neutral-900">
            Recibir Orden <span className="font-mono">#{orden.id}</span>
          </h3>
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300 ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4">
          <p className="text-sm font-semibold text-neutral-800">Detalles de la recepción:</p>

          {/* Info card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1 bg-neutral-50 rounded-xl px-4 py-2">
              <p className="text-[11px] text-neutral-400 mb-1 uppercase tracking-wider font-medium">Seller</p>
              <p className="text-sm font-bold text-neutral-900 truncate">{orden.seller}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl px-4 py-2">
              <p className="text-[11px] text-neutral-400 mb-1 uppercase tracking-wider font-medium">Estado</p>
              <StatusBadge status={orden.estado} />
            </div>
            <div className="bg-neutral-50 rounded-xl px-4 py-2">
              <p className="text-[11px] text-neutral-400 mb-1 uppercase tracking-wider font-medium">Fecha programada</p>
              <p className="text-sm font-semibold text-neutral-700 whitespace-nowrap">{orden.fechaAgendada}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl px-4 py-2">
              <p className="text-[11px] text-neutral-400 mb-1 uppercase tracking-wider font-medium">Pallets</p>
              <p className="text-sm font-bold text-neutral-900">{declaredPallets}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl px-4 py-2">
              <p className="text-[11px] text-neutral-400 mb-1 uppercase tracking-wider font-medium">Bultos</p>
              <p className="text-sm font-bold text-neutral-900">{declaredBultos}</p>
            </div>
          </div>

          {/* Comentarios (read-only, from OR creation) */}
          {orden.comentarios && (
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">
                Comentarios adicionales
              </label>
              <div className="w-full px-3 py-2.5 border border-neutral-100 rounded-lg text-sm text-neutral-600 bg-neutral-50 min-h-[72px]">
                {orden.comentarios}
              </div>
            </div>
          )}

          {/* Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 font-medium mb-1.5">Cantidad de pallets</label>
              <div className="relative">
                <select
                  value={palletsRecibidos}
                  onChange={e => setPalletsRecibidos(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white pr-9"
                >
                  <option value="">Seleccione</option>
                  {Array.from({ length: maxPallets + 1 }, (_, i) => (
                    <option key={i} value={String(i)}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 font-medium mb-1.5">Cantidad de bultos</label>
              <div className="relative">
                <select
                  value={bultosRecibidos}
                  onChange={e => setBultosRecibidos(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white pr-9"
                >
                  <option value="">Seleccione</option>
                  {Array.from({ length: maxBultos + 1 }, (_, i) => (
                    <option key={i} value={String(i)}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mismatch warning */}
          {hasDiff && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                Hay diferencias entre lo declarado y lo recibido. Puedes continuar de todas formas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 mt-2 border-t border-neutral-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 font-medium transition-colors duration-300"
          >
            Cerrar
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasValues}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-300 flex items-center gap-2 ${
              hasValues
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar recepción
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Actions cell ─────────────────────────────────────────────────────────────
function ActionsCell({ orden, onPrimaryAction }: { orden: Orden; onPrimaryAction?: () => void }) {
  const router        = useRouter();
  const [menuPos,    setMenuPos]    = useState<{ top: number; right: number } | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const dotsRef       = useRef<HTMLButtonElement>(null);
  const primaryWrap   = useRef<HTMLDivElement>(null);
  const { primary, menu } = getActions(orden.estado, orden.id);
  const Icon = primary?.icon;

  // Portal only works client-side
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!menuPos) return;
    function onDocClick() { setMenuPos(null); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuPos]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuPos) { setMenuPos(null); return; }
    if (dotsRef.current) {
      const rect = dotsRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  };

  const tipPos = tipVisible && primaryWrap.current
    ? (() => {
        const r = primaryWrap.current!.getBoundingClientRect();
        return { top: r.top - 34, left: r.left + r.width / 2 };
      })()
    : null;

  const btnCls = "flex items-center justify-center p-1.5 font-medium whitespace-nowrap transition-colors duration-200 outline-none select-none rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200";

  return (
    <div className="flex items-center gap-1">
      {primary && Icon && (
        <div
          ref={primaryWrap}
          onMouseEnter={() => setTipVisible(true)}
          onMouseLeave={() => setTipVisible(false)}
        >
          {primary.href ? (
            <Link href={primary.href} className={btnCls}>
              <Icon className="w-4 h-4" />
            </Link>
          ) : (
            <button className={btnCls} onClick={onPrimaryAction}>
              <Icon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <button
        ref={dotsRef}
        onClick={toggleMenu}
        className={`p-1.5 rounded-lg transition-colors duration-300 ${
          menuPos ? "bg-neutral-100 text-neutral-700" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        }`}
      >
        <DotsVertical className="w-4 h-4" />
      </button>

      {/* ── Tooltip — portal to body so sticky/overflow never clips it ── */}
      {mounted && tipPos && primary && createPortal(
        <div
          style={{
            position: "fixed",
            top:  tipPos.top,
            left: tipPos.left,
            transform: "translateX(-50%)",
            zIndex: 2147483647,
            pointerEvents: "none",
          }}
        >
          <div className="bg-neutral-900 text-white text-xs font-medium px-2 py-1 rounded-lg" style={NW}>
            {primary.tooltip}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900" />
        </div>,
        document.body
      )}

      {/* ── Dropdown — portal to body so table rows never stack above it ── */}
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
                onClick={() => { setMenuPos(null); if (item.href) router.push(item.href); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
                } ${hasSeparator ? "border-t border-neutral-100 mt-1 pt-2.5" : ""}`}
              >
                {ItemIcon && (
                  <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-400"}`} />
                )}
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

// ─── Filter Section component (accordion) ────────────────────────────────────
function FilterSection({
  title,
  options,
  selected,
  onToggle,
  renderOption,
  defaultOpen = true,
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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full group"
      >
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold leading-none">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className={`space-y-1 mt-2 ${scrollable ? "overflow-y-auto max-h-[176px] pr-1 filter-scroll" : ""}`}>
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors duration-300 group"
            >
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
              />
              {renderOption ? renderOption(opt) : (
                <span className="text-sm text-neutral-700">{opt}</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inner page (needs useSearchParams → must be inside Suspense) ─────────────
function OrdenesPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  // ── Column config (from localStorage, updated by editor page) ──
  const { colOrder, colVisible } = useColumnConfig();
  const activeColumns = colOrder.filter(k => colVisible.includes(k));

  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabsDragRef   = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [showLeftArrow, setShowLeftArrow]   = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [activeTab,         setActiveTab]         = useState<string>("Todas");
  const [showToast,         setShowToast]         = useState(false);
  const [toastMsg,          setToastMsg]          = useState({ title: "", subtitle: "" });
  const [showInfo,          setShowInfo]          = useState(false);
  const [showFilters,       setShowFilters]       = useState(false);
  const [search,            setSearch]            = useState("");
  const [orStatusOverrides, setOrStatusOverrides] = useState<Record<string, Status>>({});
  const [recibirOrden,      setRecibirOrden]      = useState<Orden | null>(null);
  const [createdOrs,        setCreatedOrs]        = useState<Orden[]>([]);
  const [showQrScanner,     setShowQrScanner]     = useState(false);
  const [cardMenuId,        setCardMenuId]        = useState<string | null>(null);
  const [bottomMenuOpen,    setBottomMenuOpen]    = useState(false);

  // Close card menu / bottom menu on outside click
  useEffect(() => {
    if (!cardMenuId && !bottomMenuOpen) return;
    const close = () => { setCardMenuId(null); setBottomMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [cardMenuId, bottomMenuOpen]);

  // Read per-OR status overrides + created ORs from localStorage
  useEffect(() => {
    const overrides: Record<string, Status> = {};

    // Overrides for static mock ORs
    for (const orden of ORDENES) {
      try {
        const stored = localStorage.getItem(`amplifica_or_${orden.id}`);
        if (stored) {
          const { estado } = JSON.parse(stored) as { estado: Status };
          if (estado) overrides[orden.id] = estado;
        }
      } catch { /* ignore */ }
    }

    // Read ORs created via /recepciones/crear
    try {
      const raw = localStorage.getItem("amplifica_created_ors");
      if (raw) {
        const parsed = JSON.parse(raw) as Orden[];
        // Also apply any state-override saved for these ORs
        for (const or of parsed) {
          try {
            const stored = localStorage.getItem(`amplifica_or_${or.id}`);
            if (stored) {
              const { estado } = JSON.parse(stored) as { estado: Status };
              if (estado) overrides[or.id] = estado;
            }
          } catch { /* ignore */ }
        }
        setCreatedOrs(parsed);
      }
    } catch { /* ignore */ }

    setOrStatusOverrides(overrides);

    // Show pending toast written by [id]/page.tsx after OR closure + redirect
    try {
      const pending = localStorage.getItem("amplifica_pending_toast");
      if (pending) {
        const { title, subtitle } = JSON.parse(pending) as { title: string; subtitle: string };
        localStorage.removeItem("amplifica_pending_toast");
        setToastMsg({ title, subtitle });
        setShowToast(true);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Filter state ──
  const [filterSellers,    setFilterSellers]    = useState<Set<string>>(new Set());
  const [filterSucursales, setFilterSucursales] = useState<Set<string>>(new Set());
  const [filterTagTypes,   setFilterTagTypes]   = useState<Set<string>>(new Set());

  // Merge created ORs with static data and apply localStorage overrides
  const ordenesEffective = useMemo(() =>
    [...createdOrs, ...ORDENES].map(o => orStatusOverrides[o.id] ? { ...o, estado: orStatusOverrides[o.id] } : o),
    [orStatusOverrides, createdOrs]
  );

  // ── QR scanner helpers ──
  const getOrInfo = useCallback((orId: string) => {
    const o = ordenesEffective.find(x => x.id === orId);
    if (!o) return undefined;
    return { id: o.id, seller: o.seller, sucursal: o.sucursal, fechaAgendada: o.fechaAgendada, estado: o.estado, skus: o.skus, uTotales: o.uTotales, pallets: o.pallets, bultos: o.bultos };
  }, [ordenesEffective]);

  const handleQrConfirm = useCallback((orId: string) => {
    // Persist the new estado to localStorage
    localStorage.setItem(`amplifica_or_${orId}`, JSON.stringify({ estado: "Recepcionado en bodega" }));
    setOrStatusOverrides(prev => ({ ...prev, [orId]: "Recepcionado en bodega" as Status }));
    setToastMsg({ title: "Orden recepcionada", subtitle: `${orId} cambió a Recepcionado en bodega` });
    setShowToast(true);
  }, []);

  // ── Filter options (unique values from data) ──
  const allSellers    = useMemo(() => [...new Set(ordenesEffective.map(o => o.seller))].sort(),    [ordenesEffective]);
  const allSucursales = useMemo(() => [...new Set(ordenesEffective.map(o => o.sucursal))].sort(), [ordenesEffective]);

  // ── Active filter count (for badge) ──
  const activeFilterCount = filterSellers.size + filterSucursales.size + filterTagTypes.size;

  // ── Toggle helper ──
  const toggleInSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilterSellers(new Set());
    setFilterSucursales(new Set());
    setFilterTagTypes(new Set());
  };

  // Mostrar toast al volver de crear o reagendar
  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setToastMsg({ title: "Orden de recepción programada", subtitle: "La orden ha sido creada correctamente" });
      setShowToast(true);
      router.replace("/recepciones");
    } else if (searchParams.get("rescheduled") === "1") {
      setToastMsg({ title: "Orden de recepción reagendada", subtitle: "La fecha y hora han sido actualizadas" });
      setShowToast(true);
      router.replace("/recepciones");
    }
  }, [searchParams, router]);

  // ── Sidebar global filters (synced via localStorage) ──
  const [sidebarSucursal, setSidebarSucursal] = useState<string | null>(null);
  const [sidebarSeller, setSidebarSeller]     = useState<string | null>(null);
  const [sidebarDateFrom, setSidebarDateFrom] = useState<string | null>(null);
  const [sidebarDateTo, setSidebarDateTo]     = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const s = localStorage.getItem("amplifica_filter_sucursal");
      const t = localStorage.getItem("amplifica_filter_seller");
      const df = localStorage.getItem("amplifica_filter_date_from");
      const dt = localStorage.getItem("amplifica_filter_date_to");
      setSidebarSucursal(s || null);
      setSidebarSeller(t || null);
      setSidebarDateFrom(df || null);
      setSidebarDateTo(dt || null);
    };
    sync();
    window.addEventListener("amplifica-filter-change", sync);
    return () => window.removeEventListener("amplifica-filter-change", sync);
  }, []);

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");
  const [pageSize,  setPageSize]  = useState(10);
  const [page,      setPage]      = useState(1);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let rows = [...ordenesEffective];
    const statusFilter = TAB_STATUS[activeTab];
    if (statusFilter) rows = rows.filter(o => o.estado === statusFilter);

    // ── Sidebar global filters ──
    if (sidebarSucursal) rows = rows.filter(o => o.sucursal === sidebarSucursal);
    if (sidebarSeller)   rows = rows.filter(o => o.seller === sidebarSeller);

    // ── Sidebar date range filter (creacion is DD/MM/YYYY, localStorage is YYYY-MM-DD) ──
    if (sidebarDateFrom || sidebarDateTo) {
      rows = rows.filter(o => {
        const [d, m, y] = o.creacion.split("/").map(Number);
        const iso = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        if (sidebarDateFrom && iso < sidebarDateFrom) return false;
        if (sidebarDateTo   && iso > sidebarDateTo)   return false;
        return true;
      });
    }

    // ── Apply multiselect filters ──
    if (filterSellers.size > 0)    rows = rows.filter(o => filterSellers.has(o.seller));
    if (filterSucursales.size > 0) rows = rows.filter(o => filterSucursales.has(o.sucursal));
    if (filterTagTypes.size > 0)   rows = rows.filter(o =>
      o.tags?.some(t =>
        [...filterTagTypes].some(ft => t.label.toLowerCase().includes(ft))
      ) ?? false
    );

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.seller.toLowerCase().includes(q) ||
        o.sucursal.toLowerCase().includes(q) ||
        o.estado.toLowerCase().includes(q) ||
        o.creacion.includes(q) ||
        o.fechaAgendada.includes(q) ||
        o.skus.toString().includes(q) ||
        o.uTotales.includes(q) ||
        (o.fechaExtra?.toLowerCase().includes(q) ?? false) ||
        (o.tags?.some(t => t.label.toLowerCase().includes(q)) ?? false)
      );
    }
    if (sortField) {
      rows.sort((a, b) => {
        const da = parseDate(sortField === "creacion" ? a.creacion : a.fechaAgendada);
        const db = parseDate(sortField === "creacion" ? b.creacion : b.fechaAgendada);
        return sortDir === "asc" ? da - db : db - da;
      });
    }
    return rows;
  }, [activeTab, search, sortField, sortDir, filterSellers, filterSucursales, filterTagTypes, ordenesEffective, sidebarSucursal, sidebarSeller, sidebarDateFrom, sidebarDateTo]);

  // Reset to page 1 whenever filters/tabs/search change
  useEffect(() => { setPage(1); }, [activeTab, search, sortField, sortDir, filterSellers, filterSucursales, filterTagTypes, pageSize]);

  // Detect tabs overflow → show/hide left/right arrows
  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const update = () => {
      setShowLeftArrow(el.scrollLeft > 4);
      setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  // Drag-to-scroll for tabs
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = tabsDragRef.current;
      if (!d.active || !tabsScrollRef.current) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 4) {
        d.moved = true;
        tabsScrollRef.current.scrollLeft = d.scrollLeft - dx;
      }
    };
    const onUp = () => { tabsDragRef.current.active = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Paginated slice ──
  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage  = Math.min(page, totalPages);
  const startIdx     = (clampedPage - 1) * pageSize;
  const paginatedRows = filtered.slice(startIdx, startIdx + pageSize);
  const fromRow      = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow        = Math.min(startIdx + pageSize, filtered.length);


  return (
    <div className="p-4 lg:p-6 min-w-0 pb-24 sm:pb-4 lg:pb-6">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-green-200 rounded-xl shadow-xl p-4 flex items-start gap-3 max-w-xs">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-800">{toastMsg.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{toastMsg.subtitle}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-neutral-400 hover:text-neutral-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Info modal ── */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onMouseDown={() => setShowInfo(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <InfoCircle className="w-5 h-5 text-primary-500" />
                </div>
                <h2 className="text-base font-semibold text-neutral-900">Órdenes de Recepción</h2>
              </div>
              <button onClick={() => setShowInfo(false)} className="text-neutral-400 hover:text-neutral-600 flex-shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Las <strong>Órdenes de Recepción (OR)</strong> gestionan la entrada de mercancía al centro de distribución. Cada OR registra el proceso completo: desde la programación de fecha de entrega hasta la verificación del inventario recibido.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-500">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Programa citas de descarga con horario</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Declara SKUs y unidades antes de la recepción</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Rastrea diferencias y productos no pickeables</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Recibir OR modal ── */}
      {recibirOrden && (
        <RecebirModal
          orden={recibirOrden}
          onCancel={() => setRecibirOrden(null)}
          onConfirm={() => {
            const targetId = recibirOrden.id;
            const newStatus: Status = "Recepcionado en bodega";
            try {
              localStorage.setItem(`amplifica_or_${targetId}`, JSON.stringify({ estado: newStatus }));
            } catch { /* ignore */ }
            setOrStatusOverrides(prev => ({ ...prev, [targetId]: newStatus }));
            setRecibirOrden(null);
            setToastMsg({
              title: "Orden recepcionada en bodega",
              subtitle: `${targetId} fue recibida y está lista para el conteo`,
            });
            setShowToast(true);
          }}
        />
      )}

      {/* ── Filter modal ── */}
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
                  <Sliders01 className="w-4 h-4 text-neutral-600" />
                </div>
                <h2 className="text-base font-semibold text-neutral-900">Filtros</h2>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              {/* Seller */}
              <FilterSection
                title="Seller"
                options={allSellers}
                selected={filterSellers}
                onToggle={v => toggleInSet(setFilterSellers, v)}
              />

              {/* Sucursales */}
              <FilterSection
                title="Sucursal"
                options={allSucursales}
                selected={filterSucursales}
                onToggle={v => toggleInSet(setFilterSucursales, v)}
              />

              {/* Tags de resultado */}
              <FilterSection
                title="Estado de productos"
                options={TAG_FILTER_OPTIONS.map(t => t.key)}
                selected={filterTagTypes}
                onToggle={v => toggleInSet(setFilterTagTypes, v)}
                renderOption={key => {
                  const opt = TAG_FILTER_OPTIONS.find(t => t.key === key);
                  if (!opt) return <span className="text-sm text-neutral-700">{key}</span>;
                  const OptIcon = opt.Icon;
                  return (
                    <span className="flex items-center gap-2">
                      <OptIcon className={`w-4 h-4 flex-shrink-0 ${opt.iconClass}`} />
                      <span className="text-sm text-neutral-700">{opt.label}</span>
                    </span>
                  );
                }}
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

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900" style={NW}>Órdenes de Recepción</h1>
          <button
            onClick={() => setShowInfo(true)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300"
          >
            <InfoCircle className="w-5 h-5" />
          </button>
          {/* Dots menu — mobile only (Exportar + Recepción sin agenda) */}
          <div className="relative sm:hidden ml-auto">
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setBottomMenuOpen(prev => !prev)}
              className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 ${
                bottomMenuOpen ? "bg-neutral-100 text-neutral-700" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              }`}
            >
              <DotsVertical className="w-5 h-5" />
            </button>
            {bottomMenuOpen && (
              <div
                onMouseDown={e => e.stopPropagation()}
                className="absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 min-w-[200px] z-50"
              >
                <button
                  onClick={() => { setBottomMenuOpen(false); /* export logic */ }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors duration-300"
                >
                  <Download01 className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                  Exportar
                </button>
                <Link
                  href="/recepciones/crear?mode=sin-agenda"
                  onClick={() => setBottomMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors duration-300"
                >
                  <Plus className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                  Recepción sin agenda
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div>
            <Button variant="tertiary" size="md" iconLeft={<Download01 className="w-4 h-4" />}>
              Exportar
            </Button>
          </div>
          <div className="hidden lg:block">
            <Button variant="secondary" href="/recepciones/crear?mode=sin-agenda">
              Recepción sin agenda
            </Button>
          </div>
          <div>
            <Button variant="secondary" iconLeft={<QrCode02 className="w-4 h-4" />} onClick={() => setShowQrScanner(true)}>
              Escanear QR
            </Button>
          </div>
          <Button variant="primary" href="/recepciones/crear" iconLeft={<Plus className="w-4 h-4" />}>
            Crear recepción
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 min-w-0">
        {/* ── Tabs: select on mobile, pill scroll on desktop ── */}
        <div className="relative flex-1 min-w-0">
          {/* Mobile: select dropdown */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              className="w-full appearance-none bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 pr-8 text-sm text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {TABS.map(tab => (
                <option key={tab} value={tab}>{tab}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          </div>

          {/* Desktop: pill tabs with horizontal scroll */}
          <div
            ref={tabsScrollRef}
            className="hidden sm:flex tabs-scroll items-center gap-1 overflow-x-auto pb-0.5 select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            onMouseDown={e => {
              const el = tabsScrollRef.current;
              if (!el) return;
              tabsDragRef.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
            }}
            onClickCapture={e => {
              if (tabsDragRef.current.moved) {
                e.stopPropagation();
                tabsDragRef.current.moved = false;
              }
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={NW}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-300 flex-shrink-0 ${
                  activeTab === tab ? "bg-neutral-900 text-white font-medium" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Left arrow */}
          {showLeftArrow && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent hidden sm:block" />
              <button
                onClick={() => tabsScrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                className="hidden sm:flex absolute inset-y-0 left-0 items-center justify-center w-8 text-neutral-500 hover:text-neutral-900 transition-colors duration-300"
                aria-label="Tabs anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Right arrow */}
          {showRightArrow && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent hidden sm:block" />
              <button
                onClick={() => tabsScrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
                className="hidden sm:flex absolute inset-y-0 right-0 items-center justify-center w-8 text-neutral-500 hover:text-neutral-900 transition-colors duration-300"
                aria-label="Ver más tabs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ── Filters button — opens filter modal ── */}
          <button
            onClick={() => setShowFilters(true)}
            className={`relative p-2.5 border border-transparent rounded-lg transition-colors duration-300 ${
              activeFilterCount > 0
                ? "bg-primary-50 text-primary-500 hover:bg-primary-100"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            <Sliders01 className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ lineHeight: 1 }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          <Link
            href="/recepciones/columnas"
            className="hidden sm:flex p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 items-center justify-center transition-colors duration-300"
            title="Editor de columnas"
          >
            <LayoutGrid01 className="w-4 h-4 text-neutral-500" />
          </Link>

          <div className="hidden sm:block relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar OR..."
              className="pl-9 pr-8 py-2 bg-neutral-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 w-52"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search — full width below toolbar */}
      <div className="sm:hidden relative mb-3">
        <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar OR..."
          className="w-full pl-9 pr-8 py-2.5 bg-neutral-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-neutral-500 font-medium">Filtros activos:</span>
          {[...filterSellers].map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full font-medium">
              {s}
              <button onClick={() => toggleInSet(setFilterSellers, s)} className="ml-0.5 text-primary-400 hover:text-primary-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {[...filterSucursales].map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full font-medium">
              {s}
              <button onClick={() => toggleInSet(setFilterSucursales, s)} className="ml-0.5 text-primary-400 hover:text-primary-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {[...filterTagTypes].map(k => {
            const opt = TAG_FILTER_OPTIONS.find(t => t.key === k);
            const ChipIcon = opt?.Icon;
            return (
              <span key={k} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full font-medium">
                {ChipIcon && <ChipIcon className={`w-3 h-3 ${opt?.iconClass}`} />}
                {opt?.label ?? k}
                <button onClick={() => toggleInSet(setFilterTagTypes, k)} className="ml-0.5 text-primary-400 hover:text-primary-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button onClick={clearAllFilters} className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2">
            Limpiar todo
          </button>
        </div>
      )}

      {/* ── Mobile card view ── */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl py-14 text-center text-sm text-neutral-400">
            No se encontraron órdenes{search ? ` para "${search}"` : ""}.
          </div>
        ) : (
          paginatedRows.map((orden, i) => {
            const actions = getActions(orden.estado, orden.id);
            const PrimaryIcon = actions.primary?.icon;
            return (
              <div
                key={`card-${orden.id}-${i}`}
                className="bg-white border border-neutral-200 rounded-2xl p-4"
              >
                {/* Row 1: ID + Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className="inline-block bg-neutral-100 text-neutral-700 rounded px-2 py-0.5 font-medium"
                    style={{ fontFamily: "var(--font-atkinson)", fontSize: "12px" }}
                  >
                    {orden.id}
                  </span>
                  <StatusBadge status={orden.estado} />
                </div>

                {/* Row 2: Tienda + Sucursal */}
                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="text-neutral-800 font-medium truncate">{orden.seller}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-500 truncate">{orden.sucursal}</span>
                </div>

                {/* Row 3: Fecha agendada */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-400 flex-shrink-0">
                    <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {orden.fechaAgendada === "—" ? (
                    <span className="text-neutral-400">Sin agendar</span>
                  ) : (
                    <span className="text-neutral-600">{orden.fechaAgendada}</span>
                  )}
                  {orden.fechaExtra && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${fechaExtraClass(orden.fechaExtra)}`}>
                      {orden.fechaExtra}
                    </span>
                  )}
                </div>

                {/* Row 4: SKUs + Unidades */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">SKUs</span>
                    <span className="text-neutral-700 font-semibold tabular-nums">{orden.skus}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Unidades</span>
                    <span className="text-neutral-700 font-semibold tabular-nums">{orden.uTotales}</span>
                  </div>
                </div>

                {/* Tags (if any) */}
                {orden.tags && orden.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {orden.tags.map(tag => {
                      const TagIcon = tag.Icon;
                      return (
                        <span
                          key={tag.label}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium ${tag.className}`}
                        >
                          <TagIcon className={`w-3 h-3 flex-shrink-0 ${tag.iconClass}`} />
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Actions footer */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                  {actions.primary && PrimaryIcon && (
                    actions.primary.href ? (
                      <Link
                        href={actions.primary.href}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                      >
                        <PrimaryIcon className="w-4 h-4" />
                        {actions.primary.tooltip}
                      </Link>
                    ) : (
                      <button
                        onClick={orden.estado === "Programado" ? () => setRecibirOrden(orden) : undefined}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                      >
                        <PrimaryIcon className="w-4 h-4" />
                        {actions.primary.tooltip}
                      </button>
                    )
                  )}
                  {/* When only "Ver" action → show "Ver detalle" button; otherwise dots menu */}
                  {!actions.primary && actions.menu.length === 1 && actions.menu[0].label === "Ver" ? (
                    <Link
                      href={actions.menu[0].href || `/recepciones/${encodeURIComponent(orden.id)}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalle
                    </Link>
                  ) : (
                    <div className="relative">
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => setCardMenuId(prev => prev === orden.id ? null : orden.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          cardMenuId === orden.id ? "bg-neutral-100 text-neutral-700" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        }`}
                      >
                        <DotsVertical className="w-4 h-4" />
                      </button>
                      {cardMenuId === orden.id && (
                        <div onMouseDown={e => e.stopPropagation()} className="absolute bottom-full right-0 mb-1 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 min-w-[192px] z-50">
                          {actions.menu.map((item, mi) => {
                            const ItemIcon = item.icon;
                            const hasSep = mi > 0 && actions.menu[mi - 1]?.danger !== item.danger;
                            return (
                              <button
                                key={item.label}
                                onClick={() => { setCardMenuId(null); if (item.href) router.push(item.href); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                                  item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
                                } ${hasSep ? "border-t border-neutral-100 mt-1 pt-2.5" : ""}`}
                              >
                                {ItemIcon && <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-400"}`} />}
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto w-full table-scroll" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          <table className="text-sm border-collapse" style={{ width: "max-content", minWidth: "100%" }}>

            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {/* Fixed: ID */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500" style={NW}>ID</th>

                {/* Dynamic columns */}
                {activeColumns.map(key => {
                  if (key === "creacion") return (
                    <th key="creacion" className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 cursor-pointer hover:text-neutral-700 select-none" style={NW} onClick={() => toggleSort("creacion")}>
                      Creación <SortIcon field="creacion" sortField={sortField} sortDir={sortDir} />
                    </th>
                  );
                  if (key === "fechaAgendada") return (
                    <th key="fechaAgendada" className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 cursor-pointer hover:text-neutral-700 select-none" style={NW} onClick={() => toggleSort("fechaAgendada")}>
                      F. agendada <SortIcon field="fechaAgendada" sortField={sortField} sortDir={sortDir} />
                    </th>
                  );
                  const LABELS: Record<ColumnKey, string> = {
                    creacion: "Creación", fechaAgendada: "F. agendada",
                    seller: "Tienda", sucursal: "Sucursal", estado: "Estado",
                    skus: "SKUs", uTotales: "U. totales", tags: "Estado productos",
                  };
                  return (
                    <th key={key} className="text-left py-3 px-4 text-xs font-semibold text-neutral-500" style={NW}>
                      {LABELS[key]}
                    </th>
                  );
                })}

                {/* Fixed: Acciones */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 bg-neutral-50" style={{ ...NW, ...stickyRight }}>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 2} className="py-14 text-center text-sm text-neutral-400" style={NW}>
                    No se encontraron órdenes{search ? ` para "${search}"` : ""}.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((orden, i) => (
                  <tr
                    key={`${orden.id}-${i}`}
                    className={`hover:bg-neutral-50/60 transition-colors duration-300 group ${
                      orden.isSubId ? "bg-neutral-50/40" : ""
                    }`}
                  >
                    {/* Fixed: ID + status on mobile */}
                    <td className="py-3 px-4" style={NW}>
                      <div className="flex flex-col gap-1.5">
                        {orden.isSubId ? (
                          <span className="flex items-center gap-1">
                            <span className="text-neutral-300 text-sm select-none pl-1">└</span>
                            <span
                              className="inline-block bg-neutral-100 text-neutral-500 rounded px-2 py-0.5"
                              style={{ fontFamily: "var(--font-atkinson)", fontSize: "11px" }}
                            >
                              {orden.id}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="inline-block bg-neutral-100 text-neutral-700 rounded px-2 py-0.5"
                            style={{ fontFamily: "var(--font-atkinson)", fontSize: "12px" }}
                          >
                            {orden.id}
                          </span>
                        )}
                        <span className="sm:hidden">
                          <StatusBadge status={orden.estado} />
                        </span>
                      </div>
                    </td>

                    {/* Dynamic columns */}
                    {activeColumns.map(key => {
                      switch (key) {
                        case "creacion":
                          return (
                            <td key="creacion" className="py-3 px-4 text-neutral-600" style={NW}>
                              {orden.creacion}
                            </td>
                          );
                        case "fechaAgendada":
                          return (
                            <td key="fechaAgendada" className="py-3 px-4">
                              <p className="text-neutral-700" style={NW}>
                                {orden.fechaAgendada === "—"
                                  ? <span className="text-neutral-400">Sin agendar</span>
                                  : orden.fechaAgendada
                                }
                              </p>
                              {orden.fechaExtra && (
                                <p className="mt-0.5" style={NW}>
                                  <span className={`inline text-xs font-medium px-1.5 py-0.5 rounded ${fechaExtraClass(orden.fechaExtra)}`}>
                                    {orden.fechaExtra}
                                  </span>
                                </p>
                              )}
                            </td>
                          );
                        case "seller":
                          return (
                            <td key="seller" className="py-3 px-4 text-neutral-600" style={NW}>
                              {orden.seller}
                            </td>
                          );
                        case "sucursal":
                          return (
                            <td key="sucursal" className="py-3 px-4 text-neutral-600" style={NW}>
                              {orden.sucursal}
                            </td>
                          );
                        case "estado":
                          return (
                            <td key="estado" className="py-3 px-4" style={NW}>
                              <StatusBadge status={orden.estado} />
                            </td>
                          );
                        case "skus":
                          return (
                            <td key="skus" className="py-3 px-4 text-neutral-700 tabular-nums" style={NW}>
                              {orden.skus}
                            </td>
                          );
                        case "uTotales":
                          return (
                            <td key="uTotales" className="py-3 px-4 text-neutral-700 tabular-nums" style={NW}>
                              {orden.uTotales}
                            </td>
                          );
                        case "tags":
                          return (
                            <td key="tags" className="py-3 px-4">
                              {orden.tags && orden.tags.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {orden.tags.map(tag => {
                                    const TagIcon = tag.Icon;
                                    return (
                                      <span
                                        key={tag.label}
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${tag.className}`}
                                        style={NW}
                                      >
                                        <TagIcon className={`w-3 h-3 flex-shrink-0 ${tag.iconClass}`} />
                                        {tag.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-neutral-300 text-xs">—</span>
                              )}
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}

                    {/* Fixed: Acciones */}
                    <td
                      className="py-3 px-4 bg-white group-hover:bg-neutral-50/60"
                      style={{ ...NW, ...stickyRight }}
                    >
                      <ActionsCell
                        orden={orden}
                        onPrimaryAction={orden.estado === "Programado" ? () => setRecibirOrden(orden) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        <div className="flex items-center justify-between px-3 py-3 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-[44px] text-sm text-neutral-700 cursor-pointer">
              <span className="text-neutral-500">Mostrar</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
            <span className="text-sm text-neutral-400" style={NW}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
              className="px-3 h-[44px] bg-neutral-100 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300"
              style={NW}
            >
              ← Anterior
            </button>
            <span className="text-sm text-neutral-500 tabular-nums" style={NW}>
              {fromRow}–{toRow} de {filtered.length}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
              className="px-3 h-[44px] bg-neutral-100 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300"
              style={NW}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile pagination */}
      <div className="sm:hidden flex items-center justify-between mt-3 pb-8">
        <span className="text-xs text-neutral-400 tabular-nums">
          {fromRow}–{toRow} de {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300"
          >
            ←
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={clampedPage >= totalPages}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors duration-300"
          >
            →
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        open={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onConfirm={handleQrConfirm}
        getOrInfo={getOrInfo}
      />

      {/* ── Mobile sticky bottom bar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 flex flex-col gap-2 z-40">
        {/* Crear recepción — primary full-width 48px */}
        <Button variant="primary" href="/recepciones/crear" className="w-full h-12" iconLeft={<Plus className="w-4 h-4" />}>
          Crear recepción
        </Button>

        {/* Escanear QR — secondary full-width 48px */}
        <Button variant="secondary" className="w-full h-12" iconLeft={<QrCode02 className="w-4 h-4" />} onClick={() => setShowQrScanner(true)}>
          Escanear QR
        </Button>
      </div>
    </div>
  );
}

// ─── Default export — wraps inner component in Suspense ───────────────────────
export default function OrdenesPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesPageInner />
    </Suspense>
  );
}
