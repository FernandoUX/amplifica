"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { IconMenu2, IconHelpCircle } from "@tabler/icons-react";
import AmplificaLogo from "@/components/layout/AmplificaLogo";

export default function RecepcionesLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* ── Loading skeleton while hydrating ───────────────────────────── */
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1D1D1F" }}>
        <main className="flex-1 overflow-y-auto bg-white mt-14 lg:mt-2 lg:mr-2 lg:mb-2 lg:rounded-2xl">
          <div className="animate-pulse p-6 space-y-4">
            <div className="h-8 w-56 bg-neutral-100 rounded-lg" />
            <div className="h-10 w-full bg-neutral-100 rounded-lg" />
            <div className="space-y-3 mt-6">
              <div className="h-28 w-full bg-neutral-50 rounded-xl" />
              <div className="h-28 w-full bg-neutral-50 rounded-xl" />
              <div className="h-28 w-full bg-neutral-50 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1D1D1F" }}>
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-center px-4 z-40 lg:hidden" style={{ backgroundColor: "#1D1D1F" }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-4 text-white/70 hover:text-white p-1.5 -ml-1.5 rounded-lg transition-colors"
        >
          <IconMenu2 className="w-5 h-5" />
        </button>
        <AmplificaLogo />
        <button className="absolute right-4 text-white/70 hover:text-white p-1.5 -mr-1.5 rounded-lg transition-colors">
          <IconHelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* ── Sidebar overlay backdrop (mobile) ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:w-auto lg:transform-none
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-white mt-14 lg:mt-2 lg:mr-2 lg:mb-2 lg:rounded-2xl">
        {children}
      </main>
    </div>
  );
}
