"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Settings, ChevronsUpDown } from "lucide-react";
import { type Role } from "@/lib/roles";

const ROLES: Role[] = ["Super Admin", "Operador", "Seller", "KAM"];

type SidebarUserProps = {
  collapsed: boolean;
  onNavigate?: () => void;
  currentRole: Role;
  onRoleChange: (role: Role) => void;
};

export default function SidebarUser({ collapsed, onNavigate, currentRole, onRoleChange }: SidebarUserProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const switchRole = (role: Role) => {
    onRoleChange(role);
    setRoleOpen(false);
  };

  return (
    <div className={`border-t border-white/10 py-2 space-y-0.5 ${collapsed ? "px-1.5" : "px-2"}`}>
      <Link
        href="/configuracion"
        onClick={onNavigate}
        title={collapsed ? "Configuración" : undefined}
        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[length:var(--sidebar-font-mobile)] lg:text-[length:var(--sidebar-font)] text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-300 ${collapsed ? "justify-center" : ""}`}
      >
        <Settings className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>Configuración</span>}
      </Link>

      <div ref={roleRef} className="relative">
        <button
          onClick={() => collapsed ? undefined : setRoleOpen(o => !o)}
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
              <ChevronsUpDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
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
  );
}
