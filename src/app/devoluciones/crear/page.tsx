"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, Check, X, Camera,
  Package, AlertTriangle, Printer, QrCode, Image as ImageIcon,
  Trash2, Plus, ArrowLeft,
} from "lucide-react";
import StepIndicator from "@/components/recepciones/StepIndicator";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import {
  SELLERS, COURIERS, BRANCHES, SALES_CHANNELS, RETURN_REASONS,
  MOCK_RETURNS,
  type ReturnItemRecord,
} from "../_data";

// ─── Types ──────────────────────────────────────────────────────────────────
type WizardStep = 1 | 2 | 3 | 4;

type FoundOrder = {
  orderId: string;
  sellerId: string;
  sellerName: string;
  courier: string;
  salesChannel: string;
  items: ReturnItemRecord[];
};

type FormData = {
  // step 1
  searchQuery: string;
  canIdentifyOrder: boolean;
  foundOrder: FoundOrder | null;
  sellerId: string;
  courier: string;
  salesChannel: string;
  branch: string;
  // step 2
  items: (ReturnItemRecord & { reasonOverride?: string })[];
  // step 3
  photos: string[]; // mock URLs
};

const WIZARD_STEPS = [
  { number: 1, label: "Identificar pedido" },
  { number: 2, label: "Productos" },
  { number: 3, label: "Evidencia fotográfica" },
  { number: 4, label: "Confirmar" },
];

// ─── Mock order lookup ──────────────────────────────────────────────────────
function mockFindOrder(query: string): FoundOrder | null {
  const q = query.trim().toUpperCase();
  if (!q) return null;
  // Match against existing return records that have an orderId
  const match = MOCK_RETURNS.find(
    r => r.orderDisplayId?.toUpperCase() === q || r.displayId.toUpperCase() === q
  );
  if (match && match.orderDisplayId) {
    return {
      orderId: match.orderDisplayId,
      sellerId: match.sellerId,
      sellerName: match.sellerName,
      courier: match.courier,
      salesChannel: match.salesChannel,
      items: match.items.map(i => ({ ...i })),
    };
  }
  // Fallback: match against PED-XXXX pattern
  if (q.startsWith("PED-")) {
    return {
      orderId: q,
      sellerId: "s-extralife",
      sellerName: "Extra Life",
      courier: "Blue Express",
      salesChannel: "Falabella",
      items: [
        { id: "mock-1", sku: "EL-010", productName: "Extra Life Vitamina C 1000mg x60", quantity: 2, returnReason: "Defectuoso" },
        { id: "mock-2", sku: "EL-015", productName: "Extra Life Omega-3 120 cáps", quantity: 1, returnReason: "No deseado" },
      ],
    };
  }
  return null;
}

// ─── Mock photo placeholders ────────────────────────────────────────────────
const MOCK_PHOTOS = [
  "/photos/mock-return-1.jpg",
  "/photos/mock-return-2.jpg",
  "/photos/mock-return-3.jpg",
  "/photos/mock-return-4.jpg",
  "/photos/mock-return-5.jpg",
];

