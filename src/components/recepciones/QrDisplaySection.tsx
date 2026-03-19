"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer } from "lucide-react";
import {
  ensureQrSeeded, getActiveTokenForOR, getTokensForOR,
  type QrToken, type QrEstado,
} from "@/lib/qr-helpers";
import Button from "@/components/ui/Button";
import BulkLabelsModal from "./BulkLabelsModal";

type Props = {
  orId: string;
  seller: string;
  sucursal: string;
  bultos?: number;
};

const ESTADO_BADGE: Record<QrEstado, { label: string; className: string }> = {
  activo:     { label: "Activo",     className: "bg-green-50 text-green-700 border-green-200" },
  escaneado:  { label: "Escaneado",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  invalidado: { label: "Invalidado", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

export default function QrDisplaySection({ orId, seller, sucursal, bultos }: Props) {
  const [token, setToken] = useState<QrToken | null>(null);
  const [downloadToast, setDownloadToast] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    ensureQrSeeded();
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
      <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
        {/* QR code */}
        <div className="bg-white border border-neutral-200 rounded-lg p-2">
          <QRCodeSVG
            value={token.qr_token}
            size={100}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* QR estado badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-neutral-500">QR</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${badge.className}`}>
            {badge.label}
          </span>
          {token.version > 1 && (
            <span className="text-[10px] text-neutral-400">v{token.version}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-row lg:flex-col gap-1.5 w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="flex-1 lg:w-full justify-center"
            iconLeft={
              downloadToast
                ? <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <Download className="w-3.5 h-3.5" />
            }
          >
            {downloadToast ? "Descargado" : "Descargar QR"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLabels(true)}
            className="flex-1 lg:w-full justify-center"
            iconLeft={<Printer className="w-3.5 h-3.5" />}
          >
            Etiquetas bultos
          </Button>
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
