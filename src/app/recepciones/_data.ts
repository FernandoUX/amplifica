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
  pallets?: number;
  bultos?: number;
  comentarios?: string;
  comentarioRecepcion?: string;
};

// ─── Shared OR product & session seed data ──────────────────────────────────
// Used by the [id] detail page and the list page for dynamic progreso/sesiones

type SeedProduct = { id: string; esperadas: number };
type SeedSesionItem = { pid: string; cantidad: number };
type SeedSesion = { id: string; items: SeedSesionItem[] };

/** Products per OR (total esperadas) */
export const OR_PRODUCTS: Record<string, SeedProduct[]> = {
  "RO-BARRA-180": [{ id: "p1", esperadas: 100 }, { id: "p2", esperadas: 150 }],
  "RO-BARRA-184": [{ id: "p1", esperadas: 100 }, { id: "p2", esperadas: 150 }],
  "RO-BARRA-179": [{ id: "p1", esperadas: 80 },  { id: "p2", esperadas: 60 }],
  "RO-BARRA-185": [{ id: "p1", esperadas: 60 },  { id: "p2", esperadas: 45 }],
  "RO-BARRA-186": [{ id: "p1", esperadas: 1200 }, { id: "p2", esperadas: 800 }, { id: "p3", esperadas: 550 }],
  "RO-BARRA-201": [{ id: "p1", esperadas: 600 },  { id: "p2", esperadas: 500 }, { id: "p3", esperadas: 440 }],
  "RO-BARRA-189": [{ id: "p1", esperadas: 400 },  { id: "p2", esperadas: 350 }],
  "RO-BARRA-200": [{ id: "p1", esperadas: 500 },  { id: "p2", esperadas: 300 }],
  "RO-BARRA-187": [{ id: "p1", esperadas: 1200 }, { id: "p2", esperadas: 850 }, { id: "p3", esperadas: 500 }],
  "RO-BARRA-199": [{ id: "p1", esperadas: 380 },  { id: "p2", esperadas: 400 }],
  "RO-BARRA-212": [{ id: "p1", esperadas: 640 },  { id: "p2", esperadas: 700 }],
  "RO-BARRA-198": [{ id: "p1", esperadas: 560 },  { id: "p2", esperadas: 560 }],
  "RO-BARRA-219": [{ id: "p1", esperadas: 1420 }, { id: "p2", esperadas: 1420 }],
  "RO-BARRA-220": [{ id: "p1", esperadas: 310 },  { id: "p2", esperadas: 300 }],
  "RO-BARRA-222": [{ id: "p1", esperadas: 1100 }, { id: "p2", esperadas: 1100 }],
  "RO-BARRA-223": [{ id: "p1", esperadas: 680 },  { id: "p2", esperadas: 680 }],
  "RO-BARRA-214": [{ id: "p1", esperadas: 445 },  { id: "p2", esperadas: 445 }],
  "RO-BARRA-215": [{ id: "p1", esperadas: 1050 }, { id: "p2", esperadas: 1050 }],
  "RO-BARRA-226": [{ id: "p1", esperadas: 390 },  { id: "p2", esperadas: 390 }],
  "RO-BARRA-227": [{ id: "p1", esperadas: 820 },  { id: "p2", esperadas: 820 }],
  "RO-BARRA-228": [{ id: "p1", esperadas: 1050 }, { id: "p2", esperadas: 1050 }],
  "RO-BARRA-229": [{ id: "p1", esperadas: 270 },  { id: "p2", esperadas: 270 }],
  "RO-BARRA-230": [{ id: "p1", esperadas: 600 },  { id: "p2", esperadas: 600 }],
};

