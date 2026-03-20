"use client";

import type { PedidoDetalle } from "@/app/pedidos/_data";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

type SupportCompactModalProps = {
  open: boolean;
  onClose: () => void;
  pedido: PedidoDetalle;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };
  return (
    <button
      onClick={handleCopy}
      className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function SupportCompactModal({ open, onClose, pedido }: SupportCompactModalProps) {
  if (!open) return null;

  const fields = [
    { label: "ID Amplifica", value: pedido.idAmplifica },
    { label: "Estado", value: `${pedido.estadoPreparacion} / ${pedido.estadoEnvio}` },
    { label: "Courier", value: pedido.cotizacion?.courier ?? "Sin courier" },
    { label: "Tracking", value: pedido.cotizacion?.trackingNumber ?? "Sin tracking" },
    { label: "Destinatario", value: `${pedido.destinatario.nombre} — ${pedido.destinatario.telefono}` },
    { label: "Dirección", value: `${pedido.destinatario.calle} ${pedido.destinatario.numero}, ${pedido.destinatario.comuna}` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-bold text-neutral-900">Vista rápida</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 pb-5 space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm text-neutral-800 font-medium truncate">{f.value}</p>
              </div>
              <CopyButton value={f.value} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-5 py-3">
          <p className="text-[10px] text-neutral-400 text-center">
            Ctrl+Shift+R para abrir/cerrar
          </p>
        </div>
      </div>
    </div>
  );
}
