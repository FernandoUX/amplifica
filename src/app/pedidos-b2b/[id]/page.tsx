"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight, LayoutDashboard, Package, FileText, ArrowLeftRight, Clock,
  Copy, Check, Truck, Store, Building2, MapPin, Mail, Phone, AlertTriangle,
  Ban, Eye, Users, ShieldCheck, X, UserCheck, CreditCard, Printer,
  MoreVertical, CheckCircle2, RefreshCw, Inbox,
} from "lucide-react";
import { PEDIDOS_B2B } from "@/app/pedidos-b2b/_data";
import type { PedidoB2B, B2BStatus, EventoB2B } from "@/app/pedidos-b2b/_data";
import B2BStatusBadge from "@/components/b2b/B2BStatusBadge";
import RedistribucionTracker from "@/components/b2b/RedistribucionTracker";
import DocumentRepository from "@/components/b2b/DocumentRepository";
import AlertBanner from "@/components/pedidos/AlertBanner";
import AlertModal from "@/components/ui/AlertModal";
import Button from "@/components/ui/Button";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import { Card, CardContent } from "@/components/ui/card";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CopyId({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
      className="text-neutral-400 hover:text-neutral-600 transition-colors" title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function fmt(n: number) { return "$" + n.toLocaleString("es-CL"); }

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) + " " + date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

// ─── Seller simplified states (Etapa 4 — UX: Nielsen #1) ─────────────────────
const SELLER_MEGA_STATUS: Record<B2BStatus, { label: string; color: string; step: number }> = {
  "Recibido":                  { label: "Creado",      color: "bg-sky-100 text-sky-700",    step: 1 },
  "Documentación pendiente":   { label: "En proceso",  color: "bg-amber-100 text-amber-700", step: 2 },
  "Validado":                  { label: "En proceso",  color: "bg-blue-100 text-blue-700",  step: 2 },
  "Redistribución pendiente":  { label: "En proceso",  color: "bg-blue-100 text-blue-700",  step: 2 },
  "En preparación":            { label: "Preparando",  color: "bg-primary-100 text-primary-700", step: 3 },
  "Empacado":                  { label: "Preparando",  color: "bg-primary-100 text-primary-700", step: 3 },
  "Despachado":                { label: "En camino",   color: "bg-indigo-100 text-indigo-700", step: 4 },
  "Entrega fallida":           { label: "En camino",   color: "bg-red-100 text-red-700",    step: 4 },
  "Entregado":                 { label: "Entregado",   color: "bg-green-100 text-green-700", step: 5 },
  "Listo para retiro":         { label: "Preparando",  color: "bg-purple-100 text-purple-700", step: 3 },
  "Retirado":                  { label: "Entregado",   color: "bg-green-100 text-green-700", step: 5 },
  "Cancelado":                 { label: "Cancelado",   color: "bg-neutral-100 text-neutral-600", step: 0 },
};

const MEGA_STEPS = [
  { label: "Creado", icon: Inbox },
  { label: "En proceso", icon: Clock },
  { label: "Preparando", icon: Package },
  { label: "En camino", icon: Truck },
  { label: "Entregado", icon: CheckCircle2 },
];

// ─── Cancellation states allowed ──────────────────────────────────────────────
const CANCELLABLE_STATES: B2BStatus[] = ["Recibido", "Documentación pendiente", "Validado", "Redistribución pendiente"];
const CANCEL_WITH_SUPERVISOR: B2BStatus[] = ["En preparación"];

// ─── Retiro en Tienda confirmable states ──────────────────────────────────────
const RETIRO_CONFIRMABLE: B2BStatus[] = ["Listo para retiro"];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "resumen", label: "Resumen", icon: LayoutDashboard },
  { key: "productos", label: "Productos", icon: Package },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "redistribucion", label: "Redistribución", icon: ArrowLeftRight },
  { key: "historial", label: "Historial", icon: Clock },
] as const;
type TabKey = typeof TABS[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PedidoB2BDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("resumen");

  const pedido = useMemo(() => PEDIDOS_B2B.find(p => p.id === Number(id)), [id]);

  // ── Mutable state (Etapa 4 + 5) ──
  const [localEstado, setLocalEstado] = useState<B2BStatus>(pedido?.estado ?? "Recibido");
  const [localRedist, setLocalRedist] = useState(pedido?.redistribuciones ?? []);
  const [localTimeline, setLocalTimeline] = useState<EventoB2B[]>(pedido?.timeline ?? []);

  // Skeleton loading (Phase 4: loading states)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t); }, []);

  // View mode: seller (simplified) vs operador (full)
  const [viewMode, setViewMode] = useState<"seller" | "operador">("operador");

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");

  // Retiro modal
  const [retiroOpen, setRetiroOpen] = useState(false);
  const [retiroNombre, setRetiroNombre] = useState("");
  const [retiroRut, setRetiroRut] = useState("");

  // Advance state modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // Quick actions menu
  const [actionsOpen, setActionsOpen] = useState(false);

  // Toast notification
  type ToastData = { message: string; type: "success" | "error" | "info"; undoAction?: () => void };
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((data: ToastData) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(data);
    toastTimerRef.current = setTimeout(() => setToast(null), data.undoAction ? 5000 : 4000);
  }, []);

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500">Pedido B2B no encontrado</p>
        <Button variant="secondary" onClick={() => router.push("/pedidos-b2b")}>Volver a pedidos B2B</Button>
      </div>
    );
  }

  // Skeleton loading state (Phase 4)
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-8 space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-neutral-200 rounded" />
        <div className="flex items-center gap-3">
          <div className="h-7 w-64 bg-neutral-200 rounded" />
          <div className="h-6 w-32 bg-neutral-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-64 bg-neutral-50" />
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-48 bg-neutral-50" />
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-48 bg-neutral-50" />
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-32 bg-neutral-50" />
          </div>
        </div>
      </div>
    );
  }

  // ── Handlers (Etapa 5) ──
  const handleConfirmRecepcion = useCallback((redId: string) => {
    setLocalRedist(prev => prev.map(r => r.id === redId ? { ...r, estado: "Recibida en destino" as const } : r));
    const allReceived = localRedist.every(r => r.id === redId || r.estado === "Recibida en destino");
    if (allReceived) {
      setLocalEstado("Validado");
      setLocalTimeline(prev => [{ id: `evt-auto-${Date.now()}`, timestamp: new Date().toISOString(), tipo: "redistribucion", titulo: "Redistribución completada — pedido validado automáticamente", usuario: "Sistema" }, ...prev]);
    }
  }, [localRedist]);

  const handleCancel = useCallback(() => {
    setLocalEstado("Cancelado");
    setLocalTimeline(prev => [{
      id: `evt-cancel-${Date.now()}`, timestamp: new Date().toISOString(), tipo: "cancelacion",
      titulo: `Pedido cancelado${cancelMotivo ? `: ${cancelMotivo}` : ""}`,
      descripcion: localRedist.some(r => !["Recibida en destino", "Fallida", "Cancelada"].includes(r.estado))
        ? "Stock liberado. Redistribuciones activas canceladas."
        : "Stock reservado liberado.",
      usuario: "Operador",
    }, ...prev]);
    // Cancel active redistributions
    setLocalRedist(prev => prev.map(r => ["Solicitada", "Reservada en origen", "En tránsito"].includes(r.estado) ? { ...r, estado: "Cancelada" as const } : r));
    setCancelOpen(false);
    setCancelMotivo("");
  }, [cancelMotivo, localRedist]);

  const handleConfirmRetiro = useCallback(() => {
    if (!retiroNombre || !retiroRut) return;
    setLocalEstado("Retirado");
    setLocalTimeline(prev => [{
      id: `evt-retiro-${Date.now()}`, timestamp: new Date().toISOString(), tipo: "entrega",
      titulo: `Retiro confirmado por ${retiroNombre} (RUT: ${retiroRut})`, usuario: "Operador",
    }, ...prev]);
    setRetiroOpen(false);
    setRetiroNombre("");
    setRetiroRut("");
  }, [retiroNombre, retiroRut]);

  const handleAdvanceState = useCallback(() => {
    const transitions: Partial<Record<B2BStatus, B2BStatus>> = {
      "Validado": "En preparación",
      "En preparación": "Empacado",
      "Empacado": pedido.metodoEnvio === "Retiro en Tienda" ? "Listo para retiro" : "Despachado",
      "Despachado": "Entregado",
      "Entrega fallida": "Despachado",
    };
    const next = transitions[localEstado];
    if (!next) return;
    setLocalEstado(next);
    setLocalTimeline(prev => [{
      id: `evt-advance-${Date.now()}`, timestamp: new Date().toISOString(), tipo: "sistema",
      titulo: `Estado cambiado a "${next}"`, usuario: "Operador",
    }, ...prev]);
  }, [localEstado, pedido.metodoEnvio]);

  // ── Derived ──
  const mega = SELLER_MEGA_STATUS[localEstado];
  const canalColor = pedido.canalVenta === "Mercado Libre" ? "bg-yellow-50 text-yellow-800 border-yellow-200" : pedido.canalVenta === "Falabella" ? "bg-green-50 text-green-800 border-green-200" : "bg-neutral-100 text-neutral-700 border-neutral-200";
  const canCancel = CANCELLABLE_STATES.includes(localEstado) || CANCEL_WITH_SUPERVISOR.includes(localEstado);
  const needsSupervisor = CANCEL_WITH_SUPERVISOR.includes(localEstado);
  const canAdvance = ["Validado", "En preparación", "Empacado", "Despachado", "Entrega fallida"].includes(localEstado);
  const advanceLabel: Record<string, string> = {
    "Validado": "Iniciar preparación",
    "En preparación": "Marcar empacado",
    "Empacado": pedido.metodoEnvio === "Retiro en Tienda" ? "Listo para retiro" : "Marcar despachado",
    "Despachado": "Confirmar entrega",
    "Entrega fallida": "Re-despachar",
  };
  const hasActiveRedist = localRedist.some(r => !["Recibida en destino", "Fallida", "Cancelada"].includes(r.estado));
  const isTerminal = ["Entregado", "Retirado", "Cancelado"].includes(localEstado);

  // ── Pending tasks for seller view ──
  const pendingTasks: { label: string; action: () => void }[] = [];
  if (localEstado === "Documentación pendiente") {
    const pending = pedido.checklist.filter(c => c.obligatorio && !c.completado);
    pendingTasks.push({ label: `Subir ${pending.length} documento(s) obligatorio(s)`, action: () => setActiveTab("documentos") });
  }
  if (localEstado === "Redistribución pendiente") {
    pendingTasks.push({ label: "Traslado de stock en curso — no requiere acción", action: () => setActiveTab("redistribucion") });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-6 space-y-5 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/pedidos-b2b" className="hover:text-primary-500 transition-colors">Pedidos B2B</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">{pedido.idAmplifica}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
              {pedido.idAmplifica}
              <CopyId text={pedido.idAmplifica} />
            </h1>
            {/* Dual badges: seller view shows mega-state, operador shows full state */}
            {viewMode === "seller" ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${mega.color}`}>
                {mega.label}
              </span>
            ) : (
              <span className="transition-all duration-300">
                <B2BStatusBadge status={localEstado} />
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${canalColor}`}>
              {pedido.canalVenta}
            </span>
          </div>
          <p className="text-sm text-neutral-600 mt-1">{pedido.seller} — {pedido.destinatario.razonSocial}</p>

          {/* View mode toggle (Etapa 4) */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 mt-2 w-fit">
            <button
              onClick={() => setViewMode("seller")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === "seller" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Users className="w-3 h-3" /> Vista Seller
            </button>
            <button
              onClick={() => setViewMode("operador")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === "operador" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <ShieldCheck className="w-3 h-3" /> Vista Operador
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Contextual CTA (Etapa 4) */}
          {canAdvance && viewMode === "operador" && (
            <Button variant="primary" size="md" onClick={() => setShowAdvanceModal(true)}>
              {advanceLabel[localEstado] ?? "Avanzar"}
            </Button>
          )}
          {localEstado === "Listo para retiro" && (
            <Button variant="primary" size="md" iconLeft={<UserCheck className="w-4 h-4" />} onClick={() => setRetiroOpen(true)}>
              Confirmar retiro
            </Button>
          )}
          {localEstado === "Documentación pendiente" && viewMode === "seller" && (
            <Button variant="primary" size="md" iconLeft={<FileText className="w-4 h-4" />} onClick={() => setActiveTab("documentos")}>
              Completar documentos
            </Button>
          )}

          {/* Quick actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className="-m-1.5 p-3 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-white rounded-xl shadow-lg ring-1 ring-neutral-200/60 py-1.5">
                <button onClick={() => { window.print(); setActionsOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <Printer className="w-4 h-4" /> Exportar resumen
                </button>
                <button onClick={() => { showToast({ message: "Sincronización completada", type: "success" }); setActionsOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <RefreshCw className="w-4 h-4" /> Sincronizar
                </button>
                {canCancel && (
                  <>
                    <div className="border-t border-neutral-100 my-1" />
                    <button onClick={() => { setCancelOpen(true); setActionsOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Ban className="w-4 h-4" /> Cancelar pedido
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Seller simplified progress bar (Etapa 4) ── */}
      {viewMode === "seller" && !isTerminal && (
        <Card size="sm">
          <CardContent className="!py-4 !px-4">
            <div className="flex items-center gap-1">
              {MEGA_STEPS.map((step, i) => {
                const active = mega.step === i + 1;
                const done = mega.step > i + 1;
                const StepIcon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-1 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-green-500 text-white" : active ? "bg-primary-500 text-white ring-3 ring-primary-100" : "bg-neutral-200 text-neutral-400"
                    }`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[11px] font-medium hidden sm:inline ${done ? "text-green-600" : active ? "text-primary-600" : "text-neutral-400"}`}>
                      {step.label}
                    </span>
                    {i < MEGA_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded-full min-w-[12px] ${done ? "bg-green-300" : "bg-neutral-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Pending tasks */}
            {pendingTasks.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {pendingTasks.map((task, i) => (
                  <button
                    key={i}
                    onClick={task.action}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {task.label}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alert banners (operador view) */}
      {viewMode === "operador" && (
        <>
          {localEstado === "Redistribución pendiente" && (
            <AlertBanner variant="warning" icon={ArrowLeftRight} title="Redistribución de stock en curso" description="Será validado automáticamente al completarse." />
          )}
          {localEstado === "Documentación pendiente" && (
            <AlertBanner variant="warning" icon={FileText} title="Documentación incompleta" description="Faltan documentos obligatorios del marketplace." action={{ label: "Ir a documentos", onClick: () => setActiveTab("documentos") }} />
          )}
          {localEstado === "Entrega fallida" && (
            <AlertBanner variant="danger" icon={AlertTriangle} title="Entrega fallida — requiere re-agendamiento" />
          )}
          {localEstado === "Cancelado" && (
            <AlertBanner variant="danger" icon={Ban} title="Pedido cancelado" description="Stock liberado. Redistribuciones revertidas." />
          )}
        </>
      )}

      {/* Tabs — horizontal scroll only, never vertical (design system rule) */}
      <div className="flex border-b border-neutral-200 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          if (tab.key === "redistribucion" && pedido.redistribuciones.length === 0) return null;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                isActive ? "border-primary-500 text-primary-600" : "border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === "documentos" && localEstado === "Documentación pendiente" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
              {tab.key === "redistribucion" && localEstado === "Redistribución pendiente" && <span className="w-2 h-2 rounded-full bg-orange-400" />}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div>
        {/* ─── RESUMEN ─── */}
        {activeTab === "resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
            <div className="space-y-5">
              <CollapsibleCard icon={Building2} title="Datos del destinatario" description="Información del cliente B2B">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Razón social</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">{pedido.destinatario.razonSocial}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">RUT</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">{pedido.destinatario.rut}</p>
                  </div>
                  {pedido.destinatario.giro && (
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Giro</p>
                      <p className="text-sm text-neutral-700 mt-0.5">{pedido.destinatario.giro}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Contacto</p>
                    <p className="text-sm text-neutral-700 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3 text-neutral-400" />{pedido.destinatario.telefonoContacto}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-neutral-700 mt-0.5 flex items-center gap-1"><Mail className="w-3 h-3 text-neutral-400" />{pedido.destinatario.emailContacto}</p>
                  </div>
                  {pedido.metodoEnvio !== "Retiro en Tienda" && (
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Dirección de envío</p>
                      <p className="text-sm text-neutral-700 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-neutral-400" />{pedido.destinatario.direccionEnvio}, {pedido.destinatario.comuna}, {pedido.destinatario.region}</p>
                    </div>
                  )}
                </div>
              </CollapsibleCard>

              <CollapsibleCard icon={CreditCard} title="Desglose económico" description="Subtotal, impuestos y costo de envío">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Subtotal</span><span className="font-medium text-neutral-800 tabular-nums">{fmt(pedido.subtotal)}</span></div>
                  {pedido.descuentos > 0 && <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Descuentos</span><span className="font-medium text-green-600 tabular-nums">-{fmt(pedido.descuentos)}</span></div>}
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Impuestos (19%)</span><span className="font-medium text-neutral-800 tabular-nums">{fmt(pedido.impuestos)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Envío</span><span className="font-medium text-neutral-800 tabular-nums">{fmt(pedido.costoEnvio)}</span></div>
                  <div className="border-t border-neutral-200 pt-2.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-700">Total pedido</span>
                    <span className="text-lg font-bold text-primary-600 tabular-nums">{fmt(pedido.montoTotal)}</span>
                  </div>
                </div>
              </CollapsibleCard>
            </div>

            <div className="space-y-5">
              <Card size="sm">
                <CardContent className="!py-4 !px-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Seller</p><p className="text-sm font-medium text-neutral-900 mt-0.5">{pedido.seller}</p></div>
                    <div><p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Canal</p><p className="text-sm font-medium text-neutral-900 mt-0.5">{pedido.canalVenta}</p></div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Método envío</p>
                      <p className="text-sm font-medium text-neutral-700 mt-0.5 flex items-center gap-1">
                        {pedido.metodoEnvio === "Retiro en Tienda" ? <Store className="w-3.5 h-3.5 text-purple-500" /> : <Truck className="w-3.5 h-3.5 text-blue-500" />}
                        {pedido.metodoEnvio}
                      </p>
                    </div>
                    <div><p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Bultos</p><p className="text-sm font-medium text-neutral-900 mt-0.5">{pedido.bultos}</p></div>
                    <div><p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Fecha creación</p><p className="text-xs text-neutral-600 mt-0.5">{fmtDate(pedido.fechaCreacion)}</p></div>
                    <div><p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Fecha estimada</p><p className="text-xs text-neutral-600 mt-0.5">{pedido.fechaEstimada ? fmtDate(pedido.fechaEstimada) : "—"}</p></div>
                  </div>
                  {pedido.notas && (
                    <div className="border-t border-neutral-100 pt-3">
                      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Notas</p>
                      <p className="text-xs text-neutral-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">{pedido.notas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card size="sm">
                <CardContent className="!py-4 !px-4">
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Productos ({pedido.productos.length})</p>
                  <div className="space-y-2">
                    {pedido.productos.slice(0, 3).map(p => (
                      <div key={p.sku} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-700 truncate flex-1">{p.nombre}</span>
                        <span className="text-neutral-500 ml-2">×{p.cantidad}</span>
                      </div>
                    ))}
                    {pedido.productos.length > 3 && (
                      <button onClick={() => setActiveTab("productos")} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Ver todos ({pedido.productos.length})</button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ─── PRODUCTOS ─── */}
        {activeTab === "productos" && (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">SKU</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Producto</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700">Cantidad</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700">Precio unit.</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700">Subtotal</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-700">Redist.</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos.map(p => (
                  <tr key={p.sku} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                    <td className="py-2 px-2 text-xs font-mono text-neutral-600">{p.sku}</td>
                    <td className="py-2 px-2 text-sm font-medium text-neutral-900">{p.nombre}</td>
                    <td className="py-2 px-2 text-sm text-right font-mono">{p.cantidad}</td>
                    <td className="py-2 px-2 text-sm text-right tabular-nums">{fmt(p.precioUnitario)}</td>
                    <td className="py-2 px-2 text-sm text-right font-semibold tabular-nums">{fmt(p.cantidad * p.precioUnitario)}</td>
                    <td className="py-2 px-2 text-center">
                      {p.requiereRedistribucion ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full"><ArrowLeftRight className="w-3 h-3" /> Sí</span>
                      ) : <span className="text-xs text-neutral-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200 bg-neutral-50">
                  <td colSpan={4} className="py-2 px-2 text-sm font-semibold text-neutral-700 text-right">Total</td>
                  <td className="py-2 px-2 text-sm font-bold text-neutral-900 text-right tabular-nums">{fmt(pedido.montoTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ─── DOCUMENTOS ─── */}
        {activeTab === "documentos" && (
          <div className="space-y-4">
            {pedido.checklist.length > 0 && (
              <Card size="sm">
                <CardContent className="!py-4 !px-4">
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Checklist {pedido.canalVenta}</p>
                  <div className="space-y-2">
                    {pedido.checklist.map(item => (
                      <div key={item.id} className={`flex items-center gap-2 text-sm ${item.completado ? "text-green-700" : "text-neutral-600"}`}>
                        {item.completado ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-neutral-300 flex-shrink-0" />}
                        <span>{item.requisito}</span>
                        <span className="text-[11px] text-neutral-400 ml-auto">{item.obligatorio ? "Obligatorio" : "Opcional"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <DocumentRepository documentos={pedido.documentos} onUpload={() => showToast({ message: "Documento subido exitosamente", type: "success" })} readOnly={isTerminal} />
          </div>
        )}

        {/* ─── REDISTRIBUCIÓN ─── */}
        {activeTab === "redistribucion" && (
          <RedistribucionTracker redistribuciones={localRedist} onConfirmRecepcion={viewMode === "operador" ? handleConfirmRecepcion : undefined} />
        )}

        {/* ─── HISTORIAL ─── */}
        {activeTab === "historial" && (
          <div className="space-y-0">
            {localTimeline.length > 0 ? (
              <div className="relative">
                <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-neutral-100" />
                {localTimeline.map(evt => (
                  <div key={evt.id} className="flex items-start gap-3 py-3 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      evt.tipo === "creacion" ? "bg-sky-50" :
                      evt.tipo === "validacion" ? "bg-green-50" :
                      evt.tipo === "cancelacion" ? "bg-red-50" :
                      evt.tipo === "redistribucion" ? "bg-orange-50" :
                      evt.tipo === "entrega" ? "bg-green-50" :
                      "bg-neutral-100"
                    }`}>
                      {evt.tipo === "creacion" ? <Inbox className="w-4 h-4 text-sky-500" /> :
                       evt.tipo === "validacion" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                       evt.tipo === "cancelacion" ? <Ban className="w-4 h-4 text-red-500" /> :
                       evt.tipo === "redistribucion" ? <ArrowLeftRight className="w-4 h-4 text-orange-500" /> :
                       evt.tipo === "entrega" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                       <Clock className="w-4 h-4 text-neutral-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800">{evt.titulo}</p>
                      {evt.descripcion && <p className="text-xs text-neutral-500 mt-0.5">{evt.descripcion}</p>}
                      <p className="text-[11px] text-neutral-400 mt-0.5">{fmtDate(evt.timestamp)} · {evt.usuario ?? "Sistema"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-8">Sin eventos registrados</p>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODALS (Etapa 5) ═══ */}

      {/* Cancel modal */}
      <AlertModal
        open={cancelOpen}
        onClose={() => { setCancelOpen(false); setCancelMotivo(""); }}
        icon={Ban}
        variant="danger"
        title="Cancelar pedido B2B"
        subtitle={`¿Estás seguro de cancelar ${pedido.idAmplifica}?`}
        confirm={{ label: "Cancelar pedido", onClick: handleCancel }}
        cancelLabel="Volver"
      >
        <div className="space-y-3">
          {needsSupervisor && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              ⚠️ Este pedido está en preparación. Se requiere aprobación del supervisor.
            </div>
          )}
          {hasActiveRedist && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
              Hay redistribuciones activas que serán canceladas. El stock reservado en origen y destino será liberado.
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Motivo de cancelación</label>
            <textarea
              value={cancelMotivo}
              onChange={e => setCancelMotivo(e.target.value)}
              placeholder="Describe el motivo de la cancelación..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none resize-none"
            />
          </div>
        </div>
      </AlertModal>

      {/* Advance state confirmation modal (QW-3) */}
      {(() => {
        const transitions: Partial<Record<B2BStatus, B2BStatus>> = {
          "Validado": "En preparación",
          "En preparación": "Empacado",
          "Empacado": pedido.metodoEnvio === "Retiro en Tienda" ? "Listo para retiro" : "Despachado",
          "Despachado": "Entregado",
          "Entrega fallida": "Despachado",
        };
        const nextEstado = transitions[localEstado];
        return (
          <AlertModal
            open={showAdvanceModal}
            onClose={() => setShowAdvanceModal(false)}
            icon={CheckCircle2}
            variant="warning"
            title="Confirmar cambio de estado"
            subtitle={`Pedido ${pedido.idAmplifica}`}
            confirm={{
              label: advanceLabel[localEstado] ?? "Avanzar",
              onClick: () => {
                const prevEstado = localEstado;
                const prevTimeline = [...localTimeline];
                handleAdvanceState();
                setShowAdvanceModal(false);
                // Show undo toast with 5s grace period
                const transitions: Partial<Record<B2BStatus, B2BStatus>> = {
                  "Validado": "En preparación",
                  "En preparación": "Empacado",
                  "Empacado": pedido.metodoEnvio === "Retiro en Tienda" ? "Listo para retiro" : "Despachado",
                  "Despachado": "Entregado",
                  "Entrega fallida": "Despachado",
                };
                const newEstado = transitions[prevEstado];
                showToast({
                  message: `Estado avanzado a "${newEstado ?? "siguiente"}"`,
                  type: "success",
                  undoAction: () => {
                    setLocalEstado(prevEstado);
                    setLocalTimeline(prevTimeline);
                  },
                });
              },
            }}
            cancelLabel="Cancelar"
          >
            <p>
              El pedido pasará de <strong>{localEstado}</strong> a <strong>{nextEstado ?? "siguiente estado"}</strong>.
              Tendrás 5 segundos para deshacer el cambio.
            </p>
          </AlertModal>
        );
      })()}

      {/* Retiro en Tienda confirmation modal (Etapa 5) */}
      {retiroOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4" onClick={() => setRetiroOpen(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setRetiroOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex justify-center sm:justify-start mb-4">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                <UserCheck className="w-7 h-7 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1 text-center sm:text-left">Confirmar retiro en tienda</h3>
            <p className="text-sm text-neutral-500 mb-5 text-center sm:text-left">Registra los datos de quien retira el pedido {pedido.idAmplifica}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Nombre de quien retira <span className="text-red-500">*</span></label>
                <input
                  value={retiroNombre} onChange={e => setRetiroNombre(e.target.value)} placeholder="Nombre completo"
                  className="w-full h-9 px-3 border border-neutral-300 rounded-md text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">RUT <span className="text-red-500">*</span></label>
                <input
                  value={retiroRut} onChange={e => setRetiroRut(e.target.value)} placeholder="12.345.678-9"
                  className="w-full h-9 px-3 border border-neutral-300 rounded-md text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button variant="secondary" size="lg" onClick={() => setRetiroOpen(false)} className="w-full sm:flex-1">Cancelar</Button>
              <Button variant="primary" size="lg" onClick={handleConfirmRetiro} disabled={!retiroNombre || !retiroRut} className="w-full sm:flex-1">
                Confirmar retiro
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ─────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in fade-in slide-in-from-bottom-4 duration-200 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800"
            : toast.type === "error" ? "bg-red-50 border-red-200 text-red-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            : toast.type === "error" ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            : <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => { toast.undoAction?.(); setToast(null); }}
              className="ml-1 text-xs font-semibold underline hover:no-underline"
            >
              Deshacer
            </button>
          )}
          <button onClick={() => setToast(null)} className="ml-2 text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
