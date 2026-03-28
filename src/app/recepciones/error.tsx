"use client";

import { useEffect } from "react";

/**
 * Error boundary for /recepciones.
 * If a runtime error occurs (e.g. stale cached JS after a deploy),
 * automatically reload the page once to fetch fresh assets.
 * Shows a manual reload button as fallback.
 */
export default function RecepcionesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload once to fetch fresh JS bundles
    const key = "amplifica_error_reload";
    const lastReload = sessionStorage.getItem(key);
    const now = Date.now();

    // Only auto-reload if we haven't done so in the last 10 seconds
    if (!lastReload || now - Number(lastReload) > 10_000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
      return;
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-2">
        Algo salió mal
      </h2>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">
        Puede ser un problema temporal. Intenta recargar la página.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        Recargar página
      </button>
    </div>
  );
}
