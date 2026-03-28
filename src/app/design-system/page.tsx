"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  Palette, Type, RectangleHorizontal, FormInput,
  AlertTriangle, Tag, SquareStack, Ruler, Sparkles, Copy, Check,
  Trash2, Info, Plus, ArrowRight, Search, Download, CheckCircle2,
  Clock, Ban, Table2, BarChart3, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Play,
  ClipboardCheck, Eye, Package,
} from "lucide-react";

// ── Actual components ────────────────────────────────────────────────────────
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import AlertModal from "@/components/ui/AlertModal";
import StatusBadge, { type Status } from "@/components/recepciones/StatusBadge";
import ScrollArea from "@/components/ui/ScrollArea";
import StepIndicator from "@/components/recepciones/StepIndicator";
import AmplificaLogo from "@/components/layout/AmplificaLogo";
import { useContentSize, type ContentSize } from "@/hooks/useContentSize";

// ═════════════════════════════════════════════════════════════════════════════
// DATA
// ═════════════════════════════════════════════════════════════════════════════

type SectionItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
type SectionGroup = { group: string; items: SectionItem[] };

const NAV_GROUPS: SectionGroup[] = [
  {
    group: "Fundamentos",
    items: [
      { id: "colores",    label: "Colores",           icon: Palette },
      { id: "tipografia", label: "Tipografía",        icon: Type },
      { id: "spacing",    label: "Espaciado & Radio", icon: Ruler },
    ],
  },
  {
    group: "Componentes",
    items: [
      { id: "botones",      label: "Botones",       icon: RectangleHorizontal },
      { id: "formularios",  label: "Formularios",   icon: FormInput },
      { id: "modales",      label: "Modales",       icon: AlertTriangle },
      { id: "badges",       label: "Badges",        icon: Tag },
      { id: "tablas",       label: "Tablas",        icon: Table2 },
      { id: "progress",     label: "Progress Bars", icon: BarChart3 },
      { id: "cards",        label: "Cards & Layout", icon: SquareStack },
    ],
  },
  {
    group: "Patrones",
    items: [
      { id: "otros", label: "Otros", icon: Sparkles },
    ],
  },
];

// Flat list for scrollspy observer
const ALL_SECTIONS = NAV_GROUPS.flatMap(g => g.items);

const PRIMARY_COLORS = [
  { name: "25",  hex: "#EBF1FF" },
  { name: "50",  hex: "#D6E2FF" },
  { name: "100", hex: "#B6CBFF" },
  { name: "200", hex: "#8CA9FF" },
  { name: "300", hex: "#637BFF" },
  { name: "400", hex: "#4548FF" },
  { name: "500", hex: "#2F30FF" },
  { name: "600", hex: "#1F1DDE" },
  { name: "700", hex: "#1B1CAD" },
  { name: "800", hex: "#1D2084" },
  { name: "900", hex: "#141449" },
];

const NEUTRAL_COLORS = [
  { name: "50",  hex: "#FAFAFA" },
  { name: "100", hex: "#F4F4F5" },
  { name: "200", hex: "#E5E5E6" },
  { name: "300", hex: "#D5D5D7" },
  { name: "400", hex: "#A3A3A8" },
  { name: "500", hex: "#737378" },
  { name: "600", hex: "#545459" },
  { name: "700", hex: "#414144" },
  { name: "800", hex: "#282829" },
  { name: "900", hex: "#1D1D1F" },
  { name: "950", hex: "#09090B" },
];

const CHART_COLORS = [
  { name: "Blue-Violet", hex: "#5B5BFF" },
  { name: "Pink",        hex: "#E84393" },
  { name: "Yellow",      hex: "#FEDE00" },
  { name: "Green-Mint",  hex: "#3DDB85" },
  { name: "Gray",        hex: "#D1D5DB" },
];

const SEMANTIC_COLORS = [
  { name: "Destructive", hex: "#EF4444", usage: "Errores, eliminar" },
  { name: "Warning",     hex: "#F59E0B", usage: "Advertencias" },
  { name: "Success",     hex: "#22C55E", usage: "Confirmaciones" },
  { name: "Info",        hex: "#3B82F6", usage: "Información" },
];

const ALL_STATUSES: Status[] = [
  "Creado", "Programado", "Recepcionado en bodega",
  "En proceso de conteo", "Pendiente de aprobación",
  "Completada", "Cancelado",
];