/** Counting sessions per OR */
export const OR_SESIONES: Record<string, SeedSesion[]> = {
  "RO-BARRA-184": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 58 }, { pid: "p2", cantidad: 72 }] },
  ],
  "RO-BARRA-179": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 40 }, { pid: "p2", cantidad: 25 }] },
  ],
  "RO-BARRA-185": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 30 }, { pid: "p2", cantidad: 18 }] },
  ],
  "RO-BARRA-186": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 1180 }, { pid: "p2", cantidad: 780 }, { pid: "p3", cantidad: 550 }] },
  ],
  "RO-BARRA-201": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 564 }, { pid: "p2", cantidad: 500 }, { pid: "p3", cantidad: 440 }] },
  ],
  "RO-BARRA-189": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 400 }, { pid: "p2", cantidad: 350 }] },
  ],
  "RO-BARRA-200": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 500 }, { pid: "p2", cantidad: 300 }] },
  ],
  "RO-BARRA-187": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 1200 }, { pid: "p2", cantidad: 850 }, { pid: "p3", cantidad: 500 }] },
  ],
  "RO-BARRA-199": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 380 }, { pid: "p2", cantidad: 400 }] },
  ],
  "RO-BARRA-212": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 640 }, { pid: "p2", cantidad: 700 }] },
  ],
  "RO-BARRA-198": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 85 }] },
  ],
  "RO-BARRA-219": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 150 }, { pid: "p2", cantidad: 150 }] },
  ],
  "RO-BARRA-220": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 310 }, { pid: "p2", cantidad: 300 }] },
  ],
  "RO-BARRA-222": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 550 }, { pid: "p2", cantidad: 550 }] },
    { id: "SES-002", items: [{ pid: "p1", cantidad: 550 }, { pid: "p2", cantidad: 550 }] },
  ],
  "RO-BARRA-223": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 680 }, { pid: "p2", cantidad: 680 }] },
  ],
  "RO-BARRA-214": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 445 }, { pid: "p2", cantidad: 445 }] },
  ],
  "RO-BARRA-215": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 1050 }, { pid: "p2", cantidad: 1050 }] },
  ],
};

/**
 * Pre-computed progress stats per OR: { contadas, total, sesiones }
 * Used by the recepciones list to show Progreso and Sesiones columns.
 */
export const OR_STATS: Record<string, { contadas: number; total: number; sesiones: number }> =
  Object.fromEntries(
    Object.entries(OR_SESIONES).map(([orId, sesiones]) => {
      const contadas = sesiones.reduce((sum, ses) => sum + ses.items.reduce((s, i) => s + i.cantidad, 0), 0);
      const total    = (OR_PRODUCTS[orId] ?? []).reduce((s, p) => s + p.esperadas, 0);
      return [orId, { contadas, total, sesiones: sesiones.length }];
    })
  );

// ─── Calendar-relevant OR seed ──────────────────────────────────────────────

