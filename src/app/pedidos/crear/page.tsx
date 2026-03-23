"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, AlertTriangle, User, Building2, Package, Search,
  Trash2, Plus, ShoppingCart, CheckCircle2, FileText, Sparkles,
  ClipboardList, UserCircle, Truck, StickyNote, Calculator,
} from "lucide-react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientType = "b2c" | "b2b" | null;

type ClientDataB2C = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
};

type ClientDataB2B = {
  razonSocial: string;
  rut: string;
  giro: string;
  direccionFiscal: string;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string;
  direccionEnvio: string;
};

type ProductItem = {
  id: string;
  nombre: string;
  sku: string;
  precioUnitario: number;
  cantidad: number;
};

// ─── Mock products for search ─────────────────────────────────────────────────
const MOCK_CATALOG: Omit<ProductItem, "cantidad">[] = [
  { id: "p1", nombre: "Zapatillas 1000R", sku: "ZAP-1000R", precioUnitario: 89990 },
  { id: "p2", nombre: "Zapatillas 500T", sku: "ZAP-500T", precioUnitario: 109990 },
  { id: "p3", nombre: "Zapatillas 4000V", sku: "ZAP-4000V", precioUnitario: 179990 },
  { id: "p4", nombre: "Polera Running Pro", sku: "POL-RUN01", precioUnitario: 34990 },
  { id: "p5", nombre: "Short Training Elite", sku: "SHT-ELI01", precioUnitario: 29990 },
  { id: "p6", nombre: "Mochila Sport 30L", sku: "MOC-SP30", precioUnitario: 49990 },
  { id: "p7", nombre: "Calcetines Pack x3", sku: "CAL-PK3", precioUnitario: 12990 },
  { id: "p8", nombre: "Gorra UV Protection", sku: "GOR-UV01", precioUnitario: 19990 },
];

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

