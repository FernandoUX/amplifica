"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Package,
  RotateCcw,
  Truck,
  ShoppingBag,
  Warehouse,
  TrendingUp,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Zap,
  Activity,
  Target,
  Timer,
  CreditCard,
  X,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { getRole, type Role } from "@/lib/roles";

// ─── Types ──────────────────────────────────────────────────────────────────
type AlertSeverity = "critical" | "warning";

type AlertItem = {
  id: string;
  type: AlertSeverity;
  title: string;
  desc: string;
  module: string;
  count: number;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  updatedMinutesAgo: number;
  /** Roles allowed to see this alert */
  roles: Role[];
};

type StatCard = {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  stats: { label: string; value: string | number; severity?: "critical" | "warning" | "neutral" }[];
  href: string;
  hrefLabel: string;
  updatedMinutesAgo: number;
};

type KPICard = {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  severity: "good" | "warning" | "critical";
  trend?: string;
};

type ActivityEvent = {
  id: string;
  time: string;
  event: string;
  module: string;
  entityId: string;
  entityHref: string;
  status: string;
  statusType: "completado" | "en-proceso" | "recibida" | "alerta" | "nuevo";
};

type OnboardingStep = {
  label: string;
  done: boolean;
};

// ─── Role Mapping ───────────────────────────────────────────────────────────
// Maps spec roles to actual codebase roles
// Spec Operador -> "Operador" | "Seller"
// Spec Supervisor -> "KAM"
// Spec Gerente -> "KAM" | "Super Admin"
// Spec Admin -> "Super Admin"

function roleCanSeeStats(role: Role): boolean {
  return role === "Super Admin" || role === "KAM";
}

function roleCanSeeKPIs(role: Role): boolean {
  return role === "Super Admin" || role === "KAM";
}

function roleCanSeePlan(role: Role): boolean {
  return role === "Super Admin";
}

