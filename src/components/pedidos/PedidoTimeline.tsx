"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Check, AlertTriangle, Inbox, ClipboardCheck, ListChecks,
  PackageCheck, Truck, CircleCheckBig, CheckCircle2, Hourglass,
  ChevronLeft, ChevronRight,
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

// Icon map by step label
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

// Per-step color scheme
const stepColorMap: Record<string, {
  done: { dot: string; label: string };
  active: { dot: string; label: string };
}> = {
  "Recepción":   { done: { dot: "bg-neutral-500 text-white",  label: "text-neutral-700" },   active: { dot: "bg-neutral-500 text-white ring-4 ring-neutral-100",  label: "text-neutral-800" } },
  "Validación":  { done: { dot: "bg-sky-500 text-white",       label: "text-sky-700" },       active: { dot: "bg-sky-500 text-white ring-4 ring-sky-100",          label: "text-sky-700" } },
  "Preparación": { done: { dot: "bg-primary-500 text-white",   label: "text-primary-700" },   active: { dot: "bg-primary-500 text-white ring-4 ring-primary-100",  label: "text-primary-600" } },
  "Empaque":     { done: { dot: "bg-indigo-500 text-white",    label: "text-indigo-700" },    active: { dot: "bg-indigo-500 text-white ring-4 ring-indigo-100",    label: "text-indigo-700" } },
  "Retiro":      { done: { dot: "bg-green-500 text-white",     label: "text-green-700" },     active: { dot: "bg-green-500 text-white ring-4 ring-green-100",      label: "text-green-700" } },
  "Entrega":     { done: { dot: "bg-green-600 text-white",     label: "text-green-800" },     active: { dot: "bg-green-600 text-white ring-4 ring-green-100",      label: "text-green-800" } },
};

const dotCls: Record<TimelineStepStatus, string> = {
  done:    "bg-green-500 text-white",
  active:  "bg-primary-500 text-white ring-4 ring-primary-100",
  pending: "bg-neutral-100 text-neutral-400 border border-neutral-200",
  late:    "bg-red-500 text-white ring-4 ring-red-100",
};

const labelCls: Record<TimelineStepStatus, string> = {
  done:    "text-neutral-700",
  active:  "text-primary-600",
  pending: "text-neutral-400",
  late:    "text-red-600",
};

function getStepStyles(step: TimelineStep) {
  const custom = stepColorMap[step.label];
  if (custom && (step.status === "done" || step.status === "active")) {
    const s = custom[step.status];
    return { dot: s.dot, label: s.label };
  }
  return { dot: dotCls[step.status], label: labelCls[step.status] };
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
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-2.5 h-2.5" />
      {slaLabelMap[status] || status}
    </span>
  );
}

export default function PedidoTimeline({ steps, className = "" }: PedidoTimelineProps) {
  // Calculate progress percentage for the filled line
  const lastDoneIdx = steps.reduce((acc, s, i) => (s.status === "done" || s.status === "active" ? i : acc), -1);
  const progressPct = steps.length > 1 ? (lastDoneIdx / (steps.length - 1)) * 100 : 0;

  return (
    <>
      {/* ── Desktop ── */}
      <div className={`hidden sm:block ${className}`}>
        {/* Steps row with connector line behind */}
        <div className="relative">
          {/* Background connector line */}
          <div className="absolute top-[16px] left-0 right-0 flex items-center px-[40px]">
            <div className="w-full h-[2px] bg-neutral-200 rounded-full" />
          </div>
          {/* Filled progress line */}
          {progressPct > 0 && (
            <div className="absolute top-[16px] left-0 right-0 flex items-center px-[40px]">
              <div
                className="h-[2px] bg-gradient-to-r from-neutral-400 via-sky-400 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* Step icons */}
          <div className="relative flex justify-between">
            {steps.map((step, i) => {
              const styles = getStepStyles(step);
              const StepIcon = stepIconMap[step.label];
              return (
                <div key={i} className="flex flex-col items-center" style={{ width: 0, flex: 1 }}>
                  {/* Icon circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${styles.dot}`}
                  >
                    {step.status === "done" ? (
                      <Check className="w-4 h-4" />
                    ) : step.status === "late" ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : StepIcon ? (
                      <StepIcon className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-xs font-semibold">{i + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info below icons — label, date, SLA */}
        <div className="flex justify-between mt-2">
          {steps.map((step, i) => {
            const styles = getStepStyles(step);
            return (
              <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: 0, flex: 1 }}>
                {/* Label */}
                <span className={`text-[11px] font-semibold leading-tight ${styles.label}`}>
                  {step.label}
                </span>
                {/* Date lines */}
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
            );
          })}
        </div>
      </div>

      {/* ── Mobile — carousel showing 3 steps ── */}
      <MobileTimeline steps={steps} className={className} />
    </>
  );
}

/* ── Mobile carousel component ── */
function MobileTimeline({ steps, className = "" }: { steps: TimelineStep[]; className?: string }) {
  const VISIBLE = 3;
  const [offset, setOffset] = useState(() => {
    // Start centered on the active step
    const activeIdx = steps.findIndex(s => s.status === "active" || s.status === "late");
    if (activeIdx <= 0) return 0;
    return Math.min(Math.max(activeIdx - 1, 0), steps.length - VISIBLE);
  });

  const canPrev = offset > 0;
  const canNext = offset < steps.length - VISIBLE;

  const visibleSteps = steps.slice(offset, offset + VISIBLE);

  return (
    <div className={`sm:hidden ${className}`}>
      <div className="flex items-center gap-1">
        {/* Left chevron */}
        <button
          onClick={() => setOffset(o => Math.max(0, o - 1))}
          disabled={!canPrev}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            canPrev ? "text-neutral-600 hover:bg-neutral-100" : "text-neutral-200"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 3 visible steps */}
        <div className="flex-1 flex justify-between">
          {visibleSteps.map((step, vi) => {
            const globalIdx = offset + vi;
            const styles = getStepStyles(step);
            const StepIcon = stepIconMap[step.label];
            return (
              <div key={globalIdx} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${styles.dot}`}>
                  {step.status === "done" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : step.status === "late" ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : StepIcon ? (
                    <StepIcon className="w-3.5 h-3.5" />
                  ) : (
                    globalIdx + 1
                  )}
                </div>
                {/* Label */}
                <span className={`text-[10px] font-semibold leading-tight text-center ${styles.label}`}>
                  {step.label}
                </span>
                {/* Date lines */}
                {step.fechaLineas && step.fechaLineas.length > 0 && (
                  <div className="flex flex-col items-center">
                    {step.fechaLineas.map((l, li) => (
                      <span key={li} className="text-[9px] text-neutral-400 text-center leading-tight">{l}</span>
                    ))}
                  </div>
                )}
                {/* SLA */}
                {step.sla && <SlaBadge status={step.sla.status} />}
              </div>
            );
          })}
        </div>

        {/* Right chevron */}
        <button
          onClick={() => setOffset(o => Math.min(steps.length - VISIBLE, o + 1))}
          disabled={!canNext}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            canNext ? "text-neutral-600 hover:bg-neutral-100" : "text-neutral-200"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1 mt-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i >= offset && i < offset + VISIBLE ? "bg-primary-400" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
