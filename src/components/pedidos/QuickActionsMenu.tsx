"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

type QuickAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
};

type QuickActionsMenuProps = {
  actions: QuickAction[];
  trigger?: React.ReactNode;
};

export default function QuickActionsMenu({ actions, trigger }: QuickActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
      >
        {trigger || <MoreVertical className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-white rounded-xl shadow-lg ring-1 ring-neutral-200/60 py-1.5 animate-in fade-in-0 zoom-in-95">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => { action.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors
                  ${action.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-neutral-700 hover:bg-neutral-50"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
