"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type ShippingEconomyCardProps = {
  costoNeto: number;
  costoCliente: number;
  subsidioAmplifica: number;
  courier: string;
  servicio: string;
};

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default function ShippingEconomyCard({
  costoNeto,
  costoCliente,
  subsidioAmplifica,
  courier,
  servicio,
}: ShippingEconomyCardProps) {
  const margen = costoCliente - costoNeto;
  const isPositive = margen >= 0;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Economía del envío
          <span className="text-xs font-normal text-neutral-400">
            {courier} — {servicio}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Costo courier</span>
            <span className="font-medium text-neutral-900">{fmt(costoNeto)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Cobrado al cliente</span>
            <span className="font-medium text-neutral-900">{fmt(costoCliente)}</span>
          </div>
          {subsidioAmplifica > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Subsidio Amplifica</span>
              <span className="font-medium text-red-600">{fmt(subsidioAmplifica)}</span>
            </div>
          )}
          <div className="border-t border-neutral-100 pt-2 flex items-center justify-between text-sm">
            <span className="text-neutral-700 font-medium">Margen</span>
            <span className={`font-semibold flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? (
                margen === 0 ? <Minus className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {fmt(Math.abs(margen))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
