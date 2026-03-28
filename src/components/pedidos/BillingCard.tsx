"use client";

import { Receipt, ExternalLink } from "lucide-react";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import type { FacturacionB2B } from "@/app/pedidos/_data";

const CONDICION_LABELS: Record<FacturacionB2B["condicionPago"], string> = {
  "30_dias": "30 días",
  "60_dias": "60 días",
  "90_dias": "90 días",
  contado: "Contado",
};

const FACTURA_STATUS: Record<FacturacionB2B["estadoFactura"], { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-amber-50 text-amber-700" },
  emitida: { label: "Emitida", className: "bg-blue-50 text-blue-700" },
  pagada: { label: "Pagada", className: "bg-green-50 text-green-700" },
};

export default function BillingCard(props: FacturacionB2B) {
  const facturaStatus = FACTURA_STATUS[props.estadoFactura] ?? FACTURA_STATUS.pendiente;

  return (
    <CollapsibleCard
      icon={Receipt}
      title="Facturación B2B"
      description="Datos de facturación empresa"
      defaultOpen
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {/* Razón Social */}
        <div className="col-span-2">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Razón Social</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">{props.razonSocial}</p>
        </div>

        {/* RUT */}
        <div>
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">RUT</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">{props.rut}</p>
        </div>

        {/* Giro */}
        {props.giro && (
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Giro</p>
            <p className="text-sm text-neutral-700 mt-0.5">{props.giro}</p>
          </div>
        )}

        {/* Condición de pago */}
        <div>
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Condición de pago</p>
          <span className="inline-block mt-1 text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
            {CONDICION_LABELS[props.condicionPago]}
          </span>
        </div>

        {/* Estado factura */}
        <div>
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Estado factura</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${facturaStatus.className}`}>
            {facturaStatus.label}
          </span>
        </div>

        {/* Link factura */}
        {props.facturaUrl && (
          <div className="col-span-2 pt-1">
            <a
              href={props.facturaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver factura
            </a>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
