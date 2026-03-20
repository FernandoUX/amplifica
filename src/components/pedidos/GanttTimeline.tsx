"use client";

import type { EventoTimeline } from "@/app/pedidos/_data";
import {
  PlusCircle, CheckCircle2, ClipboardList, Package, Truck,
  CircleCheckBig, Ban, AlertTriangle, Settings2, Tag,
} from "lucide-react";

type GanttTimelineProps = {
  events: EventoTimeline[];
  className?: string;
};

const iconMap: Record<EventoTimeline["tipo"], React.ComponentType<{ className?: string }>> = {
  creacion:     PlusCircle,
  validacion:   CheckCircle2,
  preparacion:  ClipboardList,
  empaque:      Package,
  envio:        Truck,
  entrega:      CircleCheckBig,
  cancelacion:  Ban,
  incidencia:   AlertTriangle,
  sistema:      Settings2,
  etiqueta:     Tag,
};

const dotColor: Record<EventoTimeline["tipo"], string> = {
  creacion:     "bg-primary-500",
  validacion:   "bg-sky-500",
  preparacion:  "bg-indigo-500",
  empaque:      "bg-amber-500",
  envio:        "bg-blue-500",
  entrega:      "bg-green-500",
  cancelacion:  "bg-red-500",
  incidencia:   "bg-red-400",
  sistema:      "bg-neutral-400",
  etiqueta:     "bg-green-400",
};

const iconColorMap: Record<EventoTimeline["tipo"], string> = {
  creacion:     "text-primary-500",
  validacion:   "text-sky-500",
  preparacion:  "text-indigo-500",
  empaque:      "text-amber-500",
  envio:        "text-blue-500",
  entrega:      "text-green-500",
  cancelacion:  "text-red-500",
  incidencia:   "text-red-400",
  sistema:      "text-neutral-400",
  etiqueta:     "text-green-400",
};

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const mi = d.getMinutes().toString().padStart(2, "0");
    return `${dd}/${mm} ${hh}:${mi}`;
  } catch {
    return ts;
  }
}

function timeAgo(ts: string) {
  try {
    const d = new Date(ts);
    const now = new Date("2026-03-20T00:00:00");
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} minutos`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  } catch {
    return "";
  }
}

export default function GanttTimeline({ events, className = "" }: GanttTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={`relative ${className}`}>
      {/* Vertical line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-neutral-100" />

      <div className="space-y-0">
        {sorted.map((evt) => {
          const Icon = iconMap[evt.tipo] || Settings2;
          return (
            <div key={evt.id} className="flex items-start gap-3 py-2.5 relative">
              {/* Dot */}
              <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-white ring-2 ring-neutral-100`}>
                <Icon className={`w-4 h-4 ${iconColorMap[evt.tipo] || "text-neutral-400"}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-800 leading-snug">
                      {evt.usuario && (
                        <span className="font-medium">{evt.usuario}</span>
                      )}
                      {evt.usuario ? " " : ""}
                      {evt.titulo}
                    </p>
                    {evt.badges && evt.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {evt.badges.map((b, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${b.color}`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {evt.descripcion && (
                      <p className="text-xs text-neutral-500 mt-0.5">{evt.descripcion}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap flex-shrink-0 font-mono">
                    {timeAgo(evt.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
