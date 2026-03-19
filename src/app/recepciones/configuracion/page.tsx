"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ORDENES_SEED } from "../_data";
import Link from "next/link";
import StatusBadge, { type Status } from "@/components/recepciones/StatusBadge";
import {
  ChevronRight, ChevronLeft, Check, X, Trash2,
  Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Settings01, Calendar, AlertTriangle, CheckCircle,
  Clock, Building01, SlashCircle01, CalendarDate,
} from "@untitled-ui/icons-react";
import Button from "@/components/ui/Button";

// ─── Constants ────────────────────────────────────────────────────────────────
type Sucursal = { id: string; label: string; address: string; timezone: string; active: boolean };

const DEFAULT_SUCURSALES: Sucursal[] = [
  { id: "quilicura",        label: "Quilicura",       address: "El Juncal 901, Quilicura",     timezone: "America/Santiago", active: true },
  { id: "la-reina",         label: "La Reina",         address: "La Reina, Santiago",           timezone: "America/Santiago", active: true },
  { id: "lo-barnechea",     label: "Lo Barnechea",     address: "Lo Barnechea, Santiago",       timezone: "America/Santiago", active: true },
  { id: "santiago-centro",  label: "Santiago Centro",  address: "Santiago Centro, Chile",       timezone: "America/Santiago", active: true },
];

const TIMEZONES = [
  { value: "America/Santiago",    label: "Santiago (UTC−3/−4)" },
  { value: "Pacific/Easter",      label: "Isla de Pascua (UTC−5/−6)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC−3)" },
  { value: "America/Lima",        label: "Lima / Bogotá (UTC−5)" },
  { value: "America/Mexico_City", label: "Ciudad de México (UTC−6/−5)" },
];

const DIAS: { key: DiaSemana; label: string; short: string }[] = [
  { key: "lun", label: "Lunes",     short: "Lu" },
  { key: "mar", label: "Martes",    short: "Ma" },
  { key: "mie", label: "Miércoles", short: "Mi" },
  { key: "jue", label: "Jueves",    short: "Ju" },
  { key: "vie", label: "Viernes",   short: "Vi" },
  { key: "sab", label: "Sábado",    short: "Sá" },
  { key: "dom", label: "Domingo",   short: "Do" },
];

const FERIADOS_2026_SEED = [
  { fecha: "2026-01-01", nombre: "Año Nuevo" },
  { fecha: "2026-04-03", nombre: "Viernes Santo" },
  { fecha: "2026-04-04", nombre: "Sábado Santo" },
  { fecha: "2026-05-01", nombre: "Día del Trabajador" },
  { fecha: "2026-05-21", nombre: "Día de las Glorias Navales" },
  { fecha: "2026-06-29", nombre: "San Pedro y San Pablo" },
  { fecha: "2026-07-16", nombre: "Día de la Virgen del Carmen" },
  { fecha: "2026-08-15", nombre: "Asunción de la Virgen" },
  { fecha: "2026-09-18", nombre: "Independencia Nacional" },
  { fecha: "2026-09-19", nombre: "Día de las Glorias del Ejército" },
  { fecha: "2026-10-12", nombre: "Encuentro de Dos Mundos" },
  { fecha: "2026-10-31", nombre: "Día de las Iglesias Evangélicas" },
  { fecha: "2026-11-01", nombre: "Día de Todos los Santos" },
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción" },
  { fecha: "2026-12-25", nombre: "Navidad" },
];

const LS_CONFIG     = "amplifica_recepciones_config";
const LS_FERIADOS   = "amplifica_recepciones_feriados";
const LS_BLOQUEOS   = "amplifica_recepciones_bloqueos";
const LS_SUCURSALES = "amplifica_recepciones_sucursales";

// ─── Types ────────────────────────────────────────────────────────────────────
type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

type SucursalConfig = {
  diasHabilitados: DiaSemana[];
  horaInicio: string;
  horaFin: string;
  duracionSlot: number;
  slotsSimultaneos: number;
  sobrecuposDiarios: number;
  diasMinAnticipacion: number;
  diasMaxFuturo: number;
  plazoReagendamiento: number;
  maxReagendamientos: number;
  tiempoAnticipado: number;
};

type Feriado = {
  id: string;
  fecha: string;
  nombre: string;
  sucursalesExcluidas: string[];
};

type Bloqueo = {
  id: string;
  sucursalId: string;
  tipo: "dia" | "rango" | "horario";
  fechaInicio: string;
  fechaFin: string;
  horaInicio?: string;
  horaFin?: string;
  motivo: string;
};

type BloqueoForm = Omit<Bloqueo, "id">;

