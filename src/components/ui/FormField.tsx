"use client";

import { useState, useRef, useId, type ReactNode } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BaseProps = {
  /** Floating label text */
  label: string;
  /** Optional helper text below the field */
  helperText?: string;
  /** Error message — when set the field renders in error state */
  error?: string;
  /** Tooltip text shown when hovering the help icon */
  tooltip?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Full-width by default */
  className?: string;
};

type InputFieldProps = BaseProps & {
  as?: "input";
  type?: "text" | "number" | "email" | "tel" | "url" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

type SelectFieldProps = BaseProps & {
  as: "select";
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
};

type TextareaFieldProps = BaseProps & {
  as: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

// ─── Component ────────────────────────────────────────────────────────────────
export default function FormField(props: FormFieldProps) {
  const { label, helperText, error, tooltip, disabled = false, className = "" } = props;
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const as = props.as ?? "input";
  const value = props.value;
  const hasValue = value !== undefined && value !== "";
  // Selects always show text, so always float the label
  const isFloating = as === "select" ? true : focused || hasValue;

  // ── Border & background classes ──────────────────────────────────────────
  const borderCls = error
    ? "border-2 border-red-400"
    : focused
    ? "border-2 border-primary-500"
    : "border-2 border-transparent";

  const bgCls = disabled
    ? "bg-neutral-200 cursor-not-allowed"
    : error || focused
    ? "bg-white"
    : "bg-neutral-100";

  // ── Shared field classes ──────────────────────────────────────────────────
  const fieldCls = [
    "w-full appearance-none bg-transparent text-sm text-neutral-800 outline-none placeholder-transparent peer",
    disabled ? "cursor-not-allowed text-neutral-400" : "",
    as === "select" ? "pr-8" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ── Render field element ──────────────────────────────────────────────────
  const renderField = () => {
    if (as === "select") {
      const { children, onChange: onChangeFn } = props as SelectFieldProps;
      return (
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={e => onChangeFn(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${fieldCls} pt-5 pb-1`}
        >
          {children}
        </select>
      );
    }

    if (as === "textarea") {
      const { onChange: onChangeFn, placeholder, rows = 3 } = props as TextareaFieldProps;
      return (
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder ?? label}
          rows={rows}
          onChange={e => onChangeFn(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${fieldCls} pt-5 pb-1 resize-none`}
        />
      );
    }

    // default: input
    const { type = "text", onChange: onChangeFn, placeholder, readOnly } = props as InputFieldProps;
    return (
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder ?? label}
        onChange={e => onChangeFn(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`${fieldCls} pt-5 pb-1`}
      />
    );
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* ── Field container ──────────────────────────────────────────────── */}
      <div
        className={`
          relative flex items-center rounded-lg px-3.5 transition-all
          ${borderCls} ${bgCls}
        `}
      >
        {/* Floating label */}
        <label
          htmlFor={id}
          className={`
            absolute left-3.5 transition-all pointer-events-none
            ${isFloating
              ? "top-1.5 text-[11px] font-semibold text-neutral-600"
              : "top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-normal"
            }
            ${error && !focused ? "text-red-500" : ""}
            ${disabled ? "text-neutral-400" : ""}
          `}
        >
          {label}
        </label>

        {/* Field */}
        <div className="flex-1 min-w-0">
          {renderField()}
        </div>

        {/* Chevron for selects */}
        {as === "select" && (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        )}

        {/* Help / tooltip icon */}
        {tooltip && (
          <div
            className="relative flex-shrink-0 ml-1.5"
            ref={tooltipRef}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <HelpCircle className="w-4 h-4 text-neutral-300 hover:text-neutral-500 transition-colors cursor-help" />
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg leading-relaxed">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-2 h-2 bg-neutral-900 rotate-45 -translate-y-1" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Helper / Error text ──────────────────────────────────────────── */}
      {error && (
        <p className="text-xs text-red-500 pl-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-neutral-400 pl-0.5">{helperText}</p>
      )}
    </div>
  );
}
