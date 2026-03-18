"use client";

import { useState } from "react";
import { TOP_PRODUCTS, fmtCLP } from "../_data";
import { Download } from "lucide-react";
import ChartCard from "./ChartCard";

const TABS = ["Por Productos", "Por Pedidos", "Por Producto Pedido"] as const;
const PAGE_SIZE = 10;

export default function TopProductsTable() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Por Productos");
  const [page, setPage] = useState(1);

  // Mock: same data for all tabs (in production each tab would query differently)
  const data = TOP_PRODUCTS;
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const rows = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ChartCard
      title="Resumen por Producto"
      subtitle={`Mostrando ${rows.length} de ${data.length} entradas`}
      action={
        <button className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Exportar
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-0.5 p-1 bg-neutral-100 rounded-xl mb-4 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === tab
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">SKU</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Producto</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cantidad</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Monto Total</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tienda</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">
                <td className="py-2.5 px-3 text-xs text-neutral-600 font-mono tabular-nums">{p.sku}</td>
                <td className="py-2.5 px-3 text-neutral-800 max-w-[320px] truncate">{p.producto}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-medium text-neutral-700">{p.cantidad.toLocaleString("es-CL")}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-medium text-neutral-700">{fmtCLP(p.montoTotal)}</td>
                <td className="py-2.5 px-3 text-neutral-600">{p.tienda}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
