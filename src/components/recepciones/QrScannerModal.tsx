"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, QrCode02, CheckCircle, AlertTriangle, XCircle,
  Clock, SearchLg, ChevronRight, RefreshCw01,
} from "@untitled-ui/icons-react";
import { Printer } from "lucide-react";
import {
  ensureQrSeeded, loadQrTokens, validateScan,
  markTokenScanned, computeTimeTolerance,
  type QrToken, type ScanError,
} from "@/lib/qr-helpers";
import { playScanSuccessSound, playScanErrorSound } from "@/lib/scan-sounds";

// ─── Types ──────────────────────────────────────────────────────────────────

type OrInfo = {
  id: string;
  seller: string;
  sucursal: string;
  fechaAgendada: string;
  estado: string;
  skus: number;
  uTotales: string;
  pallets?: number;
  bultos?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when the scan is confirmed — parent updates the OR estado */
  onConfirm: (orId: string, labelCount: number) => void;
  /** Look up OR info by id (used after token is found) */
  getOrInfo: (orId: string) => OrInfo | undefined;
};

type Step = "input" | "validating" | "success" | "error";

// ─── Error messages ─────────────────────────────────────────────────────────

const ERROR_META: Record<ScanError, { title: string; description: string; icon: "red" | "amber" }> = {
  not_found:      { title: "QR no encontrado",       description: "El código QR escaneado no corresponde a ninguna orden de recepción registrada.", icon: "red" },
  already_scanned:{ title: "QR ya escaneado",         description: "Este código QR ya fue utilizado para recepcionar una orden anteriormente.", icon: "amber" },
  invalidated:    { title: "QR invalidado",           description: "Este código QR fue invalidado. La orden pudo haber sido reagendada o cancelada.", icon: "red" },
  wrong_sucursal: { title: "Sucursal incorrecta",     description: "La sucursal de la orden no coincide con la sucursal configurada para este operador.", icon: "amber" },
  not_programado: { title: "Orden no programada",     description: "La orden asociada a este QR no se encuentra en estado Programado.", icon: "amber" },
};

// ─── Tolerance badge ────────────────────────────────────────────────────────

