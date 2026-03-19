"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, X } from "lucide-react";
import AmplificaLogo from "./AmplificaLogo";
import SidebarFilters from "./SidebarFilters";
import SidebarNav from "./SidebarNav";
import SidebarUser from "./SidebarUser";
import { type Role } from "@/lib/roles";

type SidebarProps = {
  onClose?: () => void;
};

export default function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // ── Role state (shared between filters & user) ────────────────────────────
  const ROLES: Role[] = ["Super Admin", "Operador", "Seller", "KAM"];
  const [currentRole, setCurrentRole] = useState<Role>("Super Admin");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("amplifica_user_role");
      if (saved && ROLES.includes(saved as Role)) setCurrentRole(saved as Role);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    localStorage.setItem("amplifica_user_role", role);
    window.dispatchEvent(new Event("amplifica-role-change"));
  };

  return (
    <aside
      className={`${collapsed ? "lg:w-14" : "lg:w-60"} w-full text-white flex flex-col flex-shrink-0 transition-all duration-200 h-full`}
      style={{ backgroundColor: "#1D1D1F" }}
    >
      {/* ── Logo + collapse ──────────────────────────────────────────────── */}
      <div className={`px-3 py-3.5 border-b border-white/10 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"}`}>
        <div className="hidden lg:block">
          {!collapsed && <AmplificaLogo />}
          {collapsed && <AmplificaLogo collapsed />}
        </div>
        {/* Mobile close */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded flex-shrink-0 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`text-white/40 hover:text-white p-1 rounded flex-shrink-0 hidden lg:flex ${collapsed ? "" : "ml-auto"}`}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Filters (hidden when collapsed) ──────────────────────────────── */}
      {!collapsed && <SidebarFilters currentRole={currentRole} />}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <SidebarNav collapsed={collapsed} onNavigate={onClose} currentRole={currentRole} />

      {/* ── User + settings ──────────────────────────────────────────────── */}
      <SidebarUser
        collapsed={collapsed}
        onNavigate={onClose}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />
    </aside>
  );
}
