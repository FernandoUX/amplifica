"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, ArrowLeftRight, Package,
  Check, MapPin, FileText, AlertCircle, CheckCircle2,
  AlertTriangle, Info, X,
} from "lucide-react";

import {
  SELLERS, BRANCHES, MOCK_RETURNS,
  type ReturnRecord,
} from "@/app/devoluciones/_data";
import ReturnStatusBadge from "@/components/devoluciones/ReturnStatusBadge";
import Button from "@/components/ui/Button";

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ["Seller y destino", "Seleccionar devoluciones", "Confirmar"];
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-px ${isDone ? "bg-primary-400" : "bg-neutral-200"}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isDone
                    ? "bg-primary-500 text-white"
                    : isActive
                      ? "bg-primary-50 text-primary-600 ring-2 ring-primary-500"
                      : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isActive ? "font-medium text-neutral-900" : isDone ? "text-neutral-600" : "text-neutral-400"
                }`}
              >
                {labels[i]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CrearTransferenciaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // ── Toast state ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{message: string; type: "success"|"error"|"info"} | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  // Step 1
  const [sellerId, setSellerId] = useState("");
  const [destinationBranch, setDestinationBranch] = useState("");

  // Step 2
  const [selectedReturnIds, setSelectedReturnIds] = useState<Set<string>>(new Set());

  // Step 3
  const [notes, setNotes] = useState("");

  // Derived: selected seller
  const selectedSeller = SELLERS.find(s => s.id === sellerId);

  // Eligible returns: recibida_en_bodega, matching seller, NOT at destination branch
  const eligibleReturns = useMemo(() => {
    if (!sellerId || !destinationBranch) return [];
    return MOCK_RETURNS.filter(r =>
      r.sellerId === sellerId &&
      r.status === "recibida_en_bodega" &&
      r.currentBranchName !== destinationBranch
    );
  }, [sellerId, destinationBranch]);

  // Group eligible returns by branch
  const branchGroups = useMemo(() => {
    const groups: Record<string, ReturnRecord[]> = {};
    for (const ret of eligibleReturns) {
      if (!groups[ret.currentBranchName]) groups[ret.currentBranchName] = [];
      groups[ret.currentBranchName].push(ret);
    }
    return groups;
  }, [eligibleReturns]);

  // Selected returns data
  const selectedReturns = useMemo(
    () => MOCK_RETURNS.filter(r => selectedReturnIds.has(r.id)),
    [selectedReturnIds]
  );

  // Group selected by origin branch for summary
  const selectedByBranch = useMemo(() => {
    const groups: Record<string, ReturnRecord[]> = {};
    for (const ret of selectedReturns) {
      if (!groups[ret.currentBranchName]) groups[ret.currentBranchName] = [];
      groups[ret.currentBranchName].push(ret);
    }
    return groups;
  }, [selectedReturns]);

  // Toggle individual return
  const toggleReturn = (id: string) => {
    setSelectedReturnIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle all returns from a branch
  const toggleBranch = (branchName: string, returns: ReturnRecord[]) => {
    setSelectedReturnIds(prev => {
      const next = new Set(prev);
      const allSelected = returns.every(r => next.has(r.id));
      if (allSelected) {
        returns.forEach(r => next.delete(r.id));
      } else {
        returns.forEach(r => next.add(r.id));
      }
      return next;
    });
  };

  // Navigation
  const canGoStep2 = sellerId !== "" && destinationBranch !== "" && eligibleReturns.length > 0;
  const canGoStep3 = selectedReturnIds.size > 0;

  const goNext = () => {
    if (step === 1 && canGoStep2) setStep(2);
    else if (step === 2 && canGoStep3) setStep(3);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = () => {
    const branchCount = Object.keys(selectedByBranch).length;
    setToast({ message: `Transferencia creada: ${selectedReturnIds.size} devoluciones desde ${branchCount} sucursales a ${destinationBranch}`, type: "success" });
    setTimeout(() => {
      router.push("/devoluciones/transferencias");
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-4 pb-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/devoluciones" className="hover:text-primary-500 transition-colors">Devoluciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <Link href="/devoluciones/transferencias" className="hover:text-primary-500 transition-colors">Transferencias</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Crear transferencia</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary-500" />
            Crear transferencia
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Mueve devoluciones desde sucursales al centro de distribución
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={3} />

      {/* Step content */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        {/* ─── Step 1: Seller y destino ──────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Seleccionar seller y destino</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Elige el seller cuyas devoluciones quieres transferir y la bodega de destino.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Seller */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Seller <span className="text-red-500">*</span>
                </label>
                <select
                  value={sellerId}
                  onChange={e => {
                    setSellerId(e.target.value);
                    setSelectedReturnIds(new Set());
                  }}
                  className="w-full h-9 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                >
                  <option value="">Seleccionar seller...</option>
                  {SELLERS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination branch */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Bodega destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={destinationBranch}
                  onChange={e => {
                    setDestinationBranch(e.target.value);
                    setSelectedReturnIds(new Set());
                  }}
                  className="w-full h-9 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                >
                  <option value="">Seleccionar destino...</option>
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Eligible returns count */}
            {sellerId && destinationBranch && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                eligibleReturns.length > 0
                  ? "bg-primary-50 text-primary-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {eligibleReturns.length > 0 ? (
                  <>
                    <Package className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>{eligibleReturns.length}</strong> devoluciones disponibles para transferir
                      de <strong>{selectedSeller?.name}</strong> en {Object.keys(branchGroups).length} sucursales
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      No hay devoluciones disponibles para transferir. Se requieren devoluciones con estado
                      &quot;Recibida en bodega&quot; en sucursales distintas a {destinationBranch}.
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Seleccionar devoluciones ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Seleccionar devoluciones</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Elige las devoluciones que deseas incluir en esta transferencia. Están agrupadas por sucursal de origen.
              </p>
            </div>

            {/* Selection summary */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-lg text-sm text-neutral-600">
              <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span>
                {selectedReturnIds.size} de {eligibleReturns.length} devoluciones seleccionadas
              </span>
            </div>

            {/* Grouped tables by branch */}
            {Object.entries(branchGroups).map(([branch, returns]) => {
              const allSelected = returns.every(r => selectedReturnIds.has(r.id));
              const someSelected = returns.some(r => selectedReturnIds.has(r.id));

              return (
                <div key={branch} className="border border-neutral-200 rounded-xl overflow-hidden">
                  {/* Branch header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => toggleBranch(branch, returns)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500/30 cursor-pointer"
                        />
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-sm font-semibold text-neutral-800">{branch}</span>
                      </label>
                      <span className="text-xs font-medium text-neutral-500 bg-neutral-200/60 rounded-full px-2 py-0.5">
                        {returns.length} devoluciones
                      </span>
                    </div>
                    <button
                      onClick={() => toggleBranch(branch, returns)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                    </button>
                  </div>

                  {/* Returns table */}
                  <div className="overflow-x-auto table-scroll">
                    <table className="w-full text-sm" style={{ whiteSpace: "nowrap" }}>
                      <thead>
                        <tr className="border-b border-neutral-100">
                          <th className="w-10 py-2 px-3"></th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">ID</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Productos</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Estado</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Ubicación</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Recibida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returns.map(ret => {
                          const isSelected = selectedReturnIds.has(ret.id);
                          return (
                            <tr
                              key={ret.id}
                              className={`border-b border-neutral-50 last:border-0 transition-colors cursor-pointer ${
                                isSelected ? "bg-primary-50/40" : "hover:bg-neutral-50"
                              }`}
                              onClick={() => toggleReturn(ret.id)}
                            >
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleReturn(ret.id)}
                                  className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500/30 cursor-pointer"
                                  onClick={e => e.stopPropagation()}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <span className="inline-flex items-center bg-neutral-100 text-neutral-700 rounded px-1 py-0.5 text-xs font-mono">
                                  {ret.displayId}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-sm text-neutral-700 max-w-[250px] truncate">
                                {ret.items.length > 0
                                  ? ret.items.map(i => i.productName).join(", ")
                                  : "Sin productos registrados"}
                              </td>
                              <td className="py-2 px-2">
                                <ReturnStatusBadge status={ret.status} />
                              </td>
                              <td className="py-2 px-2 text-xs font-mono text-neutral-500">
                                {ret.location || "\u2014"}
                              </td>
                              <td className="py-2 px-2 text-xs text-neutral-500">
                                {ret.receivedAt
                                  ? new Date(ret.receivedAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
                                  : "\u2014"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Step 3: Confirmar ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Confirmar transferencia</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Revisa los detalles y confirma la creación de la transferencia.
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-neutral-900">{selectedReturnIds.size}</p>
                <p className="text-xs text-neutral-500 mt-1">Devoluciones</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-neutral-900">{Object.keys(selectedByBranch).length}</p>
                <p className="text-xs text-neutral-500 mt-1">Sucursales (tramos)</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-neutral-900">{selectedSeller?.name}</p>
                <p className="text-xs text-neutral-500 mt-1">Seller</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-neutral-500">Destino</span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-900">{destinationBranch}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <span className="text-sm text-neutral-500 block mb-2">Tramos previstos</span>
                <div className="space-y-1.5">
                  {Object.entries(selectedByBranch).map(([branch, returns]) => (
                    <div key={branch} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-sm text-neutral-800">{branch}</span>
                      </div>
                      <span className="text-xs font-medium text-neutral-600 bg-neutral-200/60 rounded-full px-2 py-0.5">
                        {returns.length} dev.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Instrucciones especiales, motivo de la transferencia..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          {step > 1 ? (
            <Button
              variant="secondary"
              onClick={goBack}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
          ) : (
            <Button
              href="/devoluciones/transferencias"
              variant="secondary"
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <Button
              onClick={goNext}
              disabled={step === 1 ? !canGoStep2 : !canGoStep3}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              iconLeft={<ArrowLeftRight className="w-4 h-4" />}
            >
              Crear transferencia
            </Button>
          )}
        </div>
      </div>

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
