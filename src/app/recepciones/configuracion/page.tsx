"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, Check, X, Trash2,
  Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Settings01, Calendar, AlertTriangle, CheckCircle,
  Clock, Building01, SlashCircle01, CalendarDate,
} from "@untitled-ui/icons-react";

// ─── Constants ────────────────────────────────────────────────────────────────
type Sucursal = { id: string; label: string; address: string; active: boolean };

const DEFAULT_SUCURSALES: Sucursal[] = [
  { id: "quilicura",        label: "Quilicura",       address: "El Juncal 901, Quilicura", active: true },
  { id: "la-reina",         label: "La Reina",         address: "La Reina, Santiago",       active: true },
  { id: "lo-barnechea",     label: "Lo Barnechea",     address: "Lo Barnechea, Santiago",   active: true },
  { id: "santiago-centro",  label: "Santiago Centro",  address: "Santiago Centro",          active: true },
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
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
        <p className="text-sm text-gray-700 font-medium">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
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
  const [newSucursalForm,  setNewSucursalForm]  = useState({ label: "", address: "" });
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);

  // ── Calendar view state ───────────────────────────────────────────────────
  const [calViewMode,    setCalViewMode]    = useState<"week" | "month">("week");
  const [calViewDate,    setCalViewDate]    = useState(new Date());
  const [calSucursal,    setCalSucursal]    = useState("quilicura");
  const [selectedSlot,   setSelectedSlot]   = useState<{ date: string; hora: string } | null>(null);

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
    saveSucursales([...sucursales, { id, label, address: newSucursalForm.address.trim(), active: true }]);
    setShowAddSucursal(false);
    setNewSucursalForm({ label: "", address: "" });
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

  // ── Calendar mock ORs ─────────────────────────────────────────────────────
  const calOrs = useMemo(() => {
    try {
      const stored = localStorage.getItem("amplifica_created_ors");
      const raw: { fechaAgendada?: string; sucursal?: string; seller?: string; estado?: string; id?: string }[] =
        stored ? JSON.parse(stored) : [];
      return raw.filter(o =>
        o.fechaAgendada &&
        (o.sucursal ?? "").toLowerCase().replace(/\s/g, "-") === calSucursal
      );
    } catch { return []; }
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
    <div className="min-h-screen bg-gray-50">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/recepciones" className="hover:text-indigo-600 transition-colors">Recepciones</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-700 font-medium">Configuración</span>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* ── Title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Settings01 className="w-6 h-6 text-gray-400" />
              Configuración
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Panel de administración del calendario de recepciones</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: "sucursales",  label: "Sucursales",           icon: Building01 },
            { key: "feriados",    label: "Feriados y bloqueos",  icon: CalendarDate },
            { key: "calendario",  label: "Vista de calendario",  icon: Calendar },
          ] as const).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        activeSucursal === s.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      <Building01 className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                    {/* Deactivate button (visible on hover) */}
                    <button
                      onClick={() => setDeactivateTarget(s.id)}
                      title="Desactivar sucursal"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {/* Add new sucursal */}
                <button
                  onClick={() => setShowAddSucursal(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva sucursal
                </button>
              </div>

              {/* Inactive sucursales — click to reactivate */}
              {sucursales.some(s => !s.active) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium">Inactivas:</span>
                  {sucursales.filter(s => !s.active).map(s => (
                    <button
                      key={s.id}
                      onClick={() => reactivateSucursal(s.id)}
                      title="Reactivar sucursal"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-dashed border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Add sucursal inline form */}
              {showAddSucursal && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-indigo-800">Nueva sucursal</p>
                    <button onClick={() => setShowAddSucursal(false)} className="text-indigo-400 hover:text-indigo-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre *</label>
                      <input
                        type="text"
                        value={newSucursalForm.label}
                        onChange={e => setNewSucursalForm(f => ({ ...f, label: e.target.value }))}
                        placeholder="Ej: Maipú, Las Condes..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Dirección</label>
                      <input
                        type="text"
                        value={newSucursalForm.address}
                        onChange={e => setNewSucursalForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Ej: Av. Pajaritos 123, Maipú"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddSucursal(false)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={addSucursal}
                      disabled={!newSucursalForm.label.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                      className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                        cfg.diasHabilitados.includes(d.key)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </FieldRow>

              <div className="border-t border-gray-100 pt-4">
                <FieldRow label="Hora de operación" hint="Rango horario en que se abren slots de recepción">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={cfg.horaInicio}
                      onChange={e => updateCfg({ horaInicio: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <input
                      type="time"
                      value={cfg.horaFin}
                      onChange={e => updateCfg({ horaFin: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                    />
                  </div>
                </FieldRow>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <FieldRow label="Duración del slot" hint="Tiempo estándar de cada bloque de recepción">
                  <div className="relative">
                    <select
                      value={cfg.duracionSlot}
                      onChange={e => updateCfg({ duracionSlot: Number(e.target.value) })}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    >
                      {[30, 45, 60, 90, 120].map(m => (
                        <option key={m} value={m}>{m} minutos</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                />
              </FieldRow>
              <div className="border-t border-gray-100 pt-4">
                <FieldRow label="Límite de sobrecupos diarios" hint="Máximo de ORs extra permitidas por encima de la capacidad normal">
                  <input
                    type="number" min={0} max={20}
                    value={cfg.sobrecuposDiarios}
                    onChange={e => updateCfg({ sobrecuposDiarios: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
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
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                  />
                  <span className="text-sm text-gray-500">días</span>
                </div>
              </FieldRow>
              <div className="border-t border-gray-100 pt-4">
                <FieldRow label="Días máximos a futuro" hint="Máximo de días hacia adelante visibles en el calendario del seller">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={7} max={120}
                      value={cfg.diasMaxFuturo}
                      onChange={e => updateCfg({ diasMaxFuturo: Math.max(7, parseInt(e.target.value) || 7) })}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                    />
                    <span className="text-sm text-gray-500">días</span>
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
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {[6, 12, 24, 48, 72].map(h => (
                      <option key={h} value={h}>{h} horas antes</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </FieldRow>
              <div className="border-t border-gray-100 pt-4">
                <FieldRow label="Máximo de reagendamientos por OR" hint="Cantidad de veces que un seller puede cambiar su slot">
                  <input
                    type="number" min={1} max={10}
                    value={cfg.maxReagendamientos}
                    onChange={e => updateCfg({ maxReagendamientos: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                  />
                </FieldRow>
              </div>
            </ConfigCard>

            {/* ── Save button ── */}
            <div className="flex items-center justify-end gap-3 pt-1 pb-8">
              {savedToast && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Configuración guardada
                </span>
              )}
              <button
                onClick={saveConfig}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Guardar configuración
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: FERIADOS Y BLOQUEOS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "feriados" && (
          <div className="space-y-4">

            {/* Sub-tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {([
                { key: "nacionales", label: "Feriados nacionales" },
                { key: "bloqueos",   label: "Bloqueos" },
              ] as const).map(st => (
                <button
                  key={st.key}
                  onClick={() => setFeriadosSubTab(st.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    feriadosSubTab === st.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
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
                  <p className="text-sm text-gray-500">
                    {feriados.length === 0
                      ? "No hay feriados cargados."
                      : `${feriados.length} feriados cargados para 2026`}
                  </p>
                  <button
                    onClick={cargarFeriados2026}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                  >
                    <CalendarDate className="w-4 h-4" />
                    Cargar feriados 2026
                  </button>
                </div>

                {feriados.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-3 text-center">
                    <CalendarDate className="w-10 h-10 text-gray-300" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Sin feriados cargados</p>
                      <p className="text-xs text-gray-400 mt-0.5">Haz clic en "Cargar feriados 2026" para precargar el calendario nacional</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nombre</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Sucursales que operan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feriados.map(f => (
                          <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 tabular-nums text-gray-600 font-medium whitespace-nowrap">
                              {fmtFecha(f.fecha)}
                            </td>
                            <td className="px-4 py-3 text-gray-800">{f.nombre}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {sucursales.map(s => {
                                  const opera = f.sucursalesExcluidas.includes(s.id);
                                  return (
                                    <button
                                      key={s.id}
                                      onClick={() => toggleSucursalExcluida(f.id, s.id)}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                        opera
                                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                          : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
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

                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Por defecto los feriados aplican a todas las sucursales. Activa una sucursal para indicar que sí opera ese día.
                </p>
              </div>
            )}

            {/* ── Bloqueos ── */}
            {feriadosSubTab === "bloqueos" && (
              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {bloqueos.length === 0 ? "No hay bloqueos activos." : `${bloqueos.length} bloqueo${bloqueos.length !== 1 ? "s" : ""} activo${bloqueos.length !== 1 ? "s" : ""}`}
                  </p>
                  <button
                    onClick={() => setShowAddBloqueo(s => !s)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar bloqueo
                  </button>
                </div>

                {/* Add bloqueo form */}
                {showAddBloqueo && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-indigo-800">Nuevo bloqueo</p>
                      <button onClick={() => setShowAddBloqueo(false)} className="text-indigo-400 hover:text-indigo-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Sucursal */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Sucursal</label>
                        <div className="relative">
                          <select
                            value={bloqueoForm.sucursalId}
                            onChange={e => setBloqueoForm(f => ({ ...f, sucursalId: e.target.value }))}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de bloqueo</label>
                        <div className="relative">
                          <select
                            value={bloqueoForm.tipo}
                            onChange={e => setBloqueoForm(f => ({ ...f, tipo: e.target.value as Bloqueo["tipo"] }))}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            <option value="dia">Día completo</option>
                            <option value="rango">Rango de fechas</option>
                            <option value="horario">Rango horario</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Fecha inicio */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          {bloqueoForm.tipo === "rango" ? "Fecha inicio" : "Fecha"}
                        </label>
                        <input
                          type="date"
                          value={bloqueoForm.fechaInicio}
                          onChange={e => setBloqueoForm(f => ({ ...f, fechaInicio: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>

                      {/* Fecha fin (rango) */}
                      {bloqueoForm.tipo === "rango" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha fin</label>
                          <input
                            type="date"
                            value={bloqueoForm.fechaFin}
                            min={bloqueoForm.fechaInicio}
                            onChange={e => setBloqueoForm(f => ({ ...f, fechaFin: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </div>
                      )}

                      {/* Horario (tipo horario) */}
                      {bloqueoForm.tipo === "horario" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Rango horario</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={bloqueoForm.horaInicio}
                              onChange={e => setBloqueoForm(f => ({ ...f, horaInicio: e.target.value }))}
                              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            <span className="text-gray-400">—</span>
                            <input
                              type="time"
                              value={bloqueoForm.horaFin}
                              onChange={e => setBloqueoForm(f => ({ ...f, horaFin: e.target.value }))}
                              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Motivo *</label>
                      <input
                        type="text"
                        value={bloqueoForm.motivo}
                        onChange={e => setBloqueoForm(f => ({ ...f, motivo: e.target.value }))}
                        placeholder="Ej: Mantención de andén, Fumigación..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowAddBloqueo(false)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addBloqueo}
                        disabled={!bloqueoForm.fechaInicio || !bloqueoForm.motivo}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Guardar bloqueo
                      </button>
                    </div>
                  </div>
                )}

                {/* Bloqueos table */}
                {bloqueos.length === 0 && !showAddBloqueo ? (
                  <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-3 text-center">
                    <SlashCircle01 className="w-10 h-10 text-gray-300" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Sin bloqueos activos</p>
                      <p className="text-xs text-gray-400 mt-0.5">Agrega un bloqueo para deshabilitar una sucursal en una fecha específica</p>
                    </div>
                  </div>
                ) : bloqueos.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Sucursal</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tipo</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Horario</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Motivo</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {bloqueos.map(b => {
                          const suc = sucursales.find(s => s.id === b.sucursalId);
                          return (
                            <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-800">{suc?.label ?? b.sucursalId}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  b.tipo === "dia"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  b.tipo === "rango"  ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {b.tipo === "dia" ? "Día completo" : b.tipo === "rango" ? "Rango" : "Horario"}
                                </span>
                              </td>
                              <td className="px-4 py-3 tabular-nums text-gray-600">
                                {b.tipo === "rango"
                                  ? `${fmtFecha(b.fechaInicio)} — ${fmtFecha(b.fechaFin)}`
                                  : fmtFecha(b.fechaInicio)}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-gray-500 text-xs">
                                {b.tipo === "horario" ? `${b.horaInicio} — ${b.horaFin}` : "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{b.motivo}</td>
                              <td className="px-4 py-3">
                                {deleteBloqueo === b.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => removeBloqueo(b.id)}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                    >
                                      Sí, eliminar
                                    </button>
                                    <button
                                      onClick={() => setDeleteBloqueo(null)}
                                      className="px-2.5 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteBloqueo(b.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="space-y-4">

            {/* Controls bar */}
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 flex items-center gap-4 flex-wrap">

              {/* Sucursal */}
              <div className="flex items-center gap-2">
                <Building01 className="w-4 h-4 text-gray-400" />
                <div className="relative">
                  <select
                    value={calSucursal}
                    onChange={e => { setCalSucursal(e.target.value); setSelectedSlot(null); }}
                    className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white font-medium text-gray-700"
                  >
                    {sucursales.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="h-5 w-px bg-gray-200" />

              {/* Week/Month toggle */}
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                {(["week", "month"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setCalViewMode(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      calViewMode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m === "week" ? "Semana" : "Mes"}
                  </button>
                ))}
              </div>

              {/* Date navigation */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => setCalViewDate(d => calViewMode === "week" ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
                  {calViewMode === "week"
                    ? (() => {
                        const sw = startOfWeek(calViewDate);
                        const ew = addDays(sw, 6);
                        return `${sw.getDate()} ${sw.toLocaleString("es-CL", { month: "short" })} — ${ew.getDate()} ${ew.toLocaleString("es-CL", { month: "long", year: "numeric" })}`;
                      })()
                    : calViewDate.toLocaleString("es-CL", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => setCalViewDate(d => calViewMode === "week" ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Tiempo anticipado + leyenda */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">Tiempo anticipado:</span>
                <div className="relative">
                  <select
                    value={calCfg.tiempoAnticipado}
                    onChange={e => {
                      const next = { ...(configs[calSucursal] ?? DEFAULT_CONFIG), tiempoAnticipado: Number(e.target.value) };
                      const nc = { ...configs, [calSucursal]: next };
                      setConfigs(nc);
                      try { localStorage.setItem(LS_CONFIG, JSON.stringify(nc)); } catch { /* ignore */ }
                    }}
                    className="appearance-none pl-2 pr-6 py-0.5 text-xs font-semibold text-indigo-600 focus:outline-none bg-transparent"
                  >
                    {[6, 12, 24, 48, 72].map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                  <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200 inline-block" /> Disponible</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200 inline-block" /> &gt;70% ocupado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" /> Lleno / sobrecupo</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300 inline-block" /> Bloqueado</span>
              </div>
            </div>

            {/* ── WEEK VIEW ── */}
            {calViewMode === "week" && (() => {
              const weekStart = startOfWeek(calViewDate);
              const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

              return (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
                    <div className="px-3 py-3 border-r border-gray-100" />
                    {weekDays.map((day, i) => {
                      const iso     = isoDate(day);
                      const blocked = isDayBlocked(iso);
                      const feriado = isDayFeriado(iso);
                      const isToday = sameDay(day, new Date());
                      return (
                        <div key={i} className={`px-2 py-3 text-center border-r border-gray-100 last:border-0 ${blocked || feriado ? "bg-gray-50" : ""}`}>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            {day.toLocaleString("es-CL", { weekday: "short" })}
                          </p>
                          <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-indigo-600" : "text-gray-800"}`}>
                            {day.getDate()}
                          </p>
                          {(blocked || feriado) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 font-medium">
                              <SlashCircle01 className="w-2.5 h-2.5" />
                              {blocked ? "Bloqueado" : "Feriado"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Slots */}
                  <div className="overflow-y-auto max-h-[500px]">
                    {slots.map(slot => (
                      <div
                        key={slot}
                        className="grid border-b border-gray-50 last:border-0"
                        style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}
                      >
                        <div className="px-3 py-2 border-r border-gray-100 flex items-center">
                          <span className="text-xs font-medium text-gray-400 tabular-nums">{slot}</span>
                        </div>
                        {weekDays.map((day, di) => {
                          const iso     = isoDate(day);
                          const blocked = isDayBlocked(iso);
                          const feriado = isDayFeriado(iso);
                          if (blocked || feriado) {
                            return (
                              <div key={di} className="border-r border-gray-100 last:border-0 bg-gray-50/80 py-1 px-2" />
                            );
                          }
                          const orsHere = orsForSlot(iso, slot);
                          const cap     = calCfg.slotsSimultaneos;
                          const occ     = orsHere.length;
                          const pct     = cap > 0 ? (occ / cap) * 100 : 0;
                          const isSelected = selectedSlot?.date === iso && selectedSlot?.hora === slot;
                          const cellColor =
                            occ === 0        ? "hover:bg-green-50/50 cursor-default" :
                            pct >= 100        ? "bg-red-50 hover:bg-red-100 cursor-pointer" :
                            pct >= 70         ? "bg-amber-50 hover:bg-amber-100 cursor-pointer" :
                                               "bg-green-50/60 hover:bg-green-100 cursor-pointer";
                          return (
                            <div
                              key={di}
                              onClick={() => occ > 0 && setSelectedSlot(isSelected ? null : { date: iso, hora: slot })}
                              className={`border-r border-gray-100 last:border-0 py-1 px-2 min-h-[40px] transition-colors ${cellColor} ${isSelected ? "ring-2 ring-inset ring-indigo-400" : ""}`}
                            >
                              {occ > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`text-[11px] font-bold tabular-nums ${pct >= 100 ? "text-red-600" : pct >= 70 ? "text-amber-700" : "text-green-700"}`}>
                                    {occ}/{cap}
                                  </span>
                                  {orsHere.slice(0, 2).map((or, i) => (
                                    <span key={i} className="text-[9px] text-gray-500 truncate max-w-[60px]">{or.seller ?? or.id}</span>
                                  ))}
                                  {orsHere.length > 2 && (
                                    <span className="text-[9px] text-gray-400">+{orsHere.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Selected slot detail panel */}
                  {selectedSlot && (() => {
                    const ors = orsForSlot(selectedSlot.date, selectedSlot.hora);
                    return (
                      <div className="border-t border-indigo-100 bg-indigo-50/50 px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-indigo-800">
                            {fmtFecha(selectedSlot.date)} · {selectedSlot.hora} — {ors.length} OR{ors.length !== 1 ? "s" : ""}
                          </p>
                          <button onClick={() => setSelectedSlot(null)} className="text-indigo-400 hover:text-indigo-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {ors.map((or, i) => (
                            <div key={i} className="bg-white border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-3 text-sm">
                              <span className="font-mono text-xs text-gray-500">{or.id ?? "—"}</span>
                              <span className="font-medium text-gray-800">{or.seller ?? "—"}</span>
                              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                                or.estado === "Programado" ? "bg-indigo-100 text-indigo-700" :
                                or.estado === "Completado sin diferencias" ? "bg-green-100 text-green-700" :
                                "bg-gray-100 text-gray-500"
                              }`}>{or.estado ?? "—"}</span>
                            </div>
                          ))}
                          {ors.length === 0 && <p className="text-xs text-indigo-500">Sin ORs en este slot.</p>}
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
              // Start grid on Monday before the first day
              const gridStart = startOfWeek(firstDay);
              const days = Array.from({ length: 35 }, (_, i) => addDays(gridStart, i));
              const DAY_HEADERS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

              return (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {DAY_HEADERS.map(d => (
                      <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-400 border-r border-gray-100 last:border-0">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7">
                    {days.map((day, i) => {
                      const iso       = isoDate(day);
                      const inMonth   = day.getMonth() === month;
                      const blocked   = isDayBlocked(iso);
                      const feriado   = isDayFeriado(iso);
                      const isToday   = sameDay(day, new Date());
                      const dayOrs    = calOrs.filter(o => {
                        if (!o.fechaAgendada) return false;
                        const parts = o.fechaAgendada.split(" ");
                        const [d2, m2, y2] = parts[0].split("/");
                        return `${y2}-${m2?.padStart(2,"0")}-${d2?.padStart(2,"0")}` === iso;
                      });
                      const orCount   = dayOrs.length;
                      const cap       = calCfg.slotsSimultaneos * slots.length;
                      const pct       = cap > 0 ? (orCount / cap) * 100 : 0;
                      const dotColor  =
                        blocked || feriado ? "bg-gray-400" :
                        orCount === 0      ? "bg-green-400" :
                        pct >= 80          ? "bg-red-400" :
                        pct >= 50          ? "bg-amber-400" :
                                             "bg-green-400";

                      return (
                        <div
                          key={i}
                          className={`min-h-[90px] border-b border-r border-gray-100 last:border-r-0 p-2 flex flex-col gap-1 transition-colors ${
                            !inMonth     ? "bg-gray-50/50" :
                            blocked      ? "bg-gray-100/80" :
                            feriado      ? "bg-orange-50/60" :
                                           "hover:bg-gray-50/80"
                          }`}
                        >
                          {/* Day number */}
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                              isToday   ? "bg-indigo-600 text-white" :
                              !inMonth  ? "text-gray-300" :
                              blocked || feriado ? "text-gray-400" :
                              "text-gray-800"
                            }`}>
                              {day.getDate()}
                            </span>
                            {inMonth && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
                          </div>

                          {/* Blocked / feriado label */}
                          {inMonth && (blocked || feriado) && (
                            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5">
                              <SlashCircle01 className="w-2.5 h-2.5" />
                              {blocked ? "Bloqueado" : "Feriado"}
                            </span>
                          )}

                          {/* OR count badge */}
                          {inMonth && !blocked && !feriado && orCount > 0 && (
                            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded w-fit ${
                              pct >= 80 ? "bg-red-100 text-red-700" :
                              pct >= 50 ? "bg-amber-100 text-amber-700" :
                                          "bg-green-100 text-green-700"
                            }`}>
                              {orCount} OR{orCount !== 1 ? "s" : ""}
                            </span>
                          )}

                          {/* Feriado name */}
                          {inMonth && feriado && (() => {
                            const f = feriados.find(f => f.fecha === iso);
                            return f ? (
                              <span className="text-[10px] text-orange-600 truncate">{f.nombre}</span>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
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
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Desactivar {suc.label}</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Desactivar esta sucursal ocultará sus slots del calendario y bloqueará nuevos
                      agendamientos. Los agendamientos existentes{" "}
                      <strong className="text-gray-700">no se verán afectados</strong>.
                    </p>
                    <p className="text-sm text-gray-400 mt-1.5">
                      Puedes reactivarla en cualquier momento desde este panel.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeactivateTarget(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDeactivate(deactivateTarget)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <SlashCircle01 className="w-4 h-4" />
                  Desactivar sucursal
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
