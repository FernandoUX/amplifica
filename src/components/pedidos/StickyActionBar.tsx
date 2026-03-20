"use client";

import Button from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

type StickyActionBarProps = {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  message?: string;
};

export default function StickyActionBar({
  visible,
  onSave,
  onDiscard,
  saving = false,
  message = "Tienes cambios sin guardar",
}: StickyActionBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 lg:left-60 z-40 transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-neutral-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onDiscard}>
              Descartar
            </Button>
            <Button variant="primary" size="sm" onClick={onSave} loading={saving} loadingText="Guardando...">
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
