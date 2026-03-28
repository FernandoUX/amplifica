"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScanLine, Package, Check, AlertTriangle, X, ChevronRight,
  Printer, QrCode, MapPin, Search, Clock, ArrowLeft,
  Plus, RefreshCw, CheckCircle2, XCircle, Info,
} from "lucide-react";

type ToastData = { message: string; type: "success" | "error" | "info" };
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ReturnStatusBadge from "@/components/devoluciones/ReturnStatusBadge";
import { playScanSuccessSound, playScanErrorSound } from "@/lib/scan-sounds";
import {
  MOCK_RETURNS, BRANCHES,
  type ReturnRecord,
} from "../_data";

// ─── Scan handler types (extensible pattern — FEATURE-11) ───────────────────
type ScanResultType =
  | "return_precreada"
  | "pedido_despachado"
  | "pedido_expirado"
  | "no_reconocido";

type ScanResult = {
  type: ScanResultType;
  data: {
    returnRecord?: ReturnRecord;
    orderId?: string;
    sellerName?: string;
    courier?: string;
    salesChannel?: string;
  };
};

interface ScanHandler {
  name: string;
  tryMatch: (code: string) => ScanResult | null;
}

// ─── Warehouse locations (MEJORA-6) ─────────────────────────────────────────
const WAREHOUSE_LOCATIONS = [
  "A-01-01", "A-01-02", "A-01-03", "A-02-01", "A-02-02", "A-02-03",
  "A-03-01", "A-03-02", "A-04-01", "A-04-02", "A-05-01", "A-05-02",
  "B-01-01", "B-01-02", "B-01-03", "B-02-01", "B-02-02", "B-03-01",
  "C-01-01", "C-01-02", "C-02-01", "C-03-01", "C-03-02",
  "D-01-01", "D-01-02", "D-02-01", "D-03-01",
];

// ─── Scan handlers (FEATURE-11: ordered pipeline) ───────────────────────────

/** Handler A: Pre-created return QR (match by displayId, status "creada") */
const returnPrecreadaHandler: ScanHandler = {
  name: "return_precreada",
  tryMatch: (code) => {
    const q = code.trim().toUpperCase();
    const match = MOCK_RETURNS.find(
      r => r.displayId.toUpperCase() === q && r.status === "creada"
    );
    if (match) {
      return {
        type: "return_precreada",
        data: { returnRecord: match },
      };
    }
    return null;
  },
};

/** Handler B: Dispatched order label (match by orderDisplayId) */
const pedidoDespachadoHandler: ScanHandler = {
  name: "pedido_despachado",
  tryMatch: (code) => {
    const q = code.trim().toUpperCase();
    // Match against mock order IDs
    if (q.startsWith("PED-")) {
      const matchReturn = MOCK_RETURNS.find(
        r => r.orderDisplayId?.toUpperCase() === q
      );
      if (matchReturn) {
        return {
          type: "pedido_despachado",
          data: {
            orderId: matchReturn.orderDisplayId!,
            sellerName: matchReturn.sellerName,
            courier: matchReturn.courier,
            salesChannel: matchReturn.salesChannel,
          },
        };
      }
      // Fallback: any PED- pattern
      return {
        type: "pedido_despachado",
        data: {
          orderId: q,
          sellerName: "Extra Life",
          courier: "Blue Express",
          salesChannel: "Falabella",
        },
      };
    }
    return null;
  },
};

/** Handler C: Expired order (FEATURE-14) */
const pedidoExpiradoHandler: ScanHandler = {
  name: "pedido_expirado",
  tryMatch: (code) => {
    const q = code.trim().toUpperCase();
    // Mock: codes starting with "EXP-" simulate expired orders
    if (q.startsWith("EXP-")) {
      return {
        type: "pedido_expirado",
        data: {
          orderId: q.replace("EXP-", "PED-"),
          sellerName: "GoHard",
          courier: "Starken",
          salesChannel: "MercadoLibre",
        },
      };
    }
    return null;
  },
};

// The handlers in priority order — first match wins
const SCAN_HANDLERS: ScanHandler[] = [
  returnPrecreadaHandler,
  pedidoDespachadoHandler,
  pedidoExpiradoHandler,
];

