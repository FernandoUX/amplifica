"use client";

import { useState } from "react";
import { Camera, Upload, ChevronLeft, ChevronRight, X } from "lucide-react";

type PhotoGalleryProps = {
  photos: string[];
  onUpload?: () => void;
  emptyMessage?: string;
};

export default function PhotoGallery({
  photos,
  onUpload,
  emptyMessage = "No hay registros fotográficos",
}: PhotoGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
          <Camera className="w-5 h-5 text-neutral-400" />
        </div>
        <p className="text-sm text-neutral-500">{emptyMessage}</p>
        {onUpload && (
          <button
            onClick={onUpload}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Subir foto
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-300 transition-colors group"
          >
            <img
              src={url}
              alt={`POD ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}

        {/* Upload zone */}
        {onUpload && (
          <button
            onClick={onUpload}
            className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 hover:border-primary-400 flex flex-col items-center justify-center gap-1.5 transition-colors group"
          >
            <Upload className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
            <span className="text-[10px] font-medium text-neutral-400 group-hover:text-primary-500 transition-colors">
              Agregar
            </span>
          </button>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium">
            {lightboxIdx + 1} de {photos.length}
          </div>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIdx]}
            alt={`POD ${lightboxIdx + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxIdx < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
