"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconAlertTriangle } from "@tabler/icons-react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Error 500]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
          <IconAlertTriangle className="w-8 h-8 text-primary-500" />
        </div>

        {/* Error code */}
        <p className="text-sm font-bold text-primary-500 tracking-wide mb-3">
          Error 500
        </p>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight mb-4">
          ¡Ups! Algo salió mal de nuestro lado
        </h1>

        {/* Description */}
        <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-2">
          Parece que nuestros servidores están teniendo problemas técnicos. No es culpa tuya, ya estamos trabajando para solucionarlo.
        </p>
        <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-8">
          Por favor, intenta recargar la página en unos minutos.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.back()}
          >
            Volver
          </Button>
          <Button
            variant="primary"
            size="lg"
            href="/"
          >
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
