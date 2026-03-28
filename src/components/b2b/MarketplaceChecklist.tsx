"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Upload, AlertTriangle, FileText } from "lucide-react";
import type { ChecklistItem, CanalVenta } from "@/app/pedidos-b2b/_data";

type MarketplaceChecklistProps = {
  canal: CanalVenta;
  checklist: ChecklistItem[];
  bultos: number;
  onUpload: (itemId: string) => void;
  onChecklistChange: (updated: ChecklistItem[]) => void;
};

export default function MarketplaceChecklist({ canal, checklist, bultos, onUpload, onChecklistChange }: MarketplaceChecklistProps) {
  const completed = checklist.filter(c => c.completado).length;
  const obligatorios = checklist.filter(c => c.obligatorio);
  const obligatoriosCompletos = obligatorios.filter(c => c.completado).length;
  const allObligatoriosOk = obligatoriosCompletos === obligatorios.length;

  const handleUpload = (itemId: string) => {
    onUpload(itemId);
    const updated = checklist.map(c => c.id === itemId ? { ...c, completado: true } : c);
    onChecklistChange(updated);
  };

  const canalLabel = canal === "Mercado Libre" ? "Mercado Libre" : "Falabella";
  const canalColor = canal === "Mercado Libre" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-green-50 border-green-200 text-green-800";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${canalColor}`}>
            {canalLabel}
          </span>
          <span className="text-xs text-neutral-500">
            {completed}/{checklist.length} requisitos
          </span>
        </div>
        {!allObligatoriosOk && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
            <AlertTriangle className="w-3 h-3" />
            {obligatorios.length - obligatoriosCompletos} obligatorios pendientes
          </span>
        )}
        {allObligatoriosOk && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Documentación completa
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${allObligatoriosOk ? "bg-green-500" : "bg-amber-400"}`}
          style={{ width: `${(completed / checklist.length) * 100}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map(item => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
              item.completado
                ? "border-green-200 bg-green-50/50"
                : item.obligatorio
                ? "border-neutral-200 bg-white"
                : "border-neutral-100 bg-neutral-50/50"
            }`}
          >
            {/* Status icon */}
            {item.completado ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-neutral-300 flex-shrink-0" />
            )}

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.completado ? "text-green-700" : "text-neutral-800"}`}>
                {item.requisito}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {item.obligatorio ? "Obligatorio" : "Recomendado"}
                {item.id.includes("bulto") && ` — ${bultos} bultos declarados`}
              </p>
            </div>

            {/* Upload action */}
            {!item.completado ? (
              <button
                onClick={() => handleUpload(item.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50 text-xs font-medium text-neutral-500 hover:text-primary-600 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Subir
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-green-600">
                <FileText className="w-3 h-3" />
                Cargado
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Info callout */}
      {!allObligatoriosOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          Puedes continuar sin completar todos los documentos. El pedido quedará en estado
          <strong> &quot;Documentación pendiente&quot;</strong> hasta que subas los obligatorios.
        </div>
      )}
    </div>
  );
}
