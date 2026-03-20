"use client";

import {
  Check, AlertTriangle, Inbox, ClipboardCheck, ListChecks,
  PackageCheck, Truck, CircleCheckBig, CheckCircle2, Hourglass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TimelineStepStatus = "done" | "active" | "pending" | "late";

export type TimelineStep = {
  label: string;
  status: TimelineStepStatus;
  timestamp?: string;
  elapsed?: string;
  fechaLineas?: string[];
  sla?: {
    status: "cumplido" | "pendiente" | "atrasado" | "en_riesgo";
  };
};

// Icon map by step label — each stage gets its own icon
const stepIconMap: Record<string, LucideIcon> = {
  "Recepción": Inbox,
  "Validación": ClipboardCheck,
  "Preparación": ListChecks,
  "Empaque": PackageCheck,
  "Retiro": Truck,
  "Entrega": CircleCheckBig,
};

type PedidoTimelineProps = {
  steps: TimelineStep[];
  className?: string;
};

// Per-step color scheme — matches PedidoStatusBadge colors from the list view
const stepColorMap: Record<string, {
  done: { dot: string; line: string; label: string };
  active: { dot: string; line: string; label: string };
}> = {
  "Recepción":   { done: { dot: "bg-neutral-500 text-white",  line: "bg-neutral-300",  label: "text-neutral-700 font-medium" },   active: { dot: "bg-neutral-500 text-white ring-4 ring-neutral-100",  line: "bg-neutral-200",  label: "text-neutral-700 font-semibold" } },
  "Validación":  { done: { dot: "bg-sky-500 text-white",       line: "bg-sky-300",      label: "text-sky-700 font-medium" },       active: { dot: "bg-sky-500 text-white ring-4 ring-sky-100",          line: "bg-sky-200",      label: "text-sky-700 font-semibold" } },
  "Preparación": { done: { dot: "bg-primary-500 text-white",   line: "bg-primary-300",  label: "text-primary-700 font-medium" },   active: { dot: "bg-primary-500 text-white ring-4 ring-primary-100",  line: "bg-primary-200",  label: "text-primary-600 font-semibold" } },
  "Empaque":     { done: { dot: "bg-indigo-500 text-white",    line: "bg-indigo-300",   label: "text-indigo-700 font-medium" },    active: { dot: "bg-indigo-500 text-white ring-4 ring-indigo-100",    line: "bg-indigo-200",   label: "text-indigo-700 font-semibold" } },
  "Retiro":      { done: { dot: "bg-green-500 text-white",     line: "bg-green-300",    label: "text-green-700 font-medium" },     active: { dot: "bg-green-500 text-white ring-4 ring-green-100",      line: "bg-green-200",    label: "text-green-700 font-semibold" } },
  "Entrega":     { done: { dot: "bg-green-600 text-white",     line: "bg-green-400",    label: "text-green-800 font-medium" },     active: { dot: "bg-green-600 text-white ring-4 ring-green-100",      line: "bg-green-300",    label: "text-green-800 font-semibold" } },
};

// Fallback for generic status (pending/late don't change per step)
const dotCls: Record<TimelineStepStatus, string> = {
  done:    "bg-green-500 text-white",
  active:  "bg-primary-500 text-white ring-4 ring-primary-100",
  pending: "bg-neutral-100 text-neutral-400",
  late:    "bg-red-500 text-white ring-4 ring-red-100",
};

const lineCls: Record<TimelineStepStatus, string> = {
  done:    "bg-green-400",
  active:  "bg-primary-200",
  pending: "bg-neutral-200",
  late:    "bg-red-300",
};

const labelCls: Record<TimelineStepStatus, string> = {
  done:    "text-green-700 font-medium",
  active:  "text-primary-600 font-semibold",
  pending: "text-neutral-400",
  late:    "text-red-600 font-medium",
};

function getStepStyles(step: TimelineStep) {
  const custom = stepColorMap[step.label];
  if (custom && (step.status === "done" || step.status === "active")) {
    const s = custom[step.status];
    return { dot: s.dot, line: s.line, label: s.label };
  }
  return { dot: dotCls[step.status], line: lineCls[step.status], label: labelCls[step.status] };
}

// SLA badge styling
const slaBadgeMap: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  cumplido:  { bg: "bg-green-50",   text: "text-green-700",  icon: CheckCircle2 },
  pendiente: { bg: "bg-neutral-50", text: "text-neutral-500", icon: Hourglass },
  atrasado:  { bg: "bg-red-50",     text: "text-red-600",    icon: AlertTriangle },
  en_riesgo: { bg: "bg-amber-50",   text: "text-amber-700",  icon: AlertTriangle },
};

