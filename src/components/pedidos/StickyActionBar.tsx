"use client";

import Button from "@/components/ui/Button";
import { AlertCircle, RefreshCw } from "lucide-react";

type StickyActionBarProps = {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  message?: string;
  /** When true, primary CTA becomes "Recotizar" instead of "Guardar" */
  requiresRequote?: boolean;
  onRequote?: () => void;
};

/** Inline banner — render inside the content flow (above cards) */
export function DirtyBanner({
  visible,
  message = "Tienes cambios sin guardar",
}: Pick<StickyActionBarProps, "visible" | "message">) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 bg-amber-50 border-l-4 border-l-amber-400 rounded-lg px-4 py-2.5">
      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-sm text-amber-700">{message}</span>
    </div>
  );
}

/** Sticky bottom bar with action buttons */
export default function StickyActionBar({
  visible,
  onSave,
  onDiscard,
  saving = false,
  requiresRequote = false,
  onRequote,
}: StickyActionBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-neutral-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onDiscard}>
            Descartar
          </Button>
          {requiresRequote && onRequote ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onRequote}
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Recotizar
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onSave} loading={saving} loadingText="Guardando...">
              Guardar cambios
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
