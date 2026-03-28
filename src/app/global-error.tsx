"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error 500]", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "32rem", width: "100%", textAlign: "center" }}>
            {/* Error code */}
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#5046E5",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              Error 500
            </p>

            {/* Title */}
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#171717",
                lineHeight: 1.2,
                marginBottom: "1rem",
              }}
            >
              ¡Ups! Algo salió mal de nuestro lado
            </h1>

            {/* Description */}
            <p style={{ color: "#737373", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "0.5rem" }}>
              Parece que nuestros servidores están teniendo problemas técnicos. No es culpa tuya, ya estamos trabajando para solucionarlo.
            </p>
            <p style={{ color: "#737373", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              Por favor, intenta recargar la página en unos minutos.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#404040",
                  backgroundColor: "#f5f5f5",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                Volver
              </button>
              <a
                href="/"
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#ffffff",
                  backgroundColor: "#5046E5",
                  border: "none",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Ir al Inicio
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
