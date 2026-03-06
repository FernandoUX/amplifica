"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ColumnKey =
  | "creacion"
  | "fechaAgendada"
  | "seller"
  | "sucursal"
  | "estado"
  | "skus"
  | "uTotales"
  | "tags";

export const MOVABLE_COLS: { key: ColumnKey; label: string }[] = [
  { key: "creacion",      label: "Creación"         },
  { key: "fechaAgendada", label: "F. Agendada"      },
  { key: "seller",        label: "Tienda"           },
  { key: "sucursal",      label: "Sucursal"         },
  { key: "estado",        label: "Estado"           },
  { key: "skus",          label: "SKUs"             },
  { key: "uTotales",      label: "U. Totales"       },
  { key: "tags",          label: "Estado Productos" },
];

export const DEFAULT_ORDER: ColumnKey[] = MOVABLE_COLS.map(c => c.key);
export const STORAGE_KEY  = "amplifica_recepciones_cols_v1";
export const CHANGE_EVENT = "amplifica_cols_change";

export type ColStorageData = { order: ColumnKey[]; visible: ColumnKey[] };

export function readColStorage(): ColStorageData {
  if (typeof window === "undefined") {
    return { order: DEFAULT_ORDER, visible: [...DEFAULT_ORDER] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ColStorageData;
      // Merge: add any new columns that didn't exist when config was saved
      const missingOrder   = DEFAULT_ORDER.filter(k => !parsed.order.includes(k));
      const missingVisible = DEFAULT_ORDER.filter(k => !parsed.order.includes(k));
      return {
        order:   [...parsed.order,   ...missingOrder],
        visible: [...parsed.visible, ...missingVisible],
      };
    }
  } catch {}
  return { order: DEFAULT_ORDER, visible: [...DEFAULT_ORDER] };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useColumnConfig() {
  const [colOrder,   setColOrder]   = useState<ColumnKey[]>(() => readColStorage().order);
  const [colVisible, setColVisible] = useState<ColumnKey[]>(() => readColStorage().visible);

  useEffect(() => {
    const refresh = () => {
      const { order, visible } = readColStorage();
      setColOrder(order);
      setColVisible(visible);
    };
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  const saveConfig = useCallback((order: ColumnKey[], visible: ColumnKey[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ order, visible }));
    setColOrder(order);
    setColVisible(visible);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }, []);

  return { colOrder, colVisible, saveConfig };
}
