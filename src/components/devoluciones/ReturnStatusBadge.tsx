import {
  Plus,
  Warehouse,
  PackageCheck,
  Truck,
  MapPin,
  Check,
  Send,
  Ban,
} from "lucide-react";
import type { ComponentType } from "react";

// ─── Status type — single source of truth ─────────────────────────────────────
type ReturnStatus =
  | "creada"
  | "recibida_en_bodega"
  | "lista_para_devolver"
  | "en_transferencia"
  | "recibida_en_cd"
  | "retirada_en_bodega"
  | "enviada_al_seller"
  | "cancelada";

// ─── Icon lookup (tree-shaking safe) ──────────────────────────────────────────
type StatusIconKey = "plus" | "warehouse" | "packageCheck" | "truck" | "mapPin" | "check" | "send" | "ban";
const STATUS_ICON_MAP: Record<StatusIconKey, ComponentType<{ className?: string }>> = {
  plus:        Plus,
  warehouse:   Warehouse,
  packageCheck: PackageCheck,
  truck:       Truck,
  mapPin:      MapPin,
  check:       Check,
  send:        Send,
  ban:         Ban,
};

// ─── Config per status ─────────────────────────────────────────────────────────
type StatusCfg = {
  label: string;
  icon: StatusIconKey;
  className: string;
  tooltip: string;
};

const statusConfig: Record<ReturnStatus, StatusCfg> = {
  creada: {
    label: "Creada",
    icon: "plus",
    className: "bg-neutral-50 text-neutral-700",
    tooltip: "Devolución registrada, pendiente de recepción física",
  },
  recibida_en_bodega: {
    label: "Recibida en bodega",
    icon: "warehouse",
    className: "bg-amber-50 text-amber-700",
    tooltip: "Bulto recepcionado y etiquetado en bodega",
  },
  lista_para_devolver: {
    label: "Lista para devolver",
    icon: "packageCheck",
    className: "bg-indigo-50 text-indigo-700",
    tooltip: "Almacenada y disponible para retiro o envío al seller",
  },
  en_transferencia: {
    label: "En transferencia",
    icon: "truck",
    className: "bg-sky-50 text-sky-700",
    tooltip: "En tránsito hacia bodega destino",
  },
  recibida_en_cd: {
    label: "Recibida en CD",
    icon: "mapPin",
    className: "bg-primary-25 text-primary-600",
    tooltip: "Recepcionada en bodega destino tras transferencia",
  },
  retirada_en_bodega: {
    label: "Retirada en bodega",
    icon: "check",
    className: "bg-green-50 text-green-700",
    tooltip: "Seller retiró presencialmente",
  },
  enviada_al_seller: {
    label: "Enviada al seller",
    icon: "send",
    className: "bg-green-100 text-green-800",
    tooltip: "Despachada por courier al seller",
  },
  cancelada: {
    label: "Cancelada",
    icon: "ban",
    className: "bg-red-50 text-red-700",
    tooltip: "Devolución anulada",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const config = statusConfig[status];
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

export { statusConfig };
export type { ReturnStatus };
