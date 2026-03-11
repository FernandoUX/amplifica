"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import {
  AlertCircle, ChevronDown, Upload, Trash2, MoreVertical,
  Package, ArrowRight, ChevronLeft, ChevronRight, Check
} from "lucide-react";
import StepIndicator from "@/components/recepciones/StepIndicator";
import ProductsModal, { AddProduct } from "@/components/recepciones/ProductsModal";
import FormField from "@/components/ui/FormField";

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
function Step1({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const handleFile = (file: File) => setForm(f => ({ ...f, guiaDespacho: file }));

  return (
    <div className="space-y-5">
      {/* Warning */}
      {showAlert && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Asegura tu mercancía</p>
            <p className="text-xs text-amber-600 mt-0.5">
              La Guía de Despacho es obligatoria para la cobertura del seguro. Evita pérdidas económicas subiendo un documento claro.
            </p>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-amber-400 hover:text-amber-600 transition-colors duration-300 flex-shrink-0 -mt-0.5 -mr-0.5"
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
        >
          <option value="Quilicura">Quilicura — El juncal 901, Quilicura, Santiago, Chile</option>
          <option value="Pudahuel">Pudahuel</option>
        </FormField>

        {/* Tienda */}
        <FormField
          as="select"
          label="Tienda"
          value={form.tienda}
          onChange={v => setForm(f => ({ ...f, tienda: v }))}
        >
          <option>Extra Life</option>
          <option>Outdoor Shop</option>
        </FormField>

        {/* Pallets */}
        <FormField
          as="select"
          label="Cantidad de pallets"
          value={form.pallets}
          onChange={v => setForm(f => ({ ...f, pallets: v }))}
          disabled={form.desconoceFormato}
        >
          <option value="">Seleccione</option>
          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}</option>)}
        </FormField>

        {/* Bultos */}
        <FormField
          as="select"
          label="Cantidad de bultos"
          value={form.bultos}
          onChange={v => setForm(f => ({ ...f, bultos: v }))}
          disabled={form.desconoceFormato}
        >
          <option value="">Seleccione</option>
          {[5,10,15,20,25,30,40,50,100].map(n => <option key={n}>{n}</option>)}
        </FormField>
      </div>

      {/* Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, desconoceFormato: !f.desconoceFormato }))}
          className={`w-10 h-6 rounded-full transition-colors duration-300 flex items-center px-1 ${form.desconoceFormato ? "bg-primary-500" : "bg-neutral-200"}`}
        >
          <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.desconoceFormato ? "translate-x-4" : "translate-x-0"}`} />
        </button>
        <span className="text-sm text-neutral-700">Desconozco la cantidad de pallets y/o bultos</span>
      </label>

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
              className="text-neutral-400 hover:text-red-500 p-1">
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
              <Upload className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600">
              <span className="text-primary-500 font-medium">Haz clic para subir guía de despacho</span>
              {" "}o arrastra y suelta
            </p>
            <p className="text-xs text-neutral-400">XML, PDF, JPG o PNG (5MB máximo)</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

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

  const q = search.toLowerCase().trim();
  const filtered = q
    ? form.products.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      )
    : form.products;

  return (
    <div className="space-y-5">
      {showModal && (
        <ProductsModal
          onClose={() => { setShowModal(false); setSearch(""); }}
          onAdd={addProducts}
          initialSearch={search}
        />
      )}

      {/* Warning */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Declaración de inventario entrante</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Asegúrate de incluir todos los SKUs. Datos incompletos o incorrectos generan errores de stock y bloqueos en el muelle de descarga.
          </p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-neutral-800">Ingresar productos</h3>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={form.products.length > 0 ? "Filtrar productos agregados por SKU, nombre o código…" : "Busca por SKU, nombre o código de barras"}
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-400"
          />
        </div>
        <button className="px-4 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 flex items-center gap-2 whitespace-nowrap">
          Descargar plantilla
        </button>
        <button className="px-4 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 flex items-center gap-2 whitespace-nowrap">
          <Upload className="w-4 h-4" /> Importar planilla
        </button>
      </div>

      {/* Empty or Table */}
      {form.products.length === 0 ? (
        <div className="border border-neutral-200 rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-neutral-800 text-sm">La recepción está vacía</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Comienza a agregar los SKUs de esta orden para habilitar el proceso de descarga. Puedes importar un archivo CSV o buscar productos manualmente.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50">
              Importar planilla
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              Agregar productos
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
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
              {filtered.length === 0 && q && (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <p className="text-sm text-neutral-400">Sin resultados para &quot;{search}&quot;</p>
                    <button onClick={() => setSearch("")} className="mt-1 text-xs text-primary-500 hover:text-primary-600 font-medium">Limpiar filtro</button>
                  </td>
                </tr>
              )}
              {filtered.map(product => (
                <tr key={product.sku} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium text-neutral-700 whitespace-nowrap">{product.sku}</td>
                  <td className="py-3 px-4 text-neutral-700">{product.nombre}</td>
                  <td className="py-3 px-4 text-neutral-500 font-mono text-xs">{product.barcode}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(product.sku, product.qty - 1)}
                        className="w-7 h-7 border border-neutral-200 rounded flex items-center justify-center hover:bg-neutral-100 font-medium text-neutral-600">−</button>
                      <input
                        type="number"
                        value={product.qty}
                        onChange={e => updateQty(product.sku, parseInt(e.target.value) || 1)}
                        className="w-14 border border-neutral-200 rounded px-2 py-1 text-center text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder-neutral-500"
                      />
                      <button onClick={() => updateQty(product.sku, product.qty + 1)}
                        className="w-7 h-7 border border-neutral-200 rounded flex items-center justify-center hover:bg-neutral-100 font-medium text-neutral-600">+</button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => removeProduct(product.sku)}
                      className="p-1.5 hover:bg-red-50 rounded text-neutral-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-neutral-100 flex justify-between items-center">
            <p className="text-xs text-neutral-500">
              {q && filtered.length !== form.products.length
                ? <>{filtered.length} de {form.products.length} SKU(s) · {filtered.reduce((s, p) => s + p.qty, 0)} unidades <span className="text-primary-500 ml-1 cursor-pointer hover:underline" onClick={() => setSearch("")}>(limpiar filtro)</span></>
                : <>{form.products.length} SKU(s) · {form.products.reduce((s, p) => s + p.qty, 0)} unidades</>
              }
            </p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 font-medium">
              + Agregar más productos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  // Anticipation hours from sucursal config (0 = no minimum advance)
  const [tiempoAnticipado, setTiempoAnticipado] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("amplifica_recepciones_config");
      if (!raw) return;
      const allConfigs = JSON.parse(raw) as Record<string, { tiempoAnticipado?: number }>;
      const sucId = (form.sucursal ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const cfg = allConfigs[sucId];
      if (cfg?.tiempoAnticipado) setTiempoAnticipado(cfg.tiempoAnticipado);
    } catch { /* ignore */ }
  }, [form.sucursal]);

  // All time slots flat — rendered in a 2-column grid
  const ALL_SLOTS = [
    "08:00","08:30","09:00","09:30","10:00","10:30",
    "11:00","11:30","12:00","12:30","13:00","13:30",
    "14:00","14:30","15:00","15:30","16:00","16:30",
    "17:00","17:30",
  ];
  const DISABLED_SLOTS = new Set(["10:00","10:30"]); // mock: agenda completa

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

  // Mock: days 17–19 are "agenda completa"
  const AGENDA_COMPLETA = new Set([17, 18, 19]);

  const selectedLabel = selected
    ? `${DAY_NAMES[selected.getDay()]} ${selected.getDate()} de ${MONTH_ES[selected.getMonth()]}`
    : "";

  // Detalle summary
  const totalQty = form.products.reduce((s, p) => s + p.qty, 0);

  return (
    <div className="space-y-5">

      {/* ── Alert ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
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
          >
            <option value="Quilicura">Quilicura</option>
            <option value="Pudahuel">Pudahuel</option>
            <option value="La Reina">La Reina</option>
            <option value="Lo Barnechea">Lo Barnechea</option>
            <option value="Santiago Centro">Santiago Centro</option>
            <option value="Providencia">Providencia</option>
            <option value="Las Condes">Las Condes</option>
          </FormField>
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
              : <p className="text-neutral-400">No adjuntada</p>
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
              <span key={d} className="text-center text-xs text-neutral-400 font-medium py-1">{d}</span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-10" />;

              const date      = new Date(viewYear, viewMonth, day);
              const isPast    = date < todayMidnight;
              const isToday   = date.getTime() === todayMidnight.getTime();
              const isSel     = selected ? date.toDateString() === selected.toDateString() : false;
              const isAgenda  = AGENDA_COMPLETA.has(day) && !isPast;
              const dotColor  = isSel     ? "bg-primary-500"
                              : isAgenda  ? "bg-neutral-400"
                              : !isPast   ? "bg-green-500"
                              : "";

              return (
                <div key={i} className="flex flex-col items-center py-0.5">
                  <button
                    disabled={isPast}
                    onClick={() => { if (!isPast) pickDay(day); }}
                    className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors duration-300 font-medium
                      ${isSel                           ? "bg-primary-500 text-white" : ""}
                      ${!isSel && isToday               ? "border border-primary-500 text-primary-500" : ""}
                      ${!isSel && !isToday && !isPast   ? "hover:bg-primary-50 text-neutral-700" : ""}
                      ${isPast                          ? "text-neutral-300 cursor-not-allowed" : ""}
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
              { color: "bg-neutral-400",   label: "Agenda completa" },
              { color: "bg-green-500",  label: "Bloques disponibles" },
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
                  const isDisabled = DISABLED_SLOTS.has(slot);
                  const isSlotSel  = form.horaReserva === slot;
                  return (
                    <button
                      key={slot}
                      disabled={isDisabled}
                      onClick={() => { if (!isDisabled) setForm(f => ({ ...f, horaReserva: slot })); }}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors duration-300 text-center
                        ${isSlotSel                       ? "bg-primary-500 text-white" : ""}
                        ${!isSlotSel && !isDisabled       ? "border border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50" : ""}
                        ${isDisabled                      ? "bg-neutral-50 text-neutral-300 border border-neutral-100 cursor-not-allowed" : ""}
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
                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-500">Bloques horarios</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-[180px]">Selecciona una fecha en el calendario para ver los bloques disponibles</p>
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
  const initialStep   = Math.max(1, Math.min(3, parseInt(searchParams.get("startStep") ?? "1") || 1));
  const isReagendar   = searchParams.get("mode") === "reagendar";
  const isSinAgenda   = searchParams.get("mode") === "sin-agenda";
  const totalSteps    = isSinAgenda ? 2 : 3;

  const [step,       setStep]       = useState(initialStep);
  const [maxReached, setMaxReached] = useState(initialStep);
  const [form, setForm] = useState<FormData>({
    sucursal: "Quilicura", tienda: "Extra Life",
    pallets: "", bultos: "", desconoceFormato: false,
    comentarios: "", guiaDespacho: null, products: [],
    fechaReserva: "", horaReserva: "",
  });

  const canContinue = () => {
    if (step === 1) return form.sucursal && form.tienda && (form.desconoceFormato || (form.pallets && form.bultos));
    if (step === 2) return form.products.length > 0;
    if (step === 3) return !!form.fechaReserva && !!form.horaReserva;
    return false;
  };

  const handleSubmit = () => {
    if (!isReagendar) persistNewOr(form, false);
    router.push(isReagendar ? "/recepciones?rescheduled=1" : "/recepciones?created=1");
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
    : isReagendar
    ? "Reagendar Orden de Recepción"
    : "Nueva Orden de Recepción";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <nav className="max-w-5xl mx-auto px-4 lg:px-6 pt-4 pb-1 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">{pageTitle}</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-3 pb-28 lg:pb-8">
        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{pageTitle}</h1>
          <button className="text-neutral-400 hover:text-neutral-600 text-base">ⓘ</button>
        </div>

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
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          {step === 1 && <Step1 form={form} setForm={setForm} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && !isSinAgenda && <Step3 form={form} setForm={setForm} />}
        </div>

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 flex items-center justify-between z-30 lg:static lg:border-0 lg:px-0 lg:py-0 lg:mt-6">
          <button
            onClick={() => (step === 1 || (isReagendar && step === 3)) ? router.push("/recepciones") : setStep(s => s - 1)}
            className="px-5 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 font-medium transition-colors duration-300"
          >
            Volver
          </button>

          {/* sin-agenda: step 2 → submit directly */}
          {isSinAgenda && step === 2 ? (
            <button
              onClick={handleSubmitSinAgenda}
              disabled={!canContinue()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              <Check className="w-4 h-4" />
              Crear OR sin agenda
            </button>
          ) : step < totalSteps ? (
            <button
              onClick={() => {
                setStep(s => s + 1);
                setMaxReached(m => Math.max(m, step + 1));
              }}
              disabled={!canContinue()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canContinue()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              <Check className="w-4 h-4" />
              {isReagendar ? "Guardar nueva fecha" : "Crear Orden de Recepción"}
            </button>
          )}
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