function roleCanSeeLog(role: Role): boolean {
  return role === "Super Admin" || role === "KAM";
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
const USER_NAME = "Fernando";
const SUCURSAL = "Quilicura";

const ONBOARDING_STEPS: OnboardingStep[] = [
  { label: "Sucursales configuradas", done: true },
  { label: "Sellers conectados", done: true },
  { label: "Inventario cargado", done: true },
  { label: "Reglas de despacho", done: false },
  { label: "Transportistas conectados", done: false },
];

const MOCK_ALERTS: AlertItem[] = [
  {
    id: "alert-1",
    type: "critical",
    title: "4 pedidos con atraso",
    desc: "Superaron el SLA de despacho",
    module: "pedidos",
    count: 4,
    href: "/pedidos?tab=Con+atraso",
    icon: AlertTriangle,
    updatedMinutesAgo: 2,
    roles: ["Super Admin", "KAM", "Seller"],
  },
  {
    id: "alert-2",
    type: "critical",
    title: "5 SKUs bajo stock mínimo",
    desc: "Requieren reposición inmediata",
    module: "inventario",
    count: 5,
    href: "/inventario?filter=low-stock",
    icon: Package,
    updatedMinutesAgo: 5,
    roles: ["Super Admin", "KAM", "Operador"],
  },
  {
    id: "alert-3",
    type: "warning",
    title: "3 devoluciones pendientes >48h",
    desc: "Sin gestión desde hace 2 días",
    module: "devoluciones",
    count: 3,
    href: "/devoluciones?tab=Recibida+en+bodega",
    icon: RotateCcw,
    updatedMinutesAgo: 3,
    roles: ["Super Admin", "KAM"],
  },
  {
    id: "alert-4",
    type: "warning",
    title: "2 recepciones programadas hoy",
    desc: "Andenes asignados para las 14:00 y 16:00",
    module: "recepciones",
    count: 2,
    href: "/recepciones?tab=Programado",
    icon: Truck,
    updatedMinutesAgo: 1,
    roles: ["Super Admin", "KAM", "Operador"],
  },
];

const MOCK_STATS: StatCard[] = [
  {
    id: "stat-pedidos",
    title: "Pedidos",
    icon: ShoppingBag,
    stats: [
      { label: "Pendientes", value: 21, severity: "neutral" },
      { label: "Procesados hoy", value: 15, severity: "neutral" },
      { label: "Con atraso", value: 4, severity: "critical" },
    ],
    href: "/pedidos",
    hrefLabel: "Ver pedidos",
    updatedMinutesAgo: 1,
  },
  {
    id: "stat-recepciones",
    title: "Recepciones",
    icon: Warehouse,
    stats: [
      { label: "Programadas hoy", value: 8, severity: "neutral" },
      { label: "En recepción", value: 3, severity: "warning" },
      { label: "Completadas hoy", value: 5, severity: "neutral" },
    ],
    href: "/recepciones",
    hrefLabel: "Ver recepciones",
    updatedMinutesAgo: 2,
  },
  {
    id: "stat-despachos",
    title: "Despachos",
    icon: Truck,
    stats: [
      { label: "Por despachar", value: 12, severity: "neutral" },
      { label: "Despachados hoy", value: 8, severity: "neutral" },
      { label: "Cumplimiento", value: "92%", severity: "neutral" },
    ],
    href: "/pedidos?tab=Despacho",
    hrefLabel: "Ver despachos",
    updatedMinutesAgo: 3,
  },
  {
    id: "stat-devoluciones",
    title: "Devoluciones",
    icon: RotateCcw,
    stats: [
      { label: "Pendientes", value: 10, severity: "neutral" },
      { label: "Listas devolver", value: 8, severity: "warning" },
      { label: "Entregadas mes", value: 5, severity: "neutral" },
    ],
    href: "/devoluciones",
    hrefLabel: "Ver devoluciones",
    updatedMinutesAgo: 2,
  },
  {
    id: "stat-inventario",
    title: "Inventario",
    icon: Package,
    stats: [
      { label: "SKUs activos", value: 120, severity: "neutral" },
      { label: "Stock bajo", value: 5, severity: "critical" },
      { label: "Movimientos hoy", value: 34, severity: "neutral" },
    ],
    href: "/inventario",
    hrefLabel: "Ver inventario",
    updatedMinutesAgo: 4,
  },
];

const MOCK_KPIS: KPICard[] = [
  { id: "kpi-sla", label: "Cumplimiento SLA", value: "92%", icon: Target, severity: "good", trend: "+2% vs ayer" },
  { id: "kpi-accuracy", label: "Tasa de precisión", value: "98.5%", icon: CheckCircle2, severity: "good", trend: "+0.3%" },
  { id: "kpi-dispatch", label: "Tiempo promedio despacho", value: "2.3h", icon: Timer, severity: "good", trend: "-15min" },
  { id: "kpi-returns", label: "Devoluciones este mes", value: "40", icon: RotateCcw, severity: "warning", trend: "+8 vs anterior" },
];

const MOCK_PLAN = {
  name: "Plan Business",
  pedidosMes: { used: 1240, limit: 2000 },
  sucursales: { used: 2, limit: 5 },
  storage: { used: 4.2, limit: 10, unit: "GB" },
};

const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "ev-1", time: "09:42", event: "Pedido despachado", module: "Pedidos", entityId: "S-BASIC61375", entityHref: "/pedidos/S-BASIC61375", status: "Completado", statusType: "completado" },
  { id: "ev-2", time: "09:40", event: "Recepción iniciada", module: "Recepciones", entityId: "RO-BARRA-371", entityHref: "/recepciones/RO-BARRA-371", status: "En proceso", statusType: "en-proceso" },
  { id: "ev-3", time: "09:38", event: "Devolución recibida", module: "Devoluciones", entityId: "RET-FUNGI-001", entityHref: "/devoluciones/RET-FUNGI-001", status: "Recibida", statusType: "recibida" },
  { id: "ev-4", time: "09:35", event: "Stock bajo detectado", module: "Inventario", entityId: "SKU-A100", entityHref: "/inventario", status: "Alerta", statusType: "alerta" },
  { id: "ev-5", time: "09:30", event: "Pedido B2B creado", module: "Pedidos B2B", entityId: "B2B-95967", entityHref: "/pedidos-b2b/B2B-95967", status: "Nuevo", statusType: "nuevo" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formatted = now.toLocaleDateString("es-CL", options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function timeAgo(minutes: number): string {
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const h = Math.floor(minutes / 60);
  return `hace ${h}h`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/* ── Skeleton ── */
function DashboardSkeleton({ role }: { role?: Role }) {
  const showStats = !role || roleCanSeeStats(role);

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-6 max-w-[1200px] mx-auto animate-pulse">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="h-6 w-56 bg-[#E5E7EB] rounded-md" />
        <div className="h-4 w-72 bg-[#F3F4F6] rounded-md" />
      </div>
      {/* Onboarding */}
      <div className="h-[88px] bg-[#F3F4F6] rounded-lg" />
      {/* Alerts */}
      <div className="space-y-3">
        <div className="h-4 w-40 bg-[#E5E7EB] rounded-md" />
        {[1, 2].map((i) => (
          <div key={i} className="h-[72px] bg-[#F3F4F6] rounded-lg" />
        ))}
      </div>
      {/* Stats — only for roles that can see them */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] bg-[#F3F4F6] rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Onboarding Banner ── */
function OnboardingBanner({
  steps,
  role,
  collapsed,
  onToggle,
  onDismiss,
}: {
  steps: OnboardingStep[];
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((done / total) * 100);
  const isAdmin = role === "Super Admin";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #111759 0%, #2D3A9E 100%)" }}
    >
      {/* Header — always visible */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
              <Zap className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">
                Tu plataforma está {pct}% operativa
              </p>
              <p className="text-[12px] text-white/60">
                {done} de {total} módulos configurados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              aria-label={collapsed ? "Expandir onboarding" : "Colapsar onboarding"}
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4 text-white/50" strokeWidth={1.5} />
              ) : (
                <ChevronUp className="w-4 h-4 text-white/50" strokeWidth={1.5} />
              )}
            </button>
            {pct >= 70 && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Ocultar onboarding"
              >
                <X className="w-4 h-4 text-white/50" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="mt-2 ml-11">
            <button
              onClick={() => window.location.href = "/configuracion"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#111759] hover:bg-white/90 transition-colors"
            >
              Continuar configuración
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="h-1.5 rounded-full overflow-hidden bg-white/15">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out bg-green-400"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Expanded checklist — admin only */}
      {!collapsed && isAdmin && (
        <div className="px-5 pb-4 border-t border-white/10">
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {steps.map((step) => (
              <div key={step.label} className="flex items-center gap-2 py-1">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-400" strokeWidth={1.5} />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 border-white/25" />
                )}
                <span className={`text-[13px] ${step.done ? "text-white/90" : "text-white/40"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Alert Card ── */
function AlertCard({ alert, now }: { alert: AlertItem; now: number }) {
  const Icon = alert.icon;
  const isCritical = alert.type === "critical";
  const dotColor = isCritical ? "#EF4444" : "#EAB308";

  return (
    <Link
      href={alert.href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:shadow-sm group"
      style={{
        backgroundColor: isCritical ? "rgba(254,226,226,0.15)" : "rgba(254,249,195,0.15)",
      }}
    >
      {/* Dot indicator */}
      <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />

      {/* Icon */}
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: dotColor }} strokeWidth={1.5} />

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium truncate" style={{ color: "#111827" }}>
          {alert.title}
        </p>
      </div>

      {/* Count badge */}
      <span
        className="flex-shrink-0 min-w-[24px] h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center"
        style={{
          backgroundColor: isCritical ? "#FEE2E2" : "#FEF9C3",
          color: isCritical ? "#B91C1C" : "#A16207",
        }}
      >
        {alert.count}
      </span>

      {/* Timestamp */}
      <span className="text-[11px] flex-shrink-0 hidden sm:block" style={{ color: "#6B7280" }}>
        {timeAgo(alert.updatedMinutesAgo)}
      </span>

      <ChevronRight
        className="w-3.5 h-3.5 flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
        style={{ color: "#9CA3AF" }}
        strokeWidth={1.5}
      />
    </Link>
  );
}

/* ── No Alerts State ── */
function NoAlertsState({ role }: { role: Role }) {
  const isOperator = role === "Operador" || role === "Seller";

  return (
    <div
      className="rounded-lg border px-4 py-6 text-center"
      style={{ borderColor: "#E5E7EB", backgroundColor: "rgba(220,252,231,0.3)" }}
    >
      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#22C55E" }} strokeWidth={1.5} />
      <p className="text-[13px] font-semibold" style={{ color: "#15803D" }}>
        Sin alertas — operación al día
      </p>
      {isOperator ? (
        <>
          <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>
            Accesos rápidos
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Button href="/recepciones" variant="secondary" size="sm">
              Recepciones
            </Button>
            <Button href="/devoluciones" variant="secondary" size="sm">
              Devoluciones
            </Button>
            <Button href="/pedidos" variant="secondary" size="sm">
              Pedidos
            </Button>
          </div>
        </>
      ) : (
        <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>
          No hay acciones urgentes pendientes
        </p>
      )}
    </div>
  );
}

/* ── Stat Card (Zone 2) ── */
function StatCardComponent({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;

  const severityColor = (s?: string) => {
    if (s === "critical") return "#EF4444";
    if (s === "warning") return "#EAB308";
    return "#111827";
  };

  return (
    <Link
      href={stat.href}
      className="block border-b sm:border sm:rounded-xl bg-white px-3 py-2.5 transition-all hover:shadow-md group"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
            <Icon className="w-3 h-3" style={{ color: "#6B7280" }} strokeWidth={1.5} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>
            {stat.title}
          </span>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-[11px]" style={{ color: "#6B7280" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {timeAgo(stat.updatedMinutesAgo)}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1">
        {stat.stats.map((s) => (
          <div key={s.label} className="text-center py-1.5 rounded-md" style={{ backgroundColor: s.severity === "critical" ? "rgba(254,226,226,0.3)" : s.severity === "warning" ? "rgba(254,249,195,0.3)" : "#F9FAFB" }}>
            <p
              className="text-lg font-bold tabular-nums leading-none"
              style={{ color: severityColor(s.severity) }}
            >
              {s.value}
            </p>
            <p className="text-[10px] leading-tight mt-0.5" style={{ color: "#6B7280" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 mt-2 text-[12px] font-medium" style={{ color: "#3B82F6" }}>
        {stat.hrefLabel}
        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </div>
    </Link>
  );
}

/* ── KPI Card (Zone 3A) ── */
function KPICardComponent({ kpi }: { kpi: KPICard }) {
  const Icon = kpi.icon;

  const severityConfig = {
    good: { color: "#22C55E", bg: "#DCFCE7" },
    warning: { color: "#EAB308", bg: "#FEF9C3" },
    critical: { color: "#EF4444", bg: "#FEE2E2" },
  };
  const config = severityConfig[kpi.severity];

  // Delta badge color based on trend direction + severity
  const isPositive = kpi.trend?.startsWith("+");
  const isNegative = kpi.trend?.startsWith("-");
  const trendBadge = kpi.severity === "critical"
    ? { bg: "#FEE2E2", text: "#B91C1C" }
    : kpi.severity === "warning"
    ? { bg: "#FEF9C3", text: "#A16207" }
    : isPositive
    ? { bg: "#DCFCE7", text: "#15803D" }
    : isNegative
    ? { bg: "#DBEAFE", text: "#1D4ED8" }
    : { bg: "#F3F4F6", text: "#6B7280" };

  return (
    <div className="rounded-xl border bg-white p-3 flex flex-col gap-1.5" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <Icon className="w-3 h-3" style={{ color: config.color }} strokeWidth={1.5} />
        </div>
        <span className="text-[11px] font-medium" style={{ color: "#6B7280" }}>
          {kpi.label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-xl font-bold tabular-nums leading-none" style={{ color: "#111827" }}>
          {kpi.value}
        </p>
        {kpi.trend && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium leading-none mb-0.5"
            style={{ backgroundColor: trendBadge.bg, color: trendBadge.text }}
          >
            {kpi.trend}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Plan Consumption Card (Zone 3B) ── */
function PlanCard() {
  const plan = MOCK_PLAN;

  const barPct = (used: number, limit: number) => Math.min(100, Math.round((used / limit) * 100));

  const barColor = (pct: number) => {
    if (pct >= 100) return "#EF4444";
    if (pct >= 80) return "#EAB308";
    return "#3B82F6";
  };

  const rows = [
    { label: "Pedidos/mes", used: plan.pedidosMes.used, limit: plan.pedidosMes.limit, unit: "" },
    { label: "Sucursales", used: plan.sucursales.used, limit: plan.sucursales.limit, unit: "" },
    { label: "Almacenamiento", used: plan.storage.used, limit: plan.storage.limit, unit: plan.storage.unit },
  ];

  return (
    <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="w-3.5 h-3.5" style={{ color: "#6B7280" }} strokeWidth={1.5} />
          <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>Consumo del plan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: "#F3E8FF", color: "#7E22CE" }}>
            {plan.name}
          </span>
          <Link href="/configuracion/plan" className="text-[11px] font-medium" style={{ color: "#3B82F6" }}>
            Gestionar
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rows.map((row) => {
          const pct = barPct(row.used, row.limit);
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px]" style={{ color: "#6B7280" }}>{row.label}</span>
                <span className="text-[12px] font-medium tabular-nums" style={{ color: "#374151" }}>
                  {row.used}/{row.limit}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor(pct) }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Activity Log Table (Zone 4 — desktop) ── */
function ActivityTable({ events }: { events: ActivityEvent[] }) {
  const statusBadge = (type: ActivityEvent["statusType"], label: string) => {
    const config: Record<ActivityEvent["statusType"], { bg: string; text: string }> = {
      completado: { bg: "#DCFCE7", text: "#15803D" },
      "en-proceso": { bg: "#FEF9C3", text: "#A16207" },
      recibida: { bg: "#DBEAFE", text: "#1D4ED8" },
      alerta: { bg: "#FEE2E2", text: "#B91C1C" },
      nuevo: { bg: "#F3E8FF", text: "#7E22CE" },
    };
    const c = config[type];
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap"
        style={{ backgroundColor: c.bg, color: c.text }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto table-scroll">
      <table className="w-full min-w-[540px]">
        <thead>
          <tr style={{ backgroundColor: "#F9FAFB" }}>
            {["Hora", "Evento", "Módulo", "ID", "Estado"].map((h) => (
              <th
                key={h}
                className="text-left text-[12px] font-semibold px-3 py-2 whitespace-nowrap"
                style={{ color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr
              key={ev.id}
              className="hover:bg-[#F9FAFB] transition-colors"
              style={{ borderBottom: "1px solid #F3F4F6" }}
            >
              <td className="px-3 py-2 text-[13px] tabular-nums whitespace-nowrap" style={{ color: "#6B7280" }}>
                {ev.time}
              </td>
              <td className="px-3 py-2 text-[13px] whitespace-nowrap" style={{ color: "#374151" }}>
                {ev.event}
              </td>
              <td className="px-3 py-2 text-[12px] whitespace-nowrap" style={{ color: "#6B7280" }}>
                {ev.module}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Link
                  href={ev.entityHref}
                  className="inline-flex items-center bg-neutral-100 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 rounded px-1 py-0.5 text-[12px] font-mono transition-colors"
                >
                  {ev.entityId}
                </Link>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {statusBadge(ev.statusType, ev.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Activity Log List (Zone 4 — mobile) ── */
function ActivityList({ events }: { events: ActivityEvent[] }) {
  const statusDot: Record<ActivityEvent["statusType"], string> = {
    completado: "#22C55E",
    "en-proceso": "#EAB308",
    recibida: "#3B82F6",
    alerta: "#EF4444",
    nuevo: "#A855F7",
  };

  return (
    <div className="space-y-0 divide-y" style={{ borderColor: "#F3F4F6" }}>
      {events.map((ev) => (
        <div key={ev.id} className="flex items-center gap-3 py-2.5 px-1">
          <span className="text-[12px] tabular-nums flex-shrink-0 w-10" style={{ color: "#6B7280" }}>
            {ev.time}
          </span>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusDot[ev.statusType] }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] truncate" style={{ color: "#374151" }}>
              {ev.event}
            </p>
            <p className="text-[11px]" style={{ color: "#6B7280" }}>
              {ev.module} ·{" "}
              <Link
                href={ev.entityHref}
                className="font-mono text-neutral-700 hover:text-primary-700 transition-colors"
              >
                {ev.entityId}
              </Link>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({
  title,
  icon: Icon,
  rightSlot,
}: {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" style={{ color: "#6B7280" }} strokeWidth={1.5} />}
        <h2 className="text-[13px] font-semibold" style={{ color: "#111827" }}>
          {title}
        </h2>
      </div>
      {rightSlot}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function InicioPage() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<Role>("Super Admin");
  const [onboardingCollapsed, setOnboardingCollapsed] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [, setTick] = useState(0);

  // Load role and onboarding state
  useEffect(() => {
    const r = getRole();
    setRole(r);

    // Check localStorage for onboarding dismissal
    const dismissed = localStorage.getItem("amplifica_onboarding_complete") === "true";
    setOnboardingDismissed(dismissed);

    // Auto-collapse onboarding at >=70%
    const done = ONBOARDING_STEPS.filter((s) => s.done).length;
    const pct = Math.round((done / ONBOARDING_STEPS.length) * 100);
    if (pct >= 70) setOnboardingCollapsed(true);

    // Mount with delay for skeleton
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Tick for timestamps
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Dismiss onboarding
  const dismissOnboarding = useCallback(() => {
    setOnboardingDismissed(true);
    localStorage.setItem("amplifica_onboarding_complete", "true");
  }, []);

  // Filter alerts by role
  const filteredAlerts = useMemo(
    () => MOCK_ALERTS.filter((a) => a.roles.includes(role)),
    [role]
  );

  const visibleAlerts = alertsExpanded ? filteredAlerts : filteredAlerts.slice(0, 4);
  const hasMoreAlerts = filteredAlerts.length > 4;

  // Onboarding visibility
  const onboardingComplete = ONBOARDING_STEPS.every((s) => s.done);
  const showOnboarding = !onboardingDismissed && !onboardingComplete;

  if (!mounted) return <DashboardSkeleton role={role} />;

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-3 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      {/* ── Greeting (compact) + Refresh ─────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-[15px] font-bold" style={{ color: "#111827" }}>
            {getGreeting()}, {USER_NAME}
          </h1>
          <span className="hidden sm:inline text-[12px]" style={{ color: "#9CA3AF" }}>·</span>
          <p className="text-[12px]" style={{ color: "#6B7280" }}>
            {formatDate()} · {SUCURSAL}
          </p>
        </div>
        <button
          onClick={() => setNow(Date.now())}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
          title="Actualizar datos"
        >
          <RefreshCw className="w-3.5 h-3.5" style={{ color: "#6B7280" }} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Zone 0: Onboarding Banner (above KPIs) ─────────────────── */}
      {showOnboarding && (
        <OnboardingBanner
          steps={ONBOARDING_STEPS}
          role={role}
          collapsed={onboardingCollapsed}
          onToggle={() => setOnboardingCollapsed((c) => !c)}
          onDismiss={dismissOnboarding}
        />
      )}

      {/* ── Zone 3A: KPIs strip ──────────────────────────────────── */}
      {roleCanSeeKPIs(role) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MOCK_KPIS.map((kpi) => (
            <KPICardComponent key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}

      {/* ── Zones 1+2: Side by side on desktop ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
        {/* Zone 1: Alertas — wrapped in a card */}
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: filteredAlerts.length > 0 ? "#EF4444" : "#22C55E" }} strokeWidth={1.5} />
              <h2 className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                {filteredAlerts.length > 0 ? "Requiere tu atención" : "Todo en orden"}
              </h2>
              {filteredAlerts.length > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>
                  {filteredAlerts.length}
                </span>
              )}
            </div>
            {hasMoreAlerts && (
              <button
                onClick={() => setAlertsExpanded((v) => !v)}
                className="text-[12px] font-medium flex items-center gap-1"
                style={{ color: "#3B82F6" }}
              >
                {alertsExpanded ? "Ver menos" : `Ver todas (${filteredAlerts.length})`}
                {alertsExpanded ? <ChevronUp className="w-3 h-3" strokeWidth={2} /> : <ChevronDown className="w-3 h-3" strokeWidth={2} />}
              </button>
            )}
          </div>

          {filteredAlerts.length > 0 ? (
            <div className="space-y-1.5">
              {visibleAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} now={now} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCFCE7" }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[13px] font-medium" style={{ color: "#111827" }}>Operación al día</p>
                <p className="text-[12px]" style={{ color: "#6B7280" }}>No hay acciones urgentes pendientes</p>
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Resumen del Día — wrapped in card */}
        {roleCanSeeStats(role) && (
          <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: "#6B7280" }} strokeWidth={1.5} />
                <h2 className="text-[13px] font-semibold" style={{ color: "#111827" }}>Resumen operacional — Hoy</h2>
              </div>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "#6B7280" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Actualizado {timeAgo(1)}
              </span>
            </div>
            <div className="space-y-2">
              {MOCK_STATS.map((stat) => (
                <StatCardComponent key={stat.id} stat={stat} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Zone 3B: Plan Consumption — Admin only ─────────────────── */}
      {roleCanSeePlan(role) && <PlanCard />}

      {/* ── Zone 4: Operations Log — wrapped in card ──────────────── */}
      {roleCanSeeLog(role) && (
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "#6B7280" }} strokeWidth={1.5} />
              <h2 className="text-[13px] font-semibold" style={{ color: "#111827" }}>Actividad reciente</h2>
            </div>
            <Link
              href="/auditlog"
              className="text-[12px] font-medium flex items-center gap-1"
              style={{ color: "#3B82F6" }}
            >
              Ver historial completo
              <ChevronRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-lg border overflow-hidden" style={{ borderColor: "#F3F4F6" }}>
            <ActivityTable events={MOCK_ACTIVITY} />
          </div>

          {/* Mobile: compact list */}
          <div className="sm:hidden">
            <ActivityList events={MOCK_ACTIVITY} />
          </div>
        </div>
      )}
    </div>
  );
}
