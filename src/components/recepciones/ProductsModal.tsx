"use client";

import { useState } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalProduct = {
  sku: string;
  nombre: string;
  barcode: string;
  qty: number;
  checked: boolean;
};

export type AddProduct = {
  sku: string;
  nombre: string;
  barcode: string;
  qty: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: ModalProduct[] = [
  { sku: "TD-10",    nombre: "Tropical Delight 10 Sachets",                    barcode: "07810001", qty: 0, checked: false },
  { sku: "TD-20",    nombre: "Tropical Delight 20 Sachets",                    barcode: "07810002", qty: 0, checked: false },
  { sku: "TD-40",    nombre: "Tropical Delight 40 Sachets",                    barcode: "07810003", qty: 0, checked: false },
  { sku: "BB-10",    nombre: "Berry Blast 10 Sachets",                         barcode: "07810011", qty: 0, checked: false },
  { sku: "BB-20",    nombre: "Berry Blast 20 Sachets",                         barcode: "07810012", qty: 0, checked: false },
  { sku: "BB-40",    nombre: "Berry Blast 40 Sachets",                         barcode: "07810013", qty: 0, checked: false },
  { sku: "LS-10",    nombre: "Lime Sensation 10 Sachets",                      barcode: "07810021", qty: 0, checked: false },
  { sku: "LS-20",    nombre: "Lime Sensation 20 Sachets",                      barcode: "07810022", qty: 0, checked: false },
  { sku: "LS-40",    nombre: "Lime Sensation 40 Sachets",                      barcode: "07810023", qty: 0, checked: false },
  { sku: "OMFVP-10", nombre: "Orange Mango Fusion Variety Pack 10 Sachets",    barcode: "07810031", qty: 0, checked: false },
  { sku: "OMFVP-20", nombre: "Orange Mango Fusion Variety Pack 20 Sachets",    barcode: "07810032", qty: 0, checked: false },
  { sku: "OMFVP-40", nombre: "Orange Mango Fusion Variety Pack 40 Sachets",    barcode: "07810033", qty: 0, checked: false },
];

// ─── Checkbox component ───────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex w-5 h-5 rounded items-center justify-center flex-shrink-0 transition-colors duration-300 ${
        checked ? "bg-primary-500" : "bg-white border-2 border-neutral-300"
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  onClose: () => void;
  onAdd: (products: AddProduct[]) => void;
  initialSearch?: string;
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function ProductsModal({ onClose, onAdd, initialSearch = "" }: Props) {
  const [search,   setSearch]   = useState(initialSearch);
  const [products, setProducts] = useState<ModalProduct[]>(MOCK_PRODUCTS);

  const filtered = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const toggleCheck = (sku: string) =>
    setProducts((prev) =>
      prev.map((p) => (p.sku === sku ? { ...p, checked: !p.checked } : p))
    );

  const updateQty = (sku: string, raw: string) => {
    const qty = Math.max(0, parseInt(raw) || 0);
    setProducts((prev) =>
      prev.map((p) => (p.sku === sku ? { ...p, qty } : p))
    );
  };

  const selected = products.filter((p) => p.checked);

  const handleAdd = () => {
    onAdd(selected.map(({ sku, nombre, barcode, qty }) => ({ sku, nombre, barcode, qty })));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-neutral-900">Agregar productos</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors duration-300"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="relative">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca por SKU, nombre o código de barras"
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              autoFocus
            />
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <div className="border-t border-neutral-100 flex-shrink-0" />

        {/* ── Product list (scrollable) ─────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 min-h-0">

          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-neutral-100">
            {filtered.map((product, i) => (
              <div
                key={`m-${product.sku}-${i}`}
                className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-neutral-50/60 transition-colors duration-300"
                onClick={() => toggleCheck(product.sku)}
              >
                <div className="pt-0.5 flex-shrink-0">
                  <Checkbox checked={product.checked} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 font-medium leading-snug">{product.nombre}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {product.sku} · {product.barcode}
                  </p>
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      value={product.qty}
                      onChange={(e) => updateQty(product.sku, e.target.value)}
                      className="w-20 px-2.5 py-1.5 bg-neutral-100 rounded-lg text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-neutral-200">
              <tr>
                <th className="py-3 px-5 w-12"></th>
                <th className="text-left py-3 px-5 font-semibold text-neutral-900">Nombre</th>
                <th className="text-left py-3 px-5 font-semibold text-neutral-900">SKU</th>
                <th className="text-left py-3 px-5 font-semibold text-neutral-900 whitespace-nowrap">C. de barras</th>
                <th className="text-left py-3 px-5 font-semibold text-neutral-900">Cantidad</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((product, i) => (
                <tr
                  key={`${product.sku}-${i}`}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60 transition-colors duration-300 cursor-pointer"
                  onClick={() => toggleCheck(product.sku)}
                >
                  <td className="py-4 px-5">
                    <Checkbox checked={product.checked} />
                  </td>
                  <td className="py-4 px-5 text-neutral-700">{product.nombre}</td>
                  <td className="py-4 px-5 text-neutral-700">{product.sku}</td>
                  <td className="py-4 px-5 text-neutral-700">{product.barcode}</td>
                  <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      value={product.qty}
                      onChange={(e) => updateQty(product.sku, e.target.value)}
                      className="w-24 px-3 py-1.5 bg-neutral-100 rounded-lg text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Footer CTA (design system pattern) ───────────────────────── */}
        <div className="border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex-shrink-0 space-y-2.5">
          {/* Status message */}
          <p className="text-xs font-medium text-center text-neutral-600">
            {selected.length > 0
              ? `${selected.length} producto${selected.length !== 1 ? "s" : ""} seleccionado${selected.length !== 1 ? "s" : ""}`
              : "Sin productos seleccionados"}
          </p>
          {/* Primary CTA */}
          <Button variant="primary" size="md" onClick={handleAdd} disabled={selected.length === 0} className="w-full">
            Agregar
          </Button>
          {/* Secondary CTA */}
          <Button variant="tertiary" size="md" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