function runScanPipeline(code: string): ScanResult {
  for (const handler of SCAN_HANDLERS) {
    const result = handler.tryMatch(code);
    if (result) return result;
  }
  return { type: "no_reconocido", data: {} };
}

// ─── Step types ─────────────────────────────────────────────────────────────
type ViewStep = "scan" | "result" | "location" | "label" | "success";

// ═════════════════════════════════════════════════════════════════════════════
// Result Card Components
// ═════════════════════════════════════════════════════════════════════════════

function ResultCardPrecreada({
  record, onConfirm,
}: {
  record: ReturnRecord;
  onConfirm: () => void;
}) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold text-green-800">
          Devolución pre-creada encontrada
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <span className="text-xs text-neutral-500 block">ID devolución</span>
          <span className="font-mono font-semibold text-neutral-800">{record.displayId}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Seller</span>
          <span className="font-medium text-neutral-800">{record.sellerName}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Pedido</span>
          <span className="font-medium text-neutral-800">{record.orderDisplayId || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Courier</span>
          <span className="font-medium text-neutral-800">{record.courier}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Canal</span>
          <span className="font-medium text-neutral-800">{record.salesChannel}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Sucursal</span>
          <span className="font-medium text-neutral-800">{record.branchName}</span>
        </div>
      </div>
      {record.items.length > 0 && (
        <div className="text-xs text-neutral-500">
          {record.items.length} producto(s): {record.items.map(i => i.productName).join(", ")}
        </div>
      )}
      <Button
        onClick={onConfirm}
        size="lg"
        iconLeft={<Check className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Confirmar recepción
      </Button>
    </div>
  );
}

