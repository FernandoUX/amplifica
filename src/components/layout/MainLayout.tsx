"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Menu, HelpCircle } from "lucide-react";
import AmplificaLogo from "@/components/layout/AmplificaLogo";

type MainLayoutProps = {
  children: React.ReactNode;
  /** Extra classes for <main>, e.g. "bg-neutral-50" or "scroll-smooth" */
  mainClassName?: string;
};

export default function MainLayout({ children, mainClassName }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const mainCls = `flex-1 overflow-y-auto mt-14 lg:mt-2 lg:mr-2 lg:mb-2 lg:rounded-2xl ${mainClassName ?? "bg-white"}`;

  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1D1D1F" }}>
        <main className={mainCls}>
          <div className="animate-pulse p-6 space-y-4">
            <div className="h-8 w-56 bg-neutral-100 rounded-lg" />
            <div className="h-10 w-full bg-neutral-100 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1D1D1F" }}>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-center px-4 z-40 lg:hidden" style={{ backgroundColor: "#1D1D1F" }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-4 text-white/70 hover:text-white p-1.5 -ml-1.5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <AmplificaLogo />
        <button className="absolute right-4 text-white/70 hover:text-white p-1.5 -mr-1.5 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar overlay backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0 lg:w-auto lg:transform-none`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className={mainCls}>
        {children}
      </main>
    </div>
  );
}
