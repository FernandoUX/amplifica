"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  ShoppingBag,
  RefreshCw,
  Package,
  Warehouse,
  Layers,
  Combine,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { type Role, can } from "@/lib/roles";

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
  { label: "Dashboard",        icon: ChartLine,   href: "/dashboard" },
  {
    label: "Pedidos", icon: ShoppingBag, href: "/pedidos",
    hasChildren: true,
    children: [
      { label: "Lista de pedidos", href: "/pedidos" },
    ],
  },
  { label: "Devoluciones",     icon: RefreshCw,    href: "/devoluciones", hasChildren: true },
  { label: "Inventario",       icon: Package,      href: "/inventario",   hasChildren: true },
  {
    label: "Recepciones", icon: Warehouse, href: "/recepciones",
    hasChildren: true, badge: "BETA",
    children: [
      { label: "Órdenes de recepción", href: "/recepciones" },
      { label: "Cuarentena",            href: "/recepciones/cuarentena" },
      { label: "Configuración",         href: "/recepciones/configuracion" },
    ],
  },
  { label: "Productos",         icon: Layers,  href: "/productos",  hasChildren: true },
  { label: "Conjunto de reglas", icon: Combine, href: "/reglas",     hasChildren: true },
];

type SidebarNavProps = {
  collapsed: boolean;
  onNavigate?: () => void;
  currentRole: Role;
};

export default function SidebarNav({ collapsed, onNavigate, currentRole }: SidebarNavProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    // Auto-open menu that contains the current path
    const initial: string[] = [];
    for (const item of MENU) {
      if (item.hasChildren && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
        initial.push(item.label);
      }
    }
    if (initial.length === 0) initial.push("Recepciones");
    return initial;
  });

  const toggleMenu = (label: string) =>
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );

  // Filter children by role
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

  return (
    <nav className={`flex-1 overflow-y-auto py-2 sidebar-scroll ${collapsed ? "px-1.5" : "px-2"}`}>
      {!collapsed && (
        <p className="text-white/25 text-[9px] px-2 mb-1.5 uppercase tracking-widest font-medium">
          Menú
        </p>
      )}
      <ul className="space-y-0.5">
        {roleMenu.map(item => {
          const Icon = item.icon;
          const isOpen = openMenus.includes(item.label);
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <li key={item.label}>
              {item.hasChildren ? (
                <div className={`rounded-lg transition-colors duration-200 ${isOpen && !collapsed ? "bg-white/[0.04] pb-1.5" : ""}`}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[length:var(--sidebar-font-mobile)] lg:text-[length:var(--sidebar-font)] transition-colors duration-300
                      ${collapsed ? "justify-center" : ""}
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
                            onClick={onNavigate}
                            className={`block px-3 py-1.5 rounded-lg text-[length:var(--sidebar-font-mobile)] lg:text-[length:var(--sidebar-font)] font-medium transition-colors duration-200 ${
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
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[length:var(--sidebar-font-mobile)] lg:text-[length:var(--sidebar-font)] transition-colors duration-300 ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
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
  );
}
