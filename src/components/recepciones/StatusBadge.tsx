import {
  Plus,
  Calendar,
  Warehouse,
  SplitSquareHorizontal,
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
  | "Completado sin diferencias"
  | "Completado con diferencias"
  | "Cancelado";

// ─── Config per status ─────────────────────────────────────────────────────────
// Pattern: bg = color-50, text + icon = color-600, border = color-200
type StatusCfg = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** bg-{color}-50 text-{color}-600 border-{color}-200 */
  className: string;
};

const statusConfig: Record<Status, StatusCfg> = {
  Creado: {
    label: "Creado",
    Icon: Plus,
    className: "bg-neutral-50 text-neutral-700 border-neutral-200",
  },
  Programado: {
    label: "Programado",
    Icon: Calendar,
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "Recepcionado en bodega": {
    label: "Recepción en bodega",
    Icon: Warehouse,
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  "En proceso de conteo": {
    label: "En proceso de conteo",
    Icon: ClipboardList,
    className: "bg-primary-25 text-primary-600 border-primary-200",
  },
  "Pendiente de aprobación": {
    label: "Parcialmente recepcionada",
    Icon: SplitSquareHorizontal,
    className: "bg-orange-50 text-red-600 border-orange-200",
  },
  "Completado sin diferencias": {
    label: "Completada sin diferencias",
    Icon: Check,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  "Completado con diferencias": {
    label: "Completada con diferencias",
    Icon: Check,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Cancelado: {
    label: "Cancelada",
    Icon: Ban,
    className: "bg-neutral-50 text-neutral-700 border-neutral-200",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {config.label}
    </span>
  );
}

export type { Status };
