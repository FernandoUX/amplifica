"use client";

import {
  Clock,
  Package,
  Truck,
  AlertTriangle,
  Check,
  Ban,
} from "lucide-react";
import type { ComponentType } from "react";

// ─── Status type ─────────────────────────────────────────────────────────────
export type TransferStatus =
  | "pendiente"
  | "en_preparacion"
  | "en_transito"
  | "recibida_parcial"
  | "recibida_completa"
  | "cancelada";

// ─── Icon lookup (tree-shaking safe) ─────────────────────────────────────────
type StatusIconKey = "clock" | "package" | "truck" | "alertTriangle" | "check" | "ban";
const STATUS_ICON_MAP: Record<StatusIconKey, ComponentType<{ className?: string }>> = {
  clock:          Clock,
  package:        Package,
  truck:          Truck,
  alertTriangle:  AlertTriangle,
  check:          Check,
  ban:            Ban,
};

// ─── Config per status ───────────────────────────────────────────────────────
type StatusCfg = {
  label: string;
  icon: StatusIconKey;
  className: string;
  tooltip: string;
};

export const transferStatusConfig: Record<TransferStatus, StatusCfg> = {
  pendiente: {
    label: "Pendiente",
    icon: "clock",
    className: "bg-neutral-50 text-neutral-700",
    tooltip: "Transferencia creada, tramos pendientes de preparar",
  },
  en_preparacion: {
    label: "En preparación",
    icon: "package",
    className: "bg-amber-50 text-amber-700",
    tooltip: "Uno o más tramos están siendo preparados",
  },
  en_transito: {
    label: "En tránsito",
    icon: "truck",
    className: "bg-sky-50 text-sky-700",
    tooltip: "Tramos retirados por transporte, en camino al destino",
  },
  recibida_parcial: {
    label: "Recibida parcial",
    icon: "alertTriangle",
    className: "bg-orange-50 text-orange-600",
    tooltip: "Algunos tramos recibidos en destino, otros aún pendientes",
  },
  recibida_completa: {
    label: "Completada",
    icon: "check",
    className: "bg-green-50 text-green-700",
    tooltip: "Todos los tramos recibidos en destino",
  },
  cancelada: {
    label: "Cancelada",
    icon: "ban",
    className: "bg-red-50 text-red-700",
    tooltip: "Transferencia anulada",
  },
};

// ─── Leg status config ───────────────────────────────────────────────────────
export type TransferLegStatus = "pendiente" | "preparado" | "retirado_por_transporte" | "recibido" | "recibido_con_diferencias";

export const legStatusConfig: Record<TransferLegStatus, { label: string; className: string }> = {
  pendiente:                { label: "Pendiente",            className: "bg-neutral-50 text-neutral-700" },
  preparado:                { label: "Preparado",            className: "bg-amber-50 text-amber-700" },
  retirado_por_transporte:  { label: "Retirado por transporte", className: "bg-sky-50 text-sky-700" },
  recibido:                 { label: "Recibido",             className: "bg-green-50 text-green-700" },
  recibido_con_diferencias: { label: "Recibido c/diferencias", className: "bg-orange-50 text-orange-600" },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const config = transferStatusConfig[status];
  if (!config) return <span className="text-xs text-neutral-400">{status}</span>;
  const IconComp = STATUS_ICON_MAP[config.icon];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${config.className}`}
      title={config.tooltip}
    >
      {IconComp && <IconComp className="w-3.5 h-3.5 flex-shrink-0" />}
      {config.label}
    </span>
  );
}

// ─── Leg status badge ────────────────────────────────────────────────────────
export function LegStatusBadge({ status }: { status: TransferLegStatus }) {
  const config = legStatusConfig[status];
  if (!config) return <span className="text-xs text-neutral-400">{status}</span>;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-none ${config.className}`}
    >
      {config.label}
    </span>
  );
}
