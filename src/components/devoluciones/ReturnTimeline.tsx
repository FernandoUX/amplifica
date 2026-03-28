"use client";

import type { ReturnStatus } from "./ReturnStatusBadge";

// ─── Types ───────────────────────────────────────────────────────────────────
export type TimelineEntry = {
  status: ReturnStatus;
  timestamp: string;
  userName: string;
  description: string;
};

type Props = {
  entries: TimelineEntry[];
};

// ─── Status → dot color mapping ─────────────────────────────────────────────
const DOT_COLORS: Record<ReturnStatus, string> = {
  creada:              "bg-neutral-400",
  recibida_en_bodega:  "bg-amber-500",
  lista_para_devolver: "bg-indigo-500",
  en_transferencia:    "bg-sky-500",
  recibida_en_cd:      "bg-primary-500",
  retirada_en_bodega:  "bg-green-500",
  enviada_al_seller:   "bg-green-600",
  cancelada:           "bg-red-500",
};

const STATUS_LABELS: Record<ReturnStatus, string> = {
  creada:              "Creada",
  recibida_en_bodega:  "Recibida en bodega",
  lista_para_devolver: "Lista para devolver",
  en_transferencia:    "En transferencia",
  recibida_en_cd:      "Recibida en CD",
  retirada_en_bodega:  "Retirada en bodega",
  enviada_al_seller:   "Enviada al seller",
  cancelada:           "Cancelada",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return (
      date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return d;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ReturnTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-4 text-center">
        Sin historial de estados
      </p>
    );
  }

  return (
    <div className="relative">
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const dotColor = DOT_COLORS[entry.status] ?? "bg-neutral-300";

        return (
          <div key={idx} className="flex gap-3">
            {/* Left: dot + vertical line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full mt-1 ${dotColor}`} />
              {!isLast && (
                <div className="w-px flex-1 bg-neutral-200 min-h-[24px]" />
              )}
            </div>

            {/* Right: content */}
            <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
              <p className="text-sm font-medium text-neutral-900 leading-tight">
                {STATUS_LABELS[entry.status] ?? entry.status}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{fmtDate(entry.timestamp)}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                <span className="font-medium text-neutral-600">{entry.userName}</span>
                {entry.description && (
                  <span> &mdash; {entry.description}</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
