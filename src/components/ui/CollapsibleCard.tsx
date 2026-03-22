"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "./card";

type CollapsibleCardProps = {
  title: React.ReactNode;
  /** Extra element next to the chevron (e.g. badge) */
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function CollapsibleCard({
  title,
  action,
  defaultOpen = true,
  children,
  className,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card size="sm" className={className}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-between w-full px-4 group-data-[size=sm]/card:px-3 cursor-pointer select-none"
      >
        <span className="text-sm font-medium text-card-foreground">{title}</span>
        <span className="flex items-center gap-2">
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
          <CardContent>{children}</CardContent>
        </div>
      </div>
    </Card>
  );
}
