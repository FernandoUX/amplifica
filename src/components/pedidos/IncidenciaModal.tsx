"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

const TIPO_OPTIONS = [
  "Producto dañado",
  "Falta stock",
  "Dirección incorrecta",
  "Demora courier",
  "Rechazo cliente",
  "Otro",
];

type IncidenciaModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { tipo: string; descripcion: string; responsable: string }) => void;
  pedidoId: string;
};

export default function IncidenciaModal({ open, onClose, onSubmit, pedidoId }: IncidenciaModalProps) {
  const [tipo, setTipo] = useState(TIPO_OPTIONS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [responsable, setResponsable] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    onSubmit({ tipo, descripcion, responsable });
    setTipo(TIPO_OPTIONS[0]);
    setDescripcion("");
    setResponsable("");
  };

  const isValid = descripcion.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Registrar incidencia</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Pedido {pedidoId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
              Tipo de incidencia <span className="text-red-500">*</span>
            </label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full h-9 px-3 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-all bg-white"
            >
              {TIPO_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe el problema encontrado..."
              rows={3}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-all resize-none"
            />
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
              Responsable
            </label>
            <input
              type="text"
              value={responsable}
              onChange={e => setResponsable(e.target.value)}
              placeholder="Nombre del responsable asignado"
              className="w-full h-9 px-3 border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 px-6 pb-6">
          <Button variant="secondary" size="lg" onClick={onClose} className="w-full sm:flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full sm:flex-1"
          >
            Registrar incidencia
          </Button>
        </div>
      </div>
    </div>
  );
}
