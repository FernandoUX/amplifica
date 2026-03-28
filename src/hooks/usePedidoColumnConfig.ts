"use client";

import { useState, useEffect, useCallback } from "react";
import type { PedidoColumnKey } from "@/app/pedidos/_data";
import { COLS_MEJORADA } from "@/app/pedidos/_data";

// ─── Movable columns (all available for Vista Mejorada) ────────────────────────
export const PEDIDO_MOVABLE_COLS: { key: PedidoColumnKey; label: string }[] = [
  { key: "fechaCreacion",     label: "Fecha Creación"      },
  { key: "fechaValidacion",   label: "Fecha Validación"    },
  { key: "idAmplifica",       label: "ID Amplifica"        },
  { key: "seller",            label: "Seller"              },
  { key: "sucursal",          label: "Sucursal"            },
  { key: "canalVenta",        label: "Canal de Venta"      },
  { key: "metodoEntrega",     label: "Método Entrega"      },
  { key: "estadoPreparacion", label: "Estado Preparación"  },
  { key: "estadoEnvio",       label: "Estado Envío"        },
  { key: "preparacion",       label: "Preparación"         },
  { key: "entrega",           label: "Entrega"             },
  { key: "tags",              label: "Tags"                },
];

export const PEDIDO_DEFAULT_ORDER: PedidoColumnKey[] = COLS_MEJORADA;
export const PEDIDO_STORAGE_KEY  = "amplifica_pedidos_cols_v1";
export const PEDIDO_CHANGE_EVENT = "amplifica_pedidos_cols_change";

export type PedidoColStorageData = { order: PedidoColumnKey[]; visible: PedidoColumnKey[] };

export function readPedidoColStorage(): PedidoColStorageData {
  if (typeof window === "undefined") {
    return { order: PEDIDO_DEFAULT_ORDER, visible: [...PEDIDO_DEFAULT_ORDER] };
  }
  try {
    const raw = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PedidoColStorageData;
      // Merge: add any new columns that didn't exist when config was saved
      const allKeys = PEDIDO_MOVABLE_COLS.map(c => c.key);
      const missingOrder   = allKeys.filter(k => !parsed.order.includes(k));
      const missingVisible = allKeys.filter(k => !parsed.order.includes(k));
      return {
        order:   [...parsed.order,   ...missingOrder],
        visible: [...parsed.visible, ...missingVisible],
      };
    }
  } catch {}
  return { order: PEDIDO_DEFAULT_ORDER, visible: [...PEDIDO_DEFAULT_ORDER] };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePedidoColumnConfig() {
  const [colOrder,   setColOrder]   = useState<PedidoColumnKey[]>(PEDIDO_DEFAULT_ORDER);
  const [colVisible, setColVisible] = useState<PedidoColumnKey[]>([...PEDIDO_DEFAULT_ORDER]);

  useEffect(() => {
    // Sync from localStorage on mount (SSR-safe)
    const { order, visible } = readPedidoColStorage();
    setColOrder(order);
    setColVisible(visible);

    const refresh = () => {
      const data = readPedidoColStorage();
      setColOrder(data.order);
      setColVisible(data.visible);
    };
    window.addEventListener(PEDIDO_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(PEDIDO_CHANGE_EVENT, refresh);
  }, []);

  // Active columns = order filtered by visible
  const activeCols = colOrder.filter(k => colVisible.includes(k));

  const saveConfig = useCallback((order: PedidoColumnKey[], visible: PedidoColumnKey[]) => {
    localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify({ order, visible }));
    setColOrder(order);
    setColVisible(visible);
    window.dispatchEvent(new CustomEvent(PEDIDO_CHANGE_EVENT));
  }, []);

  return { colOrder, colVisible, activeCols, saveConfig };
}