// ═════════════════════════════════════════════════════════════════════════════
// Step 1: Identificar pedido
// ═════════════════════════════════════════════════════════════════════════════
function Step1({
  form, setForm, onSearch,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onSearch: () => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle: can identify order? */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-700">
          ¿Puedes identificar el pedido?
        </span>
        <button
          type="button"
          onClick={() =>
            setForm(f => ({
              ...f,
              canIdentifyOrder: !f.canIdentifyOrder,
              foundOrder: null,
              searchQuery: "",
            }))
          }
          className={`w-11 h-6 flex-shrink-0 rounded-full transition-colors duration-300 flex items-center px-1 cursor-pointer ${
            form.canIdentifyOrder ? "bg-primary-500" : "bg-neutral-200"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              form.canIdentifyOrder ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-xs text-neutral-500">
          {form.canIdentifyOrder ? "Sí" : "No"}
        </span>
      </div>

      {/* Search mode */}
      {form.canIdentifyOrder && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              ref={searchRef}
              type="text"
              value={form.searchQuery}
              onChange={e => setForm(f => ({ ...f, searchQuery: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por ID de pedido, tracking courier o N° orden..."
              className="w-full h-14 pl-12 pr-4 text-base bg-neutral-50 border-2 border-neutral-200 rounded-xl
                focus:border-primary-500 focus:bg-white focus:outline-none transition-all
                placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={onSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 bg-primary-500 text-white text-sm font-medium rounded-lg
                hover:bg-primary-600 transition-colors"
            >
              Buscar
            </button>
          </div>

          {/* Found order preview */}
          {form.foundOrder && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Pedido encontrado</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-neutral-500 block">Pedido</span>
                  <span className="font-medium text-neutral-800">{form.foundOrder.orderId}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Seller</span>
                  <span className="font-medium text-neutral-800">{form.foundOrder.sellerName}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Courier</span>
                  <span className="font-medium text-neutral-800">{form.foundOrder.courier}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Canal de venta</span>
                  <span className="font-medium text-neutral-800">{form.foundOrder.salesChannel}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, foundOrder: null, searchQuery: "" }))}
                className="mt-3 text-xs text-green-700 hover:text-green-900 underline transition-colors"
              >
                Buscar otro pedido
              </button>
            </div>
          )}

          {/* Not found message */}
          {form.searchQuery && !form.foundOrder && form.searchQuery.length > 3 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">No se encontró el pedido</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Completa los datos manualmente o intenta con otro código.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual form (shown when toggle is off OR order not found) */}
      {(!form.canIdentifyOrder || !form.foundOrder) && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-neutral-800">Datos de la devolución</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              as="select"
              label="Seller *"
              value={form.sellerId}
              onChange={v => setForm(f => ({ ...f, sellerId: v }))}
            >
              <option value="">Seleccionar seller</option>
              {SELLERS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </FormField>

            <FormField
              as="select"
              label="Courier *"
              value={form.courier}
              onChange={v => setForm(f => ({ ...f, courier: v }))}
            >
              <option value="">Seleccionar courier</option>
              {COURIERS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FormField>

            <FormField
              as="select"
              label="Canal de venta"
              value={form.salesChannel}
              onChange={v => setForm(f => ({ ...f, salesChannel: v }))}
            >
              <option value="">Seleccionar canal</option>
              {SALES_CHANNELS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FormField>

            <FormField
              as="select"
              label="Sucursal de recepción *"
              value={form.branch}
              onChange={v => setForm(f => ({ ...f, branch: v }))}
            >
              <option value="">Seleccionar sucursal</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </FormField>
          </div>
        </div>
      )}

      {/* Sucursal only (when order found, still need branch) */}
      {form.canIdentifyOrder && form.foundOrder && (
        <div className="max-w-xs">
          <FormField
            as="select"
            label="Sucursal de recepción *"
            value={form.branch}
            onChange={v => setForm(f => ({ ...f, branch: v }))}
          >
            <option value="">Seleccionar sucursal</option>
            {BRANCHES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </FormField>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 2: Productos
// ═════════════════════════════════════════════════════════════════════════════
function Step2({
  form, setForm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const hasOrder = !!form.foundOrder;

  if (!hasOrder && form.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-12 h-12 text-neutral-300 mb-4" />
        <h3 className="text-base font-semibold text-neutral-700 mb-1">
          Sin pedido asociado
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm">
          Los productos se agregarán cuando se identifique el pedido. Puedes continuar
          al siguiente paso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-neutral-800">
        Productos de la devolución
      </h3>
      {form.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs font-semibold">
                <th className="text-left px-4 py-3" style={{ whiteSpace: "nowrap" }}>SKU</th>
                <th className="text-left px-4 py-3" style={{ whiteSpace: "nowrap" }}>Producto</th>
                <th className="text-center px-4 py-3" style={{ whiteSpace: "nowrap" }}>Cantidad</th>
                <th className="text-left px-4 py-3" style={{ whiteSpace: "nowrap" }}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={item.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600" style={{ whiteSpace: "nowrap" }}>
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 text-neutral-800" style={{ whiteSpace: "nowrap" }}>
                    {item.productName}
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-800">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.reasonOverride ?? item.returnReason}
                      onChange={e => {
                        setForm(f => {
                          const newItems = [...f.items];
                          newItems[idx] = { ...newItems[idx], reasonOverride: e.target.value };
                          return { ...f, items: newItems };
                        });
                      }}
                      className="h-8 px-2 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-800 focus:border-primary-500 focus:outline-none"
                    >
                      {RETURN_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No hay productos registrados aún.</p>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 3: Evidencia fotográfica
// ═════════════════════════════════════════════════════════════════════════════
function Step3({
  form, setForm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const addPhoto = () => {
    if (form.photos.length >= 5) return;
    const nextIdx = form.photos.length;
    setForm(f => ({
      ...f,
      photos: [...f.photos, MOCK_PHOTOS[nextIdx] || `/photos/mock-return-${nextIdx + 1}.jpg`],
    }));
  };

  const removePhoto = (idx: number) => {
    setForm(f => ({
      ...f,
      photos: f.photos.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-neutral-800 mb-1">Evidencia fotográfica</h3>
        <p className="text-sm text-neutral-500">
          Toma al menos 1 foto del paquete. Máximo 5 fotos.
        </p>
      </div>

      {form.photos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-700">Se requiere al menos 1 foto para continuar.</span>
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {form.photos.map((url, idx) => (
          <div
            key={idx}
            className="relative aspect-[4/3] bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden group"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-neutral-300" />
            </div>
            <div className="absolute inset-0 bg-neutral-900/5 group-hover:bg-neutral-900/20 transition-colors" />
            <span className="absolute bottom-2 left-2 text-[10px] font-mono text-neutral-500 bg-white/80 px-1.5 py-0.5 rounded">
              Foto {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full
                flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {form.photos.length < 5 && (
          <button
            type="button"
            onClick={addPhoto}
            className="aspect-[4/3] bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl
              flex flex-col items-center justify-center gap-2
              hover:border-primary-400 hover:bg-primary-25 transition-all cursor-pointer
              min-h-[140px]"
          >
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary-500" />
            </div>
            <span className="text-sm font-medium text-primary-600">Tomar foto</span>
            <span className="text-[10px] text-neutral-500">
              {form.photos.length}/5 fotos
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 4: Confirmar y generar etiqueta
// ═════════════════════════════════════════════════════════════════════════════
function Step4({ form }: { form: FormData }) {
  const sellerName = form.foundOrder?.sellerName
    || SELLERS.find(s => s.id === form.sellerId)?.name
    || "—";
  const orderId = form.foundOrder?.orderId || "Sin pedido";
  const courier = form.foundOrder?.courier || form.courier || "—";
  const salesChannel = form.foundOrder?.salesChannel || form.salesChannel || "—";
  const now = new Date();
  const mockReturnId = `RET-${sellerName.replace(/\s/g, "").slice(0, 5).toUpperCase()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-neutral-800">Resumen de la devolución</h3>

      {/* Summary grid */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">ID devolución</span>
            <span className="font-semibold text-neutral-800 font-mono">{mockReturnId}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Pedido asociado</span>
            <span className="font-medium text-neutral-800">{orderId}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Seller</span>
            <span className="font-medium text-neutral-800">{sellerName}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Courier</span>
            <span className="font-medium text-neutral-800">{courier}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Canal de venta</span>
            <span className="font-medium text-neutral-800">{salesChannel}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Sucursal</span>
            <span className="font-medium text-neutral-800">{form.branch || "—"}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Fotos</span>
            <span className="font-medium text-neutral-800">{form.photos.length} foto(s)</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Productos</span>
            <span className="font-medium text-neutral-800">
              {form.items.length > 0 ? `${form.items.length} producto(s)` : "Sin productos"}
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-0.5">Fecha</span>
            <span className="font-medium text-neutral-800">
              {now.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Label preview */}
      <div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Vista previa de etiqueta</h4>
        <div className="max-w-xs bg-white border-2 border-dashed border-neutral-300 rounded-xl p-5 mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-10 h-10 text-neutral-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="font-mono font-bold text-lg text-neutral-900">{mockReturnId}</p>
            <p className="text-sm text-neutral-600">{sellerName}</p>
            <p className="text-xs text-neutral-500">
              {now.toLocaleDateString("es-CL")} &middot; {form.branch}
            </p>
            <p className="text-xs text-neutral-500">{orderId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session storage key for wizard persistence (R-3) ───────────────────
const WIZARD_STORAGE_KEY = "amplifica_dev_wizard_draft";

// ═════════════════════════════════════════════════════════════════════════════
// Main Wizard Page
// ═════════════════════════════════════════════════════════════════════════════
export default function CrearDevolucionPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [maxReached, setMaxReached] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState<FormData>({
    searchQuery: "",
    canIdentifyOrder: true,
    foundOrder: null,
    sellerId: "",
    courier: "",
    salesChannel: "",
    branch: "Quilicura",
    items: [],
    photos: [],
  });

  // ── Restore wizard state from sessionStorage on mount (R-3) ───────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.sellerId) setForm(f => ({ ...f, sellerId: draft.sellerId }));
        if (draft.courier) setForm(f => ({ ...f, courier: draft.courier }));
        if (draft.salesChannel) setForm(f => ({ ...f, salesChannel: draft.salesChannel }));
        if (draft.branch) setForm(f => ({ ...f, branch: draft.branch }));
        if (draft.step) setStep(draft.step);
        if (draft.maxReached) setMaxReached(draft.maxReached);
        if (draft.canIdentifyOrder !== undefined) setForm(f => ({ ...f, canIdentifyOrder: draft.canIdentifyOrder }));
        if (draft.searchQuery) setForm(f => ({ ...f, searchQuery: draft.searchQuery }));
      }
    } catch { /* ignore parse errors */ }
  }, []);

  // ── Persist wizard state to sessionStorage (R-3) ──────────────────────
  useEffect(() => {
    const draft = {
      step,
      maxReached,
      canIdentifyOrder: form.canIdentifyOrder,
      sellerId: form.sellerId,
      courier: form.courier,
      salesChannel: form.salesChannel,
      branch: form.branch,
      searchQuery: form.searchQuery,
    };
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(draft));
  }, [step, maxReached, form.canIdentifyOrder, form.sellerId, form.courier, form.salesChannel, form.branch, form.searchQuery]);

  // ── Beforeunload protection (R-4) ─────────────────────────────────────
  useEffect(() => {
    const isDirty = form.sellerId || form.courier || form.salesChannel || form.searchQuery || form.photos.length > 0;
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.sellerId, form.courier, form.salesChannel, form.searchQuery, form.photos.length]);

  // ── Search handler ──────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    const found = mockFindOrder(form.searchQuery);
    if (found) {
      setForm(f => ({
        ...f,
        foundOrder: found,
        sellerId: found.sellerId,
        courier: found.courier,
        salesChannel: found.salesChannel,
        items: found.items.map(i => ({ ...i })),
      }));
    } else {
      setForm(f => ({ ...f, foundOrder: null }));
    }
  }, [form.searchQuery]);

  // ── Step validation ─────────────────────────────────────────────────────
  const canAdvance = (s: WizardStep): boolean => {
    switch (s) {
      case 1: {
        if (form.canIdentifyOrder && form.foundOrder) return !!form.branch;
        return !!form.sellerId && !!form.courier && !!form.branch;
      }
      case 2: return true; // optional
      case 3: return form.photos.length >= 1;
      case 4: return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (step < 4 && canAdvance(step)) {
      const next = (step + 1) as WizardStep;
      setStep(next);
      setMaxReached(m => Math.max(m, next));
    }
  };

  const goPrev = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const handleStepClick = (s: number) => {
    if (s <= maxReached) setStep(s as WizardStep);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setIsSubmitting(true);
    // Mock delay
    await new Promise(r => setTimeout(r, 1200));
    setIsSubmitting(false);
    setShowSuccess(true);
    // Clear wizard draft from sessionStorage on success (R-3)
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
    // Redirect after success toast
    setTimeout(() => {
      router.push("/devoluciones");
    }, 2000);
  };

  // ── Cancel with unsaved changes ─────────────────────────────────────────
  const hasChanges =
    form.searchQuery || form.foundOrder || form.sellerId || form.photos.length > 0;

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      router.push("/devoluciones");
    }
  };

  return (
    <div className="min-h-full bg-white">
      {/* Topbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: back + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <nav className="text-sm text-neutral-400 hidden sm:flex items-center gap-1.5">
              <Link href="/devoluciones" className="hover:text-neutral-600 transition-colors">
                Devoluciones
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-neutral-700 font-medium">Crear devolución</span>
            </nav>
          </div>

          {/* Right: cancel */}
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step indicator */}
        <StepIndicator
          current={step}
          maxReached={maxReached}
          onStepClick={handleStepClick}
          steps={WIZARD_STEPS}
        />

        {/* Step content */}
        <div className="min-h-[360px]">
          {step === 1 && <Step1 form={form} setForm={setForm} onSearch={handleSearch} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && <Step3 form={form} setForm={setForm} />}
          {step === 4 && <Step4 form={form} />}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <Button
            variant="secondary"
            onClick={goPrev}
            disabled={step === 1}
            iconLeft={<ChevronLeft className="w-4 h-4" />}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button variant="tertiary" onClick={goNext}>
                Omitir paso
              </Button>
            )}

            {step < 4 ? (
              <Button
                onClick={goNext}
                disabled={!canAdvance(step)}
                iconRight={<ChevronRight className="w-4 h-4" />}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                loading={isSubmitting}
                loadingText="Creando..."
                iconLeft={<Check className="w-4 h-4" />}
              >
                Confirmar recepción
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Devolución creada exitosamente</span>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-2">
              ¿Descartar cambios?
            </h3>
            <p className="text-sm text-neutral-500 mb-5">
              Tienes datos sin guardar. Si sales ahora, se perderán todos los cambios.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCancelModal(false)}>
                Seguir editando
              </Button>
              <button
                onClick={() => {
                  sessionStorage.removeItem(WIZARD_STORAGE_KEY);
                  router.push("/devoluciones");
                }}
                className="h-8 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
