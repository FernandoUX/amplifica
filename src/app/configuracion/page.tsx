"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Check, Settings, Monitor, User, Bell } from "lucide-react";
import { useContentSize, type ContentSize } from "@/hooks/useContentSize";

// ─── Content size options ────────────────────────────────────────────────────
const SIZE_OPTIONS: { key: ContentSize; label: string; description: string; preview: { text: string; fontSize: string } }[] = [
  {
    key: "sm",
    label: "Pequeño",
    description: "Más compacto, ideal para pantallas grandes",
    preview: { text: "Texto de ejemplo", fontSize: "13px" },
  },
  {
    key: "md",
    label: "Mediano",
    description: "Equilibrio entre legibilidad y densidad",
    preview: { text: "Texto de ejemplo", fontSize: "14px" },
  },
  {
    key: "lg",
    label: "Grande",
    description: "Mayor legibilidad, ideal para accesibilidad",
    preview: { text: "Texto de ejemplo", fontSize: "16px" },
  },
];

// ─── Tabs ────────────────────────────────────────────────────────────────────
type Tab = "general" | "visualizacion" | "cuenta" | "notificaciones";
const TABS: { key: Tab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "general",         label: "General",         shortLabel: "General",   icon: Settings },
  { key: "visualizacion",   label: "Visualización",   shortLabel: "Visual",    icon: Monitor },
  { key: "cuenta",          label: "Cuenta",          shortLabel: "Cuenta",    icon: User },
  { key: "notificaciones",  label: "Notificaciones",  shortLabel: "Notif.",    icon: Bell },
];

// ─── ConfigCard helper ──────────────────────────────────────────────────────
function ConfigCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ConfiguracionGlobalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("visualizacion");
  const { size: contentSize, changeSize: setContentSize } = useContentSize();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-4">
        <Link href="/recepciones" className="hover:text-neutral-700 transition-colors">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-700 font-medium">Configuración</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Configuración</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Preferencias generales de la plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto overflow-y-hidden scrollbar-hide mb-6">
        {TABS.map(tab => {
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

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: General (placeholder)
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "general" && (
        <div className="space-y-5">
          <ConfigCard title="Información de la cuenta" description="Datos generales de tu organización">
            <p className="text-sm text-neutral-500">Próximamente — gestión de nombre, logo y datos de la organización.</p>
          </ConfigCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: Visualización
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "visualizacion" && (
        <div className="space-y-5">
          <ConfigCard
            title="Tamaño de contenido"
            description="Ajusta el tamaño de la tipografía y los controles de la plataforma"
          >
            <div className="grid gap-3">
              {SIZE_OPTIONS.map(opt => {
                const isSelected = contentSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setContentSize(opt.key)}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? "border-primary-500 bg-primary-25 shadow-sm"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? "border-primary-500 bg-primary-500" : "border-neutral-300"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? "text-primary-700" : "text-neutral-900"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{opt.description}</p>
                    </div>

                    {/* Live preview */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      <div
                        className="bg-neutral-100 rounded-lg px-3 py-1.5 text-neutral-700 font-medium"
                        style={{ fontSize: opt.preview.fontSize }}
                      >
                        Aa
                      </div>
                      <span className="text-[10px] text-neutral-400 tabular-nums">{opt.preview.fontSize}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Note */}
            <p className="text-[11px] text-neutral-400 mt-2">
              Los cambios se aplican inmediatamente y se guardan automáticamente.
            </p>
          </ConfigCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: Cuenta (placeholder)
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cuenta" && (
        <div className="space-y-5">
          <ConfigCard title="Datos personales" description="Gestiona tu perfil y contraseña">
            <p className="text-sm text-neutral-500">Próximamente — edición de nombre, email y contraseña.</p>
          </ConfigCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: Notificaciones (placeholder)
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "notificaciones" && (
        <div className="space-y-5">
          <ConfigCard title="Preferencias de notificación" description="Configura cómo y cuándo recibes alertas">
            <p className="text-sm text-neutral-500">Próximamente — configuración de notificaciones por email, push y en-app.</p>
          </ConfigCard>
        </div>
      )}
    </div>
  );
}
