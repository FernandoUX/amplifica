"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import { COURIERS } from "@/app/devoluciones/_data";

// ─── Types ───────────────────────────────────────────────────────────────────
type ReturnItem = {
  id: string;
  displayId: string;
};

type ContactoData = {
  nombre: string;
  telefono: string;
  email: string;
};

type DireccionData = {
  calle: string;
  numero: string;
  comuna: string;
  region: string;
  complemento: string;
};

type EnvioConfirmData = {
  courier: string;
  contacto: ContactoData;
  direccion: DireccionData;
  cantidadBultos: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sellerName: string;
  returns: ReturnItem[];
  onConfirm: (data: EnvioConfirmData) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function EnvioAlSellerModal({ open, onClose, sellerName, returns, onConfirm }: Props) {
  const [contacto, setContacto] = useState<ContactoData>({ nombre: "", telefono: "", email: "" });
  const [direccion, setDireccion] = useState<DireccionData>({ calle: "", numero: "", comuna: "", region: "", complemento: "" });
  const [courier, setCourier] = useState("");
  const [cantidadBultos, setCantidadBultos] = useState(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setContacto({ nombre: "", telefono: "", email: "" });
      setDireccion({ calle: "", numero: "", comuna: "", region: "", complemento: "" });
      setCourier("");
      setCantidadBultos(returns.length || 1);
      setTouched({});
      // Focus first interactive element
      setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 100);
    }
  }, [open, returns.length]);

  if (!open) return null;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto.email);
  const phoneValid = contacto.telefono.replace(/\D/g, "").length >= 8;

  const isValid =
    contacto.nombre.trim().length > 0 &&
    contacto.telefono.trim().length > 0 &&
    phoneValid &&
    contacto.email.trim().length > 0 &&
    emailValid &&
    direccion.calle.trim().length > 0 &&
    direccion.numero.trim().length > 0 &&
    direccion.comuna.trim().length > 0 &&
    direccion.region.trim().length > 0 &&
    courier.length > 0 &&
    cantidadBultos > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm({ courier, contacto, direccion, cantidadBultos });
  };

  const inputCls =
    "w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="envio-modal-title"
        className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Send className="w-4 h-4 text-primary-600" />
              </div>
              <h2 id="envio-modal-title" className="text-base font-bold text-neutral-900">
                Enviar devoluciones a {sellerName}
              </h2>
            </div>
            <p className="text-sm text-neutral-500 ml-10">
              {returns.length} {returns.length === 1 ? "devolución será enviada" : "devoluciones serán enviadas"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Section 1: Datos de contacto */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-3">
              Datos de contacto
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contacto.nombre}
                  onChange={e => setContacto(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del contacto"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Telefono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contacto.telefono}
                  onChange={e => setContacto(prev => ({ ...prev, telefono: e.target.value }))}
                  onBlur={() => setTouched(prev => ({ ...prev, telefono: true }))}
                  placeholder="+56 9 XXXX XXXX"
                  className={`${inputCls}${touched.telefono && contacto.telefono.trim().length > 0 && !phoneValid ? " !border-red-400 focus:!border-red-400 focus:!ring-red-400/15" : ""}`}
                />
                {touched.telefono && contacto.telefono.trim().length > 0 && !phoneValid && (
                  <p className="text-xs text-red-500 mt-1">Debe tener al menos 8 dígitos</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contacto.email}
                  onChange={e => setContacto(prev => ({ ...prev, email: e.target.value }))}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  placeholder="email@ejemplo.com"
                  className={`${inputCls}${touched.email && contacto.email.trim().length > 0 && !emailValid ? " !border-red-400 focus:!border-red-400 focus:!ring-red-400/15" : ""}`}
                />
                {touched.email && contacto.email.trim().length > 0 && !emailValid && (
                  <p className="text-xs text-red-500 mt-1">Ingresa un email válido</p>
                )}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-neutral-200" />

          {/* Section 2: Direccion de envio */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-3">
              Direccion de envio
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Calle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={direccion.calle}
                  onChange={e => setDireccion(prev => ({ ...prev, calle: e.target.value }))}
                  placeholder="Nombre de la calle"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Numeracion <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={direccion.numero}
                  onChange={e => setDireccion(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="1234"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Comuna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={direccion.comuna}
                  onChange={e => setDireccion(prev => ({ ...prev, comuna: e.target.value }))}
                  placeholder="Comuna"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={direccion.region}
                  onChange={e => setDireccion(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="Region"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={direccion.complemento}
                  onChange={e => setDireccion(prev => ({ ...prev, complemento: e.target.value }))}
                  placeholder="Depto, oficina, piso (opcional)"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-neutral-200" />

          {/* Section 3: Detalles del envio */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-3">
              Detalles del envio
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Courier <span className="text-red-500">*</span>
                </label>
                <select
                  value={courier}
                  onChange={e => setCourier(e.target.value)}
                  className={`${inputCls} appearance-none bg-white`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                >
                  <option value="">Seleccionar courier</option>
                  {COURIERS.filter(c => c !== "No identificado").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Cantidad de bultos <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={cantidadBultos}
                  onChange={e => setCantidadBultos(Math.max(1, parseInt(e.target.value) || 1))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2.5">
            <Package className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="text-sm text-neutral-600">
              <strong className="font-semibold text-neutral-800">{returns.length}</strong>{" "}
              {returns.length === 1 ? "devolución será enviada" : "devoluciones serán enviadas"} a{" "}
              <strong className="font-semibold text-neutral-800">{sellerName}</strong>
            </span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!isValid}
            onClick={handleConfirm}
            iconLeft={<Send className="w-4 h-4" />}
          >
            Confirmar envio
          </Button>
        </div>
      </div>
    </div>
  );
}
