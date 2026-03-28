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
    id: "QR-353-p1", orId: "RO-BARRA-353", seller: "GoHard", sucursal: "Quilicura",
    sku: "GH-001", skuId: "p1", productName: "GoHard Proteína Vegana 1kg Chocolate",
    cantidad: 20, tag: "sin-nutricional", categoria: "devolucion_seller",
    estado: "resuelto", resolucion: "devolucion",
    creadoEn: "2026-01-16T15:45:00", resueltoen: "2026-01-21T10:20:00",
  },
  {
    id: "QR-341-p1", orId: "RO-BARRA-341", seller: "Le Vice", sucursal: "Santiago Centro",
    sku: "LV-002", skuId: "p1", productName: "Le Vice Bombones Artesanales 250g",
    cantidad: 30, tag: "danio-total", categoria: "decision_seller",
    estado: "pendiente", resolucion: null, creadoEn: "2026-02-14T13:15:00",
  },
  {
    id: "QR-341-p2", orId: "RO-BARRA-341", seller: "Le Vice", sucursal: "Santiago Centro",
    sku: "LV-003", skuId: "p2", productName: "Le Vice Trufas Premium 180g",
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

/** Products per OR (total esperadas) — En proceso de conteo + Pendiente de aprobación + Completada */
export const OR_PRODUCTS: Record<string, SeedProduct[]> = {
  // ─── En proceso de conteo (331–340) ────────────────────────────────────────
  "RO-BARRA-331": [{ id: "p1", esperadas: 250 }, { id: "p2", esperadas: 200 }, { id: "p3", esperadas: 150 }],
  "RO-BARRA-332": [{ id: "p1", esperadas: 180 }, { id: "p2", esperadas: 170 }],
  "RO-BARRA-333": [{ id: "p1", esperadas: 400 }, { id: "p2", esperadas: 350 }, { id: "p3", esperadas: 450 }],
  "RO-BARRA-334": [{ id: "p1", esperadas: 100 }, { id: "p2", esperadas: 80 }],
  "RO-BARRA-335": [{ id: "p1", esperadas: 200 }, { id: "p2", esperadas: 150 }, { id: "p3", esperadas: 130 }],
  "RO-BARRA-336": [{ id: "p1", esperadas: 350 }, { id: "p2", esperadas: 300 }, { id: "p3", esperadas: 400 }],
  "RO-BARRA-337": [{ id: "p1", esperadas: 280 }, { id: "p2", esperadas: 250 }, { id: "p3", esperadas: 250 }],
  "RO-BARRA-338": [{ id: "p1", esperadas: 500 }, { id: "p2", esperadas: 450 }, { id: "p3", esperadas: 300 }, { id: "p4", esperadas: 250 }],
  "RO-BARRA-339": [{ id: "p1", esperadas: 100 }, { id: "p2", esperadas: 40 }],
  "RO-BARRA-340": [{ id: "p1", esperadas: 150 }, { id: "p2", esperadas: 170 }],
  // ─── Pendiente de aprobación (341–350) ─────────────────────────────────────
  "RO-BARRA-341": [{ id: "p1", esperadas: 500 }, { id: "p2", esperadas: 400 }, { id: "p3", esperadas: 300 }],
  "RO-BARRA-342": [{ id: "p1", esperadas: 800 }, { id: "p2", esperadas: 700 }, { id: "p3", esperadas: 900 }],
  "RO-BARRA-343": [{ id: "p1", esperadas: 100 }, { id: "p2", esperadas: 80 }],
  "RO-BARRA-344": [{ id: "p1", esperadas: 500 }, { id: "p2", esperadas: 450 }, { id: "p3", esperadas: 550 }],
  "RO-BARRA-345": [{ id: "p1", esperadas: 180 }, { id: "p2", esperadas: 160 }],
  "RO-BARRA-346": [{ id: "p1", esperadas: 80 },  { id: "p2", esperadas: 70 }],
  "RO-BARRA-347": [{ id: "p1", esperadas: 250 }, { id: "p2", esperadas: 200 }, { id: "p3", esperadas: 230 }],
  "RO-BARRA-348": [{ id: "p1", esperadas: 350 }, { id: "p2", esperadas: 300 }, { id: "p3", esperadas: 400 }],
  "RO-BARRA-349": [{ id: "p1", esperadas: 200 }, { id: "p2", esperadas: 150 }, { id: "p3", esperadas: 130 }],
  "RO-BARRA-350": [{ id: "p1", esperadas: 450 }, { id: "p2", esperadas: 400 }, { id: "p3", esperadas: 450 }],
  // ─── Completada (351–360) ──────────────────────────────────────────────────
  "RO-BARRA-351": [{ id: "p1", esperadas: 300 }, { id: "p2", esperadas: 250 }, { id: "p3", esperadas: 200 }],
  "RO-BARRA-352": [{ id: "p1", esperadas: 200 }, { id: "p2", esperadas: 280 }],
  "RO-BARRA-353": [{ id: "p1", esperadas: 700 }, { id: "p2", esperadas: 600 }, { id: "p3", esperadas: 800 }],
  "RO-BARRA-354": [{ id: "p1", esperadas: 60 },  { id: "p2", esperadas: 60 }],
  "RO-BARRA-355": [{ id: "p1", esperadas: 100 }, { id: "p2", esperadas: 100 }],
  "RO-BARRA-356": [{ id: "p1", esperadas: 200 }, { id: "p2", esperadas: 180 }, { id: "p3", esperadas: 180 }],
  "RO-BARRA-357": [{ id: "p1", esperadas: 500 }, { id: "p2", esperadas: 400 }, { id: "p3", esperadas: 460 }],
  "RO-BARRA-358": [{ id: "p1", esperadas: 150 }, { id: "p2", esperadas: 150 }],
  "RO-BARRA-359": [{ id: "p1", esperadas: 350 }, { id: "p2", esperadas: 300 }, { id: "p3", esperadas: 330 }],
  "RO-BARRA-360": [{ id: "p1", esperadas: 500 }, { id: "p2", esperadas: 500 }, { id: "p3", esperadas: 500 }],
};

/** Counting sessions per OR */
export const OR_SESIONES: Record<string, SeedSesion[]> = {
  // ─── En proceso de conteo (partial: contadas < total) ─────────────────────
  "RO-BARRA-331": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 140 }, { pid: "p2", cantidad: 90 }, { pid: "p3", cantidad: 60 }] },
  ],
  "RO-BARRA-332": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 80 }, { pid: "p2", cantidad: 50 }] },
  ],
  "RO-BARRA-333": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 200 }, { pid: "p2", cantidad: 150 }] },
  ],
  "RO-BARRA-334": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 55 }, { pid: "p2", cantidad: 30 }] },
  ],
  "RO-BARRA-335": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 120 }, { pid: "p2", cantidad: 80 }, { pid: "p3", cantidad: 40 }] },
  ],
  "RO-BARRA-336": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 200 }, { pid: "p2", cantidad: 100 }] },
  ],
  "RO-BARRA-337": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 150 }, { pid: "p2", cantidad: 100 }, { pid: "p3", cantidad: 80 }] },
  ],
  "RO-BARRA-338": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 300 }, { pid: "p2", cantidad: 200 }, { pid: "p3", cantidad: 100 }] },
  ],
  "RO-BARRA-339": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 60 }] },
  ],
  "RO-BARRA-340": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 80 }, { pid: "p2", cantidad: 60 }] },
  ],
  // ─── Pendiente de aprobación (complete, some with differences) ─────────────
  "RO-BARRA-341": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 500 }, { pid: "p2", cantidad: 380 }, { pid: "p3", cantidad: 300 }] },
  ],
  "RO-BARRA-342": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 780 }, { pid: "p2", cantidad: 663 }, { pid: "p3", cantidad: 900 }] },
  ],
  "RO-BARRA-343": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 96 }, { pid: "p2", cantidad: 76 }] },
  ],
  "RO-BARRA-344": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 490 }, { pid: "p2", cantidad: 425 }, { pid: "p3", cantidad: 550 }] },
  ],
  "RO-BARRA-345": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 172 }, { pid: "p2", cantidad: 156 }] },
  ],
  "RO-BARRA-346": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 76 }, { pid: "p2", cantidad: 66 }] },
  ],
  "RO-BARRA-347": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 240 }, { pid: "p2", cantidad: 195 }, { pid: "p3", cantidad: 230 }] },
  ],
  "RO-BARRA-348": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 340 }, { pid: "p2", cantidad: 280 }, { pid: "p3", cantidad: 380 }] },
  ],
  "RO-BARRA-349": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 195 }, { pid: "p2", cantidad: 145 }, { pid: "p3", cantidad: 130 }] },
  ],
  "RO-BARRA-350": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 430 }, { pid: "p2", cantidad: 380 }, { pid: "p3", cantidad: 425 }] },
  ],
  // ─── Completada (sinDiferencias = contadas match total; conDiferencias = close but off) ─
  "RO-BARRA-351": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 300 }, { pid: "p2", cantidad: 250 }, { pid: "p3", cantidad: 200 }] },
  ],
  "RO-BARRA-352": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 200 }, { pid: "p2", cantidad: 280 }] },
  ],
  "RO-BARRA-353": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 680 }, { pid: "p2", cantidad: 577 }, { pid: "p3", cantidad: 800 }] },
  ],
  "RO-BARRA-354": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 60 }, { pid: "p2", cantidad: 60 }] },
  ],
  "RO-BARRA-355": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 100 }, { pid: "p2", cantidad: 100 }] },
  ],
  "RO-BARRA-356": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 192 }, { pid: "p2", cantidad: 178 }, { pid: "p3", cantidad: 172 }] },
  ],
  "RO-BARRA-357": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 500 }, { pid: "p2", cantidad: 400 }, { pid: "p3", cantidad: 460 }] },
  ],
  "RO-BARRA-358": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 150 }, { pid: "p2", cantidad: 150 }] },
  ],
  "RO-BARRA-359": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 340 }, { pid: "p2", cantidad: 284 }, { pid: "p3", cantidad: 325 }] },
  ],
  "RO-BARRA-360": [
    { id: "SES-001", items: [{ pid: "p1", cantidad: 500 }, { pid: "p2", cantidad: 500 }, { pid: "p3", cantidad: 500 }] },
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
  // ─── Creado (10) ───────────────────────────────────────────────────────────
  { id: "RO-BARRA-301", fechaAgendada: "—",                  sucursal: "Quilicura",       seller: "Extra Life",     estado: "Creado" },
  { id: "RO-BARRA-302", fechaAgendada: "—",                  sucursal: "Santiago Centro",  seller: "Le Vice",        estado: "Creado" },
  { id: "RO-BARRA-303", fechaAgendada: "—",                  sucursal: "La Reina",        seller: "GoHard",         estado: "Creado" },
  { id: "RO-BARRA-304", fechaAgendada: "—",                  sucursal: "Providencia",     seller: "Bekoko",         estado: "Creado" },
  { id: "RO-BARRA-305", fechaAgendada: "—",                  sucursal: "Las Condes",      seller: "Mundo Fungi",    estado: "Creado" },
  { id: "RO-BARRA-306", fechaAgendada: "—",                  sucursal: "Lo Barnechea",    seller: "Xclusive",       estado: "Creado" },
  { id: "RO-BARRA-307", fechaAgendada: "—",                  sucursal: "Quilicura",       seller: "Boqa",           estado: "Creado" },
  { id: "RO-BARRA-308", fechaAgendada: "—",                  sucursal: "Santiago Centro",  seller: "Mind Nutrition", estado: "Creado", comentarios: "Seller solicita recepción urgente esta semana." },
  { id: "RO-BARRA-309", fechaAgendada: "—",                  sucursal: "La Reina",        seller: "Basics",         estado: "Creado" },
  { id: "RO-BARRA-310", fechaAgendada: "—",                  sucursal: "Providencia",     seller: "Your Goal",      estado: "Creado" },
  // ─── Programado (10) ──────────────────────────────────────────────────────
  { id: "RO-BARRA-311", fechaAgendada: "10/03/2026 09:00",   sucursal: "La Reina",        seller: "Extra Life",     estado: "Programado", pallets: 6, bultos: 20, comentarios: "Llegará en camión blanco patente XXNN33, preguntar por Carlos." },
  { id: "RO-BARRA-312", fechaAgendada: "11/03/2026 14:30",   sucursal: "Lo Barnechea",    seller: "Le Vice",        estado: "Programado", pallets: 3, bultos: 12 },
  { id: "RO-BARRA-313", fechaAgendada: "12/03/2026 08:00",   sucursal: "Quilicura",       seller: "Saint Venik",    estado: "Programado", pallets: 2, bultos: 8 },
  { id: "RO-BARRA-314", fechaAgendada: "13/03/2026 10:00",   sucursal: "Santiago Centro",  seller: "GoHard",         estado: "Programado", pallets: 8, bultos: 30, comentarios: "Incluye 4 pallets de proteína que requieren temperatura controlada." },
  { id: "RO-BARRA-315", fechaAgendada: "14/03/2026 16:00",   sucursal: "Providencia",     seller: "MamáMía",        estado: "Programado", pallets: 1, bultos: 4 },
  { id: "RO-BARRA-316", fechaAgendada: "15/03/2026 09:30",   sucursal: "Las Condes",      seller: "Teregott",       estado: "Programado", pallets: 3, bultos: 10 },
  { id: "RO-BARRA-317", fechaAgendada: "16/03/2026 11:00",   sucursal: "Lo Barnechea",    seller: "Xclusive",       estado: "Programado", pallets: 12, bultos: 40, comentarios: "Carga incluye mochilas de temporada, priorizar descarga." },
  { id: "RO-BARRA-318", fechaAgendada: "17/03/2026 08:30",   sucursal: "Quilicura",       seller: "Boqa",           estado: "Programado", pallets: 2, bultos: 8 },
  { id: "RO-BARRA-319", fechaAgendada: "18/03/2026 15:00",   sucursal: "Santiago Centro",  seller: "Mind Nutrition", estado: "Programado", pallets: 5, bultos: 18, comentarios: "Segundo envío del mes, verificar contra OC anterior." },
  { id: "RO-BARRA-320", fechaAgendada: "19/03/2026 10:00",   sucursal: "La Reina",        seller: "Your Goal",      estado: "Programado", pallets: 7, bultos: 22 },
  // ─── Recepcionado en bodega (10) ──────────────────────────────────────────
  { id: "RO-BARRA-321", fechaAgendada: "28/02/2026 09:00",   sucursal: "Santiago Centro",  seller: "Le Vice",        estado: "Recepcionado en bodega", pallets: 3, bultos: 10, comentarios: "Mercancía frágil, manipular con cuidado. Entregar en andén 3.", comentarioRecepcion: "Recibido en andén 3. 3 pallets en buen estado, 10 bultos verificados. Sin novedades." },
  { id: "RO-BARRA-322", fechaAgendada: "01/03/2026 14:00",   sucursal: "Providencia",     seller: "Bekoko",         estado: "Recepcionado en bodega", pallets: 1, bultos: 5 },
  { id: "RO-BARRA-323", fechaAgendada: "02/03/2026 10:30",   sucursal: "La Reina",        seller: "Mundo Fungi",    estado: "Recepcionado en bodega", pallets: 2, bultos: 8 },
  { id: "RO-BARRA-324", fechaAgendada: "03/03/2026 08:00",   sucursal: "Las Condes",      seller: "Extra Life",     estado: "Recepcionado en bodega", pallets: 4, bultos: 14, comentarios: "Entregar a operador Juan Pérez en andén 2.", comentarioRecepcion: "Recibido por Juan Pérez. Todo en orden." },
  { id: "RO-BARRA-325", fechaAgendada: "04/03/2026 11:30",   sucursal: "Lo Barnechea",    seller: "Teregott",       estado: "Recepcionado en bodega", pallets: 1, bultos: 4 },
  { id: "RO-BARRA-326", fechaAgendada: "05/03/2026 09:00",   sucursal: "Quilicura",       seller: "Basics",         estado: "Recepcionado en bodega", pallets: 6, bultos: 18 },
  { id: "RO-BARRA-327", fechaAgendada: "06/03/2026 15:00",   sucursal: "Santiago Centro",  seller: "GoHard",         estado: "Recepcionado en bodega", pallets: 3, bultos: 10 },
  { id: "RO-BARRA-328", fechaAgendada: "07/03/2026 10:00",   sucursal: "Providencia",     seller: "Xclusive",       estado: "Recepcionado en bodega", pallets: 2, bultos: 7, comentarios: "Productos frágiles, manipular con cuidado." },
  { id: "RO-BARRA-329", fechaAgendada: "08/03/2026 08:30",   sucursal: "La Reina",        seller: "Your Goal",      estado: "Recepcionado en bodega", pallets: 4, bultos: 12 },
  { id: "RO-BARRA-330", fechaAgendada: "09/03/2026 14:00",   sucursal: "Las Condes",      seller: "MamáMía",        estado: "Recepcionado en bodega", pallets: 1, bultos: 4 },
  // ─── En proceso de conteo (10) ────────────────────────────────────────────
  { id: "RO-BARRA-331", fechaAgendada: "22/02/2026 09:00",   sucursal: "Quilicura",       seller: "Extra Life",     estado: "En proceso de conteo" },
  { id: "RO-BARRA-332", fechaAgendada: "23/02/2026 10:00",   sucursal: "La Reina",        seller: "Le Vice",        estado: "En proceso de conteo" },
  { id: "RO-BARRA-333", fechaAgendada: "24/02/2026 14:00",   sucursal: "Santiago Centro",  seller: "GoHard",         estado: "En proceso de conteo" },
  { id: "RO-BARRA-334", fechaAgendada: "25/02/2026 08:30",   sucursal: "Lo Barnechea",    seller: "Bekoko",         estado: "En proceso de conteo" },
  { id: "RO-BARRA-335", fechaAgendada: "26/02/2026 11:00",   sucursal: "Providencia",     seller: "Mundo Fungi",    estado: "En proceso de conteo", comentarios: "Conteo parcial, faltan 4 SKUs por verificar." },
  { id: "RO-BARRA-336", fechaAgendada: "27/02/2026 09:30",   sucursal: "Las Condes",      seller: "Mind Nutrition", estado: "En proceso de conteo" },
  { id: "RO-BARRA-337", fechaAgendada: "28/02/2026 15:00",   sucursal: "Quilicura",       seller: "Basics",         estado: "En proceso de conteo" },
  { id: "RO-BARRA-338", fechaAgendada: "01/03/2026 10:00",   sucursal: "Santiago Centro",  seller: "Your Goal",      estado: "En proceso de conteo" },
  { id: "RO-BARRA-339", fechaAgendada: "02/03/2026 08:00",   sucursal: "La Reina",        seller: "Saint Venik",    estado: "En proceso de conteo" },
  { id: "RO-BARRA-340", fechaAgendada: "03/03/2026 14:30",   sucursal: "Providencia",     seller: "Teregott",       estado: "En proceso de conteo" },
  // ─── Pendiente de aprobación (10) ─────────────────────────────────────────
  { id: "RO-BARRA-341", fechaAgendada: "14/02/2026 09:00",   sucursal: "Santiago Centro",  seller: "Le Vice",        estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-342", fechaAgendada: "15/02/2026 10:30",   sucursal: "La Reina",        seller: "GoHard",         estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-343", fechaAgendada: "16/02/2026 14:00",   sucursal: "Providencia",     seller: "Bekoko",         estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-344", fechaAgendada: "17/02/2026 08:00",   sucursal: "Quilicura",       seller: "Extra Life",     estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-345", fechaAgendada: "18/02/2026 11:00",   sucursal: "Las Condes",      seller: "Xclusive",       estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-346", fechaAgendada: "19/02/2026 09:30",   sucursal: "Lo Barnechea",    seller: "Boqa",           estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-347", fechaAgendada: "20/02/2026 15:00",   sucursal: "Santiago Centro",  seller: "Mundo Fungi",    estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-348", fechaAgendada: "21/02/2026 10:00",   sucursal: "Quilicura",       seller: "Mind Nutrition", estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-349", fechaAgendada: "22/02/2026 08:30",   sucursal: "La Reina",        seller: "Basics",         estado: "Pendiente de aprobación" },
  { id: "RO-BARRA-350", fechaAgendada: "23/02/2026 14:00",   sucursal: "Providencia",     seller: "Your Goal",      estado: "Pendiente de aprobación" },
  // ─── Completada (10) ──────────────────────────────────────────────────────
  { id: "RO-BARRA-351", fechaAgendada: "09/01/2026 09:00",   sucursal: "Las Condes",      seller: "Extra Life",     estado: "Completada", pallets: 3, bultos: 10 },
  { id: "RO-BARRA-352", fechaAgendada: "12/01/2026 10:30",   sucursal: "Santiago Centro",  seller: "Le Vice",        estado: "Completada", pallets: 2, bultos: 6 },
  { id: "RO-BARRA-353", fechaAgendada: "16/01/2026 14:00",   sucursal: "Quilicura",       seller: "GoHard",         estado: "Completada", pallets: 7, bultos: 24 },
  { id: "RO-BARRA-354", fechaAgendada: "19/01/2026 08:00",   sucursal: "Providencia",     seller: "Bekoko",         estado: "Completada", pallets: 1, bultos: 4 },
  { id: "RO-BARRA-355", fechaAgendada: "24/01/2026 11:30",   sucursal: "Lo Barnechea",    seller: "MamáMía",        estado: "Completada", pallets: 1, bultos: 5 },
  { id: "RO-BARRA-356", fechaAgendada: "29/01/2026 09:00",   sucursal: "La Reina",        seller: "Teregott",       estado: "Completada", pallets: 2, bultos: 8 },
  { id: "RO-BARRA-357", fechaAgendada: "01/02/2026 15:00",   sucursal: "Santiago Centro",  seller: "Xclusive",       estado: "Completada", pallets: 5, bultos: 16 },
  { id: "RO-BARRA-358", fechaAgendada: "06/02/2026 10:00",   sucursal: "Quilicura",       seller: "Boqa",           estado: "Completada", pallets: 1, bultos: 5 },
  { id: "RO-BARRA-359", fechaAgendada: "09/02/2026 08:30",   sucursal: "Las Condes",      seller: "Mind Nutrition", estado: "Completada", pallets: 4, bultos: 12 },
  { id: "RO-BARRA-360", fechaAgendada: "12/02/2026 14:00",   sucursal: "Providencia",     seller: "Your Goal",      estado: "Completada", pallets: 5, bultos: 18 },
  // ─── Cancelado (10) ───────────────────────────────────────────────────────
  { id: "RO-BARRA-361", fechaAgendada: "07/01/2026 09:00",   sucursal: "Quilicura",       seller: "Saint Venik",    estado: "Cancelado", comentarios: "Seller canceló envío por falta de stock." },
  { id: "RO-BARRA-362", fechaAgendada: "14/01/2026 14:00",   sucursal: "La Reina",        seller: "Le Vice",        estado: "Cancelado" },
  { id: "RO-BARRA-363", fechaAgendada: "19/01/2026 10:30",   sucursal: "Santiago Centro",  seller: "Bekoko",         estado: "Cancelado", comentarios: "Proveedor no se presentó en la fecha acordada." },
  { id: "RO-BARRA-364", fechaAgendada: "24/01/2026 08:00",   sucursal: "Providencia",     seller: "MamáMía",        estado: "Cancelado" },
  { id: "RO-BARRA-365", fechaAgendada: "29/01/2026 11:00",   sucursal: "Las Condes",      seller: "Teregott",       estado: "Cancelado", comentarios: "Productos dañados en tránsito, seller prefirió cancelar." },
  { id: "RO-BARRA-366", fechaAgendada: "01/02/2026 09:30",   sucursal: "Lo Barnechea",    seller: "Extra Life",     estado: "Cancelado" },
  { id: "RO-BARRA-367", fechaAgendada: "06/02/2026 14:00",   sucursal: "Quilicura",       seller: "GoHard",         estado: "Cancelado", comentarios: "Error en orden de compra, se generará nueva OR." },
  { id: "RO-BARRA-368", fechaAgendada: "10/02/2026 10:00",   sucursal: "Santiago Centro",  seller: "Xclusive",       estado: "Cancelado" },
  { id: "RO-BARRA-369", fechaAgendada: "14/02/2026 15:00",   sucursal: "La Reina",        seller: "Basics",         estado: "Cancelado", comentarios: "Seller solicitó reprogramación, se canceló esta OR." },
  { id: "RO-BARRA-370", fechaAgendada: "18/02/2026 08:30",   sucursal: "Providencia",     seller: "Your Goal",      estado: "Cancelado" },
];
