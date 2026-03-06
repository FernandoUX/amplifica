"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useColumnConfig, type ColumnKey } from "@/hooks/useColumnConfig";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download01, Sliders01, LayoutGrid01, SearchLg,
  DotsVertical, CheckCircle, AlertTriangle, XCircle, ClockRefresh, InfoCircle, X,
  SwitchVertical01, ArrowUp, ArrowDown, Plus, ChevronDown,
  CalendarPlus01, PackageCheck, Play, ClipboardCheck, FastForward,
  Eye, Edit01, SlashCircle01, LockUnlocked01,
} from "@untitled-ui/icons-react";
import StatusBadge, { Status } from "@/components/recepciones/StatusBadge";

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
  // Creado — sin fecha agendada aún
  { id: "RO-BARRA-191", creacion: "01/03/2026", fechaAgendada: "—", seller: "Extra Life", sucursal: "Quilicura", estado: "Creado", skus: 5, uTotales: "100" },

  // Programado
  { id: "RO-BARRA-183", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "Extra Life", sucursal: "Quilicura", estado: "Programado", skus: 320, uTotales: "2.550", pallets: 10, bultos: 32, comentarios: "Llegará en un camión blanco patente XXNN33, preguntar por Carlos." },
  { id: "RO-BARRA-182", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", fechaExtra: "Expirado hace 4 horas", seller: "Extra Life", sucursal: "La Reina", estado: "Programado", skus: 320, uTotales: "2.550", pallets: 8, bultos: 28 },
  { id: "RO-BARRA-190", creacion: "17/02/2026", fechaAgendada: "21/02/2026 09:00", fechaExtra: "Expira en 28 minutos", seller: "Le Vice", sucursal: "Lo Barnechea", estado: "Programado", skus: 15, uTotales: "450", pallets: 3, bultos: 15, comentarios: "Entrega parcial, solo 2 pallets llegarán hoy. El resto el miércoles." },

  // Recepcionado en bodega
  { id: "RO-BARRA-180", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Recepcionado en bodega", skus: 2, uTotales: "200" },

  // En proceso de conteo (la OR permanece aquí durante TODO el conteo — 1 sesión o 20)
  { id: "RO-BARRA-184", creacion: "15/02/2026", fechaAgendada: "19/02/2026 10:00", seller: "Extra Life", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-179", creacion: "14/02/2026", fechaAgendada: "18/02/2026 09:00", seller: "Gohard", sucursal: "La Reina", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-185", creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", seller: "Gohard", sucursal: "Lo Barnechea", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },

  // Pendiente de aprobación — recepción cerrada con diferencias, esperando supervisor
  { id: "RO-BARRA-187", creacion: "10/02/2026", fechaAgendada: "14/02/2026 13:00", seller: "Le Vice", sucursal: "La Reina", estado: "Pendiente de aprobación", skus: 320, uTotales: "2.550",
    tags: makeTags({ conDiferencias: 20 }) },

  // Cancelado
  { id: "RO-BARRA-188", creacion: "12/02/2026", fechaAgendada: "16/02/2026 11:30", seller: "Extra Life", sucursal: "Santiago Centro", estado: "Cancelado", skus: 320, uTotales: "2.550" },

  // Completado con diferencias — aprobado por supervisor tras revisión
  { id: "RO-BARRA-186", creacion: "11/02/2026", fechaAgendada: "15/02/2026 08:00", seller: "Extra Life", sucursal: "Quilicura", estado: "Completado con diferencias", skus: 320, uTotales: "2.550",
    tags: makeTags({ sinDiferencias: 2510, conDiferencias: 20, noPickeables: 20 }) },

  // Completado sin diferencias — conteo exacto, sin ajustes
  { id: "RO-BARRA-189", creacion: "09/02/2026", fechaAgendada: "13/02/2026 15:30", seller: "Le Vice", sucursal: "Santiago Centro", estado: "Completado sin diferencias", skus: 320, uTotales: "2.550",
    tags: makeTags({ sinDiferencias: 2550 }) },
];

// ─── Tabs — alineados con estados del Notion spec ─────────────────────────────
const TABS = [
  "Todas",
  "Creado",
  "Programado",
  "Recepcionado en bodega",
  "En proceso de conteo",
  "Pendiente de aprobación",
  "Completado sin diferencias",
  "Completado con diferencias",
  "Cancelado",
] as const;

const TAB_STATUS: Record<string, Status | null> = {
  "Todas":                        null,
  "Creado":                       "Creado",
  "Programado":                   "Programado",
  "Recepcionado en bodega":       "Recepcionado en bodega",
  "En proceso de conteo":         "En proceso de conteo",
  "Pendiente de aprobación":      "Pendiente de aprobación",
  "Completado sin diferencias":   "Completado sin diferencias",
  "Completado con diferencias":   "Completado con diferencias",
  "Cancelado":                    "Cancelado",
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
  if (sortField !== field) return <SwitchVertical01 className="w-3 h-3 text-gray-400 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp   className="w-3 h-3 text-indigo-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-indigo-500 inline ml-1 align-middle" />;
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
  if (lower.startsWith("expirado")) return "bg-red-50 text-red-500";
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
          <h3 className="text-xl font-bold text-gray-900">
            Recibir Orden <span className="font-mono">#{orden.id}</span>
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4">
          <p className="text-sm font-semibold text-gray-800">Detalles de la recepción:</p>

          {/* Info card */}
          <div className="border border-gray-200 rounded-xl px-4 py-3.5 flex items-start divide-x divide-gray-100">
            <div className="pr-5 min-w-0">
              <p className="text-xs text-gray-400 mb-1">Seller</p>
              <p className="text-sm font-bold text-gray-900 truncate">{orden.seller}</p>
            </div>
            <div className="px-5">
              <p className="text-xs text-gray-400 mb-1">Estado</p>
              <StatusBadge status={orden.estado} />
            </div>
            <div className="px-5 flex-1">
              <p className="text-xs text-gray-400 mb-1">Fecha programada</p>
              <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{orden.fechaAgendada}</p>
            </div>
            <div className="px-5">
              <p className="text-xs text-gray-400 mb-1">Pallets</p>
              <p className="text-sm font-bold text-gray-900">{declaredPallets}</p>
            </div>
            <div className="pl-5">
              <p className="text-xs text-gray-400 mb-1">Bultos</p>
              <p className="text-sm font-bold text-gray-900">{declaredBultos}</p>
            </div>
          </div>

          {/* Comentarios (read-only, from OR creation) */}
          {orden.comentarios && (
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5">
                Comentarios adicionales
              </label>
              <div className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-600 bg-gray-50 min-h-[72px]">
                {orden.comentarios}
              </div>
            </div>
          )}

          {/* Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Cantidad de pallets</label>
              <div className="relative">
                <select
                  value={palletsRecibidos}
                  onChange={e => setPalletsRecibidos(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white pr-9"
                >
                  <option value="">Seleccione</option>
                  {Array.from({ length: maxPallets + 1 }, (_, i) => (
                    <option key={i} value={String(i)}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Cantidad de bultos</label>
              <div className="relative">
                <select
                  value={bultosRecibidos}
                  onChange={e => setBultosRecibidos(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white pr-9"
                >
                  <option value="">Seleccione</option>
                  {Array.from({ length: maxBultos + 1 }, (_, i) => (
                    <option key={i} value={String(i)}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
        <div className="flex items-center justify-between px-6 py-4 mt-2 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasValues}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              hasValues
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
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

  const btnCls = "flex items-center justify-center p-1.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-600 rounded-lg transition-colors";

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
        className={`p-1.5 rounded-lg transition-colors ${
          menuPos ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
          <div className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-lg" style={NW}>
            {primary.tooltip}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </div>,
        document.body
      )}

      {/* ── Dropdown — portal to body so table rows never stack above it ── */}
      {mounted && menuPos && createPortal(
        <div
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 2147483647 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[192px]"
          onMouseDown={e => e.stopPropagation()}
        >
          {menu.map((item, i) => {
            const ItemIcon = item.icon;
            const hasSeparator = i > 0 && menu[i - 1]?.danger !== item.danger;
            return (
              <button
                key={item.label}
                onClick={() => { setMenuPos(null); if (item.href) router.push(item.href); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  item.danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
                } ${hasSeparator ? "border-t border-gray-100 mt-1 pt-2.5" : ""}`}
              >
                {ItemIcon && (
                  <ItemIcon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-gray-400"}`} />
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

// ─── Filter Section component ─────────────────────────────────────────────────
function FilterSection({
  title,
  options,
  selected,
  onToggle,
  renderOption,
}: {
  title: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  renderOption?: (val: string) => React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1">
        {options.map(opt => (
          <label
            key={opt}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
          >
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => onToggle(opt)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            {renderOption ? renderOption(opt) : (
              <span className="text-sm text-gray-700">{opt}</span>
            )}
          </label>
        ))}
      </div>
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

  const [activeTab,         setActiveTab]         = useState<string>("Todas");
  const [showToast,         setShowToast]         = useState(false);
  const [toastMsg,          setToastMsg]          = useState({ title: "", subtitle: "" });
  const [showInfo,          setShowInfo]          = useState(false);
  const [showFilters,       setShowFilters]       = useState(false);
  const [search,            setSearch]            = useState("");
  const [orStatusOverrides, setOrStatusOverrides] = useState<Record<string, Status>>({});
  const [recibirOrden,      setRecibirOrden]      = useState<Orden | null>(null);

  // Read per-OR status overrides from localStorage (written by [id]/page.tsx on close)
  useEffect(() => {
    const overrides: Record<string, Status> = {};
    for (const orden of ORDENES) {
      try {
        const stored = localStorage.getItem(`amplifica_or_${orden.id}`);
        if (stored) {
          const { estado } = JSON.parse(stored) as { estado: Status };
          if (estado) overrides[orden.id] = estado;
        }
      } catch { /* ignore */ }
    }
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

  // Apply localStorage overrides to the base data
  const ordenesEffective = useMemo(() =>
    ORDENES.map(o => orStatusOverrides[o.id] ? { ...o, estado: orStatusOverrides[o.id] } : o),
    [orStatusOverrides]
  );

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
  }, [activeTab, search, sortField, sortDir, filterSellers, filterSucursales, filterTagTypes, ordenesEffective]);

  // Reset to page 1 whenever filters/tabs/search change
  useEffect(() => { setPage(1); }, [activeTab, search, sortField, sortDir, filterSellers, filterSucursales, filterTagTypes, pageSize]);

  // ── Paginated slice ──
  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage  = Math.min(page, totalPages);
  const startIdx     = (clampedPage - 1) * pageSize;
  const paginatedRows = filtered.slice(startIdx, startIdx + pageSize);
  const fromRow      = filtered.length === 0 ? 0 : startIdx + 1;
  const toRow        = Math.min(startIdx + pageSize, filtered.length);


  return (
    <div className="p-6 min-w-0">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-green-200 rounded-xl shadow-xl p-4 flex items-start gap-3 max-w-xs">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">{toastMsg.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{toastMsg.subtitle}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
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
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <InfoCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Órdenes de Recepción</h2>
              </div>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Las <strong>Órdenes de Recepción (OR)</strong> gestionan la entrada de mercancía al centro de distribución. Cada OR registra el proceso completo: desde la programación de fecha de entrega hasta la verificación del inventario recibido.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-500">
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sliders01 className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  if (!opt) return <span className="text-sm text-gray-700">{key}</span>;
                  const OptIcon = opt.Icon;
                  return (
                    <span className="flex items-center gap-2">
                      <OptIcon className={`w-4 h-4 flex-shrink-0 ${opt.iconClass}`} />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </span>
                  );
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-40"
                disabled={activeFilterCount === 0}
              >
                Limpiar filtros
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900" style={NW}>Órdenes de Recepción</h1>
          <button
            onClick={() => setShowInfo(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <InfoCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
            style={NW}
          >
            <Download01 className="w-4 h-4" /> Exportar
          </button>
          <Link
            href="/recepciones/crear?mode=sin-agenda"
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
            style={NW}
          >
            Recepción sin agenda
          </Link>
          <Link
            href="/recepciones/crear"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={NW}
          >
            <Plus className="w-4 h-4" /> Crear OR
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 min-w-0">
        {/* ── Tabs with horizontal scroll ── */}
        <div className="tabs-scroll flex items-center gap-1 flex-1 min-w-0 overflow-x-auto pb-0.5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={NW}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex-shrink-0 ${
                activeTab === tab ? "bg-gray-900 text-white font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ── Filters button — opens filter modal ── */}
          <button
            onClick={() => setShowFilters(true)}
            className={`relative p-2 border rounded-lg transition-colors ${
              activeFilterCount > 0
                ? "border-indigo-300 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Sliders01 className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ lineHeight: 1 }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          <Link
            href="/recepciones/columnas"
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Editor de columnas"
          >
            <LayoutGrid01 className="w-4 h-4 text-gray-500" />
          </Link>

          <div className="relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en órdenes"
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Filtros activos:</span>
          {[...filterSellers].map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-medium">
              {s}
              <button onClick={() => toggleInSet(setFilterSellers, s)} className="ml-0.5 text-indigo-400 hover:text-indigo-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {[...filterSucursales].map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-medium">
              {s}
              <button onClick={() => toggleInSet(setFilterSucursales, s)} className="ml-0.5 text-indigo-400 hover:text-indigo-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {[...filterTagTypes].map(k => {
            const opt = TAG_FILTER_OPTIONS.find(t => t.key === k);
            const ChipIcon = opt?.Icon;
            return (
              <span key={k} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-medium">
                {ChipIcon && <ChipIcon className={`w-3 h-3 ${opt?.iconClass}`} />}
                {opt?.label ?? k}
                <button onClick={() => toggleInSet(setFilterTagTypes, k)} className="ml-0.5 text-indigo-400 hover:text-indigo-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            Limpiar todo
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="text-sm border-collapse" style={{ width: "max-content", minWidth: "100%" }}>

            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {/* Fixed: ID */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>ID</th>

                {/* Dynamic columns */}
                {activeColumns.map(key => {
                  if (key === "creacion") return (
                    <th key="creacion" className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none" style={NW} onClick={() => toggleSort("creacion")}>
                      Creación <SortIcon field="creacion" sortField={sortField} sortDir={sortDir} />
                    </th>
                  );
                  if (key === "fechaAgendada") return (
                    <th key="fechaAgendada" className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none" style={NW} onClick={() => toggleSort("fechaAgendada")}>
                      F. Agendada <SortIcon field="fechaAgendada" sortField={sortField} sortDir={sortDir} />
                    </th>
                  );
                  const LABELS: Record<ColumnKey, string> = {
                    creacion: "Creación", fechaAgendada: "F. Agendada",
                    seller: "Tienda", sucursal: "Sucursal", estado: "Estado",
                    skus: "SKUs", uTotales: "U. Totales", tags: "Estado Productos",
                  };
                  return (
                    <th key={key} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>
                      {LABELS[key]}
                    </th>
                  );
                })}

                {/* Fixed: Acciones */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50" style={{ ...NW, ...stickyRight }}>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 2} className="py-14 text-center text-sm text-gray-400" style={NW}>
                    No se encontraron órdenes{search ? ` para "${search}"` : ""}.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((orden, i) => (
                  <tr
                    key={`${orden.id}-${i}`}
                    className={`hover:bg-gray-50/60 transition-colors group ${
                      orden.isSubId ? "bg-gray-50/40" : ""
                    }`}
                  >
                    {/* Fixed: ID */}
                    <td className="py-3 px-4" style={NW}>
                      {orden.isSubId ? (
                        <span className="flex items-center gap-1">
                          <span className="text-gray-300 text-sm select-none pl-1">└</span>
                          <span
                            className="inline-block bg-gray-100 text-gray-500 rounded px-2 py-0.5"
                            style={{ fontFamily: "var(--font-atkinson)", fontSize: "11px" }}
                          >
                            {orden.id}
                          </span>
                        </span>
                      ) : (
                        <span
                          className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5"
                          style={{ fontFamily: "var(--font-atkinson)", fontSize: "12px" }}
                        >
                          {orden.id}
                        </span>
                      )}
                    </td>

                    {/* Dynamic columns */}
                    {activeColumns.map(key => {
                      switch (key) {
                        case "creacion":
                          return (
                            <td key="creacion" className="py-3 px-4 text-gray-600" style={NW}>
                              {orden.creacion}
                            </td>
                          );
                        case "fechaAgendada":
                          return (
                            <td key="fechaAgendada" className="py-3 px-4">
                              <p className="text-gray-700" style={NW}>
                                {orden.fechaAgendada === "—"
                                  ? <span className="text-gray-400">Sin agendar</span>
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
                            <td key="seller" className="py-3 px-4 text-gray-600" style={NW}>
                              {orden.seller}
                            </td>
                          );
                        case "sucursal":
                          return (
                            <td key="sucursal" className="py-3 px-4 text-gray-600" style={NW}>
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
                            <td key="skus" className="py-3 px-4 text-gray-700 tabular-nums" style={NW}>
                              {orden.skus}
                            </td>
                          );
                        case "uTotales":
                          return (
                            <td key="uTotales" className="py-3 px-4 text-gray-700 tabular-nums" style={NW}>
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
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}

                    {/* Fixed: Acciones */}
                    <td
                      className="py-3 px-4 bg-white group-hover:bg-gray-50/60"
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500" style={NW}>Mostrar</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-400" style={NW}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={NW}
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500 tabular-nums" style={NW}>
              {fromRow}–{toRow} de {filtered.length}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={NW}
            >
              Siguiente →
            </button>
          </div>
        </div>
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
