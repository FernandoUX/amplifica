// ─── B2B Status Types ─────────────────────────────────────────────────────────
export type B2BStatus =
  | "Recibido"
  | "Documentación pendiente"
  | "Validado"
  | "Redistribución pendiente"
  | "En preparación"
  | "Empacado"
  | "Despachado"
  | "Entregado"
  | "Entrega fallida"
  | "Cancelado"
  | "Listo para retiro"
  | "Retirado";

export const ALL_B2B_STATUSES: B2BStatus[] = [
  "Recibido", "Documentación pendiente", "Validado", "Redistribución pendiente",
  "En preparación", "Empacado", "Despachado", "Entregado",
  "Entrega fallida", "Cancelado", "Listo para retiro", "Retirado",
];

export type CanalVenta = "Venta directa" | "Mercado Libre" | "Falabella";
export type MetodoEnvio = "Furgón Amplifica" | "Courier Blue Express" | "Retiro en Tienda";

// ─── Tab config ───────────────────────────────────────────────────────────────
export const TABS_B2B = [
  "Todos", "Recibido", "Doc. pendiente", "Validado", "Redistribución",
  "En preparación", "Empacado", "Despachados", "Entregados", "Cancelados",
] as const;

export const TAB_TO_STATUS: Record<string, B2BStatus[]> = {
  "Todos": ALL_B2B_STATUSES,
  "Recibido": ["Recibido"],
  "Doc. pendiente": ["Documentación pendiente"],
  "Validado": ["Validado"],
  "Redistribución": ["Redistribución pendiente"],
  "En preparación": ["En preparación"],
  "Empacado": ["Empacado"],
  "Despachados": ["Despachado"],
  "Entregados": ["Entregado", "Retirado"],
  "Cancelados": ["Cancelado"],
};