const TABLE_ROWS = [
  { id: "RO-BARRA-193", creacion: "12/03/2026", fechaAgendada: "13/03/2026 11:00", tienda: "Extra Life", estado: "Programado" as Status, progreso: 0 },
  { id: "RO-BARRA-191", creacion: "01/03/2026", fechaAgendada: "Sin agendar",     tienda: "Extra Life", estado: "Creado" as Status, progreso: 0 },
  { id: "RO-BARRA-210", creacion: "10/03/2026", fechaAgendada: "Sin agendar",     tienda: "Gohard",     estado: "Creado" as Status, progreso: 0 },
  { id: "RO-BARRA-183", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", tienda: "Extra Life", estado: "En proceso de conteo" as Status, progreso: 45 },
  { id: "RO-BARRA-182", creacion: "16/02/2026", fechaAgendada: "20/02/2026 16:30", tienda: "Extra Life", estado: "Pendiente de aprobación" as Status, progreso: 100 },
  { id: "RO-BARRA-194", creacion: "07/03/2026", fechaAgendada: "11/03/2026 10:00", tienda: "VitaFit",   estado: "Completada" as Status, progreso: 100 },
];

const PROGRESS_EXAMPLES = [
  { label: "Límite de pedidos mensual", current: 156, max: 200, variant: "primary" as const },
  { label: "Avance de conteo",          current: 78,  max: 100, variant: "success" as const },
  { label: "Uso de almacenamiento",     current: 85,  max: 100, variant: "warning" as const },
  { label: "Capacidad excedida",        current: 112, max: 100, variant: "danger" as const },
];

const RADIUS_SCALE = [
  { name: "sm",  calc: "0.6x", px: "6px" },
  { name: "md",  calc: "0.8x", px: "8px" },
  { name: "lg",  calc: "1x",   px: "10px" },
  { name: "xl",  calc: "1.4x", px: "14px" },
  { name: "2xl", calc: "1.8x", px: "18px" },
  { name: "3xl", calc: "2.2x", px: "22px" },
  { name: "4xl", calc: "2.6x", px: "26px" },
];

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function SectionHeader({
  id,
  title,
  description,
  refCb,
}: {
  id: string;
  title: string;
  description?: string;
  refCb: (el: HTMLElement | null) => void;
}) {
  return (
    <div id={id} ref={refCb} className="scroll-mt-8">
      <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
      {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
      <div className="h-px bg-neutral-200 mt-3" />
    </div>
  );
}

function PreviewCard({ title, children, code }: { title: string; children: ReactNode; code?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-600">{title}</span>
        {code && (
          <button onClick={copy} className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      {code && (
        <div className="border-t border-neutral-200 bg-neutral-950 px-4 py-3 overflow-x-auto">
          <pre className="text-[11px] text-neutral-300 font-mono whitespace-pre-wrap">{code}</pre>
        </div>
      )}
    </div>
  );
}

function ColorSwatch({ name, hex, label }: { name: string; hex: string; label?: string }) {
  const isDark = hex <= "#666666" || hex === "#09090B" || hex === "#1D1D1F" || hex === "#141449" || hex === "#1D2084" || hex === "#1B1CAD" || hex === "#282829" || hex === "#414144";
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
      <div
        className={`w-14 h-14 rounded-xl ring-1 ring-neutral-200 flex items-center justify-center text-[9px] font-mono ${isDark ? "text-white/60" : "text-black/30"}`}
        style={{ backgroundColor: hex }}
      >
        {name}
      </div>
      {label && <span className="text-[10px] text-neutral-500 font-medium">{label}</span>}
      <span className="text-[10px] text-neutral-400 font-mono">{hex}</span>
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-neutral-800 mt-6 mb-3">{children}</h3>;
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function DesignSystemPage() {
  // ── Scrollspy ────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<string>(ALL_SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const setRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  // ── Interactive state ────────────────────────────────────────────────────
  const [btnVariant, setBtnVariant] = useState<"primary" | "secondary" | "tertiary">("primary");
  const [modalVariant, setModalVariant] = useState<"primary" | "danger" | "warning" | "info" | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("usuario@ejemplo.cl");
  const [formSelect, setFormSelect] = useState("");
  const [formTextarea, setFormTextarea] = useState("");
  const [stepCurrent, setStepCurrent] = useState(1);
  const { size: contentSize } = useContentSize();

  const modalIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    primary: CheckCircle2, danger: Trash2, warning: AlertTriangle, info: Info,
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] pb-24">
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-4">
        <Link href="/dashboard" className="hover:text-neutral-700 transition-colors">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-700 font-medium">Design System</span>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-neutral-900">Design System</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Referencia visual de tokens, componentes y patrones reutilizables de Amplifica.
        </p>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="flex gap-8">
        {/* Left: scrollspy nav */}
        <nav className="hidden lg:block w-44 flex-shrink-0">
          <div className="sticky top-6 space-y-3">
            {NAV_GROUPS.map(group => (
              <div key={group.group}>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold mb-1.5 px-2">{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map(s => {
                    const Icon = s.icon;
                    const isActive = activeSection === s.id;
                    return (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                          isActive
                            ? "bg-primary-25 text-primary-600"
                            : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {s.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Right: content */}
        <div className="flex-1 min-w-0 space-y-14">

          {/* ═══════════════════════════════════════════════════════════════
              1. COLORES
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="colores" title="Colores" description="Paleta de colores del sistema. Variables CSS definidas en globals.css." refCb={setRef("colores")} />

            <SubHeading>Primary (Brand)</SubHeading>
            <div className="flex flex-wrap gap-3">
              {PRIMARY_COLORS.map(c => <ColorSwatch key={c.name} name={c.name} hex={c.hex} label={`primary-${c.name}`} />)}
            </div>

            <SubHeading>Neutral</SubHeading>
            <div className="flex flex-wrap gap-3">
              {NEUTRAL_COLORS.map(c => <ColorSwatch key={c.name} name={c.name} hex={c.hex} label={`neutral-${c.name}`} />)}
            </div>

            <SubHeading>Charts</SubHeading>
            <div className="flex flex-wrap gap-3">
              {CHART_COLORS.map(c => <ColorSwatch key={c.name} name={c.name} hex={c.hex} label={c.name} />)}
            </div>

            <SubHeading>Semánticos</SubHeading>
            <div className="flex flex-wrap gap-4">
              {SEMANTIC_COLORS.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg ring-1 ring-neutral-200" style={{ backgroundColor: c.hex }} />
                  <div>
                    <p className="text-xs font-semibold text-neutral-700">{c.name}</p>
                    <p className="text-[10px] text-neutral-400">{c.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              2. TIPOGRAFIA
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="tipografia" title="Tipografía" description="Familias tipográficas, escalas y pesos." refCb={setRef("tipografia")} />

            <PreviewCard title="Font Families">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Inter (Sans — Principal)</p>
                  <p className="text-xl font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Atkinson Hyperlegible (Mono)</p>
                  <p className="text-xl font-medium" style={{ fontFamily: "Atkinson Hyperlegible, monospace" }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>
              </div>
            </PreviewCard>

            <PreviewCard title="Escala tipográfica" code={`text-2xl  →  24px\ntext-xl   →  20px\ntext-lg   →  18px\ntext-base →  var (14/16/18px)\ntext-sm   →  var (13/14/16px)\ntext-xs   →  var (12/13/14px)`}>
              <div className="space-y-3">
                {[
                  { cls: "text-2xl", label: "text-2xl · 24px" },
                  { cls: "text-xl",  label: "text-xl · 20px" },
                  { cls: "text-lg",  label: "text-lg · 18px" },
                  { cls: "text-base", label: `text-base · content-${contentSize}` },
                  { cls: "text-sm",  label: `text-sm · content-${contentSize}` },
                  { cls: "text-xs",  label: `text-xs · content-${contentSize}` },
                ].map(s => (
                  <div key={s.cls} className="flex items-baseline gap-4">
                    <span className="text-[10px] text-neutral-400 font-mono w-40 flex-shrink-0 text-right">{s.label}</span>
                    <span className={`${s.cls} text-neutral-800`}>Amplifica Design System</span>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title="Font Weights">
              <div className="space-y-2">
                {[
                  { weight: "font-normal",   label: "400 — Regular" },
                  { weight: "font-medium",   label: "500 — Medium" },
                  { weight: "font-semibold", label: "600 — Semibold" },
                  { weight: "font-bold",     label: "700 — Bold" },
                ].map(w => (
                  <div key={w.weight} className="flex items-baseline gap-4">
                    <span className="text-[10px] text-neutral-400 font-mono w-40 flex-shrink-0 text-right">{w.label}</span>
                    <span className={`text-base ${w.weight} text-neutral-800`}>Amplifica plataforma web</span>
                  </div>
                ))}
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              ESPACIADO & RADIO
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="spacing" title="Espaciado & Border Radius" description="Escala de border-radius y tokens de altura de botones." refCb={setRef("spacing")} />

            <PreviewCard title="Border Radius — Base: 10px (0.625rem)" code={`--radius: 0.625rem\nrounded-sm  → 6px\nrounded-md  → 8px\nrounded-lg  → 10px\nrounded-xl  → 14px\nrounded-2xl → 18px`}>
              <div className="flex flex-wrap gap-4">
                {RADIUS_SCALE.map(r => (
                  <div key={r.name} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 h-16 bg-primary-100 border-2 border-primary-300"
                      style={{ borderRadius: r.px }}
                    />
                    <span className="text-[10px] font-semibold text-neutral-600">{r.name}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{r.px}</span>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title={`Alturas de botón — Content Size: ${contentSize}`} code={`--btn-h-sm → ${contentSize === "sm" ? "32px" : contentSize === "md" ? "36px" : "40px"}\n--btn-h-md → ${contentSize === "sm" ? "40px" : contentSize === "md" ? "44px" : "48px"}\n--btn-h-lg → ${contentSize === "sm" ? "44px" : contentSize === "md" ? "48px" : "52px"}\n--btn-h-xl → ${contentSize === "sm" ? "48px" : contentSize === "md" ? "52px" : "56px"}`}>
              <div className="flex flex-wrap items-end gap-3">
                {(["sm", "md", "lg", "xl"] as const).map(s => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <Button variant="primary" size={s}>{s.toUpperCase()}</Button>
                    <span className="text-[10px] text-neutral-400 font-mono">--btn-h-{s}</span>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title="Espaciado común">
              <div className="space-y-3">
                {[1, 2, 3, 4, 6, 8].map(g => (
                  <div key={g} className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400 font-mono w-16 text-right flex-shrink-0">gap-{g}</span>
                    <div className="flex" style={{ gap: `${g * 4}px` }}>
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="w-8 h-8 rounded bg-primary-200" />
                      ))}
                    </div>
                    <span className="text-[10px] text-neutral-400">{g * 4}px</span>
                  </div>
                ))}
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              BOTONES
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="botones" title="Botones" description="Componente Button con variantes, tamaños y estados." refCb={setRef("botones")} />

            {/* Variant toggle */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-neutral-500">Variante:</span>
              {(["primary", "secondary", "tertiary"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setBtnVariant(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    btnVariant === v ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <PreviewCard title="Tamaños" code={`<Button variant="${btnVariant}" size="sm|md|lg|xl">\n  Texto del botón\n</Button>`}>
              <div className="flex flex-wrap items-end gap-3">
                {(["sm", "md", "lg", "xl"] as const).map(s => (
                  <Button key={s} variant={btnVariant} size={s}>
                    {s.toUpperCase()} — Botón
                  </Button>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title="Con iconos" code={`<Button iconLeft={<Plus />}>Crear</Button>\n<Button iconRight={<ArrowRight />}>Siguiente</Button>`}>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant={btnVariant} size="md" iconLeft={<Plus className="w-4 h-4" />}>Crear</Button>
                <Button variant={btnVariant} size="md" iconRight={<ArrowRight className="w-4 h-4" />}>Siguiente</Button>
                <Button variant={btnVariant} size="md" iconLeft={<Search className="w-4 h-4" />} iconRight={<ChevronRight className="w-4 h-4" />}>Buscar</Button>
              </div>
            </PreviewCard>

            <PreviewCard title="Estados" code={`<Button disabled>Deshabilitado</Button>\n<Button loading loadingText="Guardando...">Guardar</Button>`}>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant={btnVariant} size="md">Normal</Button>
                <Button variant={btnVariant} size="md" disabled>Deshabilitado</Button>
                <Button variant={btnVariant} size="md" loading loadingText="Guardando...">Guardar</Button>
              </div>
            </PreviewCard>

            <PreviewCard title="Todas las variantes" code={`variant="primary" | "secondary" | "tertiary"`}>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md">Primary</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="tertiary" size="md">Tertiary</Button>
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              4. FORMULARIOS
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="formularios" title="Campos de formulario" description="Componente FormField con floating label, validación inline y estados." refCb={setRef("formularios")} />

            <PreviewCard title="Input — Estados" code={`<FormField label="Nombre" as="input" type="text" value={val} onChange={setVal} />\n<FormField label="Email" error="Campo obligatorio" />`}>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <FormField label="Nombre" as="input" type="text" value={formName} onChange={setFormName} />
                <FormField label="Email" as="input" type="email" value={formEmail} onChange={setFormEmail} helperText="Correo corporativo" />
                <FormField label="Campo con error" as="input" type="text" value="" onChange={() => {}} error="Este campo es obligatorio" />
                <FormField label="Campo deshabilitado" as="input" type="text" value="No editable" onChange={() => {}} disabled />
              </div>
            </PreviewCard>

            <PreviewCard title="Select y Textarea" code={`<FormField label="País" as="select" options={[...]} />\n<FormField label="Notas" as="textarea" rows={3} />`}>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <FormField
                  label="País"
                  as="select"
                  value={formSelect}
                  onChange={setFormSelect}
                >
                  <option value="">Seleccionar...</option>
                  <option value="cl">Chile</option>
                  <option value="ar">Argentina</option>
                  <option value="mx">México</option>
                </FormField>
                <FormField label="Notas" as="textarea" value={formTextarea} onChange={setFormTextarea} rows={3} helperText="Máximo 500 caracteres" />
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              5. MODALES
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="modales" title="Modales" description="AlertModal con 4 variantes y acción de confirmación." refCb={setRef("modales")} />

            <PreviewCard title="AlertModal — Variantes" code={`<AlertModal\n  open={true}\n  onClose={close}\n  icon={CheckCircle2}\n  variant="primary|danger|warning|info"\n  title="Título"\n  subtitle="Subtítulo"\n  confirm={{ label: "Confirmar", onClick: fn }}\n>\n  Contenido del modal\n</AlertModal>`}>
              <div className="flex flex-wrap gap-3">
                {(["primary", "danger", "warning", "info"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setModalVariant(v)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      v === "primary" ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" :
                      v === "danger"  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" :
                      v === "warning" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" :
                                        "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    Ver modal: {v}
                  </button>
                ))}
              </div>
            </PreviewCard>

            {modalVariant && (
              <AlertModal
                open
                onClose={() => setModalVariant(null)}
                icon={modalIcons[modalVariant]}
                variant={modalVariant}
                title={`Modal ${modalVariant}`}
                subtitle="Este es un ejemplo de AlertModal"
                confirm={{
                  label: modalVariant === "danger" ? "Eliminar" : "Confirmar",
                  onClick: () => setModalVariant(null),
                }}
              >
                <p>
                  {modalVariant === "danger"
                    ? "Esta acción es irreversible. Se eliminarán todos los datos asociados."
                    : modalVariant === "warning"
                    ? "Antes de continuar, revisa que todos los campos estén correctos."
                    : modalVariant === "info"
                    ? "Esta es una notificación informativa sin consecuencias."
                    : "La operación se completó exitosamente."}
                </p>
              </AlertModal>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              6. BADGES
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="badges" title="Badges de estado" description="StatusBadge con iconos y colores por estado de la orden de recepción." refCb={setRef("badges")} />

            <PreviewCard title="Todos los estados" code={`<StatusBadge status="Creado" />\n<StatusBadge status="Programado" />\n// ... etc`}>
              <div className="flex flex-wrap gap-3">
                {ALL_STATUSES.map(s => <StatusBadge key={s} status={s} />)}
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              7. TABLAS — ESPECIFICACIÓN CANÓNICA
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="tablas" title="Tablas — Spec canónica" description="Implementación OBLIGATORIA para todas las tablas de Amplifica. Incluye header sticky, checkbox, columna de acciones sticky right, sorting, paginación numerada y scroll fade. Referencia: /src/app/pedidos/page.tsx" refCb={setRef("tablas")} />

            {/* ── Canonical table preview ── */}
            <PreviewCard title="Tabla canónica — Patrón completo con paginación" code={`{/* Table container */}
<div className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
  {/* Scroll area */}
  <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right">
    <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-neutral-100 bg-neutral-50">
          <th className="py-2 px-2 w-[44px]">{/* checkbox */}</th>
          <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none"
            style={{ whiteSpace: "nowrap" }} onClick={() => toggleSort("id")}>
            ID <SortIcon field="id" />
          </th>
          {/* ...data columns... */}
          <th className="w-[80px] py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50"
            style={{ whiteSpace: "nowrap", position: "sticky", right: 0, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}>
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-50">
        <tr className="hover:bg-neutral-50/60 transition-colors">
          <td className="px-2 text-center">{/* checkbox */}</td>
          <td className="py-2 px-2">{/* data */}</td>
          <td className="py-2 px-2 bg-white"
            style={{ position: "sticky", right: 0, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}>
            {/* actions */}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  {/* Pagination — INSIDE the container */}
  <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
    <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700">
      <span className="text-neutral-500">Mostrar</span>
      <select className="bg-transparent font-medium">
        <option>20</option><option>50</option><option>100</option>
      </select>
    </label>
    <span className="text-sm text-neutral-500 tabular-nums">1–20 de 70</span>
    <div className="flex items-center gap-1">
      <button className="w-9 h-9 rounded-lg"><ChevronsLeft /></button>
      <button className="w-9 h-9 rounded-lg"><ChevronLeft /></button>
      <button className="w-9 h-9 rounded-lg bg-primary-25 text-primary-900">1</button>
      <button className="w-9 h-9 rounded-lg text-neutral-600">2</button>
      <span>...</span>
      <button className="w-9 h-9 rounded-lg"><ChevronRight /></button>
      <button className="w-9 h-9 rounded-lg"><ChevronsRight /></button>
    </div>
  </div>
</div>`}>
              <div className="flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden relative">
                {/* Scroll area */}
                <div className="overflow-x-auto overflow-y-auto w-full table-scroll scroll-fade-right">
                  <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="py-2 px-2 w-[44px]">
                          <span className="flex w-3.5 h-3.5 rounded-[3px] items-center justify-center border-[1.5px] bg-primary-500 border-primary-500 mx-auto">
                            <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none"><path d="M3 6h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                          </span>
                        </th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none w-[90px]" style={{ whiteSpace: "nowrap" }}>
                          <span className="inline-flex items-center gap-1">ID <ArrowDown className="w-3 h-3 text-primary-500" /></span>
                        </th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900 select-none w-[110px]" style={{ whiteSpace: "nowrap" }}>
                          <span className="inline-flex items-center gap-1">Creacion <ArrowUpDown className="w-3 h-3 text-neutral-400" /></span>
                        </th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 w-[100px]" style={{ whiteSpace: "nowrap" }}>Seller</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 w-[110px]" style={{ whiteSpace: "nowrap" }}>Estado</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700 w-[100px]" style={{ whiteSpace: "nowrap" }}>Envio</th>
                        <th className="w-[80px] py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50 text-left" style={{ whiteSpace: "nowrap", position: "sticky" as const, right: 0, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {[
                        { id: "1024", fecha: "27/03/2026", seller: "Extra Life", estado: "Pendiente", estadoColor: "bg-yellow-100 text-yellow-800", envio: "Sin envio", envioColor: "bg-neutral-100 text-neutral-500", selected: true },
                        { id: "1023", fecha: "26/03/2026", seller: "VitaFit", estado: "En preparacion", estadoColor: "bg-yellow-100 text-yellow-800", envio: "Procesando", envioColor: "bg-blue-100 text-blue-700", selected: true },
                        { id: "1022", fecha: "25/03/2026", seller: "Gohard", estado: "Empacado", estadoColor: "bg-green-100 text-green-800", envio: "Despachado", envioColor: "bg-blue-100 text-blue-700", selected: false },
                        { id: "1021", fecha: "24/03/2026", seller: "Extra Life", estado: "Entregado", estadoColor: "bg-green-100 text-green-800", envio: "Entregado", envioColor: "bg-green-100 text-green-700", selected: false },
                      ].map(row => (
                        <tr key={row.id} className={`hover:bg-neutral-50/60 transition-colors group ${row.selected ? "bg-primary-50/40" : ""}`}>
                          <td className="px-2 text-center">
                            <span className={`flex w-3.5 h-3.5 rounded-[3px] items-center justify-center border-[1.5px] mx-auto ${row.selected ? "bg-primary-500 border-primary-500" : "bg-white border-neutral-300"}`}>
                              {row.selected && <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </span>
                          </td>
                          <td className="py-2 px-2" style={{ whiteSpace: "nowrap" }}>
                            <span className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-1 py-0.5 text-xs font-mono transition-colors cursor-pointer">{row.id}</span>
                          </td>
                          <td className="py-2 px-2 text-xs text-neutral-600 tabular-nums" style={{ whiteSpace: "nowrap" }}>{row.fecha}</td>
                          <td className="py-2 px-2 text-xs text-neutral-700 font-medium" style={{ whiteSpace: "nowrap" }}>{row.seller}</td>
                          <td className="py-2 px-2" style={{ whiteSpace: "nowrap" }}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.estadoColor}`}>{row.estado}</span>
                          </td>
                          <td className="py-2 px-2" style={{ whiteSpace: "nowrap" }}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.envioColor}`}>{row.envio}</span>
                          </td>
                          <td className="py-2 px-2 bg-white" style={{ position: "sticky" as const, right: 0, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)", whiteSpace: "nowrap" }}>
                            <div className="flex items-center gap-1">
                              <button className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                              <button className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"><MoreVertical className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — INSIDE the table container */}
                <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
                      <span className="text-neutral-500">Mostrar</span>
                      <select className="bg-transparent font-medium focus:outline-none cursor-pointer text-sm" defaultValue="20">
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </label>
                    <span className="text-sm text-neutral-500 tabular-nums">1–20 de 70</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button disabled className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"><ChevronsLeft className="w-4 h-4" /></button>
                    <button disabled className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-0.5">
                      <button className="w-9 h-9 rounded-lg text-sm font-medium bg-primary-25 text-primary-900">1</button>
                      <button className="w-9 h-9 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100">2</button>
                      <button className="w-9 h-9 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100">3</button>
                      <span className="w-9 h-9 flex items-center justify-center text-neutral-400 text-sm">...</span>
                      <button className="w-9 h-9 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100">4</button>
                    </div>
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100"><ChevronRight className="w-4 h-4" /></button>
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100"><ChevronsRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </PreviewCard>

            {/* ── Structure hierarchy diagram ── */}
            <PreviewCard title="Jerarquia de estructura" code={`Table Container (rounded-2xl wrapper, flex-col, flex-1)
├── Scroll Area (overflow-x-auto overflow-y-auto, flex-1)
│   └── <table> (w-full, table-fixed, border-collapse)
│       ├── <thead> (sticky top-0 z-10)
│       │   └── <tr> (border-b border-neutral-100 bg-neutral-50)
│       │       ├── <th> checkbox (w-[44px])
│       │       ├── <th> data columns
│       │       └── <th> acciones (sticky right, w-[80px])
│       └── <tbody> (divide-y divide-neutral-50)
│           └── <tr> rows (hover:bg-neutral-50/60)
└── Pagination Bar (flex-shrink-0, border-t border-neutral-100)
    ├── Left: Mostrar select + counter
    └── Right: First/Prev/Pages/Next/Last`}>
              <div className="bg-neutral-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-[11px] text-neutral-300 font-mono whitespace-pre leading-relaxed">{`Table Container (rounded-2xl wrapper)
├── Scroll Area (overflow-x-auto overflow-y-auto)
│   └── <table> (w-full, table-fixed, border-collapse)
│       ├── <thead> (sticky top-0 z-10)
│       │   └── <tr> (border-b border-neutral-100 bg-neutral-50)
│       │       ├── <th> checkbox   → w-[44px]
│       │       ├── <th> data cols  → text-xs font-semibold text-neutral-700
│       │       └── <th> acciones   → sticky right, w-[80px], shadow
│       └── <tbody> (divide-y divide-neutral-50)
│           └── <tr> → hover:bg-neutral-50/60 transition-colors
│               ├── <td> checkbox   → px-2 text-center
│               ├── <td> data       → py-2 px-2
│               └── <td> acciones   → sticky right, bg-white, shadow
└── Pagination Bar (flex-shrink-0, border-t border-neutral-100)
    ├── Left:  [Mostrar 20▾]  1–20 de 70
    └── Right: « ‹ [1] 2 3 ... 4 › »`}</pre>
              </div>
            </PreviewCard>

            {/* ── Specifications grid ── */}
            <SubHeading>Especificaciones obligatorias</SubHeading>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Container", desc: "hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative" },
                { label: "Scroll", desc: "overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right" },
                { label: "<table>", desc: "w-full table-fixed text-sm border-collapse font-sans tracking-normal" },
                { label: "<thead>", desc: "sticky top-0 z-10, tr: border-b border-neutral-100 bg-neutral-50" },
                { label: "<th>", desc: "text-left py-2 px-2 text-xs font-semibold text-neutral-700, NO uppercase, NO tracking-wider" },
                { label: "<tbody>", desc: "divide-y divide-neutral-50 (NO border-t/border-b en rows individuales)" },
                { label: "<tr>", desc: "hover:bg-neutral-50/60 transition-colors, selected: bg-primary-50/40, NO style={{ height }}" },
                { label: "<td>", desc: "py-2 px-2, whiteSpace: nowrap via helper NW" },
                { label: "Checkbox", desc: "w-[44px] touch target, w-3.5 h-3.5, checked: bg-primary-500 border-primary-500" },
                { label: "Acciones", desc: "sticky right-0, w-[80px], shadow: -4px 0 8px -2px rgba(0,0,0,0.07), bg-neutral-50 (header) / bg-white (rows)" },
                { label: "Paginacion", desc: "DENTRO del container, flex-shrink-0 border-t border-neutral-100, Mostrar select (20/50/100) + page numbers" },
                { label: "Sorting", desc: "ArrowUpDown (inactive neutral-400), ArrowUp/ArrowDown (active primary-500), cursor-pointer select-none" },
              ].map(spec => (
                <div key={spec.label} className="flex gap-3 items-start p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                  <span className="text-xs font-semibold text-neutral-700 w-20 flex-shrink-0">{spec.label}</span>
                  <span className="text-xs text-neutral-500 break-words">{spec.desc}</span>
                </div>
              ))}
            </div>

            {/* ── Helper constants ── */}
            <PreviewCard title="Helper constants (obligatorios)" code={`const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};`}>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <code className="font-mono text-primary-600 flex-shrink-0">NW</code>
                  <span className="text-neutral-500">Aplicar a todas las celdas para forzar una sola linea. Evita wrapping de texto en columnas.</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <code className="font-mono text-primary-600 flex-shrink-0">stickyRight</code>
                  <span className="text-neutral-500">Aplicar a th y td de la columna de acciones. Fija la columna al borde derecho con sombra.</span>
                </div>
              </div>
            </PreviewCard>

            {/* ── Features checklist ── */}
            <SubHeading>Features obligatorias (checklist)</SubHeading>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { n: 1,  label: "Checkbox bulk selection", desc: "th + td con w-[44px] touch target" },
                { n: 2,  label: "Sticky header", desc: "thead sticky top-0 z-10" },
                { n: 3,  label: "Sticky actions column", desc: "ultima columna sticky right-0 con sombra" },
                { n: 4,  label: "Column sorting", desc: "Al menos fecha + columnas clave con toggleSort()" },
                { n: 5,  label: "Paginacion numerada", desc: "Mostrar select (20/50/100) + page numbers + flechas" },
                { n: 6,  label: "Empty state", desc: "Icono + mensaje + CTA cuando no hay datos" },
                { n: 7,  label: "Loading skeleton", desc: "Rows con animate-pulse mientras carga" },
                { n: 8,  label: "Search con debounce", desc: "Input de busqueda con al menos 300ms debounce" },
                { n: 9,  label: "Status tabs", desc: "Variante B pills (ver seccion Tabs) para filtrar por estado" },
                { n: 10, label: "Scroll fade right", desc: "Indicador visual de scroll horizontal (scroll-fade-right)" },
              ].map(item => (
                <div key={item.n} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-green-50/50 border border-green-100">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">{item.n}. {item.label}</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Anti-patterns ── */}
            <SubHeading>Anti-patterns (NUNCA hacer)</SubHeading>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { bad: "Paginacion fuera del table container", reason: "Debe estar dentro del rounded-2xl wrapper" },
                { bad: "border-t / border-b en rows individuales", reason: "Usar divide-y divide-neutral-50 en <tbody>" },
                { bad: "style={{ height: 40 }} en rows", reason: "El alto lo define el padding de celdas" },
                { bad: "uppercase tracking-wide en headers", reason: "Siempre text-xs font-semibold text-neutral-700" },
                { bad: "Padding diferente entre modulos", reason: "Siempre py-2 px-2 en headers y celdas" },
                { bad: "Falta table-fixed o border-collapse", reason: "Obligatorios en el <table>" },
              ].map(item => (
                <div key={item.bad} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                  <Ban className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">{item.bad}</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Empty state ── */}
            <PreviewCard title="Empty state" code={`<tr>
  <td colSpan={N} className="text-center py-16 text-neutral-400 text-sm">
    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
    <p className="text-sm font-semibold text-neutral-700 mb-1">No se encontraron pedidos</p>
    <p className="text-xs text-neutral-500 mb-4">Intenta con otros filtros o crea uno nuevo</p>
    <Button variant="primary">Crear pedido</Button>
  </td>
</tr>`}>
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="py-2 px-2 w-[44px]" />
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={{ whiteSpace: "nowrap" }}>ID</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={{ whiteSpace: "nowrap" }}>Creacion</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={{ whiteSpace: "nowrap" }}>Seller</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700" style={{ whiteSpace: "nowrap" }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-neutral-700 mb-1">No se encontraron pedidos</p>
                          <p className="text-xs text-neutral-500 mb-4">Intenta con otros filtros o crea uno nuevo</p>
                          <Button variant="primary" size="sm">Crear pedido</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </PreviewCard>

            {/* ── Loading skeleton ── */}
            <PreviewCard title="Loading skeleton" code={`{/* Skeleton rows while loading */}
{Array.from({ length: 5 }).map((_, i) => (
  <tr key={i} className="animate-pulse">
    <td className="px-2 py-3"><div className="w-3.5 h-3.5 bg-neutral-200 rounded" /></td>
    <td className="px-2 py-3"><div className="w-16 h-4 bg-neutral-100 rounded" /></td>
    <td className="px-2 py-3"><div className="w-20 h-4 bg-neutral-100 rounded" /></td>
    <td className="px-2 py-3"><div className="w-24 h-4 bg-neutral-100 rounded" /></td>
  </tr>
))}`}>
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-sm border-collapse font-sans tracking-normal">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="py-2 px-2 w-[44px]" />
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">ID</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Creacion</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Seller</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-2 py-3"><div className="w-3.5 h-3.5 bg-neutral-200 rounded mx-auto" /></td>
                          <td className="px-2 py-3"><div className="w-14 h-4 bg-neutral-100 rounded" /></td>
                          <td className="px-2 py-3"><div className="w-20 h-4 bg-neutral-100 rounded" /></td>
                          <td className="px-2 py-3"><div className="w-16 h-4 bg-neutral-100 rounded" /></td>
                          <td className="px-2 py-3"><div className="w-20 h-5 bg-neutral-100 rounded-full" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              8. PROGRESS BARS
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="progress" title="Progress Bars" description="Barras de progreso para indicar avance, uso de recursos y límites." refCb={setRef("progress")} />

            <PreviewCard title="Variantes por contexto" code={`<div className="h-2 bg-neutral-100 rounded-full overflow-hidden">\n  <div className="h-full bg-primary-500 rounded-full" style={{ width: "78%" }} />\n</div>`}>
              <div className="space-y-5 max-w-lg">
                {PROGRESS_EXAMPLES.map(p => {
                  const pct = Math.round((p.current / p.max) * 100);
                  const barColor =
                    p.variant === "primary" ? "bg-primary-500" :
                    p.variant === "success" ? "bg-green-500" :
                    p.variant === "warning" ? "bg-amber-500" :
                    "bg-red-500";
                  const textColor =
                    p.variant === "primary" ? "text-primary-600" :
                    p.variant === "success" ? "text-green-600" :
                    p.variant === "warning" ? "text-amber-600" :
                    "text-red-600";
                  return (
                    <div key={p.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-700">{p.label}</span>
                        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
                          {p.current}/{p.max} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </PreviewCard>

            <PreviewCard title="Tamaños" code={`h-1   → extra slim (inline en tablas)\nh-1.5 → slim (progreso de conteo)\nh-2   → default\nh-3   → large (dashboards)`}>
              <div className="space-y-4 max-w-lg">
                {[
                  { h: "h-1",   label: "Extra slim (h-1) — tablas" },
                  { h: "h-1.5", label: "Slim (h-1.5) — conteo" },
                  { h: "h-2",   label: "Default (h-2)" },
                  { h: "h-3",   label: "Large (h-3) — dashboards" },
                ].map(s => (
                  <div key={s.h} className="space-y-1.5">
                    <span className="text-[10px] text-neutral-400 font-mono">{s.label}</span>
                    <div className={`${s.h} bg-neutral-100 rounded-full overflow-hidden`}>
                      <div className={`h-full bg-primary-500 rounded-full`} style={{ width: "65%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title="Con label dentro" code={`<div className="h-5 bg-neutral-100 rounded-full overflow-hidden relative">\n  <div className="h-full bg-primary-500 rounded-full" style={{ width: "72%" }} />\n  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">72%</span>\n</div>`}>
              <div className="space-y-4 max-w-lg">
                {[
                  { pct: 25, color: "bg-primary-500" },
                  { pct: 55, color: "bg-green-500" },
                  { pct: 80, color: "bg-amber-500" },
                  { pct: 100, color: "bg-red-500" },
                ].map(p => (
                  <div key={p.pct} className="h-5 bg-neutral-100 rounded-full overflow-hidden relative">
                    <div className={`h-full ${p.color} rounded-full transition-all duration-500`} style={{ width: `${p.pct}%` }} />
                    <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold ${p.pct >= 50 ? "text-white" : "text-neutral-700"}`}>
                      {p.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title="Segmented / Stacked" code={`// Barra apilada para desglose por categoría\n<div className="h-3 bg-neutral-100 rounded-full overflow-hidden flex">\n  <div className="bg-primary-500" style={{ width: "45%" }} />\n  <div className="bg-green-400" style={{ width: "30%" }} />\n  <div className="bg-amber-400" style={{ width: "15%" }} />\n</div>`}>
              <div className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-700">Distribución de SKUs</span>
                    <span className="text-xs text-neutral-400">850 total</span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                    <div className="bg-primary-500 h-full" style={{ width: "45%" }} />
                    <div className="bg-green-400 h-full" style={{ width: "30%" }} />
                    <div className="bg-amber-400 h-full" style={{ width: "15%" }} />
                    <div className="bg-neutral-300 h-full" style={{ width: "10%" }} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {[
                      { color: "bg-primary-500", label: "Contados", val: "383 (45%)" },
                      { color: "bg-green-400",   label: "Aprobados", val: "255 (30%)" },
                      { color: "bg-amber-400",   label: "Pendientes", val: "127 (15%)" },
                      { color: "bg-neutral-300", label: "Sin iniciar", val: "85 (10%)" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[10px] text-neutral-500">{item.label}: {item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PreviewCard>

            <PreviewCard title="Indicadores de límite (Enforcement)" code={`// Soft limit con banner\n// 80% → warning, 100%+ → danger`}>
              <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-700">Normal (60%)</span>
                    <span className="text-xs text-primary-600 font-semibold tabular-nums">120/200</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-800">Advertencia — 80%+</span>
                    <span className="text-xs text-amber-600 font-semibold tabular-nums">168/200</span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "84%" }} />
                  </div>
                  <p className="text-[10px] text-amber-600">Te estás acercando al límite mensual de pedidos.</p>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-800">Excedido — 100%+</span>
                    <span className="text-xs text-red-600 font-semibold tabular-nums">224/200</span>
                  </div>
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <p className="text-[10px] text-red-600">Has superado el límite. Se cobrará extra por los pedidos adicionales.</p>
                </div>
              </div>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              9. CARDS & LAYOUT
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="cards" title="Cards & Layout" description="Contenedores, ScrollArea y patrones de layout." refCb={setRef("cards")} />

            <PreviewCard title="ScrollArea — Vertical" code={`<ScrollArea maxHeight={160} className="space-y-2">\n  {items}\n</ScrollArea>`}>
              <ScrollArea maxHeight={160} className="space-y-2 pr-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-neutral-50 border border-neutral-100">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-600">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Item #{i + 1}</p>
                      <p className="text-xs text-neutral-400">Descripción del elemento</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </PreviewCard>

            <PreviewCard title="ScrollArea — Horizontal" code={`<ScrollArea direction="horizontal">\n  {content}\n</ScrollArea>`}>
              <ScrollArea direction="horizontal">
                <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="w-32 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-300 flex items-center justify-center text-sm font-bold text-primary-700 flex-shrink-0">
                      Card {i + 1}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PreviewCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              OTROS
          ══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeader id="otros" title="Otros componentes" description="StepIndicator, Logo y otros elementos reutilizables." refCb={setRef("otros")} />

            <PreviewCard title="StepIndicator" code={`<StepIndicator current={2} maxReached={2} onStepClick={setStep} />`}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-neutral-500">Paso actual:</span>
                  {[1, 2, 3].map(s => (
                    <button
                      key={s}
                      onClick={() => setStepCurrent(s)}
                      className={`w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                        stepCurrent === s ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <StepIndicator current={stepCurrent} maxReached={stepCurrent} onStepClick={setStepCurrent} />
              </div>
            </PreviewCard>

            <PreviewCard title="AmplificaLogo" code={`<AmplificaLogo />\n<AmplificaLogo collapsed />`}>
              <div className="flex items-center gap-8">
                <div className="bg-neutral-900 p-4 rounded-xl">
                  <AmplificaLogo />
                </div>
                <div className="bg-neutral-900 p-4 rounded-xl">
                  <AmplificaLogo collapsed />
                </div>
              </div>
            </PreviewCard>

            <PreviewCard title="Animaciones CSS" code={`animation: scanPulse 0.5s ease-out\nanimation: imgBounceIn 0.4s ease-out\nanimation: headShake 0.5s ease-in-out\nanimation: floatPlusOne 0.8s ease-out`}>
              <div className="flex flex-wrap gap-6">
                {[
                  { name: "scanPulse",   duration: "0.5s" },
                  { name: "imgBounceIn", duration: "0.4s" },
                  { name: "headShake",   duration: "0.5s" },
                  { name: "floatPlusOne", duration: "0.8s" },
                ].map(a => (
                  <AnimationDemo key={a.name} name={a.name} duration={a.duration} />
                ))}
              </div>
            </PreviewCard>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Animation demo with replay ───────────────────────────────────────────────
function AnimationDemo({ name, duration }: { name: string; duration: string }) {
  const [key, setKey] = useState(0);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        key={key}
        className="w-12 h-12 rounded-lg bg-primary-400"
        style={{ animation: `${name} ${duration} ease-out` }}
      />
      <span className="text-[10px] font-mono text-neutral-500">{name}</span>
      <button
        onClick={() => setKey(k => k + 1)}
        className="text-[10px] text-primary-500 hover:text-primary-600 font-medium"
      >
        Replay
      </button>
    </div>
  );
}
