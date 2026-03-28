"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "./card";

type CollapsibleCardProps = {
  title: React.ReactNode;
  /** Brief description below the title (e.g. "Completa los datos del cliente") */
  description?: string;
  /** Icon shown in a rounded container before the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Extra element next to the chevron (e.g. badge) */
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function CollapsibleCard({
  title,
  description,
  icon: Icon,
  action,
  defaultOpen = true,
  children,
  className,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card size="sm" className={`!gap-0 !py-4 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-3 w-full px-4 py-0.5 cursor-pointer select-none"
      >
        {/* Optional icon */}
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-neutral-500" />
          </div>
        )}

        {/* Title + description */}
        <div className="flex flex-col items-start text-left min-w-0 flex-1">
          <span className="text-sm font-medium text-card-foreground">{title}</span>
          {description && (
            <span className="text-xs text-neutral-500 mt-0.5">{description}</span>
          )}
        </div>

        {/* Action + chevron */}
        <span className="flex items-center gap-2 flex-shrink-0">
          {action}
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-neutral-100 mt-3 mx-4" />
          <div className="pt-3">
            <CardContent className="!px-4">{children}</CardContent>
          </div>
        </div>
      </div>
    </Card>
  );
}
