"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  ChevronRight, AlertTriangle, User, Building2, Package, Search,
  Trash2, Plus, ShoppingCart, CheckCircle2, FileText, Sparkles,
  UserCircle, StickyNote, Truck, Calculator, MapPin,
} from "lucide-react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import { Card, CardContent } from "@/components/ui/card";
import ProductsModal, { type AddProduct } from "@/components/recepciones/ProductsModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientType = "b2c" | "b2b" | null;
type ViewMode = "actual" | "mejorada";

type ClientDataB2C = { nombre: string; email: string; telefono: string; direccion: string; region: string; comuna: string; complemento: string };
type ClientDataB2B = {
  razonSocial: string; rut: string; giro: string; direccionFiscal: string;
  nombreContacto: string; emailContacto: string; telefonoContacto: string; direccionEnvio: string; region: string; comuna: string; complemento: string;
};
type ProductItem = { id: string; nombre: string; sku: string; precioUnitario: number; cantidad: number };

function fmt(n: number) { return "$" + n.toLocaleString("es-CL"); }

// ─── Gate: requires sucursal + tienda ─────────────────────────────────────────
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
    window.addEventListener("amplifica-filter-change", check);
    return () => window.removeEventListener("amplifica-filter-change", check);
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

// ─── Address suggestions (mock Google Places-like) ──────────────────────────
type AddressSuggestion = { address: string; comuna: string; region: string; lat: number; lng: number };
const ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  { address: "Av. Providencia 1234", comuna: "Providencia", region: "Metropolitana", lat: -33.4260, lng: -70.6109 },
  { address: "Av. Las Condes 9876", comuna: "Las Condes", region: "Metropolitana", lat: -33.4080, lng: -70.5690 },
  { address: "Av. Quilicura 5432", comuna: "Quilicura", region: "Metropolitana", lat: -33.3590, lng: -70.7340 },
  { address: "Pasaje 2 El Peral", comuna: "Los Ángeles", region: "Biobío", lat: -37.4695, lng: -72.3536 },
  { address: "Calle San Martín 456", comuna: "Santiago", region: "Metropolitana", lat: -33.4489, lng: -70.6483 },
  { address: "Av. La Reina 2345", comuna: "La Reina", region: "Metropolitana", lat: -33.4454, lng: -70.5393 },
  { address: "Av. Vicuña Mackenna 6789", comuna: "Ñuñoa", region: "Metropolitana", lat: -33.4600, lng: -70.6100 },
  { address: "Av. Apoquindo 4321", comuna: "Las Condes", region: "Metropolitana", lat: -33.4100, lng: -70.5800 },
  { address: "Calle Valparaíso 123", comuna: "Valparaíso", region: "Valparaíso", lat: -33.0472, lng: -71.6127 },
  { address: "Av. Libertador Bernardo O'Higgins 1000", comuna: "Santiago", region: "Metropolitana", lat: -33.4400, lng: -70.6500 },
  { address: "Calle Temuco 567", comuna: "Temuco", region: "Araucanía", lat: -38.7359, lng: -72.5904 },
  { address: "Av. Lo Barnechea 890", comuna: "Lo Barnechea", region: "Metropolitana", lat: -33.3500, lng: -70.5200 },
];

