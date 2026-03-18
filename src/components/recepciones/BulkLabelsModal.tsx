"use client";

import { useState } from "react";
import { X, Printer, QrCode02, Package } from "@untitled-ui/icons-react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";

type LabelFormat = "standard" | "compact" | "full";

type Props = {
  open: boolean;
  onClose: () => void;
  orId: string;
  seller: string;
  sucursal: string;
  defaultBultos: number;
};

const FORMAT_META: Record<LabelFormat, { label: string; size: string }> = {
  standard: { label: "Estándar", size: "10 × 7 cm" },
  compact:  { label: "Compacta", size: "7 × 5 cm" },
  full:     { label: "Hoja completa", size: "Carta / A4" },
};

export default function BulkLabelsModal({ open, onClose, orId, seller, sucursal, defaultBultos }: Props) {
  const [bultos, setBultos]   = useState(defaultBultos);
  const [format, setFormat]   = useState<LabelFormat>("standard");
  const [generated, setGenerated] = useState(false);

  if (!open) return null;

  const handleGenerate = () => {
    setGenerated(true);
    setTimeout(() => setGenerated(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="relative bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">
            Generar etiquetas para bultos
          </h1>
          <button onClick={onClose} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">

          {/* Bultos input */}
          <FormField
            label="Cantidad de bultos"
            type="number"
            value={String(bultos)}
            onChange={v => setBultos(Math.max(1, parseInt(v) || 1))}
          />

          {/* Format selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Formato de etiqueta
            </label>
            <div className="space-y-2">
              {(Object.keys(FORMAT_META) as LabelFormat[]).map(key => (
                <label
                  key={key}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    format === key
                      ? "border-primary-400 bg-primary-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="label-format"
                    checked={format === key}
                    onChange={() => setFormat(key)}
                    className="accent-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{FORMAT_META[key].label}</p>
                    <p className="text-xs text-neutral-500">{FORMAT_META[key].size}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Vista previa de etiqueta
            </p>
            <div className="border border-dashed border-neutral-300 rounded-lg p-4 flex items-center gap-4 bg-neutral-50">
              <div className="w-14 h-14 bg-white rounded border border-neutral-200 flex items-center justify-center flex-shrink-0">
                <QrCode02 className="w-8 h-8 text-neutral-400" />
              </div>
              <div className="min-w-0 text-xs text-neutral-600 space-y-0.5">
                <p className="font-semibold text-neutral-800">{orId}</p>
                <p>{seller}</p>
                <p>{sucursal}</p>
                <p className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Bulto 1/{bultos}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5">
          <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={generated}
            iconLeft={generated ? (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <Printer className="w-4 h-4" />
            )}
            className={`flex-1 ${generated ? "!bg-green-500" : ""}`}
          >
            {generated ? "PDF generado" : `Generar ${bultos} etiqueta${bultos !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
