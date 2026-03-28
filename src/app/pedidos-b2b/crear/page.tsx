"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  Truck,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  X,
} from "lucide-react";

import {
  CATALOGO_PRODUCTOS,
  CHECKLIST_ML,
  CHECKLIST_FALABELLA,
  type ProductoB2B,
  type CanalVenta,
  type MetodoEnvio,
  type ChecklistItem,
  type KitB2B,
} from "@/app/pedidos-b2b/_data";

import B2BWizardSteps from "@/components/b2b/B2BWizardSteps";
import StockIndicator from "@/components/b2b/StockIndicator";
import MarketplaceChecklist from "@/components/b2b/MarketplaceChecklist";
import KitConfigurator from "@/components/b2b/KitConfigurator";
import AlertModal from "@/components/ui/AlertModal";
import Button from "@/components/ui/Button";

// ─── Steps config ────────────────────────────────────────────────────────────
const STEPS = [
  { number: 1, label: "Destinatario" },
  { number: 2, label: "Productos" },
  { number: 3, label: "Envío y Marketplace" },
  { number: 4, label: "Confirmación" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });

// ─── RUT chileno validation & formatting ─────────────────────────────────────
function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toLowerCase();
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const expected = 11 - (sum % 11);
  const dvExpected = expected === 11 ? "0" : expected === 10 ? "k" : String(expected);
  return dv === dvExpected;
}

function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, "");
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

