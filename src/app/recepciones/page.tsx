"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, Suspense, useRef, useCallback } from "react";
import { useColumnConfig, type ColumnKey } from "@/hooks/useColumnConfig";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download01, Sliders01, Columns02, SearchLg, QrCode02,
  DotsVertical, CheckCircle, AlertTriangle, XCircle, ClockRefresh, X,
  SwitchVertical01, ArrowUp, ArrowDown, Plus, Minus, ChevronDown, ChevronLeft, ChevronRight,
  CalendarPlus01, PackageCheck, Play, ClipboardCheck, FastForward,
  Eye, Edit01, SlashCircle01, LockUnlocked01,
} from "@untitled-ui/icons-react";
import StatusBadge, { Status } from "@/components/recepciones/StatusBadge";
import { OR_STATS } from "./_data";
import Button from "@/components/ui/Button";
import QrScannerModal from "@/components/recepciones/QrScannerModal";
import PageInfoModal from "@/components/ui/PageInfoModal";
import AlertModal from "@/components/ui/AlertModal";
import FormField from "@/components/ui/FormField";
import { playScanSuccessSound, playScanErrorSound } from "@/lib/scan-sounds";
import { type Role, getRole, can } from "@/lib/roles";

// ─── Icon lookup (tree-shaking safe) ──────────────────────────────────────────
type TagIconKey = "check" | "alert" | "x" | "clock";
const TAG_ICON_MAP: Record<TagIconKey, React.ComponentType<{ className?: string }>> = {
  check: CheckCircle,
  alert: AlertTriangle,
  x:     XCircle,
  clock: ClockRefresh,
};

// ─── Types ────────────────────────────────────────────────────────────────────
/** Feature 4: multi-label resultado tags (aparecen solo en "Completada") */
type ResultTag = {
  icon: TagIconKey;
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
  progreso?: { contadas: number; total: number };  // contadas/total units
  sesiones?: number;      // number of counting sessions
  tags?: ResultTag[];     // Feature 4: tags de resultado (Completada)
  isSubId?: boolean;      // Feature 2: sub-ID (RO-XXX-P1)
  pallets?: number;       // Seller-declared pallets (for "Programado" ORs)
  bultos?: number;        // Seller-declared bultos (for "Programado" ORs)
  comentarios?: string;   // Optional comment entered when creating the OR (read-only in modals)
  guiaDespacho?: string;  // Número de guía de despacho del seller
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
    tags.push({ icon: "check", iconClass: "text-green-600",  label: `${opts.sinDiferencias.toLocaleString("es-CL")} sin diferencias`, className: "bg-green-50 text-green-700 border border-green-200" });
  if (opts.conDiferencias)
    tags.push({ icon: "alert", iconClass: "text-amber-500",  label: `${opts.conDiferencias} con diferencias`,      className: "bg-amber-50 text-amber-700 border border-amber-200" });
  if (opts.noPickeables)
    tags.push({ icon: "x",     iconClass: "text-red-500",    label: `${opts.noPickeables} no pickeables`,          className: "bg-red-50 text-red-600 border border-red-200" });
  if (opts.pendiente)
    tags.push({ icon: "clock", iconClass: "text-orange-500", label: "Pendiente de aprobación",                     className: "bg-orange-50 text-orange-600 border border-orange-200" });
  return tags;
}

