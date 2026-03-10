// Calendar-relevant OR seed data shared between recepciones page and configuracion calendar

// ─── Quarantine types ─────────────────────────────────────────────────────────
export type QuarantineStatus     = "pendiente" | "en_gestion" | "resuelto";
export type QuarantineResolution = "stock_disponible" | "merma" | "devolucion" | null;
export type QuarantineCategory   = "interna" | "devolucion_seller" | "decision_seller";

export type QuarantineRecord = {
  id: string;
  orId: string;
  seller: string;
  sucursal: string;
  sku: string;
  skuId: string;
  productName: string;
  cantidad: number;
  tag: string;
  categoria: QuarantineCategory;
  estado: QuarantineStatus;
  resolucion: QuarantineResolution;
  decisionSeller?: string;
  notas?: string;
  creadoEn: string;
  resueltoen?: string;
  stockCantidad?: number;
  mermaCantidad?: number;
};

export const QR_STORAGE_KEY = "amplifica_quarantine";

export const SEED_QUARANTINE: QuarantineRecord[] = [
  {
    id: "QR-186-p1", orId: "RO-BARRA-186", seller: "Extra Life", sucursal: "Quilicura",
    sku: "300034", skuId: "p1", productName: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight",
    cantidad: 15, tag: "danio-parcial", categoria: "decision_seller",
    estado: "en_gestion", resolucion: null, creadoEn: "2026-02-15T08:30:00",
  },
  {
    id: "QR-186-p2", orId: "RO-BARRA-186", seller: "Extra Life", sucursal: "Quilicura",
    sku: "300052", skuId: "p2", productName: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",
    cantidad: 8, tag: "sin-codigo-barra", categoria: "interna",
    estado: "pendiente", resolucion: null, creadoEn: "2026-02-15T08:30:00",
  },
  {
    id: "QR-189-p1", orId: "RO-BARRA-189", seller: "Le Vice", sucursal: "Santiago Centro",
    sku: "LV-001", skuId: "p1", productName: "Le Vice Nitro Powder 200g Pre-Workout",
    cantidad: 20, tag: "sin-nutricional", categoria: "devolucion_seller",
    estado: "resuelto", resolucion: "devolucion",
    creadoEn: "2026-02-13T15:45:00", resueltoen: "2026-02-18T10:20:00",
  },
  {
    id: "QR-187-p1", orId: "RO-BARRA-187", seller: "Le Vice", sucursal: "La Reina",
    sku: "LV-002", skuId: "p1", productName: "Le Vice Omega-3 120 cápsulas",
    cantidad: 30, tag: "danio-total", categoria: "decision_seller",
    estado: "pendiente", resolucion: null, creadoEn: "2026-02-14T13:15:00",
  },
  {
    id: "QR-187-p2", orId: "RO-BARRA-187", seller: "Le Vice", sucursal: "La Reina",
    sku: "LV-003", skuId: "p2", productName: "Le Vice Colágeno Marino 300g",
    cantidad: 12, tag: "sin-vencimiento", categoria: "devolucion_seller",
    estado: "en_gestion", resolucion: null, creadoEn: "2026-02-14T13:15:00",
  },
];

export type CalOrEntry = {
  id: string;
  fechaAgendada: string;
  sucursal: string;
  seller: string;
  estado: string;
};

export const ORDENES_SEED: CalOrEntry[] = [
  { id: "RO-BARRA-183", fechaAgendada: "20/02/2026 16:30", sucursal: "Quilicura",       seller: "Extra Life", estado: "Programado" },
  { id: "RO-BARRA-182", fechaAgendada: "20/02/2026 16:30", sucursal: "La Reina",        seller: "Extra Life", estado: "Programado" },
  { id: "RO-BARRA-190", fechaAgendada: "21/02/2026 09:00", sucursal: "Lo Barnechea",    seller: "Le Vice",    estado: "Programado" },
  { id: "RO-BARRA-194", fechaAgendada: "11/03/2026 10:00", sucursal: "Quilicura",       seller: "VitaFit",    estado: "Programado" },
  { id: "RO-BARRA-195", fechaAgendada: "12/03/2026 14:30", sucursal: "La Reina",        seller: "NutriPro",   estado: "Programado" },
  { id: "RO-BARRA-180", fechaAgendada: "20/02/2026 16:30", sucursal: "Santiago Centro",  seller: "Le Vice",    estado: "Recepcionado en bodega" },
  { id: "RO-BARRA-196", fechaAgendada: "09/03/2026 09:00", sucursal: "Lo Barnechea",    seller: "BioNature",  estado: "Recepcionado en bodega" },
  { id: "RO-BARRA-197", fechaAgendada: "08/03/2026 11:00", sucursal: "Providencia",     seller: "Extra Life", estado: "Recepcionado en bodega" },
  { id: "RO-BARRA-184", fechaAgendada: "19/02/2026 10:00", sucursal: "Quilicura",       seller: "Extra Life", estado: "En proceso de conteo" },
  { id: "RO-BARRA-179", fechaAgendada: "18/02/2026 09:00", sucursal: "La Reina",        seller: "Gohard",     estado: "En proceso de conteo" },
  { id: "RO-BARRA-185", fechaAgendada: "17/02/2026 14:00", sucursal: "Lo Barnechea",    seller: "Gohard",     estado: "En proceso de conteo" },
  { id: "RO-BARRA-198", fechaAgendada: "07/03/2026 08:30", sucursal: "Santiago Centro",  seller: "VitaFit",    estado: "En proceso de conteo" },
  { id: "RO-BARRA-187", fechaAgendada: "14/02/2026 13:00", sucursal: "La Reina",        seller: "Le Vice",    estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-199", fechaAgendada: "06/03/2026 10:00", sucursal: "Las Condes",      seller: "NutriPro",   estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-186", fechaAgendada: "15/02/2026 08:00", sucursal: "Quilicura",       seller: "Extra Life", estado: "Completado con diferencias" },
  { id: "RO-BARRA-201", fechaAgendada: "01/03/2026 09:00", sucursal: "La Reina",        seller: "VitaFit",    estado: "Completado con diferencias" },
  { id: "RO-BARRA-189", fechaAgendada: "13/02/2026 15:30", sucursal: "Santiago Centro",  seller: "Le Vice",    estado: "Completado sin diferencias" },
  { id: "RO-BARRA-200", fechaAgendada: "04/03/2026 15:00", sucursal: "Quilicura",       seller: "BioNature",  estado: "Completado sin diferencias" },
];
