"use client";

import {
  Inbox, FileWarning, CheckCircle2, ArrowLeftRight, ClipboardList,
  PackageCheck, Truck, CircleCheckBig, AlertTriangle, Ban,
  Store, ShoppingBag,
} from "lucide-react";
import type { B2BStatus } from "@/app/pedidos-b2b/_data";

type StatusConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  iconClass: string;
  tooltip: string;
};

const STATUS_MAP: Record<B2BStatus, StatusConfig> = {
  "Recibido": {
    label: "Recibido",
    icon: Inbox,
    className: "bg-sky-50 text-sky-700",
    iconClass: "text-sky-500",
    tooltip: "Pedido recibido. Evaluando condiciones de validación.",
  },
  "Documentación pendiente": {
    label: "Doc. pendiente",
    icon: FileWarning,
    className: "bg-amber-50 text-amber-700",
    iconClass: "text-amber-500",
    tooltip: "Faltan documentos obligatorios del marketplace.",
  },
  "Validado": {
    label: "Validado",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700",
    iconClass: "text-green-500",
    tooltip: "Listo para ser preparado por operaciones.",
  },
  "Redistribución pendiente": {
    label: "Redistribución",
    icon: ArrowLeftRight,
    className: "bg-orange-50 text-orange-700",
    iconClass: "text-orange-500",
    tooltip: "Esperando redistribución de stock desde otra sucursal.",
  },
  "En preparación": {
    label: "En preparación",
    icon: ClipboardList,
    className: "bg-primary-25 text-primary-600",
    iconClass: "text-primary-500",
    tooltip: "Operador está preparando el pedido.",
  },
  "Empacado": {
    label: "Empacado",
    icon: PackageCheck,
    className: "bg-indigo-50 text-indigo-700",
    iconClass: "text-indigo-500",
    tooltip: "Todos los bultos cerrados y verificados.",
  },
  "Despachado": {
    label: "Despachado",
    icon: Truck,
    className: "bg-blue-50 text-blue-700",
    iconClass: "text-blue-500",
    tooltip: "Entregado al furgón o courier para transporte.",
  },
  "Entregado": {
    label: "Entregado",
    icon: CircleCheckBig,
    className: "bg-green-100 text-green-800",
    iconClass: "text-green-600",
    tooltip: "Entrega confirmada exitosamente.",
  },
  "Entrega fallida": {
    label: "Entrega fallida",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-600",
    iconClass: "text-red-500",
    tooltip: "Intento de entrega fallido. Requiere re-agendamiento.",
  },
  "Cancelado": {
    label: "Cancelado",
    icon: Ban,
    className: "bg-neutral-100 text-neutral-600",
    iconClass: "text-neutral-400",
    tooltip: "Pedido cancelado. Stock liberado.",
  },
  "Listo para retiro": {
    label: "Listo para retiro",
    icon: Store,
    className: "bg-purple-50 text-purple-700",
    iconClass: "text-purple-500",
    tooltip: "Pedido empacado esperando retiro del seller en tienda.",
  },
  "Retirado": {
    label: "Retirado",
    icon: ShoppingBag,
    className: "bg-green-100 text-green-800",
    iconClass: "text-green-600",
    tooltip: "Seller retiró el pedido en tienda.",
  },
};

export default function B2BStatusBadge({ status }: { status: B2BStatus }) {
  const cfg = STATUS_MAP[status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <span
      title={cfg.tooltip}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full pl-1.5 pr-2 py-1 text-xs font-medium leading-none ${cfg.className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${cfg.iconClass}`} />
      {cfg.label}
    </span>
  );
}

export { STATUS_MAP as B2B_STATUS_MAP };