function ResultCardPedido({
  orderId, sellerName, courier, salesChannel, onCreateReturn,
}: {
  orderId: string;
  sellerName: string;
  courier: string;
  salesChannel: string;
  onCreateReturn: () => void;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Pedido encontrado</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-xs text-neutral-500 block">Pedido</span>
          <span className="font-mono font-semibold text-neutral-800">{orderId}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Seller</span>
          <span className="font-medium text-neutral-800">{sellerName}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Courier</span>
          <span className="font-medium text-neutral-800">{courier}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Canal</span>
          <span className="font-medium text-neutral-800">{salesChannel}</span>
        </div>
      </div>
      <p className="text-xs text-blue-700">
        Este pedido no tiene una devolución pre-creada. Puedes crear una ahora.
      </p>
      <Button
        onClick={onCreateReturn}
        size="lg"
        iconLeft={<Plus className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Crear devolución
      </Button>
    </div>
  );
}

function ResultCardExpirado({
  orderId, sellerName, onConvert,
}: {
  orderId: string;
  sellerName: string;
  onConvert: () => void;
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Pedido expirado</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-xs text-neutral-500 block">Pedido</span>
          <span className="font-mono font-semibold text-neutral-800">{orderId}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-500 block">Seller</span>
          <span className="font-medium text-neutral-800">{sellerName}</span>
        </div>
      </div>
      <p className="text-xs text-amber-700">
        Este pedido ha expirado y no fue entregado. Puedes convertirlo en una devolución para gestionar el paquete.
      </p>
      <Button
        onClick={onConvert}
        size="lg"
        iconLeft={<RefreshCw className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Convertir en devolución
      </Button>
    </div>
  );
}

function ResultCardNoReconocido({
  scannedCode, onRegisterUnknown, onCreateManual,
}: {
  scannedCode: string;
  onRegisterUnknown: () => void;
  onCreateManual: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-red-600" />
        <span className="text-sm font-semibold text-red-800">Paquete no identificado</span>
      </div>
      <p className="text-sm text-red-700">
        El código <span className="font-mono font-medium">{scannedCode}</span> no corresponde a
        ningún pedido o devolución registrada.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onRegisterUnknown}
          size="lg"
          iconLeft={<Package className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Registrar como paquete desconocido
        </Button>
        <Button
          variant="secondary"
          onClick={onCreateManual}
          size="lg"
          iconLeft={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Crear devolución manual
        </Button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Location Selector (MEJORA-6)
// ═════════════════════════════════════════════════════════════════════════════
function LocationSelector({
  location, setLocation, onConfirm, onBack,
}: {
  location: string;
  setLocation: (v: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-500" />
        <h3 className="text-base font-semibold text-neutral-800">
          Asignar ubicación en bodega
        </h3>
      </div>
      <p className="text-sm text-neutral-500">
        Selecciona la ubicación donde se almacenará el paquete.
      </p>
      <FormField
        as="select"
        label="Ubicación en bodega *"
        value={location}
        onChange={setLocation}
      >
        <option value="">Seleccionar ubicación</option>
        {WAREHOUSE_LOCATIONS.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </FormField>
      <div className="flex items-center gap-2 pt-2">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!location}
          iconLeft={<Check className="w-4 h-4" />}
        >
          Confirmar ubicación
        </Button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Label Preview (MEJORA-7)
// ═════════════════════════════════════════════════════════════════════════════
function LabelPreview({
  returnId, sellerName, branch, location, onPrint, onFinish,
}: {
  returnId: string;
  sellerName: string;
  branch: string;
  location: string;
  onPrint: () => void;
  onFinish: () => void;
}) {
  const now = new Date();
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-neutral-800">Etiqueta de devolución</h3>
      <div className="max-w-xs bg-white border-2 border-dashed border-neutral-300 rounded-xl p-5 mx-auto">
        <div className="flex items-center justify-center mb-4">
          <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
            <QrCode className="w-10 h-10 text-neutral-400" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-mono font-bold text-lg text-neutral-900">{returnId}</p>
          <p className="text-sm text-neutral-600">{sellerName}</p>
          <p className="text-xs text-neutral-500">
            Recibido: {now.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
            {" "}{now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-neutral-500">{branch} &middot; {location}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          onClick={onPrint}
          size="lg"
          iconLeft={<Printer className="w-4 h-4" />}
        >
          Imprimir etiqueta
        </Button>
        <Button
          onClick={onFinish}
          size="lg"
          iconLeft={<Check className="w-4 h-4" />}
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════
export default function RecibirDevolucionPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewStep, setViewStep] = useState<ViewStep>("scan");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  // Context for the current action
  const [activeReturnId, setActiveReturnId] = useState("");
  const [activeSellerName, setActiveSellerName] = useState("");
  const [activeBranch, setActiveBranch] = useState("Quilicura");

  useEffect(() => {
    inputRef.current?.focus();
  }, [viewStep]);

  // ── Handle scan ─────────────────────────────────────────────────────────
  const handleScan = useCallback(() => {
    const code = scanInput.trim();
    if (!code) return;

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const result = runScanPipeline(code);

      if (result.type === "no_reconocido") {
        playScanErrorSound();
      } else {
        playScanSuccessSound();
      }

      setScanResult(result);
      setIsProcessing(false);
      setViewStep("result");

      // Pre-fill active context
      if (result.type === "return_precreada" && result.data.returnRecord) {
        setActiveReturnId(result.data.returnRecord.displayId);
        setActiveSellerName(result.data.returnRecord.sellerName);
        setActiveBranch(result.data.returnRecord.branchName);
      } else if (result.data.sellerName) {
        setActiveSellerName(result.data.sellerName);
        const mockId = `RET-${result.data.sellerName.replace(/\s/g, "").slice(0, 5).toUpperCase()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
        setActiveReturnId(mockId);
      }
    }, 600);
  }, [scanInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan();
    }
  };

  // ── Action handlers ─────────────────────────────────────────────────────
  const goToLocation = () => {
    setViewStep("location");
  };

  const confirmLocation = () => {
    setViewStep("label");
  };

  const handlePrint = () => {
    setToast({ message: "Etiqueta enviada a impresión", type: "success" });
  };

  const handleFinish = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push("/devoluciones");
    }, 2000);
  };

  const resetScan = () => {
    setScanInput("");
    setScanResult(null);
    setViewStep("scan");
    setLocation("");
    setActiveReturnId("");
    setActiveSellerName("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-full bg-white">
      {/* Topbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/devoluciones"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <nav className="text-sm text-neutral-400 hidden sm:flex items-center gap-1.5">
              <Link href="/devoluciones" className="hover:text-neutral-600 transition-colors">
                Devoluciones
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-neutral-700 font-medium">Recibir devolución</span>
            </nav>
          </div>

          {viewStep !== "scan" && (
            <Button variant="secondary" size="sm" onClick={resetScan} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
              Nuevo escaneo
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── SCAN VIEW ──────────────────────────────────────────────────── */}
        {viewStep === "scan" && (
          <div className="space-y-8">
            {/* Hero scanner area */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-primary-500" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900">Recibir devolución</h1>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                Escanea el código QR del paquete o ingresa el código manualmente para identificar la devolución.
              </p>
            </div>

            {/* Large scan input */}
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escanea el código QR o ingresa el código..."
                  className="w-full h-16 pl-12 pr-28 text-lg font-mono bg-neutral-50 border-2 border-neutral-200 rounded-2xl
                    focus:border-primary-500 focus:bg-white focus:outline-none transition-all
                    placeholder:text-neutral-400 placeholder:font-sans placeholder:text-base"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={!scanInput.trim() || isProcessing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-5 bg-primary-500 text-white text-sm font-medium rounded-xl
                    hover:bg-primary-600 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                      </svg>
                      Buscando...
                    </span>
                  ) : (
                    "Buscar"
                  )}
                </button>
              </div>
            </div>

            {/* Manual link */}
            <div className="text-center">
              <Link
                href="/devoluciones/crear"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                O ingresa manualmente
              </Link>
            </div>

            {/* Quick tips */}
            <div className="max-w-lg mx-auto">
              <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Códigos aceptados
                </h4>
                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-neutral-700">QR de devolución:</strong> RET-XXXX-NNN</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-neutral-700">Pedido despachado:</strong> PED-XXXX</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-neutral-700">Pedido expirado:</strong> EXP-XXXX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT VIEW ────────────────────────────────────────────────── */}
        {viewStep === "result" && scanResult && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
                {scanInput}
              </span>
            </div>

            {scanResult.type === "return_precreada" && scanResult.data.returnRecord && (
              <ResultCardPrecreada
                record={scanResult.data.returnRecord}
                onConfirm={goToLocation}
              />
            )}

            {scanResult.type === "pedido_despachado" && (
              <ResultCardPedido
                orderId={scanResult.data.orderId || "—"}
                sellerName={scanResult.data.sellerName || "—"}
                courier={scanResult.data.courier || "—"}
                salesChannel={scanResult.data.salesChannel || "—"}
                onCreateReturn={goToLocation}
              />
            )}

            {scanResult.type === "pedido_expirado" && (
              <ResultCardExpirado
                orderId={scanResult.data.orderId || "—"}
                sellerName={scanResult.data.sellerName || "—"}
                onConvert={goToLocation}
              />
            )}

            {scanResult.type === "no_reconocido" && (
              <ResultCardNoReconocido
                scannedCode={scanInput}
                onRegisterUnknown={goToLocation}
                onCreateManual={() => router.push("/devoluciones/crear")}
              />
            )}

            <button
              type="button"
              onClick={resetScan}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Escanear otro código
            </button>
          </div>
        )}

        {/* ── LOCATION VIEW (MEJORA-6) ───────────────────────────────────── */}
        {viewStep === "location" && (
          <LocationSelector
            location={location}
            setLocation={setLocation}
            onConfirm={confirmLocation}
            onBack={() => setViewStep("result")}
          />
        )}

        {/* ── LABEL VIEW (MEJORA-7) ──────────────────────────────────────── */}
        {viewStep === "label" && (
          <LabelPreview
            returnId={activeReturnId || "RET-NUEVO-001"}
            sellerName={activeSellerName || "—"}
            branch={activeBranch}
            location={location}
            onPrint={handlePrint}
            onFinish={handleFinish}
          />
        )}
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Devolución recibida exitosamente</span>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" :
          toast.type === "error" ? "bg-red-600 text-white" :
          "bg-neutral-800 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
           toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> :
           <Info className="w-4 h-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