const slaLabelMap: Record<string, string> = {
  cumplido: "Cumplido",
  pendiente: "Pendiente",
  atrasado: "Atrasado",
  en_riesgo: "En riesgo",
};

function SlaBadge({ status }: { status: string }) {
  const cfg = slaBadgeMap[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {slaLabelMap[status] || status}
    </span>
  );
}

export default function PedidoTimeline({ steps, className = "" }: PedidoTimelineProps) {
  return (
    <>
      {/* Desktop */}
      <div className={`hidden sm:flex items-start justify-between ${className}`}>
        {steps.map((step, i) => {
          const styles = getStepStyles(step);
          const StepIcon = stepIconMap[step.label];
          return (
          <div key={i} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              {/* Label above icon */}
              <span className={`text-xs text-center leading-tight ${styles.label}`}>
                {step.label}
              </span>
              {/* Icon circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${styles.dot}`}
              >
                {step.status === "done" ? (
                  <Check className="w-4.5 h-4.5" />
                ) : step.status === "late" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : StepIcon ? (
                  <StepIcon className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </div>
              {/* Date/time lines */}
              {step.fechaLineas && step.fechaLineas.length > 0 && (
                <div className="flex flex-col items-center">
                  {step.fechaLineas.map((linea, li) => (
                    <span key={li} className="text-[10px] text-neutral-400 text-center leading-tight">
                      {linea}
                    </span>
                  ))}
                </div>
              )}
              {/* Legacy timestamp/elapsed */}
              {!step.fechaLineas && step.timestamp && (
                <span className="text-[10px] text-neutral-400 text-center leading-tight font-mono">
                  {step.timestamp}
                </span>
              )}
              {!step.fechaLineas && step.elapsed && (
                <span className={`text-[10px] text-center leading-tight ${step.status === "late" ? "text-red-500" : "text-neutral-400"}`}>
                  {step.elapsed}
                </span>
              )}
              {/* SLA badge */}
              {step.sla && (
                <SlaBadge status={step.sla.status} />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mt-[30px] mx-2 ${styles.line}`} />
            )}
          </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className={`sm:hidden ${className}`}>
        <div className="flex items-center justify-center gap-0">
          {steps.map((step, i) => {
            const styles = getStepStyles(step);
            const StepIcon = stepIconMap[step.label];
            return (
            <div key={i} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${styles.dot}`}
              >
                {step.status === "done" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : step.status === "late" ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : StepIcon ? (
                  <StepIcon className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-10 mx-1.5 flex-shrink-0 ${styles.line}`} />
              )}
            </div>
            );
          })}
        </div>
        {(() => {
          const active = steps.find(s => s.status === "active" || s.status === "late");
          return active ? (
            <div className="text-center mt-2">
              <p className={`text-xs font-semibold ${active.status === "late" ? "text-red-600" : "text-primary-600"}`}>
                {active.label} {active.elapsed && `— ${active.elapsed}`}
              </p>
              {active.sla && (
                <div className="mt-1 flex justify-center">
                  <SlaBadge status={active.sla.status} />
                </div>
              )}
            </div>
          ) : null;
        })()}
      </div>
    </>
  );
}
