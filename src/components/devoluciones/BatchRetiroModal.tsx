"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Truck, Check } from "lucide-react";
import Button from "@/components/ui/Button";

// ─── Types ───────────────────────────────────────────────────────────────────
type ReturnItem = {
  id: string;
  displayId: string;
  orderId: string | null;
  createdAt: string;
};

type Retirante = {
  nombre: string;
  apellido: string;
  email: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sellerName: string;
  returns: ReturnItem[];
  onConfirm: (selectedIds: string[], retirante: Retirante) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BatchRetiroModal({ open, onClose, sellerName, returns, onConfirm }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(returns.map(r => r.id)));
  const [retirante, setRetirante] = useState<Retirante>({ nombre: "", apellido: "", email: "" });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  const prevOpen = useMemo(() => {
    if (open) {
      setSelectedIds(new Set(returns.map(r => r.id)));
      setRetirante({ nombre: "", apellido: "", email: "" });
    }
    return open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus first interactive element on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 100);
    }
  }, [open]);

  if (!open) return null;

  const toggleId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === returns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(returns.map(r => r.id)));
    }
  };

  const isRetiranteValid =
    retirante.nombre.trim().length > 0 &&
    retirante.apellido.trim().length > 0 &&
    retirante.email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(retirante.email);

  const canConfirm = selectedIds.size > 0 && isRetiranteValid;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="retiro-modal-title"
        className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary-600" />
              </div>
              <h2 id="retiro-modal-title" className="text-base font-bold text-neutral-900">
                Retiro de devoluciones — {sellerName}
              </h2>
            </div>
            <p className="text-sm text-neutral-500 ml-10">
              {returns.length} {returns.length === 1 ? "devolución lista" : "devoluciones listas"} para devolver
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Checkbox list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                Devoluciones a retirar
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {selectedIds.size === returns.length ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
            </div>
            <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-48 overflow-y-auto">
              {returns.map(ret => {
                const isChecked = selectedIds.has(ret.id);
                return (
                  <label
                    key={ret.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isChecked ? "bg-primary-50/50" : "hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleId(ret.id)}
                      className="sr-only peer"
                    />
                    <span
                      className={`flex w-[18px] h-[18px] rounded items-center justify-center flex-shrink-0 transition-colors border-[1.5px] ${
                        isChecked
                          ? "bg-primary-500 border-primary-500"
                          : "bg-white border-neutral-300"
                      }`}
                    >
                      {isChecked && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{ret.displayId}</span>
                        {ret.orderId && (
                          <span className="text-xs text-neutral-400">{ret.orderId}</span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">{fmtDate(ret.createdAt)}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-neutral-200" />

          {/* Retirante data */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-3">
              Datos del retirante
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={retirante.nombre}
                  onChange={e => setRetirante(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={retirante.apellido}
                  onChange={e => setRetirante(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={retirante.email}
                  onChange={e => setRetirante(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!canConfirm}
            onClick={() => onConfirm(Array.from(selectedIds), retirante)}
            iconLeft={<Truck className="w-4 h-4" />}
          >
            Confirmar retiro ({selectedIds.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
