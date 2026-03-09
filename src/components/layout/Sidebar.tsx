"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "@untitled-ui/icons-react";
import AmplificaLogo from "./AmplificaLogo";

type Child = { label: string; href: string };
type MenuItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  hasChildren?: boolean;
  badge?: string;
  children?: Child[];
};

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

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed]   = useState(false);
  const [openMenus, setOpenMenus]   = useState<string[]>(["Recepciones"]);

  const toggleMenu = (label: string) =>
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );

  return (
    <aside
      className={`${collapsed ? "w-14" : "w-52"} bg-[#111111] text-white flex flex-col flex-shrink-0 transition-all duration-200`}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-3.5 border-b border-white/10">
        {!collapsed && <AmplificaLogo />}
        {collapsed && <AmplificaLogo collapsed />}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-white/40 hover:text-white p-1 rounded ml-auto flex-shrink-0"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Store selectors ───────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-2.5 pt-2.5 pb-2 space-y-1.5 border-b border-white/10">
          <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs transition-colors">
            <div className="text-left">
              <p className="text-white/40 text-[10px] leading-none mb-0.5">Sucursal</p>
              <p className="text-white font-medium">Quilicura</p>
            </div>
            <ChevronSelectorVertical className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          </button>
          <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs transition-colors">
            <div className="text-left">
              <p className="text-white/40 text-[10px] leading-none mb-0.5">Tienda</p>
              <p className="text-white font-medium">Extra Life</p>
            </div>
            <ChevronSelectorVertical className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-2.5 py-2 space-y-0.5 border-b border-white/10">
          <button className="w-full flex items-center gap-2.5 text-white/70 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <SearchLg className="w-4 h-4 flex-shrink-0" />
            <span>Buscar</span>
          </button>
          <button className="w-full flex items-center gap-2.5 text-white/70 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Filtrar por fecha</span>
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
          {MENU.map(item => {
            const Icon = item.icon;
            const isOpen   = openMenus.includes(item.label);
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.label}>
                {item.hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors
                        ${isActive ? "text-white bg-white/8" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="bg-indigo-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full leading-none">
                              {item.badge}
                            </span>
                          )}
                          {isOpen
                            ? <ChevronDown className="w-3 h-3 text-white/30" />
                            : <ChevronRight className="w-3 h-3 text-white/30" />}
                        </>
                      )}
                    </button>

                    {isOpen && !collapsed && item.children && (
                      <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                        {item.children.map(child => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`block px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                pathname === child.href
                                  ? "text-white bg-white/10 font-medium"
                                  : "text-white/50 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors ${
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
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings01 className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              F
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">Fernando Roblero</p>
              <p className="text-white/40 text-[10px] truncate">Super Admin</p>
            </div>
            <button className="text-white/30 hover:text-white/60 flex-shrink-0">
              <LogOut01 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
