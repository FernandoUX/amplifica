"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

type AlertBannerVariant = "danger" | "warning" | "info";

type AlertBannerProps = {
  variant?: AlertBannerVariant;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
};

const borderColor: Record<AlertBannerVariant, string> = {
  danger:  "border-l-red-500",
  warning: "border-l-amber-500",
  info:    "border-l-primary-500",
};

const bgColor: Record<AlertBannerVariant, string> = {
  danger:  "bg-red-50",
  warning: "bg-amber-50",
  info:    "bg-primary-25",
};

const iconColor: Record<AlertBannerVariant, string> = {
  danger:  "text-red-500",
  warning: "text-amber-500",
  info:    "text-primary-500",
};

const titleColor: Record<AlertBannerVariant, string> = {
  danger:  "text-red-800",
  warning: "text-amber-800",
  info:    "text-primary-800",
};

export default function AlertBanner({
  variant = "warning",
  icon: IconComp,
  title,
  description,
  action,
  dismissible = true,
  onDismiss,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${borderColor[variant]} ${bgColor[variant]}`}
    >
      <IconComp className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor[variant]}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${titleColor[variant]}`}>{title}</p>
        {description && (
          <p className="text-xs text-neutral-600 mt-0.5">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="tertiary" size="sm" onClick={action.onClick} className="flex-shrink-0">
          {action.label}
        </Button>
      )}
      {dismissible && (
        <button
          onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
