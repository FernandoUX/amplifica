"use client";

import { useState } from "react";
import { X, Printer, QrCode02, Package } from "@untitled-ui/icons-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary-500" />
            Generar etiquetas para bultos
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Bultos input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Cantidad de bultos
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={bultos}
              onChange={e => setBultos(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none text-neutral-700"
            />
          </div>

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
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generated}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:bg-green-500 transition-colors flex items-center justify-center gap-2"
          >
            {generated ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                PDF generado
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Generar {bultos} etiqueta{bultos !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
