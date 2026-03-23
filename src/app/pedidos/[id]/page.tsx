"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Copy, Check, LayoutDashboard, Truck, Package, Clock,
  AlertTriangle, Timer, Zap, CopyPlus, Share2, MessageCircle,
  Ban, Eye, Pencil, MapPin, Phone, Mail, ExternalLink,
  ChevronDown, ChevronUp, BellOff, BellRing, CheckCircle2,
  User, Users, Plus, RefreshCw, StickyNote, Monitor, Smartphone, X, Printer,
  ClipboardList, ClipboardCheck, Receipt, Search,
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
import FormField from "@/components/ui/FormField";
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

  // Auto-generate SLA data when slaTimeline is not provided
  const slaTimeline = p.slaTimeline ?? (() => {
    const auto: Record<string, { fechaInicio?: string; fechaFin?: string; fechaProgramada?: string; rangoHorario?: string; slaStatus: "cumplido" | "pendiente" | "atrasado" | "en_riesgo" }> = {};
    // Parse base date from fechaCreacion (e.g. "Hoy a las 22:15", "Ayer a las 18:10", "16/03/2026 14:20", or ISO)
    let baseDate: Date;
    try {
      const fc = p.fechaCreacion;
      const timePart = fc.match(/(\d{1,2}):(\d{2})/);
      if (fc.includes("Hoy")) {
        baseDate = new Date();
        if (timePart) { baseDate.setHours(parseInt(timePart[1]), parseInt(timePart[2]), 0, 0); }
      } else if (fc.includes("Ayer")) {
        baseDate = new Date(Date.now() - 86400000);
        if (timePart) { baseDate.setHours(parseInt(timePart[1]), parseInt(timePart[2]), 0, 0); }
      } else {
        // Try "dd/mm/yyyy HH:mm" format first
        const ddmmMatch = fc.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
        if (ddmmMatch) {
          baseDate = new Date(parseInt(ddmmMatch[3]), parseInt(ddmmMatch[2]) - 1, parseInt(ddmmMatch[1]), parseInt(ddmmMatch[4]), parseInt(ddmmMatch[5]));
        } else {
          baseDate = new Date(fc);
        }
        if (isNaN(baseDate.getTime())) baseDate = new Date();
      }
    } catch { baseDate = new Date(); }

    const addH = (d: Date, h: number) => new Date(d.getTime() + h * 3600000).toISOString();
    const slaFor = (step: number): "cumplido" | "pendiente" | "atrasado" | "en_riesgo" => {
      if (step < currentIdx) return "cumplido";
      if (step === currentIdx) return p.conAtraso ? "atrasado" : "pendiente";
      return "pendiente";
    };

    // Recepción: base date
    auto["Recepción"] = { fechaInicio: baseDate.toISOString(), slaStatus: slaFor(0) };
    // Validación: +1 min
    auto["Validación"] = { fechaInicio: addH(baseDate, 0.02), fechaFin: addH(baseDate, 0.03), slaStatus: slaFor(1) };
    // Preparación: +2h planned window
    auto["Preparación"] = currentIdx > 2
      ? { fechaInicio: addH(baseDate, 2), fechaFin: addH(baseDate, 6), slaStatus: slaFor(2) }
      : { fechaProgramada: addH(baseDate, 2), rangoHorario: `${fmtShortTime(addH(baseDate, 2))} - ${fmtShortTime(addH(baseDate, 6))}`, slaStatus: slaFor(2) };
    // Empaque: +8h
    auto["Empaque"] = currentIdx > 3
      ? { fechaInicio: addH(baseDate, 8), slaStatus: slaFor(3) }
      : { fechaProgramada: addH(baseDate, 8), slaStatus: slaFor(3) };
    // Retiro: +24h
    auto["Retiro"] = currentIdx > 4
      ? { fechaInicio: addH(baseDate, 24), slaStatus: slaFor(4) }
      : { fechaProgramada: addH(baseDate, 24), slaStatus: slaFor(4) };
    // Entrega: +48h with range
    auto["Entrega"] = { fechaProgramada: addH(baseDate, 48), rangoHorario: "15:00 – 20:00 hrs", slaStatus: slaFor(5) };

    return auto;
  })();

  return stateLabels.map((label, i) => {
    let status: TimelineStep["status"] = "pending";
    if (p.estadoPreparacion === "Cancelado") {
      status = i === 0 ? "done" : "pending";
    } else if (i < currentIdx) {
      status = "done";
    } else if (i === currentIdx) {
      status = p.conAtraso ? "late" : "active";
    }

    const slaData = slaTimeline[label];
    let fechaLineas: string[] | undefined;
    let sla: TimelineStep["sla"] | undefined;

    if (slaData) {
      const lines: string[] = [];

      if (slaData.fechaInicio && slaData.fechaFin) {
        lines.push(`${fmtShortDate(slaData.fechaInicio)} ${fmtShortTime(slaData.fechaInicio)}`);
        lines.push(`/ ${fmtShortDate(slaData.fechaFin)} ${fmtShortTime(slaData.fechaFin)}`);
      } else if (slaData.fechaInicio) {
        lines.push(`${fmtShortDate(slaData.fechaInicio)} ${fmtShortTime(slaData.fechaInicio)}`);
      } else if (slaData.fechaProgramada) {
        if (slaData.rangoHorario) {
          lines.push(fmtShortDate(slaData.fechaProgramada));
          lines.push(slaData.rangoHorario);
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

// ─── Mini Timeline (3 visible steps with nav arrows) ────────────────────────
function MiniTimeline({ steps, offset, onOffsetChange }: { steps: TimelineStep[]; offset: number | null; onOffsetChange: (v: number | null) => void }) {
  const activeIdx = steps.findIndex(s => s.status === "active" || s.status === "late");
  const currentIdx = activeIdx >= 0 ? activeIdx : steps.filter(s => s.status === "done").length - 1;
  const total = steps.length;

  let defaultStart: number;
  if (currentIdx <= 0) defaultStart = 0;
  else if (currentIdx >= total - 1) defaultStart = Math.max(0, total - 3);
  else defaultStart = currentIdx - 1;

  const start = offset ?? defaultStart;
  const end = Math.min(start + 3, total);
  const visible = steps.slice(start, end);
  const canPrev = start > 0;
  const canNext = end < total;

  // Determine current phase based on active step
  const activeStep = steps.find(s => s.status === "active" || s.status === "late");
  const phaseMap: Record<string, string> = {
    "Recepción": "Recepción", "Validación": "Validación",
    "Preparación": "Preparación", "Empaque": "Preparación",
    "Retiro": "Despacho", "Entrega": "Entrega",
  };
  const phaseName = activeStep ? phaseMap[activeStep.label] ?? activeStep.label : "Completado";
  const phaseColor = activeStep?.status === "late" ? "text-red-600" : activeStep ? "text-primary-600" : "text-green-600";
  const phaseSla = activeStep?.sla;
  const phaseDates = activeStep?.fechaLineas;

  const iconMap: Record<string, typeof Package> = {
    "Recepción": Package, "Validación": ClipboardCheck, "Preparación": Package,
    "Empaque": Package, "Retiro": Truck, "Entrega": Check,
  };
  const stepStyle: Record<string, { bg: string; border: string; icon: string; ring: string }> = {
    done:    { bg: "bg-neutral-500", border: "border-neutral-500", icon: "text-white", ring: "" },
    active:  { bg: "bg-sky-500", border: "border-sky-500", icon: "text-white", ring: "ring-4 ring-sky-100" },
    late:    { bg: "bg-red-500", border: "border-red-500", icon: "text-white", ring: "ring-4 ring-red-100" },
    pending: { bg: "bg-white", border: "border-neutral-300", icon: "text-neutral-300", ring: "" },
  };

  return (
    <Card size="sm">
      <CardContent className="!py-3 !px-3">
        {/* Phase header */}
        <div className="flex items-center justify-between mb-3 px-8">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${phaseColor}`}>Fase {phaseName}</p>
            {phaseDates && phaseDates.length > 0 && (
              <p className="text-[10px] text-neutral-500 mt-0.5">SLA: {phaseDates.join(" ")}</p>
            )}
          </div>
          {phaseSla && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              phaseSla.status === "cumplido" ? "bg-green-50 text-green-700" :
              phaseSla.status === "atrasado" ? "bg-red-50 text-red-600" :
              phaseSla.status === "en_riesgo" ? "bg-amber-50 text-amber-700" :
              "bg-neutral-50 text-neutral-500"
            }`}>
              {phaseSla.status === "cumplido" ? <><CheckCircle2 className="w-3 h-3" /> Cumplido</> :
               phaseSla.status === "atrasado" ? <><AlertTriangle className="w-3 h-3" /> Atrasado</> :
               phaseSla.status === "en_riesgo" ? <><Clock className="w-3 h-3" /> En riesgo</> :
               <><Clock className="w-3 h-3" /> Pendiente</>}
            </span>
          )}
        </div>

        {/* Steps row */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => canPrev && onOffsetChange(start - 1)}
            disabled={!canPrev}
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${canPrev ? "hover:bg-neutral-100 text-neutral-500" : "text-neutral-200 cursor-default"}`}
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </button>

          <div className="flex-1 flex items-start justify-between relative px-2">
            {/* Line — centered on icons (label ~16px + mb-1 4px + half icon 16px = 36px) */}
            <div className="absolute top-[36px] left-[24px] right-[24px] h-0.5 bg-neutral-200" />
            <div className="absolute top-[36px] left-[24px] h-0.5 bg-neutral-500 transition-all" style={{ width: visible.length > 1 ? `${((visible.filter(s => s.status === "done").length) / (visible.length - 1)) * 100}%` : "0%" }} />

            {visible.map((step) => {
              const s = stepStyle[step.status] ?? stepStyle.pending;
              const StepIcon = step.status === "done" ? Check : (iconMap[step.label] ?? Package);
              return (
                <div key={step.label} className="flex flex-col items-center relative z-10" style={{ flex: "1 1 0%" }}>
                  <p className={`text-[10px] font-medium mb-1 text-center leading-tight ${
                    step.status === "active" || step.status === "late" ? "text-neutral-900 font-semibold" :
                    step.status === "done" ? "text-neutral-600" : "text-neutral-400"
                  }`}>{step.label}</p>
                  {/* Icon circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.bg} ${s.border} border ${s.ring} transition-all`}>
                    <StepIcon className={`w-4 h-4 ${s.icon}`} />
                  </div>
                  {/* Time */}
                  {step.fechaLineas?.[0] && (
                    <p className={`text-[9px] tabular-nums text-center mt-1 ${
                      step.status === "done" ? "text-neutral-500" :
                      step.status === "late" ? "text-red-500" : "text-neutral-400"
                    }`}>
                      {step.fechaLineas[0].includes(":") ? step.fechaLineas[0].split(" ").pop() : step.fechaLineas[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => canNext && onOffsetChange(start + 1)}
            disabled={!canNext}
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${canNext ? "hover:bg-neutral-100 text-neutral-500" : "text-neutral-200 cursor-default"}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mx-8 mt-2.5 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-neutral-300 rounded-full transition-all" style={{ width: `${Math.round(((currentIdx + 1) / total) * 100)}%` }} />
        </div>
        <p className="text-center text-[9px] text-neutral-400 mt-1">{start + 1}–{end} de {total}</p>
      </CardContent>
    </Card>
  );
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

  // View mode toggle
  const [viewMode, setViewMode] = useState<"actual" | "mejorada">("mejorada");

  // Timeline navigation offset for compact 3-step view
  const [timelineOffset, setTimelineOffset] = useState<number | null>(null);

  // Tags modal
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const TAG_OPTIONS = [
    "Falta stock", "En redistribución", "Confirmando dirección", "En espera seller",
    "En espera consumidor", "En devolución", "Devuelto", "Reposición pendiente",
    "Problema entrega", "Siniestrado courier", "Requiere revisión", "Modificando Pedido",
    "Reagendado", "Prioridad alta", "Frágil",
  ];
  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // Status change modal (vista actual)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<"preparacion" | "envio">("preparacion");
  const [statusModalValue, setStatusModalValue] = useState("");

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
  const [addressSavedToast, setAddressSavedToast] = useState(false);

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
    { label: "Modo Supervisión", icon: CheckCircle2, onClick: () => alert("Modo supervisión activado (mock)") },
    { label: "Anotar", icon: StickyNote, onClick: () => alert("Agregar nota interna (mock)") },
    { label: "Sincronizar", icon: RefreshCw, onClick: () => alert("Sincronizando con canal de venta (mock)") },
    { label: "Nuevo Evento", icon: Plus, onClick: () => alert("Crear evento manual (mock)") },
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

  // Fields that affect courier quotation (physical address)
  const REQUOTE_FIELDS: (keyof DireccionEnvio)[] = ["calle", "numero", "depto", "comuna", "region"];

  const handleAddressChange = (field: keyof DireccionEnvio, value: string) => {
    if (!addressDraft) return;
    setAddressDraft({ ...addressDraft, [field]: value });
    setIsDirty(true);
    // Only invalidate courier when physical address changes
    if (REQUOTE_FIELDS.includes(field)) {
      setRequiresRequote(true);
    }
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
    // Show success toast
    setAddressSavedToast(true);
    setTimeout(() => setAddressSavedToast(false), 3000);
  };

  const addr = editingAddress && addressDraft ? addressDraft : pedido.destinatario;

  // Mock requote action
  const triggerRequote = () => {
    setRequiresRequote(false);
    alert("Recotización iniciada (mock)");
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-32 lg:pb-6 space-y-4 sm:space-y-5">
      {/* ── Address saved toast ── */}
      {addressSavedToast && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-3 bg-white border border-green-200 rounded-xl shadow-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-neutral-800">Dirección actualizada</p>
          <button onClick={() => setAddressSavedToast(false)} className="text-neutral-400 hover:text-neutral-600 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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
          {/* View mode toggle */}
          <div className={`flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 mt-2 w-fit ${editingAddress ? "opacity-40 pointer-events-none" : ""}`}>
            <button
              onClick={() => setViewMode("actual")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === "actual"
                  ? "bg-white text-neutral-800 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Vista actual
            </button>
            <button
              onClick={() => setViewMode("mejorada")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === "mejorada"
                  ? "bg-white text-neutral-800 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Vista mejorada
            </button>
          </div>
        </div>
        <div className={`flex items-center gap-2 flex-shrink-0 ${editingAddress ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Primary CTA — contextual based on state */}
          {isDirty ? null
           : requiresRequote ? (
            <Button variant="primary" size="md" iconLeft={<RefreshCw className="w-4 h-4" />} onClick={triggerRequote} className="bg-amber-500 hover:bg-amber-600 border-amber-500 hover:border-amber-600">
              Recotizar
            </Button>
          ) : pedido.estadoPreparacion !== "Entregado" && pedido.estadoPreparacion !== "Cancelado" ? (
            <Button variant="primary" size="md" onClick={() => {
              setStatusModalType("preparacion");
              const next = pedido.estadoPreparacion === "Pendiente" ? "Validado" :
                pedido.estadoPreparacion === "Validado" ? "En preparación" :
                pedido.estadoPreparacion === "En preparación" ? "Empacado" :
                pedido.estadoPreparacion === "Por empacar" ? "Empacado" :
                pedido.estadoPreparacion === "Empacado" ? "Listo para retiro" :
                pedido.estadoPreparacion === "Listo para retiro" ? "Entregado" : "";
              setStatusModalValue(next);
              setStatusModalOpen(true);
            }}>
              {pedido.estadoPreparacion === "Pendiente" ? "Validar pedido" :
               pedido.estadoPreparacion === "Validado" ? "Iniciar preparación" :
               pedido.estadoPreparacion === "En preparación" ? "Marcar empacado" :
               pedido.estadoPreparacion === "Por empacar" ? "Marcar empacado" :
               pedido.estadoPreparacion === "Empacado" ? "Listo para retiro" :
               pedido.estadoPreparacion === "Listo para retiro" ? "Marcar entregado" : "Avanzar"}
            </Button>
          ) : pedido.cotizacion?.trackingNumber ? (
            <Button variant="secondary" size="md" iconLeft={<ExternalLink className="w-4 h-4" />} onClick={() => alert("Ver seguimiento (mock)")}>
              Ver seguimiento
            </Button>
          ) : null}
          <Button variant="secondary" size="md" iconLeft={<Eye className="w-4 h-4" />} onClick={() => setSupportOpen(true)}>
            Vista rápida
          </Button>
          <QuickActionsMenu actions={quickActions} />
        </div>
      </div>

      {/* ── Tabs (hidden in "actual" mode — all content shown at once) ── */}
      <div className={`flex border-b border-neutral-200 ${viewMode === "actual" ? "hidden" : ""}`}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => !editingAddress && switchTab(tab.key)}
              disabled={editingAddress}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                editingAddress && !isActive ? "opacity-40 cursor-not-allowed" : ""
              } ${
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
        {viewMode === "actual" && (
          <div className="space-y-5">
            <MiniTimeline steps={timelineSteps} offset={timelineOffset} onOffsetChange={setTimelineOffset} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            {/* LEFT: Datos del Pedido + Envío + Método entrega */}
            <div className="space-y-5">
              {/* Datos del Pedido — with actionable fields */}
              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Datos del Pedido</CardTitle></CardHeader>
                <CardContent>
                  <div className="divide-y divide-neutral-100">
                    {/* Estado Preparación + next state button */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-1.5">Estado de Preparación</p>
                      <div className="flex items-center justify-between">
                        <PedidoStatusBadge status={pedido.estadoPreparacion} />
                        <Button variant="secondary" size="sm" className="text-[10px]" onClick={() => {
                          setStatusModalType("preparacion");
                          setStatusModalValue(pedido.estadoPreparacion === "Pendiente" ? "Validado" :
                            pedido.estadoPreparacion === "Validado" ? "Empacado" :
                            pedido.estadoPreparacion === "En preparación" ? "Empacado" :
                            pedido.estadoPreparacion === "Por empacar" ? "Empacado" :
                            pedido.estadoPreparacion === "Empacado" ? "Listo para retiro" :
                            pedido.estadoPreparacion === "Listo para retiro" ? "Entregado" : "");
                          setStatusModalOpen(true);
                        }}>
                          {pedido.estadoPreparacion === "Pendiente" ? "Validar" :
                           pedido.estadoPreparacion === "Validado" ? "Empacado" :
                           pedido.estadoPreparacion === "En preparación" ? "Empacado" :
                           pedido.estadoPreparacion === "Por empacar" ? "Empacado" :
                           pedido.estadoPreparacion === "Empacado" ? "Listo retiro" :
                           pedido.estadoPreparacion === "Listo para retiro" ? "Entregado" : "—"}
                        </Button>
                      </div>
                    </div>
                    {/* Estado Entrega + Modificar estado */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-1.5">Estado de Entrega</p>
                      <div className="flex items-center justify-between">
                        <EnvioStatusBadge status={pedido.estadoEnvio} />
                        <Button variant="secondary" size="sm" className="text-[10px]" onClick={() => {
                          setStatusModalType("envio");
                          setStatusModalValue(pedido.estadoEnvio);
                          setStatusModalOpen(true);
                        }}>Modificar estado</Button>
                      </div>
                    </div>
                    {/* Tags */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-1.5">Tags</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(pedido.tags ?? []).map((t, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">{t}</span>
                        ))}
                        <button className="w-5 h-5 rounded border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* Etiqueta de Envío upload */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-1.5">Etiqueta de Envío</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-500 bg-neutral-50">
                          <span className="font-medium text-neutral-700">Seleccionar archivo</span>
                          <span className="text-neutral-400">Sin archivos seleccionados</span>
                        </div>
                        <Button variant="primary" size="sm" className="text-[10px] flex-shrink-0">Cargar</Button>
                      </div>
                    </div>
                    {/* Tracking — editable input */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Tracking</p>
                      <input
                        type="text"
                        defaultValue={pedido.cotizacion?.trackingNumber ?? ""}
                        className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 font-mono focus:outline-none focus:border-primary-400 bg-transparent"
                      />
                    </div>
                    {/* ID — read-only */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">ID</p>
                      <input type="text" value={pedido.idAmplifica} readOnly className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 font-mono bg-transparent" />
                    </div>
                    {/* Cliente — read-only highlighted */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Cliente</p>
                      <div className="border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                        <p className="text-sm text-green-800">{pedido.seller}</p>
                      </div>
                    </div>
                    {/* ID de Origen */}
                    {(pedido.idOrigen || pedido.idExterno) && (
                      <div className="py-2.5">
                        <p className="text-[10px] text-neutral-400 mb-0.5">ID de Origen</p>
                        <input type="text" value={pedido.idOrigen || pedido.idExterno || ""} readOnly className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 font-mono bg-transparent" />
                      </div>
                    )}
                    {/* Método de Venta — dropdown */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Método de Venta</p>
                      <select className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 bg-transparent focus:outline-none focus:border-primary-400 appearance-none cursor-pointer">
                        <option>{pedido.canalVenta ?? "—"}</option>
                        <option>Shopify</option>
                        <option>MercadoLibre</option>
                        <option>Falabella</option>
                        <option>Woocommerce</option>
                      </select>
                    </div>
                    {/* Método de Pago — dropdown */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Método de Pago</p>
                      <select className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 bg-transparent focus:outline-none focus:border-primary-400 appearance-none cursor-pointer">
                        <option>{pedido.metodoPago ?? "Selecciona un método"}</option>
                        <option>Transferencia</option>
                        <option>Tarjeta de crédito</option>
                        <option>Tarjeta de débito</option>
                        <option>Efectivo</option>
                      </select>
                    </div>
                    {/* Fecha — warning style */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Fecha</p>
                      <div className="border-0 border-b border-red-300 bg-red-50/50 px-0 py-1.5">
                        <p className="text-sm text-red-700 font-mono">{pedido.fechaCreacion}</p>
                      </div>
                    </div>
                    {/* N° Etiqueta Manual */}
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">N° de Etiqueta Manual</p>
                      <input
                        type="text"
                        defaultValue={pedido.cotizacion?.trackingNumber ?? ""}
                        className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 font-mono focus:outline-none focus:border-primary-400 bg-transparent"
                      />
                    </div>
                    {/* Muestra promocional — interactive checkbox */}
                    <div className="py-2.5 flex items-center gap-2">
                      <input type="checkbox" defaultChecked={pedido.muestraPromocional ?? false} className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-200" />
                      <span className="text-sm text-neutral-600">Este pedido es una muestra promocional</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Datos del Envío — with editable inputs + address search */}
              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Datos del Envío</CardTitle></CardHeader>
                <CardContent>
                  <div className="divide-y divide-neutral-100">
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Nombre Destinatario</p>
                      <input type="text" defaultValue={pedido.destinatario.nombre} className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 focus:outline-none focus:border-primary-400 bg-transparent" />
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Correo Destinatario</p>
                      <input type="email" defaultValue={pedido.destinatario.email || ""} placeholder="correo@ejemplo.cl" className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 focus:outline-none focus:border-primary-400 bg-transparent" />
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Teléfono Destinatario</p>
                      <input type="tel" defaultValue={pedido.destinatario.telefono || ""} placeholder="+56 9..." className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 focus:outline-none focus:border-primary-400 bg-transparent" />
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Paquete</p>
                      <select defaultValue={pedido.paquete} className="w-full border-0 border-b border-neutral-200 px-0 py-1.5 text-sm text-neutral-800 bg-transparent focus:outline-none focus:border-primary-400 appearance-none cursor-pointer">
                        <option>{pedido.paquete}</option>
                        <option>Caja Ultra Chica</option>
                        <option>Caja Chica</option>
                        <option>Caja Mediana</option>
                        <option>Caja Grande</option>
                        <option>Sobre</option>
                      </select>
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Volumen Total</p>
                      <div className="border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                        <p className="text-sm text-green-700">{pedido.volumenTotal}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address search — predictive */}
                  <div className="mt-4 mb-3">
                    <p className="text-[10px] text-neutral-400 mb-0.5">Buscar Dirección</p>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Search className="w-4 h-4 text-neutral-400" /></div>
                      <input
                        type="text"
                        placeholder="Escribe una dirección para buscar..."
                        defaultValue={`${pedido.destinatario.calle} ${pedido.destinatario.numero}, ${pedido.destinatario.comuna}`}
                        className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      />
                    </div>
                  </div>

                  {/* Address fields — auto-filled from search */}
                  <div className="divide-y divide-neutral-100">
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Calle o Avenida</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                          <p className="text-sm text-green-800">{pedido.destinatario.calle}</p>
                        </div>
                        <button className="text-neutral-400 hover:text-neutral-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Número</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                          <p className="text-sm text-green-800">{pedido.destinatario.numero}</p>
                        </div>
                        <button className="text-neutral-400 hover:text-neutral-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Complemento</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                          <p className="text-sm text-green-800">{pedido.destinatario.depto || "—"}</p>
                        </div>
                        <button className="text-neutral-400 hover:text-neutral-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Comuna</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                          <p className="text-sm text-green-800">{pedido.destinatario.comuna}</p>
                        </div>
                        <button className="text-neutral-400 hover:text-neutral-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="py-2.5">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Región</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-0 border-b border-green-300 bg-green-50/50 px-0 py-1.5">
                          <p className="text-sm text-green-800">{pedido.destinatario.region}</p>
                        </div>
                        <button className="text-neutral-400 hover:text-neutral-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>

                  {/* Validation status */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                    <Check className="w-3.5 h-3.5" />
                    <span>La Dirección se ha Validado Automáticamente</span>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2 text-[10px]">Forzar Validación de Dirección</Button>

                  {/* Map */}
                  <div className="mt-3 rounded-lg overflow-hidden border border-neutral-200">
                    <div className="bg-neutral-100 h-44 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-neutral-100" />
                      <div className="relative text-center">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center mx-auto mb-1 shadow-lg">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs font-medium text-neutral-700">{pedido.destinatario.comuna}, {pedido.destinatario.region}</p>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">-33.4489, -70.6483</p>
                      </div>
                    </div>
                    <div className="flex border-t border-neutral-200">
                      <button className="flex-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border-r border-neutral-200">Mapa</button>
                      <button className="flex-1 px-3 py-1.5 text-xs text-neutral-500 bg-neutral-50">Satélite</button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Método de entrega */}
              {pedido.cotizacion && (
                <Card size="sm">
                  <CardHeader><CardTitle className="text-base">Método de entrega</CardTitle></CardHeader>
                  <CardContent>
                    <div className="py-2">
                      <p className="text-[10px] text-neutral-400 mb-0.5">Servicio de Courier</p>
                      <p className="text-sm text-neutral-800">{pedido.cotizacion.courier} — {pedido.cotizacion.servicio}</p>
                    </div>
                    <div className="mt-3 bg-primary-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium">
                      Cotización Actual ({pedido.cotizacion.courier}) — {fmt(pedido.cotizacion.costoNeto)}
                    </div>
                    <Button variant="secondary" size="sm" className="mt-3">Abrir Ticket</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT: Cronología + Fotos + Productos + Integraciones */}
            <div className="space-y-5">
              {/* Cronología del pedido */}
              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Cronología del pedido</CardTitle></CardHeader>
                <CardContent>
                  <GanttTimeline events={pedido.timeline} />
                </CardContent>
              </Card>

              {/* Registros fotográficos */}
              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Registros fotográficos del picking</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-neutral-100 h-48 flex items-center justify-center border border-neutral-200">
                    <div className="text-center">
                      <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">Sin fotos registradas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Productos del Pedido */}
              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Productos del Pedido</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-left text-xs text-neutral-400 font-medium pb-2">Producto</th>
                        <th className="text-right text-xs text-neutral-400 font-medium pb-2">Precio</th>
                        <th className="text-right text-xs text-neutral-400 font-medium pb-2">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.productos.map(p => (
                        <tr key={p.id} className="border-b border-neutral-50">
                          <td className="py-2">
                            <p className="text-neutral-800 font-medium">{p.nombre}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">SKU: {p.sku}</p>
                          </td>
                          <td className="py-2 text-right tabular-nums">{fmt(p.precioUnitario)}</td>
                          <td className="py-2 text-right tabular-nums">{p.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-200">
                        <td className="py-2 text-right font-medium text-neutral-700" colSpan={2}>Total:</td>
                        <td className="py-2 text-right font-bold tabular-nums">{fmt(pedido.montoTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>

              {/* Información de integraciones */}
              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Información de PedidosYa</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">Solicitar un nuevo rider de PedidosYa</p>
                    <Button variant="primary" size="sm">Solicitar</Button>
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader><CardTitle className="text-base">Información de UberDirect</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-500">Por el momento no hay información disponible.</p>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        )}

        {activeTab === "resumen" && viewMode === "mejorada" && (
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
            </div>

            {/* Status banner — one at a time, mutually exclusive */}
            {isDirty && requiresRequote ? (
              <DirtyBanner visible message="Dirección modificada — guarde y luego recotice el envío" />
            ) : isDirty ? (
              <DirtyBanner visible message="Tienes cambios sin guardar" />
            ) : requiresRequote ? (
              <AlertBanner
                variant="warning"
                icon={AlertTriangle}
                title="Recotización pendiente"
                description="La dirección fue actualizada. El courier y costo anterior fueron invalidados."
                action={{ label: "Recotizar ahora", onClick: triggerRequote }}
                dismissible={false}
              />
            ) : null}

            <MiniTimeline steps={timelineSteps} offset={timelineOffset} onOffsetChange={setTimelineOffset} />

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Info card — essential fields only */}
                <CollapsibleCard icon={ClipboardList} title="Datos del Pedido" description="Información general del pedido">
                    {/* Essential fields — always visible */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">ID Amplifica</p>
                        <p className="text-sm font-semibold text-neutral-800 mt-0.5 font-mono">{pedido.idAmplifica}</p>
                      </div>
                      {pedido.cotizacion?.trackingNumber && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Tracking</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-sm font-medium text-neutral-800 font-mono truncate">{pedido.cotizacion.trackingNumber}</p>
                            <CopyId text={pedido.cotizacion.trackingNumber} />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Fecha Creación</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{fmtDate(pedido.fechaCreacion)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Canal</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.canalVenta}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Tags</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(pedido.tags ?? []).map((t, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600">
                            {t}
                            <button className="text-neutral-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        <button onClick={() => setTagsModalOpen(true)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-dashed border-neutral-300 text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                          <Plus className="w-3 h-3" /> Agregar tag
                        </button>
                      </div>
                    </div>

                    {/* Collapsible extra details */}
                    <details className="mt-3 pt-3 border-t border-neutral-100 group">
                      <summary className="text-xs font-medium text-primary-600 cursor-pointer hover:text-primary-700 list-none flex items-center gap-1">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                        Ver más detalles
                      </summary>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mt-3">
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Seller</p>
                          <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.seller}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Sucursal</p>
                          <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.sucursal}</p>
                        </div>
                        {pedido.idExterno && (
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">ID Externo</p>
                            <p className="text-sm font-medium text-neutral-700 mt-0.5 font-mono">{pedido.idExterno}</p>
                          </div>
                        )}
                        {pedido.metodoPago && (
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Método de Pago</p>
                            <p className="text-sm font-medium text-neutral-700 mt-0.5">{pedido.metodoPago}</p>
                          </div>
                        )}
                        {pedido.fechaEnvio && (
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Fecha Envío</p>
                            <p className="text-sm font-medium text-neutral-700 mt-0.5">{fmtDate(pedido.fechaEnvio)}</p>
                          </div>
                        )}
                        {pedido.idOrigen && (
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">ID Origen</p>
                            <p className="text-sm font-medium text-neutral-700 mt-0.5 font-mono">{pedido.idOrigen}</p>
                          </div>
                        )}
                      </div>
                    </details>
                </CollapsibleCard>

                {/* Products preview */}
                <CollapsibleCard
                  icon={Package}
                  title={`Productos (${pedido.productos.length})`}
                  description="Detalle de productos del pedido"
                  action={
                    <span className="text-[10px] bg-primary-50 text-primary-700 rounded-full px-2 py-0.5 font-semibold">
                      {pedido.productos.reduce((s, p) => s + p.cantidad, 0)} uds.
                    </span>
                  }
                >
                    <div className="overflow-x-auto table-scroll">
                      <table className="w-full text-sm border-collapse" style={{ minWidth: "100%" }}>
                        <thead>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <th className="text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3 sticky top-0 bg-neutral-50">Producto</th>
                            <th className="text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3 sticky top-0 bg-neutral-50">SKU</th>
                            <th className="text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3 sticky top-0 bg-neutral-50">Cant.</th>
                            <th className="text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3 sticky top-0 bg-neutral-50">Precio</th>
                            <th className="text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-2.5 px-3 sticky top-0 bg-neutral-50">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {pedido.productos.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {p.imagen ? (
                                    <img src={p.imagen} alt={p.nombre} className="w-8 h-8 rounded-md object-cover bg-neutral-100 flex-shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                      <Package className="w-4 h-4 text-neutral-300" />
                                    </div>
                                  )}
                                  <p className="text-[13px] text-neutral-800 font-medium leading-snug">{p.nombre}</p>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono text-neutral-500 text-xs">{p.sku}</td>
                              <td className="py-3 px-3 text-right text-[13px] text-neutral-800 tabular-nums">{p.cantidad}</td>
                              <td className="py-3 px-3 text-right text-[13px] text-neutral-800 tabular-nums">{fmt(p.precioUnitario)}</td>
                              <td className="py-3 px-3 text-right text-[13px] font-semibold text-neutral-900 tabular-nums">{fmt(p.precioUnitario * p.cantidad)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-neutral-200 bg-neutral-50/50">
                            <td colSpan={4} className="py-3 px-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Total</td>
                            <td className="py-3 px-3 text-right text-sm font-bold text-neutral-900 tabular-nums">{fmt(pedido.montoTotal)}</td>
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
            {requiresRequote && !editingAddress && (
              <AlertBanner
                variant="warning"
                icon={AlertTriangle}
                title="Recotización pendiente"
                description="La dirección fue actualizada. El courier y costo anterior fueron invalidados."
                action={{ label: "Recotizar ahora", onClick: triggerRequote }}
                dismissible={false}
              />
            )}
            {editingAddress && isDirty && (
              <DirtyBanner
                visible
                message={requiresRequote ? "Dirección modificada — guarde y luego recotice" : "Tienes cambios sin guardar"}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {editingAddress ? (
                        <>
                          <FormField label="Nombre" value={addr.nombre} onChange={v => handleAddressChange("nombre", v)} />
                          <FormField label="Email" type="email" value={addr.email} onChange={v => handleAddressChange("email", v)} />
                          <FormField label="Teléfono" type="tel" value={addr.telefono} onChange={v => handleAddressChange("telefono", v)} />
                          <div className="flex gap-2">
                            <div className="flex-1"><FormField label="Calle" value={addr.calle} onChange={v => handleAddressChange("calle", v)} /></div>
                            <div className="w-24"><FormField label="Número" value={addr.numero} onChange={v => handleAddressChange("numero", v)} /></div>
                          </div>
                          <FormField label="Depto / Complemento" value={addr.depto ?? ""} onChange={v => handleAddressChange("depto", v)} />
                          <FormField label="Comuna" value={addr.comuna} onChange={v => handleAddressChange("comuna", v)} />
                          <FormField label="Región" value={addr.region} onChange={v => handleAddressChange("region", v)} />
                          <div className="sm:col-span-2">
                            <FormField label="Instrucciones de entrega" value={addr.instrucciones ?? ""} onChange={v => handleAddressChange("instrucciones", v)} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Nombre</p>
                            <p className="text-sm text-neutral-800 mt-0.5">{addr.nombre}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Email</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-neutral-400" />
                              <p className="text-sm text-neutral-800">{addr.email}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Teléfono</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-neutral-400" />
                              <p className="text-sm text-neutral-800">{addr.telefono}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Calle y Número</p>
                            <p className="text-sm text-neutral-800 mt-0.5">{addr.calle} {addr.numero}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Depto / Complemento</p>
                            <p className="text-sm text-neutral-800 mt-0.5">{addr.depto || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Comuna</p>
                            <p className="text-sm text-neutral-800 mt-0.5">{addr.comuna}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Región</p>
                            <p className="text-sm text-neutral-800 mt-0.5">{addr.region}</p>
                          </div>
                          {addr.instrucciones && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Instrucciones</p>
                              <div className="mt-1.5 flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2.5">
                                <MessageCircle className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-neutral-600 leading-relaxed">{addr.instrucciones}</p>
                              </div>
                            </div>
                          )}
                        </>
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
                    hideWarning={editingAddress}
                    onRequote={triggerRequote}
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
                <CollapsibleCard icon={Clock} title="Cronología Textual" description="Historial de eventos del pedido">
                    {pedido.timeline.length > 0 ? (
                      <GanttTimeline events={pedido.timeline} />
                    ) : (
                      <p className="text-sm text-neutral-400 text-center py-4">Sin eventos registrados</p>
                    )}
                </CollapsibleCard>

                {/* Notificaciones Enviadas */}
                <CollapsibleCard icon={Mail} title="Notificaciones Enviadas" description="Emails, SMS y webhooks del pedido">
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
                </CollapsibleCard>
              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="space-y-5">
                {/* Incidencias */}
                <CollapsibleCard icon={AlertTriangle} title="Incidencias" description="Problemas reportados en el pedido">
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
                </CollapsibleCard>

                {/* Actores Involucrados */}
                {pedido.actoresInvolucrados && pedido.actoresInvolucrados.length > 0 && (
                  <CollapsibleCard icon={Users} title="Actores Involucrados" description="Personas relacionadas con el pedido">
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

            {/* Actions moved to QuickActionsMenu (⋮) in header */}
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

      {/* ── Status Change Modal (vista actual) ── */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h3 className="text-base font-bold text-neutral-900">
                Cambiar Estado del Pedido {pedido.idAmplifica}
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Info rows */}
            <div className="px-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Canal de venta:</span>
                <span className="text-neutral-800 font-medium">{pedido.canalVenta}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Estado actual:</span>
                <span className="text-neutral-800 font-medium">{statusModalType === "preparacion" ? pedido.estadoPreparacion : pedido.estadoEnvio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Cambiar estado:</span>
                {statusModalType === "preparacion" ? (
                  <select
                    value={statusModalValue}
                    onChange={e => setStatusModalValue(e.target.value)}
                    className="bg-primary-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium appearance-none cursor-pointer pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Validado">Validado</option>
                    <option value="En preparación">En preparación</option>
                    <option value="Por empacar">Por empacar</option>
                    <option value="Empacado">Empacado</option>
                    <option value="Listo para retiro">Listo para retiro</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                ) : (
                  <select
                    value={statusModalValue}
                    onChange={e => setStatusModalValue(e.target.value)}
                    className="bg-primary-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium appearance-none cursor-pointer pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Solicitado">Solicitado</option>
                    <option value="Programado">Programado</option>
                    <option value="Retirado por courier">Retirado por courier</option>
                    <option value="Enviado">Enviado</option>
                    <option value="En Ruta Final">En Ruta Final</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Fecha:</span>
                <span className="text-neutral-800">{pedido.fechaCreacion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Cliente:</span>
                <span className="text-neutral-800">{pedido.seller}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Sucursal:</span>
                <span className="text-neutral-800">{pedido.sucursal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Total:</span>
                <span className="text-neutral-800 font-medium">{fmt(pedido.montoTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Notas al Pedido:</span>
                <span className="text-neutral-800">{pedido.notas || "Sin Notas"}</span>
              </div>
            </div>

            {/* Product table */}
            <div className="px-6 mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-y border-neutral-200 bg-neutral-50">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-500">SKU</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-500">Cantidad</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-500">Nombre</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-500">Precio Unidad</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-500">Imagen</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.productos.map(p => (
                    <tr key={p.id} className="border-b border-neutral-100">
                      <td className="py-2 px-2 text-xs font-mono text-neutral-600">{p.sku}</td>
                      <td className="py-2 px-2 text-center text-xs">{p.cantidad}</td>
                      <td className="py-2 px-2 text-xs text-neutral-800">{p.nombre}</td>
                      <td className="py-2 px-2 text-right text-xs tabular-nums">{p.precioUnitario.toLocaleString("es-CL")}</td>
                      <td className="py-2 px-2 text-center">
                        {p.imagen ? (
                          <img src={p.imagen} alt="" className="w-10 h-10 rounded object-cover mx-auto" />
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => { setStatusModalOpen(false); alert(`Estado cambiado a "${statusModalValue}" (mock)`); }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tags Modal (custom multi-select) ── */}
      {tagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h3 className="text-base font-bold text-neutral-900">Tags Pedido {pedido.idAmplifica}</h3>
              <button onClick={() => { setTagsModalOpen(false); setTagSearch(""); }} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="px-5 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {selectedTags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                    {t}
                    <button onClick={() => toggleTag(t)} className="text-primary-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="px-5 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar tag..."
                  value={tagSearch}
                  onChange={e => setTagSearch(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Tag list */}
            <div className="px-5 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-0.5 pb-2">
                {TAG_OPTIONS.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        isSelected
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{tag}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary-500" />}
                      </div>
                    </button>
                  );
                })}
                {TAG_OPTIONS.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-neutral-400 text-center py-4">Sin resultados</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-neutral-100 flex-shrink-0">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                disabled={selectedTags.length === 0}
                onClick={() => { setTagsModalOpen(false); setTagSearch(""); alert(`Tags agregados: ${selectedTags.join(", ")} (mock)`); setSelectedTags([]); }}
              >
                Guardar {selectedTags.length > 0 && `(${selectedTags.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}

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
