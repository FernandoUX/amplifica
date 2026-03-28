"use client";

import { FileText, FileCheck2, Tag, QrCode, Receipt, File, Upload, Eye, Download, Clock } from "lucide-react";
import type { DocumentoB2B } from "@/app/pedidos-b2b/_data";

const TIPO_CONFIG: Record<DocumentoB2B["tipo"], { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  factura: { icon: Receipt, label: "Factura" },
  guia_despacho: { icon: FileCheck2, label: "Guía de despacho" },
  etiqueta_producto: { icon: Tag, label: "Etiqueta producto" },
  etiqueta_bulto: { icon: Tag, label: "Etiqueta bulto" },
  etiqueta_kit: { icon: Tag, label: "Etiqueta kit" },
  qr_colecta_ml: { icon: QrCode, label: "QR Colecta ML" },
  orden_compra: { icon: FileText, label: "Orden de compra" },
  otro: { icon: File, label: "Otro" },
};

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

type DocumentRepositoryProps = {
  documentos: DocumentoB2B[];
  onUpload?: () => void;
  readOnly?: boolean;
};

export default function DocumentRepository({ documentos, onUpload, readOnly }: DocumentRepositoryProps) {
  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {onUpload && !readOnly && (
        <button
          onClick={onUpload}
          className="w-full border-2 border-dashed border-neutral-300 hover:border-primary-400 rounded-xl px-6 py-6 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-neutral-100 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
            <Upload className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
          </div>
          <p className="text-sm font-medium text-neutral-600 group-hover:text-primary-600 transition-colors">
            Subir documento
          </p>
          <p className="text-xs text-neutral-400">PDF, PNG, JPG, XLSX hasta 10 MB</p>
        </button>
      )}

      {/* Documents table */}
      {documentos.length > 0 ? (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Autor</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Fecha</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">V.</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-[80px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => {
                const tipoInfo = TIPO_CONFIG[doc.tipo] ?? TIPO_CONFIG.otro;
                const Icon = tipoInfo.icon;
                return (
                  <tr key={doc.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-xs font-medium text-neutral-600">{tipoInfo.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-neutral-900">{doc.nombre}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-500">{doc.autor}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-500">{fmtDate(doc.fecha)}</td>
                    <td className="px-4 py-2.5 text-center text-xs text-neutral-400">v{doc.version}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => alert("Ver documento (mock)")} className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors" title="Ver">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => alert("Descargar (mock)")} className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors" title="Descargar">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">No hay documentos adjuntos</p>
        </div>
      )}
    </div>
  );
}