// ─── Gate Component ───────────────────────────────────────────────────────────
function FilterGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  const check = useCallback(() => {
    const m: string[] = [];
    if (!localStorage.getItem("amplifica_filter_sucursal")) m.push("sucursal");
    if (!localStorage.getItem("amplifica_filter_seller")) m.push("tienda");
    setMissing(m);
    setReady(m.length === 0);
  }, []);

  useEffect(() => {
    check();
    const handler = () => check();
    window.addEventListener("amplifica-filter-change", handler);
    return () => window.removeEventListener("amplifica-filter-change", handler);
  }, [check]);

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 mb-2">Selección requerida</h2>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Para crear un pedido necesitas seleccionar una <strong>{missing.join(" y ")}</strong> en el menú lateral.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function CrearPedidoContent() {
  const router = useRouter();

  // Form state
  const [clientType, setClientType] = useState<ClientType>(null);
  const [b2c, setB2c] = useState<ClientDataB2C>({ nombre: "", email: "", telefono: "", direccion: "" });
  const [b2b, setB2b] = useState<ClientDataB2B>({
    razonSocial: "", rut: "", giro: "", direccionFiscal: "",
    nombreContacto: "", emailContacto: "", telefonoContacto: "", direccionEnvio: "",
  });
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [notas, setNotas] = useState("");

  // Computed
  const totalProducts = products.reduce((s, p) => s + p.cantidad, 0);
  const totalAmount = products.reduce((s, p) => s + p.precioUnitario * p.cantidad, 0);

  const clientComplete = clientType === "b2c"
    ? !!(b2c.nombre && b2c.email && b2c.telefono && b2c.direccion)
    : clientType === "b2b"
    ? !!(b2b.razonSocial && b2b.rut && b2b.direccionFiscal && b2b.nombreContacto && b2b.emailContacto)
    : false;

  const canConfirm = clientComplete && products.length > 0;

  // Product actions
  const addProduct = (catalog: typeof MOCK_CATALOG[number]) => {
    setProducts(prev => {
      const existing = prev.find(p => p.id === catalog.id);
      if (existing) return prev.map(p => p.id === catalog.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { ...catalog, cantidad: 1 }];
    });
    setProductSearch("");
    setShowCatalog(false);
  };

  const removeProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  const updateQty = (id: string, qty: number) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, cantidad: Math.max(1, qty) } : p));

  const updatePrice = (id: string, price: number) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, precioUnitario: Math.max(0, price) } : p));

  // Search results
  const catalogResults = productSearch.length >= 2
    ? MOCK_CATALOG.filter(p =>
        p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
      ).filter(p => !products.some(pp => pp.id === p.id))
    : [];

  // Read sidebar filters
  const [sucursal, setSucursal] = useState("");
  const [tienda, setTienda] = useState("");
  useEffect(() => {
    const read = () => {
      setSucursal(localStorage.getItem("amplifica_filter_sucursal") || "");
      setTienda(localStorage.getItem("amplifica_filter_seller") || "");
    };
    read();
    window.addEventListener("amplifica-filter-change", read);
    return () => window.removeEventListener("amplifica-filter-change", read);
  }, []);

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-1">
        <Link href="/pedidos" className="hover:text-primary-500 transition-colors">Pedidos</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Crear Pedido</span>
      </nav>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Crear Pedido</h1>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ── LEFT: Form sections ── */}
        <div className="space-y-5">

          {/* Step 1: Client type selector */}
          {!clientType && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">Selecciona el tipo de cliente para comenzar.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* B2C Card */}
                <button
                  onClick={() => setClientType("b2c")}
                  className="group text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900">Cliente B2C</span>
                  </div>
                  <p className="text-xs text-neutral-500">Para consumidores finales.</p>
                  <ul className="mt-2 space-y-0.5">
                    <li className="text-[10px] text-neutral-400">• Datos básicos del cliente</li>
                    <li className="text-[10px] text-neutral-400">• Dirección de entrega</li>
                  </ul>
                </button>

                {/* B2B Card */}
                <button
                  onClick={() => setClientType("b2b")}
                  className="group text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900">Cliente B2B</span>
                  </div>
                  <p className="text-xs text-neutral-500">Para empresas y ventas corporativas.</p>
                  <ul className="mt-2 space-y-0.5">
                    <li className="text-[10px] text-neutral-400">• Datos de empresa completos</li>
                    <li className="text-[10px] text-neutral-400">• Datos de contacto</li>
                    <li className="text-[10px] text-neutral-400">• Dirección de entrega</li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Client data */}
          {clientType && (
            <CollapsibleCard
              icon={clientType === "b2c" ? UserCircle : Building2}
              title={clientType === "b2c" ? "Datos del Cliente" : "Datos de la Empresa"}
              description={clientType === "b2c" ? "Información del consumidor final" : "Ingresa la información de la empresa, contacto y dirección de envío"}
            >
              {clientType === "b2c" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Nombre completo" value={b2c.nombre} onChange={v => setB2c(p => ({ ...p, nombre: v }))} />
                  </div>
                  <FormField label="Correo electrónico" type="email" value={b2c.email} onChange={v => setB2c(p => ({ ...p, email: v }))} />
                  <FormField label="Teléfono" type="tel" value={b2c.telefono} onChange={v => setB2c(p => ({ ...p, telefono: v }))} />
                  <div className="sm:col-span-2">
                    <FormField label="Dirección de entrega" value={b2c.direccion} onChange={v => setB2c(p => ({ ...p, direccion: v }))} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Company data */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Razón social" value={b2b.razonSocial} onChange={v => setB2b(p => ({ ...p, razonSocial: v }))} />
                    <FormField label="RUT" value={b2b.rut} onChange={v => setB2b(p => ({ ...p, rut: v }))} />
                    <FormField label="Giro" value={b2b.giro} onChange={v => setB2b(p => ({ ...p, giro: v }))} />
                    <FormField label="Dirección fiscal" value={b2b.direccionFiscal} onChange={v => setB2b(p => ({ ...p, direccionFiscal: v }))} />
                  </div>
                  {/* Contact */}
                  <div className="border-t border-neutral-100 pt-4">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Datos de contacto</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Nombre completo" value={b2b.nombreContacto} onChange={v => setB2b(p => ({ ...p, nombreContacto: v }))} />
                      <FormField label="Correo electrónico" type="email" value={b2b.emailContacto} onChange={v => setB2b(p => ({ ...p, emailContacto: v }))} />
                      <FormField label="Teléfono" type="tel" value={b2b.telefonoContacto} onChange={v => setB2b(p => ({ ...p, telefonoContacto: v }))} />
                      <FormField label="Dirección de envío" value={b2b.direccionEnvio} onChange={v => setB2b(p => ({ ...p, direccionEnvio: v }))} />
                    </div>
                  </div>
                </div>
              )}
              {/* Change client type */}
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <button onClick={() => setClientType(null)} className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors">
                  Cambiar tipo de cliente
                </button>
              </div>
            </CollapsibleCard>
          )}

          {/* Step 3: Products */}
          {clientType && (
            <CollapsibleCard
              icon={Package}
              title="Productos del Pedido"
              description={products.length > 0 ? `${products.length} producto${products.length !== 1 ? "s" : ""} · ${fmt(totalAmount)}` : "Agrega los productos al pedido"}
            >
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o SKU..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowCatalog(true); }}
                  onFocus={() => setShowCatalog(true)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                />
                {/* Dropdown results */}
                {showCatalog && catalogResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {catalogResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 text-left transition-colors"
                      >
                        <div>
                          <p className="text-sm text-neutral-800 font-medium">{p.nombre}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">{p.sku}</p>
                        </div>
                        <span className="text-xs text-neutral-500">{fmt(p.precioUnitario)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product list */}
              {products.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Busca y agrega productos al pedido</p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-neutral-100">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800 truncate">{p.nombre}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{p.sku}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={p.cantidad}
                          onChange={e => updateQty(p.id, parseInt(e.target.value) || 1)}
                          className="w-14 text-center text-sm border border-neutral-200 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-xs text-neutral-400">×</span>
                        <input
                          type="number"
                          min={0}
                          value={p.precioUnitario}
                          onChange={e => updatePrice(p.id, parseInt(e.target.value) || 0)}
                          className="w-24 text-right text-sm border border-neutral-200 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 w-24 text-right tabular-nums">{fmt(p.precioUnitario * p.cantidad)}</span>
                      <button onClick={() => removeProduct(p.id)} className="text-neutral-300 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Total row */}
                  <div className="flex items-center justify-end gap-4 pt-3">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</span>
                    <span className="text-base font-bold text-neutral-900 tabular-nums">{fmt(totalAmount)}</span>
                  </div>
                </div>
              )}
            </CollapsibleCard>
          )}

          {/* Notes */}
          {clientType && (
            <CollapsibleCard icon={StickyNote} title="Notas del Pedido" description="Indicaciones adicionales" defaultOpen={false}>
              <div className="relative">
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value.slice(0, 1000))}
                  placeholder="Indicaciones especiales, instrucciones de entrega..."
                  rows={3}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 resize-none transition-all"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-neutral-400">{notas.length}/1000</span>
              </div>
            </CollapsibleCard>
          )}
        </div>

        {/* ── RIGHT: Summary sidebar ── */}
        <div className="lg:sticky lg:top-4 space-y-4 h-fit">
          <Card size="sm" className="border-primary-100 bg-primary-50/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4 text-primary-500" />
                <h2 className="text-sm font-bold text-neutral-900">Resumen del Pedido</h2>
              </div>

              {/* Client info */}
              {clientType && clientComplete && (
                <div className="space-y-1.5 mb-4 pb-4 border-b border-neutral-100">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Cliente {clientType.toUpperCase()}</p>
                  {clientType === "b2c" ? (
                    <>
                      <p className="text-xs text-neutral-700 font-medium">{b2c.nombre}</p>
                      <p className="text-[10px] text-neutral-500">{b2c.email}</p>
                      <p className="text-[10px] text-neutral-500">{b2c.direccion}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-neutral-700 font-medium">{b2b.razonSocial}</p>
                      <p className="text-[10px] text-neutral-500">RUT: {b2b.rut}</p>
                      <p className="text-[10px] text-neutral-500">{b2b.direccionEnvio || b2b.direccionFiscal}</p>
                    </>
                  )}
                </div>
              )}

              {/* Products summary */}
              {products.length > 0 ? (
                <div className="space-y-2 mb-4">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Productos</p>
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-700 truncate mr-2">{p.nombre} <span className="text-neutral-400">×{p.cantidad}</span></span>
                      <span className="text-neutral-900 font-medium tabular-nums flex-shrink-0">{fmt(p.precioUnitario * p.cantidad)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                    <span className="text-xs font-semibold text-neutral-700">Total del pedido</span>
                    <span className="text-base font-bold text-neutral-900 tabular-nums">{fmt(totalAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center mb-4">
                  <Package className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">Agrega productos para ver el resumen</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTAs */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!canConfirm}
            iconLeft={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirmar Pedido
          </Button>

          {!canConfirm && (
            <ul className="space-y-1">
              {!clientComplete && <li className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /> Completar datos del cliente</li>}
              {products.length === 0 && <li className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /> Agregar al menos un producto</li>}
            </ul>
          )}

          <Button variant="secondary" size="lg" className="w-full" iconLeft={<FileText className="w-4 h-4" />}>
            Guardar como Borrador
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Export with Suspense ─────────────────────────────────────────────────────
export default function CrearPedidoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-8">
      <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Cargando...</div>}>
        <FilterGate>
          <CrearPedidoContent />
        </FilterGate>
      </Suspense>
    </div>
  );
}
