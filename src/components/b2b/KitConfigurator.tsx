"use client";

import { useState } from "react";
import { Package, Plus, Trash2, Printer } from "lucide-react";
import type { KitB2B } from "@/app/pedidos-b2b/_data";
import Button from "@/components/ui/Button";

type KitConfiguratorProps = {
  kits: KitB2B[];
  onKitsChange: (kits: KitB2B[]) => void;
  availableProducts: { sku: string; nombre: string }[];
};

export default function KitConfigurator({ kits, onKitsChange, availableProducts }: KitConfiguratorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newKitName, setNewKitName] = useState("");

  const addKit = () => {
    if (!newKitName.trim()) return;
    const newKit: KitB2B = {
      id: `kit-${Date.now()}`,
      nombre: newKitName.trim(),
      tipo: "simple",
      productos: [],
      solicitarImpresion: false,
    };
    onKitsChange([...kits, newKit]);
    setNewKitName("");
    setShowAdd(false);
  };

  const removeKit = (kitId: string) => {
    onKitsChange(kits.filter(k => k.id !== kitId));
  };

  const addProductToKit = (kitId: string, sku: string) => {
    const prod = availableProducts.find(p => p.sku === sku);
    if (!prod) return;
    onKitsChange(kits.map(k => {
      if (k.id !== kitId) return k;
      if (k.productos.some(p => p.sku === sku)) return k;
      const newProds = [...k.productos, { sku, nombre: prod.nombre, cantidad: 1 }];
      return { ...k, productos: newProds, tipo: newProds.length >= 3 ? "complejo" : "simple" };
    }));
  };

  const togglePrint = (kitId: string) => {
    onKitsChange(kits.map(k => k.id === kitId ? { ...k, solicitarImpresion: !k.solicitarImpresion } : k));
  };

  if (kits.length === 0 && !showAdd) {
    return (
      <div className="border border-dashed border-neutral-300 rounded-xl px-4 py-6 flex flex-col items-center gap-2">
        <Package className="w-6 h-6 text-neutral-300" />
        <p className="text-sm text-neutral-500">Sin kits configurados</p>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Agregar kit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Kits ({kits.length})</p>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>

      {/* Kit cards */}
      {kits.map(kit => (
        <div key={kit.id} className="border border-neutral-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-900">{kit.nombre}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                kit.tipo === "simple" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
              }`}>
                {kit.tipo === "simple" ? "Simple" : "Complejo"}
              </span>
            </div>
            <button onClick={() => removeKit(kit.id)} className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Products in kit */}
          {kit.productos.length > 0 ? (
            <div className="space-y-1 pl-6">
              {kit.productos.map(p => (
                <p key={p.sku} className="text-xs text-neutral-600">
                  {p.sku} — {p.nombre} (x{p.cantidad})
                </p>
              ))}
            </div>
          ) : (
            <div className="pl-6">
              <select
                onChange={e => { if (e.target.value) addProductToKit(kit.id, e.target.value); e.target.value = ""; }}
                className="text-xs border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-500"
                defaultValue=""
              >
                <option value="" disabled>+ Agregar producto al kit</option>
                {availableProducts.map(p => (
                  <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Print request */}
          <label className="flex items-center gap-2 pl-6 cursor-pointer">
            <input
              type="checkbox"
              checked={kit.solicitarImpresion}
              onChange={() => togglePrint(kit.id)}
              className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-xs text-neutral-600 flex items-center gap-1">
              <Printer className="w-3 h-3" /> Solicitar impresión de etiquetas a Amplifica
            </span>
          </label>
        </div>
      ))}

      {/* New kit form */}
      {showAdd && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKitName}
            onChange={e => setNewKitName(e.target.value)}
            placeholder="Nombre del kit (ej: Kit Verano x3)"
            className="flex-1 h-8 px-3 border border-neutral-300 rounded-md text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none"
            autoFocus
            onKeyDown={e => e.key === "Enter" && addKit()}
          />
          <Button variant="primary" size="sm" onClick={addKit} disabled={!newKitName.trim()}>Crear</Button>
          <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setNewKitName(""); }}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}
