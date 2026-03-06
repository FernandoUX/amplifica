"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight, Trash2, Scan, ImageOff,
  Clock, User, PlayCircle, StopCircle,
  ChevronDown, ChevronUp, MoreHorizontal, Package,
} from "lucide-react";
import {
  CheckCircle, AlertTriangle, XCircle,
  Plus, InfoCircle, ClipboardCheck, LockUnlocked01,
} from "@untitled-ui/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductConteo = {
  id: string;
  sku: string;
  nombre: string;
  barcode: string;
  imagen?: string;
  esperadas: number;
  contadasSesion: number;
};

type SesionItem = {
  pid: string;
  sku: string;
  nombre: string;
  cantidad: number;
};

type Sesion = {
  id: string;
  operador: string;
  inicio: string;
  fin: string;
  items: SesionItem[];
};

type OrdenData = {
  id: string;
  seller: string;
  sucursal: string;
  fechaAgendada: string;
  products: ProductConteo[];
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDENES: Record<string, OrdenData> = {
  "RO-BARRA-180": {
    id: "RO-BARRA-180",
    seller: "Extra Life",
    sucursal: "Quilicura",
    fechaAgendada: "08/03/2026 16:30",
    products: [
      {
        id: "p1",
        sku: "300034",
        nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight",
        barcode: "8500942860946",
        imagen: undefined,
        esperadas: 100,
        contadasSesion: 0,
      },
      {
        id: "p2",
        sku: "300052",
        nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",
        barcode: "8500942860625",
        imagen: undefined,
        esperadas: 150,
        contadasSesion: 0,
      },
    ],
  },
};

function getFallbackOrden(id: string): OrdenData {
  return {
    id,
    seller: "Extra Life",
    sucursal: "Quilicura",
    fechaAgendada: "—",
    products: [
      { id: "p1", sku: "SKU-001", nombre: "Producto de muestra A", barcode: "1234567890001", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "SKU-002", nombre: "Producto de muestra B", barcode: "1234567890002", esperadas: 100, contadasSesion: 0 },
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ProductStatus = "completo" | "diferencia" | "exceso" | "pendiente";

function getProductStatus(total: number, esperadas: number): ProductStatus {
  if (total === 0 && esperadas > 0) return "pendiente";
  if (esperadas === 0 && total > 0) return "exceso";
  if (total === esperadas)           return "completo";
  return "diferencia";
}

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function sesionId(n: number) {
  return `SES-${String(n).padStart(3, "0")}`;
}

// ─── Categorizar dropdown ─────────────────────────────────────────────────────
const CATEGORIAS = ["Sin diferencias", "Con diferencias", "No pickeable", "Exceso"];

function CategorizarBtn() {
  const [open, setOpen]   = useState(false);
  const [sel,  setSel]    = useState<string | null>(null);
  const ref               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
      >
        {sel ?? "Categorizar"}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
          {CATEGORIAS.map(c => (
            <button
              key={c}
              onClick={() => { setSel(c); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${sel === c ? "text-indigo-600 font-medium" : "text-gray-700"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({
  product, acumulado, sesionActiva, onChange, onRemove,
}: {
  product: ProductConteo;
  acumulado: number;
  sesionActiva: boolean;
  onChange: (id: string, val: number) => void;
  onRemove:  (id: string) => void;
}) {
  const total  = acumulado + product.contadasSesion;
  const status = getProductStatus(total, product.esperadas);
  const pct    = product.esperadas > 0 ? Math.min(100, (total / product.esperadas) * 100) : 0;

  const barColor =
    status === "completo"   ? "bg-green-500" :
    status === "diferencia" ? "bg-amber-400" :
    status === "exceso"     ? "bg-red-400"   : "bg-gray-200";

  return (
    <div className="p-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-4">

        {/* Product image */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {product.imagen
            ? <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
            : <ImageOff className="w-7 h-7 text-gray-300" />}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">

          {/* Name + trash */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{product.nombre}</p>
            <button
              onClick={() => onRemove(product.id)}
              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* SKU + barcode */}
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="font-semibold text-gray-500">SKU:</span> {product.sku}
            <span className="mx-2 text-gray-200">|</span>
            <span className="font-semibold text-gray-500">C. DE BARRA:</span> {product.barcode}
          </p>

          {/* Counter + esperadas + categorizar */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {sesionActiva ? (
              <>
                <button
                  onClick={() => onChange(product.id, Math.max(0, product.contadasSesion - 1))}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold text-lg transition-colors"
                >−</button>
                <input
                  type="number" min={0} value={product.contadasSesion}
                  onChange={e => onChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 border border-gray-200 rounded-lg text-center text-sm font-semibold text-gray-800 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums"
                />
                <button
                  onClick={() => onChange(product.id, product.contadasSesion + 1)}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold text-lg transition-colors"
                >+</button>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Sin sesión activa</span>
            )}

            {/* esperadas */}
            <span className="flex items-center gap-1.5 text-sm text-gray-500 ml-1">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="tabular-nums font-medium text-gray-700">{total.toLocaleString("es-CL")}/{product.esperadas.toLocaleString("es-CL")}</span>
              <span className="text-gray-400">esperadas</span>
            </span>

            {/* Categorizar */}
            <div className="ml-auto">
              <CategorizarBtn />
            </div>
          </div>

          {/* Progress bar */}
          {product.esperadas > 0 && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Session history row ──────────────────────────────────────────────────────
function SesionRow({ sesion }: { sesion: Sesion }) {
  const [open, setOpen] = useState(false);
  const totalUds = sesion.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Session ID */}
        <span className="text-sm font-bold text-indigo-600 w-20 flex-shrink-0">{sesion.id}</span>

        {/* Operator */}
        <span className="flex items-center gap-1.5 text-sm text-gray-600 flex-shrink-0">
          <User className="w-3.5 h-3.5 text-gray-400" />
          {sesion.operador}
        </span>

        {/* Timestamps */}
        <span className="flex items-center gap-1.5 text-sm text-gray-400 flex-1 min-w-0 truncate">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          {fmtDT(sesion.inicio)}
          <span className="text-gray-300 mx-0.5">→</span>
          {fmtDT(sesion.fin)}
        </span>

        {/* SKU count + units */}
        <span className="text-sm text-gray-500 flex-shrink-0">
          {sesion.items.length} SKU{sesion.items.length !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-bold text-gray-800 tabular-nums w-14 text-right flex-shrink-0">
          {totalUds.toLocaleString("es-CL")} uds
        </span>

        {open
          ? <ChevronUp   className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && sesion.items.length > 0 && (
        <div className="px-4 pb-3 bg-gray-50/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-semibold">SKU</th>
                <th className="text-left py-2 font-semibold">Producto</th>
                <th className="text-right py-2 font-semibold">Contadas</th>
              </tr>
            </thead>
            <tbody>
              {sesion.items.map(item => (
                <tr key={item.pid} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 font-mono text-gray-500 text-xs">{item.sku}</td>
                  <td className="py-2 text-gray-700">{item.nombre}</td>
                  <td className="py-2 text-right font-semibold text-gray-800 tabular-nums">{item.cantidad.toLocaleString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Confirm-close modal ──────────────────────────────────────────────────────
function ConfirmCloseModal({
  id, sesiones, totalContadas, onCancel, onConfirm,
}: {
  id: string;
  sesiones: Sesion[];
  totalContadas: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Terminar recepción</p>
            <p className="text-xs text-gray-500">Esta acción es definitiva y no puede deshacerse.</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          ¿Confirmas el cierre de la orden{" "}
          <span className="font-mono font-semibold text-gray-800">{id}</span>? Se registrarán{" "}
          <span className="font-semibold">{totalContadas.toLocaleString("es-CL")} unidades</span>{" "}
          en{" "}
          <span className="font-semibold">{sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""}</span>.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Sí, terminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConteoORPage() {
  const params   = useParams();
  const rawId    = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const id       = decodeURIComponent(rawId);
  const baseData = MOCK_ORDENES[id] ?? getFallbackOrden(id);

  // ── State ───────────────────────────────────────────────────────────────────
  const [products,     setProducts]     = useState<ProductConteo[]>(baseData.products);
  const [sesiones,     setSesiones]     = useState<Sesion[]>([]);
  const [sesionActiva, setSesionActiva] = useState(false);
  const [sesionInicio, setSesionInicio] = useState("");
  const [scanner,      setScanner]      = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const OPERADOR = "Fernando Roblero";

  // ── Accumulated per product from CLOSED sessions ─────────────────────────
  const acumulado = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const ses of sesiones)
      for (const item of ses.items)
        map[item.pid] = (map[item.pid] ?? 0) + item.cantidad;
    return map;
  }, [sesiones]);

  const totalPP = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of products)
      map[p.id] = (acumulado[p.id] ?? 0) + p.contadasSesion;
    return map;
  }, [products, acumulado]);

  // ── Aggregate stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalEsperadas = products.reduce((s, p) => s + p.esperadas, 0);
    const totalAcum      = Object.values(acumulado).reduce((s, v) => s + v, 0);
    const totalSesionAct = products.reduce((s, p) => s + p.contadasSesion, 0);
    const totalContadas  = totalAcum + totalSesionAct;
    const pct            = totalEsperadas > 0 ? Math.round((totalContadas / totalEsperadas) * 100) : 0;

    const sinDiferencias = products.filter(p => getProductStatus(totalPP[p.id] ?? 0, p.esperadas) === "completo").length;
    const conDiferencias = products.filter(p => {
      const s = getProductStatus(totalPP[p.id] ?? 0, p.esperadas);
      return s === "diferencia" || s === "exceso";
    }).length;
    const pendientes = products.filter(p => getProductStatus(totalPP[p.id] ?? 0, p.esperadas) === "pendiente").length;

    return { totalEsperadas, totalContadas, totalSesionAct, pct, sinDiferencias, conDiferencias, pendientes };
  }, [products, acumulado, totalPP]);

  // ── Session actions ───────────────────────────────────────────────────────
  const iniciarSesion = () => {
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
    setSesionInicio(new Date().toISOString());
    setSesionActiva(true);
  };

  const finalizarSesion = () => {
    if (!sesionActiva) return;
    const fin   = new Date().toISOString();
    const items = products
      .filter(p => p.contadasSesion > 0)
      .map(p => ({ pid: p.id, sku: p.sku, nombre: p.nombre, cantidad: p.contadasSesion }));

    setSesiones(prev => [
      ...prev,
      { id: sesionId(prev.length + 1), operador: OPERADOR, inicio: sesionInicio, fin, items },
    ]);
    setSesionActiva(false);
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
  };

  const updateContadas = (pid: string, val: number) =>
    setProducts(ps => ps.map(p => p.id === pid ? { ...p, contadasSesion: val } : p));

  const removeProduct = (pid: string) =>
    setProducts(ps => ps.filter(p => p.id !== pid));

  const handleScan = () => {
    const code = scanner.trim();
    if (!code || !sesionActiva) return;
    const match = products.find(p => p.barcode === code || p.sku === code);
    if (match) { updateContadas(match.id, match.contadasSesion + 1); setScanner(""); }
  };

  const sesionNumActual = sesiones.length + 1;
  const totalAcumUds   = sesiones.reduce((s, ses) => s + ses.items.reduce((a, i) => a + i.cantidad, 0), 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {confirmClose && (
        <ConfirmCloseModal
          id={id}
          sesiones={sesiones}
          totalContadas={stats.totalContadas}
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => setConfirmClose(false)}
        />
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <nav className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/recepciones" className="hover:text-indigo-600 transition-colors">Recepciones</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-700 font-medium">Orden de Recepción</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* ── Title row ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Orden de Recepción{" "}
              <span className="font-mono text-gray-900">#{id}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {baseData.sucursal} - {baseData.fechaAgendada}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Three-dot menu */}
            <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Terminar recepción — gray, CA5 */}
            <button
              onClick={() => setConfirmClose(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <ClipboardCheck className="w-4 h-4" />
              Terminar recepción
            </button>
          </div>
        </div>

        {/* ── Summary cards — horizontal row ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[
              { label: "Seller",              value: baseData.seller },
              { label: "SKUs",                value: String(products.length) },
              { label: "Unidades declaradas", value: stats.totalEsperadas.toLocaleString("es-CL") },
              { label: "Sesiones",            value: String(sesiones.length + (sesionActiva ? 1 : 0)) },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-4">
                <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                <p className="text-base font-bold text-gray-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Progreso de conteo ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-gray-800">Progreso de conteo</span>
            <span className="text-sm font-bold text-gray-700 tabular-nums">
              {stats.totalContadas.toLocaleString("es-CL")}/{stats.totalEsperadas.toLocaleString("es-CL")}
              <span className="ml-1 text-gray-500 font-normal">({stats.pct}%)</span>
            </span>
          </div>

          {/* Bar */}
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.pct === 100 ? "bg-green-500" :
                stats.conDiferencias > 0 ? "bg-amber-400" : "bg-indigo-500"
              }`}
              style={{ width: `${stats.pct}%` }}
            />
          </div>

          {/* Chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {stats.conDiferencias > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                {stats.conDiferencias} con diferencias
              </span>
            )}
            {stats.sinDiferencias > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">
                {stats.sinDiferencias.toLocaleString("es-CL")} sin diferencias
              </span>
            )}
            {stats.pendientes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full">
                {stats.pendientes} pendientes
              </span>
            )}
          </div>
        </div>

        {/* ── Active-session banner / start button ── */}
        {sesionActiva ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-semibold text-indigo-800">{sesionId(sesionNumActual)}</span>
              <span className="text-indigo-400 ml-2 text-xs">Iniciada {fmtDT(sesionInicio)}</span>
            </div>
            <span className="text-xs font-semibold text-indigo-600 tabular-nums flex-shrink-0">
              {stats.totalSesionAct.toLocaleString("es-CL")} uds esta sesión
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <button
              onClick={iniciarSesion}
              className="flex items-center gap-2.5 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Iniciar sesión de conteo
            </button>
          </div>
        )}

        {/* ── Scanner (only during active session) ── */}
        {sesionActiva && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Escanear código de barras
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={scanner}
                  onChange={e => setScanner(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="Ingresa o escanea SKU / código de barras"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
                  autoFocus
                />
              </div>
              <button
                onClick={handleScan}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Registrar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono">Enter</kbd> o
              haz clic en Registrar para contar una unidad.
            </p>
          </div>
        )}

        {/* ── Products container ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Sin productos</p>
                <p className="text-xs text-gray-400 mt-0.5">Agrega los productos que llegaron en esta OR.</p>
              </div>
            </div>
          ) : (
            products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                acumulado={acumulado[p.id] ?? 0}
                sesionActiva={sesionActiva}
                onChange={updateContadas}
                onRemove={removeProduct}
              />
            ))
          )}

          {/* Añadir producto — inside the container */}
          <div className="border-t border-dashed border-gray-200">
            <button className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-medium">
              <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                <Plus className="w-3 h-3" />
              </span>
              Añadir producto
            </button>
          </div>
        </div>

        {/* ── Session history ── */}
        {sesiones.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">Historial de sesiones</span>
              <span className="text-sm text-gray-400 tabular-nums">
                {totalAcumUds.toLocaleString("es-CL")} uds acumuladas
              </span>
            </div>
            {sesiones.map(ses => (
              <SesionRow key={ses.id} sesion={ses} />
            ))}
          </div>
        )}

        {/* ── Footer: Liberar + Finalizar sesión ── */}
        {sesionActiva && (
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
            >
              <LockUnlocked01 className="w-4 h-4 text-gray-400" />
              Liberar
            </button>

            <button
              onClick={finalizarSesion}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200"
            >
              <StopCircle className="w-4 h-4" />
              Finalizar sesión
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
