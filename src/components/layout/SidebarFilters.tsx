"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronsUpDown, Search } from "lucide-react";
import { type Role, getAllowedSucursales, getAllowedSellers, can } from "@/lib/roles";
import SidebarDatePicker from "./SidebarDatePicker";

// ─── Sucursales ──────────────────────────────────────────────────────────────
const LS_SUCURSALES = "amplifica_recepciones_sucursales";
type SucursalItem = { id: string; label: string; active: boolean };
const DEFAULT_SUCURSALES: SucursalItem[] = [
  { id: "quilicura",       label: "Quilicura",       active: true },
  { id: "la-reina",        label: "La Reina",        active: true },
  { id: "lo-barnechea",    label: "Lo Barnechea",    active: true },
  { id: "santiago-centro",  label: "Santiago Centro", active: true },
  { id: "providencia",     label: "Providencia",     active: true },
  { id: "las-condes",      label: "Las Condes",      active: true },
];

// ─── Demo sellers ────────────────────────────────────────────────────────────
const DEMO_SELLERS = [
  "Extra Life", "Le Vice", "Gohard", "VitaFit", "NutriPro",
  "BioNature", "FitLab", "PowerNutri", "OmegaPlus", "ProHealth",
  "NaturalBoost", "BodyFuel", "VitalCore", "PureFit", "MaxProtein",
];

type SidebarFiltersProps = {
  currentRole: Role;
};

