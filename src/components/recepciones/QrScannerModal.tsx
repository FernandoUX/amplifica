"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconX, IconQrcode, IconCircleCheck, IconAlertTriangle, IconCircleX,
  IconClock, IconSearch, IconChevronRight, IconRefresh,
  IconPackage, IconPlayerPlay,
} from "@tabler/icons-react";
import Button from "@/components/ui/Button";
import AlertModal from "@/components/ui/AlertModal";
import StatusBadge, { Status } from "@/components/recepciones/StatusBadge";
import ScrollArea from "@/components/ui/ScrollArea";
import {
  ensureQrSeeded, loadQrTokens, validateScan,
  markTokenScanned, computeTimeTolerance,
  QR_OR_META,
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
  /** Called when scan confirmed for Programado → Recepcionado en bodega */
  onConfirm: (orId: string, labelCount: number, labelType: "pallets" | "bultos") => void;
  /** Called when scan confirmed for Recepcionado en bodega → En proceso de conteo */
  onStartConteo: (orId: string) => void;
  /** Look up OR info by id (used after token is found) */
  getOrInfo: (orId: string) => OrInfo | undefined;
};

type Step = "input" | "validating" | "confirm" | "success" | "error";

// ─── Embedded reception scan types ──────────────────────────────────────────
type RecScanStatus = "ok" | "duplicate" | "unknown";
type RecScanEntry = { code: string; type: "Pallet" | "Bulto"; status: RecScanStatus };

// ─── Error messages ─────────────────────────────────────────────────────────

