"use client";

import {
  Clock, CheckCircle2, RotateCcw, CircleDollarSign,
} from "lucide-react";
import type { PagoStatus } from "@/app/pedidos/_data";

type StatusConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  iconClass: string;
  tooltip: string;
};

const STATUS_MAP: Record<PagoStatus, StatusConfig> = {
  pendiente: {
    label: "Pago pendiente",
    icon: Clock,
    className: "bg-amber-50 text-amber-700",
    iconClass: "text-amber-500",
    tooltip: "El pago del pedido está pendiente",
  },
  pagado: {
    label: "Pagado",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700",
    iconClass: "text-green-500",
    tooltip: "El pedido fue pagado exitosamente",
  },
  reembolsado: {
    label: "Reembolsado",
    icon: RotateCcw,
    className: "bg-red-50 text-red-600",
    iconClass: "text-red-500",
    tooltip: "El pago fue reembolsado al cliente",
  },
  parcial: {
    label: "Pago parcial",
    icon: CircleDollarSign,
    className: "bg-blue-50 text-blue-700",
    iconClass: "text-blue-500",
    tooltip: "El pedido tiene un pago parcial registrado",
  },
};

export default function PagoStatusBadge({ status }: { status: PagoStatus }) {
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

export { STATUS_MAP as PAGO_STATUS_MAP };