function getFieldError(field: string, value: string): string {
  if (!value.trim()) return "Este campo es obligatorio";
  if (field === "rut" && !validateRut(value)) return "RUT inválido";
  if (field === "emailContacto" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
  if (field === "telefonoContacto" && !/^\+?[\d\s-]{8,}$/.test(value)) return "Teléfono inválido";
  return "";
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CrearPedidoB2BPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // ── Step 1: Destinatario ─────────────────────────────────────────────────
  const [dest, setDest] = useState({
    razonSocial: "",
    rut: "",
    giro: "",
    nombreContacto: "",
    emailContacto: "",
    telefonoContacto: "",
    direccionEnvio: "",
    comuna: "",
    region: "",
    complemento: "",
  });

  // ── Step 2: Productos ────────────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    (ProductoB2B & { cantidad: number })[]
  >([]);

  // ── Step 3: Envío y Marketplace ──────────────────────────────────────────
  const [metodoEnvio, setMetodoEnvio] = useState<MetodoEnvio | "">("");
  const [canalVenta, setCanalVenta] = useState<CanalVenta>("Venta directa");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [kits, setKits] = useState<KitB2B[]>([]);
  const [bultos, setBultos] = useState(1);

  // ── Step 4: Notas ────────────────────────────────────────────────────────
  const [notas, setNotas] = useState("");

  // ── Unsaved changes protection (ES-2) ──────────────────────────────────
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    const hasDestData = Object.values(dest).some((v) => v.trim() !== "");
    return hasDestData || selectedProducts.length > 0 || metodoEnvio !== "" || notas.trim() !== "";
  }, [dest, selectedProducts, metodoEnvio, notas]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleNavigateAway = useCallback((href: string) => {
    if (isDirty) {
      setPendingHref(href);
      setShowExitModal(true);
    } else {
      router.push(href);
    }
  }, [isDirty, router]);

  const confirmExit = useCallback(() => {
    setShowExitModal(false);
    if (pendingHref) {
      router.push(pendingHref);
    }
  }, [pendingHref, router]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    if (!productSearch.trim()) return CATALOGO_PRODUCTOS;
    const q = productSearch.toLowerCase();
    return CATALOGO_PRODUCTOS.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.barcode.includes(q)
    );
  }, [productSearch]);

  const subtotal = useMemo(
    () => selectedProducts.reduce((s, p) => s + p.precioUnitario * p.cantidad, 0),
    [selectedProducts]
  );

  const needsRedistribution = useMemo(
    () => selectedProducts.some((p) => p.stockQuilicura < p.cantidad && p.stockGlobal >= p.cantidad),
    [selectedProducts]
  );

  // ── Validations ──────────────────────────────────────────────────────────
  const step1Valid =
    dest.razonSocial &&
    dest.rut &&
    dest.nombreContacto &&
    dest.emailContacto &&
    dest.telefonoContacto &&
    dest.direccionEnvio &&
    dest.comuna &&
    dest.region;

  const step2Valid = selectedProducts.length > 0;
  const step3Valid = metodoEnvio !== "";

  const isCurrentStepValid = () => {
    if (step === 1) return !!step1Valid;
    if (step === 2) return !!step2Valid;
    if (step === 3) return !!step3Valid;
    return true;
  };

  // ── Product actions ──────────────────────────────────────────────────────
  const addProduct = (prod: ProductoB2B) => {
    if (selectedProducts.some((p) => p.id === prod.id)) return;
    setSelectedProducts((prev) => [...prev, { ...prod, cantidad: 1 }]);
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  };

  // ── Canal change ─────────────────────────────────────────────────────────
  const handleCanalChange = (canal: CanalVenta) => {
    setCanalVenta(canal);
    if (canal === "Mercado Libre") {
      setChecklist(CHECKLIST_ML.map((c) => ({ ...c, completado: false })));
    } else if (canal === "Falabella") {
      setChecklist(CHECKLIST_FALABELLA.map((c) => ({ ...c, completado: false })));
    } else {
      setChecklist([]);
    }
  };

  // ── Confirm ──────────────────────────────────────────────────────────────
  // Stock revalidation (Etapa 5 — Nielsen #5: prevención de errores)
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    // Mock revalidation: 10% chance stock changed
    setConfirming(true);
    setTimeout(() => {
      const changed = Math.random() < 0.1;
      if (changed && selectedProducts.length > 0) {
        const p = selectedProducts[0];
        setStockWarning(`⚠️ El stock de "${p.nombre}" cambió desde que lo agregaste. Stock actual en Quilicura: ${Math.max(0, p.stockQuilicura - 5)} uds (antes: ${p.stockQuilicura}). Revisa antes de confirmar.`);
        setConfirming(false);
      } else {
        setStockWarning(null);
        setConfirming(false);
        sessionStorage.removeItem(WIZARD_KEY);
        setToast({ message: "Pedido B2B creado exitosamente", type: "success" });
        setTimeout(() => router.push("/pedidos-b2b"), 2000);
      }
    }, 800);
  };

  // ── Nav ──────────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step < 4 && isCurrentStepValid()) setStep((s) => s + 1);
  };
  const goPrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  // ── Field helper ─────────────────────────────────────────────────────────
  const setField = (key: keyof typeof dest, value: string) =>
    setDest((prev) => ({ ...prev, [key]: value }));

  // ── Inline validation (onBlur) ────────────────────────────────────────
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // ── Toast state (replaces alert()) ────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── Wizard autosave (SP-1) ──────────────────────────────────────────
  const WIZARD_KEY = "amplifica_b2b_wizard_draft";
  const isRestoringRef = useRef(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WIZARD_KEY);
      if (raw) {
        isRestoringRef.current = true;
        const d = JSON.parse(raw);
        if (d.dest) setDest(d.dest);
        if (d.selectedProducts?.length) setSelectedProducts(d.selectedProducts);
        if (d.metodoEnvio) setMetodoEnvio(d.metodoEnvio);
        if (d.canalVenta) setCanalVenta(d.canalVenta);
        if (d.notas) setNotas(d.notas);
        if (d.bultos) setBultos(d.bultos);
        if (d.step) setStep(d.step);
        requestAnimationFrame(() => { isRestoringRef.current = false; });
      }
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to sessionStorage on every change
  useEffect(() => {
    if (isRestoringRef.current) return;
    const draft = { step, dest, selectedProducts, metodoEnvio, canalVenta, notas, bultos };
    sessionStorage.setItem(WIZARD_KEY, JSON.stringify(draft));
  }, [step, dest, selectedProducts, metodoEnvio, canalVenta, notas, bultos]);

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
        <button
          type="button"
          onClick={() => handleNavigateAway("/pedidos-b2b")}
          className="hover:text-neutral-600 transition-colors"
        >
          Pedidos B2B
        </button>
        <ChevronDown className="w-3 h-3 -rotate-90" />
        <span className="text-neutral-700 font-medium">Crear pedido</span>
      </nav>

      {/* ── Wizard Steps ────────────────────────────────────────────────────── */}
      <B2BWizardSteps steps={STEPS} currentStep={step} />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — DESTINATARIO                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-neutral-900">
              Datos del destinatario
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {/* Razón social */}
            <FieldInput
              label="Razón social"
              required
              value={dest.razonSocial}
              onChange={(v) => setField("razonSocial", v)}
              onBlur={() => markTouched("razonSocial")}
              error={touched.razonSocial ? getFieldError("razonSocial", dest.razonSocial) : undefined}
              placeholder="Nombre de la empresa"
            />
            {/* RUT */}
            <FieldInput
              label="RUT"
              required
              value={dest.rut}
              onChange={(v) => setField("rut", formatRut(v))}
              onBlur={() => markTouched("rut")}
              error={touched.rut ? getFieldError("rut", dest.rut) : undefined}
              placeholder="76.XXX.XXX-X"
            />
            {/* Giro */}
            <FieldInput
              label="Giro"
              value={dest.giro}
              onChange={(v) => setField("giro", v)}
              placeholder="Giro comercial"
            />
            {/* Nombre contacto */}
            <FieldInput
              label="Nombre contacto"
              required
              value={dest.nombreContacto}
              onChange={(v) => setField("nombreContacto", v)}
              onBlur={() => markTouched("nombreContacto")}
              error={touched.nombreContacto ? getFieldError("nombreContacto", dest.nombreContacto) : undefined}
              placeholder="Nombre y apellido"
            />
            {/* Email */}
            <FieldInput
              label="Email"
              required
              type="email"
              value={dest.emailContacto}
              onChange={(v) => setField("emailContacto", v)}
              onBlur={() => markTouched("emailContacto")}
              error={touched.emailContacto ? getFieldError("emailContacto", dest.emailContacto) : undefined}
              placeholder="contacto@empresa.cl"
            />
            {/* Teléfono */}
            <FieldInput
              label="Teléfono"
              required
              value={dest.telefonoContacto}
              onChange={(v) => setField("telefonoContacto", v)}
              onBlur={() => markTouched("telefonoContacto")}
              error={touched.telefonoContacto ? getFieldError("telefonoContacto", dest.telefonoContacto) : undefined}
              placeholder="+56 9 XXXX XXXX"
            />
            {/* Dirección */}
            <FieldInput
              label="Dirección envío"
              required
              value={dest.direccionEnvio}
              onChange={(v) => setField("direccionEnvio", v)}
              onBlur={() => markTouched("direccionEnvio")}
              error={touched.direccionEnvio ? getFieldError("direccionEnvio", dest.direccionEnvio) : undefined}
              placeholder="Calle, número, oficina"
              className="col-span-2"
            />
            {/* Comuna */}
            <FieldInput
              label="Comuna"
              required
              value={dest.comuna}
              onChange={(v) => setField("comuna", v)}
              onBlur={() => markTouched("comuna")}
              error={touched.comuna ? getFieldError("comuna", dest.comuna) : undefined}
              placeholder="Ej: Providencia"
            />
            {/* Región */}
            <FieldInput
              label="Región"
              required
              value={dest.region}
              onChange={(v) => setField("region", v)}
              onBlur={() => markTouched("region")}
              error={touched.region ? getFieldError("region", dest.region) : undefined}
              placeholder="Ej: Metropolitana"
            />
            {/* Complemento */}
            <FieldInput
              label="Complemento"
              value={dest.complemento}
              onChange={(v) => setField("complemento", v)}
              placeholder="Piso, depto, referencia"
              className="col-span-2"
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — PRODUCTOS                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-neutral-900">
                Buscar productos
              </h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar por SKU, nombre o código de barras..."
                className="w-full h-9 pl-9 pr-3 border border-neutral-300 rounded-md text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none"
              />
            </div>

            {/* Search results */}
            {productSearch.trim() && (
              <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                {filteredCatalog.length === 0 ? (
                  <p className="text-sm text-neutral-400 px-4 py-3">
                    Sin resultados para &ldquo;{productSearch}&rdquo;
                  </p>
                ) : (
                  filteredCatalog.map((prod) => {
                    const alreadyAdded = selectedProducts.some((p) => p.id === prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {prod.nombre}
                          </p>
                          <p className="text-xs text-neutral-500">
                            SKU: {prod.sku} &middot; {fmt(prod.precioUnitario)}
                          </p>
                        </div>
                        <button
                          onClick={() => addProduct(prod)}
                          disabled={alreadyAdded}
                          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                            alreadyAdded
                              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                              : "bg-primary-50 text-primary-600 hover:bg-primary-100"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          {alreadyAdded ? "Agregado" : "Agregar"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected products table */}
          {selectedProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900">
                Productos seleccionados ({selectedProducts.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-neutral-700 border-b border-neutral-200">
                      <th className="text-left py-2 px-2">SKU</th>
                      <th className="text-left py-2 px-2">Nombre</th>
                      <th className="text-center py-2 px-2 w-20">Cantidad</th>
                      <th className="text-center py-2 px-2">Stock Quilicura</th>
                      <th className="text-center py-2 px-2">Stock Global</th>
                      <th className="text-right py-2 px-2">Precio</th>
                      <th className="text-right py-2 px-2">Subtotal</th>
                      <th className="py-2 px-2 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-neutral-50/60">
                        <td className="py-2 px-2 font-mono text-xs text-neutral-600">
                          {prod.sku}
                        </td>
                        <td className="py-2 px-2 text-neutral-900 font-medium truncate max-w-[200px]">
                          {prod.nombre}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            value={prod.cantidad}
                            onChange={(e) =>
                              updateQuantity(prod.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 h-8 text-center border border-neutral-300 rounded-md text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-xs">
                          {prod.stockQuilicura}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <StockIndicator
                            stockQuilicura={prod.stockQuilicura}
                            stockGlobal={prod.stockGlobal}
                            stockDetalle={prod.stockDetalle}
                            cantidadSolicitada={prod.cantidad}
                          />
                        </td>
                        <td className="py-2 px-2 text-right text-neutral-600">
                          {fmt(prod.precioUnitario)}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-neutral-900">
                          {fmt(prod.precioUnitario * prod.cantidad)}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeProduct(prod.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal */}
              <div className="flex justify-end pt-2 border-t border-neutral-100">
                <div className="text-right">
                  <p className="text-xs font-medium text-neutral-700">
                    Subtotal
                  </p>
                  <p className="text-lg font-bold text-neutral-900">{fmt(subtotal)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {selectedProducts.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-8 flex flex-col items-center gap-2">
              <Package className="w-8 h-8 text-neutral-300" strokeWidth={1.5} />
              <p className="text-sm text-neutral-500">
                Busca y agrega productos al pedido
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — ENVIO Y MARKETPLACE                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Método de envío */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-neutral-900">
                Método de envío
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    value: "Furgón Amplifica" as MetodoEnvio,
                    icon: <Truck className="w-5 h-5" strokeWidth={1.5} />,
                    desc: "Despacho propio con furgón Amplifica",
                  },
                  {
                    value: "Courier Blue Express" as MetodoEnvio,
                    icon: <Package className="w-5 h-5" strokeWidth={1.5} />,
                    desc: "Envío vía Blue Express a domicilio",
                  },
                  {
                    value: "Retiro en Tienda" as MetodoEnvio,
                    icon: <User className="w-5 h-5" strokeWidth={1.5} />,
                    desc: "Cliente retira en punto de venta",
                  },
                ] as const
              ).map((opt) => {
                const selected = metodoEnvio === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMetodoEnvio(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                      selected
                        ? "border-primary-400 bg-primary-50 text-primary-700"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    <span className={selected ? "text-primary-500" : "text-neutral-400"}>
                      {opt.icon}
                    </span>
                    <span className="text-xs font-semibold">{opt.value}</span>
                    <span className="text-[11px] text-neutral-500 leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canal de venta */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <label className="text-xs font-medium text-neutral-700">
              Canal de venta
            </label>

            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: "Venta directa" as CanalVenta, accent: "primary" },
                  { value: "Mercado Libre" as CanalVenta, accent: "yellow" },
                  { value: "Falabella" as CanalVenta, accent: "green" },
                ] as const
              ).map((opt) => {
                const selected = canalVenta === opt.value;
                const colorMap = {
                  primary: {
                    border: "border-primary-400",
                    bg: "bg-primary-50",
                    text: "text-primary-700",
                    dot: "bg-primary-500",
                  },
                  yellow: {
                    border: "border-yellow-400",
                    bg: "bg-yellow-50",
                    text: "text-yellow-700",
                    dot: "bg-yellow-500",
                  },
                  green: {
                    border: "border-green-400",
                    bg: "bg-green-50",
                    text: "text-green-700",
                    dot: "bg-green-500",
                  },
                };
                const colors = colorMap[opt.accent];

                return (
                  <button
                    key={opt.value}
                    onClick={() => handleCanalChange(opt.value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? `${colors.border} ${colors.bg} ${colors.text}`
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        selected ? colors.dot : "bg-neutral-300"
                      }`}
                    />
                    <span className="text-xs font-semibold">{opt.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marketplace checklist */}
          {canalVenta !== "Venta directa" && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <MarketplaceChecklist
                canal={canalVenta}
                checklist={checklist}
                bultos={bultos}
                onUpload={(itemId) => {
                  /* mock upload */
                }}
                onChecklistChange={setChecklist}
              />
            </div>
          )}

          {/* Kit configurator */}
          {kits.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <KitConfigurator
                kits={kits}
                onKitsChange={setKits}
                availableProducts={selectedProducts.map((p) => ({
                  sku: p.sku,
                  nombre: p.nombre,
                }))}
              />
            </div>
          )}

          {/* Bultos */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-neutral-700">
                  Cantidad de bultos
                </label>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Total de bultos que se despacharán
                </p>
              </div>
              <input
                type="number"
                min={1}
                value={bultos}
                onChange={(e) => setBultos(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-9 text-center border border-neutral-300 rounded-md text-sm font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 4 — CONFIRMACION                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Destinatario summary */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-neutral-900">Destinatario</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
              <SummaryField label="Razón social" value={dest.razonSocial} />
              <SummaryField label="RUT" value={dest.rut} />
              <SummaryField label="Contacto" value={dest.nombreContacto} />
              <SummaryField label="Email" value={dest.emailContacto} />
              <SummaryField label="Teléfono" value={dest.telefonoContacto} />
              <SummaryField label="Giro" value={dest.giro || "—"} />
              <SummaryField
                label="Dirección"
                value={`${dest.direccionEnvio}, ${dest.comuna}, ${dest.region}`}
                className="col-span-2"
              />
              {dest.complemento && (
                <SummaryField label="Complemento" value={dest.complemento} className="col-span-2" />
              )}
            </div>
          </div>

          {/* Productos summary */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-neutral-900">
                Productos ({selectedProducts.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-neutral-700 border-b border-neutral-200">
                    <th className="text-left py-2 px-2">SKU</th>
                    <th className="text-left py-2 px-2">Nombre</th>
                    <th className="text-center py-2 px-2">Cantidad</th>
                    <th className="text-right py-2 px-2">Precio</th>
                    <th className="text-right py-2 px-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {selectedProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td className="py-2 px-2 font-mono text-xs text-neutral-600">
                        {prod.sku}
                      </td>
                      <td className="py-2 px-2 text-neutral-900">{prod.nombre}</td>
                      <td className="py-2 px-2 text-center">{prod.cantidad}</td>
                      <td className="py-2 px-2 text-right text-neutral-600">
                        {fmt(prod.precioUnitario)}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold">
                        {fmt(prod.precioUnitario * prod.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <div className="text-right">
                <p className="text-xs font-medium text-neutral-700">
                  Total neto
                </p>
                <p className="text-lg font-bold text-neutral-900">{fmt(subtotal)}</p>
              </div>
            </div>
          </div>

          {/* Envío summary */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-neutral-900">
                Envío y canal de venta
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
              <SummaryField label="Método de envío" value={metodoEnvio || "—"} />
              <SummaryField label="Canal de venta" value={canalVenta} />
              <SummaryField label="Bultos" value={String(bultos)} />
              {kits.length > 0 && (
                <SummaryField label="Kits" value={`${kits.length} configurado(s)`} />
              )}
            </div>
          </div>

          {/* Stock revalidation warning (Etapa 5) */}
          {stockWarning && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Stock actualizado</p>
                <p className="text-xs text-red-700 mt-0.5">{stockWarning}</p>
                <button onClick={() => { setStockWarning(null); setStep(2); }} className="text-xs font-medium text-red-600 hover:text-red-700 mt-1 underline">
                  Volver a Productos para ajustar
                </button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {needsRedistribution && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Redistribución requerida
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Algunos productos no tienen stock suficiente en CD Quilicura y requerirán
                  traslado desde otras sucursales. Esto puede agregar 1-2 días al despacho.
                </p>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-2">
            <label className="text-xs font-medium text-neutral-700">
              Notas adicionales
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Instrucciones especiales, observaciones..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION FOOTER                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
        <Button
          variant="secondary"
          size="md"
          onClick={goPrev}
          disabled={step === 1}
          iconLeft={<ArrowLeft className="w-4 h-4" />}
        >
          Anterior
        </Button>

        {step < 4 ? (
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!isCurrentStepValid()}
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            loading={confirming}
            loadingText="Validando stock..."
            iconLeft={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirmar pedido
          </Button>
        )}
      </div>

      {/* ── Unsaved changes modal (ES-2) ─────────────────────────────────── */}
      <AlertModal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        icon={AlertTriangle}
        variant="warning"
        title="Cambios sin guardar"
        confirm={{
          label: "Salir sin guardar",
          onClick: confirmExit,
        }}
        cancelLabel="Seguir editando"
      >
        Si sales ahora, perderás los datos ingresados en el formulario.
      </AlertModal>

      {/* ── Toast notification ─────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/** Reusable labeled input field */
function FieldInput({
  label,
  required,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full h-9 px-3 border rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-colors ${
          error ? "border-red-400" : "border-neutral-300"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/** Reusable read-only summary field */
function SummaryField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-neutral-700">
        {label}
      </p>
      <p className="text-sm text-neutral-900 mt-0.5">{value}</p>
    </div>
  );
}