const ERROR_META: Record<ScanError, { title: string; description: string; icon: "red" | "amber" }> = {
  not_found:      { title: "QR no encontrado",       description: "El código QR escaneado no corresponde a ninguna orden de recepción registrada.", icon: "red" },
  already_scanned:{ title: "QR ya escaneado",         description: "Este código QR ya fue utilizado para recepcionar una orden anteriormente.", icon: "amber" },
  invalidated:    { title: "QR invalidado",           description: "Este código QR fue invalidado. La orden pudo haber sido reagendada o cancelada.", icon: "red" },
  wrong_sucursal: { title: "Sucursal incorrecta",     description: "La sucursal de la orden no coincide con la sucursal configurada para este operador.", icon: "amber" },
  not_programado: { title: "Orden no disponible",     description: "La orden asociada a este QR no se encuentra en un estado válido para escaneo.", icon: "amber" },
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
      <IconClock className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Valid states for QR scan ───────────────────────────────────────────────
const SCANNABLE_STATES = ["Programado", "Recepcionado en bodega", "En proceso de conteo"];

// ─── Action groups for the quick-scan list ──────────────────────────────────
type ActionGroup = {
  key: string;
  icon: string;
  label: string;
  states: string[];
};

const ACTION_GROUPS: ActionGroup[] = [
  { key: "recibir",   icon: "📦", label: "Recibir en bodega",  states: ["Programado"] },
  { key: "conteo",    icon: "📋", label: "Iniciar conteo",     states: ["Recepcionado en bodega"] },
  { key: "continuar", icon: "▶",  label: "Continuar conteo",   states: ["En proceso de conteo"] },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function QrScannerModal({ open, onClose, onConfirm, onStartConteo, getOrInfo }: Props) {
  const [step, setStep]           = useState<Step>("input");
  const [inputVal, setInputVal]   = useState("");
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const [matchedToken, setMatchedToken] = useState<QrToken | null>(null);
  const [matchedOr, setMatchedOr] = useState<OrInfo | null>(null);

  // ── Embedded reception scan states (Programado flow) ──
  const [recEntries, setRecEntries] = useState<RecScanEntry[]>([]);
  const [showDiffAlert, setShowDiffAlert] = useState(false);

  // Derived reception counters
  const validRecEntries     = recEntries.filter(e => e.status === "ok");
  const palletsRecibidos    = validRecEntries.filter(e => e.type === "Pallet").length;
  const bultosRecibidos     = validRecEntries.filter(e => e.type === "Bulto").length;
  const declaredPallets     = matchedOr?.pallets ?? 0;
  const declaredBultos      = matchedOr?.bultos ?? 0;
  const palletsPct          = declaredPallets > 0 ? Math.min(100, (palletsRecibidos / declaredPallets) * 100) : 0;
  const bultosPct           = declaredBultos  > 0 ? Math.min(100, (bultosRecibidos  / declaredBultos)  * 100) : 0;
  const palletsDiff         = palletsRecibidos - declaredPallets;
  const bultosDiff          = bultosRecibidos  - declaredBultos;
  const recCoincide         = palletsDiff === 0 && bultosDiff === 0;
  const recHasDiff          = validRecEntries.length > 0 && !recCoincide;
  const recDiffParts: string[] = [];
  if (palletsDiff !== 0) recDiffParts.push(`${palletsDiff > 0 ? "+" : ""}${palletsDiff} pallet${Math.abs(palletsDiff) !== 1 ? "s" : ""}`);
  if (bultosDiff !== 0)  recDiffParts.push(`${bultosDiff > 0 ? "+" : ""}${bultosDiff} bulto${Math.abs(bultosDiff) !== 1 ? "s" : ""}`);

  // Mock scan for reception — ~80% ok, ~10% duplicate, ~10% unknown
  const handleRecScan = useCallback((type: "Pallet" | "Bulto") => {
    setRecEntries(prev => {
      const prefix = type === "Pallet" ? "PLT" : "BLT";
      const next = prev.filter(e => e.type === type && e.status === "ok").length + 1;
      const code = `${prefix}-${String(next).padStart(3, "0")}`;
      const rand = Math.random();

      if (rand < 0.1) {
        const unknownCode = `UNK-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
        playScanErrorSound();
        return [...prev, { code: unknownCode, type, status: "unknown" as RecScanStatus }];
      } else if (rand < 0.2 && prev.some(e => e.type === type && e.status === "ok")) {
        const lastValid = [...prev].reverse().find(e => e.type === type && e.status === "ok");
        if (lastValid) {
          playScanErrorSound();
          return [...prev, { code: lastValid.code, type, status: "duplicate" as RecScanStatus }];
        }
      }
      playScanSuccessSound();
      return [...prev, { code, type, status: "ok" as RecScanStatus }];
    });
  }, []);

  // Detected flow based on OR estado
  const detectedFlow: "recepcion" | "conteo" | "continuar" | null =
    matchedOr?.estado === "Programado" ? "recepcion"
    : matchedOr?.estado === "Recepcionado en bodega" ? "conteo"
    : matchedOr?.estado === "En proceso de conteo" ? "continuar"
    : null;

  // Human-readable action label
  const flowLabel =
    detectedFlow === "recepcion" ? "Recibir en bodega"
    : detectedFlow === "conteo" ? "Iniciar conteo"
    : detectedFlow === "continuar" ? "Continuar conteo"
    : "";

  const flowDescription =
    detectedFlow === "recepcion" ? "Se registrarán pallets y bultos para confirmar la llegada física."
    : detectedFlow === "conteo" ? "Se abrirá una sesión de conteo para verificar las unidades recibidas."
    : detectedFlow === "continuar" ? "Se retomará la sesión de conteo existente con el progreso previo."
    : "";

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
      setRecEntries([]);
      setShowDiffAlert(false);
    }
  }, [open]);

  // ── Scannable ORs for quick-scan list ──
  type ScannableOr = {
    orId: string;
    token: string;
    seller: string;
    sucursal: string;
    estado: string;
    fechaAgendada: string;
    fechaExtra?: string;
    skus: number;
    uTotales: string;
    progreso?: { contadas: number; total: number };
  };
  const [scannableOrs, setScannableOrs] = useState<ScannableOr[]>([]);

  useEffect(() => {
    if (!open) return;
    ensureQrSeeded();
    const tokens = loadQrTokens().filter(t => t.estado === "activo");
    const items: ScannableOr[] = tokens.map(t => {
      const or = getOrInfo(t.orden_recepcion_id);
      const meta = QR_OR_META[t.orden_recepcion_id];
      return {
        orId: t.orden_recepcion_id,
        token: t.qr_token,
        seller: or?.seller ?? meta?.seller ?? "—",
        sucursal: or?.sucursal ?? meta?.sucursal ?? "—",
        estado: or?.estado ?? "Programado",
        fechaAgendada: or?.fechaAgendada ?? "—",
        fechaExtra: (or as Record<string, unknown>)?.fechaExtra as string | undefined,
        skus: or?.skus ?? meta?.skus ?? 0,
        uTotales: or?.uTotales ?? meta?.uTotales ?? "—",
      };
    }).filter(item => SCANNABLE_STATES.includes(item.estado));
    setScannableOrs(items);
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

      // Check if OR is in a valid scannable state
      if (or && !SCANNABLE_STATES.includes(or.estado)) {
        setScanError("not_programado");
        setMatchedToken(token);
        setStep("error");
        playScanErrorSound();
        return;
      }

      // Build fallback OrInfo from QR_OR_META when getOrInfo doesn't know this OR
      const meta = QR_OR_META[token.orden_recepcion_id];
      const resolvedOr: OrInfo = or ?? {
        id: token.orden_recepcion_id,
        seller: meta?.seller ?? "—",
        sucursal: meta?.sucursal ?? "—",
        fechaAgendada: "13/03/2026 09:00",
        estado: "Programado",
        skus: meta?.skus ?? 1,
        uTotales: meta?.uTotales ?? "—",
        pallets: meta?.pallets,
        bultos: meta?.bultos,
      };

      setMatchedToken(token);
      setMatchedOr(resolvedOr);
      setStep("confirm");
      playScanSuccessSound();
    }, 500);
  }, [getOrInfo]);

  // ── From confirm → proceed to action ──
  const handleProceedFromConfirm = () => {
    setStep("success");
  };

  const handleConfirmRecepcion = () => {
    if (!matchedToken || validRecEntries.length === 0) return;
    if (recHasDiff) {
      setShowDiffAlert(true);
      return;
    }
    markTokenScanned(matchedToken.id);
    onConfirm(matchedToken.orden_recepcion_id, validRecEntries.length, declaredPallets > 0 ? "pallets" : "bultos");
    onClose();
  };

  const handleForceConfirmRecepcion = () => {
    if (!matchedToken) return;
    setShowDiffAlert(false);
    markTokenScanned(matchedToken.id);
    onConfirm(matchedToken.orden_recepcion_id, validRecEntries.length, declaredPallets > 0 ? "pallets" : "bultos");
    onClose();
  };

  const handleConfirmConteo = () => {
    if (!matchedToken || !matchedOr) return;
    markTokenScanned(matchedToken.id);
    onStartConteo(matchedOr.id);
    onClose();
  };

  const resetToInput = () => {
    setStep("input");
    setInputVal("");
    setScanError(null);
    setMatchedToken(null);
    setMatchedOr(null);
    setRecEntries([]);
    setShowDiffAlert(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 items-end sm:items-center">
      <div className="relative bg-white w-full sm:max-w-lg shadow-xl flex flex-col overflow-hidden h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <h1 className="text-xl font-bold text-neutral-900">
            Escanear QR de recepción
          </h1>
          <button onClick={onClose} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
            <IconX className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col">

          {/* STEP: INPUT */}
          {step === "input" && (
            <>
              {/* Simulated camera scanner */}
              <div className="mb-5 flex-shrink-0">
                <div className="relative bg-neutral-900 rounded-xl overflow-hidden flex flex-col items-center justify-center" style={{ height: 200 }}>
                  {/* Scan grid overlay */}
                  <div className="absolute inset-4 border-2 border-white/20 rounded-lg" />
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl-md" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr-md" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl-md" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br-md" />
                  {/* Animated scan line */}
                  <div className="absolute left-4 right-4 h-0.5 bg-primary-400/60 animate-pulse" style={{ top: "45%" }} />
                  {/* Two action buttons — stacked vertically, auto-width */}
                  <div className="relative z-10 flex flex-col items-center gap-2 px-4">
                    <button
                      onClick={() => {
                        const programado = scannableOrs.find(o => o.estado === "Programado");
                        if (programado) doScan(programado.token);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors shadow-lg"
                    >
                      <IconPackage className="w-4 h-4" />
                      Recibir en bodega
                    </button>
                    <button
                      onClick={() => {
                        const recepcionado = scannableOrs.find(o => o.estado === "Recepcionado en bodega");
                        if (recepcionado) doScan(recepcionado.token);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors shadow-lg"
                    >
                      <IconPlayerPlay className="w-4 h-4" />
                      Iniciar conteo
                    </button>
                  </div>
                  {/* Subtle text */}
                  <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40">
                    Apunta la cámara al código QR de la orden
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400 font-medium">o ingresa manualmente</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              {/* Manual input */}
              <div className="mb-5 flex-shrink-0">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Código QR / Token UUID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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

              {/* Quick-scan list — grouped by action */}
              <div className="flex-1 min-h-0 flex flex-col">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex-shrink-0">
                  Órdenes disponibles
                </p>
                {scannableOrs.length === 0 ? (
                  <p className="text-sm text-neutral-400 italic">No hay órdenes disponibles con QR activo.</p>
                ) : (
                  <ScrollArea className="space-y-4 flex-1 min-h-0">
                    {ACTION_GROUPS.map(group => {
                      const groupItems = scannableOrs.filter(item => group.states.includes(item.estado));
                      if (groupItems.length === 0) return null;
                      return (
                        <div key={group.key}>
                          {/* Group header */}
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="text-sm">{group.icon}</span>
                            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">{group.label}</span>
                            <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 rounded-full px-1.5 py-0.5 tabular-nums">{groupItems.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {groupItems.map((item, idx) => (
                              <button
                                key={item.orId}
                                onClick={() => doScan(item.token, group.key === "recibir" ? MOCK_FLOWS[idx - 1] : undefined)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left group"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-medium text-neutral-800 truncate">{item.orId}</p>
                                  </div>
                                  <p className="text-xs text-neutral-500">{item.seller} · {item.sucursal}</p>
                                  {/* Temporal info: fecha agendada + urgency */}
                                  {item.fechaAgendada && item.fechaAgendada !== "—" && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-neutral-400 tabular-nums flex items-center gap-1">
                                        <IconClock className="w-3 h-3" />
                                        {item.fechaAgendada}
                                      </span>
                                      {item.fechaExtra && (
                                        <span className={`text-[10px] font-medium ${
                                          item.fechaExtra.toLowerCase().includes("expirado") ? "text-red-500" :
                                          item.fechaExtra.toLowerCase().includes("expira") ? "text-amber-500" :
                                          "text-neutral-400"
                                        }`}>
                                          {item.fechaExtra}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <IconChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 flex-shrink-0 ml-2" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                )}
              </div>
            </>
          )}

          {/* STEP: VALIDATING */}
          {step === "validating" && (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="w-10 h-10 border-3 border-neutral-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-neutral-600">Validando código QR...</p>
            </div>
          )}

          {/* STEP: CONFIRM — Confirmation screen before action */}
          {step === "confirm" && matchedOr && (
            <div className="flex flex-col gap-4">
              {/* Success indicator */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <IconCircleCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-neutral-900">{matchedOr.id} identificada</p>
                  <StatusBadge status={matchedOr.estado as Status} />
                </div>
              </div>

              {/* OR details card */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-neutral-800">{matchedOr.seller}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-500">{matchedOr.sucursal}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-400">SKUs</span>
                    <p className="font-semibold text-neutral-700 tabular-nums">{matchedOr.skus}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Unidades</span>
                    <p className="font-semibold text-neutral-700 tabular-nums">{matchedOr.uTotales}</p>
                  </div>
                  {matchedOr.fechaAgendada && matchedOr.fechaAgendada !== "—" && (
                    <div className="col-span-2">
                      <span className="text-neutral-400">Fecha agendada</span>
                      <p className="font-semibold text-neutral-700 tabular-nums">{matchedOr.fechaAgendada}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action to perform */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">Acción a ejecutar</p>
                <p className="text-sm font-bold text-primary-900">→ {flowLabel}</p>
                <p className="text-xs text-primary-600 mt-1">{flowDescription}</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetToInput}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleProceedFromConfirm}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP: SUCCESS — Auto-detected flow based on OR estado */}
          {step === "success" && matchedOr && (
            <>
              {/* Recepcion flow: compact OR header (ID + badge only) */}
              {detectedFlow === "recepcion" && (
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-base font-bold text-neutral-900">{matchedOr.id}</p>
                  <StatusBadge status={matchedOr.estado as Status} />
                </div>
              )}

              {/* Conteo flow: full success header + card */}
              {detectedFlow === "conteo" && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <IconCircleCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-neutral-900">Orden lista para conteo</p>
                      <p className="text-sm text-neutral-500">La orden pasará a En proceso de conteo.</p>
                    </div>
                  </div>

                  {/* OR info card — only for conteo flow */}
                  <div className="border border-neutral-200 rounded-xl p-4 space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900">{matchedOr.id}</span>
                        <StatusBadge status={matchedOr.estado as Status} />
                      </div>
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
                </>
              )}

              {/* Continuar conteo flow */}
              {detectedFlow === "continuar" && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <IconPlayerPlay className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-neutral-900">Retomar sesión de conteo</p>
                      <p className="text-sm text-neutral-500">La orden tiene una sesión de conteo en progreso.</p>
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-4 space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">{matchedOr.id}</span>
                      <StatusBadge status={matchedOr.estado as Status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
                      <div>
                        <span className="text-neutral-500">Unidades</span>
                        <p className="font-medium text-neutral-800">{matchedOr.uTotales}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Embedded reception scanning flow — only for Programado flow */}
              {detectedFlow === "recepcion" && (
                <>
                  {/* Progress bars */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-xs font-semibold text-neutral-500">Pallets</p>
                        <p className="text-xs tabular-nums">
                          <span className="font-bold text-neutral-900">{palletsRecibidos}</span>
                          <span className="text-neutral-600 mx-0.5">/</span>
                          <span className="text-neutral-600">{declaredPallets}</span>
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${palletsPct >= 100 ? "bg-green-500" : "bg-primary-500"}`}
                          style={{ width: `${palletsPct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-xs font-semibold text-neutral-500">Bultos</p>
                        <p className="text-xs tabular-nums">
                          <span className="font-bold text-neutral-900">{bultosRecibidos}</span>
                          <span className="text-neutral-600 mx-0.5">/</span>
                          <span className="text-neutral-600">{declaredBultos}</span>
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${bultosPct >= 100 ? "bg-green-500" : "bg-primary-500"}`}
                          style={{ width: `${bultosPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulated camera + scan buttons */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-neutral-500 mb-2">Escanear QR</p>
                    <div className="w-full bg-neutral-900 rounded-xl flex flex-col items-center overflow-hidden">
                      <div className="w-full h-[160px] flex flex-col items-center justify-center gap-2 relative">
                        <div className="absolute inset-4 border-2 border-white/15 rounded-lg" />
                        <IconQrcode className="w-8 h-8 text-white/40 relative z-10" />
                        <p className="text-[11px] text-white/40 relative z-10">Escanea QR de pallet o bulto</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full px-3 pb-3">
                        <button onClick={() => handleRecScan("Bulto")} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[0.8125rem] sm:text-xs font-medium rounded-lg bg-neutral-800 text-neutral-100 hover:text-white transition-colors active:scale-[0.97]">
                          <IconQrcode className="w-3.5 h-3.5" />
                          Escanear bulto
                        </button>
                        <button onClick={() => handleRecScan("Pallet")} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[0.8125rem] sm:text-xs font-medium rounded-lg bg-neutral-800 text-neutral-100 hover:text-white transition-colors active:scale-[0.97]">
                          <IconQrcode className="w-3.5 h-3.5" />
                          Escanear pallet
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scan entries list */}
                  <div className="flex-1 min-h-0">
                    <p className="text-xs font-semibold text-neutral-500 mb-2">Carga registrada</p>
                    {recEntries.length === 0 ? (
                      <p className="text-xs text-neutral-600">Sin registros escaneados</p>
                    ) : (
                      <div className="space-y-1.5">
                        {[...recEntries].reverse().map((entry, i) => (
                          <div key={`${entry.code}-${i}`} className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 ${i === 0 ? "bg-neutral-50" : ""}`}>
                            {entry.status === "ok" && (
                              <>
                                <IconCircleCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                <p className="text-xs text-neutral-700">
                                  <span className="font-medium">{entry.type}</span>{" "}
                                  <span className="font-sans font-semibold text-neutral-800">{entry.code}</span>{" "}
                                  <span className="text-neutral-500">registrado</span>
                                </p>
                              </>
                            )}
                            {entry.status === "duplicate" && (
                              <>
                                <IconAlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <p className="text-xs text-amber-600 font-medium">Código ya escaneado</p>
                              </>
                            )}
                            {entry.status === "unknown" && (
                              <>
                                <IconCircleX className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-600 font-medium">Código no pertenece a esta orden</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status message */}
                  {recEntries.length > 0 && (
                    <div className="mt-3">
                      {recCoincide ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <IconCircleCheck className="w-3.5 h-3.5 text-green-500" />
                          <p className="text-xs font-medium text-green-600">Coincide con la orden</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-center">
                          <IconAlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <p className="text-xs font-medium text-amber-600">Diferencia con lo esperado</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Conteo flow info */}
              {detectedFlow === "conteo" && (
                <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Proceso de conteo</p>
                  <p className="text-xs text-blue-600">
                    Se abrirá el detalle de la orden para iniciar el conteo de unidades, verificar cantidades y detectar incidencias.
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP: ERROR */}
          {step === "error" && scanError && (
            <>
              {/* Error header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ERROR_META[scanError].icon === "red" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {ERROR_META[scanError].icon === "red"
                    ? <IconCircleX className="w-5 h-5 text-red-600" />
                    : <IconAlertTriangle className="w-5 h-5 text-amber-600" />
                  }
                </div>
                <div>
                  <p className="text-base font-semibold text-neutral-900">{ERROR_META[scanError].title}</p>
                  <p className="text-sm text-neutral-500">{ERROR_META[scanError].description}</p>
                </div>
              </div>

              {/* OR reference if available */}
              {matchedToken && (
                <div className="border border-neutral-200 rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">Orden asociada</p>
                  <p className="text-sm font-semibold text-neutral-800">{matchedToken.orden_recepcion_id}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Token: {matchedToken.qr_token.slice(0, 8)}... · Versión {matchedToken.version}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer: Recepción flow ── */}
        {step === "success" && matchedOr && detectedFlow === "recepcion" && (
          <div className="flex-shrink-0 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmRecepcion}
              disabled={validRecEntries.length === 0}
              iconLeft={<IconCircleCheck className="w-4 h-4" />}
              className="w-full"
            >
              Confirmar recepción
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Diff alert for reception ── */}
        <AlertModal
          open={showDiffAlert}
          onClose={() => setShowDiffAlert(false)}
          icon={IconAlertTriangle}
          variant="warning"
          title="Recepción con diferencias"
          confirm={{
            label: "Confirmar",
            onClick: handleForceConfirmRecepcion,
          }}
        >
          <p>
            ¿Estás seguro de finalizar la recepción a bodega con{" "}
            <span className="font-semibold text-neutral-900">{recDiffParts.join(" y ")}</span>
            {" "}de diferencia?
          </p>
        </AlertModal>

        {/* ── Footer: Conteo flow ── */}
        {step === "success" && matchedOr && detectedFlow === "conteo" && (
          <div className="flex-shrink-0 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmConteo}
              iconLeft={<IconPlayerPlay className="w-4 h-4" />}
              className="w-full"
            >
              Iniciar conteo
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Footer: Continuar conteo flow ── */}
        {step === "success" && matchedOr && detectedFlow === "continuar" && (
          <div className="flex-shrink-0 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmConteo}
              iconLeft={<IconPlayerPlay className="w-4 h-4" />}
              className="w-full"
            >
              Continuar conteo
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {step === "error" && scanError && (
          <div className="flex-shrink-0 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={resetToInput}
              iconLeft={<IconRefresh className="w-4 h-4" />}
              className="w-full"
            >
              Volver a escanear
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
