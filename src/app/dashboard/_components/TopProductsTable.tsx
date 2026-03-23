"use client";

import { useState } from "react";
import { TOP_PRODUCTS, ORDERS_TABLE, PRODUCT_ORDERS_TABLE, fmtCLP } from "../_data";
import { Download, ExternalLink } from "lucide-react";
import ChartCard from "./ChartCard";
import Link from "next/link";

const TABS = ["Por Productos", "Por Pedidos", "Por Producto Pedido"] as const;
const PAGE_SIZE = 10;

export default function TopProductsTable() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Por Productos");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const title = activeTab === "Por Productos"
    ? "Resumen por Producto"
    : activeTab === "Por Pedidos"
    ? "Resumen por Pedido Finalizado"
    : "Resumen por Producto - Pedido";

  // Data + search filter
  const filteredData = (() => {
    const q = search.toLowerCase();
    if (activeTab === "Por Productos") {
      return q ? TOP_PRODUCTS.filter(p => p.sku.toLowerCase().includes(q) || p.producto.toLowerCase().includes(q) || p.tienda.toLowerCase().includes(q)) : TOP_PRODUCTS;
    }
    if (activeTab === "Por Pedidos") {
      return q ? ORDERS_TABLE.filter(o => o.codigoPedido.toLowerCase().includes(q) || o.tienda.toLowerCase().includes(q) || String(o.id).includes(q)) : ORDERS_TABLE;
    }
    return q ? PRODUCT_ORDERS_TABLE.filter(po => po.sku.toLowerCase().includes(q) || po.producto.toLowerCase().includes(q) || po.codigoPedido.toLowerCase().includes(q)) : PRODUCT_ORDERS_TABLE;
  })();

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const rows = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ChartCard
      title={title}
      subtitle={`Mostrando ${rows.length} de ${filteredData.length} entradas`}
      action={
        <button className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Exportar a Excel
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-0.5 p-1 bg-neutral-100 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); setSearch(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab === "Por Productos" ? "Vista por Productos" :
               tab === "Por Pedidos" ? "Vista por Pedidos" :
               "Vista por Producto Pedido"}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Buscar:</span>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 w-40 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="SKU, producto, tienda..."
          />
        </div>
      </div>

      {/* Table — Por Productos */}
      {activeTab === "Por Productos" && (
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
              {(rows as typeof TOP_PRODUCTS).map((p, i) => (
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
      )}

      {/* Table — Por Pedidos */}
      {activeTab === "Por Pedidos" && (
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">ID</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Código de Pedido</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nro Boleta</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Canal de Venta</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Monto Total</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Fecha</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Sucursal</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tienda</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Ver Más</th>
              </tr>
            </thead>
            <tbody>
              {(rows as typeof ORDERS_TABLE).map((o, i) => (
                <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-neutral-600 tabular-nums">{o.id}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-800 font-mono">{o.codigoPedido}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500">{o.nroBoleta}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-600">{o.canalVenta}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium text-neutral-700">{o.montoTotal.toLocaleString("es-CL")}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500 tabular-nums whitespace-nowrap">{o.fecha}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-600">{o.sucursal}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-600">{o.tienda}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Link href={`/pedidos/${o.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-500 text-white text-[10px] font-medium hover:bg-primary-600 transition-colors">
                      Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table — Por Producto Pedido */}
      {activeTab === "Por Producto Pedido" && (
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">SKU</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Producto</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">ID Pedido</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nro Boleta</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Fecha Entrega</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Fecha Boleta</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Precio Unitario</th>
              </tr>
            </thead>
            <tbody>
              {(rows as typeof PRODUCT_ORDERS_TABLE).map((po, i) => (
                <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-neutral-600 font-mono tabular-nums">{po.sku}</td>
                  <td className="py-2.5 px-3 text-neutral-800 max-w-[320px] truncate">{po.producto}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-600 font-mono">{po.codigoPedido}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500">{po.nroBoleta}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500 tabular-nums whitespace-nowrap">{po.fechaEntrega}</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500">{po.fechaBoleta}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium text-neutral-700">{po.precioUnitario.toLocaleString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
