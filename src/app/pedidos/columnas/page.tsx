"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, RefreshCw } from "lucide-react";
import {
  PEDIDO_MOVABLE_COLS,
  PEDIDO_DEFAULT_ORDER,
  readPedidoColStorage,
  PEDIDO_STORAGE_KEY,
  PEDIDO_CHANGE_EVENT,
} from "@/hooks/usePedidoColumnConfig";
import type { PedidoColumnKey } from "@/app/pedidos/_data";
import Button from "@/components/ui/Button";

// ─── Drag handle SVG ──────────────────────────────────────────────────────────
function DragHandle() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="text-neutral-300 flex-shrink-0">
      <circle cx="3"  cy="3"  r="1.5" fill="currentColor" />
      <circle cx="9"  cy="3"  r="1.5" fill="currentColor" />
      <circle cx="3"  cy="8"  r="1.5" fill="currentColor" />
      <circle cx="9"  cy="8"  r="1.5" fill="currentColor" />
      <circle cx="3"  cy="13" r="1.5" fill="currentColor" />
      <circle cx="9"  cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ─── Lock icon (fixed columns) ────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="text-neutral-300 flex-shrink-0">
      <rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PedidoColumnEditorPage() {
  const router = useRouter();

  // Init from localStorage
  const initial = readPedidoColStorage();
  const [order,   setOrder]   = useState<PedidoColumnKey[]>(initial.order);
  const [visible, setVisible] = useState<Set<PedidoColumnKey>>(new Set(initial.visible));

  // DnD state
  const [dragging,    setDragging]    = useState<PedidoColumnKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<PedidoColumnKey | null>(null);
  const [dropBefore,  setDropBefore]  = useState(true);

  // ── Visibility toggle ──
  const toggleVisible = (key: PedidoColumnKey) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // at least 1 visible
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const allKeys = PEDIDO_MOVABLE_COLS.map(c => c.key);
  const selectAll = () => setVisible(new Set(allKeys));
  const clearAll  = () => {
    const first = order[0] ?? PEDIDO_DEFAULT_ORDER[0];
    setVisible(new Set([first]));
  };

  // ── Drag handlers ──
  const handleDragStart = (e: React.DragEvent, key: PedidoColumnKey) => {
    e.dataTransfer.effectAllowed = "move";
    setDragging(key);
  };

  const handleDragOver = (e: React.DragEvent, key: PedidoColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
    const rect = e.currentTarget.getBoundingClientRect();
    setDropBefore(e.clientX < rect.left + rect.width / 2);
  };

  const handleDrop = (e: React.DragEvent, targetKey: PedidoColumnKey) => {
    e.preventDefault();
    if (!dragging || dragging === targetKey) {
      setDragging(null);
      setDragOverKey(null);
      return;
    }
    const newOrder = [...order];
    const fromIdx  = newOrder.indexOf(dragging);
    newOrder.splice(fromIdx, 1);
    const adjustedTo = newOrder.indexOf(targetKey);
    const insertAt   = dropBefore ? adjustedTo : adjustedTo + 1;
    newOrder.splice(insertAt, 0, dragging);
    setOrder(newOrder);
    setDragging(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOverKey(null);
  };

  // ── Save ──
  const handleSave = () => {
    localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify({
      order,
      visible: [...visible],
    }));
    window.dispatchEvent(new CustomEvent(PEDIDO_CHANGE_EVENT));
    router.push("/pedidos");
  };

  const handleReset = () => {
    setOrder(PEDIDO_DEFAULT_ORDER);
    setVisible(new Set(PEDIDO_DEFAULT_ORDER));
  };

  const visibleCount = visible.size;

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div>
        <nav className="max-w-5xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/pedidos" className="hover:text-primary-500 transition-colors duration-300">Pedidos</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-700 font-medium">Editor de columnas</span>
        </nav>
      </div>

    <div className="p-4 lg:p-6 max-w-5xl mx-auto pb-36 sm:pb-4 lg:pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/pedidos"
            className="flex items-center justify-center w-8 h-8 border border-neutral-200 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors duration-300 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Editor de columnas</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Personaliza las columnas de la tabla de Pedidos
            </p>
          </div>
        </div>
        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Button variant="tertiary" size="md" className="h-9" onClick={handleReset} iconLeft={<RefreshCw className="w-4 h-4" />}>
            Restablecer
          </Button>
          <Button variant="primary" size="md" className="h-9" onClick={handleSave} iconLeft={<Check className="w-4 h-4" />}>
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* ── Section 1: Visible columns (checkboxes) ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Columnas visibles</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {visibleCount} de {PEDIDO_MOVABLE_COLS.length} columnas activas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearAll}  className="text-xs text-neutral-600 hover:text-neutral-600 transition-colors duration-300">Ninguna</button>
            <span className="text-neutral-200">|</span>
            <button onClick={selectAll} className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors duration-300">Todas</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          {/* Fixed: ID — always visible */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-600 select-none w-full sm:w-auto">
            <span className="w-4 h-4 rounded border border-neutral-200 bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5 text-neutral-600" />
            </span>
            ID
            <LockIcon />
          </div>

          {/* Movable columns */}
          {PEDIDO_MOVABLE_COLS.map(col => {
            const isVis = visible.has(col.key);
            return (
              <button
                key={col.key}
                onClick={() => toggleVisible(col.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all w-full sm:w-auto ${
                  isVis
                    ? "bg-primary-50 border-primary-200 text-primary-600 hover:bg-primary-100"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-600"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    isVis ? "bg-primary-500 border-primary-500" : "border-neutral-300"
                  }`}
                >
                  {isVis && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                {col.label}
              </button>
            );
          })}

          {/* Fixed: Acciones — always visible */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-600 select-none w-full sm:w-auto">
            <span className="w-4 h-4 rounded border border-neutral-200 bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5 text-neutral-600" />
            </span>
            Acciones
            <LockIcon />
          </div>
        </div>
      </div>

      {/* ── Section 2: Column order (DnD) ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-900">Orden de columnas</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Arrastra para reordenar. Las columnas ID y Acciones son fijas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-wrap">

          {/* Fixed: ID */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-sm text-neutral-600 w-full sm:w-auto">
            <LockIcon />
            <span>ID</span>
          </div>

          {/* Draggable columns */}
          {order.map(key => {
            const col = PEDIDO_MOVABLE_COLS.find(c => c.key === key);
            if (!col) return null;
            const isVis     = visible.has(key);
            const isDragging = dragging === key;
            const isOver    = dragOverKey === key;

            return (
              <div
                key={key}
                draggable
                onDragStart={e => handleDragStart(e, key)}
                onDragOver={e  => handleDragOver(e, key)}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={e      => handleDrop(e, key)}
                onDragEnd={handleDragEnd}
                className={`relative flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-all select-none w-full sm:w-auto
                  cursor-grab active:cursor-grabbing
                  ${isDragging ? "opacity-30 scale-95 shadow-none" : ""}
                  ${isVis
                    ? "bg-white border-neutral-200 text-neutral-700 shadow-sm hover:border-neutral-300 hover:shadow-md"
                    : "bg-neutral-50 border-dashed border-neutral-200 text-neutral-600"
                  }
                  ${isOver && dropBefore  ? "border-l-[3px] border-l-primary-500 pl-2.5" : ""}
                  ${isOver && !dropBefore ? "border-r-[3px] border-r-primary-500 pr-2.5" : ""}
                `}
              >
                <DragHandle />
                <span>{col.label}</span>
                {!isVis && (
                  <span className="text-[10px] font-normal text-neutral-300 ml-0.5">oculta</span>
                )}
              </div>
            );
          })}

          {/* Fixed: Acciones */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-sm text-neutral-600 w-full sm:w-auto">
            <LockIcon />
            <span>Acciones</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-5 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="inline-block w-3 h-3 rounded bg-white border border-neutral-200 shadow-sm" />
            Columna visible
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="inline-block w-3 h-3 rounded border border-dashed border-neutral-300 bg-neutral-50" />
            Columna oculta
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <LockIcon />
            Columna fija (no movible)
          </div>
        </div>
      </div>

    </div>

    {/* ── Mobile sticky bottom bar ── */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 pt-3 pb-6 z-30 sm:hidden">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onClick={handleReset}>
          Restablecer
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={handleSave} iconLeft={<Check className="w-4 h-4" />}>
          Guardar cambios
        </Button>
      </div>
    </div>
    </>
  );
}
