"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart01,
  ShoppingBag01,
  RefreshCw01,
  Package,
  Cube01,
  LayersThree01,
  Settings01,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronSelectorVertical,
  SearchLg,
  Calendar,
  LogOut01,
  UserCircle,
  XClose,
} from "@untitled-ui/icons-react";
import AmplificaLogo from "./AmplificaLogo";
import { type Role, getAllowedSucursales, getAllowedSellers, can } from "@/lib/roles";

type Child = { label: string; href: string };
type MenuItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  hasChildren?: boolean;
  badge?: string;
  children?: Child[];
};

// ─── Sucursales (same localStorage key as configuracion) ──────────────────────
const LS_SUCURSALES = "amplifica_recepciones_sucursales";
type SucursalItem = { id: string; label: string; active: boolean };
const DEFAULT_SUCURSALES: SucursalItem[] = [
  { id: "quilicura",    label: "Quilicura",       active: true },
  { id: "la-reina",     label: "La Reina",        active: true },
  { id: "lo-barnechea", label: "Lo Barnechea",    active: true },
  { id: "santiago-centro", label: "Santiago Centro", active: true },
  { id: "providencia",  label: "Providencia",     active: true },
  { id: "las-condes",   label: "Las Condes",      active: true },
];

// ─── Demo sellers ─────────────────────────────────────────────────────────────
const DEMO_SELLERS = [
  "Extra Life",
  "Le Vice",
  "Gohard",
  "VitaFit",
  "NutriPro",
  "BioNature",
  "FitLab",
  "PowerNutri",
  "OmegaPlus",
  "ProHealth",
  "NaturalBoost",
  "BodyFuel",
  "VitalCore",
  "PureFit",
  "MaxProtein",
];

const MENU: MenuItem[] = [
  { label: "Dashboard",        icon: BarChart01,    href: "/dashboard" },
  { label: "Pedidos",          icon: ShoppingBag01, href: "/pedidos",     hasChildren: true },
  { label: "Devoluciones",     icon: RefreshCw01,   href: "/devoluciones", hasChildren: true },
  { label: "Inventario",       icon: Package,       href: "/inventario",  hasChildren: true },
  {
    label: "Recepciones", icon: Cube01, href: "/recepciones",
    hasChildren: true, badge: "BETA",
    children: [
      { label: "Órdenes de recepción", href: "/recepciones" },
      { label: "Crear Recepción",       href: "/recepciones/crear" },
      { label: "Configuración",         href: "/recepciones/configuracion" },
    ],
  },
  { label: "Productos",         icon: LayersThree01, href: "/productos",   hasChildren: true },
  { label: "Conjunto de reglas", icon: LayersThree01, href: "/reglas",     hasChildren: true },
];

