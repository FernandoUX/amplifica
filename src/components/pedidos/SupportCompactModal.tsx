"use client";

import type { PedidoDetalle } from "@/app/pedidos/_data";
import {
  X, Copy, Check, Hash, Package, Truck, MapPin,
  User, Phone, ClipboardList,
} from "lucide-react";
import { useState } from "react";
import PedidoStatusBadge from "./PedidoStatusBadge";
import EnvioStatusBadge from "./EnvioStatusBadge";

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
      className="text-neutral-300 hover:text-neutral-500 transition-colors p-1 rounded hover:bg-neutral-50"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function FieldRow({ icon: Icon, label, value, copyValue }: {
  icon: typeof Hash;
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-neutral-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-neutral-800 font-medium truncate">{value}</div>
      </div>
      {copyValue && <CopyButton value={copyValue} />}
    </div>
  );
}

export default function SupportCompactModal({ open, onClose, pedido }: SupportCompactModalProps) {
  if (!open) return null;

  const courier = pedido.cotizacion?.courier ?? "Sin courier";
  const tracking = pedido.cotizacion?.trackingNumber ?? "Sin tracking";
  const destinatario = pedido.destinatario;
  const direccion = `${destinatario.calle} ${destinatario.numero}, ${destinatario.comuna}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Vista rápida</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{pedido.idAmplifica}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors rounded-lg p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Estado badges */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Preparación</p>
              <PedidoStatusBadge status={pedido.estadoPreparacion} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Envío</p>
              <EnvioStatusBadge status={pedido.estadoEnvio} />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 mx-5" />

        {/* Envío info */}
        <div className="px-5 py-3 space-y-3">
          <FieldRow
            icon={Truck}
            label="Courier"
            value={courier}
            copyValue={courier}
          />
          <FieldRow
            icon={Package}
            label="Tracking"
            value={
              tracking === "Sin tracking"
                ? <span className="text-neutral-400">{tracking}</span>
                : tracking
            }
            copyValue={tracking !== "Sin tracking" ? tracking : undefined}
          />
        </div>

        <div className="border-t border-neutral-100 mx-5" />

        {/* Destinatario */}
        <div className="px-5 py-3 space-y-3">
          <FieldRow
            icon={User}
            label="Destinatario"
            value={destinatario.nombre}
            copyValue={destinatario.nombre}
          />
          <FieldRow
            icon={Phone}
            label="Teléfono"
            value={destinatario.telefono}
            copyValue={destinatario.telefono}
          />
          <FieldRow
            icon={MapPin}
            label="Dirección"
            value={direccion}
            copyValue={direccion}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-5 py-2.5">
          <p className="text-[10px] text-neutral-400 text-center tracking-wide">
            <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500 font-mono text-[10px]">Ctrl+Shift+R</kbd>
            {" "}para abrir/cerrar
          </p>
        </div>
      </div>
    </div>
  );
}