function ToleranceBadge({ fechaAgendada }: { fechaAgendada: string }) {
  const { code, label } = computeTimeTolerance(fechaAgendada);
  const colors: Record<string, string> = {
    en_horario:     "bg-green-50 text-green-700 border-green-200",
    anticipada:     "bg-blue-50 text-blue-700 border-blue-200",
    tardia:         "bg-amber-50 text-amber-700 border-amber-200",
    fuera_de_fecha: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${colors[code]}`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function QrScannerModal({ open, onClose, onConfirm, getOrInfo }: Props) {
  const [step, setStep]           = useState<Step>("input");
  const [inputVal, setInputVal]   = useState("");
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const [matchedToken, setMatchedToken] = useState<QrToken | null>(null);
  const [matchedOr, setMatchedOr] = useState<OrInfo | null>(null);

  // ── Label printing states ──
  const [labelMode, setLabelMode] = useState<"pallets" | "bultos" | "custom">("pallets");
  const [customLabelCount, setCustomLabelCount] = useState("");

  const labelCount = labelMode === "pallets"
    ? (matchedOr?.pallets ?? 0)
    : labelMode === "bultos"
      ? (matchedOr?.bultos ?? 0)
      : (parseInt(customLabelCount) || 0);

  // Seed tokens on first open
  useEffect(() => { if (open) ensureQrSeeded(); }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("input");
      setInputVal("");
      setScanError(null);
      setMatchedToken(null);
      setMatchedOr(null);
      setLabelMode("pallets");
      setCustomLabelCount("");
    }
  }, [open]);

  // ── Programado ORs for quick-scan list ──
  const [programadoOrs, setProgramadoOrs] = useState<{ orId: string; token: string; seller: string; sucursal: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    ensureQrSeeded();
    const tokens = loadQrTokens().filter(t => t.estado === "activo");
    const items = tokens.map(t => {
      const or = getOrInfo(t.orden_recepcion_id);
      return {
        orId: t.orden_recepcion_id,
        token: t.qr_token,
        seller: or?.seller ?? "—",
        sucursal: or?.sucursal ?? "—",
      };
    });
    setProgramadoOrs(items);
  }, [open, getOrInfo]);

  // ── Mock flow types for demo quick-scan items ──
  const MOCK_FLOWS: ScanError[] = ["already_scanned", "wrong_sucursal"];

  // ── Scan logic ──
  const doScan = useCallback((tokenValue: string, forcedError?: ScanError) => {
    setStep("validating");

    setTimeout(() => {
      const result = validateScan(tokenValue);

      if (!result.ok) {
        setScanError(result.error);
        setMatchedToken(result.token ?? null);
        setStep("error");
        playScanErrorSound();
        return;
      }

      const token = result.token;
      const or = getOrInfo(token.orden_recepcion_id);

      // Mock: force a specific error flow for demo
      if (forcedError) {
        setScanError(forcedError);
        setMatchedToken(token);
        setStep("error");
        playScanErrorSound();
        return;
      }

      // Additional checks with OR context
      if (or && or.estado !== "Programado") {
        setScanError("not_programado");
        setMatchedToken(token);
        setStep("error");
        playScanErrorSound();
        return;
      }

      setMatchedToken(token);
      setMatchedOr(or ?? null);
      setStep("success");
      playScanSuccessSound();
    }, 500);
  }, [getOrInfo]);

  const handleConfirm = () => {
    if (!matchedToken || labelCount === 0) return;
    markTokenScanned(matchedToken.id);
    onConfirm(matchedToken.orden_recepcion_id, labelCount);
    onClose();
  };

  const resetToInput = () => {
    setStep("input");
    setInputVal("");
    setScanError(null);
    setMatchedToken(null);
    setMatchedOr(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <QrCode02 className="w-5 h-5 text-primary-500" />
            Escanear QR de recepción
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 min-h-[320px] flex flex-col">

          {/* STEP: INPUT */}
          {step === "input" && (
            <>
              {/* Simulated camera scanner */}
              <div className="mb-5">
                <div className="relative bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center" style={{ height: 180 }}>
                  {/* Scan grid overlay */}
                  <div className="absolute inset-4 border-2 border-white/20 rounded-lg" />
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl-md" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr-md" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl-md" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br-md" />
                  {/* Animated scan line */}
                  <div className="absolute left-4 right-4 h-0.5 bg-primary-400/60 animate-pulse" style={{ top: "50%" }} />
                  {/* Center button */}
                  <button
                    onClick={() => {
                      if (programadoOrs.length > 0) doScan(programadoOrs[0].token);
                    }}
                    className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors shadow-lg"
                  >
                    <QrCode02 className="w-4 h-4" />
                    Escanear QR
                  </button>
                  {/* Subtle text */}
                  <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40">
                    Apunta la cámara al código QR de la orden
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400 font-medium">o ingresa manualmente</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              {/* Manual input */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Código QR / Token UUID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && inputVal.trim()) doScan(inputVal.trim()); }}
                      placeholder="Pegar o escribir token UUID..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 placeholder-neutral-400"
                    />
                  </div>
                  <button
                    onClick={() => { if (inputVal.trim()) doScan(inputVal.trim()); }}
                    disabled={!inputVal.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Validar
                  </button>
                </div>
              </div>

              {/* Quick-scan list */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Órdenes programadas (escaneo rápido)
                </p>
                {programadoOrs.length === 0 ? (
                  <p className="text-sm text-neutral-400 italic">No hay órdenes programadas con QR activo.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {programadoOrs.map((item, idx) => (
                      <button
                        key={item.orId}
                        onClick={() => doScan(item.token, MOCK_FLOWS[idx - 1])}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">{item.orId}</p>
                          <p className="text-xs text-neutral-500">{item.seller} · {item.sucursal}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP: VALIDATING */}
          {step === "validating" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-neutral-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-neutral-600">Validando código QR...</p>
            </div>
          )}

          {/* STEP: SUCCESS — Recepción verificada + etiquetas QR */}
          {step === "success" && matchedOr && (
            <div className="flex-1 flex flex-col">
              {/* Success header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-neutral-900">Recepción verificada</p>
                  <p className="text-sm text-neutral-500">La orden está lista para el proceso de conteo.</p>
                </div>
              </div>

              {/* OR info card */}
              <div className="border border-neutral-200 rounded-xl p-4 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900">{matchedOr.id}</span>
                  <ToleranceBadge fechaAgendada={matchedOr.fechaAgendada} />
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-neutral-500">Seller</span>
                    <p className="font-medium text-neutral-800">{matchedOr.seller}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Sucursal</span>
                    <p className="font-medium text-neutral-800">{matchedOr.sucursal}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">SKUs</span>
                    <p className="font-medium text-neutral-800">{matchedOr.skus}</p>
                  </div>
                  {matchedOr.pallets != null && (
                    <div>
                      <span className="text-neutral-500">Pallets</span>
                      <p className="font-medium text-neutral-800">{matchedOr.pallets}</p>
                    </div>
                  )}
                  {matchedOr.bultos != null && (
                    <div>
                      <span className="text-neutral-500">Bultos</span>
                      <p className="font-medium text-neutral-800">{matchedOr.bultos}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-neutral-500">Unidades</span>
                    <p className="font-medium text-neutral-800">{matchedOr.uTotales}</p>
                  </div>
                </div>
              </div>

              {/* Label printing section */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-neutral-800 mb-2">Etiquetas QR para conteo</p>
                <p className="text-xs text-neutral-500 mb-3">Selecciona cuántas etiquetas imprimir. Cada etiqueta permitirá iniciar el conteo al escanearla.</p>
                <div className="space-y-2">
                  {matchedOr.pallets != null && matchedOr.pallets > 0 && (
                    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${labelMode === "pallets" ? "border-primary-300 bg-primary-50/50" : "border-neutral-200 hover:border-neutral-300"}`}>
                      <input type="radio" name="labelMode" checked={labelMode === "pallets"} onChange={() => setLabelMode("pallets")} className="accent-primary-500" />
                      <span className="text-sm text-neutral-700">Por pallets</span>
                      <span className="ml-auto text-sm font-semibold text-neutral-800">{matchedOr.pallets} etiqueta{matchedOr.pallets !== 1 ? "s" : ""}</span>
                    </label>
                  )}
                  {matchedOr.bultos != null && matchedOr.bultos > 0 && (
                    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${labelMode === "bultos" ? "border-primary-300 bg-primary-50/50" : "border-neutral-200 hover:border-neutral-300"}`}>
                      <input type="radio" name="labelMode" checked={labelMode === "bultos"} onChange={() => setLabelMode("bultos")} className="accent-primary-500" />
                      <span className="text-sm text-neutral-700">Por bultos</span>
                      <span className="ml-auto text-sm font-semibold text-neutral-800">{matchedOr.bultos} etiqueta{matchedOr.bultos !== 1 ? "s" : ""}</span>
                    </label>
                  )}
                  <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${labelMode === "custom" ? "border-primary-300 bg-primary-50/50" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <input type="radio" name="labelMode" checked={labelMode === "custom"} onChange={() => setLabelMode("custom")} className="accent-primary-500" />
                    <span className="text-sm text-neutral-700">Personalizado</span>
                    {labelMode === "custom" && (
                      <input
                        type="number"
                        value={customLabelCount}
                        onChange={e => setCustomLabelCount(e.target.value)}
                        placeholder="0"
                        min="1"
                        autoFocus
                        className="ml-auto w-20 px-3 py-2 text-sm text-center bg-white text-neutral-600 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 tabular-nums"
                      />
                    )}
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={handleConfirm}
                  disabled={labelCount === 0}
                  className={`w-full h-12 px-4 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    labelCount > 0
                      ? "text-white bg-primary-500 hover:bg-primary-600"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {labelCount > 0
                    ? `Confirmar e imprimir ${labelCount} etiqueta${labelCount !== 1 ? "s" : ""}`
                    : "Selecciona cantidad de etiquetas"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-12 px-4 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* STEP: ERROR */}
          {step === "error" && scanError && (
            <div className="flex-1 flex flex-col">
              {/* Error header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ERROR_META[scanError].icon === "red" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {ERROR_META[scanError].icon === "red"
                    ? <XCircle className="w-5 h-5 text-red-600" />
                    : <AlertTriangle className="w-5 h-5 text-amber-600" />
                  }
                </div>
                <div>
                  <p className="text-base font-semibold text-neutral-900">{ERROR_META[scanError].title}</p>
                  <p className="text-sm text-neutral-500">{ERROR_META[scanError].description}</p>
                </div>
              </div>

              {/* OR reference if available */}
              {matchedToken && (
                <div className="border border-neutral-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-neutral-500 mb-1">Orden asociada</p>
                  <p className="text-sm font-semibold text-neutral-800">{matchedToken.orden_recepcion_id}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Token: {matchedToken.qr_token.slice(0, 8)}... · Versión {matchedToken.version}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={resetToInput}
                  className="w-full h-12 px-4 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw01 className="w-4 h-4" />
                  Volver a escanear
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-12 px-4 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