export const ORDENES_SEED: CalOrEntry[] = [
  // ─── Creado ─────────────────────────────────────────────────────────────────
  { id: "RO-BARRA-191", fechaAgendada: "—",                sucursal: "Quilicura",       seller: "Extra Life", estado: "Creado" },
  { id: "RO-BARRA-192", fechaAgendada: "—",                sucursal: "Providencia",     seller: "NutriPro",   estado: "Creado" },
  { id: "RO-BARRA-193", fechaAgendada: "—",                sucursal: "Las Condes",      seller: "BioNature",  estado: "Creado" },
  { id: "RO-BARRA-210", fechaAgendada: "—",                sucursal: "Lo Barnechea",    seller: "Gohard",     estado: "Creado" },
  { id: "RO-BARRA-216", fechaAgendada: "—",                sucursal: "Santiago Centro",  seller: "Le Vice",    estado: "Creado" },
  { id: "RO-BARRA-225", fechaAgendada: "—",                sucursal: "La Reina",        seller: "NutriPro",   estado: "Creado" },
  // ─── Programado ─────────────────────────────────────────────────────────────
  { id: "RO-BARRA-183", fechaAgendada: "20/02/2026 16:30", sucursal: "Quilicura",       seller: "Extra Life", estado: "Programado", pallets: 10, bultos: 32, comentarios: "Llegará en un camión blanco patente XXNN33, preguntar por Carlos." },
  { id: "RO-BARRA-182", fechaAgendada: "20/02/2026 16:30", sucursal: "La Reina",        seller: "Extra Life", estado: "Programado", pallets: 8, bultos: 28 },
  { id: "RO-BARRA-190", fechaAgendada: "21/02/2026 09:00", sucursal: "Lo Barnechea",    seller: "Le Vice",    estado: "Programado", pallets: 3, bultos: 15, comentarios: "Entrega parcial, solo 2 pallets llegarán hoy." },
  { id: "RO-BARRA-194", fechaAgendada: "11/03/2026 10:00", sucursal: "Quilicura",       seller: "VitaFit",    estado: "Programado", pallets: 6, bultos: 18, comentarios: "Incluye 4 pallets de colágeno que requieren temperatura controlada." },
  { id: "RO-BARRA-195", fechaAgendada: "12/03/2026 14:30", sucursal: "La Reina",        seller: "NutriPro",   estado: "Programado", pallets: 4, bultos: 12 },
  { id: "RO-BARRA-226", fechaAgendada: "14/03/2026 09:00", sucursal: "Las Condes",      seller: "Gohard",     estado: "Programado", pallets: 3, bultos: 10 },
  { id: "RO-BARRA-227", fechaAgendada: "15/03/2026 08:30", sucursal: "Providencia",     seller: "Le Vice",    estado: "Programado", pallets: 5, bultos: 16 },
  { id: "RO-BARRA-228", fechaAgendada: "15/03/2026 14:00", sucursal: "Quilicura",       seller: "VitaFit",    estado: "Programado", pallets: 8, bultos: 24 },
  { id: "RO-BARRA-229", fechaAgendada: "16/03/2026 10:00", sucursal: "Lo Barnechea",    seller: "NutriPro",   estado: "Programado", pallets: 2, bultos: 8 },
  { id: "RO-BARRA-230", fechaAgendada: "17/03/2026 11:30", sucursal: "La Reina",        seller: "Extra Life", estado: "Programado", pallets: 4, bultos: 14 },
  { id: "RO-BARRA-180", fechaAgendada: "20/02/2026 16:30", sucursal: "Santiago Centro",  seller: "Le Vice",    estado: "Recepcionado en bodega", pallets: 2, bultos: 4, comentarios: "Mercancía frágil, manipular con cuidado. Entregar en andén 3.", comentarioRecepcion: "Recibido en andén 3. 2 pallets en buen estado, 4 bultos verificados. Sin novedades." },
  { id: "RO-BARRA-196", fechaAgendada: "09/03/2026 09:00", sucursal: "Lo Barnechea",    seller: "BioNature",  estado: "Recepcionado en bodega", pallets: 3, bultos: 10, comentarioRecepcion: "Recibido completo. 1 bulto con embalaje dañado, contenido intacto." },
  { id: "RO-BARRA-197", fechaAgendada: "08/03/2026 11:00", sucursal: "Providencia",     seller: "Extra Life", estado: "Recepcionado en bodega", pallets: 1, bultos: 6, comentarios: "Entregar a operador Juan Pérez en andén 2.", comentarioRecepcion: "Recibido por Juan Pérez. Todo en orden." },
  { id: "RO-BARRA-184", fechaAgendada: "19/02/2026 10:00", sucursal: "Quilicura",       seller: "Extra Life", estado: "En proceso de conteo" },
  { id: "RO-BARRA-179", fechaAgendada: "18/02/2026 09:00", sucursal: "La Reina",        seller: "Gohard",     estado: "En proceso de conteo" },
  { id: "RO-BARRA-185", fechaAgendada: "17/02/2026 14:00", sucursal: "Lo Barnechea",    seller: "Gohard",     estado: "En proceso de conteo" },
  { id: "RO-BARRA-198", fechaAgendada: "07/03/2026 08:30", sucursal: "Santiago Centro",  seller: "VitaFit",    estado: "En proceso de conteo" },
  { id: "RO-BARRA-187", fechaAgendada: "14/02/2026 13:00", sucursal: "La Reina",        seller: "Le Vice",    estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-199", fechaAgendada: "06/03/2026 10:00", sucursal: "Las Condes",      seller: "NutriPro",   estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-186", fechaAgendada: "15/02/2026 08:00", sucursal: "Quilicura",       seller: "Extra Life", estado: "Completada", pallets: 5, bultos: 12, comentarios: "Mercancía frágil, manipular con cuidado. Entregar en andén 3." },
  { id: "RO-BARRA-201", fechaAgendada: "01/03/2026 09:00", sucursal: "La Reina",        seller: "VitaFit",    estado: "Completada", pallets: 3, bultos: 8 },
  { id: "RO-BARRA-189", fechaAgendada: "13/02/2026 15:30", sucursal: "Santiago Centro",  seller: "Le Vice",    estado: "Completada", pallets: 2, bultos: 6 },
  { id: "RO-BARRA-200", fechaAgendada: "04/03/2026 15:00", sucursal: "Quilicura",       seller: "BioNature",  estado: "Completada", pallets: 4, bultos: 10 },
];
