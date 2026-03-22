"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Copy, Check, LayoutDashboard, Truck, Package, Clock,
  AlertTriangle, Timer, Zap, CopyPlus, Share2, MessageCircle,
  Ban, Eye, Pencil, MapPin, Phone, Mail, ExternalLink,
  ChevronDown, ChevronUp, BellOff, BellRing, CheckCircle2,
  User, Plus, RefreshCw, StickyNote, Monitor, Smartphone, X,
} from "lucide-react";

import { PEDIDOS, MOCK_PEDIDO_DETALLE } from "@/app/pedidos/_data";
import type { PedidoDetalle, DireccionEnvio } from "@/app/pedidos/_data";

import PedidoStatusBadge from "@/components/pedidos/PedidoStatusBadge";
import EnvioStatusBadge from "@/components/pedidos/EnvioStatusBadge";
import PedidoTimeline from "@/components/pedidos/PedidoTimeline";
import type { TimelineStep } from "@/components/pedidos/PedidoTimeline";
import AlertBanner from "@/components/pedidos/AlertBanner";
import GanttTimeline from "@/components/pedidos/GanttTimeline";
import SupportCompactModal from "@/components/pedidos/SupportCompactModal";
import QuickActionsMenu from "@/components/pedidos/QuickActionsMenu";
import StickyActionBar, { DirtyBanner } from "@/components/pedidos/StickyActionBar";
import OrderEconomyCard from "@/components/pedidos/OrderEconomyCard";
import CourierInfoCard from "@/components/pedidos/CourierInfoCard";
import AlertModal from "@/components/ui/AlertModal";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import CollapsibleCard from "@/components/ui/CollapsibleCard";

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "resumen", label: "Resumen", icon: LayoutDashboard },
  { key: "envio", label: "Envío", icon: Truck },
  { key: "productos", label: "Productos", icon: Package },
  { key: "historial", label: "Historial", icon: Clock },
] as const;
type TabKey = typeof TABS[number]["key"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CopyId({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
      }}
      className="text-neutral-400 hover:text-neutral-600 transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) + " " + date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

function fmtShortDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function fmtShortTime(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return d; }
}

function buildTimelineSteps(p: PedidoDetalle): TimelineStep[] {
  const stateOrder = ["Pendiente", "Validado", "En preparación", "Empacado", "Listo para retiro", "Entregado"];
  const stateLabels = ["Recepción", "Validación", "Preparación", "Empaque", "Retiro", "Entrega"];
  const currentIdx = stateOrder.indexOf(
    p.estadoPreparacion === "Por empacar" ? "En preparación" :
    p.estadoPreparacion === "Con atraso" ? "En preparación" :
    p.estadoPreparacion === "Cancelado" ? "Pendiente" :
    p.estadoPreparacion
  );

  return stateLabels.map((label, i) => {
    let status: TimelineStep["status"] = "pending";
    if (p.estadoPreparacion === "Cancelado") {
      status = i === 0 ? "done" : "pending";
    } else if (i < currentIdx) {
      status = "done";
    } else if (i === currentIdx) {
      status = p.conAtraso ? "late" : "active";
    }

    // Build fecha lines and SLA from slaTimeline data
    const slaData = p.slaTimeline?.[label];
    let fechaLineas: string[] | undefined;
    let sla: TimelineStep["sla"] | undefined;

    if (slaData) {
      const lines: string[] = [];

      if (slaData.fechaInicio && slaData.fechaFin && (status === "done" || status === "active")) {
        // Completed or active with start/end: show both
        lines.push(`${fmtShortDate(slaData.fechaInicio)} ${fmtShortTime(slaData.fechaInicio)}`);
        lines.push(`/ ${fmtShortDate(slaData.fechaFin)} ${fmtShortTime(slaData.fechaFin)}`);
      } else if (slaData.fechaInicio && (status === "done" || status === "active")) {
        lines.push(`${fmtShortDate(slaData.fechaInicio)} ${fmtShortTime(slaData.fechaInicio)}`);
      } else if (slaData.fechaProgramada) {
        // Pending/active: show scheduled date
        if (slaData.rangoHorario) {
          lines.push(fmtShortDate(slaData.fechaProgramada));
          lines.push(slaData.rangoHorario);
        } else if (slaData.fechaFin) {
          lines.push(`${fmtShortDate(slaData.fechaProgramada)} ${fmtShortTime(slaData.fechaProgramada)}`);
          lines.push(`/ ${fmtShortDate(slaData.fechaFin)} ${fmtShortTime(slaData.fechaFin)}`);
        } else {
          lines.push(fmtShortDate(slaData.fechaProgramada));
          lines.push(`${fmtShortTime(slaData.fechaProgramada)} hrs`);
        }
      }

      if (lines.length > 0) fechaLineas = lines;
      sla = { status: slaData.slaStatus };
    }

    return { label, status, fechaLineas, sla };
  });
}

