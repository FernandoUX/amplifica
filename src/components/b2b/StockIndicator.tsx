"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { StockPorSucursal } from "@/app/pedidos-b2b/_data";

type StockIndicatorProps = {
  stockQuilicura: number;
  stockGlobal: number;
  stockDetalle: StockPorSucursal[];
  cantidadSolicitada: number;
};

export default function StockIndicator({ stockQuilicura, stockGlobal, stockDetalle, cantidadSolicitada }: StockIndicatorProps) {
  const [showPopover, setShowPopover] = useState(false);

  const suficienteQuilicura = stockQuilicura >= cantidadSolicitada;
  const suficienteGlobal = stockGlobal >= cantidadSolicitada;

  const variant = suficienteQuilicura
    ? "disponible"
    : suficienteGlobal
    ? "redistribucion"
    : "sin_stock";

  const config = {
    disponible: {
      icon: CheckCircle2,
      label: "Disponible",
      badgeClass: "bg-green-50 text-green-700",
      iconClass: "text-green-500",
    },
    redistribucion: {
      icon: Clock,
      label: "Requiere traslado",
      badgeClass: "bg-amber-50 text-amber-700",
      iconClass: "text-amber-500",
    },
    sin_stock: {
      icon: XCircle,
      label: "Sin stock",
      badgeClass: "bg-red-50 text-red-600",
      iconClass: "text-red-500",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={`inline-flex items-center gap-1 rounded-full pl-1.5 pr-2 py-0.5 text-[11px] font-medium leading-none ${config.badgeClass}`}
      >
        <Icon className={`w-3 h-3 ${config.iconClass}`} />
        {config.label}
      </button>

      {/* Popover: desglose por sucursal */}
      {showPopover && (
        <div className="absolute z-40 top-full mt-1.5 left-0 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 px-3 min-w-[200px]">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            Stock por sucursal
          </p>
          <div className="space-y-1">
            {stockDetalle.map(s => (
              <div key={s.sucursal} className="flex items-center justify-between text-xs">
                <span className={`${s.sucursal === "CD Quilicura" ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>
                  {s.sucursal}
                </span>
                <span className={`font-mono font-medium ${
                  s.disponible === 0 ? "text-red-500" : s.disponible < cantidadSolicitada ? "text-amber-600" : "text-green-600"
                }`}>
                  {s.disponible} uds
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 mt-1.5 pt-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-700">Stock global</span>
            <span className="font-mono font-bold text-neutral-900">{stockGlobal} uds</span>
          </div>
        </div>
      )}
    </div>
  );
}
