"use client";

import { Clock, Package, Truck, CheckCircle2, XCircle, MapPin, ArrowRight } from "lucide-react";
import type { RedistribucionB2B } from "@/app/pedidos-b2b/_data";
import RedistribucionBadge from "./RedistribucionBadge";

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) + " " + date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

const STEP_ORDER = ["Solicitada", "Reservada en origen", "En tránsito", "Recibida en destino"] as const;

type RedistribucionTrackerProps = {
  redistribuciones: RedistribucionB2B[];
  onConfirmRecepcion?: (redId: string) => void;
};

export default function RedistribucionTracker({ redistribuciones, onConfirmRecepcion }: RedistribucionTrackerProps) {
  if (redistribuciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
        <p className="text-sm text-neutral-500">Sin redistribuciones activas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {redistribuciones.map(red => {
        const currentIdx = STEP_ORDER.indexOf(red.estado as typeof STEP_ORDER[number]);
        const isFailed = red.estado === "Fallida" || red.estado === "Cancelada";
        const isComplete = red.estado === "Recibida en destino";

        return (
          <div key={red.id} className={`border rounded-xl p-4 space-y-3 ${
            isFailed ? "border-red-200 bg-red-50/30" :
            isComplete ? "border-green-200 bg-green-50/30" :
            "border-neutral-200"
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">{red.sku}</span>
                <span className="text-xs text-neutral-500">×{red.cantidad} uds</span>
                {red.prioridad === "urgente" && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">URGENTE</span>
                )}
              </div>
              <RedistribucionBadge estado={red.estado} />
            </div>

            {/* Route */}
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium">{red.sucursalOrigen}</span>
              <ArrowRight className="w-3 h-3 text-neutral-300" />
              <span className="font-medium">CD Quilicura</span>
            </div>

            {/* Timeline steps */}
            {!isFailed && (
              <div className="flex items-center gap-1 px-2">
                {STEP_ORDER.map((step, i) => {
                  const done = i <= currentIdx;
                  const active = i === currentIdx && !isComplete;
                  return (
                    <div key={step} className="flex items-center gap-1 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        done ? "bg-green-500" : active ? "bg-primary-500 ring-2 ring-primary-100" : "bg-neutral-200"
                      }`}>
                        {done && i < currentIdx ? (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        ) : (
                          <span className="text-[9px] font-bold text-white">{i + 1}</span>
                        )}
                      </div>
                      {i < STEP_ORDER.length - 1 && (
                        <div className={`flex-1 h-0.5 rounded-full ${done && i < currentIdx ? "bg-green-300" : "bg-neutral-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Creada: {fmtDate(red.fechaCreacion)}</span>
              <span>Estimada: {fmtDate(red.fechaEstimada)}</span>
            </div>

            {/* Confirm button (for "En tránsito") */}
            {red.estado === "En tránsito" && onConfirmRecepcion && (
              <button
                onClick={() => onConfirmRecepcion(red.id)}
                className="w-full py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Confirmar recepción en Quilicura
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
