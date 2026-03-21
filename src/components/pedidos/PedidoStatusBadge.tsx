"use client";

import {
  Clock, CheckCircle2, ClipboardList, Package, PackageCheck,
  Truck, CircleCheckBig, AlertTriangle, Ban,
} from "lucide-react";

export type PedidoStatus =
  | "Pendiente"
  | "Validado"
  | "En preparación"
  | "Por empacar"
  | "Empacado"
  | "Listo para retiro"
  | "Entregado"
  | "Con atraso"
  | "Cancelado";

type StatusConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  iconClass: string;
  tooltip: string;
};

const STATUS_MAP: Record<PedidoStatus, StatusConfig> = {
  Pendiente: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-neutral-50 text-neutral-700",
    iconClass: "text-neutral-500",
    tooltip: "El pedido fue recibido y está pendiente de validación",
  },
  Validado: {
    label: "Validado",
    icon: CheckCircle2,
    className: "bg-sky-50 text-sky-700",
    iconClass: "text-sky-500",
    tooltip: "El pedido fue validado y está listo para preparación",
  },
  "En preparación": {
    label: "En preparación",
    icon: ClipboardList,
    className: "bg-primary-25 text-primary-600",
    iconClass: "text-primary-500",
    tooltip: "El pedido está siendo preparado en bodega",
  },
  "Por empacar": {
    label: "Por empacar",
    icon: Package,
    className: "bg-amber-50 text-amber-700",
    iconClass: "text-amber-500",
    tooltip: "El pedido fue preparado y está pendiente de empaque",
  },
  Empacado: {
    label: "Empacado",
    icon: PackageCheck,
    className: "bg-indigo-50 text-indigo-700",
    iconClass: "text-indigo-500",
    tooltip: "El pedido fue empacado y espera retiro del courier",
  },
  "Listo para retiro": {
    label: "Listo para retiro",
    icon: Truck,
    className: "bg-green-50 text-green-700",
    iconClass: "text-green-500",
    tooltip: "El pedido está listo para ser retirado por el courier",
  },
  Entregado: {
    label: "Entregado",
    icon: CircleCheckBig,
    className: "bg-green-100 text-green-800",
    iconClass: "text-green-600",
    tooltip: "El pedido fue entregado exitosamente al cliente",
  },
  "Con atraso": {
    label: "Con atraso",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-600",
    iconClass: "text-red-500",
    tooltip: "El pedido tiene atraso en su procesamiento",
  },
  Cancelado: {
    label: "Cancelado",
    icon: Ban,
    className: "bg-neutral-50 text-neutral-700",
    iconClass: "text-neutral-400",
    tooltip: "El pedido fue cancelado",
  },
};

export default function PedidoStatusBadge({ status }: { status: PedidoStatus }) {
  const cfg = STATUS_MAP[status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <span
      title={cfg.tooltip}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full pl-1.5 pr-2 py-0.5 text-xs font-medium leading-none ${cfg.className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${cfg.iconClass}`} />
      {cfg.label}
    </span>
  );
}

export { STATUS_MAP };
