"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download01, Printer } from "@untitled-ui/icons-react";
import {
  ensureQrSeeded, getActiveTokenForOR, getTokensForOR,
  type QrToken, type QrEstado,
} from "@/lib/qr-helpers";
import BulkLabelsModal from "./BulkLabelsModal";

type Props = {
  orId: string;
  seller: string;
  sucursal: string;
  fechaAgendada: string;
  skus: number;
  uTotales: string;
  bultos?: number;
};

const ESTADO_BADGE: Record<QrEstado, { label: string; className: string }> = {
  activo:     { label: "Activo",     className: "bg-green-50 text-green-700 border-green-200" },
  escaneado:  { label: "Escaneado",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  invalidado: { label: "Invalidado", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

export default function QrDisplaySection({ orId, seller, sucursal, fechaAgendada, skus, uTotales, bultos }: Props) {
  const [token, setToken] = useState<QrToken | null>(null);
  const [downloadToast, setDownloadToast] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    ensureQrSeeded();
    // Get the most relevant token: active first, otherwise newest
    const active = getActiveTokenForOR(orId);
    if (active) { setToken(active); return; }
    const all = getTokensForOR(orId);
    if (all.length > 0) setToken(all[all.length - 1]);
  }, [orId]);

  if (!token) return null;

  const badge = ESTADO_BADGE[token.estado];

  const handleDownload = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  return (
    <>
      <div className="border border-neutral-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-5">
          {/* QR code */}
          <div className="flex-shrink-0 bg-white border border-neutral-200 rounded-lg p-2">
            <QRCodeSVG
              value={token.qr_token}
              size={120}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-neutral-900">Código QR de recepción</h3>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${badge.className}`}>
                {badge.label}
              </span>
              {token.version > 1 && (
                <span className="text-xs text-neutral-400">v{token.version}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <span className="text-neutral-500">Orden</span>
                <p className="font-medium text-neutral-800">{orId}</p>
              </div>
              <div>
                <span className="text-neutral-500">Seller</span>
                <p className="font-medium text-neutral-800">{seller}</p>
              </div>
              <div>
                <span className="text-neutral-500">Sucursal</span>
                <p className="font-medium text-neutral-800">{sucursal}</p>
              </div>
              <div>
                <span className="text-neutral-500">Fecha agendada</span>
                <p className="font-medium text-neutral-800">{fechaAgendada}</p>
              </div>
              <div>
                <span className="text-neutral-500">SKUs</span>
                <p className="font-medium text-neutral-800">{skus}</p>
              </div>
              <div>
                <span className="text-neutral-500">Unidades</span>
                <p className="font-medium text-neutral-800">{uTotales}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {downloadToast ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    QR descargado
                  </>
                ) : (
                  <>
                    <Download01 className="w-3.5 h-3.5" />
                    Descargar QR
                  </>
                )}
              </button>
              <button
                onClick={() => setShowLabels(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Generar etiquetas para bultos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Labels Modal */}
      <BulkLabelsModal
        open={showLabels}
        onClose={() => setShowLabels(false)}
        orId={orId}
        seller={seller}
        sucursal={sucursal}
        defaultBultos={bultos ?? 1}
      />
    </>
  );
}