// ─── Collapsible section ─────────────────────────────────────────────────────
function Collapsible({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-100 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors rounded-lg"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Main page content (wrapped in Suspense at export) ───────────────────────
function PedidoDetalleContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(params.id);

  // Resolve pedido data
  const pedido = useMemo<PedidoDetalle | null>(() => {
    if (MOCK_PEDIDO_DETALLE[id]) return MOCK_PEDIDO_DETALLE[id];
    const base = PEDIDOS.find(p => p.id === id);
    if (!base) return null;
    // Fallback: create a minimal PedidoDetalle from listing data
    return {
      ...base,
      destinatario: { nombre: "—", telefono: "—", email: "—", calle: "—", numero: "—", comuna: "—", ciudad: "—", region: "—" },
      cotizacion: null,
      productos: [],
      timeline: [],
      incidencias: [],
      notificaciones: [],
      paquete: "—",
      volumenTotal: "—",
      montoTotal: 0,
      esOrdenMuerta: false,
      pickingBottleneck: false,
      requiereRecotizacion: false,
    };
  }, [id]);

  // Tab state
  const initialTab = (searchParams.get("tab") as TabKey) || "resumen";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const switchTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Address edit state
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState<DireccionEnvio | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [requiresRequote, setRequiresRequote] = useState(false);

  // Modals
  const [supportOpen, setSupportOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ html: string; asunto: string } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Keyboard shortcut: Ctrl+Shift+R for support modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setSupportOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500">Pedido no encontrado</p>
        <Button variant="secondary" onClick={() => router.push("/pedidos")}>Volver a pedidos</Button>
      </div>
    );
  }

  const timelineSteps = buildTimelineSteps(pedido);

  // Quick actions
  const quickActions = [
    { label: "Duplicar pedido", icon: CopyPlus, onClick: () => alert("Duplicar pedido (mock)") },
    ...(pedido.cotizacion?.trackingNumber ? [{ label: "Compartir tracking", icon: Share2, onClick: () => alert("Link copiado (mock)") }] : []),
    ...(pedido.destinatario.email !== "—" ? [{ label: "Contactar cliente", icon: MessageCircle, onClick: () => alert("Abrir Intercom (mock)") }] : []),
    { label: "Cancelar pedido", icon: Ban, onClick: () => setCancelOpen(true), danger: true },
  ];

  // Address editing handlers
  const startEditAddress = () => {
    setEditingAddress(true);
    setAddressDraft({ ...pedido.destinatario });
  };

  const handleAddressChange = (field: keyof DireccionEnvio, value: string) => {
    if (!addressDraft) return;
    setAddressDraft({ ...addressDraft, [field]: value });
    setIsDirty(true);
    setRequiresRequote(true);
  };

  const discardChanges = () => {
    setEditingAddress(false);
    setAddressDraft(null);
    setIsDirty(false);
    setRequiresRequote(false);
  };

  const saveChanges = () => {
    // Mock save — address saved, but requote stays until courier is re-quoted
    setEditingAddress(false);
    setAddressDraft(null);
    setIsDirty(false);
    // requiresRequote stays true — courier still needs re-quoting
  };

  const addr = editingAddress && addressDraft ? addressDraft : pedido.destinatario;

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-32 lg:pb-6 space-y-4 sm:space-y-5">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/pedidos" className="hover:text-primary-500 transition-colors duration-300">Pedidos</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">{pedido.idAmplifica}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
              Pedido <span className="font-mono">{pedido.idAmplifica}</span>
              <CopyId text={pedido.idAmplifica} />
            </h1>
            <PedidoStatusBadge status={pedido.estadoPreparacion} />
            <EnvioStatusBadge status={pedido.estadoEnvio} />
          </div>
          <p className="text-sm text-neutral-600 mt-0.5">
            {pedido.seller} — {pedido.sucursal}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" size="md" iconLeft={<Eye className="w-4 h-4" />} onClick={() => setSupportOpen(true)}>
            Vista rápida
          </Button>
          <QuickActionsMenu actions={quickActions} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-neutral-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div>
        {/* ════════ TAB: RESUMEN ════════ */}
        {activeTab === "resumen" && (
          <div className="space-y-5">
            {/* Alert zone — full width */}
            <div className="space-y-2">
              {pedido.esOrdenMuerta && (
                <AlertBanner
                  variant="danger"
                  icon={Timer}
                  title={`Pedido sin movimiento hace ${pedido.diasSinMovimiento ?? "?"} horas`}
                  description="Este pedido lleva demasiado tiempo sin transición de estado."
                />
              )}
              {pedido.requiereRecotizacion && (
                <AlertBanner
                  variant="warning"
                  icon={AlertTriangle}
                  title="Dirección modificada — recotización requerida"
                  description="El courier y costo de envío fueron invalidados. Debe recotizar antes de guardar."
                  action={{ label: "Ir a Envío", onClick: () => switchTab("envio") }}
                />
              )}
              {pedido.pickingBottleneck && (
                <AlertBanner
                  variant="warning"
                  icon={Zap}
                  title="Alerta de cuello de botella en picking"
                  description="Este pedido lleva más del umbral configurado en preparación."
                />
              )}
              {requiresRequote && (
                <AlertBanner
                  variant="warning"
                  icon={AlertTriangle}
                  title="Dirección modificada — recotización requerida"
                  description="Recotice el envío en la pestaña Envío antes de guardar."
                  action={{ label: "Ir a Envío", onClick: () => switchTab("envio") }}
                  dismissible={false}
                />
              )}
            </div>

            {/* Dirty banner — inline full-width */}
            <DirtyBanner
              visible={isDirty}
              message={requiresRequote ? "Dirección modificada — recotice antes de guardar" : "Tienes cambios sin guardar"}
            />

            {/* Timeline — full width */}
            <Card size="sm">
              <CardContent className="pt-4 !px-4">
                <PedidoTimeline steps={timelineSteps} />
              </CardContent>
            </Card>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Info card — badges + data grid in 3 columns */}
                <CollapsibleCard title="Datos del Pedido">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                      {/* Row 1: Estados */}
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">Preparación</p>
                        <PedidoStatusBadge status={pedido.estadoPreparacion} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">Envío</p>
                        <EnvioStatusBadge status={pedido.estadoEnvio} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Fecha Creación</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{fmtDate(pedido.fechaCreacion)}</p>
                      </div>
                      {/* Row 2: SLA */}
                      {pedido.preparacion.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">Próx. Preparación</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {pedido.preparacion.map((s, i) => (
                              <span key={`prep-${i}`} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                ${s.color === "blue" ? "bg-blue-50 text-blue-700" : ""}
                                ${s.color === "green" ? "bg-green-50 text-green-700" : ""}
                                ${s.color === "red" ? "bg-red-50 text-red-700" : ""}
                                ${s.color === "amber" ? "bg-amber-50 text-amber-700" : ""}
                              `}>
                                {s.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {pedido.entrega.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">Próx. Entrega</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {pedido.entrega.map((s, i) => (
                              <span key={`ent-${i}`} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                ${s.color === "blue" ? "bg-blue-50 text-blue-700" : ""}
                                ${s.color === "green" ? "bg-green-50 text-green-700" : ""}
                                ${s.color === "red" ? "bg-red-50 text-red-700" : ""}
                                ${s.color === "amber" ? "bg-amber-50 text-amber-700" : ""}
                              `}>
                                {s.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {pedido.fechaEnvio && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Fecha Envío</p>
                          <p className="text-sm font-medium text-neutral-700 mt-0.5">{fmtDate(pedido.fechaEnvio)}</p>
                        </div>
                      )}
                      {/* Row 3: IDs */}
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">ID Amplifica</p>
                        <p className="text-sm font-semibold text-neutral-800 mt-0.5 font-sans">{pedido.idAmplifica}</p>
                      </div>
                      {pedido.idExterno && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">ID Externo</p>
                          <p className="text-sm font-medium text-neutral-700 mt-0.5 font-mono">{pedido.idExterno}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Seller</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.seller}</p>
                      </div>
                      {/* Row 4 */}
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Sucursal</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.sucursal}</p>
                      </div>
                    </div>
                </CollapsibleCard>

                {/* Products preview */}
                <CollapsibleCard
                  title={`Productos (${pedido.productos.length})`}
                  action={
                    <span className="text-xs bg-primary-50 text-primary-700 rounded-full px-2.5 py-1 font-semibold">
                      {pedido.productos.reduce((s, p) => s + p.cantidad, 0)} unidades en total
                    </span>
                  }
                >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="text-left text-xs text-neutral-400 font-medium pb-2 pr-4">Producto</th>
                            <th className="text-left text-xs text-neutral-400 font-medium pb-2 pr-4">SKU</th>
                            <th className="text-right text-xs text-neutral-400 font-medium pb-2 pr-4">Cant.</th>
                            <th className="text-right text-xs text-neutral-400 font-medium pb-2 pr-4">Precio</th>
                            <th className="text-right text-xs text-neutral-400 font-medium pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedido.productos.map((p) => (
                            <tr key={p.id} className="border-b border-neutral-50">
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2.5">
                                  {p.imagen ? (
                                    <img src={p.imagen} alt={p.nombre} className="w-8 h-8 rounded-md object-cover bg-neutral-100 flex-shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                      <Package className="w-4 h-4 text-neutral-300" />
                                    </div>
                                  )}
                                  <p className="text-neutral-800 font-medium truncate max-w-[200px]">{p.nombre}</p>
                                </div>
                              </td>
                              <td className="py-2.5 pr-4 font-mono text-neutral-500 text-xs">{p.sku}</td>
                              <td className="py-2.5 pr-4 text-right text-neutral-800">{p.cantidad}</td>
                              <td className="py-2.5 pr-4 text-right text-neutral-800">{fmt(p.precioUnitario)}</td>
                              <td className="py-2.5 text-right font-medium text-neutral-900">{fmt(p.precioUnitario * p.cantidad)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-neutral-200">
                            <td colSpan={4} className="py-2.5 text-right font-medium text-neutral-700">Total</td>
                            <td className="py-2.5 text-right font-bold text-neutral-900">{fmt(pedido.montoTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                </CollapsibleCard>
              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="space-y-5">
                {/* Order Economy */}
                <OrderEconomyCard
                  subtotal={pedido.subtotal ?? pedido.montoTotal}
                  descuentos={pedido.descuentos ?? 0}
                  impuestos={pedido.impuestos ?? 0}
                  costoEnvio={pedido.costoEnvioOrden ?? pedido.cotizacion?.costoNeto ?? 0}
                  montoTotal={pedido.montoTotal}
                />

                {/* Courier Info compact */}
                {pedido.cotizacion && (
                  <CourierInfoCard
                    courier={pedido.cotizacion.courier}
                    servicio={pedido.cotizacion.servicio}
                    trackingNumber={pedido.cotizacion.trackingNumber}
                    trackingUrl={pedido.cotizacion.trackingUrl}
                    dimensiones={pedido.dimensiones}
                    variant="compact"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: ENVÍO ════════ */}
        {activeTab === "envio" && (
          <div className="space-y-5">
            {/* Requote warning — full width */}
            {requiresRequote && (
              <AlertBanner
                variant="warning"
                icon={AlertTriangle}
                title="Dirección modificada — courier y costo invalidados"
                description="Debe recotizar el envío antes de guardar."
                dismissible={false}
              />
            )}

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Address */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      Dirección del Destinatario
                    </CardTitle>
                    {!editingAddress && (
                      <CardAction>
                        <Button variant="secondary" size="sm" iconLeft={<Pencil className="w-3.5 h-3.5" />} onClick={startEditAddress}>
                          Editar
                        </Button>
                      </CardAction>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Name */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Nombre</label>
                        {editingAddress ? (
                          <input
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                            value={addr.nombre}
                            onChange={e => handleAddressChange("nombre", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-neutral-800">{addr.nombre}</p>
                        )}
                      </div>
                      {/* Email */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Email</label>
                        <div className="flex items-center gap-1.5">
                          {editingAddress ? (
                            <input
                              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                              value={addr.email}
                              onChange={e => handleAddressChange("email", e.target.value)}
                            />
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-neutral-400" />
                              <p className="text-sm text-neutral-800">{addr.email}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Phone */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Teléfono</label>
                        <div className="flex items-center gap-1.5">
                          {editingAddress ? (
                            <input
                              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                              value={addr.telefono}
                              onChange={e => handleAddressChange("telefono", e.target.value)}
                            />
                          ) : (
                            <>
                              <Phone className="w-3.5 h-3.5 text-neutral-400" />
                              <p className="text-sm text-neutral-800">{addr.telefono}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Street + number */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Calle y Número</label>
                        {editingAddress ? (
                          <div className="flex gap-2">
                            <input
                              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                              value={addr.calle}
                              onChange={e => handleAddressChange("calle", e.target.value)}
                              placeholder="Calle"
                            />
                            <input
                              className="w-20 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                              value={addr.numero}
                              onChange={e => handleAddressChange("numero", e.target.value)}
                              placeholder="Nro"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-800">{addr.calle} {addr.numero}</p>
                        )}
                      </div>
                      {/* Depto */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Depto / Complemento</label>
                        {editingAddress ? (
                          <input
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                            value={addr.depto ?? ""}
                            onChange={e => handleAddressChange("depto", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-neutral-800">{addr.depto || "—"}</p>
                        )}
                      </div>
                      {/* Comuna */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Comuna</label>
                        {editingAddress ? (
                          <input
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                            value={addr.comuna}
                            onChange={e => handleAddressChange("comuna", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-neutral-800">{addr.comuna}</p>
                        )}
                      </div>
                      {/* Region */}
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Región</label>
                        {editingAddress ? (
                          <input
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                            value={addr.region}
                            onChange={e => handleAddressChange("region", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-neutral-800">{addr.region}</p>
                        )}
                      </div>
                      {/* Instructions */}
                      {(addr.instrucciones || editingAddress) && (
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Instrucciones</label>
                          {editingAddress ? (
                            <input
                              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 mt-1"
                              value={addr.instrucciones ?? ""}
                              onChange={e => handleAddressChange("instrucciones", e.target.value)}
                            />
                          ) : (
                            <div className="mt-1.5 flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2.5">
                              <MessageCircle className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-neutral-600 leading-relaxed">{addr.instrucciones}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {editingAddress && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                        {isDirty && (
                          <div className="flex items-center gap-2 text-xs text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Dirección modificada — requiere recotización</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          <Button variant="secondary" size="sm" onClick={discardChanges}>Cancelar</Button>
                          <Button variant="primary" size="sm" onClick={saveChanges}>Guardar cambios</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dimensiones del Paquete */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-neutral-400" />
                      Dimensiones del Paquete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pedido.dimensiones ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-neutral-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Peso</p>
                          <p className="text-lg font-bold text-neutral-800 mt-0.5">{pedido.dimensiones.peso}kg</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Largo</p>
                          <p className="text-lg font-bold text-neutral-800 mt-0.5">{pedido.dimensiones.largo}cm</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Ancho</p>
                          <p className="text-lg font-bold text-neutral-800 mt-0.5">{pedido.dimensiones.ancho}cm</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Alto</p>
                          <p className="text-lg font-bold text-neutral-800 mt-0.5">{pedido.dimensiones.alto}cm</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-x-5 gap-y-2.5 flex-wrap">
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Paquete</p>
                          <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.paquete}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Volumen total</p>
                          <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.volumenTotal}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="space-y-5">
                {/* Courier Info — expanded */}
                {pedido.cotizacion ? (
                  <CourierInfoCard
                    courier={pedido.cotizacion.courier}
                    servicio={pedido.cotizacion.servicio}
                    trackingNumber={pedido.cotizacion.trackingNumber}
                    trackingUrl={pedido.cotizacion.trackingUrl}
                    costo={requiresRequote ? 0 : pedido.cotizacion.costoNeto}
                    estado={requiresRequote ? "requiere_recotizacion" : pedido.cotizacion.estado}
                    tiempoEstimado={requiresRequote ? undefined : pedido.cotizacion.tiempoEstimado}
                    dimensiones={pedido.dimensiones}
                    variant="full"
                    onRequote={() => alert("Recotizar (mock)")}
                    onGenerateLabel={requiresRequote ? undefined : () => alert("Generar etiqueta (mock)")}
                  />
                ) : (
                  <Card size="sm">
                    <CardContent className="pt-4">
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-3">Información del Courier</p>
                      <p className="text-sm text-neutral-400">Sin cotización disponible</p>
                    </CardContent>
                  </Card>
                )}

                {/* Map placeholder */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Ubicación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-neutral-100 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-neutral-400">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Mapa — {addr.calle} {addr.numero}, {addr.comuna}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: PRODUCTOS ════════ */}
        {activeTab === "productos" && (
          <div className="space-y-5">
            {/* Products table */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Ítems de la Orden</CardTitle>
                <CardAction>
                  <span className="text-xs bg-primary-50 text-primary-700 rounded-full px-2.5 py-1 font-semibold uppercase">
                    {pedido.productos.reduce((s, p) => s + p.cantidad, 0)} unidades en total
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-left text-xs text-neutral-400 font-medium pb-2 pr-4">SKU</th>
                        <th className="text-left text-xs text-neutral-400 font-medium pb-2 pr-4">Producto</th>
                        <th className="text-left text-xs text-neutral-400 font-medium pb-2 pr-4">Código de Barras</th>
                        <th className="text-right text-xs text-neutral-400 font-medium pb-2 pr-4">Cantidad</th>
                        <th className="text-right text-xs text-neutral-400 font-medium pb-2 pr-4">Precio Unitario</th>
                        <th className="text-right text-xs text-neutral-400 font-medium pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.productos.map((p) => (
                        <tr key={p.id} className="border-b border-neutral-50">
                          <td className="py-2.5 pr-4 font-mono text-neutral-500 text-xs">{p.sku}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-3">
                              {p.imagen ? (
                                <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover bg-neutral-100 flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-neutral-300" />
                                </div>
                              )}
                              <p className="text-neutral-800 font-medium">{p.nombre}</p>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-neutral-500 text-xs">{p.barcode || "—"}</td>
                          <td className="py-2.5 pr-4 text-right text-neutral-800">{p.cantidad}</td>
                          <td className="py-2.5 pr-4 text-right text-neutral-800">{fmt(p.precioUnitario)}</td>
                          <td className="py-2.5 text-right font-medium text-primary-600">{fmt(p.precioUnitario * p.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-200 bg-neutral-50/50">
                        <td colSpan={5} className="py-2.5 text-right font-semibold text-neutral-700 uppercase text-xs tracking-wider">Total Orden:</td>
                        <td className="py-2.5 text-right font-bold text-primary-600 text-base">{fmt(pedido.montoTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pruebas de Entrega y Picking */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Pruebas de Entrega y Picking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-400 text-center py-6">
                  No hay evidencias fotográficas registradas para este pedido
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════ TAB: HISTORIAL ════════ */}
        {activeTab === "historial" && (
          <div className="space-y-5">
            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Cronología Textual */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      Cronología Textual
                    </CardTitle>
                    <CardAction>
                      <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {pedido.timeline.length > 0 ? (
                      <GanttTimeline events={pedido.timeline} />
                    ) : (
                      <p className="text-sm text-neutral-400 text-center py-4">Sin eventos registrados</p>
                    )}
                  </CardContent>
                </Card>

                {/* Notificaciones Enviadas */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      Notificaciones Enviadas
                    </CardTitle>
                    <CardAction>
                      <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {pedido.notificaciones.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-neutral-100">
                              <th className="text-left text-[10px] font-semibold text-neutral-600 uppercase tracking-wider pb-2 pr-4">Canal</th>
                              <th className="text-left text-[10px] font-semibold text-neutral-600 uppercase tracking-wider pb-2 pr-4">Asunto / Contenido</th>
                              <th className="text-left text-[10px] font-semibold text-neutral-600 uppercase tracking-wider pb-2 pr-4">Estado</th>
                              <th className="text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-wider pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.notificaciones.map((n) => (
                              <tr key={n.id} className="border-b border-neutral-50 last:border-0">
                                <td className="py-2.5 pr-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                                      n.tipo === "email" ? "bg-blue-50" : n.tipo === "sms" ? "bg-green-50" : "bg-neutral-50"
                                    }`}>
                                      {n.tipo === "email" ? <Mail className="w-3 h-3 text-blue-500" /> :
                                       n.tipo === "sms" ? <MessageCircle className="w-3 h-3 text-green-500" /> :
                                       <ExternalLink className="w-3 h-3 text-neutral-400" />}
                                    </div>
                                    <span className="text-sm text-neutral-700 capitalize">{n.tipo === "email" ? "Email" : n.tipo === "sms" ? "SMS" : "Webhook"}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 pr-4">
                                  <p className="text-sm text-neutral-800 truncate max-w-[280px]">{n.asunto}</p>
                                  {n.motivo && <p className="text-xs text-red-400 truncate">{n.motivo}</p>}
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                    n.estado === "enviada" ? "bg-green-50 text-green-700" :
                                    n.estado === "fallida" ? "bg-red-50 text-red-600" :
                                    n.estado === "desactivada" ? "bg-neutral-100 text-neutral-500" :
                                    "bg-amber-50 text-amber-700"
                                  }`}>
                                    {n.estado === "enviada" ? "Enviado" :
                                     n.estado === "fallida" ? "Fallido" :
                                     n.estado === "desactivada" ? "Desactivado" : "Pendiente"}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  {n.htmlPreview && (
                                    <button
                                      onClick={() => { setEmailPreview({ html: n.htmlPreview!, asunto: n.asunto }); setPreviewDevice("desktop"); }}
                                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Ver preview
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400 text-center py-4">Sin notificaciones</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="space-y-5">
                {/* Incidencias */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Incidencias
                    </CardTitle>
                    <CardAction>
                      <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {pedido.incidencias.length > 0 && pedido.incidencias.some(i => i.tipo !== "—") ? (
                      <div className="space-y-2">
                        {pedido.incidencias.map((inc) => (
                          <div key={inc.id} className="border border-neutral-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                inc.estado === "resuelta" ? "bg-green-50 text-green-700" :
                                inc.estado === "en_gestion" ? "bg-amber-50 text-amber-700" :
                                "bg-red-50 text-red-600"
                              }`}>
                                {inc.estado === "resuelta" ? "Resuelta" : inc.estado === "en_gestion" ? "En gestión" : "Abierta"}
                              </span>
                              <span className="text-[11px] text-neutral-400 font-mono">{fmtDate(inc.creadoEn)}</span>
                            </div>
                            <p className="text-sm text-neutral-800">{inc.tipo}</p>
                            {inc.responsable && inc.responsable !== "—" && <p className="text-xs text-neutral-400">Responsable: {inc.responsable}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-7 h-7 text-green-500" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-800 mb-1">No hay incidencias reportadas</p>
                        <p className="text-xs text-neutral-400 max-w-[220px]">El ciclo de vida de esta orden transcurre sin errores detectados.</p>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={() => alert("Reportar incidencia (mock)")}>
                          Reportar Manualmente
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actores Involucrados */}
                {pedido.actoresInvolucrados && pedido.actoresInvolucrados.length > 0 && (
                  <CollapsibleCard title="Actores Involucrados">
                      <div className="space-y-3">
                        {pedido.actoresInvolucrados.map((actor, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-neutral-800">{actor.nombre}</p>
                              <p className="text-xs text-neutral-400">{actor.rol}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  </CollapsibleCard>
                )}

                {/* Eficiencia de Ciclo */}
                {pedido.eficienciaCiclo && (
                  <div className="bg-primary-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-200">
                        Eficiencia de Ciclo
                      </p>
                      <Zap className="w-4 h-4 text-primary-200" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold">{pedido.eficienciaCiclo.porcentaje}%</span>
                      <span className="text-sm text-primary-200">{pedido.eficienciaCiclo.delta}</span>
                    </div>
                    <div className="w-full bg-primary-700 rounded-full h-1.5">
                      <div
                        className="bg-white rounded-full h-1.5 transition-all"
                        style={{ width: `${pedido.eficienciaCiclo.porcentaje}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3">
              <Button variant="secondary" size="sm" iconLeft={<CheckCircle2 className="w-4 h-4" />}>
                Modo Supervisión
              </Button>
              <Button variant="secondary" size="sm" iconLeft={<StickyNote className="w-4 h-4" />}>
                Anotar
              </Button>
              <Button variant="secondary" size="sm" iconLeft={<RefreshCw className="w-4 h-4" />}>
                Sincronizar
              </Button>
              <Button variant="primary" size="sm" iconLeft={<Plus className="w-4 h-4" />}>
                Nuevo Evento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Action Bar ── */}
      <StickyActionBar
        visible={isDirty}
        onSave={saveChanges}
        onDiscard={discardChanges}
        requiresRequote={requiresRequote}
        onRequote={() => switchTab("envio")}
      />

      {/* ── Support Modal ── */}
      <SupportCompactModal open={supportOpen} onClose={() => setSupportOpen(false)} pedido={pedido} />

      {/* ── Cancel Modal ── */}
      <AlertModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        icon={Ban}
        variant="danger"
        title="Cancelar pedido"
        subtitle={`¿Estás seguro de cancelar el pedido ${pedido.idAmplifica}?`}
        confirm={{ label: "Cancelar pedido", onClick: () => { setCancelOpen(false); alert("Pedido cancelado (mock)"); } }}
        cancelLabel="Volver"
      >
        Esta acción no se puede deshacer. El pedido pasará a estado &quot;Cancelado&quot; y se notificará al cliente.
      </AlertModal>

      {/* ── Email Preview Modal ── */}
      {emailPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onMouseDown={() => setEmailPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Preview del correo</p>
                <p className="text-xs text-neutral-500 mt-0.5">{emailPreview.asunto}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Device toggle */}
                <div className="flex items-center gap-0.5 bg-neutral-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      previewDevice === "desktop"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      previewDevice === "mobile"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                </div>
                <button onClick={() => setEmailPreview(null)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Preview iframe */}
            <div className="flex-1 overflow-auto bg-neutral-100 flex justify-center p-6">
              <div
                className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden transition-all duration-300"
                style={{ width: previewDevice === "desktop" ? 660 : 375, minHeight: 400 }}
              >
                <iframe
                  srcDoc={
                    previewDevice === "mobile"
                      ? emailPreview.html.replace(
                          /<head>/i,
                          `<head><style>table[width="600"],table[width="100%"]{max-width:100%!important;width:100%!important}td{word-break:break-word}img{max-width:100%!important;height:auto!important}</style>`
                        )
                      : emailPreview.html
                  }
                  title="Email preview"
                  className="w-full h-full border-0"
                  style={{ minHeight: 500 }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export with Suspense (required for useSearchParams) ──────────────────────
export default function PedidoDetallePage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-8 text-neutral-400">Cargando pedido...</div>}>
      <PedidoDetalleContent />
    </Suspense>
  );
}
