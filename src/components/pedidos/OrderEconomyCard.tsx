"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type OrderEconomyCardProps = {
  subtotal: number;
  descuentos: number;
  impuestos: number;
  costoEnvio: number;
  montoTotal: number;
};

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default function OrderEconomyCard({
  subtotal,
  descuentos,
  impuestos,
  costoEnvio,
  montoTotal,
}: OrderEconomyCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Desglose Económico</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Line items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-medium text-neutral-900">{fmt(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Descuentos</span>
            <span className={`font-medium ${descuentos > 0 ? "text-green-600" : "text-neutral-900"}`}>
              {descuentos > 0 ? `-${fmt(descuentos)}` : fmt(0)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Impuestos (19%)</span>
            <span className="font-medium text-neutral-900">{fmt(impuestos)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Envío</span>
            <span className="font-medium text-neutral-900">{fmt(costoEnvio)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-neutral-100 mt-3 pt-3">
          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
            Total Pedido
          </p>
          <p className="text-2xl font-bold text-primary-600">{fmt(montoTotal)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