// ─── Tag filter options (for filter modal) ────────────────────────────────────
const TAG_FILTER_OPTIONS: {
  label: string;
  key: string;
  icon: TagIconKey;
  iconClass: string;
}[] = [
  { label: "Sin diferencias",         key: "sin diferencias",         icon: "check", iconClass: "text-green-600" },
  { label: "Con diferencias",         key: "con diferencias",         icon: "alert", iconClass: "text-amber-500" },
  { label: "No pickeables",           key: "no pickeables",           icon: "x",     iconClass: "text-red-500"   },
  { label: "Pendiente de aprobación", key: "pendiente de aprobación", icon: "clock", iconClass: "text-orange-500"},
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
  { id: "RO-BARRA-182", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", fechaExtra: "Expirado hace 4 horas", seller: "Extra Life", sucursal: "La Reina", estado: "Programado", skus: 320, uTotales: "2.550", pallets: 8, bultos: 28, guiaDespacho: "GD-2026-004821" },
  { id: "RO-BARRA-190", creacion: "17/02/2026", fechaAgendada: "21/02/2026 09:00", fechaExtra: "Expira en 28 minutos", seller: "Le Vice", sucursal: "Lo Barnechea", estado: "Programado", skus: 15, uTotales: "450", pallets: 3, bultos: 15, comentarios: "Entrega parcial, solo 2 pallets llegarán hoy. El resto el miércoles.", guiaDespacho: "GD-2026-005130" },
  { id: "RO-BARRA-194", creacion: "07/03/2026", fechaAgendada: "11/03/2026 10:00", seller: "VitaFit", sucursal: "Quilicura", estado: "Programado", skus: 24, uTotales: "1.800", pallets: 6, bultos: 18, comentarios: "Incluye 4 pallets de colágeno que requieren temperatura controlada.", guiaDespacho: "GD-2026-007845" },
  { id: "RO-BARRA-195", creacion: "06/03/2026", fechaAgendada: "12/03/2026 14:30", seller: "NutriPro", sucursal: "La Reina", estado: "Programado", skus: 18, uTotales: "960", pallets: 4, bultos: 12, guiaDespacho: "GD-2026-008102" },
  { id: "RO-BARRA-211", creacion: "09/03/2026", fechaAgendada: "13/03/2026 11:00", seller: "BioNature", sucursal: "Santiago Centro", estado: "Programado", skus: 9, uTotales: "420", pallets: 2, bultos: 6, guiaDespacho: "GD-2026-008390" },
  { id: "RO-BARRA-226", creacion: "10/03/2026", fechaAgendada: "14/03/2026 09:00", seller: "Gohard", sucursal: "Las Condes", estado: "Programado", skus: 2, uTotales: "780", pallets: 3, bultos: 10, guiaDespacho: "GD-2026-008501" },
  { id: "RO-BARRA-227", creacion: "10/03/2026", fechaAgendada: "15/03/2026 08:30", seller: "Le Vice", sucursal: "Providencia", estado: "Programado", skus: 2, uTotales: "1.640", pallets: 5, bultos: 16, comentarios: "Carga incluye productos de temporada, priorizar descarga.", guiaDespacho: "GD-2026-008612" },
  { id: "RO-BARRA-228", creacion: "11/03/2026", fechaAgendada: "15/03/2026 14:00", seller: "VitaFit", sucursal: "Quilicura", estado: "Programado", skus: 2, uTotales: "2.100", pallets: 8, bultos: 24, guiaDespacho: "GD-2026-008720" },
  { id: "RO-BARRA-229", creacion: "11/03/2026", fechaAgendada: "16/03/2026 10:00", seller: "NutriPro", sucursal: "Lo Barnechea", estado: "Programado", skus: 2, uTotales: "540", pallets: 2, bultos: 8, comentarios: "Segundo envío del mes, verificar contra OC anterior.", guiaDespacho: "GD-2026-008835" },
  { id: "RO-BARRA-230", creacion: "11/03/2026", fechaAgendada: "17/03/2026 11:30", seller: "Extra Life", sucursal: "La Reina", estado: "Programado", skus: 2, uTotales: "1.200", pallets: 4, bultos: 14, guiaDespacho: "GD-2026-008940" },

  // ─── Recepcionado en bodega ──────────────────────────────────────────────────
  { id: "RO-BARRA-180", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Recepcionado en bodega", skus: 2, uTotales: "250", pallets: 2, bultos: 4, comentarios: "Mercancía frágil, manipular con cuidado. Entregar en andén 3." },
  { id: "RO-BARRA-196", creacion: "05/03/2026", fechaAgendada: "09/03/2026 09:00", seller: "BioNature", sucursal: "Lo Barnechea", estado: "Recepcionado en bodega", skus: 10, uTotales: "520", pallets: 3, bultos: 10 },
  { id: "RO-BARRA-197", creacion: "04/03/2026", fechaAgendada: "08/03/2026 11:00", seller: "Extra Life", sucursal: "Providencia", estado: "Recepcionado en bodega", skus: 6, uTotales: "310", pallets: 1, bultos: 6, comentarios: "Entregar a operador Juan Pérez en andén 2." },

  // ─── En proceso de conteo ────────────────────────────────────────────────────
  { id: "RO-BARRA-184", creacion: "15/02/2026", fechaAgendada: "19/02/2026 10:00", seller: "Extra Life", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 2, uTotales: "250" },
  { id: "RO-BARRA-179", creacion: "14/02/2026", fechaAgendada: "18/02/2026 09:00", seller: "Gohard", sucursal: "La Reina", estado: "En proceso de conteo", skus: 2, uTotales: "140" },
  { id: "RO-BARRA-185", creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", seller: "Gohard", sucursal: "Lo Barnechea", estado: "En proceso de conteo", skus: 2, uTotales: "105" },
  { id: "RO-BARRA-198", creacion: "03/03/2026", fechaAgendada: "07/03/2026 08:30", seller: "VitaFit", sucursal: "Santiago Centro", estado: "En proceso de conteo", skus: 2, uTotales: "1.120" },

  // ─── Pendiente de aprobación — esperando supervisor ──────────────────────────
  { id: "RO-BARRA-187", creacion: "10/02/2026", fechaAgendada: "14/02/2026 13:00", seller: "Le Vice", sucursal: "La Reina", estado: "Pendiente de aprobación", skus: 3, uTotales: "2.550",
    tags: makeTags({ conDiferencias: 20 }) },
  { id: "RO-BARRA-199", creacion: "02/03/2026", fechaAgendada: "06/03/2026 10:00", seller: "NutriPro", sucursal: "Las Condes", estado: "Pendiente de aprobación", skus: 2, uTotales: "780",
    tags: makeTags({ conDiferencias: 45, noPickeables: 12 }) },
  { id: "RO-BARRA-212", creacion: "08/03/2026", fechaAgendada: "10/03/2026 09:30", seller: "Gohard", sucursal: "Providencia", estado: "Pendiente de aprobación", skus: 2, uTotales: "1.340",
    tags: makeTags({ conDiferencias: 8, noPickeables: 3 }) },

  // ─── Cancelado ───────────────────────────────────────────────────────────────
  { id: "RO-BARRA-188", creacion: "12/02/2026", fechaAgendada: "16/02/2026 11:30", seller: "Extra Life", sucursal: "Santiago Centro", estado: "Cancelado", skus: 8, uTotales: "420" },
  { id: "RO-BARRA-213", creacion: "20/02/2026", fechaAgendada: "24/02/2026 10:00", seller: "Le Vice", sucursal: "Providencia", estado: "Cancelado", skus: 7, uTotales: "280", comentarios: "Seller canceló envío por falta de stock." },

  // ─── Completada ─────────────────────────────────────────────────────────────
  { id: "RO-BARRA-189", creacion: "09/02/2026", fechaAgendada: "13/02/2026 15:30", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Completada", skus: 2, uTotales: "750", pallets: 2, bultos: 6,
    tags: makeTags({ sinDiferencias: 750 }) },
  { id: "RO-BARRA-200", creacion: "28/02/2026", fechaAgendada: "04/03/2026 15:00", seller: "BioNature", sucursal: "Quilicura", estado: "Completada", skus: 2, uTotales: "800", pallets: 4, bultos: 10,
    tags: makeTags({ sinDiferencias: 800 }) },
  { id: "RO-BARRA-215", creacion: "22/02/2026", fechaAgendada: "26/02/2026 08:30", seller: "Gohard", sucursal: "Las Condes", estado: "Completada", skus: 2, uTotales: "2.100",
    tags: makeTags({ sinDiferencias: 2100 }) },

  // ─── Adicionales ────────────────────────────────────────────────────────────
  { id: "RO-BARRA-216", creacion: "05/03/2026", fechaAgendada: "—", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Creado", skus: 14, uTotales: "720", comentarios: "Seller solicita recepción urgente esta semana." },
  { id: "RO-BARRA-217", creacion: "02/03/2026", fechaAgendada: "10/03/2026 08:00", seller: "Extra Life", sucursal: "Lo Barnechea", estado: "Programado", skus: 42, uTotales: "3.200", pallets: 12, bultos: 40, comentarios: "Camión refrigerado, requiere andén 3." },
  { id: "RO-BARRA-218", creacion: "01/03/2026", fechaAgendada: "06/03/2026 15:00", seller: "VitaFit", sucursal: "Las Condes", estado: "Recepcionado en bodega", skus: 19, uTotales: "1.450", pallets: 5, bultos: 14 },
  { id: "RO-BARRA-219", creacion: "27/02/2026", fechaAgendada: "03/03/2026 10:30", seller: "NutriPro", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 2, uTotales: "2.840", comentarios: "Conteo parcial, faltan 8 SKUs por verificar." },
  { id: "RO-BARRA-220", creacion: "26/02/2026", fechaAgendada: "02/03/2026 09:00", seller: "BioNature", sucursal: "La Reina", estado: "Pendiente de aprobación", skus: 2, uTotales: "610",
    tags: makeTags({ conDiferencias: 15 }) },
  { id: "RO-BARRA-221", creacion: "24/02/2026", fechaAgendada: "28/02/2026 14:00", seller: "Gohard", sucursal: "Providencia", estado: "Cancelado", skus: 5, uTotales: "200", comentarios: "Proveedor no se presentó en la fecha acordada." },
  { id: "RO-BARRA-223", creacion: "21/02/2026", fechaAgendada: "25/02/2026 16:00", seller: "Extra Life", sucursal: "Las Condes", estado: "Completada", skus: 2, uTotales: "1.360",
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
  "Pendiente de aprobación",
  "Completada",
  "Cancelada",
] as const;

const TAB_STATUS: Record<string, Status | null> = {
  "Todas":                        null,
  "Creado":                       "Creado",
  "Programado":                   "Programado",
  "Recepción en bodega":          "Recepcionado en bodega",
  "En proceso de conteo":         "En proceso de conteo",
  "Pendiente de aprobación":      "Pendiente de aprobación",
  "Completada":                   "Completada",
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
  if (sortField !== field) return <SwitchVertical01 className="w-3 h-3 text-neutral-600 inline ml-1 align-middle" />;
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
  if (lower.startsWith("expirado")) return "text-red-600";
  if (lower.includes("minutos") || lower.includes("min ")) return "text-amber-600";
  return "text-orange-500";
}

// ─── Feature 1 · Feature Antigua — Contextual actions per status ──────────────
type MenuItem = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
};
type PrimaryAction = {
  tooltip: string;                                         // 1-2 words shown on hover
  icon: React.ComponentType<{ className?: string }>;
  href?: string;                                           // navigation target (uses Link)
  showLabel?: boolean;                                     // show text label next to icon
};
type ActionConfig = { primary?: PrimaryAction; menu: MenuItem[] };

function getActions(estado: Status, id: string, orden?: Orden, onCancel?: (id: string) => void, role?: Role): ActionConfig {
  const r = role ?? "Super Admin";
  const cancelItem: MenuItem = { label: "Cancelar", icon: SlashCircle01, danger: true, onClick: () => onCancel?.(id) };
  const canCancelRole = can(r, "or:cancel");

  switch (estado) {
    case "Creado": {
      const params = new URLSearchParams({ startStep: "2", mode: "completar", orId: id });
      if (orden?.sucursal) params.set("sucursal", orden.sucursal);
      if (orden?.seller)   params.set("seller", orden.seller);
      const menu: MenuItem[] = [
        { label: "Ver",      icon: Eye,    href: `/recepciones/${id}` },
        { label: "Editar",   icon: Edit01, href: `/recepciones/${id}` },
      ];
      if (canCancelRole) menu.push(cancelItem);
      return {
        primary: can(r, "or:complete") ? { tooltip: "Completar", icon: CalendarPlus01, href: `/recepciones/crear?${params}` } : undefined,
        menu,
      };
    }
    case "Programado": {
      const menu: MenuItem[] = [
        { label: "Ver",       icon: Eye },
        { label: "Editar",    icon: Edit01 },
      ];
      if (can(r, "or:complete")) menu.push({ label: "Reagendar", icon: CalendarPlus01, href: "/recepciones/crear?startStep=3&mode=reagendar" });
      if (canCancelRole) menu.push(cancelItem);
      return {
        primary: can(r, "or:receive") ? { tooltip: "Recibir", icon: PackageCheck } : undefined,
        menu,
      };
    }
    case "Recepcionado en bodega": {
      const menu: MenuItem[] = [
        { label: "Ver",      icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        { label: "Editar",   icon: Edit01 },
      ];
      if (canCancelRole) menu.push(cancelItem);
      return {
        primary: can(r, "session:start") ? { tooltip: "Empezar conteo", icon: Play, href: `/recepciones/${encodeURIComponent(id)}` } : { tooltip: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        menu,
      };
    }
    case "En proceso de conteo":
      return {
        primary: can(r, "session:start") ? { tooltip: "Continuar", icon: ClipboardCheck, href: `/recepciones/${encodeURIComponent(id)}` } : { tooltip: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        menu: [
          { label: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        ],
      };
    case "Pendiente de aprobación": {
      const menu: MenuItem[] = [
        { label: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
      ];
      if (can(r, "or:approve")) {
        menu.push({ label: "Aprobar con diferencias", icon: CheckCircle });
        menu.push({ label: "Devolver a conteo",       icon: LockUnlocked01 });
      }
      return {
        primary: { tooltip: can(r, "or:approve") ? "Revisar" : "Ver", icon: can(r, "or:approve") ? ClipboardCheck : Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        menu,
      };
    }
    case "Completada":
      return {
        primary: { tooltip: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` },
        menu: [],
      };
    default: // Cancelado
      return { menu: [{ label: "Ver", icon: Eye, href: `/recepciones/${encodeURIComponent(id)}` }] };
  }
}

// ─── Stepper ([-] value [+]) ──────────────────────────────────────────────────
function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-neutral-700 mb-1.5">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) onChange(v); }}
          className="w-14 px-1 py-1 text-center text-sm font-bold text-neutral-900 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 tabular-nums"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Recibir Modal ────────────────────────────────────────────────────────────
type ScanStatus = "ok" | "duplicate" | "unknown";
type ScanEntry = { code: string; type: "Pallet" | "Bulto"; status: ScanStatus };

function RecebirModal({ orden, onCancel, onConfirm }: {
  orden: Orden;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const declaredPallets = orden.pallets ?? 0;
  const declaredBultos  = orden.bultos  ?? 0;

  // Registros escaneados
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [showDiffAlert, setShowDiffAlert] = useState(false);

  // Solo contar entries válidos (ok) para progreso
  const validEntries     = entries.filter(e => e.status === "ok");
  const palletsRecibidos = validEntries.filter(e => e.type === "Pallet").length;
  const bultosRecibidos  = validEntries.filter(e => e.type === "Bulto").length;

  const palletsPct = declaredPallets > 0 ? Math.min(100, (palletsRecibidos / declaredPallets) * 100) : 0;
  const bultosPct  = declaredBultos  > 0 ? Math.min(100, (bultosRecibidos  / declaredBultos)  * 100) : 0;

  // Diferencias
  const palletsDiff = palletsRecibidos - declaredPallets;
  const bultosDiff  = bultosRecibidos  - declaredBultos;
  const coincide    = palletsDiff === 0 && bultosDiff === 0;
  const hasDiff     = validEntries.length > 0 && !coincide;

  // Texto de diferencias para la alerta
  const diffParts: string[] = [];
  if (palletsDiff !== 0) diffParts.push(`${palletsDiff > 0 ? "+" : ""}${palletsDiff} pallet${Math.abs(palletsDiff) !== 1 ? "s" : ""}`);
  if (bultosDiff !== 0)  diffParts.push(`${bultosDiff > 0 ? "+" : ""}${bultosDiff} bulto${Math.abs(bultosDiff) !== 1 ? "s" : ""}`);

  const handleConfirm = () => {
    if (hasDiff) {
      setShowDiffAlert(true);
    } else {
      onConfirm();
    }
  };

  // Mock scan — simula ~80% ok, ~10% duplicado, ~10% desconocido
  const handleScan = (type: "Pallet" | "Bulto") => {
    const prefix = type === "Pallet" ? "PLT" : "BLT";
    const next = entries.filter(e => e.type === type && e.status === "ok").length + 1;
    const code = `${prefix}-${String(next).padStart(3, "0")}`;
    const rand = Math.random();

    if (rand < 0.1) {
      // Simular código desconocido
      const unknownCode = `UNK-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
      setEntries(prev => [...prev, { code: unknownCode, type, status: "unknown" }]);
      playScanErrorSound();
    } else if (rand < 0.2 && entries.some(e => e.type === type && e.status === "ok")) {
      // Simular duplicado — reusar último código válido
      const lastValid = [...entries].reverse().find(e => e.type === type && e.status === "ok");
      if (lastValid) {
        setEntries(prev => [...prev, { code: lastValid.code, type, status: "duplicate" }]);
        playScanErrorSound();
      } else {
        setEntries(prev => [...prev, { code, type, status: "ok" }]);
        playScanSuccessSound();
      }
    } else {
      setEntries(prev => [...prev, { code, type, status: "ok" }]);
      playScanSuccessSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl h-[80vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <p className="text-xs font-medium text-neutral-500">Recepción</p>
            <h3 className="text-base font-bold text-neutral-900 font-sans leading-tight">{orden.id}</h3>
            <p className="text-xs font-semibold text-neutral-700 mt-0.5">{orden.seller}</p>
          </div>
          <button onClick={onCancel} className="text-neutral-600 hover:text-neutral-600 transition-colors duration-300 ml-4 flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Carga esperada (progress bars en grid) — fixed ─── */}
        <div className="px-5 pb-4 pt-1 flex-shrink-0">
          <div className="grid grid-cols-2 gap-4">
            {/* Pallets */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs font-semibold text-neutral-500">Pallets</p>
                <p className="text-xs tabular-nums">
                  <span className="font-bold text-neutral-900">{palletsRecibidos}</span>
                  <span className="text-neutral-600 mx-0.5">/</span>
                  <span className="text-neutral-600">{declaredPallets}</span>
                </p>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${palletsPct >= 100 ? "bg-green-500" : "bg-primary-500"}`}
                  style={{ width: `${palletsPct}%` }}
                />
              </div>
            </div>

            {/* Bultos */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs font-semibold text-neutral-500">Bultos</p>
                <p className="text-xs tabular-nums">
                  <span className="font-bold text-neutral-900">{bultosRecibidos}</span>
                  <span className="text-neutral-600 mx-0.5">/</span>
                  <span className="text-neutral-600">{declaredBultos}</span>
                </p>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${bultosPct >= 100 ? "bg-green-500" : "bg-primary-500"}`}
                  style={{ width: `${bultosPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ─ */}
        <div className="border-t border-neutral-100 flex-shrink-0" />

        {/* ── Escanear QR (cámara simulada + botones) — fixed ── */}
        <div className="px-5 py-4 space-y-3 flex-shrink-0">
          <p className="text-xs font-semibold text-neutral-500">Escanear QR</p>

          {/* Cámara simulada — compacta + botones integrados */}
          <div className="w-full bg-neutral-900 rounded-xl flex flex-col items-center overflow-hidden">
            <div className="w-full h-[200px] flex flex-col items-center justify-center gap-2 relative">
              <div className="absolute inset-4 border-2 border-white/15 rounded-lg" />
              <QrCode02 className="w-8 h-8 text-white/40 relative z-10" />
              <p className="text-[11px] text-white/40 relative z-10">Escanea QR de pallet o bulto</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full px-3 pb-3">
              <button onClick={() => handleScan("Bulto")} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[0.8125rem] sm:text-xs font-medium rounded-lg bg-neutral-800 text-neutral-100 hover:text-white transition-colors active:scale-[0.97]">
                <QrCode02 className="w-3.5 h-3.5" />
                Escanear bulto
              </button>
              <button onClick={() => handleScan("Pallet")} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[0.8125rem] sm:text-xs font-medium rounded-lg bg-neutral-800 text-neutral-100 hover:text-white transition-colors active:scale-[0.97]">
                <QrCode02 className="w-3.5 h-3.5" />
                Escanear pallet
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ─ */}
        <div className="border-t border-neutral-100 flex-shrink-0" />

        {/* ── Carga registrada — scrollable ─────────────────── */}
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
          <p className="text-xs font-semibold text-neutral-500 mb-2">Carga registrada</p>
          {entries.length === 0 ? (
            <p className="text-xs text-neutral-600">Sin registros escaneados</p>
          ) : (
            <div className="space-y-1.5">
              {[...entries].reverse().map((entry, i) => (
                <div key={`${entry.code}-${i}`} className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 ${i === 0 ? "bg-neutral-50" : ""}`}>
                  {entry.status === "ok" && (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <p className="text-xs text-neutral-700">
                        <span className="font-medium">{entry.type}</span>{" "}
                        <span className="font-sans font-semibold text-neutral-800">{entry.code}</span>{" "}
                        <span className="text-neutral-500">registrado</span>
                      </p>
                    </>
                  )}
                  {entry.status === "duplicate" && (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-600 font-medium">Código ya escaneado</p>
                    </>
                  )}
                  {entry.status === "unknown" && (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600 font-medium">Código no pertenece a esta orden</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Status + Footer ─────────────────────────────────── */}
        <div className="border-t border-neutral-100 px-5 pt-3 pb-8 flex-shrink-0 space-y-2.5">
          {/* Status message */}
          {entries.length > 0 && (
            coincide ? (
              <div className="flex items-center gap-1.5 justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <p className="text-xs font-medium text-green-600">Coincide con la orden</p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs font-medium text-amber-600">
                  Diferencia con lo esperado
                </p>
              </div>
            )
          )}

          <Button variant="primary" size="md" onClick={handleConfirm} disabled={validEntries.length === 0} className="w-full" iconLeft={<CheckCircle className="w-4 h-4" />}>
            Confirmar recepción
          </Button>
        </div>

        {/* ── Alerta de diferencias ───────────────────────────── */}
        <AlertModal
          open={showDiffAlert}
          onClose={() => setShowDiffAlert(false)}
          icon={AlertTriangle}
          variant="warning"
          title="Recepción con diferencias"
          confirm={{
            label: "Confirmar",
            onClick: () => { setShowDiffAlert(false); onConfirm(); },
          }}
        >
          <p>
            ¿Estás seguro de finalizar la recepción a bodega con{" "}
            <span className="font-semibold text-neutral-900">{diffParts.join(" y ")}</span>
            {" "}de diferencia?
          </p>
        </AlertModal>

      </div>
    </div>
  );
}

// ─── Actions cell ─────────────────────────────────────────────────────────────
function ActionsCell({ orden, onPrimaryAction, onCancel, role }: { orden: Orden; onPrimaryAction?: () => void; onCancel?: (id: string) => void; role?: Role }) {
  const router        = useRouter();
  const [menuPos,    setMenuPos]    = useState<{ top: number; right: number } | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const dotsRef       = useRef<HTMLButtonElement>(null);
  const primaryWrap   = useRef<HTMLDivElement>(null);
  const { primary, menu } = getActions(orden.estado, orden.id, orden, onCancel, role);
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
          {primary.showLabel ? (
            <Button variant="secondary" size="sm" href={primary.href} iconLeft={<Icon className="w-3.5 h-3.5" />}>
              {primary.tooltip}
            </Button>
          ) : primary.href ? (
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

      {menu.length > 0 && (
        <button
          ref={dotsRef}
          onMouseDown={toggleMenu}
          className={`p-1.5 rounded-lg transition-colors duration-300 ${
            menuPos ? "bg-neutral-100 text-neutral-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-600"
          }`}
        >
          <DotsVertical className="w-4 h-4" />
        </button>
      )}

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
                onClick={() => { setMenuPos(null); if (item.href) router.push(item.href); item.onClick?.(); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
                } ${hasSeparator ? "border-t border-neutral-100 mt-1 pt-2.5" : ""}`}
              >
                {ItemIcon && (
                  <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-600"}`} />
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
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
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
  const [showFilters,       setShowFilters]       = useState(false);
  const [search,            setSearch]            = useState("");
  const [orStatusOverrides, setOrStatusOverrides] = useState<Record<string, { estado: Status; fechaAgendada?: string }>>({});
  const [recibirOrden,      setRecibirOrden]      = useState<Orden | null>(null);
  const [createdOrs,        setCreatedOrs]        = useState<Orden[]>([]);
  const [showQrScanner,     setShowQrScanner]     = useState(false);
  const [cardMenuId,        setCardMenuId]        = useState<string | null>(null);
  const [bottomMenuOpen,    setBottomMenuOpen]    = useState(false);
  const [cancelTarget,      setCancelTarget]      = useState<string | null>(null);

  // ── Role (initialise with SSR-safe default, sync from localStorage on mount) ──
  const [currentRole, setCurrentRole] = useState<Role>("Super Admin");
  useEffect(() => {
    setCurrentRole(getRole());
    const sync = () => setCurrentRole(getRole());
    window.addEventListener("amplifica-role-change", sync);
    return () => window.removeEventListener("amplifica-role-change", sync);
  }, []);

  const canCreate  = can(currentRole, "or:create");
  const canScanQr  = can(currentRole, "or:scan_qr");
  const canReceive = can(currentRole, "or:receive");

  // Close card menu / bottom menu on outside click
  useEffect(() => {
    if (!cardMenuId && !bottomMenuOpen) return;
    const close = () => { setCardMenuId(null); setBottomMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [cardMenuId, bottomMenuOpen]);

  // Read per-OR status overrides + created ORs from localStorage
  useEffect(() => {
    const overrides: Record<string, { estado: Status; fechaAgendada?: string }> = {};

    // Overrides for static mock ORs
    for (const orden of ORDENES) {
      try {
        const stored = localStorage.getItem(`amplifica_or_${orden.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as { estado: Status; fechaAgendada?: string };
          if (parsed.estado) overrides[orden.id] = parsed;
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
              const p = JSON.parse(stored) as { estado: Status; fechaAgendada?: string };
              if (p.estado) overrides[or.id] = p;
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

  // Merge created ORs with static data (dedup by id), apply localStorage overrides, and enrich with OR_STATS
  const ordenesEffective = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...createdOrs, ...ORDENES].filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    return merged.map(o => {
      const override = orStatusOverrides[o.id];
      const enriched = override ? { ...o, estado: override.estado, ...(override.fechaAgendada ? { fechaAgendada: override.fechaAgendada } : {}) } : { ...o };
      const stats = OR_STATS[o.id];
      if (stats && !enriched.progreso) {
        enriched.progreso = { contadas: stats.contadas, total: stats.total };
      }
      if (stats && enriched.sesiones === undefined) {
        enriched.sesiones = stats.sesiones;
      }
      return enriched;
    });
  }, [orStatusOverrides, createdOrs]);

  // ── QR scanner helpers ──
  const getOrInfo = useCallback((orId: string) => {
    const o = ordenesEffective.find(x => x.id === orId);
    if (!o) return undefined;
    return { id: o.id, seller: o.seller, sucursal: o.sucursal, fechaAgendada: o.fechaAgendada, estado: o.estado, skus: o.skus, uTotales: o.uTotales, pallets: o.pallets, bultos: o.bultos };
  }, [ordenesEffective]);

  const handleQrConfirm = useCallback((orId: string, labelCount: number) => {
    localStorage.setItem(`amplifica_or_${orId}`, JSON.stringify({ estado: "Recepcionado en bodega" }));
    setOrStatusOverrides(prev => ({ ...prev, [orId]: { estado: "Recepcionado en bodega" as Status } }));
    setToastMsg({
      title: "Orden recepcionada en bodega",
      subtitle: `${orId} — ${labelCount} etiqueta${labelCount !== 1 ? "s" : ""} QR enviada${labelCount !== 1 ? "s" : ""} a impresión`,
    });
    setShowToast(true);
  }, []);

  const handleQrStartConteo = useCallback((orId: string) => {
    router.push(`/recepciones/${encodeURIComponent(orId)}`);
  }, [router]);

  // ── Filter options (unique values from data) ──
  const allSellers    = useMemo(() => [...new Set(ordenesEffective.map(o => o.seller))].sort(),    [ordenesEffective]);
  const allSucursales = useMemo(() => [...new Set(ordenesEffective.map(o => o.sucursal))].sort(), [ordenesEffective]);

  // ── Active filter count (for badge) ──
  const activeFilterCount = filterTagTypes.size;

  // ── Toggle helper ──
  const toggleInSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  };

  const clearAllFilters = () => {
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
    } else if (searchParams.get("completed") === "1") {
      setToastMsg({ title: "Orden completada", subtitle: "La orden ha sido completada y programada correctamente" });
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
  const [pageSize,  setPageSize]  = useState(20);
  const [page,      setPage]      = useState(1);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // ── Counts per status tab (respects sidebar filters but NOT active tab) ──
  const statusCounts = useMemo(() => {
    let rows = [...ordenesEffective];
    if (sidebarSucursal) rows = rows.filter(o => o.sucursal === sidebarSucursal);
    if (sidebarSeller)   rows = rows.filter(o => o.seller === sidebarSeller);
    if (sidebarDateFrom || sidebarDateTo) {
      rows = rows.filter(o => {
        const [d, m, y] = o.creacion.split("/").map(Number);
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (sidebarDateFrom && iso < sidebarDateFrom) return false;
        if (sidebarDateTo   && iso > sidebarDateTo)   return false;
        return true;
      });
    }
    const counts: Record<string, number> = {};
    for (const tab of TABS) {
      const statusVal = TAB_STATUS[tab];
      counts[tab] = statusVal ? rows.filter(o => o.estado === statusVal).length : rows.length;
    }
    return counts;
  }, [ordenesEffective, sidebarSucursal, sidebarSeller, sidebarDateFrom, sidebarDateTo]);

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
    <div className="p-4 lg:p-6 min-w-0 pb-36 sm:pb-0 max-w-[1680px] mx-auto sm:flex sm:flex-col sm:h-[98dvh] sm:overflow-hidden">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 left-4 right-4 sm:left-auto sm:right-5 sm:w-auto z-50 bg-white border border-green-200 rounded-xl shadow-xl p-4 flex items-start gap-3 sm:max-w-xs">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-800">{toastMsg.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{toastMsg.subtitle}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-neutral-600 hover:text-neutral-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
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
            setOrStatusOverrides(prev => ({ ...prev, [targetId]: { estado: newStatus } }));
            setRecibirOrden(null);
            setToastMsg({
              title: "Orden recepcionada en bodega",
              subtitle: `${targetId} fue recibida y está lista para el conteo`,
            });
            setShowToast(true);
          }}
        />
      )}

      {/* ── Cancel OR modal ── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setCancelTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button onClick={() => setCancelTarget(null)} className="text-neutral-600 hover:text-neutral-600 transition-colors duration-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <SlashCircle01 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 text-center mb-1">¿Cancelar esta orden?</h3>
            <p className="text-sm text-neutral-500 text-center mb-6">
              La orden <span className="font-semibold text-neutral-700">{cancelTarget}</span> se cancelará de forma permanente. Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(`amplifica_or_${cancelTarget}`, JSON.stringify({ estado: "Cancelado" }));
                  } catch { /* ignore */ }
                  setOrStatusOverrides(prev => ({ ...prev, [cancelTarget]: { estado: "Cancelado" as Status } }));
                  setToastMsg({ title: "Orden cancelada", subtitle: `${cancelTarget} fue cancelada correctamente` });
                  setShowToast(true);
                  setCancelTarget(null);
                }}
                className="w-full h-11 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
              >
                <SlashCircle01 className="w-4 h-4" />
                Sí, cancelar orden
              </button>
              <button
                onClick={() => setCancelTarget(null)}
                className="w-full h-11 flex items-center justify-center text-neutral-600 text-sm font-medium hover:bg-neutral-50 rounded-lg transition-colors duration-300"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
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
                className="text-neutral-600 hover:text-neutral-600 transition-colors duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              {/* Tags de resultado */}
              <FilterSection
                title="Estado de productos"
                options={TAG_FILTER_OPTIONS.map(t => t.key)}
                selected={filterTagTypes}
                onToggle={v => toggleInSet(setFilterTagTypes, v)}
                renderOption={key => {
                  const opt = TAG_FILTER_OPTIONS.find(t => t.key === key);
                  if (!opt) return <span className="text-sm text-neutral-700">{key}</span>;
                  const OptIcon = TAG_ICON_MAP[opt.icon];
                  return (
                    <span className="flex items-center gap-2">
                      {OptIcon && <OptIcon className={`w-4 h-4 flex-shrink-0 ${opt.iconClass}`} />}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3 sm:gap-4 sm:flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900" style={NW}>Órdenes de Recepción</h1>
          <PageInfoModal
            title="Órdenes de Recepción"
            description={<>Las <strong>Órdenes de Recepción (OR)</strong> gestionan la entrada de mercancía al centro de distribución. Cada OR registra el proceso completo: desde la programación de fecha de entrega hasta la verificación del inventario recibido.</>}
            features={[
              "Programa citas de descarga con horario",
              "Declara SKUs y unidades antes de la recepción",
              "Rastrea diferencias y productos no pickeables",
            ]}
          />
          {/* Dots menu — mobile only (Exportar + Recepción sin agenda) */}
          <div className="relative sm:hidden ml-auto">
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setBottomMenuOpen(prev => !prev)}
              className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 ${
                bottomMenuOpen ? "bg-neutral-100 text-neutral-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-600"
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
                  <Download01 className="w-4 h-4 flex-shrink-0 text-neutral-600" />
                  Exportar
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div>
            <Button variant="tertiary" size="md" className="h-9" iconLeft={<Download01 className="w-4 h-4" />}>
              Exportar
            </Button>
          </div>
          {canScanQr && (
            <div>
              <Button variant={canCreate ? "secondary" : "primary"} className="h-9" iconLeft={<QrCode02 className="w-4 h-4" />} onClick={() => setShowQrScanner(true)}>
                Escanear QR
              </Button>
            </div>
          )}
          {canCreate && (
            <Button variant="primary" className="h-9" href="/recepciones/crear" iconLeft={<Plus className="w-4 h-4" />}>
              Crear recepción
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 min-w-0 sm:flex-shrink-0">
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
                <option key={tab} value={tab}>{tab}{statusCounts[tab] > 0 ? ` (${statusCounts[tab]})` : ""}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          </div>

          {/* Desktop: pill tabs with horizontal scroll */}
          <div
            ref={tabsScrollRef}
            className="hidden sm:flex tabs-scroll items-center gap-0.5 overflow-x-auto p-1 bg-neutral-100 rounded-xl select-none h-[44px]"
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
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex-shrink-0 flex items-center ${
                  activeTab === tab ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab}
                {statusCounts[tab] > 0 && (
                  <span className={`ml-1.5 text-[10px] tabular-nums rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 font-medium ${
                    activeTab === tab
                      ? "bg-primary-100 text-primary-700"
                      : "bg-neutral-200/70 text-neutral-500"
                  }`}>
                    {statusCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Left arrow */}
          {showLeftArrow && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-neutral-100 to-transparent hidden sm:block rounded-l-xl" />
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
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-neutral-100 to-transparent hidden sm:block rounded-r-xl" />
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
            className={`relative h-9 w-9 flex items-center justify-center border border-transparent rounded-lg transition-colors duration-300 ${
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
            className="hidden sm:flex h-9 w-9 bg-neutral-100 rounded-lg hover:bg-neutral-200 items-center justify-center transition-colors duration-300"
            title="Editor de columnas"
          >
            <Columns02 className="w-4 h-4 text-neutral-500" />
          </Link>

          <div className="hidden sm:block relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar OR..."
              className="pl-9 pr-8 py-2 h-9 bg-neutral-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 w-52"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search — full width below toolbar */}
      <div className="sm:hidden relative mb-3">
        <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar OR..."
          className="w-full pl-9 pr-8 py-2.5 bg-neutral-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-neutral-500 font-medium">Filtros activos:</span>
          {[...filterTagTypes].map(k => {
            const opt = TAG_FILTER_OPTIONS.find(t => t.key === k);
            const ChipIcon = opt ? TAG_ICON_MAP[opt.icon] : null;
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
          <button onClick={clearAllFilters} className="text-xs text-neutral-600 hover:text-neutral-600 underline underline-offset-2">
            Limpiar todo
          </button>
        </div>
      )}

      {/* ── Mobile card view ── */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl py-14 text-center text-sm text-neutral-600">
            No se encontraron órdenes{search ? ` para "${search}"` : ""}.
          </div>
        ) : (
          paginatedRows.map((orden, i) => {
            const actions = getActions(orden.estado, orden.id, orden, setCancelTarget, currentRole);
            const PrimaryIcon = actions.primary?.icon;
            return (
              <div
                key={`card-${orden.id}-${i}`}
                className="bg-white border border-neutral-200 rounded-2xl p-4"
              >
                {/* Row 1: ID + Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <Link
                    href={`/recepciones/${encodeURIComponent(orden.id)}`}
                    className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 font-medium w-fit text-xs transition-colors"
                  >
                    {orden.id}
                  </Link>
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-600 flex-shrink-0">
                    <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {orden.fechaAgendada === "—" ? (
                    <span className="text-neutral-600">Sin agendar</span>
                  ) : (
                    <span className="text-neutral-600">{orden.fechaAgendada}</span>
                  )}
                  {orden.fechaExtra && (
                    <span className={`text-[10px] font-medium ${fechaExtraClass(orden.fechaExtra)}`}>
                      {orden.fechaExtra}
                    </span>
                  )}
                </div>

                {/* Row 4: SKUs + Unidades + Sesiones */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-600">SKUs</span>
                    <span className="text-neutral-700 font-semibold tabular-nums">{orden.skus}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-600">Unidades</span>
                    <span className="text-neutral-700 font-semibold tabular-nums">{orden.uTotales}</span>
                  </div>
                  {orden.sesiones && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-600">Sesiones</span>
                      <span className="text-neutral-700 font-semibold tabular-nums">{orden.sesiones}</span>
                    </div>
                  )}
                </div>

                {/* Progreso (if any) */}
                {orden.progreso && (() => {
                  const pct = Math.round((orden.progreso.contadas / orden.progreso.total) * 100);
                  const isComplete = pct >= 100;
                  return (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium tabular-nums ${isComplete ? "text-green-600" : "text-neutral-500"}`}>
                          {orden.progreso.contadas.toLocaleString("es-CL")}/{orden.progreso.total.toLocaleString("es-CL")}
                        </span>
                        <span className={`text-[11px] font-medium tabular-nums ${isComplete ? "text-green-600" : "text-neutral-500"}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-primary-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Tags (if any) */}
                {orden.tags && orden.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {orden.tags.map((tag, ti) => {
                      const TagIcon = TAG_ICON_MAP[tag.icon];
                      if (!TagIcon) return null;
                      return (
                        <span
                          key={tag.label ?? ti}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium w-fit ${tag.className}`}
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
                        onMouseDown={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                        onClick={() => setCardMenuId(prev => prev === orden.id ? null : orden.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          cardMenuId === orden.id ? "bg-neutral-100 text-neutral-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-600"
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
                                onClick={() => { setCardMenuId(null); if (item.href) router.push(item.href); item.onClick?.(); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                                  item.danger ? "text-red-500 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-50"
                                } ${hasSep ? "border-t border-neutral-100 mt-1 pt-2.5" : ""}`}
                              >
                                {ItemIcon && <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-neutral-600"}`} />}
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

      {/* Table (desktop) — flex column so header + pagination stay visible, body scrolls */}
      <div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
        <div
          className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          onScroll={e => {
            const el = e.currentTarget;
            el.classList.toggle("scrolled-end", el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
          }}>
          <table className="w-full table-fixed text-sm border-collapse">

            <thead className="sticky top-0 z-10">
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {/* Fixed: ID */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 w-[130px]" style={NW}>ID</th>

                {/* Dynamic columns */}
                {activeColumns.map(key => {
                  const COL_WIDTHS: Record<ColumnKey, string> = {
                    creacion: "w-[110px]", fechaAgendada: "w-[150px]",
                    seller: "w-[110px]", sucursal: "w-[110px]", estado: "w-[210px]",
                    progreso: "w-[130px]", sesiones: "w-[75px]",
                    skus: "w-[60px]", uTotales: "w-[85px]", tags: "w-[130px]",
                  };
                  const w = COL_WIDTHS[key];
                  if (key === "creacion") return (
                    <th key="creacion" className={`text-left py-3 px-4 text-xs font-semibold text-neutral-500 cursor-pointer hover:text-neutral-700 select-none ${w}`} style={NW} onClick={() => toggleSort("creacion")}>
                      Creación <SortIcon field="creacion" sortField={sortField} sortDir={sortDir} />
                    </th>
                  );
                  if (key === "fechaAgendada") return (
                    <th key="fechaAgendada" className={`text-left py-3 px-4 text-xs font-semibold text-neutral-500 cursor-pointer hover:text-neutral-700 select-none ${w}`} style={NW} onClick={() => toggleSort("fechaAgendada")}>
                      F. agendada <SortIcon field="fechaAgendada" sortField={sortField} sortDir={sortDir} />
                    </th>
                  );
                  const LABELS: Record<ColumnKey, string> = {
                    creacion: "Creación", fechaAgendada: "F. agendada",
                    seller: "Tienda", sucursal: "Sucursal", estado: "Estado",
                    progreso: "Progreso", sesiones: "Sesiones",
                    skus: "SKUs", uTotales: "U. totales", tags: "Estado productos",
                  };
                  const CENTER_COLS: ColumnKey[] = ["sesiones", "skus"];
                  const align = CENTER_COLS.includes(key) ? "text-center" : "text-left";
                  return (
                    <th key={key} className={`${align} py-3 px-4 text-xs font-semibold text-neutral-500 ${w}`} style={NW}>
                      {LABELS[key]}
                    </th>
                  );
                })}

                {/* Fixed: Acciones */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 bg-neutral-50 w-[100px]" style={{ ...NW, ...stickyRight }}>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 2} className="py-14 text-center text-sm text-neutral-600" style={NW}>
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
                            <Link
                              href={`/recepciones/${encodeURIComponent(orden.id)}`}
                              className="inline-block bg-neutral-100 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 w-fit text-[11px] font-sans transition-colors"
                            >
                              {orden.id}
                            </Link>
                          </span>
                        ) : (
                          <Link
                            href={`/recepciones/${encodeURIComponent(orden.id)}`}
                            className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-2 py-0.5 w-fit text-xs font-sans transition-colors"
                          >
                            {orden.id}
                          </Link>
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
                                  ? <span className="text-neutral-600">Sin agendar</span>
                                  : orden.fechaAgendada
                                }
                              </p>
                              {orden.fechaExtra && (
                                <p style={NW}>
                                  <span className={`inline text-xs font-medium ${fechaExtraClass(orden.fechaExtra)}`}>
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
                            <td key="skus" className="py-3 px-4 text-neutral-700 tabular-nums text-center" style={NW}>
                              {orden.skus}
                            </td>
                          );
                        case "uTotales":
                          return (
                            <td key="uTotales" className="py-3 px-4 text-neutral-700 tabular-nums" style={NW}>
                              {orden.uTotales}
                            </td>
                          );
                        case "progreso":
                          return (
                            <td key="progreso" className="py-3 px-4" style={NW}>
                              {orden.progreso ? (() => {
                                const pct = Math.round((orden.progreso.contadas / orden.progreso.total) * 100);
                                const isComplete = pct >= 100;
                                return (
                                  <span className={`text-xs font-medium tabular-nums ${isComplete ? "text-green-600" : "text-neutral-600"}`}>
                                    {orden.progreso.contadas.toLocaleString("es-CL")}/{orden.progreso.total.toLocaleString("es-CL")}
                                    {` (${pct}%)`}
                                  </span>
                                );
                              })() : (
                                <span className="text-neutral-300 text-xs">—</span>
                              )}
                            </td>
                          );
                        case "sesiones":
                          return (
                            <td key="sesiones" className="py-3 px-4 text-neutral-700 tabular-nums text-center" style={NW}>
                              {orden.sesiones ? (
                                <span>{orden.sesiones}</span>
                              ) : (
                                <span className="text-neutral-300 text-xs">—</span>
                              )}
                            </td>
                          );
                        case "tags":
                          return (
                            <td key="tags" className="py-3 px-4">
                              {orden.tags && orden.tags.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {orden.tags.map((tag, ti) => {
                                    const TagIcon = TAG_ICON_MAP[tag.icon];
                                    if (!TagIcon) return null;
                                    return (
                                      <span
                                        key={tag.label ?? ti}
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium w-fit ${tag.className}`}
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
                        onPrimaryAction={orden.estado === "Programado" && canReceive ? () => setRecibirOrden(orden) : undefined}
                        onCancel={setCancelTarget}
                        role={currentRole}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination — pinned at bottom of table container */}
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
          <span className="text-sm text-neutral-600" style={NW}>
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
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

      {/* Mobile pagination */}
      <div className="sm:hidden flex items-center justify-between mt-3 pb-8">
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

      {/* QR Scanner Modal */}
      <QrScannerModal
        open={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onConfirm={handleQrConfirm}
        onStartConteo={handleQrStartConteo}
        getOrInfo={getOrInfo}
      />

      {/* ── Mobile sticky bottom bar ── */}
      {(canCreate || canScanQr) && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 pt-3 pb-6 flex flex-col gap-2 z-40">
          {canCreate && (
            <Button variant="primary" href="/recepciones/crear" className="w-full h-12" iconLeft={<Plus className="w-4 h-4" />}>
              Crear recepción
            </Button>
          )}
          {canScanQr && (
            <Button variant={canCreate ? "secondary" : "primary"} className="w-full h-12" iconLeft={<QrCode02 className="w-4 h-4" />} onClick={() => setShowQrScanner(true)}>
              Escanear QR
            </Button>
          )}
        </div>
      )}
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