// ─── Main Content ─────────────────────────────────────────────────────────────
function CrearPedidoContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("mejorada");
  const [clientType, setClientType] = useState<ClientType>(null);
  const [b2c, setB2c] = useState<ClientDataB2C>({ nombre: "", email: "", telefono: "", direccion: "", region: "", comuna: "", complemento: "" });
  const [b2b, setB2b] = useState<ClientDataB2B>({
    razonSocial: "", rut: "", giro: "", direccionFiscal: "",
    nombreContacto: "", emailContacto: "", telefonoContacto: "", direccionEnvio: "", region: "", comuna: "", complemento: "",
  });
  const [addressFocused, setAddressFocused] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [notas, setNotas] = useState("");
  const [configCanal, setConfigCanal] = useState("");
  const [configPago, setConfigPago] = useState("");
  const [configIdPedido, setConfigIdPedido] = useState("");
  const [configInfoAdicional, setConfigInfoAdicional] = useState("");
  const [configTipoEntrega, setConfigTipoEntrega] = useState("");
  const [configPaquete, setConfigPaquete] = useState("Caja Ultra Chica (10×10 ×10) - Peso: 1kg");
  // Shipping simulation
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [shipWeight, setShipWeight] = useState("");
  const [shipVolume, setShipVolume] = useState("");
  const [shipBultos, setShipBultos] = useState("1");
  const [shipManualCost, setShipManualCost] = useState("");
  const [shipSimulated, setShipSimulated] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState("domicilio");

  const COURIERS = [
    { id: "blue-express", label: "Blue Express", abbr: "BE" },
    { id: "fazt", label: "Fazt", abbr: "FZ" },
    { id: "pedidosya", label: "PedidosYa", abbr: "PY" },
    { id: "uber-direct", label: "Uber Direct", abbr: "UD" },
    { id: "chilexpress", label: "Chilexpress", abbr: "CX" },
  ];

  const totalAmount = products.reduce((s, p) => s + p.precioUnitario * p.cantidad, 0);
  const clientComplete = clientType === "b2c"
    ? !!(b2c.nombre && b2c.email && b2c.telefono && b2c.direccion)
    : clientType === "b2b"
    ? !!(b2b.razonSocial && b2b.rut && b2b.direccionFiscal && b2b.nombreContacto && b2b.emailContacto)
    : false;
  const hasAddress = clientType === "b2c" ? b2c.direccion.length > 3 : clientType === "b2b" ? b2b.direccionEnvio.length > 3 : false;
  const hasShippingCost = shipSimulated || !!shipManualCost;
  const canSimulate = hasAddress && products.length > 0;
  const canConfirm = clientComplete && products.length > 0 && hasShippingCost;

  const handleAddProducts = (added: AddProduct[]) => {
    setProducts(prev => {
      const next = [...prev];
      for (const a of added) {
        const existing = next.find(p => p.sku === a.sku);
        if (existing) { existing.cantidad += a.qty; }
        else { next.push({ id: a.sku, nombre: a.nombre, sku: a.sku, precioUnitario: 0, cantidad: a.qty }); }
      }
      return next;
    });
    setShowProductsModal(false);
  };

  const removeProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const updateQty = (id: string, qty: number) => setProducts(prev => prev.map(p => p.id === id ? { ...p, cantidad: Math.max(1, qty) } : p));
  const updatePrice = (id: string, price: number) => setProducts(prev => prev.map(p => p.id === id ? { ...p, precioUnitario: Math.max(0, price) } : p));

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
      {/* ProductsModal */}
      {showProductsModal && (
        <ProductsModal onClose={() => setShowProductsModal(false)} onAdd={handleAddProducts} />
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-1">
        <Link href="/pedidos" className="hover:text-primary-500 transition-colors">Pedidos</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Crear Pedido</span>
      </nav>

      {/* Title + toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Crear Pedido</h1>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 mt-2 w-fit">
            <button
              onClick={() => setViewMode("actual")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === "actual" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >Vista actual</button>
            <button
              onClick={() => setViewMode("mejorada")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === "mejorada" ? "bg-primary-50 text-primary-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Vista mejorada
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VISTA ACTUAL — replica la pantalla actual del sistema               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "actual" && (
        <div className="space-y-6">
          {/* Productos del Pedido */}
          <Card size="sm">
            <CardContent className="pt-4">
              <h2 className="text-base font-semibold text-neutral-900 mb-4">Productos del Pedido</h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <FormField label="Productos" as="input" value="" onChange={() => {}} placeholder="Busca por SKU, nombre o código de barras.." />
                </div>
                <Button variant="primary" iconLeft={<Search className="w-4 h-4" />} onClick={() => setShowProductsModal(true)}>
                  Buscar
                </Button>
              </div>
              {products.length === 0 ? (
                <p className="text-sm text-neutral-400 py-2">No hay productos para mostrar</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-xs text-neutral-500">Producto</th>
                      <th className="text-right py-2 text-xs text-neutral-500">Cant.</th>
                      <th className="text-right py-2 text-xs text-neutral-500">Precio</th>
                      <th className="text-right py-2 text-xs text-neutral-500">Total</th>
                      <th></th>
                    </tr></thead>
                    <tbody>{products.map(p => (
                      <tr key={p.id} className="border-b border-neutral-50">
                        <td className="py-2 text-neutral-800">{p.nombre} <span className="text-neutral-400 font-mono text-xs ml-1">{p.sku}</span></td>
                        <td className="py-2 text-right"><input type="number" min={1} value={p.cantidad} onChange={e => updateQty(p.id, parseInt(e.target.value) || 1)} className="w-14 text-center text-sm border rounded py-1 [appearance:textfield]" /></td>
                        <td className="py-2 text-right"><input type="number" min={0} value={p.precioUnitario} onChange={e => updatePrice(p.id, parseInt(e.target.value) || 0)} className="w-20 text-right text-sm border rounded py-1 px-1 [appearance:textfield]" /></td>
                        <td className="py-2 text-right font-medium">{fmt(p.precioUnitario * p.cantidad)}</td>
                        <td className="py-2 text-right"><button onClick={() => removeProduct(p.id)} className="text-neutral-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2-column: Config + Client */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración del Pedido */}
            <Card size="sm">
              <CardContent className="pt-4 space-y-4">
                <h2 className="text-base font-semibold text-neutral-900">Configuración del Pedido</h2>
                <div className="bg-teal-500 text-white rounded-lg px-4 py-3">
                  <p className="text-sm font-semibold">Cliente seleccionado: {tienda}</p>
                  <p className="text-xs opacity-80">Cliente definido por la sesión actual</p>
                </div>
                <FormField as="select" label="Canal de Venta" value={configCanal} onChange={v => setConfigCanal(v)}>
                  <option value="">Seleccione el canal de venta</option>
                  <option value="shopify">Shopify</option>
                  <option value="manual">Manual</option>
                </FormField>
                <FormField as="select" label="Método de Pago (opcional)" value={configPago} onChange={v => setConfigPago(v)}>
                  <option value="">Seleccione método de pago</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="credito">Crédito 30 días</option>
                </FormField>
                <FormField label="Identificador del Pedido" value={configIdPedido} onChange={v => setConfigIdPedido(v)} />
                <FormField as="textarea" label="Información Adicional" value={configInfoAdicional} onChange={v => setConfigInfoAdicional(v)} rows={3} />
              </CardContent>
            </Card>

            {/* Datos del Cliente */}
            <Card size="sm">
              <CardContent className="pt-4 space-y-4">
                <h2 className="text-base font-semibold text-neutral-900">Datos del Cliente</h2>
                <FormField label="Nombre del Destinatario" value={b2c.nombre} onChange={v => setB2c(p => ({ ...p, nombre: v }))} />
                <FormField label="Correo del Destinatario" type="email" value={b2c.email} onChange={v => setB2c(p => ({ ...p, email: v }))} />
                <FormField label="Teléfono del Destinatario" type="tel" value={b2c.telefono} onChange={v => setB2c(p => ({ ...p, telefono: v }))} />
                <FormField as="select" label="Tipo de Entrega" value={configTipoEntrega} onChange={v => setConfigTipoEntrega(v)}>
                  <option value="">Seleccione el tipo de entrega</option>
                  <option value="domicilio">Envío a domicilio</option>
                  <option value="retiro">Retiro en sucursal</option>
                </FormField>
                <FormField as="select" label="Paquete" value={configPaquete} onChange={v => setConfigPaquete(v)}>
                  <option value="Caja Ultra Chica (10×10 ×10) - Peso: 1kg">Caja Ultra Chica (10×10 ×10) - Peso: 1kg</option>
                  <option value="Caja Chica (20×20 ×20) - Peso: 3kg">Caja Chica (20×20 ×20) - Peso: 3kg</option>
                </FormField>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <Button variant="secondary" href="/pedidos">Cancelar</Button>
            <Button variant="primary" disabled={!canConfirm}>Crear Pedido</Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VISTA MEJORADA — CollapsibleCards, selector B2C/B2B, sidebar        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "mejorada" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* LEFT: Form sections */}
          <div className="space-y-5">
            {/* Step 1: Client type selector */}
            {!clientType && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Selecciona el tipo de cliente</h2>
                  <p className="text-sm text-neutral-500 mt-1">Elige el tipo de cliente para configurar el formulario correspondiente.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setClientType("b2c")} className="group text-left p-5 sm:p-6 rounded-2xl border-2 border-neutral-200 hover:border-primary-400 hover:shadow-md hover:shadow-primary-100/50 transition-all duration-200">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors"><User className="w-6 h-6 text-primary-500" /></div>
                      <div>
                        <span className="text-base font-bold text-neutral-900 block">Cliente B2C</span>
                        <span className="text-sm text-neutral-500">Para consumidores finales</span>
                      </div>
                    </div>
                    <ul className="space-y-1.5 ml-16">
                      <li className="flex items-center gap-2 text-sm text-neutral-500"><span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" /> Datos básicos del cliente</li>
                      <li className="flex items-center gap-2 text-sm text-neutral-500"><span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" /> Dirección de entrega</li>
                    </ul>
                  </button>
                  <button onClick={() => setClientType("b2b")} className="group text-left p-5 sm:p-6 rounded-2xl border-2 border-neutral-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100/50 transition-all duration-200">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors"><Building2 className="w-6 h-6 text-amber-600" /></div>
                      <div>
                        <span className="text-base font-bold text-neutral-900 block">Cliente B2B</span>
                        <span className="text-sm text-neutral-500">Para empresas y ventas corporativas</span>
                      </div>
                    </div>
                    <ul className="space-y-1.5 ml-16">
                      <li className="flex items-center gap-2 text-sm text-neutral-500"><span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" /> Datos de empresa completos</li>
                      <li className="flex items-center gap-2 text-sm text-neutral-500"><span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" /> Datos de contacto</li>
                      <li className="flex items-center gap-2 text-sm text-neutral-500"><span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" /> Dirección de entrega</li>
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
                description={clientType === "b2c" ? "Información del consumidor final" : "Empresa, contacto y dirección de envío"}
              >
                {clientType === "b2c" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><FormField label="Nombre completo" value={b2c.nombre} onChange={v => setB2c(p => ({ ...p, nombre: v }))} /></div>
                    <FormField label="Correo electrónico" type="email" value={b2c.email} onChange={v => setB2c(p => ({ ...p, email: v }))} />
                    <FormField label="Teléfono" type="tel" value={b2c.telefono} onChange={v => setB2c(p => ({ ...p, telefono: v }))} />
                    {/* Predictive address input */}
                    <div className="sm:col-span-2 relative">
                      <div onFocus={() => setAddressFocused(true)} onBlur={() => setTimeout(() => setAddressFocused(false), 200)}>
                        <FormField
                          label="Dirección de entrega"
                          value={b2c.direccion}
                          onChange={v => { setB2c(p => ({ ...p, direccion: v, region: "", comuna: "" })); setSelectedCoords(null); setAddressFocused(true); }}
                        />
                      </div>
                      {/* Suggestions dropdown */}
                      {addressFocused && b2c.direccion.length > 1 && !b2c.region && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-[240px] overflow-y-auto">
                          {ADDRESS_SUGGESTIONS.filter(s => s.address.toLowerCase().includes(b2c.direccion.toLowerCase()) || s.comuna.toLowerCase().includes(b2c.direccion.toLowerCase())).slice(0, 5).map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors flex items-start gap-3 border-b border-neutral-50 last:border-0"
                              onMouseDown={() => {
                                setB2c(p => ({ ...p, direccion: s.address, region: s.region, comuna: s.comuna }));
                                setSelectedCoords({ lat: s.lat, lng: s.lng });
                                setAddressFocused(false);
                              }}
                            >
                              <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm text-neutral-800">{s.address}</p>
                                <p className="text-[10px] text-neutral-500">{s.comuna}, {s.region}</p>
                              </div>
                            </button>
                          ))}
                          {ADDRESS_SUGGESTIONS.filter(s => s.address.toLowerCase().includes(b2c.direccion.toLowerCase()) || s.comuna.toLowerCase().includes(b2c.direccion.toLowerCase())).length === 0 && (
                            <p className="px-4 py-3 text-sm text-neutral-400 text-center">Sin resultados para &quot;{b2c.direccion}&quot;</p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Auto-filled region + comuna + complemento */}
                    {b2c.region && (
                      <>
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">Región</p>
                          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-green-800">{b2c.region}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">Comuna</p>
                          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-green-800">{b2c.comuna}</p>
                          </div>
                        </div>
                        <div className="sm:col-span-2"><FormField label="Complemento (depto, piso, oficina)" value={b2c.complemento} onChange={v => setB2c(p => ({ ...p, complemento: v }))} /></div>
                        {/* Map with coordinates */}
                        {selectedCoords && (
                          <div className="sm:col-span-2 rounded-lg overflow-hidden border border-neutral-200">
                            <div className="bg-neutral-100 h-32 flex items-center justify-center relative">
                              <div className="relative text-center">
                                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center mx-auto mb-1 shadow-lg">
                                  <MapPin className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs text-neutral-600 font-medium">{b2c.direccion}, {b2c.comuna}</p>
                                <p className="text-[10px] text-neutral-400">{selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Razón social" value={b2b.razonSocial} onChange={v => setB2b(p => ({ ...p, razonSocial: v }))} />
                      <FormField label="RUT" value={b2b.rut} onChange={v => setB2b(p => ({ ...p, rut: v }))} />
                      <FormField label="Giro" value={b2b.giro} onChange={v => setB2b(p => ({ ...p, giro: v }))} />
                      <FormField label="Dirección fiscal" value={b2b.direccionFiscal} onChange={v => setB2b(p => ({ ...p, direccionFiscal: v }))} />
                    </div>
                    <div className="border-t border-neutral-100 pt-4">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Datos de contacto</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Nombre completo" value={b2b.nombreContacto} onChange={v => setB2b(p => ({ ...p, nombreContacto: v }))} />
                        <FormField label="Correo electrónico" type="email" value={b2b.emailContacto} onChange={v => setB2b(p => ({ ...p, emailContacto: v }))} />
                        <FormField label="Teléfono" type="tel" value={b2b.telefonoContacto} onChange={v => setB2b(p => ({ ...p, telefonoContacto: v }))} />
                        <div className="sm:col-span-2"><FormField label="Dirección de envío" value={b2b.direccionEnvio} onChange={v => setB2b(p => ({ ...p, direccionEnvio: v }))} /></div>
                        {b2b.direccionEnvio.length > 3 && (
                          <>
                            <FormField as="select" label="Región" value={b2b.region} onChange={v => setB2b(p => ({ ...p, region: v }))}>
                              <option value="">Seleccionar región</option>
                              <option value="Metropolitana">Región Metropolitana</option>
                              <option value="Valparaíso">Valparaíso</option>
                              <option value="Biobío">Biobío</option>
                            </FormField>
                            <FormField as="select" label="Comuna" value={b2b.comuna} onChange={v => setB2b(p => ({ ...p, comuna: v }))}>
                              <option value="">Seleccionar comuna</option>
                              <option value="Santiago">Santiago</option>
                              <option value="Providencia">Providencia</option>
                              <option value="Las Condes">Las Condes</option>
                              <option value="Quilicura">Quilicura</option>
                            </FormField>
                            <div className="sm:col-span-2"><FormField label="Complemento (depto, piso, oficina)" value={b2b.complemento} onChange={v => setB2b(p => ({ ...p, complemento: v }))} /></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <button onClick={() => setClientType(null)} className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors">Cambiar tipo de cliente</button>
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
                {/* Search trigger → opens modal */}
                <button
                  onClick={() => setShowProductsModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-400 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-neutral-50 transition-all mb-3"
                >
                  <Search className="w-4 h-4" />
                  Buscar por nombre o SKU...
                </button>

                {products.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Busca y agrega productos al pedido</p>
                  </div>
                ) : clientType === "b2b" ? (
                  /* B2B: full table with Desc%, IVA, Subtotal */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                          <th className="text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3">Producto</th>
                          <th className="text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3">Cantidad</th>
                          <th className="text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3">Precio Unit.</th>
                          <th className="text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3">Desc. %</th>
                          <th className="text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3">IVA</th>
                          <th className="text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3">Subtotal</th>
                          <th className="py-2.5 px-2 w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {products.map(p => {
                          const subtotal = p.precioUnitario * p.cantidad;
                          return (
                            <tr key={p.id} className="hover:bg-neutral-50/60">
                              <td className="py-3 px-3">
                                <p className="text-sm font-medium text-neutral-800">{p.nombre}</p>
                                <p className="text-[10px] text-neutral-400">{p.sku}</p>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => updateQty(p.id, Math.max(1, p.cantidad - 1))} className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100">−</button>
                                  <input type="number" min={1} value={p.cantidad} onChange={e => updateQty(p.id, parseInt(e.target.value) || 1)} className="w-10 text-center text-sm border border-neutral-200 rounded py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                  <button onClick={() => updateQty(p.id, p.cantidad + 1)} className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100">+</button>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center justify-end gap-0.5">
                                  <span className="text-neutral-400 text-xs">$</span>
                                  <input type="number" min={0} value={p.precioUnitario} onChange={e => updatePrice(p.id, parseInt(e.target.value) || 0)} className="w-20 text-right text-sm border border-neutral-200 rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center justify-center gap-0.5">
                                  <input type="number" min={0} max={100} defaultValue={0} className="w-12 text-center text-sm border border-neutral-200 rounded py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                  <span className="text-neutral-400 text-xs">%</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 font-medium">19%</span>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-neutral-900 tabular-nums">{fmt(subtotal)}</td>
                              <td className="py-3 px-2">
                                <button onClick={() => removeProduct(p.id)} className="text-neutral-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* B2C: simple list */
                  <div className="divide-y divide-neutral-100">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-800 truncate">{p.nombre}</p>
                          <p className="text-[10px] text-neutral-400">{p.sku}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => updateQty(p.id, Math.max(1, p.cantidad - 1))} className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100">−</button>
                          <input type="number" min={1} value={p.cantidad} onChange={e => updateQty(p.id, parseInt(e.target.value) || 1)} className="w-12 text-center text-sm border border-neutral-200 rounded py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button onClick={() => updateQty(p.id, p.cantidad + 1)} className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100">+</button>
                          <span className="text-xs text-neutral-400 mx-1">×</span>
                          <input type="number" min={0} value={p.precioUnitario} onChange={e => updatePrice(p.id, parseInt(e.target.value) || 0)} className="w-24 text-right text-sm border border-neutral-200 rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <span className="text-sm font-semibold text-neutral-900 w-24 text-right tabular-nums">{fmt(p.precioUnitario * p.cantidad)}</span>
                        <button onClick={() => removeProduct(p.id)} className="text-neutral-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Total row */}
                {products.length > 0 && (
                  <div className="flex items-center justify-end gap-4 pt-3 mt-1 border-t border-neutral-200">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</span>
                    <span className="text-base font-bold text-neutral-900 tabular-nums">{fmt(totalAmount)}</span>
                  </div>
                )}
              </CollapsibleCard>
            )}

            {/* Shipping config */}
            {clientType && (
              <CollapsibleCard icon={Truck} title="Datos de Envío" description="Configura el tipo y destino de envío">
                <div className="space-y-4">
                  <FormField as="select" label="Tipo de Envío" value={tipoEnvio} onChange={v => setTipoEnvio(v)}>
                    <option value="domicilio">Envío a Domicilio</option>
                    <option value="retiro">Retiro en Sucursal</option>
                    <option value="despues">Elegir después</option>
                  </FormField>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-200" />
                      <span className="text-sm text-neutral-700">Empacar cada SKU por separado</span>
                    </label>
                  </div>
                </div>
              </CollapsibleCard>
            )}

            {/* Shipping simulation */}
            {clientType && (
              <CollapsibleCard icon={Calculator} title="Simulación de Envío" description="Elige courier y simula el costo de envío">
                <div className="space-y-4">
                  {/* Courier chips */}
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Courier</p>
                    <div className="flex flex-wrap gap-2">
                      {COURIERS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCourier(selectedCourier === c.id ? null : c.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                            selectedCourier === c.id
                              ? "border-primary-300 bg-primary-50 text-primary-700"
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          <span className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500">{c.abbr}</span>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Weight / Volume / Bultos */}
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Peso (kg)" type="number" value={shipWeight} onChange={v => setShipWeight(v)} />
                    <FormField label="Volumen (m³)" type="number" value={shipVolume} onChange={v => setShipVolume(v)} />
                    <FormField label="N° bultos" type="number" value={shipBultos} onChange={v => setShipBultos(v)} />
                  </div>
                  {/* Simulate button */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!selectedCourier || !canSimulate}
                      iconLeft={<Calculator className="w-4 h-4" />}
                      onClick={() => setShipSimulated(true)}
                    >
                      Simular Costo de Envío
                    </Button>
                    {!canSimulate && <p className="text-xs text-neutral-400">{!hasAddress && !products.length ? "Ingresa dirección y agrega productos" : !hasAddress ? "Ingresa una dirección primero" : "Agrega al menos 1 producto"}</p>}
                  </div>
                  {shipSimulated && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-semibold text-green-700">Costo estimado: $4.990</p>
                      <p className="text-xs text-green-600 mt-0.5">{COURIERS.find(c => c.id === selectedCourier)?.label} · 2-3 días hábiles</p>
                    </div>
                  )}
                  {/* Manual cost */}
                  <div className="border-t border-neutral-100 pt-3">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">O ingresa manualmente</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">$</span>
                      <input
                        type="number"
                        value={shipManualCost}
                        onChange={e => setShipManualCost(e.target.value)}
                        placeholder="0"
                        className="w-32 text-sm border border-neutral-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleCard>
            )}

            {/* Notes */}
            {clientType && (
              <CollapsibleCard icon={StickyNote} title="Notas del Pedido" description="Indicaciones adicionales" defaultOpen={false}>
                <div className="relative">
                  <textarea value={notas} onChange={e => setNotas(e.target.value.slice(0, 1000))} placeholder="Indicaciones especiales, instrucciones de entrega..." rows={3} className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 resize-none transition-all" />
                  <span className="absolute bottom-2 right-3 text-[10px] text-neutral-400">{notas.length}/1000</span>
                </div>
              </CollapsibleCard>
            )}
          </div>

          {/* RIGHT: Summary sidebar */}
          <div className="lg:sticky lg:top-4 space-y-4 h-fit">
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-neutral-900 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Resumen del Pedido</h2>
                    <p className="text-[10px] text-neutral-400">{sucursal} · {tienda}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Client info */}
                {clientType && clientComplete && (
                  <div className="space-y-1.5 pb-4 border-b border-neutral-100">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Cliente {clientType.toUpperCase()}</p>
                    {clientType === "b2c" ? (
                      <><p className="text-sm text-neutral-800 font-medium">{b2c.nombre}</p><p className="text-xs text-neutral-500">{b2c.email} · {b2c.telefono}</p><p className="text-xs text-neutral-500">{b2c.direccion}</p></>
                    ) : (
                      <><p className="text-sm text-neutral-800 font-medium">{b2b.razonSocial}</p><p className="text-xs text-neutral-500">RUT: {b2b.rut} · {b2b.giro}</p><p className="text-xs text-neutral-500">{b2b.direccionEnvio || b2b.direccionFiscal}</p></>
                    )}
                  </div>
                )}

                {/* Products */}
                {products.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Productos</p>
                    {products.map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="text-xs text-neutral-700 truncate">{p.nombre}</p>
                          <p className="text-[10px] text-neutral-400">{p.sku} · ×{p.cantidad}</p>
                        </div>
                        <span className="text-xs font-semibold text-neutral-900 tabular-nums flex-shrink-0">{fmt(p.precioUnitario * p.cantidad)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-200">
                      <span className="text-sm font-semibold text-neutral-700">Total</span>
                      <span className="text-lg font-bold text-neutral-900 tabular-nums">{fmt(totalAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-500 font-medium">Sin productos</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Agrega productos para ver el resumen</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <Button variant="primary" size="lg" className="w-full" disabled={!canConfirm} iconLeft={<CheckCircle2 className="w-4 h-4" />}>Confirmar Pedido</Button>

            {!canConfirm && (
              <div className="bg-neutral-50 rounded-lg px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Requisitos pendientes</p>
                {!clientComplete && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /></span>
                    Completar datos del cliente
                  </div>
                )}
                {products.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /></span>
                    Agregar al menos un producto
                  </div>
                )}
                {!hasShippingCost && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /></span>
                    Cotizar o ingresar costo de envío
                  </div>
                )}
              </div>
            )}

            <Button variant="secondary" size="lg" className="w-full" iconLeft={<FileText className="w-4 h-4" />}>Guardar como Borrador</Button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
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
