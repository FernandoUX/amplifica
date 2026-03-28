"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ScanBarcode, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

// ─── Types ───────────────────────────────────────────────────────────────────
type ReturnItem = {
  id: string;
  displayId: string;
  status: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sellerName: string;
  returns: ReturnItem[];
  onConfirm: (scannedIds: string[]) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function ScanToSelectModal({ open, onClose, sellerName, returns, onConfirm }: Props) {
  const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());
  const [scanInput, setScanInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setScannedIds(new Set());
      setScanInput("");
      setError(null);
      // Auto-focus after a tick (animation)
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Clear error after 3s
  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const handleScan = useCallback(
    (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;

      // Find match by displayId
      const match = returns.find(
        r => r.displayId.toUpperCase() === trimmed || r.id.toUpperCase() === trimmed
      );

      if (!match) {
        showError("Devolucion no encontrada en esta lista");
        setScanInput("");
        inputRef.current?.focus();
        return;
      }

      if (scannedIds.has(match.id)) {
        showError(`${match.displayId} ya fue escaneada`);
        setScanInput("");
        inputRef.current?.focus();
        return;
      }

      // Success — add to scanned
      setScannedIds(prev => new Set(prev).add(match.id));
      setError(null);
      setScanInput("");
      inputRef.current?.focus();

      // Play success beep (Web Audio API)
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch {
        // Audio not available — silent
      }
    },
    [returns, scannedIds, showError]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan(scanInput);
    }
  };

  if (!open) return null;

  const scannedCount = scannedIds.size;
  const totalCount = returns.length;
  const progressPct = totalCount > 0 ? (scannedCount / totalCount) * 100 : 0;

  const scannedItems = returns.filter(r => scannedIds.has(r.id));
  const pendingItems = returns.filter(r => !scannedIds.has(r.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Progress bar ── */}
        <div className="h-1.5 bg-neutral-100 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <ScanBarcode className="w-4 h-4 text-primary-600" />
              </div>
              <h2 id="scan-modal-title" className="text-base font-bold text-neutral-900">
                Preparar devoluciones — {sellerName}
              </h2>
            </div>
            <p className="text-sm text-neutral-500 ml-10">
              Escanea los codigos de las devoluciones para marcarlas como listas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Scan input — large touch target */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
              Escanear codigo
            </label>
            <input
              ref={inputRef}
              type="text"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escanea o escribe el ID de la devolucion..."
              autoFocus
              className="w-full h-14 px-4 text-base font-mono border-2 border-primary-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all bg-primary-50/30"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 font-medium">{error}</span>
            </div>
          )}

          {/* Two-column list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Scanned */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Escaneadas ({scannedCount})
                </span>
              </div>
              <div className="border border-green-200 bg-green-50/50 rounded-lg divide-y divide-green-100 max-h-56 overflow-y-auto">
                {scannedItems.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <span className="text-xs text-neutral-400">Aun sin escanear</span>
                  </div>
                ) : (
                  scannedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-neutral-900">{item.displayId}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Pending */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Circle className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Pendientes ({pendingItems.length})
                </span>
              </div>
              <div className="border border-neutral-200 bg-neutral-50/50 rounded-lg divide-y divide-neutral-100 max-h-56 overflow-y-auto">
                {pendingItems.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <span className="text-xs text-green-600 font-medium">Todas escaneadas</span>
                  </div>
                ) : (
                  pendingItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <Circle className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      <span className="text-sm text-neutral-600">{item.displayId}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100">
          <span className="text-sm text-neutral-500">
            {scannedCount} de {totalCount} escaneadas
          </span>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={scannedCount === 0}
              onClick={() => onConfirm(Array.from(scannedIds))}
              iconLeft={<ScanBarcode className="w-4 h-4" />}
            >
              Confirmar preparacion ({scannedCount} de {totalCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