export default function SidebarFilters({ currentRole }: SidebarFiltersProps) {
  // ── Sucursal ──────────────────────────────────────────────────────────────
  const [sucursales, setSucursales] = useState<SucursalItem[]>(DEFAULT_SUCURSALES);
  const [selectedSucursal, _setSelectedSucursal] = useState<string | null>(null);
  const setSelectedSucursal = (v: string | null) => {
    _setSelectedSucursal(v);
    localStorage.setItem("amplifica_filter_sucursal", v ?? "");
    window.dispatchEvent(new Event("amplifica-filter-change"));
  };
  const [sucursalOpen, setSucursalOpen] = useState(false);
  const sucursalRef = useRef<HTMLDivElement>(null);

  // ── Tienda (seller) ───────────────────────────────────────────────────────
  const [selectedSeller, _setSelectedSeller] = useState<string | null>(null);
  const setSelectedSeller = (v: string | null) => {
    _setSelectedSeller(v);
    localStorage.setItem("amplifica_filter_seller", v ?? "");
    window.dispatchEvent(new Event("amplifica-filter-change"));
  };
  const [sellerOpen, setSellerOpen] = useState(false);
  const [sellerSearch, setSellerSearch] = useState("");
  const sellerRef = useRef<HTMLDivElement>(null);

  // ── Role-filtered lists ───────────────────────────────────────────────────
  const allowedSucursales = getAllowedSucursales(currentRole);
  const allowedSellers = getAllowedSellers(currentRole);
  const canFilterSucursal = can(currentRole, "filter:sucursal");
  const canFilterSeller = can(currentRole, "filter:seller");

  const roleSucursales = useMemo(() => {
    if (allowedSucursales === "all") return sucursales;
    return sucursales.filter(s => allowedSucursales.includes(s.label));
  }, [sucursales, allowedSucursales]);

  const baseSellers = useMemo(() => {
    if (allowedSellers === "all") return DEMO_SELLERS;
    return DEMO_SELLERS.filter(s => (allowedSellers as string[]).includes(s));
  }, [allowedSellers]);

  const filteredSellers = useMemo(() => {
    if (!sellerSearch.trim()) return baseSellers;
    const q = sellerSearch.toLowerCase();
    return baseSellers.filter(s => s.toLowerCase().includes(q));
  }, [sellerSearch, baseSellers]);

  // Load sucursales from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_SUCURSALES);
      if (s) {
        const parsed = JSON.parse(s) as SucursalItem[];
        setSucursales(parsed.filter(x => x.active !== false));
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-set filters when role has restricted access
  useEffect(() => {
    if (allowedSucursales !== "all" && allowedSucursales.length === 1) {
      setSelectedSucursal(allowedSucursales[0]);
    } else if (allowedSucursales === "all") {
      setSelectedSucursal(null);
    }
    if (allowedSellers !== "all" && allowedSellers.length === 1) {
      setSelectedSeller(allowedSellers[0]);
    } else if (allowedSellers === "all") {
      setSelectedSeller(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);

  // Close dropdowns on click-outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sucursalRef.current && !sucursalRef.current.contains(e.target as Node)) setSucursalOpen(false);
      if (sellerRef.current && !sellerRef.current.contains(e.target as Node)) { setSellerOpen(false); setSellerSearch(""); }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="px-2.5 pt-2.5 pb-2 space-y-1.5 border-b border-white/10">
      {/* ── Sucursal selector ──────────────────────────────────────────── */}
      <div ref={sucursalRef} className="relative">
        <button
          onClick={() => { if (!canFilterSucursal && roleSucursales.length <= 1) return; setSucursalOpen(o => !o); setSellerOpen(false); setSellerSearch(""); }}
          className={`w-full flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-300 ${
            canFilterSucursal || roleSucursales.length > 1 ? "hover:bg-white/10 cursor-pointer" : "opacity-70 cursor-default"
          }`}
        >
          <div className="text-left">
            <p className="text-white/40 text-[10px] leading-none mb-0.5">Sucursal</p>
            <p className="text-white font-medium">{selectedSucursal ?? "Todas"}</p>
          </div>
          {(canFilterSucursal || roleSucursales.length > 1) && (
            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          )}
        </button>

        {sucursalOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-52 overflow-y-auto sidebar-scroll">
            {(allowedSucursales === "all" || roleSucursales.length > 1) && (
              <button
                onClick={() => { setSelectedSucursal(null); setSucursalOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 ${
                  selectedSucursal === null
                    ? "text-white bg-white/10 font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                Todas
              </button>
            )}
            {roleSucursales.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSucursal(s.label); setSucursalOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 ${
                  selectedSucursal === s.label
                    ? "text-white bg-white/10 font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tienda (seller) selector ─────────────────────────────────── */}
      <div ref={sellerRef} className="relative">
        <button
          onClick={() => { if (!canFilterSeller && baseSellers.length <= 1) return; setSellerOpen(o => !o); setSucursalOpen(false); }}
          className={`w-full flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-300 ${
            canFilterSeller || baseSellers.length > 1 ? "hover:bg-white/10 cursor-pointer" : "opacity-70 cursor-default"
          }`}
        >
          <div className="text-left">
            <p className="text-white/40 text-[10px] leading-none mb-0.5">Tienda</p>
            <p className="text-white font-medium">{selectedSeller ?? "Todas"}</p>
          </div>
          {(canFilterSeller || baseSellers.length > 1) && (
            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          )}
        </button>

        {sellerOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-2 pt-2 pb-1.5">
              <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1.5">
                <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input
                  autoFocus
                  value={sellerSearch}
                  onChange={e => setSellerSearch(e.target.value)}
                  placeholder="Buscar tienda..."
                  className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-full"
                />
              </div>
            </div>
            <div className="max-h-[155px] overflow-y-auto sidebar-scroll py-1">
              {(allowedSellers === "all" || baseSellers.length > 1) && (
                <button
                  onClick={() => { setSelectedSeller(null); setSellerOpen(false); setSellerSearch(""); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 ${
                    selectedSeller === null
                      ? "text-white bg-white/10 font-medium"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Todas
                </button>
              )}
              {filteredSellers.map(s => (
                <button
                  key={s}
                  onClick={() => { setSelectedSeller(s); setSellerOpen(false); setSellerSearch(""); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 ${
                    selectedSeller === s
                      ? "text-white bg-white/10 font-medium"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {s}
                </button>
              ))}
              {filteredSellers.length === 0 && (
                <p className="px-3 py-2 text-white/30 text-xs">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Date filter ────────────────────────────────────────────────── */}
      <SidebarDatePicker />
    </div>
  );
}
