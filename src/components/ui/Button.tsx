"use client";

import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "tertiary";
type Size = "sm" | "md" | "lg" | "xl";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = BaseProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;
type ButtonAsLink   = BaseProps & { href: string; disabled?: boolean };

type ButtonProps = ButtonAsButton | ButtonAsLink;

// ─── Size tokens ──────────────────────────────────────────────────────────────
const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[0.8125rem] sm:text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-[0.875rem] sm:text-sm gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-[0.875rem] sm:text-sm gap-2 rounded-lg",
  xl: "px-6 py-3 text-base gap-2.5 rounded-xl",
};

const iconSizeClasses: Record<Size, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-4 h-4",
  xl: "w-5 h-5",
};

// ─── Variant tokens ───────────────────────────────────────────────────────────
const variantClasses: Record<Variant, string> = {
  primary: [
    "bg-primary-500 text-white border border-primary-500",
    "hover:bg-primary-600 hover:border-primary-600",
    "focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2",
    "disabled:bg-primary-200 disabled:border-primary-200 disabled:text-white disabled:cursor-not-allowed",
  ].join(" "),
  secondary: [
    "bg-neutral-100 text-neutral-700",
    "hover:bg-neutral-200",
    "focus-visible:ring-2 focus-visible:ring-primary-200",
    "disabled:bg-neutral-100 disabled:text-neutral-300 disabled:cursor-not-allowed",
  ].join(" "),
  tertiary: [
    "bg-transparent text-neutral-600 border border-transparent",
    "hover:bg-neutral-50 hover:text-neutral-700",
    "focus-visible:ring-2 focus-visible:ring-primary-200",
    "disabled:bg-transparent disabled:text-neutral-300 disabled:cursor-not-allowed",
  ].join(" "),
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingText = "Enviando...",
    iconLeft,
    iconRight,
    children,
    className = "",
    disabled,
    href,
    ...rest
  } = props as BaseProps & { href?: string; disabled?: boolean; [k: string]: unknown };

  const isDisabled = disabled || loading;

  const cls = `
    inline-flex items-center justify-center font-medium whitespace-nowrap
    transition-all duration-200 outline-none select-none
    active:scale-[0.97] disabled:active:scale-100
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${loading ? "cursor-wait" : ""}
    ${isDisabled && href ? "pointer-events-none opacity-50" : ""}
    ${className}
  `;

  const content = loading ? (
    <>
      <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
      {loadingText}
    </>
  ) : (
    <>
      {iconLeft && <span className={`flex-shrink-0 ${iconSizeClasses[size]}`}>{iconLeft}</span>}
      {children}
      {iconRight && <span className={`flex-shrink-0 ${iconSizeClasses[size]}`}>{iconRight}</span>}
    </>
  );

  if (href) {
    return <Link href={href} className={cls}>{content}</Link>;
  }

  return (
    <button disabled={isDisabled} className={cls} {...(rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">)}>
      {content}
    </button>
  );
}