export const TAB_BADGE_COLORS: Record<string, { active: string; inactive: string }> = {
  "Todos":           { active: "bg-primary-500 text-white",       inactive: "bg-neutral-200/70 text-neutral-500" },
  "Recibido":        { active: "bg-sky-100 text-sky-700",         inactive: "bg-neutral-200/70 text-neutral-500" },
  "Doc. pendiente":  { active: "bg-amber-100 text-amber-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Validado":        { active: "bg-green-100 text-green-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Redistribución":  { active: "bg-orange-100 text-orange-700",   inactive: "bg-neutral-200/70 text-neutral-500" },
  "En preparación":  { active: "bg-primary-100 text-primary-700", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Empacado":        { active: "bg-indigo-100 text-indigo-700",   inactive: "bg-neutral-200/70 text-neutral-500" },
  "Despachados":     { active: "bg-blue-100 text-blue-700",       inactive: "bg-neutral-200/70 text-neutral-500" },
  "Entregados":      { active: "bg-green-100 text-green-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Cancelados":      { active: "bg-red-100 text-red-700",         inactive: "bg-neutral-200/70 text-neutral-500" },
};

// ─── Stock ────────────────────────────────────────────────────────────────────
export type StockPorSucursal = {
  sucursal: string;
  disponible: number;
};

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductoB2B = {
  id: string;
  sku: string;
  nombre: string;
  barcode: string;
  precioUnitario: number;
  stockQuilicura: number;
  stockGlobal: number;
  stockDetalle: StockPorSucursal[];
  imagen?: string;
};

// ─── Destinatario ─────────────────────────────────────────────────────────────
export type DestinatarioB2B = {
  razonSocial: string;
  rut: string;
  giro?: string;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string;
  direccionEnvio: string;
  comuna: string;
  region: string;
  complemento?: string;
};

// ─── Documentos ───────────────────────────────────────────────────────────────
export type DocumentoB2B = {
  id: string;
  tipo: "factura" | "guia_despacho" | "etiqueta_producto" | "etiqueta_bulto" | "etiqueta_kit" | "qr_colecta_ml" | "orden_compra" | "otro";
  nombre: string;
  fecha: string;
  autor: string;
  version: number;
  url?: string;
};

// ─── Redistribución ───────────────────────────────────────────────────────────
export type RedistribucionEstado = "Solicitada" | "Reservada en origen" | "En tránsito" | "Recibida en destino" | "Fallida" | "Cancelada";

export type RedistribucionB2B = {
  id: string;
  pedidoId: number;
  sku: string;
  productoNombre: string;
  cantidad: number;
  sucursalOrigen: string;
  estado: RedistribucionEstado;
  fechaCreacion: string;
  fechaEstimada: string;
  prioridad: "normal" | "urgente";
};

// ─── Kits ─────────────────────────────────────────────────────────────────────
export type KitB2B = {
  id: string;
  nombre: string;
  tipo: "simple" | "complejo";
  productos: { sku: string; nombre: string; cantidad: number }[];
  etiquetaUrl?: string;
  solicitarImpresion: boolean;
};

// ─── Checklist ────────────────────────────────────────────────────────────────
export type ChecklistItem = {
  id: string;
  requisito: string;
  obligatorio: boolean;
  completado: boolean;
  documentoId?: string;
};

// ─── Timeline ─────────────────────────────────────────────────────────────────
export type EventoB2B = {
  id: string;
  timestamp: string;
  tipo: "creacion" | "validacion" | "documentacion" | "redistribucion" | "preparacion" | "empaque" | "despacho" | "entrega" | "cancelacion" | "sistema";
  titulo: string;
  descripcion?: string;
  usuario?: string;
};

// ─── Pedido B2B completo ──────────────────────────────────────────────────────
export type PedidoB2B = {
  id: number;
  idAmplifica: string;
  estado: B2BStatus;
  seller: string;
  canalVenta: CanalVenta;
  metodoEnvio: MetodoEnvio;
  destinatario: DestinatarioB2B;
  productos: { productoId: string; sku: string; nombre: string; cantidad: number; precioUnitario: number; requiereRedistribucion: boolean }[];
  documentos: DocumentoB2B[];
  redistribuciones: RedistribucionB2B[];
  kits: KitB2B[];
  checklist: ChecklistItem[];
  timeline: EventoB2B[];
  montoTotal: number;
  subtotal: number;
  descuentos: number;
  impuestos: number;
  costoEnvio: number;
  fechaCreacion: string;
  fechaEstimada?: string;
  notas?: string;
  requiereRedistribucion: boolean;
  bultos: number;
};

// ─── KPIs ─────────────────────────────────────────────────────────────────────
export type KpiB2B = {
  title: string;
  value: string;
  delta: { value: string; label: string; color: "green" | "red" | "amber" | "neutral" };
};

export const KPIS_B2B: KpiB2B[] = [
  { title: "Pedidos activos", value: "24", delta: { value: "+4", label: "vs semana ant.", color: "green" } },
  { title: "Requieren acción", value: "5", delta: { value: "3 docs + 2 redist.", label: "", color: "amber" } },
  { title: "Redistribuciones", value: "8", delta: { value: "3 en tránsito", label: "", color: "neutral" } },
  { title: "Sellers autónomos", value: "7/12", delta: { value: "58%", label: "creación propia", color: "green" } },
];

// ─── Catálogo de productos (para el buscador del wizard) ──────────────────────
export const CATALOGO_PRODUCTOS: ProductoB2B[] = [
  { id: "p1", sku: "SBMES", nombre: "SLEEP BASICS - Magnesio Bisglicinato 1mes", barcode: "7501234567890", precioUnitario: 14328, stockQuilicura: 150, stockGlobal: 245, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 150 }, { sucursal: "La Reina", disponible: 30 }, { sucursal: "Lo Barnechea", disponible: 45 }, { sucursal: "Santiago Centro", disponible: 20 }] },
  { id: "p2", sku: "SBME6", nombre: "Pack x6 SLEEP BASICS - Magnesio 6 meses", barcode: "7509876543210", precioUnitario: 75222, stockQuilicura: 42, stockGlobal: 78, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 42 }, { sucursal: "La Reina", disponible: 15 }, { sucursal: "Lo Barnechea", disponible: 12 }, { sucursal: "Santiago Centro", disponible: 9 }] },
  { id: "p3", sku: "VIT-C500", nombre: "Vitamina C 500mg x60 cápsulas", barcode: "7503456789012", precioUnitario: 8990, stockQuilicura: 0, stockGlobal: 120, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 0 }, { sucursal: "La Reina", disponible: 50 }, { sucursal: "Lo Barnechea", disponible: 40 }, { sucursal: "Santiago Centro", disponible: 30 }] },
  { id: "p4", sku: "OMEGA3", nombre: "Omega 3 Fish Oil 1000mg x90", barcode: "7504567890123", precioUnitario: 12500, stockQuilicura: 200, stockGlobal: 320, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 200 }, { sucursal: "La Reina", disponible: 60 }, { sucursal: "Lo Barnechea", disponible: 35 }, { sucursal: "Santiago Centro", disponible: 25 }] },
  { id: "p5", sku: "COLG-PRO", nombre: "Colágeno Hidrolizado Premium 300g", barcode: "7505678901234", precioUnitario: 18750, stockQuilicura: 5, stockGlobal: 85, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 5 }, { sucursal: "La Reina", disponible: 30 }, { sucursal: "Lo Barnechea", disponible: 25 }, { sucursal: "Santiago Centro", disponible: 25 }] },
  { id: "p6", sku: "ZINC-30", nombre: "Zinc Picolinato 30mg x120", barcode: "7506789012345", precioUnitario: 6800, stockQuilicura: 300, stockGlobal: 450, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 300 }, { sucursal: "La Reina", disponible: 80 }, { sucursal: "Lo Barnechea", disponible: 40 }, { sucursal: "Santiago Centro", disponible: 30 }] },
  { id: "p7", sku: "PROBIO-10", nombre: "Probiótico 10 cepas x30", barcode: "7507890123456", precioUnitario: 15990, stockQuilicura: 18, stockGlobal: 18, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 18 }, { sucursal: "La Reina", disponible: 0 }, { sucursal: "Lo Barnechea", disponible: 0 }, { sucursal: "Santiago Centro", disponible: 0 }] },
  { id: "p8", sku: "ASHWA-KSM", nombre: "Ashwagandha KSM-66 600mg x60", barcode: "7508901234567", precioUnitario: 11200, stockQuilicura: 0, stockGlobal: 0, stockDetalle: [{ sucursal: "CD Quilicura", disponible: 0 }, { sucursal: "La Reina", disponible: 0 }, { sucursal: "Lo Barnechea", disponible: 0 }, { sucursal: "Santiago Centro", disponible: 0 }] },
];

