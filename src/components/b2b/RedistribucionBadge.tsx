"use client";

import { Clock, Package, Truck, CheckCircle2, XCircle, Ban } from "lucide-react";
import type { RedistribucionEstado } from "@/app/pedidos-b2b/_data";

const CONFIG: Record<RedistribucionEstado, { icon: React.ComponentType<{ className?: string }>; label: string; className: string; iconClass: string }> = {
  "Solicitada": { icon: Clock, label: "Solicitada", className: "bg-neutral-100 text-neutral-600", iconClass: "text-neutral-400" },
  "Reservada en origen": { icon: Package, label: "Reservada", className: "bg-blue-50 text-blue-700", iconClass: "text-blue-500" },
  "En tránsito": { icon: Truck, label: "En tránsito", className: "bg-amber-50 text-amber-700", iconClass: "text-amber-500" },
  "Recibida en destino": { icon: CheckCircle2, label: "Recibida", className: "bg-green-50 text-green-700", iconClass: "text-green-500" },
  "Fallida": { icon: XCircle, label: "Fallida", className: "bg-red-50 text-red-600", iconClass: "text-red-500" },
  "Cancelada": { icon: Ban, label: "Cancelada", className: "bg-neutral-100 text-neutral-500", iconClass: "text-neutral-400" },
};

export default function RedistribucionBadge({ estado }: { estado: RedistribucionEstado }) {
  const cfg = CONFIG[estado];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-2 py-1 text-xs font-medium leading-none ${cfg.className}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.iconClass}`} />
      {cfg.label}
    </span>
  );
}
