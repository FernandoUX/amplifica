"use client";

import { FileText, FileCheck2, FileBadge, File, Upload, Eye, Download } from "lucide-react";
import type { Documento } from "@/app/pedidos/_data";

const TIPO_ICONS: Record<Documento["tipo"], { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  factura: { icon: FileText, label: "Factura" },
  guia_despacho: { icon: FileCheck2, label: "Guía de despacho" },
  certificado: { icon: FileBadge, label: "Certificado" },
  otro: { icon: File, label: "Otro" },
};

function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

type DocumentsTableProps = {
  documentos: Documento[];
  onUpload?: () => void;
};

export default function DocumentsTable({ documentos, onUpload }: DocumentsTableProps) {
  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {onUpload && (
        <button
          onClick={onUpload}
          className="w-full border-2 border-dashed border-neutral-300 hover:border-primary-400 rounded-xl px-6 py-8 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-100 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
            <Upload className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
          </div>
          <p className="text-sm font-medium text-neutral-600 group-hover:text-primary-600 transition-colors">
            Arrastra un archivo o haz clic para subir
          </p>
          <p className="text-xs text-neutral-400">PDF, PNG, JPG hasta 10 MB</p>
        </button>
      )}

      {/* Table */}
      {documentos.length > 0 ? (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fecha</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-[100px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => {
                const tipoInfo = TIPO_ICONS[doc.tipo] ?? TIPO_ICONS.otro;
                const Icon = tipoInfo.icon;
                return (
                  <tr key={doc.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs font-medium text-neutral-600">{tipoInfo.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{doc.nombre}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(doc.fecha)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => alert("Ver documento (mock)")}
                          className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => alert("Descargar documento (mock)")}
                          className="p-2 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                          title="Descargar"
                        >
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
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">No hay documentos adjuntos</p>
          {onUpload && (
            <button
              onClick={onUpload}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Subir documento
            </button>
          )}
        </div>
      )}
    </div>
  );
}
