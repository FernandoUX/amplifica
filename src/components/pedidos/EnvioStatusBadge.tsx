"use client";

import {
  Clock, ClipboardList, Send, Truck, MapPin, PackageCheck,
  RotateCcw, CircleCheckBig, UserCheck, PackageOpen, Undo2,
  ArrowLeftCircle, Timer, Ban, AlertTriangle, AlertOctagon,
  HelpCircle, CalendarClock,
} from "lucide-react";

export type EnvioStatus =
  | "Pendiente"
  | "Solicitado"
  | "Enviado"
  | "En Ruta Final"
  | "Intento de Entrega"
  | "Entregado"
  | "Devuelto"
  | "Retirado"
  | "Expirado"
  | "Cancelado"
  | "En Ruta a Pickup"
  | "Programado"
  | "En ruta a devolución"
  | "Atrasado"
  | "Retirado por courier"
  | "Requiere atención"
  | "Listo para retiro"
  | "No Proporcionado";

type StatusConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  iconClass: string;
  tooltip: string;
};

export const ENVIO_STATUS_MAP: Record<EnvioStatus, StatusConfig> = {
  Pendiente: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-neutral-50 text-neutral-600",
    iconClass: "text-neutral-400",
    tooltip: "El envío está pendiente de gestión",
  },
  Solicitado: {
    label: "Solicitado",
    icon: ClipboardList,
    className: "bg-sky-50 text-sky-700",
    iconClass: "text-sky-500",
    tooltip: "El envío fue solicitado al courier",
  },
  Programado: {
    label: "Programado",
    icon: CalendarClock,
    className: "bg-blue-50 text-blue-700",
    iconClass: "text-blue-500",
    tooltip: "El envío está programado para retiro",
  },
  Enviado: {
    label: "Enviado",
    icon: Send,
    className: "bg-indigo-50 text-indigo-700",
    iconClass: "text-indigo-500",
    tooltip: "El paquete fue enviado y está en tránsito",
  },
  "En Ruta Final": {
    label: "En Ruta Final",
    icon: Truck,
    className: "bg-primary-25 text-primary-600",
    iconClass: "text-primary-500",
    tooltip: "El paquete está en la ruta final de entrega",
  },
  "En Ruta a Pickup": {
    label: "En Ruta a Pickup",
    icon: MapPin,
    className: "bg-violet-50 text-violet-700",
    iconClass: "text-violet-500",
    tooltip: "El paquete está en ruta al punto de retiro",
  },
  "Retirado por courier": {
    label: "Retirado por courier",
    icon: PackageCheck,
    className: "bg-cyan-50 text-cyan-700",
    iconClass: "text-cyan-500",
    tooltip: "El paquete fue retirado por el courier",
  },
  "Intento de Entrega": {
    label: "Intento de Entrega",
    icon: RotateCcw,
    className: "bg-amber-50 text-amber-700",
    iconClass: "text-amber-500",
    tooltip: "Se realizó un intento de entrega sin éxito",
  },
  Entregado: {
    label: "Entregado",
    icon: CircleCheckBig,
    className: "bg-green-100 text-green-800",
    iconClass: "text-green-600",
    tooltip: "El paquete fue entregado exitosamente",
  },
  Retirado: {
    label: "Retirado",
    icon: UserCheck,
    className: "bg-green-50 text-green-700",
    iconClass: "text-green-500",
    tooltip: "El paquete fue retirado por el cliente",
  },
  "Listo para retiro": {
    label: "Listo para retiro",
    icon: PackageOpen,
    className: "bg-teal-50 text-teal-700",
    iconClass: "text-teal-500",
    tooltip: "El paquete está listo para ser retirado en el punto",
  },
  Devuelto: {
    label: "Devuelto",
    icon: Undo2,
    className: "bg-orange-50 text-orange-700",
    iconClass: "text-orange-500",
    tooltip: "El paquete fue devuelto al remitente",
  },
  "En ruta a devolución": {
    label: "En ruta a devolución",
    icon: ArrowLeftCircle,
    className: "bg-orange-50 text-orange-600",
    iconClass: "text-orange-400",
    tooltip: "El paquete está en ruta de devolución al remitente",
  },
  Expirado: {
    label: "Expirado",
    icon: Timer,
    className: "bg-neutral-100 text-neutral-500",
    iconClass: "text-neutral-400",
    tooltip: "El plazo de retiro del paquete expiró",
  },
  Cancelado: {
    label: "Cancelado",
    icon: Ban,
    className: "bg-neutral-50 text-neutral-500",
    iconClass: "text-neutral-400",
    tooltip: "El envío fue cancelado",
  },
  Atrasado: {
    label: "Atrasado",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-600",
    iconClass: "text-red-500",
    tooltip: "El envío tiene atraso respecto al plazo comprometido",
  },
  "Requiere atención": {
    label: "Requiere atención",
    icon: AlertOctagon,
    className: "bg-red-100 text-red-700",
    iconClass: "text-red-500",
    tooltip: "El envío requiere intervención manual",
  },
  "No Proporcionado": {
    label: "No Proporcionado",
    icon: HelpCircle,
    className: "bg-neutral-50 text-neutral-400",
    iconClass: "text-neutral-300",
    tooltip: "No se proporcionó información de envío",
  },
};

/** Ordered list of all envio statuses for filters */
export const ALL_ENVIO_STATUSES: EnvioStatus[] = [
  "Pendiente", "Solicitado", "Programado", "Enviado", "En Ruta Final",
  "En Ruta a Pickup", "Retirado por courier", "Intento de Entrega",
  "Entregado", "Retirado", "Listo para retiro", "Devuelto",
  "En ruta a devolución", "Expirado", "Cancelado", "Atrasado",
  "Requiere atención", "No Proporcionado",
];

export default function EnvioStatusBadge({ status }: { status: EnvioStatus }) {
  const cfg = ENVIO_STATUS_MAP[status];
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
