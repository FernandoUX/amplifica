"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import AlertModal from "@/components/ui/AlertModal";

// ─── Types ───────────────────────────────────────────────────────────────────
type Props = {
  open: boolean;
  onClose: () => void;
  displayId: string;
  onConfirm: (reason: string) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function CancelReturnModal({ open, onClose, displayId, onConfirm }: Props) {
  const [reason, setReason] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const isValid = reason.trim().length >= 10;

  return (
    <AlertModal
      open={open}
      onClose={onClose}
      icon={AlertTriangle}
      variant="danger"
      title="Anular devolucion"
      subtitle={displayId}
      confirm={{
        label: "Anular devolucion",
        onClick: () => {
          if (isValid) onConfirm(reason.trim());
        },
      }}
      cancelLabel="Cancelar"
    >
      <div className="space-y-3">
        <p className="text-sm text-neutral-700">
          Esta accion es irreversible. La devolucion pasara a estado{" "}
          <strong className="font-semibold text-red-600">cancelada</strong>.
        </p>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Motivo de anulacion <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe el motivo de la anulacion (min. 10 caracteres)"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/15 resize-none transition-colors"
          />
          {reason.length > 0 && reason.trim().length < 10 && (
            <p className="text-xs text-red-500 mt-1">
              Minimo 10 caracteres ({reason.trim().length}/10)
            </p>
          )}
        </div>
      </div>
    </AlertModal>
  );
}