// ─── Checklist templates por marketplace ──────────────────────────────────────
export const CHECKLIST_ML: Omit<ChecklistItem, "completado" | "documentoId">[] = [
  { id: "ml-1", requisito: "Etiqueta de producto individual (Meli SKU)", obligatorio: true },
  { id: "ml-2", requisito: "Etiqueta de bulto", obligatorio: true },
  { id: "ml-3", requisito: "Guía de despacho", obligatorio: true },
  { id: "ml-4", requisito: "QR de colecta ML Full", obligatorio: false },
  { id: "ml-5", requisito: "Etiqueta de kit", obligatorio: false },
  { id: "ml-6", requisito: "Configuración de kits", obligatorio: false },
];

export const CHECKLIST_FALABELLA: Omit<ChecklistItem, "completado" | "documentoId">[] = [
  { id: "fb-1", requisito: "Etiqueta de producto individual (EAN/UPC)", obligatorio: true },
  { id: "fb-2", requisito: "Etiqueta de bulto (generada por Falabella)", obligatorio: true },
  { id: "fb-3", requisito: "Guía de despacho", obligatorio: true },
  { id: "fb-4", requisito: "Etiqueta de despacho (ZPL/PDF Seller Center)", obligatorio: true },
  { id: "fb-5", requisito: "Etiqueta de kit", obligatorio: false },
  { id: "fb-6", requisito: "Configuración de kits", obligatorio: false },
];

// ─── Mock pedidos B2B ─────────────────────────────────────────────────────────
const sellers = ["Basics", "Manabu", "Ergopouch", "Okwu", "MamáMía", "La Cocinería", "Saint Venik"];
const canales: CanalVenta[] = ["Venta directa", "Mercado Libre", "Falabella"];
const envios: MetodoEnvio[] = ["Furgón Amplifica", "Courier Blue Express", "Retiro en Tienda"];