type SidebarProps = {
  onClose?: () => void;
};

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed]   = useState(false);
  const [openMenus, setOpenMenus]   = useState<string[]>(["Recepciones"]);

  // ── Role switcher ───────────────────────────────────────────────────────
  const ROLES: Role[] = ["Super Admin", "Operador", "Seller", "KAM"];
  const [currentRole, setCurrentRole] = useState<Role>("Super Admin");
  const [roleOpen, setRoleOpen]       = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  // Load role from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("amplifica_user_role");
      if (saved && ROLES.includes(saved as Role)) setCurrentRole(saved as Role);
    } catch { /* ignore */ }
  }, []);

  const switchRole = (role: Role) => {
    setCurrentRole(role);
    setRoleOpen(false);
    localStorage.setItem("amplifica_user_role", role);
    window.dispatchEvent(new Event("amplifica-role-change"));
  };

  // ── Sucursal dropdown ────────────────────────────────────────────────────
  const [sucursales, setSucursales]           = useState<SucursalItem[]>(DEFAULT_SUCURSALES);
  const [selectedSucursal, _setSelectedSucursal] = useState<string | null>(null); // null = "Todas"
  const setSelectedSucursal = (v: string | null) => {
    _setSelectedSucursal(v);
    localStorage.setItem("amplifica_filter_sucursal", v ?? "");
    window.dispatchEvent(new Event("amplifica-filter-change"));
  };
  const [sucursalOpen, setSucursalOpen]       = useState(false);
  const sucursalRef = useRef<HTMLDivElement>(null);

  // ── Tienda (seller) dropdown ─────────────────────────────────────────────
  const [selectedSeller, _setSelectedSeller] = useState<string | null>(null); // null = "Todas"
  const setSelectedSeller = (v: string | null) => {
    _setSelectedSeller(v);
    localStorage.setItem("amplifica_filter_seller", v ?? "");
    window.dispatchEvent(new Event("amplifica-filter-change"));
  };
  const [sellerOpen, setSellerOpen]         = useState(false);
  const [sellerSearch, setSellerSearch]     = useState("");
  const sellerRef = useRef<HTMLDivElement>(null);

  // ── Date filter ─────────────────────────────────────────────────────────
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateFrom, _setDateFrom] = useState<string | null>(null);
  const [dateTo, _setDateTo]     = useState<string | null>(null);
  const [calMonth, setCalMonth]  = useState(() => { const d = new Date(); return [d.getFullYear(), d.getMonth()] as [number, number]; });
  const dateRef = useRef<HTMLDivElement>(null);

  const setDateRange = (from: string | null, to: string | null) => {
    _setDateFrom(from);
    _setDateTo(to);
    localStorage.setItem("amplifica_filter_date_from", from ?? "");
    localStorage.setItem("amplifica_filter_date_to", to ?? "");
    window.dispatchEvent(new Event("amplifica-filter-change"));
  };

  // ── Role-filtered lists ──────────────────────────────────────────────────
  const allowedSucursales = getAllowedSucursales(currentRole);
  const allowedSellers    = getAllowedSellers(currentRole);
  const canFilterSucursal = can(currentRole, "filter:sucursal");
  const canFilterSeller   = can(currentRole, "filter:seller");

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

  // Filter menu children by role (e.g. hide "Crear Recepción" for Operador)
  const roleMenu = useMemo(() => {
    return MENU.map(item => {
      if (item.label !== "Recepciones" || !item.children) return item;
      const filtered = item.children.filter(child => {
        if (child.href === "/recepciones/crear" && !can(currentRole, "or:create")) return false;
        return true;
      });
      return { ...item, children: filtered };
    });
  }, [currentRole]);

  // Load sucursales from localStorage (synced with configuracion page)
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
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDatePickerOpen(false);
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleMenu = (label: string) =>
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );

  return (
    <aside
      className={`${collapsed ? "lg:w-14" : "lg:w-60"} w-full text-white flex flex-col flex-shrink-0 transition-all duration-200 h-full`}
      style={{ backgroundColor: "#1D1D1F" }}
    >
      {/* ── Logo + collapse ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-3.5 border-b border-white/10">
        <div className="hidden lg:block">
          {!collapsed && <AmplificaLogo />}
          {collapsed && <AmplificaLogo collapsed />}
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded flex-shrink-0 lg:hidden"
          >
            <XClose className="w-5 h-5" />
          </button>
        )}
        {/* Desktop collapse toggle — icon only, right of logo */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`text-white/40 hover:text-white p-1 rounded flex-shrink-0 hidden lg:flex ${collapsed ? "mx-auto" : "ml-auto"}`}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Store selectors ───────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-2.5 pt-2.5 pb-2 space-y-1.5 border-b border-white/10">
          {/* ── Sucursal selector ──────────────────────────────────────── */}
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
                <ChevronSelectorVertical className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
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

          {/* ── Tienda (seller) selector ───────────────────────────────── */}
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
                <ChevronSelectorVertical className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              )}
            </button>

            {sellerOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Search input */}
                <div className="px-2 pt-2 pb-1.5">
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1.5">
                    <SearchLg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <input
                      autoFocus
                      value={sellerSearch}
                      onChange={e => setSellerSearch(e.target.value)}
                      placeholder="Buscar tienda..."
                      className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-full"
                    />
                  </div>
                </div>
                {/* List — 5 visible items (~155px) then scroll */}
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

          {/* ── Date filter (same card style) ────────────────────────────── */}
          <div ref={dateRef} className="relative">
            <button
              onClick={() => { setDatePickerOpen(o => !o); setSucursalOpen(false); setSellerOpen(false); setSellerSearch(""); }}
              className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs transition-colors duration-300"
            >
              <div className="text-left min-w-0 flex-1">
                <p className="text-white/40 text-[10px] leading-none mb-0.5">Fecha</p>
                <p className="text-white font-medium truncate">{dateFrom && dateTo
                  ? `${dateFrom.slice(8)}/${dateFrom.slice(5,7)} - ${dateTo.slice(8)}/${dateTo.slice(5,7)}/${dateTo.slice(0,4)}`
                  : dateFrom
                  ? `Desde ${dateFrom.slice(8)}/${dateFrom.slice(5,7)}/${dateFrom.slice(0,4)}`
                  : "Todas"}</p>
              </div>
              {dateFrom ? (
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); setDateRange(null, null); }}
                  className="text-white/40 hover:text-white cursor-pointer flex-shrink-0"
                >
                  <XClose className="w-3.5 h-3.5" />
                </span>
              ) : (
                <ChevronSelectorVertical className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              )}
            </button>

            {datePickerOpen && (<>
              {/* Mobile: dropdown below button with equal screen margins */}
              <div className="lg:hidden fixed inset-0 z-40" onClick={() => setDatePickerOpen(false)} />
              <div className="lg:hidden fixed left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-neutral-200 p-5"
                style={{ top: dateRef.current ? dateRef.current.getBoundingClientRect().bottom + 8 : 200 }}>

                {(() => {
                  const y = calMonth[0];
                  const m = calMonth[1];
                  const firstDay = new Date(y, m, 1).getDay();
                  const daysInMonth = new Date(y, m + 1, 0).getDate();
                  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
                  const cells: (number | null)[] = Array(firstDay).fill(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  const pad = (n: number) => String(n).padStart(2, "0");
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCalMonth(([yy,mm]) => mm === 0 ? [yy-1,11] : [yy,mm-1])} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-base font-semibold text-neutral-800">{MONTHS[m]} {y}</span>
                        <button onClick={() => setCalMonth(([yy,mm]) => mm === 11 ? [yy+1,0] : [yy,mm+1])} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 text-center text-xs text-neutral-400 mb-2">
                        {["Do","Lu","Ma","Mi","Ju","Vi","Sa"].map(d => <div key={d} className="py-1">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 text-center text-base">
                        {cells.map((day, i) => {
                          if (!day) return <div key={`e${i}`} />;
                          const ds = `${y}-${pad(m+1)}-${pad(day)}`;
                          const isToday = ds === todayStr;
                          const isFrom = ds === dateFrom;
                          const isTo = ds === dateTo;
                          const inRange = dateFrom && dateTo && ds > dateFrom && ds < dateTo;
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                if (!dateFrom || (dateFrom && dateTo)) {
                                  setDateRange(ds, null);
                                } else if (ds < dateFrom) {
                                  setDateRange(ds, dateFrom);
                                  setDatePickerOpen(false);
                                } else {
                                  setDateRange(dateFrom, ds);
                                  setDatePickerOpen(false);
                                }
                              }}
                              className={`py-2.5 rounded-lg transition-colors duration-150 ${
                                isFrom || isTo ? "bg-neutral-900 text-white font-medium" :
                                inRange ? "bg-neutral-100 text-neutral-800" :
                                isToday ? "bg-neutral-200 text-neutral-900 font-medium" :
                                "text-neutral-700 hover:bg-neutral-50"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      {dateFrom && (
                        <p className="text-xs text-neutral-400 text-center mt-3">
                          {dateFrom.slice(8)}/{dateFrom.slice(5,7)}/{dateFrom.slice(0,4)}
                          {dateTo ? ` — ${dateTo.slice(8)}/${dateTo.slice(5,7)}/${dateTo.slice(0,4)}` : " — Selecciona fecha fin"}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Desktop: side panel with 2 months */}
              <div className="hidden lg:flex absolute left-full top-0 ml-2 z-50 bg-white rounded-xl shadow-xl border border-neutral-200 p-4 gap-4" style={{ width: 560 }}>
                {[0, 1].map(offset => {
                  const y = calMonth[0] + Math.floor((calMonth[1] + offset) / 12);
                  const m = (calMonth[1] + offset) % 12;
                  const firstDay = new Date(y, m, 1).getDay();
                  const daysInMonth = new Date(y, m + 1, 0).getDate();
                  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
                  const cells: (number | null)[] = Array(firstDay).fill(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  const pad = (n: number) => String(n).padStart(2, "0");
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
                  return (
                    <div key={offset} className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        {offset === 0 ? (
                          <button onClick={() => setCalMonth(([yy,mm]) => mm === 0 ? [yy-1,11] : [yy,mm-1])} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        ) : <div className="w-6" />}
                        <span className="text-sm font-semibold text-neutral-800">{MONTHS[m]} {y}</span>
                        {offset === 1 ? (
                          <button onClick={() => setCalMonth(([yy,mm]) => mm === 11 ? [yy+1,0] : [yy,mm+1])} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : <div className="w-6" />}
                      </div>
                      <div className="grid grid-cols-7 text-center text-[11px] text-neutral-400 mb-1">
                        {["Do","Lu","Ma","Mi","Ju","Vi","Sa"].map(d => <div key={d} className="py-1">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 text-center text-sm">
                        {cells.map((day, i) => {
                          if (!day) return <div key={`e${i}`} />;
                          const ds = `${y}-${pad(m+1)}-${pad(day)}`;
                          const isToday = ds === todayStr;
                          const isFrom = ds === dateFrom;
                          const isTo = ds === dateTo;
                          const inRange = dateFrom && dateTo && ds > dateFrom && ds < dateTo;
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                if (!dateFrom || (dateFrom && dateTo)) {
                                  setDateRange(ds, null);
                                } else if (ds < dateFrom) {
                                  setDateRange(ds, dateFrom);
                                } else {
                                  setDateRange(dateFrom, ds);
                                  setDatePickerOpen(false);
                                }
                              }}
                              className={`py-1.5 rounded-lg transition-colors duration-150 ${
                                isFrom || isTo ? "bg-neutral-900 text-white font-medium" :
                                inRange ? "bg-neutral-100 text-neutral-800" :
                                isToday ? "bg-neutral-200 text-neutral-900 font-medium" :
                                "text-neutral-700 hover:bg-neutral-50"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-2.5 py-2 space-y-0.5 border-b border-white/10">
          <button className="w-full flex items-center gap-2.5 text-white/70 hover:text-white text-[14px] lg:text-[13px] px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors duration-300">
            <SearchLg className="w-4 h-4 flex-shrink-0" />
            <span>Buscar</span>
          </button>
        </div>
      )}

      {/* ── Menu ─────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 sidebar-scroll">
        {!collapsed && (
          <p className="text-white/25 text-[9px] px-2 mb-1.5 uppercase tracking-widest font-medium">
            Menú
          </p>
        )}
        <ul className="space-y-0.5">
          {roleMenu.map(item => {
            const Icon = item.icon;
            const isOpen   = openMenus.includes(item.label);
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.label}>
                {item.hasChildren ? (
                  <div className={`rounded-lg transition-colors duration-200 ${isOpen && !collapsed ? "bg-white/[0.04] pb-1.5" : ""}`}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] lg:text-[13px] transition-colors duration-300
                        ${isActive ? "text-white" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="bg-primary-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full leading-none">
                              {item.badge}
                            </span>
                          )}
                          {isOpen
                            ? <ChevronUp className="w-3 h-3 text-white/30" />
                            : <ChevronRight className="w-3 h-3 text-white/30" />}
                        </>
                      )}
                    </button>

                    {isOpen && !collapsed && item.children && (
                      <ul className="space-y-0.5 pl-4 pr-1">
                        {item.children.map(child => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className={`block px-3 py-1.5 rounded-lg text-[14px] lg:text-[13px] font-medium transition-colors duration-200 ${
                                pathname === child.href
                                  ? "text-white bg-white/10"
                                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] lg:text-[13px] transition-colors duration-300 ${
                      pathname === item.href
                        ? "text-white bg-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-2 py-2 space-y-0.5">
        <Link
          href="/configuracion"
          onClick={onClose}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] lg:text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-300"
        >
          <Settings01 className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Link>

        <div ref={roleRef} className="relative">
          <button
            onClick={() => collapsed ? setCollapsed(false) : setRoleOpen(o => !o)}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors duration-300 ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              F
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-xs font-medium truncate">Fernando Roblero</p>
                  <p className="text-white/40 text-[10px] truncate">{currentRole}</p>
                </div>
                <ChevronSelectorVertical className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              </>
            )}
          </button>

          {roleOpen && !collapsed && (
            <div className="absolute left-0 right-0 bottom-full mb-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1">
              <p className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-wider font-medium">Cambiar rol</p>
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 ${
                    currentRole === role
                      ? "text-white bg-white/10 font-medium"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
