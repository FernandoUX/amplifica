"use client";

import { useState, useEffect, useCallback } from "react";

export type ContentSize = "sm" | "md" | "lg";

const LS_KEY = "amplifica_content_size";
const VALID: ContentSize[] = ["sm", "md", "lg"];

/** Map content size → Button component size prop */
export const BUTTON_SIZE_MAP = { sm: "md", md: "lg", lg: "xl" } as const;

export function useContentSize() {
  const [size, setSize] = useState<ContentSize>("sm");

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) as ContentSize | null;
      if (stored && VALID.includes(stored)) {
        setSize(stored);
        applyClass(stored);
      } else {
        applyClass("sm");
      }
    } catch { /* SSR or no localStorage */ }
  }, []);

  const changeSize = useCallback((newSize: ContentSize) => {
    setSize(newSize);
    applyClass(newSize);
    try {
      localStorage.setItem(LS_KEY, newSize);
    } catch { /* no-op */ }
    // Dispatch event so other components/tabs can react
    window.dispatchEvent(new CustomEvent("content-size-change", { detail: newSize }));
  }, []);

  return { size, changeSize } as const;
}

function applyClass(size: ContentSize) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove("content-sm", "content-md", "content-lg");
  el.classList.add(`content-${size}`);
}
