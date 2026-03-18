"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle, ChevronDown, Upload, Trash2, MoreVertical,
  Package, ArrowRight, ChevronLeft, ChevronRight, Check,
  PlusCircle, FileSpreadsheet, Plus, X,
} from "lucide-react";
import StepIndicator from "@/components/recepciones/StepIndicator";
import ProductsModal, { AddProduct } from "@/components/recepciones/ProductsModal";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import { getRole, can } from "@/lib/roles";

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = { sku: string; nombre: string; barcode: string; qty: number };

type FormData = {
  sucursal: string;
  tienda: string;
  pallets: string;
  bultos: string;
  desconoceFormato: boolean;
  comentarios: string;
  guiaDespacho: File | null;
  products: Product[];
  // Step 3
  fechaReserva: string;
  horaReserva: string;
};

// (MiniCalendar removed — calendar is now inlined in Step3)

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ form, setForm, lockedSucursal, lockedSeller }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; lockedSucursal: boolean; lockedSeller: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const handleFile = (file: File) => setForm(f => ({ ...f, guiaDespacho: file }));

  return (
    <div className="space-y-5">
      {/* Warning */}
      {showAlert && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Asegura tu mercancía</p>
            <p className="text-xs text-amber-600 mt-0.5">
              La Guía de Despacho es obligatoria para la cobertura del seguro. Evita pérdidas económicas subiendo un documento claro.
            </p>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-amber-400 hover:text-amber-600 transition-colors duration-300 flex-shrink-0"
            aria-label="Cerrar alerta"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <h3 className="text-base font-semibold text-neutral-800">Seleccione sucursal y detalles de la orden</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sucursal */}
        <FormField
          as="select"
          label="Sucursal de destino"
          value={form.sucursal}
          onChange={v => setForm(f => ({ ...f, sucursal: v }))}
          disabled={lockedSucursal}
        >
          <option value="Quilicura">Quilicura — El juncal 901, Quilicura, Santiago, Chile</option>
          <option value="Pudahuel">Pudahuel</option>
          <option value="La Reina">La Reina</option>
          <option value="Lo Barnechea">Lo Barnechea</option>
          <option value="Santiago Centro">Santiago Centro</option>
          <option value="Providencia">Providencia</option>
          <option value="Las Condes">Las Condes</option>
        </FormField>

        {/* Tienda */}
        <FormField
          as="select"
          label="Tienda"
          value={form.tienda}
          onChange={v => setForm(f => ({ ...f, tienda: v }))}
          disabled={lockedSeller}
        >
          <option>Extra Life</option>
          <option>Le Vice</option>
          <option>Gohard</option>
          <option>VitaFit</option>
          <option>NutriPro</option>
          <option>BioNature</option>
          <option>FitLab</option>
          <option>PowerNutri</option>
          <option>OmegaPlus</option>
          <option>ProHealth</option>
          <option>NaturalBoost</option>
          <option>BodyFuel</option>
          <option>VitalCore</option>
          <option>PureFit</option>
          <option>MaxProtein</option>
        </FormField>

        {/* Pallets */}
        <FormField
          type="number"
          label="Cantidad de pallets"
          value={form.pallets}
          onChange={v => setForm(f => ({ ...f, pallets: v }))}
          disabled={form.desconoceFormato}
          placeholder="0"
        />

        {/* Bultos */}
        <FormField
          type="number"
          label="Cantidad de bultos"
          value={form.bultos}
          onChange={v => setForm(f => ({ ...f, bultos: v }))}
          disabled={form.desconoceFormato}
          placeholder="0"
        />
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, desconoceFormato: !f.desconoceFormato, ...(!f.desconoceFormato ? { pallets: "", bultos: "" } : {}) }))}
          className={`w-10 h-6 flex-shrink-0 rounded-full transition-colors duration-300 flex items-center px-1 cursor-pointer ${form.desconoceFormato ? "bg-primary-500" : "bg-neutral-200"}`}
        >
          <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.desconoceFormato ? "translate-x-4" : "translate-x-0"}`} />
        </button>
        <span className="text-sm text-neutral-700">Desconozco la cantidad de pallets y/o bultos</span>
      </div>

      {/* Comentarios */}
      <FormField
        as="textarea"
        label="Comentarios adicionales"
        value={form.comentarios}
        onChange={v => setForm(f => ({ ...f, comentarios: v }))}
        placeholder="Ingrese detalles adicionales"
        helperText="Opcional — Agrega instrucciones especiales para la recepción."
      />

      {/* File upload */}
      <div>
        <input ref={fileRef} type="file" className="hidden" accept=".xml,.pdf,.jpg,.png"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {form.guiaDespacho ? (
          <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{form.guiaDespacho.name}</p>
              <p className="text-xs text-neutral-500">{(form.guiaDespacho.size / 1024).toFixed(0)} KB</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, guiaDespacho: null }))}
              className="text-neutral-600 hover:text-red-500 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors duration-300
              ${dragging ? "border-primary-400 bg-primary-50" : "border-neutral-200 hover:border-primary-300 hover:bg-neutral-50"}`}
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-neutral-600" />
            </div>
            <p className="text-sm text-neutral-600 text-center">
              <span className="text-primary-500 font-medium">Haz clic para subir guía de despacho</span>
              {" "}o arrastra y suelta
            </p>
            <p className="text-xs text-neutral-600">XML, PDF, JPG o PNG (5MB máximo)</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const [showModal, setShowModal] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const addProducts = (incoming: AddProduct[]) => {
    setForm(f => {
      const existing = [...f.products];
      incoming.forEach(p => {
        const idx = existing.findIndex(e => e.sku === p.sku);
        if (idx >= 0) existing[idx] = { ...existing[idx], qty: existing[idx].qty + p.qty };
        else existing.push({ sku: p.sku, nombre: p.nombre, barcode: p.barcode, qty: p.qty });
      });
      return { ...f, products: existing };
    });
  };

  const updateQty = (sku: string, qty: number) => {
    setForm(f => ({ ...f, products: f.products.map(p => p.sku === sku ? { ...p, qty: Math.max(1, qty) } : p) }));
  };

  const removeProduct = (sku: string) => {
    setForm(f => ({ ...f, products: f.products.filter(p => p.sku !== sku) }));
  };

  const filtered = form.products;

  return (
    <div className="space-y-5">
      {showModal && (
        <ProductsModal
          onClose={() => setShowModal(false)}
          onAdd={addProducts}
        />
      )}

      {/* Warning */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Declaración de inventario entrante</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Asegúrate de incluir todos los SKUs. Datos incompletos o incorrectos generan errores de stock y bloqueos en el muelle de descarga.
          </p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-neutral-800">Ingresar productos</h3>

      {/* Empty or Table */}
      {form.products.length === 0 ? (
        <div className="border border-neutral-200 rounded-xl p-4 sm:p-6 lg:p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-neutral-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-neutral-800 text-[15px]">La recepción está vacía</p>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-xs">
              Comienza a agregar los SKUs de esta orden para habilitar el proceso de descarga. Puedes importar un archivo CSV o buscar productos manualmente.
            </p>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="primary" size="md" onClick={() => setShowModal(true)} iconLeft={<PlusCircle className="w-4 h-4" />} className="w-full sm:w-auto">
                Agregar productos
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    addProducts([
                      { sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", barcode: "8500942860946", qty: 50 },
                      { sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     barcode: "8500942860625", qty: 50 },
                    ]);
                  }
                  e.target.value = "";
                }}
              />
              <Button variant="secondary" size="md" iconLeft={<Upload className="w-4 h-4" />} className="w-full sm:w-auto" onClick={() => csvInputRef.current?.click()}>
                Importar planilla
              </Button>
            </div>
            <Button variant="tertiary" size="sm" iconLeft={<FileSpreadsheet className="w-4 h-4" />} className="mt-4">
              Descargar plantilla
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">

          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-neutral-100">
            {filtered.map(product => (
              <div key={`m-${product.sku}`} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 font-medium leading-snug">{product.nombre}</p>
                    <p className="text-xs text-neutral-500 mt-1 font-sans">{product.sku} · {product.barcode}</p>
                  </div>
                  <button onClick={() => removeProduct(product.sku)}
                    className="p-1.5 hover:bg-red-50 rounded text-neutral-600 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <Button variant="secondary" size="sm" onClick={() => updateQty(product.sku, product.qty - 1)}
                    className="!w-8 !h-8 !min-w-0 !p-0 !rounded-md !gap-0">−</Button>
                  <input
                    type="number"
                    value={product.qty}
                    onChange={e => updateQty(product.sku, parseInt(e.target.value) || 1)}
                    className="w-20 h-8 border border-neutral-200 rounded-md px-2 text-center text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button variant="secondary" size="sm" onClick={() => updateQty(product.sku, product.qty + 1)}
                    className="!w-8 !h-8 !min-w-0 !p-0 !rounded-md !gap-0">+</Button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">SKU</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-full">Producto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">Código de barras</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">Cantidad</th>
                <th className="py-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map(product => (
                <tr key={product.sku} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium text-neutral-700 whitespace-nowrap font-sans">{product.sku}</td>
                  <td className="py-3 px-4 text-neutral-700">{product.nombre}</td>
                  <td className="py-3 px-4 text-neutral-500 font-sans text-xs">{product.barcode}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => updateQty(product.sku, product.qty - 1)}
                        className="!w-8 !h-8 !min-w-0 !p-0 !rounded-md !gap-0">−</Button>
                      <input
                        type="number"
                        value={product.qty}
                        onChange={e => updateQty(product.sku, parseInt(e.target.value) || 1)}
                        className="w-20 h-8 border border-neutral-200 rounded-md px-2 text-center text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-500"
                      />
                      <Button variant="secondary" size="sm" onClick={() => updateQty(product.sku, product.qty + 1)}
                        className="!w-8 !h-8 !min-w-0 !p-0 !rounded-md !gap-0">+</Button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => removeProduct(product.sku)}
                      className="p-1.5 hover:bg-red-50 rounded text-neutral-600 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Footer ── */}
          <div className="px-4 py-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 text-center sm:text-left">
              {form.products.length} SKU(s) · {form.products.reduce((s, p) => s + p.qty, 0)} unidades
            </p>
          </div>
          <div className="border-t border-dashed border-neutral-200">
            <button onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-[14px] text-neutral-600 hover:text-primary-500 hover:bg-primary-50/50 transition-colors duration-300 font-medium">
              <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                <Plus className="w-3 h-3" />
              </span>
              Agregar más productos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
// ─── Sucursal → Address map ──────────────────────────────────────────────────
const SUCURSAL_ADDRESS: Record<string, string> = {
  Quilicura:        "El Juncal 901, Quilicura, Santiago",
  Pudahuel:         "Av. La Estrella 1500, Pudahuel, Santiago",
  "La Reina":       "Av. Larraín 7500, La Reina, Santiago",
  "Lo Barnechea":   "Av. La Dehesa 2100, Lo Barnechea, Santiago",
  "Santiago Centro": "Av. Libertador Bernardo O'Higgins 1000, Santiago",
  Providencia:      "Av. Providencia 2100, Providencia, Santiago",
  "Las Condes":     "Av. Apoquindo 4500, Las Condes, Santiago",
};

// ─── Helpers for slot generation ──────────────────────────────────────────────
type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
type SucConfig = {
  diasHabilitados?: DiaSemana[];
  horaInicio?: string;
  horaFin?: string;
  duracionSlot?: number;
  tiempoAnticipado?: number;
};

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

const DIA_MAP: Record<number, DiaSemana> = { 0: "dom", 1: "lun", 2: "mar", 3: "mie", 4: "jue", 5: "vie", 6: "sab" };

function Step3({ form, setForm, isReagendar }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; isReagendar: boolean }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  // Sucursal config from localStorage
  const [sucCfg, setSucCfg] = useState<SucConfig>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("amplifica_recepciones_config");
      if (!raw) return;
      const allConfigs = JSON.parse(raw) as Record<string, SucConfig>;
      const sucId = (form.sucursal ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const cfg = allConfigs[sucId];
      if (cfg) setSucCfg(cfg);
      else setSucCfg({});
    } catch { setSucCfg({}); }
  }, [form.sucursal]);

  const tiempoAnticipado   = sucCfg.tiempoAnticipado ?? 0;
  const diasHabilitados    = sucCfg.diasHabilitados ?? ["lun","mar","mie","jue","vie"];
  const horaInicio         = sucCfg.horaInicio ?? "08:00";
  const horaFin            = sucCfg.horaFin ?? "18:00";
  const duracionSlot       = sucCfg.duracionSlot ?? 30;

  // Generate slots from config
  const ALL_SLOTS = buildSlots(horaInicio, horaFin, duracionSlot);
  const DISABLED_SLOTS   = new Set(["10:00","10:30"]); // mock: agenda completa
  const SOBRECUPO_SLOTS  = new Set(["11:00"]);         // mock: sobrecupo disponible

  // Calendar data
  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MONTH_ES    = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const DAY_NAMES   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const DAY_HEADERS = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells       = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const todayMidnight    = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selected         = form.fechaReserva ? new Date(form.fechaReserva + "T00:00:00") : null;
  const isSelectedToday  = selected !== null &&
    selected.getFullYear() === today.getFullYear() &&
    selected.getMonth()    === today.getMonth()    &&
    selected.getDate()     === today.getDate();

  const pickDay = (day: number) => {
    const yy = String(viewYear);
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    setForm(f => ({ ...f, fechaReserva: `${yy}-${mm}-${dd}`, horaReserva: "" }));
  };

  // Mock: days 17–19 are "agenda completa", day 13 has sobrecupo
  const AGENDA_COMPLETA  = new Set([17, 18, 19]);
  const SOBRECUPO_DIAS   = new Set([13]);

  const selectedLabel = selected
    ? `${DAY_NAMES[selected.getDay()]} ${selected.getDate()} de ${MONTH_ES[selected.getMonth()]}`
    : "";

  // Detalle summary
  const totalQty = form.products.reduce((s, p) => s + p.qty, 0);

  return (
    <div className="space-y-5">

      {/* ── Alert ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">La puntualidad es clave</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Para garantizar una descarga rápida, llega en el bloque asignado. Si no se respeta el horario, no podremos asegurar la recepción de tus artículos debido a la planificación de andenes y personal.
          </p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-neutral-800">Seleccione día y bloque horario</h3>

      {/* ── 3-column layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

        {/* ── Detalle de la Orden ────────────────────────────────────────── */}
        <div className="border border-neutral-200 rounded-xl p-4 space-y-3 text-xs">
          <p className="text-sm font-semibold text-neutral-800">Detalle de la Orden</p>

          <FormField
            as="select"
            label="Sucursal"
            value={form.sucursal}
            onChange={v => setForm(f => ({ ...f, sucursal: v }))}
            disabled={!isReagendar}
          >
            <option value="Quilicura">Quilicura</option>
            <option value="Pudahuel">Pudahuel</option>
            <option value="La Reina">La Reina</option>
            <option value="Lo Barnechea">Lo Barnechea</option>
            <option value="Santiago Centro">Santiago Centro</option>
            <option value="Providencia">Providencia</option>
            <option value="Las Condes">Las Condes</option>
          </FormField>
          {SUCURSAL_ADDRESS[form.sucursal] && (
            <p className="text-neutral-600 leading-snug">{SUCURSAL_ADDRESS[form.sucursal]}</p>
          )}
          <div className="space-y-0.5">
            {!form.desconoceFormato && form.pallets && <p className="text-neutral-500">Pallets: {form.pallets}</p>}
            {!form.desconoceFormato && form.bultos  && <p className="text-neutral-500">Bultos: {form.bultos}</p>}
          </div>

          <div className="space-y-0.5">
            <p className="font-semibold text-neutral-700">Comentario</p>
            <p className="text-neutral-500">{form.comentarios || "Sin comentarios."}</p>
          </div>

          <div className="space-y-0.5">
            <p className="font-semibold text-neutral-700">Guía de despacho</p>
            {form.guiaDespacho
              ? <p className="text-green-600">✓ Cargada correctamente</p>
              : <p className="text-neutral-600">No adjuntada</p>
            }
          </div>

          <div className="space-y-0.5">
            <p className="font-semibold text-neutral-700">Productos</p>
            <p className="text-neutral-500">SKUs: {form.products.length}</p>
            <p className="text-neutral-500">Cantidad: {totalQty.toLocaleString("es-CL")}</p>
          </div>
        </div>

        {/* ── Calendario + Simbología ────────────────────────────────────── */}
        <div className="border border-neutral-200 rounded-xl p-4 select-none">

          {/* Month header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neutral-800">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                  else setViewMonth(m => m - 1);
                }}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                  else setViewMonth(m => m + 1);
                }}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day header row */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(d => (
              <span key={d} className="text-center text-xs text-neutral-600 font-medium py-1">{d}</span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 text-center text-sm">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const date         = new Date(viewYear, viewMonth, day);
              const isPast       = date < todayMidnight;
              const dayKey       = DIA_MAP[date.getDay()];
              const isDayOff     = !diasHabilitados.includes(dayKey);
              const isDisabled   = isPast || isDayOff;
              const isToday      = date.getTime() === todayMidnight.getTime();
              const isSel        = selected ? date.toDateString() === selected.toDateString() : false;
              const isAgenda     = AGENDA_COMPLETA.has(day) && !isDisabled;
              const isSobrecupoDay = SOBRECUPO_DIAS.has(day) && !isDisabled && !isAgenda;
              const dotColor     = isSel          ? "bg-primary-500"
                                 : isAgenda       ? "bg-neutral-400"
                                 : isSobrecupoDay ? "bg-amber-400"
                                 : !isDisabled    ? "bg-green-500"
                                 : "";

              return (
                <div key={i} className="flex flex-col items-center">
                  <button
                    disabled={isDisabled}
                    onClick={() => { if (!isDisabled) pickDay(day); }}
                    className={`py-1.5 w-full rounded-lg transition-colors duration-150 font-medium
                      ${isSel                                ? "bg-primary-500 text-white" : ""}
                      ${!isSel && isToday && !isDisabled     ? "bg-primary-50 text-primary-600 font-semibold" : ""}
                      ${!isSel && !isToday && !isDisabled    ? "text-neutral-700 hover:bg-neutral-50" : ""}
                      ${isDisabled                           ? "text-neutral-300 cursor-not-allowed" : ""}
                    `}
                  >
                    {day}
                  </button>
                  {dotColor && <span className={`w-1 h-1 rounded-full mt-0.5 ${dotColor}`} />}
                </div>
              );
            })}
          </div>

          {/* Simbología */}
          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5">
            <p className="text-xs font-semibold text-neutral-600 mb-1">Simbología</p>
            {[
              { color: "bg-primary-500", label: "Fecha y hora seleccionada" },
              { color: "bg-amber-400",   label: "Sobrecupo disponible" },
              { color: "bg-green-500",   label: "Bloques disponibles" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                <span className="text-xs text-neutral-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bloques horarios ──────────────────────────────────────────── */}
        <div className="border border-neutral-200 rounded-xl p-4">
          {selected ? (
            <>
              <p className="text-sm font-semibold text-neutral-800 mb-3 capitalize">{selectedLabel}</p>
              <div className="grid grid-cols-3 gap-2">
                {ALL_SLOTS.map((slot) => {
                  if (isSelectedToday) {
                    const [h, m] = slot.split(":").map(Number);
                    const slotMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).getTime();
                    const cutoff = today.getTime() + tiempoAnticipado * 3_600_000;
                    if (slotMs <= cutoff) return null;
                  }
                  // Hide full-agenda slots entirely
                  if (DISABLED_SLOTS.has(slot)) return null;
                  const isSobrecupo  = SOBRECUPO_SLOTS.has(slot);
                  const isSlotSel    = form.horaReserva === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setForm(f => ({ ...f, horaReserva: slot }))}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors duration-300 text-center
                        ${isSlotSel                       ? "bg-primary-500 text-white" : ""}
                        ${!isSlotSel && isSobrecupo       ? "border border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100" : ""}
                        ${!isSlotSel && !isSobrecupo      ? "border border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50" : ""}
                      `}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-500">Bloques horarios</p>
              <p className="text-xs text-neutral-600 mt-1 max-w-[180px]">Selecciona una fecha en el calendario para ver los bloques disponibles</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Persist new OR to localStorage ──────────────────────────────────────────
function persistNewOr(form: FormData, sinAgenda: boolean) {
  try {
    const counter = parseInt(localStorage.getItem("amplifica_or_counter") ?? "192") + 1;
    localStorage.setItem("amplifica_or_counter", String(counter));
    const id = `RO-BARRA-${counter}`;

    // Status: "Programado" if calendar date was set; "Creado" otherwise
    const estado = (!sinAgenda && form.fechaReserva) ? "Programado" : "Creado";

    // Today as DD/MM/YYYY
    const now  = new Date();
    const dd   = String(now.getDate()).padStart(2, "0");
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const creacion = `${dd}/${mm}/${yyyy}`;

    // Fecha agendada formatted as DD/MM/YYYY HH:MM
    let fechaAgendada = "—";
    if (!sinAgenda && form.fechaReserva && form.horaReserva) {
      const [fy, fm, fd] = form.fechaReserva.split("-");
      fechaAgendada = `${fd}/${fm}/${fy} ${form.horaReserva}`;
    }

    const newOr = {
      id,
      creacion,
      fechaAgendada,
      seller: form.tienda,
      sucursal: form.sucursal,
      estado,
      skus: form.products.length,
      uTotales: String(form.products.reduce((s, p) => s + p.qty, 0)),
      ...(form.pallets   ? { pallets:    parseInt(form.pallets) }   : {}),
      ...(form.bultos    ? { bultos:     parseInt(form.bultos) }    : {}),
      ...(form.comentarios ? { comentarios: form.comentarios }      : {}),
    };

    const existing: unknown[] = JSON.parse(localStorage.getItem("amplifica_created_ors") ?? "[]");
    existing.unshift(newOr); // newest first
    localStorage.setItem("amplifica_created_ors", JSON.stringify(existing));
  } catch { /* ignore */ }
}

// ─── Steps config ─────────────────────────────────────────────────────────────
const STEPS_FULL      = [
  { number: 1, label: "Definición de Destino" },
  { number: 2, label: "Detalle de Artículos" },
  { number: 3, label: "Reserva de andén" },
];
const STEPS_SIN_AGENDA = [
  { number: 1, label: "Definición de Destino" },
  { number: 2, label: "Detalle de Artículos" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
function CrearORPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Block roles that cannot create ORs (e.g. Operador)
  useEffect(() => {
    if (!can(getRole(), "or:create")) router.replace("/recepciones");
  }, [router]);

  const initialStep   = Math.max(1, Math.min(3, parseInt(searchParams.get("startStep") ?? "1") || 1));
  const isReagendar   = searchParams.get("mode") === "reagendar";
  const isSinAgenda   = searchParams.get("mode") === "sin-agenda";
  const isCompletar   = searchParams.get("mode") === "completar";
  const completarOrId = searchParams.get("orId") ?? "";
  const completarSucursal = searchParams.get("sucursal") ?? "";
  const completarSeller   = searchParams.get("seller") ?? "";
  const totalSteps    = isSinAgenda ? 2 : 3;

  const [step,       setStep]       = useState(initialStep);
  const [maxReached, setMaxReached] = useState(initialStep);
  const [showInfo,   setShowInfo]   = useState(false);

  // Read sidebar filters to pre-fill & lock sucursal/seller
  const [lockedSucursal, setLockedSucursal] = useState(false);
  const [lockedSeller,   setLockedSeller]   = useState(false);

  const [form, setForm] = useState<FormData>(() => {
    const defaults: FormData = {
      sucursal: "Quilicura", tienda: "Extra Life",
      pallets: "", bultos: "", desconoceFormato: false,
      comentarios: "", guiaDespacho: null, products: [],
      fechaReserva: "", horaReserva: "",
    };
    if (typeof window === "undefined") return defaults;
    // Completar mode: pre-fill from URL params
    if (isCompletar && completarSucursal) defaults.sucursal = completarSucursal;
    if (isCompletar && completarSeller)   defaults.tienda   = completarSeller;
    // Sidebar filter pre-fill (lower priority than completar)
    if (!isCompletar) {
      const suc = localStorage.getItem("amplifica_filter_sucursal");
      const sel = localStorage.getItem("amplifica_filter_seller");
      if (suc) defaults.sucursal = suc;
      if (sel) defaults.tienda = sel;
    }
    return defaults;
  });

  useEffect(() => {
    if (isCompletar) {
      // Lock sucursal/seller in completar mode (they came from the existing OR)
      if (completarSucursal) setLockedSucursal(true);
      if (completarSeller)   setLockedSeller(true);
    } else {
      const suc = localStorage.getItem("amplifica_filter_sucursal");
      const sel = localStorage.getItem("amplifica_filter_seller");
      if (suc) setLockedSucursal(true);
      if (sel) setLockedSeller(true);
    }
  }, [isCompletar, completarSucursal, completarSeller]);

  const canContinue = () => {
    if (step === 1) return form.sucursal && form.tienda && (form.desconoceFormato || (form.pallets && form.bultos));
    if (step === 2) return form.products.length > 0;
    if (step === 3) return !!form.fechaReserva && !!form.horaReserva;
    return false;
  };

  const handleSubmit = () => {
    if (isCompletar && completarOrId) {
      // Update existing OR to "Programado" with the new date/time
      try {
        const now  = new Date();
        const dd   = String(now.getDate()).padStart(2, "0");
        const mm   = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        let fechaAgendada = "—";
        if (form.fechaReserva && form.horaReserva) {
          const [fy, fm, fd] = form.fechaReserva.split("-");
          fechaAgendada = `${fd}/${fm}/${fy} ${form.horaReserva}`;
        }
        // Override the OR status to Programado
        localStorage.setItem(`amplifica_or_${completarOrId}`, JSON.stringify({
          estado: "Programado",
          fechaAgendada,
          skus: form.products.length,
          uTotales: String(form.products.reduce((s, p) => s + p.qty, 0)),
        }));
        // Also update if it exists in amplifica_created_ors
        try {
          const existing: Array<{ id: string; [k: string]: unknown }> = JSON.parse(localStorage.getItem("amplifica_created_ors") ?? "[]");
          const idx = existing.findIndex(o => o.id === completarOrId);
          if (idx >= 0) {
            existing[idx] = { ...existing[idx], estado: "Programado", fechaAgendada, skus: form.products.length, uTotales: String(form.products.reduce((s, p) => s + p.qty, 0)) };
            localStorage.setItem("amplifica_created_ors", JSON.stringify(existing));
          }
        } catch { /* ignore */ }
      } catch { /* ignore */ }
      router.push("/recepciones?completed=1");
    } else if (!isReagendar) {
      persistNewOr(form, false);
      router.push("/recepciones?created=1");
    } else {
      router.push("/recepciones?rescheduled=1");
    }
  };

  // "Recepción sin agenda": auto-assign current date & time, then submit
  const handleSubmitSinAgenda = () => {
    const now  = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    const dd   = String(now.getDate()).padStart(2, "0");
    const hh   = String(now.getHours()).padStart(2, "0");
    const min  = String(now.getMinutes()).padStart(2, "0");
    const updatedForm = { ...form, fechaReserva: `${yyyy}-${mm}-${dd}`, horaReserva: `${hh}:${min}` };
    setForm(() => updatedForm);
    persistNewOr(updatedForm, true);
    router.push("/recepciones?created=1");
  };

  const pageTitle = isSinAgenda
    ? "Nueva OR sin Agenda"
    : isCompletar
    ? "Completar Orden de Recepción"
    : isReagendar
    ? "Reagendar Orden de Recepción"
    : "Nueva Orden de Recepción";

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="max-w-5xl mx-auto px-4 lg:px-6 pt-4 pb-1 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-neutral-500">
        <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">{pageTitle}</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-3 pb-40 lg:pb-8">
        {/* Title */}
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{pageTitle}</h1>
          <button onClick={() => setShowInfo(true)} className="text-neutral-600 hover:text-neutral-600 text-base">ⓘ</button>
        </div>

        {/* Info modal — portal to body to escape overflow-hidden */}
        {showInfo && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setShowInfo(false)}>
            <div className="bg-white rounded-2xl mx-4 max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-neutral-900">Orden de Recepción</h1>
                <button onClick={() => setShowInfo(false)} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
                  <X className="w-4 h-4 text-neutral-600" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>Una <span className="font-semibold text-neutral-800">Orden de Recepción (OR)</span> es el documento que registra el ingreso de mercancía al centro de distribución.</p>
                <p>Este formulario te guía en 3 pasos:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-600">
                  <li><span className="font-medium text-neutral-700">Definición de destino</span> — Sucursal, formato de carga y guía de despacho.</li>
                  <li><span className="font-medium text-neutral-700">Detalle de artículos</span> — SKUs y cantidades que se recibirán.</li>
                  <li><span className="font-medium text-neutral-700">Reserva de andén</span> — Fecha y bloque horario para la descarga.</li>
                </ol>
                <p className="text-xs text-neutral-600 pt-1">Completa todos los pasos para generar la OR y coordinar la descarga.</p>
              </div>
              <Button variant="primary" size="lg" onClick={() => setShowInfo(false)} className="mt-5 w-full">
                Entendido
              </Button>
            </div>
          </div>,
          document.body
        )}

        {/* Stepper */}
        <div className="mb-8">
          <StepIndicator
            current={step}
            maxReached={maxReached}
            onStepClick={n => setStep(n)}
            steps={isSinAgenda ? STEPS_SIN_AGENDA : STEPS_FULL}
          />
        </div>

        {/* Content card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6">
          {step === 1 && <Step1 form={form} setForm={setForm} lockedSucursal={lockedSucursal} lockedSeller={lockedSeller} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && !isSinAgenda && <Step3 form={form} setForm={setForm} isReagendar={isReagendar} />}
        </div>

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 pt-3 pb-6 flex flex-col gap-2 z-30 sm:flex-row-reverse sm:items-center sm:pb-3 lg:static lg:border-0 lg:px-0 lg:py-0 lg:mt-6 lg:flex-row lg:justify-between">
          {/* sin-agenda: step 2 → submit directly */}
          {isSinAgenda && step === 2 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmitSinAgenda}
              disabled={!canContinue()}
              iconLeft={<Check className="w-4 h-4" />}
              className="w-full h-12 sm:h-auto sm:w-auto sm:flex-1 lg:flex-none"
            >
              Crear OR sin agenda
            </Button>
          ) : step < totalSteps ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setStep(s => s + 1);
                setMaxReached(m => Math.max(m, step + 1));
              }}
              disabled={!canContinue()}
              iconRight={<ArrowRight className="w-4 h-4" />}
              className="w-full h-12 sm:h-auto sm:w-auto sm:flex-1 lg:flex-none"
            >
              Continuar
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={!canContinue()}
              iconLeft={<Check className="w-4 h-4" />}
              className="w-full h-12 sm:h-auto sm:w-auto sm:flex-1 lg:flex-none"
            >
              {isCompletar ? "Completar Orden" : isReagendar ? "Guardar nueva fecha" : "Crear Orden de Recepción"}
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={() => (step === 1 || (isReagendar && step === 3) || (isCompletar && step === 2)) ? router.push("/recepciones") : setStep(s => s - 1)}
            className="w-full h-12 sm:h-auto sm:w-auto lg:flex-none lg:order-first"
          >
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Default export — wraps inner component in Suspense (required for useSearchParams) ─
export default function CrearORPage() {
  return (
    <Suspense fallback={null}>
      <CrearORPageInner />
    </Suspense>
  );
}
