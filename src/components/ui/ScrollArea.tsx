"use client";

import type { ReactNode, HTMLAttributes } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScrollAreaProps = {
  /** Content to render inside the scrollable area */
  children: ReactNode;
  /** Direction of scroll. Defaults to "vertical" */
  direction?: "vertical" | "horizontal" | "both";
  /** Max height (CSS value). Only applies when direction includes vertical */
  maxHeight?: string | number;
  /** Max width (CSS value). Only applies when direction includes horizontal */
  maxWidth?: string | number;
  /** Additional className */
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * ScrollArea — minimal, design-system-consistent scrollbar wrapper.
 *
 * Usage:
 *   <ScrollArea maxHeight={192} className="space-y-2">
 *     {items.map(item => <Card key={item.id} />)}
 *   </ScrollArea>
 *
 *   <ScrollArea direction="horizontal" maxWidth="100%">
 *     <table>…</table>
 *   </ScrollArea>
 */
export default function ScrollArea({
  children,
  direction = "vertical",
  maxHeight,
  maxWidth,
  className = "",
  style,
  ...rest
}: ScrollAreaProps) {
  const overflowClass =
    direction === "vertical"   ? "overflow-y-auto overflow-x-hidden" :
    direction === "horizontal" ? "overflow-x-auto overflow-y-hidden" :
                                 "overflow-auto";

  const inlineStyle: React.CSSProperties = {
    ...style,
    ...(maxHeight != null ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight } : {}),
    ...(maxWidth  != null ? { maxWidth:  typeof maxWidth  === "number" ? `${maxWidth}px`  : maxWidth  } : {}),
  };

  return (
    <div
      className={`scroll-minimal ${overflowClass} ${className}`}
      style={inlineStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
