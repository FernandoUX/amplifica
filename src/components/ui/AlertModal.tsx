"use client";

import type { ReactNode, ComponentType } from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button";

// ─── Types ────────────────────────────────────────────────────────────────────
type AlertModalVariant = "primary" | "danger" | "warning" | "info";

type AlertModalAction = {
  label: string;
  onClick: () => void;
  /** Icon shown before label */
  icon?: ReactNode;
};

type AlertModalProps = {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when user dismisses (X, backdrop, cancel) */
  onClose: () => void;
  /** Centered icon component */
  icon: ComponentType<{ className?: string }>;
  /** Visual variant — controls icon circle color and confirm button color */
  variant?: AlertModalVariant;
  /** Title text */
  title: string;
  /** Subtitle below title (optional) */
  subtitle?: string;
  /** Body content — string or JSX */
  children: ReactNode;
  /** Primary confirm action (right button). If omitted, shows single "Entendido" button. */
  confirm?: AlertModalAction;
  /** Cancel label override (default: "Cancelar") */
  cancelLabel?: string;
};

// ─── Variant color maps ───────────────────────────────────────────────────────
const iconBgMap: Record<AlertModalVariant, string> = {
  primary: "bg-green-100",
  danger:  "bg-red-100",
  warning: "bg-amber-100",
  info:    "bg-primary-25",
};

const iconColorMap: Record<AlertModalVariant, string> = {
  primary: "text-green-600",
  danger:  "text-red-600",
  warning: "text-amber-600",
  info:    "text-primary-600",
};

const confirmBtnMap: Record<AlertModalVariant, string> = {
  primary: "bg-primary-500 hover:bg-primary-600",
  danger:  "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-500 hover:bg-amber-600",
  info:    "bg-primary-500 hover:bg-primary-600",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AlertModal({
  open,
  onClose,
  icon: IconComp,
  variant = "primary",
  title,
  subtitle,
  children,
  confirm,
  cancelLabel = "Cancelar",
}: AlertModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap & Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      // Simple focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Auto-focus dialog on open
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isDestructive = variant === "danger" || variant === "warning";

  // Desktop: destructive → confirm left (flex-row-reverse); non-destructive → confirm right (flex-row)
  const btnRowCls = isDestructive ? "sm:flex-row-reverse" : "sm:flex-row";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        tabIndex={-1}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl p-6 outline-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center sm:justify-start mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconBgMap[variant]}`}>
            <IconComp className={`w-7 h-7 ${iconColorMap[variant]}`} />
          </div>
        </div>

        {/* Title */}
        <h3 id="alert-modal-title" className="text-lg font-bold text-neutral-900 mb-1 text-center sm:text-left">{title}</h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-neutral-500 mb-5 text-center sm:text-left">{subtitle}</p>
        )}

        {/* Body */}
        <div className="text-sm text-neutral-700 mb-7 leading-relaxed text-center sm:text-left">
          {children}
        </div>

        {/* Buttons — mobile: confirm on top, cancel below; desktop: varies by variant */}
        {confirm ? (
          <div className={`flex flex-col-reverse ${btnRowCls} gap-3`}>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full sm:flex-1">
              {cancelLabel}
            </Button>
            <button
              onClick={confirm.onClick}
              className={`w-full sm:flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 ${confirmBtnMap[variant]}`}
            >
              {confirm.icon}
              {confirm.label}
            </button>
          </div>
        ) : (
          <Button variant="primary" size="lg" onClick={onClose} className="w-full">
            Entendido
          </Button>
        )}
      </div>
    </div>
  );
}
