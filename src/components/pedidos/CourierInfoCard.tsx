"use client";

import { useState } from "react";
import { Truck, Copy, Check, Printer } from "lucide-react";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import Button from "@/components/ui/Button";

type CourierInfoCardProps = {
  courier: string;
  servicio: string;
  trackingNumber?: string;
  trackingUrl?: string;
  costo?: number;
  estado?: "vigente" | "expirada" | "requiere_recotizacion";
  tiempoEstimado?: string;
  dimensiones?: { peso: number; largo: number; ancho: number; alto: number };
  variant?: "compact" | "full";
  onRequote?: () => void;
  onGenerateLabel?: () => void;
};

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

function CopyTrackingButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* noop */ }
      }}
      className="text-neutral-400 hover:text-neutral-600 transition-colors"
      title="Copiar tracking"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CourierInfoCard({
  courier,
  servicio,
  trackingNumber,
  trackingUrl,
  costo,
  estado,
  tiempoEstimado,
  dimensiones,
  variant = "compact",
  onRequote,
  onGenerateLabel,
}: CourierInfoCardProps) {
  const isCompact = variant === "compact";

  const estadoLabel = estado === "vigente" ? "Cotizado" : estado === "expirada" ? "Expirada" : "Requiere recotización";
  const estadoColor = estado === "vigente" ? "bg-green-50 text-green-700" : estado === "expirada" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

  return (
    <CollapsibleCard title="Información del Courier">
        {/* Courier header + dimensions */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-primary-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-800">{courier}</p>
            <p className="text-xs text-primary-500">{servicio}</p>
          </div>
          {dimensiones && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Dimensiones</p>
              <p className="text-xs font-medium text-neutral-700">
                {dimensiones.largo}×{dimensiones.ancho}×{dimensiones.alto}cm ({dimensiones.peso}kg)
              </p>
            </div>
          )}
        </div>

        {/* Data rows */}
        <div className="space-y-2.5">
          {/* Tracking */}
          {trackingNumber && (
            <div className="bg-neutral-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Tracking</p>
                {trackingUrl ? (
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-neutral-800 font-mono hover:text-primary-500 transition-colors">
                    {trackingNumber}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-neutral-800 font-mono">{trackingNumber}</p>
                )}
              </div>
              <CopyTrackingButton text={trackingNumber} />
            </div>
          )}

          {/* Full variant: extra fields */}
          {!isCompact && (
            <>
              {costo !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Costo de Envío</span>
                  <span className="font-semibold text-neutral-800">{fmt(costo)}</span>
                </div>
              )}

              {estado && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Estado</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${estadoColor}`}>
                    {estadoLabel}
                  </span>
                </div>
              )}

              {tiempoEstimado && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Tiempo estimado</span>
                  <span className="font-medium text-neutral-700">{tiempoEstimado}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Full variant: action buttons */}
        {!isCompact && (
          <div className="mt-4 space-y-2">
            {onGenerateLabel && (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                iconLeft={<Printer className="w-4 h-4" />}
                onClick={onGenerateLabel}
              >
                Generar Etiqueta
              </Button>
            )}
            {onRequote && (
              <Button variant="secondary" size="sm" className="w-full" onClick={onRequote}>
                Recotizar
              </Button>
            )}
          </div>
        )}
    </CollapsibleCard>
  );
}