function generatePedidosB2B(): PedidoB2B[] {
  const statuses: B2BStatus[] = [
    "Recibido", "Recibido",
    "Documentación pendiente", "Documentación pendiente",
    "Validado", "Validado", "Validado",
    "Redistribución pendiente", "Redistribución pendiente",
    "En preparación", "En preparación", "En preparación",
    "Empacado", "Empacado",
    "Despachado", "Despachado", "Despachado",
    "Entregado", "Entregado", "Entregado", "Entregado", "Entregado",
    "Entrega fallida",
    "Cancelado", "Cancelado",
    "Listo para retiro",
    "Retirado", "Retirado",
    "Validado", "En preparación",
  ];

  return statuses.map((estado, i) => {
    const id = 5000 + i;
    const seller = sellers[i % sellers.length];
    const canal = canales[i % canales.length];
    const envio = estado === "Listo para retiro" || estado === "Retirado" ? "Retiro en Tienda" : envios[i % envios.length];
    const hasRedist = estado === "Redistribución pendiente" || (i % 5 === 0 && estado !== "Cancelado");
    const hasDocsPending = estado === "Documentación pendiente";
    const isMarketplace = canal !== "Venta directa";

    const productos = [
      { productoId: CATALOGO_PRODUCTOS[i % CATALOGO_PRODUCTOS.length].id, sku: CATALOGO_PRODUCTOS[i % CATALOGO_PRODUCTOS.length].sku, nombre: CATALOGO_PRODUCTOS[i % CATALOGO_PRODUCTOS.length].nombre, cantidad: 10 + (i * 3) % 50, precioUnitario: CATALOGO_PRODUCTOS[i % CATALOGO_PRODUCTOS.length].precioUnitario, requiereRedistribucion: hasRedist },
    ];
    if (i % 3 === 0) {
      const p2 = CATALOGO_PRODUCTOS[(i + 2) % CATALOGO_PRODUCTOS.length];
      productos.push({ productoId: p2.id, sku: p2.sku, nombre: p2.nombre, cantidad: 5 + (i * 2) % 20, precioUnitario: p2.precioUnitario, requiereRedistribucion: false });
    }

    const subtotal = productos.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);

    return {
      id,
      idAmplifica: `B2B-${String(id).padStart(5, "0")}`,
      estado,
      seller,
      canalVenta: canal,
      metodoEnvio: envio,
      destinatario: {
        razonSocial: `${seller} Chile SpA`,
        rut: `76.${500 + i}.${100 + i}-${i % 10}`,
        giro: "Comercio electrónico",
        nombreContacto: `Contacto ${seller}`,
        emailContacto: `contacto@${seller.toLowerCase().replace(/\s/g, "")}.cl`,
        telefonoContacto: `+569${String(40000000 + i * 111)}`,
        direccionEnvio: `Av. Ejemplo ${1000 + i * 10}`,
        comuna: ["Providencia", "Las Condes", "Quilicura", "Santiago", "Ñuñoa"][i % 5],
        region: "Metropolitana",
      },
      productos,
      documentos: isMarketplace && !hasDocsPending ? [
        { id: `doc-${id}-1`, tipo: "guia_despacho" as const, nombre: `Guía Despacho #${id}`, fecha: "2026-03-20T10:00:00", autor: seller, version: 1 },
        { id: `doc-${id}-2`, tipo: "etiqueta_bulto" as const, nombre: `Etiquetas Bulto x${2 + (i % 3)}`, fecha: "2026-03-20T10:05:00", autor: seller, version: 1 },
      ] : [],
      redistribuciones: hasRedist ? [{
        id: `red-${id}-1`,
        pedidoId: id,
        sku: productos[0].sku,
        productoNombre: productos[0].nombre,
        cantidad: Math.min(productos[0].cantidad, 20),
        sucursalOrigen: ["La Reina", "Lo Barnechea", "Santiago Centro"][i % 3],
        estado: estado === "Redistribución pendiente" ? "En tránsito" as const : "Recibida en destino" as const,
        fechaCreacion: "2026-03-19T14:00:00",
        fechaEstimada: "2026-03-21T14:00:00",
        prioridad: i % 4 === 0 ? "urgente" as const : "normal" as const,
      }] : [],
      kits: isMarketplace && i % 4 === 0 ? [{
        id: `kit-${id}-1`,
        nombre: `Kit ${seller} x3`,
        tipo: "simple" as const,
        productos: [
          { sku: productos[0].sku, nombre: productos[0].nombre, cantidad: 3 },
        ],
        solicitarImpresion: i % 2 === 0,
      }] : [],
      checklist: isMarketplace ? (canal === "Mercado Libre" ? CHECKLIST_ML : CHECKLIST_FALABELLA).map(c => ({
        ...c,
        completado: !hasDocsPending || c.obligatorio === false,
        documentoId: !hasDocsPending ? `doc-${id}-linked` : undefined,
      })) : [],
      timeline: [
        { id: `evt-${id}-1`, timestamp: "2026-03-19T14:00:00", tipo: "creacion" as const, titulo: `Pedido B2B creado por ${seller}`, usuario: seller },
        ...(estado !== "Recibido" ? [{ id: `evt-${id}-2`, timestamp: "2026-03-19T14:05:00", tipo: "validacion" as const, titulo: "Pedido validado automáticamente", usuario: "Sistema" }] : []),
      ],
      montoTotal: Math.round(subtotal * 1.19),
      subtotal,
      descuentos: 0,
      impuestos: Math.round(subtotal * 0.19),
      costoEnvio: envio === "Furgón Amplifica" ? 15000 : envio === "Courier Blue Express" ? 8500 : 0,
      fechaCreacion: `2026-03-${String(15 + (i % 10)).padStart(2, "0")}T${String(8 + (i % 12)).padStart(2, "0")}:${String(i * 7 % 60).padStart(2, "0")}:00`,
      fechaEstimada: `2026-03-${String(20 + (i % 8)).padStart(2, "0")}T18:00:00`,
      notas: i % 3 === 0 ? "Pedido prioritario — entregar antes del viernes" : undefined,
      requiereRedistribucion: hasRedist,
      bultos: 1 + (i % 4),
    };
  });
}

export const PEDIDOS_B2B: PedidoB2B[] = generatePedidosB2B();

// Helper: all redistribuciones across all orders
export function getAllRedistribuciones(): (RedistribucionB2B & { sellerName: string; idAmplifica: string })[] {
  return PEDIDOS_B2B.flatMap(p =>
    p.redistribuciones.map(r => ({ ...r, sellerName: p.seller, idAmplifica: p.idAmplifica }))
  );
}
