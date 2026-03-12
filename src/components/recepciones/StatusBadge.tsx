import {
  Plus,
  Calendar,
  Warehouse,
  Clock,
  Ban,
  ClipboardList,
  Check,
} from "lucide-react";
import type { ComponentType } from "react";

// ─── Status type — single source of truth ─────────────────────────────────────
type Status =
  | "Creado"
  | "Programado"
  | "Recepcionado en bodega"
  | "En proceso de conteo"
  | "Pendiente de aprobación"
  | "Completada"
  | "Cancelado";

// ─── Icon lookup (tree-shaking safe) ──────────────────────────────────────────
type StatusIconKey = "plus" | "calendar" | "warehouse" | "clipboard" | "clock" | "check" | "ban";
const STATUS_ICON_MAP: Record<StatusIconKey, ComponentType<{ className?: string }>> = {
  plus:      Plus,
  calendar:  Calendar,
  warehouse: Warehouse,
  clipboard: ClipboardList,
  clock:     Clock,
  check:     Check,
  ban:       Ban,
};

// ─── Config per status ─────────────────────────────────────────────────────────
type StatusCfg = {
  label: string;
  icon: StatusIconKey;
  /** bg-{color}-50 text-{color}-600 border-{color}-200 */
  className: string;
};

const statusConfig: Record<Status, StatusCfg> = {
  Creado: {
    label: "Creado",
    icon: "plus",
    className: "bg-neutral-50 text-neutral-700 border-neutral-200",
  },
  Programado: {
    label: "Programado",
    icon: "calendar",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "Recepcionado en bodega": {
    label: "Recepción en bodega",
    icon: "warehouse",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  "En proceso de conteo": {
    label: "En proceso de conteo",
    icon: "clipboard",
    className: "bg-primary-25 text-primary-600 border-primary-200",
  },
  "Pendiente de aprobación": {
    label: "Pendiente de aprobación",
    icon: "clock",
    className: "bg-orange-50 text-orange-600 border-orange-200",
  },
  Completada: {
    label: "Completada",
    icon: "check",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  Cancelado: {
    label: "Cancelada",
    icon: "ban",
    className: "bg-neutral-50 text-neutral-700 border-neutral-200",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  if (!config) return <span className="text-xs text-neutral-400">{status}</span>;
  const IconComp = STATUS_ICON_MAP[config.icon];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${config.className}`}
    >
      {IconComp && <IconComp className="w-3.5 h-3.5 flex-shrink-0" />}
      {config.label}
    </span>
  );
}

export type { Status };
