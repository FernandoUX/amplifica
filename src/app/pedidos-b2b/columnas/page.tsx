"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

// ─── B2B Column config (self-contained) ──────────────────────────────────────

type B2BColumnKey = "seller" | "canal" | "destino" | "estado" | "metodoEnvio" | "fecha";

interface B2BMovableCol {
  key: B2BColumnKey;
  label: string;
}

const B2B_MOVABLE_COLS: B2BMovableCol[] = [
  { key: "seller",      label: "Seller" },
  { key: "canal",       label: "Canal" },
  { key: "destino",     label: "Destino" },
  { key: "estado",      label: "Estado" },
  { key: "metodoEnvio", label: "Método envío" },
  { key: "fecha",       label: "Fecha" },
];

const B2B_DEFAULT_ORDER: B2BColumnKey[] = B2B_MOVABLE_COLS.map(c => c.key);

const B2B_STORAGE_KEY   = "amplifica_pedidos_b2b_cols_v1";
const B2B_CHANGE_EVENT  = "amplifica_pedidos_b2b_cols_change";

function readB2BColStorage(): { order: B2BColumnKey[]; visible: B2BColumnKey[] } {
  if (typeof window === "undefined") {
    return { order: B2B_DEFAULT_ORDER, visible: B2B_DEFAULT_ORDER };
  }
  try {
    const raw = localStorage.getItem(B2B_STORAGE_KEY);
    if (!raw) return { order: B2B_DEFAULT_ORDER, visible: B2B_DEFAULT_ORDER };
    const parsed = JSON.parse(raw);
    const validKeys = new Set<B2BColumnKey>(B2B_MOVABLE_COLS.map(c => c.key));
    const order = (parsed.order as B2BColumnKey[]).filter(k => validKeys.has(k));
    const visible = (parsed.visible as B2BColumnKey[]).filter(k => validKeys.has(k));
    // Add any missing keys at the end
    for (const k of B2B_DEFAULT_ORDER) {
      if (!order.includes(k)) order.push(k);
    }
    return {
      order,
      visible: visible.length > 0 ? visible : B2B_DEFAULT_ORDER,
    };
  } catch {
    return { order: B2B_DEFAULT_ORDER, visible: B2B_DEFAULT_ORDER };
  }
}

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
export default function PedidoB2BColumnEditorPage() {
  const router = useRouter();

  // Init from localStorage
  const initial = readB2BColStorage();
  const [order,   setOrder]   = useState<B2BColumnKey[]>(initial.order);
  const [visible, setVisible] = useState<Set<B2BColumnKey>>(new Set(initial.visible));
  const [density, setDensity] = useState<"compact" | "comfortable">(() => {
    if (typeof window === "undefined") return "compact";
    return (localStorage.getItem("amplifica_pedidos_b2b_density") as "compact" | "comfortable") || "compact";
  });

  // DnD state
  const [dragging,    setDragging]    = useState<B2BColumnKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<B2BColumnKey | null>(null);
  const [dropBefore,  setDropBefore]  = useState(true);

  // ── Visibility toggle ──
  const toggleVisible = (key: B2BColumnKey) => {
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

  const allKeys = B2B_MOVABLE_COLS.map(c => c.key);
  const selectAll = () => setVisible(new Set(allKeys));
  const clearAll  = () => {
    const first = order[0] ?? B2B_DEFAULT_ORDER[0];
    setVisible(new Set([first]));
  };

  // ── Drag handlers ──
  const handleDragStart = (e: React.DragEvent, key: B2BColumnKey) => {
    e.dataTransfer.effectAllowed = "move";
    setDragging(key);
  };

  const handleDragOver = (e: React.DragEvent, key: B2BColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
    const rect = e.currentTarget.getBoundingClientRect();
    setDropBefore(e.clientX < rect.left + rect.width / 2);
  };

  const handleDrop = (e: React.DragEvent, targetKey: B2BColumnKey) => {
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
    localStorage.setItem(B2B_STORAGE_KEY, JSON.stringify({
      order,
      visible: [...visible],
    }));
    localStorage.setItem("amplifica_pedidos_b2b_density", density);
    window.dispatchEvent(new CustomEvent(B2B_CHANGE_EVENT));
    window.dispatchEvent(new CustomEvent("amplifica_pedidos_b2b_density_change"));
    router.push("/pedidos-b2b");
  };

  const handleReset = () => {
    setOrder(B2B_DEFAULT_ORDER);
    setVisible(new Set(B2B_DEFAULT_ORDER));
  };

  const visibleCount = visible.size;

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div>
        <nav className="max-w-5xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/pedidos-b2b" className="hover:text-primary-500 transition-colors duration-300">Pedidos B2B</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-700 font-medium">Editor de columnas</span>
        </nav>
      </div>

    <div className="p-4 lg:p-6 max-w-5xl mx-auto pb-36 sm:pb-4 lg:pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/pedidos-b2b"
            className="flex items-center justify-center w-8 h-8 border border-neutral-200 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors duration-300 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Editor de columnas — Pedidos B2B</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Personaliza las columnas de la tabla de Pedidos B2B
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

      {/* ── Section 0: Row density ── */}
      <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-neutral-900">Densidad de filas</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDensity("compact")} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-medium ${density === "compact" ? "border-primary-500 bg-primary-25 text-primary-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}>
            <div className="flex gap-0.5"><div className="w-5 h-0.5 bg-current rounded-full" /><div className="w-3 h-0.5 bg-current rounded-full opacity-50" /></div>
            Compacta
          </button>
          <button onClick={() => setDensity("comfortable")} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-medium ${density === "comfortable" ? "border-primary-500 bg-primary-25 text-primary-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}>
            <div className="flex gap-0.5"><div className="w-5 h-1 bg-current rounded-full" /><div className="w-3 h-1 bg-current rounded-full opacity-50" /></div>
            Expandida
          </button>
        </div>
      </div>

      {/* ── Section 1: Visible columns (checkboxes) ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Columnas visibles</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {visibleCount} de {B2B_MOVABLE_COLS.length} columnas activas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearAll}  className="text-xs text-neutral-600 hover:text-neutral-600 transition-colors duration-300">Ninguna</button>
            <span className="text-neutral-200">|</span>
            <button onClick={selectAll} className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors duration-300">Todas</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          {/* Fixed: ID Amplifica — always visible */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-600 select-none w-full sm:w-auto">
            <span className="w-4 h-4 rounded border border-neutral-200 bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5 text-neutral-600" />
            </span>
            ID Amplifica
            <LockIcon />
          </div>

          {/* Movable columns */}
          {B2B_MOVABLE_COLS.map(col => {
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
            Arrastra para reordenar. Las columnas ID Amplifica y Acciones son fijas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-wrap">

          {/* Fixed: ID Amplifica */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-sm text-neutral-600 w-full sm:w-auto">
            <LockIcon />
            <span>ID Amplifica</span>
          </div>

          {/* Draggable columns */}
          {order.map(key => {
            const col = B2B_MOVABLE_COLS.find(c => c.key === key);
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

        {/* Mini preview (FI-2) — hidden on mobile */}
        <div className="hidden sm:block mt-4 border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-500">Vista previa</div>
          <div className="overflow-x-auto px-3 py-2.5">
            <div className="flex gap-4 text-[10px] text-neutral-400 whitespace-nowrap">
              <span className="font-medium text-neutral-600">ID Amplifica</span>
              {order.filter(col => visible.has(col)).map(col => {
                const colDef = B2B_MOVABLE_COLS.find(c => c.key === col);
                return <span key={col}>{colDef?.label ?? col}</span>;
              })}
              <span className="font-medium text-neutral-600">Acciones</span>
            </div>
            {/* Mock row */}
            <div className="flex gap-4 text-[10px] text-neutral-300 mt-1.5 whitespace-nowrap">
              <span className="font-mono">B2B-001</span>
              {order.filter(col => visible.has(col)).map(col => (
                <span key={col} className="bg-neutral-100 rounded px-2 py-0.5">···</span>
              ))}
              <span>⋮</span>
            </div>
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