const DEFAULT_CONFIG: SucursalConfig = {
  diasHabilitados: ["lun", "mar", "mie", "jue", "vie"],
  horaInicio: "08:00",
  horaFin: "18:00",
  duracionSlot: 60,
  slotsSimultaneos: 3,
  sobrecuposDiarios: 2,
  diasMinAnticipacion: 2,
  diasMaxFuturo: 30,
  plazoReagendamiento: 24,
  maxReagendamientos: 2,
  tiempoAnticipado: 24,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFecha(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // go to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Generates time slots for a given config
function buildSlots(horaInicio: string, horaFin: string, duracionMin: number): string[] {
  const [sh, sm] = horaInicio.split(":").map(Number);
  const [eh, em] = horaFin.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins   = eh * 60 + em;
  const slots: string[] = [];
  for (let m = startMins; m < endMins; m += duracionMin) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

// ─── ConfigCard ───────────────────────────────────────────────────────────────
function ConfigCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-neutral-700 font-medium">{label}</p>
        {hint && <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, className = "" }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parts   = value.split(":");
  const hours   = Math.min(23, Math.max(0, parseInt(parts[0]) || 0));
  const minutes = Math.min(59, Math.max(0, parseInt(parts[1]) || 0));

  function fmt(n: number) { return String(n).padStart(2, "0"); }
  function emit(hh: number, mm: number) { onChange(`${fmt(hh)}:${fmt(mm)}`); }

  useEffect(() => {
    function oc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", oc);
    return () => document.removeEventListener("mousedown", oc);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        readOnly
        value={value || "──:──"}
        onClick={() => setOpen(o => !o)}
        className="w-[4.5rem] text-center cursor-pointer px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 tabular-nums bg-white select-none"
      />

      {open && (
        <div className="absolute z-50 left-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl p-3 flex flex-col items-center gap-0.5 w-28">
          {/* Up row */}
          <div className="flex items-center justify-around w-full">
            <button
              onClick={() => emit((hours + 1) % 24, minutes)}
              className="p-1.5 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors duration-300"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => emit(hours, (minutes + 1) % 60)}
              className="p-1.5 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors duration-300"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-1 text-xl font-semibold text-neutral-800 tabular-nums py-1 select-none">
            <span>{fmt(hours)}</span>
            <span className="text-neutral-600 leading-none">:</span>
            <span>{fmt(minutes)}</span>
          </div>

          {/* Down row */}
          <div className="flex items-center justify-around w-full">
            <button
              onClick={() => emit((hours - 1 + 24) % 24, minutes)}
              className="p-1.5 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors duration-300"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => emit(hours, (minutes - 1 + 60) % 60)}
              className="p-1.5 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors duration-300"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState<"sucursales" | "feriados" | "calendario">("sucursales");
  const [activeSucursal, setActiveSucursal] = useState("quilicura");

  // ── Config state ──────────────────────────────────────────────────────────
  const [configs,  setConfigs]  = useState<Record<string, SucursalConfig>>({});
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [savedToast,     setSavedToast]     = useState(false);
  const [feriadosSubTab, setFeriadosSubTab] = useState<"nacionales" | "bloqueos">("nacionales");
  const [showAddBloqueo, setShowAddBloqueo] = useState(false);
  const [bloqueoForm,    setBloqueoForm]    = useState<BloqueoForm>({
    sucursalId: "quilicura", tipo: "dia",
    fechaInicio: "", fechaFin: "", motivo: "",
    horaInicio: "08:00", horaFin: "10:00",
  });
  const [deleteBloqueo,  setDeleteBloqueo]  = useState<string | null>(null);

  // ── Sucursales state ──────────────────────────────────────────────────────
  const [sucursales,       setSucursales]       = useState<Sucursal[]>(DEFAULT_SUCURSALES);
  const [showAddSucursal,  setShowAddSucursal]  = useState(false);
  const [newSucursalForm,  setNewSucursalForm]  = useState({ label: "", address: "", timezone: "America/Santiago" });
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);

  // ── Calendar view state ───────────────────────────────────────────────────
  const [calViewMode,    setCalViewMode]    = useState<"week" | "month">("week");
  const [calViewDate,    setCalViewDate]    = useState(new Date());
  const [calSucursal,    setCalSucursal]    = useState("quilicura");
  const [selectedSlot,   setSelectedSlot]   = useState<{ date: string; hora: string } | null>(null);
  const [selectedDay,    setSelectedDay]    = useState<string | null>(null); // ISO date for mobile month tap

  // ── Load from localStorage ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CONFIG);
      if (c) setConfigs(JSON.parse(c));
      const f = localStorage.getItem(LS_FERIADOS);
      if (f) setFeriados(JSON.parse(f));
      const b = localStorage.getItem(LS_BLOQUEOS);
      if (b) setBloqueos(JSON.parse(b));
      const s = localStorage.getItem(LS_SUCURSALES);
      if (s) setSucursales(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  // ── Current sucursal config (with defaults) ───────────────────────────────
  const cfg = configs[activeSucursal] ?? DEFAULT_CONFIG;

  const updateCfg = (patch: Partial<SucursalConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [activeSucursal]: { ...(prev[activeSucursal] ?? DEFAULT_CONFIG), ...patch },
    }));
  };

  const saveConfig = () => {
    try {
      localStorage.setItem(LS_CONFIG, JSON.stringify(configs));
    } catch { /* ignore */ }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // ── Sucursales helpers ────────────────────────────────────────────────────
  const saveSucursales = (next: Sucursal[]) => {
    setSucursales(next);
    try { localStorage.setItem(LS_SUCURSALES, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const addSucursal = () => {
    const label = newSucursalForm.label.trim();
    if (!label) return;
    const id = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    saveSucursales([...sucursales, { id, label, address: newSucursalForm.address.trim(), timezone: newSucursalForm.timezone, active: true }]);
    setShowAddSucursal(false);
    setNewSucursalForm({ label: "", address: "", timezone: "America/Santiago" });
  };

  const updateSucursalField = (id: string, field: keyof Pick<Sucursal, "label" | "address" | "timezone">, value: string) => {
    saveSucursales(sucursales.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const confirmDeactivate = (id: string) => {
    const next = sucursales.map(s => s.id === id ? { ...s, active: false } : s);
    saveSucursales(next);
    setDeactivateTarget(null);
    if (activeSucursal === id) {
      const first = next.find(s => s.active);
      if (first) setActiveSucursal(first.id);
    }
  };

  const reactivateSucursal = (id: string) => {
    saveSucursales(sucursales.map(s => s.id === id ? { ...s, active: true } : s));
  };

  // ── Feriados helpers ──────────────────────────────────────────────────────
  const cargarFeriados2026 = () => {
    const nuevo: Feriado[] = FERIADOS_2026_SEED.map(f => ({
      id: f.fecha,
      fecha: f.fecha,
      nombre: f.nombre,
      sucursalesExcluidas: [],
    }));
    setFeriados(nuevo);
    try { localStorage.setItem(LS_FERIADOS, JSON.stringify(nuevo)); } catch { /* ignore */ }
  };

  const toggleSucursalExcluida = (feriadoId: string, sucId: string) => {
    setFeriados(prev => {
      const next = prev.map(f => {
        if (f.id !== feriadoId) return f;
        const exc = f.sucursalesExcluidas.includes(sucId)
          ? f.sucursalesExcluidas.filter(s => s !== sucId)
          : [...f.sucursalesExcluidas, sucId];
        return { ...f, sucursalesExcluidas: exc };
      });
      try { localStorage.setItem(LS_FERIADOS, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // ── Bloqueos helpers ──────────────────────────────────────────────────────
  const addBloqueo = () => {
    if (!bloqueoForm.fechaInicio || !bloqueoForm.motivo) return;
    const nuevo: Bloqueo = {
      ...bloqueoForm,
      id: Math.random().toString(36).slice(2),
      fechaFin: bloqueoForm.tipo === "dia" ? bloqueoForm.fechaInicio : (bloqueoForm.fechaFin || bloqueoForm.fechaInicio),
    };
    const next = [...bloqueos, nuevo];
    setBloqueos(next);
    try { localStorage.setItem(LS_BLOQUEOS, JSON.stringify(next)); } catch { /* ignore */ }
    setShowAddBloqueo(false);
    setBloqueoForm({ sucursalId: "quilicura", tipo: "dia", fechaInicio: "", fechaFin: "", motivo: "", horaInicio: "08:00", horaFin: "10:00" });
  };

  const removeBloqueo = (id: string) => {
    const next = bloqueos.filter(b => b.id !== id);
    setBloqueos(next);
    try { localStorage.setItem(LS_BLOQUEOS, JSON.stringify(next)); } catch { /* ignore */ }
    setDeleteBloqueo(null);
  };

  // ── Calendar ORs (seed + created) ────────────────────────────────────────
  const calOrs = useMemo(() => {
    let created: { fechaAgendada?: string; sucursal?: string; seller?: string; estado?: string; id?: string }[] = [];
    try {
      const stored = localStorage.getItem("amplifica_created_ors");
      if (stored) created = JSON.parse(stored);
    } catch { /* ignore */ }
    return [...ORDENES_SEED, ...created].filter(o =>
      o.fechaAgendada && o.fechaAgendada !== "—" &&
      o.estado === "Programado" &&
      (o.sucursal ?? "").toLowerCase().replace(/\s/g, "-") === calSucursal
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calSucursal, bloqueos]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const calCfg = configs[calSucursal] ?? DEFAULT_CONFIG;
  const slots  = buildSlots(calCfg.horaInicio, calCfg.horaFin, calCfg.duracionSlot);

  function isDayBlocked(dateStr: string) {
    return bloqueos.some(b => {
      if (b.sucursalId !== calSucursal) return false;
      if (b.tipo === "dia")   return b.fechaInicio === dateStr;
      if (b.tipo === "rango") return dateStr >= b.fechaInicio && dateStr <= b.fechaFin;
      return false;
    });
  }

  function isDayFeriado(dateStr: string) {
    return feriados.some(f => f.fecha === dateStr && !f.sucursalesExcluidas.includes(calSucursal));
  }

  function orsForSlot(dateStr: string, hora: string) {
    return calOrs.filter(o => {
      if (!o.fechaAgendada) return false;
      const parts = o.fechaAgendada.split(" ");
      if (parts.length < 2) return false;
      const [d, m, y] = parts[0].split("/");
      const iso = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
      return iso === dateStr && parts[1]?.startsWith(hora.slice(0, 2));
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-100">

      {/* ── Breadcrumb ── */}
      <div>
        <nav className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-700 font-medium">Configuración</span>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* ── Title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2.5">
              <Settings01 className="w-6 h-6 text-neutral-600" />
              Configuración
            </h1>
            <p className="text-sm text-neutral-600 mt-0.5">Panel de administración del calendario de recepciones</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-neutral-200 overflow-x-auto overflow-y-hidden scrollbar-hide">
          {([
            { key: "sucursales",  label: "Sucursales",           shortLabel: "Sucursales",  icon: Building01 },
            { key: "feriados",    label: "Feriados y bloqueos",  shortLabel: "Feriados",    icon: CalendarDate },
            { key: "calendario",  label: "Vista de calendario",  shortLabel: "Calendario",  icon: Calendar },
          ] as const).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-300 whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "border-primary-500 text-primary-500"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-500" : "text-neutral-600"}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: SUCURSALES
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "sucursales" && (
          <div className="space-y-5">

            {/* Sucursal selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {sucursales.filter(s => s.active).map(s => (
                  <div key={s.id} className="relative group">
                    <button
                      onClick={() => setActiveSucursal(s.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-300 ${
                        activeSucursal === s.id
                          ? "bg-primary-500 text-white border-primary-500"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300 hover:text-primary-500"
                      }`}
                    >
                      <Building01 className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                    {/* Deactivate button (visible on hover) */}
                    <button
                      onClick={() => setDeactivateTarget(s.id)}
                      title="Desactivar sucursal"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-600 hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {/* Add new sucursal */}
                <button
                  onClick={() => setShowAddSucursal(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-neutral-300 text-neutral-600 hover:border-primary-400 hover:text-primary-500 transition-colors duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva sucursal
                </button>
              </div>

              {/* Inactive sucursales — click to reactivate */}
              {sucursales.some(s => !s.active) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-neutral-600 font-medium">Inactivas:</span>
                  {sucursales.filter(s => !s.active).map(s => (
                    <button
                      key={s.id}
                      onClick={() => reactivateSucursal(s.id)}
                      title="Reactivar sucursal"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-dashed border-neutral-200 text-neutral-600 hover:border-green-300 hover:text-green-600 transition-colors duration-300"
                    >
                      <Check className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Add sucursal inline form */}
              {showAddSucursal && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary-700">Nueva sucursal</p>
                    <button onClick={() => setShowAddSucursal(false)} className="text-primary-400 hover:text-primary-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Nombre *</label>
                      <input
                        type="text"
                        value={newSucursalForm.label}
                        onChange={e => setNewSucursalForm(f => ({ ...f, label: e.target.value }))}
                        placeholder="Ej: Maipú, Las Condes..."
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400 text-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Zona horaria</label>
                      <div className="relative">
                        <select
                          value={newSucursalForm.timezone}
                          onChange={e => setNewSucursalForm(f => ({ ...f, timezone: e.target.value }))}
                          className="w-full appearance-none pl-3 pr-8 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700"
                        >
                          {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">Dirección</label>
                    <input
                      type="text"
                      value={newSucursalForm.address}
                      onChange={e => setNewSucursalForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Ej: Av. Pajaritos 123, Maipú"
                      className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400 text-neutral-700"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddSucursal(false)}
                      className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-white transition-colors duration-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={addSucursal}
                      disabled={!newSucursalForm.label.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-100 disabled:text-neutral-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                    >
                      <Check className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Información de sucursal ── */}
            {(() => {
              const suc = sucursales.find(s => s.id === activeSucursal);
              if (!suc) return null;
              return (
                <ConfigCard title="Información de sucursal" description="Nombre, dirección y zona horaria">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Nombre</label>
                        <input
                          type="text"
                          value={suc.label}
                          onChange={e => updateSucursalField(suc.id, "label", e.target.value)}
                          className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Zona horaria</label>
                        <div className="relative">
                          <select
                            value={suc.timezone ?? "America/Santiago"}
                            onChange={e => updateSucursalField(suc.id, "timezone", e.target.value)}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                          >
                            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Dirección</label>
                      <input
                        type="text"
                        value={suc.address}
                        onChange={e => updateSucursalField(suc.id, "address", e.target.value)}
                        placeholder="Ej: Av. Pajaritos 123, Maipú"
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400"
                      />
                    </div>
                  </div>
                </ConfigCard>
              );
            })()}

            {/* ── Horario operativo ── */}
            <ConfigCard
              title="Horario operativo"
              description="Define los días y horas de atención de esta sucursal"
            >
              <FieldRow label="Días habilitados" hint="Días de la semana en que se aceptan recepciones">
                <div className="flex gap-1.5">
                  {DIAS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => {
                        const current = cfg.diasHabilitados;
                        const next = current.includes(d.key)
                          ? current.filter(x => x !== d.key)
                          : [...current, d.key];
                        updateCfg({ diasHabilitados: next });
                      }}
                      className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors duration-300 ${
                        cfg.diasHabilitados.includes(d.key)
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                      }`}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </FieldRow>

              <div className="border-t border-neutral-100 pt-4">
                <FieldRow label="Hora de operación" hint="Rango horario en que se abren slots de recepción">
                  <div className="flex items-center gap-2">
                    <TimePicker value={cfg.horaInicio} onChange={v => updateCfg({ horaInicio: v })} />
                    <span className="text-neutral-600 text-sm">—</span>
                    <TimePicker value={cfg.horaFin} onChange={v => updateCfg({ horaFin: v })} />
                  </div>
                </FieldRow>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <FieldRow label="Duración del slot" hint="Tiempo estándar de cada bloque de recepción">
                  <div className="relative">
                    <select
                      value={cfg.duracionSlot}
                      onChange={e => updateCfg({ duracionSlot: Number(e.target.value) })}
                      className="appearance-none pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white text-neutral-700"
                    >
                      {[30, 45, 60, 90, 120].map(m => (
                        <option key={m} value={m}>{m} minutos</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                  </div>
                </FieldRow>
              </div>
            </ConfigCard>

            {/* ── Capacidad ── */}
            <ConfigCard
              title="Capacidad"
              description="Controla cuántas órdenes pueden recibirse simultáneamente"
            >
              <FieldRow label="Slots simultáneos por bloque" hint="Máximo de ORs en paralelo por slot horario">
                <input
                  type="number" min={1} max={20}
                  value={cfg.slotsSimultaneos}
                  onChange={e => updateCfg({ slotsSimultaneos: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 tabular-nums"
                />
              </FieldRow>
              <div className="border-t border-neutral-100 pt-4">
                <FieldRow label="Límite de sobrecupos diarios" hint="Máximo de ORs extra permitidas por encima de la capacidad normal">
                  <input
                    type="number" min={0} max={20}
                    value={cfg.sobrecuposDiarios}
                    onChange={e => updateCfg({ sobrecuposDiarios: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-20 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 tabular-nums"
                  />
                </FieldRow>
              </div>
            </ConfigCard>

            {/* ── Ventana de agendamiento ── */}
            <ConfigCard
              title="Ventana de agendamiento"
              description="Controla con cuánta anticipación pueden agendar los sellers"
            >
              <FieldRow label="Días mínimos de anticipación" hint="Mínimo de días hábiles antes del slot para poder agendar">
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={30}
                    value={cfg.diasMinAnticipacion}
                    onChange={e => updateCfg({ diasMinAnticipacion: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-20 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 tabular-nums"
                  />
                  <span className="text-sm text-neutral-500">días</span>
                </div>
              </FieldRow>
              <div className="border-t border-neutral-100 pt-4">
                <FieldRow label="Días máximos a futuro" hint="Máximo de días hacia adelante visibles en el calendario del seller">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={7} max={120}
                      value={cfg.diasMaxFuturo}
                      onChange={e => updateCfg({ diasMaxFuturo: Math.max(7, parseInt(e.target.value) || 7) })}
                      className="w-20 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 tabular-nums"
                    />
                    <span className="text-sm text-neutral-500">días</span>
                  </div>
                </FieldRow>
              </div>
            </ConfigCard>

            {/* ── Reagendamiento ── */}
            <ConfigCard
              title="Reglas de reagendamiento"
              description="Define las condiciones para que un seller pueda cambiar su slot"
            >
              <FieldRow label="Plazo mínimo sin penalización" hint="Tiempo mínimo antes del slot para reagendar sin costo">
                <div className="relative">
                  <select
                    value={cfg.plazoReagendamiento}
                    onChange={e => updateCfg({ plazoReagendamiento: Number(e.target.value) })}
                    className="appearance-none pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white text-neutral-700"
                  >
                    {[6, 12, 24, 48, 72].map(h => (
                      <option key={h} value={h}>{h} horas antes</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                </div>
              </FieldRow>
              <div className="border-t border-neutral-100 pt-4">
                <FieldRow label="Máximo de reagendamientos por OR" hint="Cantidad de veces que un seller puede cambiar su slot">
                  <input
                    type="number" min={1} max={10}
                    value={cfg.maxReagendamientos}
                    onChange={e => updateCfg({ maxReagendamientos: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-20 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 tabular-nums"
                  />
                </FieldRow>
              </div>
            </ConfigCard>

            {/* ── Save button: sticky on mobile, inline on desktop ── */}
            <div className="hidden lg:flex items-center justify-end gap-3 pt-1 pb-8">
              {savedToast && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Configuración guardada
                </span>
              )}
              <button
                onClick={saveConfig}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
              >
                <Check className="w-4 h-4" />
                Guardar configuración
              </button>
            </div>
            {/* Spacer for sticky bar on mobile */}
            <div className="h-20 lg:hidden" />
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: FERIADOS Y BLOQUEOS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "feriados" && (
          <div className="space-y-4">

            {/* Sub-tabs */}
            <div className="flex gap-1 border-b border-neutral-200">
              {([
                { key: "nacionales", label: "Feriados nacionales" },
                { key: "bloqueos",   label: "Bloqueos" },
              ] as const).map(st => (
                <button
                  key={st.key}
                  onClick={() => setFeriadosSubTab(st.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-300 -mb-px ${
                    feriadosSubTab === st.key
                      ? "border-primary-500 text-primary-500"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* ── Feriados nacionales ── */}
            {feriadosSubTab === "nacionales" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    {feriados.length === 0
                      ? "No hay feriados cargados."
                      : `${feriados.length} feriados cargados para 2026`}
                  </p>
                  <button
                    onClick={cargarFeriados2026}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 font-medium transition-colors duration-300"
                  >
                    <CalendarDate className="w-4 h-4" />
                    Cargar feriados 2026
                  </button>
                </div>

                {feriados.length === 0 ? (
                  <div className="bg-white border border-dashed border-neutral-200 rounded-xl py-12 flex flex-col items-center gap-3 text-center">
                    <CalendarDate className="w-10 h-10 text-neutral-300" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Sin feriados cargados</p>
                      <p className="text-xs text-neutral-600 mt-0.5">Haz clic en "Cargar feriados 2026" para precargar el calendario nacional</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Fecha</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Nombre</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Sucursales que operan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feriados.map(f => (
                          <tr key={f.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors duration-300">
                            <td className="px-4 py-3 tabular-nums text-neutral-600 font-medium whitespace-nowrap">
                              {fmtFecha(f.fecha)}
                            </td>
                            <td className="px-4 py-3 text-neutral-800">{f.nombre}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {sucursales.map(s => {
                                  const opera = f.sucursalesExcluidas.includes(s.id);
                                  return (
                                    <button
                                      key={s.id}
                                      onClick={() => toggleSucursalExcluida(f.id, s.id)}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-300 ${
                                        opera
                                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                          : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200"
                                      }`}
                                    >
                                      {opera ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                      {s.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-xs text-neutral-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Por defecto los feriados aplican a todas las sucursales. Activa una sucursal para indicar que sí opera ese día.
                </p>
              </div>
            )}

            {/* ── Bloqueos ── */}
            {feriadosSubTab === "bloqueos" && (
              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    {bloqueos.length === 0 ? "No hay bloqueos activos." : `${bloqueos.length} bloqueo${bloqueos.length !== 1 ? "s" : ""} activo${bloqueos.length !== 1 ? "s" : ""}`}
                  </p>
                  <button
                    onClick={() => setShowAddBloqueo(s => !s)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar bloqueo
                  </button>
                </div>

                {/* Add bloqueo form */}
                {showAddBloqueo && (
                  <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary-700">Nuevo bloqueo</p>
                      <button onClick={() => setShowAddBloqueo(false)} className="text-primary-400 hover:text-primary-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Sucursal */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Sucursal</label>
                        <div className="relative">
                          <select
                            value={bloqueoForm.sucursalId}
                            onChange={e => setBloqueoForm(f => ({ ...f, sucursalId: e.target.value }))}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 placeholder-neutral-400"
                          >
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                        </div>
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Tipo de bloqueo</label>
                        <div className="relative">
                          <select
                            value={bloqueoForm.tipo}
                            onChange={e => setBloqueoForm(f => ({ ...f, tipo: e.target.value as Bloqueo["tipo"] }))}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 placeholder-neutral-400"
                          >
                            <option value="dia">Día completo</option>
                            <option value="rango">Rango de fechas</option>
                            <option value="horario">Rango horario</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                        </div>
                      </div>

                      {/* Fecha inicio */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                          {bloqueoForm.tipo === "rango" ? "Fecha inicio" : "Fecha"}
                        </label>
                        <input
                          type="date"
                          value={bloqueoForm.fechaInicio}
                          onChange={e => setBloqueoForm(f => ({ ...f, fechaInicio: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 placeholder-neutral-400"
                        />
                      </div>

                      {/* Fecha fin (rango) */}
                      {bloqueoForm.tipo === "rango" && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1.5">Fecha fin</label>
                          <input
                            type="date"
                            value={bloqueoForm.fechaFin}
                            min={bloqueoForm.fechaInicio}
                            onChange={e => setBloqueoForm(f => ({ ...f, fechaFin: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700 placeholder-neutral-400"
                          />
                        </div>
                      )}

                      {/* Horario (tipo horario) */}
                      {bloqueoForm.tipo === "horario" && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1.5">Rango horario</label>
                          <div className="flex items-center gap-2">
                            <TimePicker
                              value={bloqueoForm.horaInicio ?? "08:00"}
                              onChange={v => setBloqueoForm(f => ({ ...f, horaInicio: v }))}
                              className="flex-1"
                            />
                            <span className="text-neutral-600">—</span>
                            <TimePicker
                              value={bloqueoForm.horaFin ?? "18:00"}
                              onChange={v => setBloqueoForm(f => ({ ...f, horaFin: v }))}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Motivo *</label>
                      <input
                        type="text"
                        value={bloqueoForm.motivo}
                        onChange={e => setBloqueoForm(f => ({ ...f, motivo: e.target.value }))}
                        placeholder="Ej: Mantención de andén, Fumigación..."
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400 text-neutral-700"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowAddBloqueo(false)}
                        className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-white transition-colors duration-300"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addBloqueo}
                        disabled={!bloqueoForm.fechaInicio || !bloqueoForm.motivo}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-100 disabled:text-neutral-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                      >
                        <Check className="w-4 h-4" />
                        Guardar bloqueo
                      </button>
                    </div>
                  </div>
                )}

                {/* Bloqueos table */}
                {bloqueos.length === 0 && !showAddBloqueo ? (
                  <div className="bg-white border border-dashed border-neutral-200 rounded-xl py-12 flex flex-col items-center gap-3 text-center">
                    <SlashCircle01 className="w-10 h-10 text-neutral-300" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Sin bloqueos activos</p>
                      <p className="text-xs text-neutral-600 mt-0.5">Agrega un bloqueo para deshabilitar una sucursal en una fecha específica</p>
                    </div>
                  </div>
                ) : bloqueos.length > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Sucursal</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Tipo</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Fecha</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Horario</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Motivo</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {bloqueos.map(b => {
                          const suc = sucursales.find(s => s.id === b.sucursalId);
                          return (
                            <tr key={b.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors duration-300">
                              <td className="px-4 py-3 font-medium text-neutral-800">{suc?.label ?? b.sucursalId}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  b.tipo === "dia"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  b.tipo === "rango"  ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {b.tipo === "dia" ? "Día completo" : b.tipo === "rango" ? "Rango" : "Horario"}
                                </span>
                              </td>
                              <td className="px-4 py-3 tabular-nums text-neutral-600">
                                {b.tipo === "rango"
                                  ? `${fmtFecha(b.fechaInicio)} — ${fmtFecha(b.fechaFin)}`
                                  : fmtFecha(b.fechaInicio)}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-neutral-500 text-xs">
                                {b.tipo === "horario" ? `${b.horaInicio} — ${b.horaFin}` : "—"}
                              </td>
                              <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">{b.motivo}</td>
                              <td className="px-4 py-3">
                                {deleteBloqueo === b.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => removeBloqueo(b.id)}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors duration-300"
                                    >
                                      Sí, eliminar
                                    </button>
                                    <button
                                      onClick={() => setDeleteBloqueo(null)}
                                      className="px-2.5 py-1 border border-neutral-200 text-neutral-500 text-xs rounded-lg hover:bg-neutral-50 transition-colors duration-300"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteBloqueo(b.id)}
                                    className="p-1.5 text-neutral-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors duration-300"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: VISTA DE CALENDARIO
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "calendario" && (
          <div className="space-y-4 pb-20 sm:pb-4">

            {/* Controls bar — compact on mobile */}
            <div className="bg-white border border-neutral-200 rounded-xl px-3 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">

              {/* Row 1 mobile: Sucursal full-width | Desktop: inline */}
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <Building01 className="w-4 h-4 text-neutral-600 shrink-0 sm:block hidden" />
                <div className="relative w-full sm:w-auto">
                  <select
                    value={calSucursal}
                    onChange={e => { setCalSucursal(e.target.value); setSelectedSlot(null); setSelectedDay(null); }}
                    className="appearance-none w-full sm:w-auto pl-3 pr-7 py-2 sm:py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white font-medium text-neutral-700"
                  >
                    {sucursales.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                </div>

                <div className="h-5 w-px bg-neutral-200 hidden sm:block" />

                {/* Week/Month toggle — hidden on mobile, shown inline on desktop */}
                <div className="hidden sm:flex gap-1 bg-neutral-100 p-0.5 rounded-lg">
                  {(["week", "month"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setCalViewMode(m); setSelectedDay(null); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-300 ${
                        calViewMode === m ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {m === "week" ? "Semana" : "Mes"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2 mobile: Week/Month toggle full-width */}
              <div className="flex sm:hidden gap-1 bg-neutral-100 p-0.5 rounded-lg w-full">
                {(["week", "month"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setCalViewMode(m); setSelectedDay(null); }}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-300 ${
                      calViewMode === m ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {m === "week" ? "Semana" : "Mes"}
                  </button>
                ))}
              </div>

              {/* Row 2 mobile / inline desktop: Date navigation */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:ml-auto">
                <button
                  onClick={() => { setCalViewDate(new Date()); setSelectedDay(null); }}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors duration-300"
                >
                  Hoy
                </button>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => { setCalViewDate(d => calViewMode === "week" ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)); setSelectedDay(null); }}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors duration-300"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-500" />
                  </button>
                  <span className="text-sm font-semibold text-neutral-700 min-w-[120px] sm:min-w-[140px] text-center">
                    {calViewMode === "week"
                      ? (() => {
                          const sw = startOfWeek(calViewDate);
                          const ew = addDays(sw, 6);
                          return `${sw.getDate()} ${sw.toLocaleString("es-CL", { month: "short" })} — ${ew.getDate()} ${ew.toLocaleString("es-CL", { month: "short" })}`;
                        })()
                      : (() => {
                          const m = calViewDate.toLocaleString("es-CL", { month: "long" });
                          const y = calViewDate.getFullYear();
                          return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${y}`;
                        })()}
                  </span>
                  <button
                    onClick={() => { setCalViewDate(d => calViewMode === "week" ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)); setSelectedDay(null); }}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors duration-300"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Anticipación + leyenda removed — calendar now only shows Programado */}

            {/* ── WEEK VIEW ── */}
            {calViewMode === "week" && (() => {
              const weekStart = startOfWeek(calViewDate);
              const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

              return (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  {/* Scrollable wrapper for mobile */}
                  <div className="overflow-x-auto">
                    {/* Header */}
                    <div className="grid border-b border-neutral-100" style={{ gridTemplateColumns: "56px repeat(7, minmax(80px, 1fr))", minWidth: "620px" }}>
                      <div className="px-2 py-3 border-r border-neutral-100" />
                      {weekDays.map((day, i) => {
                        const iso     = isoDate(day);
                        const blocked = isDayBlocked(iso);
                        const feriado = isDayFeriado(iso);
                        const isToday = sameDay(day, new Date());
                        return (
                          <div key={i} className={`px-1 sm:px-2 py-3 text-center border-r border-neutral-100 last:border-0 ${blocked || feriado ? "bg-neutral-50" : ""}`}>
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">
                              {day.toLocaleString("es-CL", { weekday: "short" })}
                            </p>
                            <p className={`text-base sm:text-lg font-bold mt-0.5 ${isToday ? "text-primary-500" : "text-neutral-800"}`}>
                              {day.getDate()}
                            </p>
                            {(blocked || feriado) && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500 font-medium">
                                <SlashCircle01 className="w-2.5 h-2.5" />
                                {blocked ? "Bloq." : "Fer."}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Slots */}
                    <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px] scroll-minimal">
                      {slots.map(slot => (
                        <div
                          key={slot}
                          className="grid border-b border-neutral-50 last:border-0"
                          style={{ gridTemplateColumns: "56px repeat(7, minmax(80px, 1fr))", minWidth: "620px" }}
                        >
                          <div className="px-2 py-2 border-r border-neutral-100 flex items-center sticky left-0 bg-white z-[1]">
                            <span className="text-[11px] sm:text-xs font-medium text-neutral-600 tabular-nums">{slot}</span>
                          </div>
                          {weekDays.map((day, di) => {
                            const iso     = isoDate(day);
                            const blocked = isDayBlocked(iso);
                            const feriado = isDayFeriado(iso);
                            if (blocked || feriado) {
                              return (
                                <div key={di} className="border-r border-neutral-100 last:border-0 bg-neutral-50/80 py-1 px-1 sm:px-2" />
                              );
                            }
                            const orsHere = orsForSlot(iso, slot);
                            const cap     = calCfg.slotsSimultaneos;
                            const occ     = orsHere.length;
                            const pct     = cap > 0 ? (occ / cap) * 100 : 0;
                            const isSelected = selectedSlot?.date === iso && selectedSlot?.hora === slot;
                            const cellColor =
                              occ === 0        ? "hover:bg-neutral-50 cursor-default" :
                              pct >= 100        ? "bg-red-50/80 hover:bg-red-50 cursor-pointer" :
                              pct >= 70         ? "bg-amber-50/80 hover:bg-amber-50 cursor-pointer" :
                                                 "bg-sky-50/60 hover:bg-sky-50 cursor-pointer";
                            return (
                              <div
                                key={di}
                                onClick={() => occ > 0 && setSelectedSlot(isSelected ? null : { date: iso, hora: slot })}
                                className={`border-r border-neutral-100 last:border-0 py-1.5 px-1.5 sm:px-2 min-h-[40px] transition-all duration-200 ${cellColor} ${isSelected ? "bg-primary-50 ring-1 ring-primary-300" : ""}`}
                              >
                                {occ > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded text-[10px] font-semibold tabular-nums ${
                                      pct >= 100 ? "bg-red-100 text-red-700" : pct >= 70 ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                                    }`}>
                                      {occ}/{cap}
                                    </span>
                                    <span className="hidden sm:inline text-[10px] text-neutral-600 truncate max-w-[60px] font-medium">{orsHere[0]?.seller ?? orsHere[0]?.id}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected slot detail panel */}
                  {selectedSlot && (() => {
                    const ors = orsForSlot(selectedSlot.date, selectedSlot.hora);
                    return (
                      <div className="border-t border-primary-100 bg-primary-50/50 px-4 sm:px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-primary-700">
                            {fmtFecha(selectedSlot.date)} · {selectedSlot.hora} — {ors.length} OR{ors.length !== 1 ? "s" : ""}
                          </p>
                          <button onClick={() => setSelectedSlot(null)} className="text-primary-400 hover:text-primary-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {ors.map((or, i) => (
                            <div key={i} className="bg-white border border-primary-100 rounded-lg px-3 py-2 flex items-center gap-2 sm:gap-3 text-sm flex-wrap sm:flex-nowrap">
                              <span className="font-sans text-xs text-neutral-500">{or.id ?? "—"}</span>
                              <span className="font-medium text-neutral-800">{or.seller ?? "—"}</span>
                              {or.estado && <StatusBadge status={or.estado as Status} />}
                              {or.id && (
                                <Link
                                  href={`/recepciones/${or.id}`}
                                  className="ml-auto px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors duration-200"
                                >
                                  Ver detalle
                                </Link>
                              )}
                            </div>
                          ))}
                          {ors.length === 0 && <p className="text-xs text-primary-500">Sin ORs en este slot.</p>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* ── MONTH VIEW ── */}
            {calViewMode === "month" && (() => {
              const year  = calViewDate.getFullYear();
              const month = calViewDate.getMonth();
              const firstDay = new Date(year, month, 1);
              const gridStart = startOfWeek(firstDay);
              const totalCells = 42;
              const days = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));
              const lastRowStart = days[35];
              const useDays = lastRowStart && lastRowStart.getMonth() !== month ? days.slice(0, 35) : days;
              const DAY_HEADERS_FULL = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

              const MAX_EVENTS_PER_CELL = 2;

              // Status → pill color map
              const statusPillStyle = (estado: string) => {
                switch (estado) {
                  case "Programado":                return "border-l-sky-500 bg-sky-50 text-sky-800";
                  case "Recepcionado en bodega":     return "border-l-indigo-500 bg-indigo-50 text-indigo-800";
                  case "En proceso de conteo":       return "border-l-primary-500 bg-primary-25 text-primary-700";
                  case "Pendiente de aprobación":    return "border-l-orange-500 bg-orange-50 text-orange-800";
                  case "Completada":                 return "border-l-green-500 bg-green-50 text-green-800";
                  case "Cancelado":                  return "border-l-neutral-400 bg-neutral-50 text-neutral-600";
                  default:                           return "border-l-neutral-300 bg-neutral-50 text-neutral-700";
                }
              };

              // Status → dot color for mobile compact view
              const statusDotColor = (estado: string) => {
                switch (estado) {
                  case "Programado":                return "bg-sky-500";
                  case "Recepcionado en bodega":     return "bg-indigo-500";
                  case "En proceso de conteo":       return "bg-primary-500";
                  case "Pendiente de aprobación":    return "bg-orange-500";
                  case "Completada":                 return "bg-green-500";
                  case "Cancelado":                  return "bg-neutral-400";
                  default:                           return "bg-neutral-300";
                }
              };

              // Extract time from fechaAgendada "dd/mm/yyyy HH:mm"
              const extractTime = (fa: string) => {
                const parts = fa.split(" ");
                return parts[1] ?? "";
              };

              // Helper: get ORs for a given ISO date
              const getOrsForDay = (iso: string) => calOrs.filter(o => {
                if (!o.fechaAgendada) return false;
                const parts = o.fechaAgendada.split(" ");
                const [d2, m2, y2] = parts[0].split("/");
                return `${y2}-${m2?.padStart(2,"0")}-${d2?.padStart(2,"0")}` === iso;
              });

              // Selected day ORs for mobile expansion panel
              const selectedDayOrs = selectedDay ? getOrsForDay(selectedDay) : [];
              const selectedDayDate = selectedDay ? new Date(selectedDay + "T12:00:00") : null;

              return (
                <>
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  {/* Day headers with colored top borders */}
                  <div className="grid grid-cols-7">
                    {DAY_HEADERS_FULL.map((d, idx) => (
                      <div key={idx} className={`px-1 sm:px-2 py-2 sm:py-2.5 text-center text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider ${idx < 6 ? "border-r border-neutral-100" : ""}`}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7">
                    {useDays.map((day, i) => {
                      const iso       = isoDate(day);
                      const inMonth   = day.getMonth() === month;
                      const blocked   = isDayBlocked(iso);
                      const feriadoDay = isDayFeriado(iso);
                      const isToday   = sameDay(day, new Date());
                      const dayOrs    = inMonth ? getOrsForDay(iso) : [];
                      const colIdx    = i % 7;
                      const isSelected = selectedDay === iso;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (inMonth && dayOrs.length > 0) {
                              const next = isSelected ? null : iso;
                              setSelectedDay(next);
                              if (next) {
                                setTimeout(() => {
                                  document.getElementById("mobile-day-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }, 80);
                              }
                            }
                          }}
                          className={`min-h-[54px] sm:min-h-[110px] border-b border-neutral-100 p-1 sm:p-1.5 flex flex-col transition-colors duration-200 ${
                            colIdx < 6 ? "border-r border-neutral-100" : ""
                          } ${
                            !inMonth     ? "bg-neutral-50/60" :
                            isSelected   ? "bg-primary-50/60 ring-1 ring-inset ring-primary-300" :
                            blocked      ? "bg-neutral-100/60" :
                            feriadoDay   ? "bg-orange-50/40" :
                            dayOrs.length > 0 ? "bg-white hover:bg-neutral-50/50 cursor-pointer sm:cursor-default" :
                                           "bg-white"
                          }`}
                        >
                          {/* Day number */}
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <span className={`text-[11px] sm:text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                              isToday   ? "bg-primary-500 text-white" :
                              !inMonth  ? "text-neutral-300" :
                              blocked || feriadoDay ? "text-neutral-400" :
                              "text-neutral-700"
                            }`}>
                              {day.getDate()}
                            </span>
                            {/* Mobile: colored dots for ORs */}
                            {inMonth && dayOrs.length > 0 && (
                              <div className="flex items-center gap-[2px] sm:hidden">
                                {dayOrs.length <= 3
                                  ? dayOrs.map((or, di) => (
                                      <span key={di} className={`w-[5px] h-[5px] rounded-full ${statusDotColor(or.estado ?? "")}`} />
                                    ))
                                  : <>
                                      {dayOrs.slice(0, 2).map((or, di) => (
                                        <span key={di} className={`w-[5px] h-[5px] rounded-full ${statusDotColor(or.estado ?? "")}`} />
                                      ))}
                                      <span className="text-[8px] text-neutral-500 font-bold leading-none">+{dayOrs.length - 2}</span>
                                    </>
                                }
                              </div>
                            )}
                          </div>

                          {/* Blocked / feriado label — desktop only for full text */}
                          {inMonth && (blocked || feriadoDay) && (
                            <span className="text-[9px] sm:text-[10px] text-neutral-400 font-medium flex items-center gap-0.5 mb-0.5 truncate">
                              <SlashCircle01 className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{blocked ? "Bloqueado" : (() => {
                                const f = feriados.find(f => f.fecha === iso);
                                return f ? f.nombre : "Feriado";
                              })()}</span>
                            </span>
                          )}

                          {/* Desktop: Event pills (hidden on mobile) */}
                          {dayOrs.length > 0 && (
                            <div className="hidden sm:flex flex-col gap-0.5 flex-1 min-h-0">
                              {dayOrs.slice(0, MAX_EVENTS_PER_CELL).map((or, idx) => (
                                <Link
                                  key={idx}
                                  href={`/recepciones/${or.id}`}
                                  className={`flex items-center gap-1 px-1.5 py-[3px] rounded border-l-[3px] text-[10px] leading-tight truncate transition-opacity hover:opacity-80 ${statusPillStyle(or.estado ?? "")}`}
                                >
                                  <span className="font-semibold truncate">{or.seller}</span>
                                  {or.fechaAgendada && extractTime(or.fechaAgendada) && (
                                    <span className="text-[9px] opacity-60 shrink-0">{extractTime(or.fechaAgendada)}</span>
                                  )}
                                </Link>
                              ))}
                              {dayOrs.length > MAX_EVENTS_PER_CELL && (
                                <button
                                  onClick={() => {
                                    setCalViewDate(day);
                                    setCalViewMode("week");
                                  }}
                                  className="text-[10px] text-primary-500 font-medium hover:text-primary-700 text-left px-1.5 transition-colors"
                                >
                                  +{dayOrs.length - MAX_EVENTS_PER_CELL} más...
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile: Selected day expansion panel — vertical card layout */}
                {selectedDay && selectedDayOrs.length > 0 && (
                  <div id="mobile-day-panel" className="sm:hidden bg-white border border-neutral-200 rounded-xl overflow-hidden mt-3 mb-24">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                      <p className="text-sm font-semibold text-neutral-800">
                        {selectedDayDate && selectedDayDate.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                        <span className="text-neutral-400 font-normal"> · {selectedDayOrs.length} OR{selectedDayOrs.length !== 1 ? "s" : ""}</span>
                      </p>
                      <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-neutral-100 rounded-lg">
                        <X className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {selectedDayOrs.map((or, idx) => (
                        <Link
                          key={idx}
                          href={`/recepciones/${or.id}`}
                          className="block px-4 py-3.5 hover:bg-neutral-50 transition-colors"
                        >
                          {/* Vertical layout */}
                          <div className="flex items-start gap-3">
                            <span className={`w-1 self-stretch rounded-full shrink-0 ${statusDotColor(or.estado ?? "")}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-neutral-800 truncate">{or.seller}</p>
                                <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">{or.id}</p>
                              <div className="flex items-center justify-between mt-2">
                                {or.fechaAgendada && extractTime(or.fechaAgendada) && (
                                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {extractTime(or.fechaAgendada)}
                                  </span>
                                )}
                                {or.estado && <StatusBadge status={or.estado as Status} />}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                </>
              );
            })()}

          </div>
        )}

      </div>

      {/* ── Deactivate confirmation modal ─────────────────────────────────── */}
      {deactivateTarget !== null && (() => {
        const suc = sucursales.find(s => s.id === deactivateTarget);
        if (!suc) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-neutral-900">Desactivar {suc.label}</h1>
                    <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                      Desactivar esta sucursal ocultará sus slots del calendario y bloqueará nuevos
                      agendamientos. Los agendamientos existentes{" "}
                      <strong className="text-neutral-700">no se verán afectados</strong>.
                    </p>
                    <p className="text-sm text-neutral-600 mt-1.5">
                      Puedes reactivarla en cualquier momento desde este panel.
                    </p>
                  </div>
                </div>
                <button onClick={() => setDeactivateTarget(null)} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300 flex-shrink-0">
                  <X className="w-4 h-4 text-neutral-600" />
                </button>
              </div>
              {/* Footer */}
              <div className="flex gap-3 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5">
                <Button variant="secondary" size="lg" onClick={() => setDeactivateTarget(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => confirmDeactivate(deactivateTarget)}
                  iconLeft={<SlashCircle01 className="w-4 h-4" />}
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                >
                  Desactivar sucursal
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Mobile sticky save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 pt-3 pb-6 z-30 lg:hidden">
        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium flex-1">
              <CheckCircle className="w-4 h-4" />
              Guardada
            </span>
          )}
          <button
            onClick={saveConfig}
            className="flex-1 h-12 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
          >
            <Check className="w-4 h-4" />
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
}
