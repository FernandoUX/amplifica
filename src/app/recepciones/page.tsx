"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download01, Sliders01, LayoutGrid01, SearchLg,
  DotsVertical, Calendar, CheckCircle, X,
  SwitchVertical01, ArrowUp, ArrowDown, Plus,
} from "@untitled-ui/icons-react";
import StatusBadge, { Status } from "@/components/recepciones/StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────
type Orden = {
  id: string;
  creacion: string;       // "DD/MM/YYYY"
  fechaAgendada: string;  // "DD/MM/YYYY HH:MM"
  fechaExtra?: string;
  tienda: string;
  sucursal: string;
  estado: Status;
  skus: number;
  uTotales: string;
  estadoProductos?: string;
  estadoProductosClass?: string;
};

type SortField = "creacion" | "fechaAgendada" | null;
type SortDir   = "asc" | "desc";

// ─── Data ─────────────────────────────────────────────────────────────────────
const ORDENES: Orden[] = [
  { id: "RO-BARRA-183", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Creado", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-182", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", fechaExtra: "Expirado hace 4 horas", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Programado", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-180", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", fechaExtra: "Expira en 28 minutos", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Recepción en bodega", skus: 2, uTotales: "200" },
  { id: "RO-BARRA-184", creacion: "15/02/2026", fechaAgendada: "19/02/2026 10:00", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-179", creacion: "14/02/2026", fechaAgendada: "18/02/2026 09:00", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-185", creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Parcialmente recepcionada", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-188", creacion: "12/02/2026", fechaAgendada: "16/02/2026 11:30", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Cancelada", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-186", creacion: "11/02/2026", fechaAgendada: "15/02/2026 08:00", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 320, uTotales: "2.550", estadoProductos: "20 con diferencias · 20 no", estadoProductosClass: "text-orange-500" },
  { id: "RO-BARRA-187", creacion: "10/02/2026", fechaAgendada: "14/02/2026 13:00", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 320, uTotales: "2.550", estadoProductos: "Pendiente de aprobación", estadoProductosClass: "text-orange-500" },
  { id: "RO-BARRA-189", creacion: "09/02/2026", fechaAgendada: "13/02/2026 15:30", tienda: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 320, uTotales: "2.550", estadoProductos: "2.550 sin diferencias", estadoProductosClass: "text-green-600" },
];

const TABS = [
  "Todas","Programado","Recibido en bodega","En proceso de conteo",
  "Parcialmente recepcionada","Completada sin diferencias","Cancelada",
] as const;

const TAB_STATUS: Record<string, Status | null> = {
  "Todas": null,
  "Programado": "Programado",
  "Recibido en bodega": "Recepción en bodega",
  "En proceso de conteo": "En proceso de conteo",
  "Parcialmente recepcionada": "Parcialmente recepcionada",
  "Completada sin diferencias": "Completada",
  "Cancelada": "Cancelada",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };

function parseDate(str: string): number {
  const [dp, tp = "00:00"] = str.split(" ");
  const [d, m, y] = dp.split("/").map(Number);
  const [h, min]  = tp.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

function SortIcon({ field, sortField, sortDir }: {
  field: SortField; sortField: SortField; sortDir: SortDir;
}) {
  if (sortField !== field) return <SwitchVertical01 className="w-3 h-3 text-gray-400 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp   className="w-3 h-3 text-indigo-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-indigo-500 inline ml-1 align-middle" />;
}

// Sticky shadow for the Acciones column
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};

// ─── Badge helper for fechaExtra ──────────────────────────────────────────────
function fechaExtraClass(label: string): string {
  const lower = label.toLowerCase();
  if (lower.startsWith("expirado")) {
    // Ya expiró → rojo suave
    return "bg-red-50 text-red-500";
  }
  // Expira en X → advertencia naranja
  return "bg-orange-50 text-orange-500";
}

// ─── Inner page (needs useSearchParams → must be inside Suspense) ─────────────
function OrdenesPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [activeTab, setActiveTab] = useState<string>("Todas");
  const [showToast, setShowToast] = useState(false);
  const [search,    setSearch]    = useState("");

  // Mostrar toast solo cuando viene de crear una OR
  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setShowToast(true);
      router.replace("/recepciones"); // limpia el query param de la URL
    }
  }, [searchParams, router]);

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let rows = [...ORDENES];
    const statusFilter = TAB_STATUS[activeTab];
    if (statusFilter) rows = rows.filter(o => o.estado === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.tienda.toLowerCase().includes(q) ||
        o.sucursal.toLowerCase().includes(q) ||
        o.estado.toLowerCase().includes(q) ||
        o.creacion.includes(q) ||
        o.fechaAgendada.includes(q) ||
        o.skus.toString().includes(q) ||
        o.uTotales.includes(q) ||
        (o.estadoProductos?.toLowerCase().includes(q) ?? false) ||
        (o.fechaExtra?.toLowerCase().includes(q) ?? false)
      );
    }
    if (sortField) {
      rows.sort((a, b) => {
        const da = parseDate(sortField === "creacion" ? a.creacion : a.fechaAgendada);
        const db = parseDate(sortField === "creacion" ? b.creacion : b.fechaAgendada);
        return sortDir === "asc" ? da - db : db - da;
      });
    }
    return rows;
  }, [activeTab, search, sortField, sortDir]);

  return (
    <div className="p-6 min-w-0">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-green-200 rounded-xl shadow-xl p-4 flex items-start gap-3 max-w-xs">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Orden de recepción programada</p>
            <p className="text-xs text-gray-500 mt-0.5">La orden ha sido creada correctamente</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900" style={NW}>Órdenes de Recepción</h1>
          <span className="text-gray-400 text-base cursor-default select-none">ⓘ</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download01 className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Sliders01 className="w-4 h-4 text-gray-600" />
          </button>
          <Link
            href="/recepciones/crear"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={NW}
          >
            <Plus className="w-4 h-4" /> Crear OR
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-1 overflow-x-auto flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={NW}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex-shrink-0 ${
                activeTab === tab ? "bg-gray-900 text-white font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Sliders01 className="w-4 h-4 text-gray-500" /></button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><LayoutGrid01 className="w-4 h-4 text-gray-500" /></button>
          <div className="relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en órdenes"
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="text-sm border-collapse" style={{ width: "max-content", minWidth: "100%" }}>

            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>ID</th>

                <th
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  style={NW}
                  onClick={() => toggleSort("creacion")}
                >
                  Creación
                  <SortIcon field="creacion" sortField={sortField} sortDir={sortDir} />
                </th>

                <th
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  style={NW}
                  onClick={() => toggleSort("fechaAgendada")}
                >
                  Fecha agendada
                  <SortIcon field="fechaAgendada" sortField={sortField} sortDir={sortDir} />
                </th>

                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Tienda</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Sucursal</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>SKUs</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>U. Totales</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Estado Productos</th>

                {/* Sticky Acciones header */}
                <th
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50"
                  style={{ ...NW, ...stickyRight }}
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-sm text-gray-400" style={NW}>
                    No se encontraron órdenes{search ? ` para "${search}"` : ""}.
                  </td>
                </tr>
              ) : (
                filtered.map((orden, i) => (
                  <tr key={`${orden.id}-${i}`} className="hover:bg-gray-50/60 transition-colors group">

                    <td className="py-3 px-4" style={NW}>
                      <span
                        className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5"
                        style={{ fontFamily: "var(--font-atkinson)", fontSize: "12px" }}
                      >
                        {orden.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600" style={NW}>{orden.creacion}</td>

                    {/* Fecha agendada — fecha en línea 1, badge en línea 2 */}
                    <td className="py-3 px-4">
                      <p className="text-gray-700" style={NW}>{orden.fechaAgendada}</p>
                      {orden.fechaExtra && (
                        <p className="mt-0.5" style={NW}>
                          <span className={`inline text-xs font-medium px-1.5 py-0.5 rounded ${fechaExtraClass(orden.fechaExtra)}`}>
                            {orden.fechaExtra}
                          </span>
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-600" style={NW}>{orden.tienda}</td>
                    <td className="py-3 px-4 text-gray-600" style={NW}>{orden.sucursal}</td>
                    <td className="py-3 px-4" style={NW}><StatusBadge status={orden.estado} /></td>
                    <td className="py-3 px-4 text-gray-700" style={NW}>{orden.skus}</td>
                    <td className="py-3 px-4 text-gray-700" style={NW}>{orden.uTotales}</td>
                    <td className="py-3 px-4" style={NW}>
                      {orden.estadoProductos && (
                        <span className={`text-xs font-medium ${orden.estadoProductosClass}`}>
                          {orden.estadoProductos}
                        </span>
                      )}
                    </td>

                    {/* Sticky Acciones cell */}
                    <td
                      className="py-3 px-4 bg-white"
                      style={{ ...NW, ...stickyRight }}
                    >
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          <DotsVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500" style={NW}>Mostrar</span>
            <select className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option>10</option><option>25</option><option>50</option>
            </select>
            <span className="text-sm text-gray-400" style={NW}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50" style={NW}>← Anterior</button>
            <span className="text-sm text-gray-500 tabular-nums" style={NW}>1 — {filtered.length}</span>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50" style={NW}>Siguiente →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Default export — wraps inner component in Suspense ───────────────────────
// Next.js 15 requires useSearchParams() to be inside a <Suspense> boundary
// for static prerendering to work (fixes the Vercel build error).
export default function OrdenesPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesPageInner />
    </Suspense>
  );
}
