"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download01, Sliders01, LayoutGrid01, SearchLg,
  DotsVertical, CheckCircle, X,
  SwitchVertical01, ArrowUp, ArrowDown, Plus,
  CalendarPlus01, PackageCheck, Play, ClipboardCheck, FastForward,
} from "@untitled-ui/icons-react";
import StatusBadge, { Status } from "@/components/recepciones/StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────
/** Feature 4: multi-label resultado tags (aparecen solo en "Completada") */
type ResultTag = {
  emoji: string;
  label: string;
  className: string;
};

type Orden = {
  id: string;
  creacion: string;       // "DD/MM/YYYY"
  fechaAgendada: string;  // "DD/MM/YYYY HH:MM" | "—"
  fechaExtra?: string;
  seller: string;         // Seller / tienda
  sucursal: string;
  estado: Status;
  skus: number;
  uTotales: string;
  tags?: ResultTag[];     // Feature 4: tags de resultado (Completada)
  isSubId?: boolean;      // Feature 2: sub-ID (RO-XXX-P1)
};

type SortField = "creacion" | "fechaAgendada" | null;
type SortDir   = "asc" | "desc";

// ─── Feature 4: Result tag builder ────────────────────────────────────────────
function makeTags(opts: {
  sinDiferencias?: number;
  conDiferencias?: number;
  noPickeables?: number;
  pendiente?: boolean;
}): ResultTag[] {
  const tags: ResultTag[] = [];
  if (opts.sinDiferencias)
    tags.push({ emoji: "✅", label: `${opts.sinDiferencias.toLocaleString("es-CL")} sin diferencias`, className: "bg-green-50 text-green-700 border border-green-200" });
  if (opts.conDiferencias)
    tags.push({ emoji: "⚠️", label: `${opts.conDiferencias} con diferencias`, className: "bg-amber-50 text-amber-700 border border-amber-200" });
  if (opts.noPickeables)
    tags.push({ emoji: "🚫", label: `${opts.noPickeables} no pickeables`, className: "bg-red-50 text-red-600 border border-red-200" });
  if (opts.pendiente)
    tags.push({ emoji: "🔎", label: "Pendiente de aprobación", className: "bg-orange-50 text-orange-600 border border-orange-200" });
  return tags;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ORDENES: Orden[] = [
  // Creado — sin fecha agendada aún
  { id: "RO-BARRA-191", creacion: "01/03/2026", fechaAgendada: "—", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Creado", skus: 5, uTotales: "100" },

  // Programado
  { id: "RO-BARRA-183", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Programado", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-182", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", fechaExtra: "Expirado hace 4 horas", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Programado", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-190", creacion: "17/02/2026", fechaAgendada: "21/02/2026 09:00", fechaExtra: "Expira en 28 minutos", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Programado", skus: 15, uTotales: "450" },

  // Recepcionado en bodega
  { id: "RO-BARRA-180", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Recepcionado en bodega", skus: 2, uTotales: "200" },

  // En proceso de conteo
  { id: "RO-BARRA-184", creacion: "15/02/2026", fechaAgendada: "19/02/2026 10:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-179", creacion: "14/02/2026", fechaAgendada: "18/02/2026 09:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 320, uTotales: "2.550" },

  // Feature 2 — Parcialmente recepcionada: padre + sub-IDs
  { id: "RO-BARRA-185",    creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Parcialmente recepcionada", skus: 320, uTotales: "2.550" },
  { id: "RO-BARRA-185-P1", creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 160, uTotales: "1.200", isSubId: true,
    tags: makeTags({ sinDiferencias: 1150, conDiferencias: 50 }) },
  { id: "RO-BARRA-185-P2", creacion: "13/02/2026", fechaAgendada: "17/02/2026 14:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "En proceso de conteo", skus: 160, uTotales: "1.350", isSubId: true },

  // Cancelada
  { id: "RO-BARRA-188", creacion: "12/02/2026", fechaAgendada: "16/02/2026 11:30", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Cancelada", skus: 320, uTotales: "2.550" },

  // Feature 4 — Completadas con tags de resultado
  { id: "RO-BARRA-186", creacion: "11/02/2026", fechaAgendada: "15/02/2026 08:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 320, uTotales: "2.550",
    tags: makeTags({ sinDiferencias: 2510, conDiferencias: 20, noPickeables: 20 }) },
  { id: "RO-BARRA-187", creacion: "10/02/2026", fechaAgendada: "14/02/2026 13:00", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 320, uTotales: "2.550",
    tags: makeTags({ conDiferencias: 20, pendiente: true }) },
  { id: "RO-BARRA-189", creacion: "09/02/2026", fechaAgendada: "13/02/2026 15:30", seller: "100 Aventuras", sucursal: "Quilicura", estado: "Completada", skus: 320, uTotales: "2.550",
    tags: makeTags({ sinDiferencias: 2550 }) },
];

// ─── Tabs — alineados con estados del Notion spec ─────────────────────────────
const TABS = [
  "Todas",
  "Creado",
  "Programado",
  "Recepcionado en bodega",
  "En proceso de conteo",
  "Parcialmente recepcionada",
  "Completada",
  "Cancelada",
] as const;

const TAB_STATUS: Record<string, Status | null> = {
  "Todas":                      null,
  "Creado":                     "Creado",
  "Programado":                 "Programado",
  "Recepcionado en bodega":     "Recepcionado en bodega",
  "En proceso de conteo":       "En proceso de conteo",
  "Parcialmente recepcionada":  "Parcialmente recepcionada",
  "Completada":                 "Completada",
  "Cancelada":                  "Cancelada",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NW: React.CSSProperties = { whiteSpace: "nowrap" };

function parseDate(str: string): number {
  if (str === "—") return 0;
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
  if (lower.startsWith("expirado")) return "bg-red-50 text-red-500";
  return "bg-orange-50 text-orange-500";
}

// ─── Feature 1 · Feature Antigua — Contextual actions per status ──────────────
type MenuItem = { label: string; danger?: boolean };
type PrimaryAction = {
  tooltip: string;                                         // 1-2 words shown on hover
  icon: React.ComponentType<{ className?: string }>;
};
type ActionConfig = { primary?: PrimaryAction; menu: MenuItem[] };

function getActions(estado: Status): ActionConfig {
  switch (estado) {
    case "Creado":
      return {
        primary: { tooltip: "Agendar", icon: CalendarPlus01 },
        menu: [
          { label: "Ver" },
          { label: "Editar" },
          { label: "Cancelar", danger: true },
        ],
      };
    case "Programado":
      return {
        primary: { tooltip: "Recibir", icon: PackageCheck },
        menu: [
          { label: "Ver" },
          { label: "Editar" },
          { label: "Editar cita" },
          { label: "Cancelar", danger: true },
        ],
      };
    case "Recepcionado en bodega":
      return {
        primary: { tooltip: "Empezar", icon: Play },
        menu: [
          { label: "Ver" },
          { label: "Editar" },
          { label: "Cancelar", danger: true },
        ],
      };
    case "En proceso de conteo":
      return {
        primary: { tooltip: "Resumir", icon: ClipboardCheck },
        menu: [{ label: "Ver" }],
      };
    case "Parcialmente recepcionada":
      return {
        primary: { tooltip: "Continuar", icon: FastForward },
        menu: [
          { label: "Resumir picking" },
          { label: "Liberar picking" },
          { label: "Ver" },
        ],
      };
    default: // Completada, Cancelada
      return { menu: [{ label: "Ver" }] };
  }
}

// ─── Actions cell ─────────────────────────────────────────────────────────────
// • Primary → secondary style, icon-only, tooltip with 1-2 words on hover
// • Dots   → tertiary style, opens a fixed-position popover BELOW the button
function ActionsCell({ orden }: { orden: Orden }) {
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const { primary, menu } = getActions(orden.estado);

  // Close popover on outside click
  useEffect(() => {
    if (!menuPos) return;
    function onDocClick() { setMenuPos(null); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuPos]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuPos) { setMenuPos(null); return; }
    if (dotsRef.current) {
      const rect = dotsRef.current.getBoundingClientRect();
      // Open BELOW the button, right-aligned
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  };

  const Icon = primary?.icon;

  return (
    <div className="flex items-center gap-1">

      {/* ── Primary: secondary style, icon only, tooltip ── */}
      {primary && Icon && (
        <div className="relative group/ptip">
          <button
            className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-600 rounded-lg transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
          {/* Tooltip — appears above, centered */}
          <div
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/ptip:opacity-100 transition-opacity duration-150 z-50"
          >
            <div className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-lg" style={NW}>
              {primary.tooltip}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
          </div>
        </div>
      )}

      {/* ── Tertiary: dots → opens popover below ── */}
      <button
        ref={dotsRef}
        onClick={toggleMenu}
        className={`p-1.5 rounded-lg transition-colors ${
          menuPos
            ? "bg-gray-100 text-gray-700"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
      >
        <DotsVertical className="w-4 h-4" />
      </button>

      {/* ── Popover — fixed, opens BELOW the dots button ── */}
      {menuPos && (
        <div
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[176px]"
          onMouseDown={e => e.stopPropagation()}
        >
          {menu.map((item, i) => (
            <button
              key={item.label}
              onClick={() => setMenuPos(null)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                item.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              } ${i > 0 && menu[i - 1]?.danger !== item.danger ? "border-t border-gray-100 mt-1 pt-2" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
      router.replace("/recepciones");
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
        o.seller.toLowerCase().includes(q) ||
        o.sucursal.toLowerCase().includes(q) ||
        o.estado.toLowerCase().includes(q) ||
        o.creacion.includes(q) ||
        o.fechaAgendada.includes(q) ||
        o.skus.toString().includes(q) ||
        o.uTotales.includes(q) ||
        (o.fechaExtra?.toLowerCase().includes(q) ?? false) ||
        (o.tags?.some(t => t.label.toLowerCase().includes(q)) ?? false)
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
          <button
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
            style={NW}
          >
            <Download01 className="w-4 h-4" /> Exportar
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
            style={NW}
          >
            <Sliders01 className="w-4 h-4" /> Filtros
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
        {/* Tabs */}
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
        {/* Right controls */}
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
                {/* ID */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>ID</th>

                {/* Creación — sortable */}
                <th
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  style={NW}
                  onClick={() => toggleSort("creacion")}
                >
                  Creación
                  <SortIcon field="creacion" sortField={sortField} sortDir={sortDir} />
                </th>

                {/* Fecha agendada — sortable */}
                <th
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  style={NW}
                  onClick={() => toggleSort("fechaAgendada")}
                >
                  F. Agendada
                  <SortIcon field="fechaAgendada" sortField={sortField} sortDir={sortDir} />
                </th>

                {/* Seller */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Seller</th>
                {/* Sucursal */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Sucursal</th>
                {/* Estado */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Estado</th>
                {/* SKUs */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>SKUs</th>
                {/* Unidades */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Unidades</th>
                {/* Feature 4: Tags de Resultado */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={NW}>Tags de Resultado</th>

                {/* Sticky Acciones */}
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
                  <tr
                    key={`${orden.id}-${i}`}
                    className={`hover:bg-gray-50/60 transition-colors group ${
                      orden.isSubId ? "bg-gray-50/40" : ""
                    }`}
                  >

                    {/* ── ID — Feature 2: sub-ID visual indicator ── */}
                    <td className="py-3 px-4" style={NW}>
                      {orden.isSubId ? (
                        <span className="flex items-center gap-1">
                          <span className="text-gray-300 text-sm select-none pl-1">└</span>
                          <span
                            className="inline-block bg-gray-100 text-gray-500 rounded px-2 py-0.5"
                            style={{ fontFamily: "var(--font-atkinson)", fontSize: "11px" }}
                          >
                            {orden.id}
                          </span>
                        </span>
                      ) : (
                        <span
                          className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5"
                          style={{ fontFamily: "var(--font-atkinson)", fontSize: "12px" }}
                        >
                          {orden.id}
                        </span>
                      )}
                    </td>

                    {/* ── Creación ── */}
                    <td className="py-3 px-4 text-gray-600" style={NW}>{orden.creacion}</td>

                    {/* ── Fecha agendada + badge ── */}
                    <td className="py-3 px-4">
                      <p className="text-gray-700" style={NW}>
                        {orden.fechaAgendada === "—"
                          ? <span className="text-gray-400">Sin agendar</span>
                          : orden.fechaAgendada
                        }
                      </p>
                      {orden.fechaExtra && (
                        <p className="mt-0.5" style={NW}>
                          <span className={`inline text-xs font-medium px-1.5 py-0.5 rounded ${fechaExtraClass(orden.fechaExtra)}`}>
                            {orden.fechaExtra}
                          </span>
                        </p>
                      )}
                    </td>

                    {/* ── Seller ── */}
                    <td className="py-3 px-4 text-gray-600" style={NW}>{orden.seller}</td>

                    {/* ── Sucursal ── */}
                    <td className="py-3 px-4 text-gray-600" style={NW}>{orden.sucursal}</td>

                    {/* ── Estado ── */}
                    <td className="py-3 px-4" style={NW}><StatusBadge status={orden.estado} /></td>

                    {/* ── SKUs ── */}
                    <td className="py-3 px-4 text-gray-700 tabular-nums" style={NW}>{orden.skus}</td>

                    {/* ── Unidades ── */}
                    <td className="py-3 px-4 text-gray-700 tabular-nums" style={NW}>{orden.uTotales}</td>

                    {/* ── Feature 4: Tags de Resultado ── */}
                    <td className="py-3 px-4">
                      {orden.tags && orden.tags.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {orden.tags.map(tag => (
                            <span
                              key={tag.label}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${tag.className}`}
                              style={NW}
                            >
                              {tag.emoji} {tag.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* ── Sticky Acciones — contextual por estado ── */}
                    <td
                      className="py-3 px-4 bg-white group-hover:bg-gray-50/60"
                      style={{ ...NW, ...stickyRight }}
                    >
                      <ActionsCell orden={orden} />
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
export default function OrdenesPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesPageInner />
    </Suspense>
  );
}
