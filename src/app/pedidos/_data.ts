import type { PedidoStatus } from "@/components/pedidos/PedidoStatusBadge";
import type { EnvioStatus } from "@/components/pedidos/EnvioStatusBadge";

// ─── Types ───────────────────────────────────────────────────────────────────
export type SLABadge = {
  label: string;
  color: "blue" | "green" | "red" | "amber";
  version?: string;
};

export type Pedido = {
  id: number;
  fechaCreacion: string;
  fechaValidacion: string;
  idAmplifica: string;
  seller: string;
  sucursal: string;
  canalVenta: string;
  metodoEntrega: string;
  estadoPreparacion: PedidoStatus;
  estadoEnvio: EnvioStatus;
  preparacion: SLABadge[];
  entrega: SLABadge[];
  tags: string[];
  conAtraso?: boolean;
};

// ─── KPI data ────────────────────────────────────────────────────────────────
export type KpiActualItem = {
  label: string;
  value: string;
  alert?: boolean;
  sparkline?: number[];
};

export const KPIS_ACTUAL: KpiActualItem[] = [
  { label: "30 días", value: "55.748", sparkline: [28, 32, 30, 35, 42, 38, 45, 50, 48, 55, 52, 58] },
  { label: "Hoy", value: "1.670" },
  { label: "Pendientes", value: "514" },
  { label: "Con atraso", value: "36", alert: true },
  { label: "Validados", value: "508" },
  { label: "En preparación", value: "4" },
  { label: "Por empacar", value: "2" },
  { label: "Empacados", value: "298" },
  { label: "Listos para Retiro", value: "302" },
];

export type KpiMejoradaItem = {
  title: string;
  value: string;
  delta: { value: string; label: string; color: "green" | "red" | "blue" | "amber" | "neutral" };
  sparkline?: number[];
  sparklineColor?: string;
};

export const KPIS_MEJORADA: KpiMejoradaItem[] = [
  {
    title: "Pedidos (30 días)",
    value: "55.748",
    delta: { value: "+12%", label: "vs mes anterior", color: "green" },
    sparkline: [28, 32, 30, 35, 42, 38, 45, 50, 48, 55, 52, 58],
  },
  {
    title: "Hoy",
    value: "1.670",
    delta: { value: "+8%", label: "vs ayer", color: "green" },
    sparkline: [12, 15, 14, 16, 18, 17, 19],
  },
  {
    title: "SLA cumplido",
    value: "94,2%",
    delta: { value: "-1,3%", label: "vs mes anterior", color: "amber" },
    sparkline: [96, 95, 94, 95, 93, 94, 95, 94, 93, 94, 94, 94],
  },
  {
    title: "Tiempo fulfillment",
    value: "4,2h",
    delta: { value: "-0,8h", label: "vs mes anterior", color: "green" },
    sparkline: [6.2, 5.8, 5.5, 5.1, 4.9, 4.8, 4.6, 4.5, 4.3, 4.2, 4.2, 4.2],
  },
  {
    title: "Backlog",
    value: "1.628",
    delta: { value: "+142", label: "vs ayer", color: "amber" },
    sparkline: [1200, 1250, 1300, 1350, 1400, 1450, 1500, 1480, 1520, 1560, 1600, 1628],
  },
  {
    title: "Con atraso",
    value: "36",
    delta: { value: "+5", label: "desde ayer", color: "red" },
    sparklineColor: "#ef4444",
    sparkline: [20, 22, 28, 30, 25, 32, 36],
  },
];

// ─── Tabs ────────────────────────────────────────────────────────────────────
export const TABS_PEDIDOS = [
  "Todos",
  "Pendiente",
  "Validado",
  "En preparación",
  "Por empacar",
  "Empacado",
  "Listo para retiro",
  "Con atraso",
  "Cancelado",
] as const;

export const TAB_BADGE_COLORS: Record<string, { active: string; inactive: string }> = {
  "Todos":             { active: "bg-primary-500 text-white",       inactive: "bg-neutral-200/70 text-neutral-500" },
  "Pendiente":         { active: "bg-neutral-200 text-neutral-700", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Validado":          { active: "bg-sky-100 text-sky-700",         inactive: "bg-neutral-200/70 text-neutral-500" },
  "En preparación":    { active: "bg-primary-100 text-primary-700", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Por empacar":       { active: "bg-amber-100 text-amber-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Empacado":          { active: "bg-indigo-100 text-indigo-700",   inactive: "bg-neutral-200/70 text-neutral-500" },
  "Listo para retiro": { active: "bg-green-100 text-green-700",     inactive: "bg-neutral-200/70 text-neutral-500" },
  "Con atraso":        { active: "bg-red-100 text-red-700",         inactive: "bg-neutral-200/70 text-neutral-500" },
  "Cancelado":         { active: "bg-neutral-200 text-neutral-700", inactive: "bg-neutral-200/70 text-neutral-500" },
};

// ─── Column definitions ──────────────────────────────────────────────────────
export type PedidoColumnKey =
  | "fechaCreacion" | "fechaValidacion" | "idAmplifica" | "seller"
  | "sucursal" | "canalVenta" | "metodoEntrega" | "estadoPreparacion"
  | "estadoEnvio" | "preparacion" | "entrega" | "tags";

export const COL_LABELS: Record<PedidoColumnKey, string> = {
  fechaCreacion: "Fecha Creación",
  fechaValidacion: "Fecha Validación",
  idAmplifica: "ID Amplifica",
  seller: "Seller",
  sucursal: "Sucursal",
  canalVenta: "Canal de Venta",
  metodoEntrega: "Método Entrega",
  estadoPreparacion: "Estado Preparación",
  estadoEnvio: "Estado Envío",
  preparacion: "Preparación",
  entrega: "Entrega",
  tags: "Tags",
};

// All columns for "actual" version
export const COLS_ACTUAL: PedidoColumnKey[] = [
  "fechaCreacion", "fechaValidacion", "idAmplifica", "seller", "sucursal",
  "canalVenta", "metodoEntrega", "estadoPreparacion", "estadoEnvio",
  "preparacion", "entrega", "tags",
];

// Default columns for "mejorada" version
export const COLS_MEJORADA: PedidoColumnKey[] = [
  "fechaCreacion", "seller", "sucursal", "canalVenta",
  "metodoEntrega", "estadoPreparacion", "entrega",
];

export const COL_WIDTHS_ACTUAL: Record<PedidoColumnKey, string> = {
  fechaCreacion: "min-w-[120px]",
  fechaValidacion: "min-w-[120px]",
  idAmplifica: "min-w-[130px]",
  seller: "min-w-[100px]",
  sucursal: "min-w-[100px]",
  canalVenta: "min-w-[110px]",
  metodoEntrega: "min-w-[130px]",
  estadoPreparacion: "",
  estadoEnvio: "",
  preparacion: "",
  entrega: "",
  tags: "",
};

export const COL_WIDTHS_MEJORADA: Record<PedidoColumnKey, string> = {
  fechaCreacion: "min-w-[130px]",
  fechaValidacion: "min-w-[130px]",
  idAmplifica: "min-w-[140px]",
  seller: "min-w-[120px]",
  sucursal: "min-w-[120px]",
  canalVenta: "min-w-[120px]",
  metodoEntrega: "min-w-[140px]",
  estadoPreparacion: "",
  estadoEnvio: "",
  preparacion: "",
  entrega: "",
  tags: "",
};

// ─── Detail types ────────────────────────────────────────────────────────────
export type DireccionEnvio = {
  nombre: string;
  telefono: string;
  email: string;
  calle: string;
  numero: string;
  depto?: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigoPostal?: string;
  instrucciones?: string;
};

export type CotizacionEnvio = {
  courier: string;
  servicio: string;
  costoNeto: number;
  costoCliente: number;
  subsidioAmplifica: number;
  tiempoEstimado: string;
  trackingUrl?: string;
  trackingNumber?: string;
  estado: "vigente" | "expirada" | "requiere_recotizacion";
};

export type ProductoDetalle = {
  id: string;
  sku: string;
  nombre: string;
  barcode: string;
  imagen?: string;
  cantidad: number;
  precioUnitario: number;
};

export type EventoTimeline = {
  id: string;
  timestamp: string;
  tipo: "creacion" | "validacion" | "preparacion" | "empaque" | "envio" | "entrega" | "cancelacion" | "incidencia" | "sistema" | "etiqueta";
  titulo: string;
  descripcion?: string;
  usuario?: string;
  badges?: { label: string; color: string }[];
};

export type Incidencia = {
  id: string;
  tipo: string;
  descripcion: string;
  estado: "abierta" | "en_gestion" | "resuelta";
  responsable?: string;
  creadoEn: string;
  resueltaEn?: string;
  usuario: string;
  costoAsociado?: number;
  observaciones?: string;
};

export type Notificacion = {
  id: string;
  tipo: "email" | "sms" | "webhook";
  asunto: string;
  destinatario: string;
  estado: "enviada" | "fallida" | "pendiente" | "desactivada";
  timestamp: string;
  motivo?: string;
  htmlPreview?: string;
};

export type PedidoDetalle = Pedido & {
  destinatario: DireccionEnvio;
  cotizacion: CotizacionEnvio | null;
  courierInfo?: {
    tipo: string;
    idExterno?: string;
    eta?: string;
    riderNombre?: string;
    riderTelefono?: string;
  };
  productos: ProductoDetalle[];
  timeline: EventoTimeline[];
  incidencias: Incidencia[];
  notificaciones: Notificacion[];
  paquete: string;
  volumenTotal: string;
  montoTotal: number;
  idExterno?: string;
  idOrigen?: string;
  metodoPago?: string;
  notas?: string;
  muestraPromocional?: boolean;
  esOrdenMuerta: boolean;
  pickingBottleneck: boolean;
  requiereRecotizacion: boolean;
  diasSinMovimiento?: number;
  // Desglose económico de la orden
  subtotal?: number;
  descuentos?: number;
  impuestos?: number;
  costoEnvioOrden?: number;
  fechaEnvio?: string;
  // Dimensiones estructuradas del paquete
  dimensiones?: {
    peso: number;   // kg
    largo: number;  // cm
    ancho: number;  // cm
    alto: number;   // cm
  };
  // Historial: actores involucrados y eficiencia
  actoresInvolucrados?: {
    nombre: string;
    rol: string;
  }[];
  eficienciaCiclo?: {
    porcentaje: number;
    delta: string;
  };
  // SLA timeline per step
  slaTimeline?: Record<string, {
    fechaInicio?: string;
    fechaFin?: string;
    fechaProgramada?: string;
    rangoHorario?: string;
    slaStatus: "cumplido" | "pendiente" | "atrasado" | "en_riesgo";
  }>;
};

// ─── Mock detail data ────────────────────────────────────────────────────────
export const MOCK_PEDIDO_DETALLE: Record<number, PedidoDetalle> = {
  1196807: {
    // Base Pedido fields
    id: 1196807,
    fechaCreacion: "2026-03-19 22:15:36",
    fechaValidacion: "2026-03-19 22:16:01",
    idAmplifica: "S-BASIC61375",
    seller: "Basics",
    sucursal: "Quilicura",
    canalVenta: "Shopify",
    metodoEntrega: "Blue Express",
    estadoPreparacion: "Validado",
    estadoEnvio: "Pendiente",
    preparacion: [{ label: "Próximo: 16h", color: "blue" }],
    entrega: [{ label: "Próximo: 16h", color: "blue" }],
    tags: [],
    // Detail fields
    destinatario: {
      nombre: "Macarena Vidal Ulloa",
      telefono: "944054209",
      email: "macarenavidalulloa@gmail.com",
      calle: "Pasaje 2 El Peral",
      numero: "2",
      depto: "",
      comuna: "Los Ángeles",
      ciudad: "Los Ángeles",
      region: "Región del Biobío",
      instrucciones: "llamar a 9 44054209 para abrir portón",
    },
    cotizacion: {
      courier: "Blue Express",
      servicio: "Priority",
      costoNeto: 0,
      costoCliente: 0,
      subsidioAmplifica: 0,
      tiempoEstimado: "3-5 días hábiles",
      trackingNumber: undefined,
      trackingUrl: undefined,
      estado: "vigente",
    },
    courierInfo: undefined,
    productos: [
      {
        id: "prod-1",
        sku: "SBMES",
        nombre: "SLEEP BASICS - MAGNESIO BISGLICINATO 1mes",
        barcode: "7501234567890",
        imagen: undefined,
        cantidad: 1,
        precioUnitario: 14328,
      },
      {
        id: "prod-2",
        sku: "SBMESES",
        nombre: "Pack x6 unidades SLEEP BASICS - MAGNESIO BISGLICINATO 6 meses",
        barcode: "7509876543210",
        imagen: undefined,
        cantidad: 1,
        precioUnitario: 75222,
      },
    ],
    timeline: [
      {
        id: "evt-1",
        timestamp: "2026-03-19 22:15:36",
        tipo: "creacion",
        titulo: "Sistema Amplifica cambió el estado del pedido: Recibido → Validado",
        usuario: "Sistema Amplifica",
      },
      {
        id: "evt-2",
        timestamp: "2026-03-19 22:15:40",
        tipo: "sistema",
        titulo: "Sistema Amplifica modificó el pedido",
        usuario: "Sistema Amplifica",
      },
      {
        id: "evt-3",
        timestamp: "2026-03-19 22:15:45",
        tipo: "etiqueta",
        titulo: "Sistema Amplifica eliminó la etiqueta",
        usuario: "Sistema Amplifica",
        badges: [{ label: "Confirmando dirección (Consumidor)", color: "bg-green-50 text-green-700" }],
      },
      {
        id: "evt-4",
        timestamp: "2026-03-19 22:15:50",
        tipo: "sistema",
        titulo: "macarenavidalulloa@gmail.com (Cliente) modificó la dirección",
        usuario: "macarenavidalulloa@gmail.com",
      },
      {
        id: "evt-5",
        timestamp: "2026-03-19 22:16:01",
        tipo: "etiqueta",
        titulo: "Sistema Amplifica etiquetó al pedido con",
        usuario: "Sistema Amplifica",
        badges: [{ label: "Confirmando dirección (Consumidor)", color: "bg-green-50 text-green-700" }],
      },
      {
        id: "evt-6",
        timestamp: "2026-03-19 22:16:10",
        tipo: "sistema",
        titulo: "Sistema Amplifica agregó 1 producto(s) al pedido: Pack x6 unidades SLEEP BASICS - MAGNESIO BISGLICINATO 6 meses",
        usuario: "Sistema Amplifica",
      },
    ],
    incidencias: [
      {
        id: "inc-1",
        tipo: "—",
        descripcion: "",
        estado: "abierta",
        responsable: "—",
        creadoEn: "2026-03-19 22:15:36",
        usuario: "Sistema",
        costoAsociado: undefined,
        observaciones: "",
      },
    ],
    notificaciones: [
      {
        id: "notif-1",
        tipo: "email",
        asunto: "Pedido envío recibido",
        destinatario: "seller@basics.cl",
        estado: "desactivada",
        timestamp: "2026-03-19 22:16:10",
        motivo: "está desactivado en configuración para este seller",
      },
      {
        id: "notif-2",
        tipo: "email",
        asunto: "Solicitud de validación de dirección",
        destinatario: "macarenavidalulloa@gmail.com",
        estado: "enviada",
        timestamp: "2026-03-19 22:16:30",
        htmlPreview: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Validación de dirección</title></head><body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)"><tr><td style="background:#4f46e5;padding:24px 32px;text-align:center"><img src="https://placehold.co/140x36/4f46e5/white?text=amplifica" alt="Amplifica" style="height:36px" /></td></tr><tr><td style="padding:32px"><h1 style="margin:0 0 8px;font-size:20px;color:#111827">Valida tu dirección de envío</h1><p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">Hola Macarena, necesitamos que confirmes la dirección de entrega para tu pedido <strong style="color:#111827">S-BASIC61375</strong>.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px"><tr><td style="padding:16px"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;font-weight:600">Dirección actual</p><p style="margin:0;font-size:14px;color:#374151;font-weight:500">Pasaje 2 El Peral 2, Los Ángeles</p></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr><td style="padding:12px 16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e"><p style="margin:0;font-size:13px;color:#166534"><strong>Productos:</strong> 2 unidades — Monto total: $89.550</p></td></tr></table><table cellpadding="0" cellspacing="0"><tr><td style="background:#4f46e5;border-radius:8px;padding:12px 24px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">Confirmar dirección</a></td></tr></table><p style="margin:24px 0 0;font-size:12px;color:#9ca3af">Si la dirección es incorrecta, haz clic en el botón para actualizarla.</p></td></tr><tr><td style="padding:20px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:11px;color:#9ca3af">Amplifica · Santiago, Chile · <a href="#" style="color:#6366f1;text-decoration:none">Desuscribirse</a></p></td></tr></table></td></tr></table></body></html>`,
      },
      {
        id: "notif-3",
        tipo: "email",
        asunto: "Confirmación de pedido #S-BASIC61375",
        destinatario: "macarenavidalulloa@gmail.com",
        estado: "enviada",
        timestamp: "2026-03-19 22:15:00",
        htmlPreview: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmación de pedido</title></head><body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)"><tr><td style="background:#4f46e5;padding:24px 32px;text-align:center"><img src="https://placehold.co/140x36/4f46e5/white?text=amplifica" alt="Amplifica" style="height:36px" /></td></tr><tr><td style="padding:32px"><h1 style="margin:0 0 8px;font-size:20px;color:#111827">¡Pedido confirmado!</h1><p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">Hola Macarena, tu pedido <strong style="color:#111827">S-BASIC61375</strong> ha sido recibido y está siendo procesado.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:24px"><tr><td style="padding:16px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#166534;font-weight:600;padding-bottom:8px">Resumen del pedido</td></tr><tr><td style="font-size:14px;color:#374151">2 productos · $89.550</td></tr><tr><td style="font-size:13px;color:#6b7280;padding-top:4px">Envío: Blue Express Priority</td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px"><tr><td style="padding:16px"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;font-weight:600">Dirección de entrega</p><p style="margin:0;font-size:14px;color:#374151;font-weight:500">Pasaje 2 El Peral 2, Los Ángeles</p></td></tr></table><table cellpadding="0" cellspacing="0"><tr><td style="background:#4f46e5;border-radius:8px;padding:12px 24px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">Ver mi pedido</a></td></tr></table></td></tr><tr><td style="padding:20px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:11px;color:#9ca3af">Amplifica · Santiago, Chile · <a href="#" style="color:#6366f1;text-decoration:none">Desuscribirse</a></p></td></tr></table></td></tr></table></body></html>`,
      },
      {
        id: "notif-4",
        tipo: "email",
        asunto: "Tu pedido está en preparación",
        destinatario: "macarenavidalulloa@gmail.com",
        estado: "pendiente",
        timestamp: "2026-03-20 10:00:00",
      },
    ],
    paquete: "Caja Chica (10×10 ×10) - Peso: 1kg",
    volumenTotal: "3.771 cm³",
    montoTotal: 89550,
    idExterno: "61375",
    idOrigen: "6633502948575",
    metodoPago: "—",
    notas: undefined,
    muestraPromocional: false,
    esOrdenMuerta: false,
    pickingBottleneck: false,
    requiereRecotizacion: false,
    diasSinMovimiento: undefined,
    // Desglose económico
    subtotal: 89550,
    descuentos: 0,
    impuestos: 17015,
    costoEnvioOrden: 0,
    fechaEnvio: undefined,
    // Dimensiones
    dimensiones: { peso: 1, largo: 10, ancho: 10, alto: 10 },
    // Historial
    actoresInvolucrados: [
      { nombre: "Roberto G. Mora", rol: "Validador de Almacén" },
      { nombre: "Automated Dispatcher", rol: "Sistema de Logística v4.2" },
    ],
    eficienciaCiclo: { porcentaje: 94.2, delta: "+2.1% vs Promedio" },
    // SLA timeline
    slaTimeline: {
      "Recepción": {
        fechaInicio: "2026-03-19T22:15:00",
        slaStatus: "cumplido",
      },
      "Validación": {
        fechaInicio: "2026-03-19T22:15:36",
        fechaFin: "2026-03-19T22:16:01",
        slaStatus: "cumplido",
      },
      "Preparación": {
        fechaProgramada: "2026-03-21T10:00:00",
        fechaFin: "2026-03-23T15:00:00",
        slaStatus: "pendiente",
      },
      "Empaque": {
        fechaProgramada: "2026-03-23T16:00:00",
        slaStatus: "pendiente",
      },
      "Retiro": {
        fechaProgramada: "2026-03-23T15:00:00",
        slaStatus: "pendiente",
      },
      "Entrega": {
        fechaProgramada: "2026-03-24T15:00:00",
        rangoHorario: "15:00 – 20:00 hrs",
        slaStatus: "pendiente",
      },
    },
  },
};

// ─── Mock data ───────────────────────────────────────────────────────────────
function sla(label: string, color: SLABadge["color"], version?: string): SLABadge {
  return { label, color, version };
}

export const PEDIDOS: Pedido[] = [
  // ─── Pendiente ──────────────────────────────────────────────────────────────
  { id: 1196807, fechaCreacion: "Hoy a las 22:15", fechaValidacion: "-", idAmplifica: "S-BASIC61375", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Pendiente", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue")], entrega: [sla("Próximo: 16h", "blue")], tags: [] },
  { id: 1196806, fechaCreacion: "Hoy a las 22:14", fechaValidacion: "Hoy a las 22:15", idAmplifica: "S-MANA813599", seller: "Manabu", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Pendiente", estadoEnvio: "No Proporcionado", preparacion: [sla("Próximo: 16h", "blue")], entrega: [sla("Próximo: 16h", "blue")], tags: [] },
  { id: 1196805, fechaCreacion: "Hoy a las 22:14", fechaValidacion: "Hoy a las 22:15", idAmplifica: "S-ERGO922214", seller: "Ergopouch", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Pendiente", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 14h", "blue")], entrega: [sla("Próximo: 14h", "blue")], tags: [] },

  // ─── Validado ───────────────────────────────────────────────────────────────
  { id: 1196804, fechaCreacion: "Hoy a las 22:13", fechaValidacion: "Hoy a las 22:14", idAmplifica: "S-OKWU109857", seller: "Okwu", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Validado", estadoEnvio: "Solicitado", preparacion: [sla("Próximo: 15h", "blue", "2.0"), sla("Próximo: 23h", "red", "2.0")], entrega: [sla("Próximo: 23h", "red", "2.0")], tags: [] },
  { id: 1196803, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:13", idAmplifica: "S-MANA813598", seller: "Manabu", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Validado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue")], entrega: [sla("Próximo: 16h", "blue")], tags: [] },
  { id: 1196802, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "W-LACO571O4", seller: "La Cocinería", sucursal: "La Reina", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Validado", estadoEnvio: "Solicitado", preparacion: [sla("Próximo: 12h", "blue")], entrega: [sla("Próximo: 12h", "blue")], tags: [] },

  // ─── En preparación ─────────────────────────────────────────────────────────
  { id: 1196801, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:13", idAmplifica: "S-MAMA428273", seller: "MamáMía", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Solicitado", preparacion: [sla("Próximo: 16h", "blue", "2.0"), sla("Próximo: 4d", "red", "2.0")], entrega: [sla("Próximo: 4d", "red", "2.0")], tags: [] },
  { id: 1196790, fechaCreacion: "Hoy a las 21:45", fechaValidacion: "Hoy a las 21:50", idAmplifica: "S-ERGO922200", seller: "Ergopouch", sucursal: "Providencia", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 18h", "blue")], entrega: [sla("Próximo: 24h", "blue")], tags: [] },

  // ─── Por empacar ────────────────────────────────────────────────────────────
  { id: 1196800, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "S-BASIC61374", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Por empacar", estadoEnvio: "Programado", preparacion: [sla("Próximo: 15h", "blue", "2.0"), sla("Próximo: 23h", "red", "2.0")], entrega: [sla("Próximo: 23h", "red", "2.0")], tags: [] },
  { id: 1196785, fechaCreacion: "Hoy a las 20:30", fechaValidacion: "Hoy a las 20:35", idAmplifica: "F-OKWU109840", seller: "Okwu", sucursal: "Centro", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Por empacar", estadoEnvio: "Solicitado", preparacion: [sla("Próximo: 20h", "blue")], entrega: [sla("Próximo: 3d", "blue")], tags: [] },

  // ─── Empacado ───────────────────────────────────────────────────────────────
  { id: 1196799, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "S-SAIN743878", seller: "Saint Venik", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Empacado", estadoEnvio: "Retirado por courier", preparacion: [sla("Próximo: 16h", "blue", "2.0"), sla("Próximo: 3d", "red", "2.0")], entrega: [sla("Próximo: 3d", "red", "2.0")], tags: [] },
  { id: 1196798, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "S-BASIC61373", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Empacado", estadoEnvio: "Enviado", preparacion: [sla("Próximo: 15h", "blue", "2.0"), sla("Próximo: 23h", "red", "2.0")], entrega: [sla("Próximo: 23h", "red", "2.0")], tags: [] },
  { id: 1196780, fechaCreacion: "Hoy a las 19:30", fechaValidacion: "Hoy a las 19:35", idAmplifica: "M-MANA813580", seller: "Manabu", sucursal: "La Reina", canalVenta: "MercadoLibre", metodoEntrega: "Blue Express", estadoPreparacion: "Empacado", estadoEnvio: "En Ruta Final", preparacion: [], entrega: [sla("Próximo: 2d", "blue")], tags: [] },

  // ─── Listo para retiro ──────────────────────────────────────────────────────
  { id: 1196795, fechaCreacion: "Ayer a las 18:10", fechaValidacion: "Ayer a las 18:15", idAmplifica: "S-LACO571O0", seller: "La Cocinería", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Listo para retiro", estadoEnvio: "Listo para retiro", preparacion: [], entrega: [sla("Próximo: 8h", "blue")], tags: [] },
  { id: 1196794, fechaCreacion: "Ayer a las 17:50", fechaValidacion: "Ayer a las 17:55", idAmplifica: "S-ERGO922190", seller: "Ergopouch", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Listo para retiro", estadoEnvio: "Retirado por courier", preparacion: [], entrega: [sla("Próximo: 6h", "green")], tags: [] },
  { id: 1196793, fechaCreacion: "Ayer a las 16:30", fechaValidacion: "Ayer a las 16:40", idAmplifica: "W-MAMA428260", seller: "MamáMía", sucursal: "La Reina", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Listo para retiro", estadoEnvio: "Enviado", preparacion: [], entrega: [sla("Próximo: 4h", "green")], tags: [] },

  // ─── Entregado ──────────────────────────────────────────────────────────────
  { id: 1196788, fechaCreacion: "16/03/2026 14:20", fechaValidacion: "16/03/2026 14:25", idAmplifica: "S-BASIC61368", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Entregado", estadoEnvio: "Entregado", preparacion: [], entrega: [], tags: ["a tiempo"] },
  { id: 1196787, fechaCreacion: "16/03/2026 13:00", fechaValidacion: "16/03/2026 13:05", idAmplifica: "F-SAIN743870", seller: "Saint Venik", sucursal: "Providencia", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Entregado", estadoEnvio: "Retirado", preparacion: [], entrega: [], tags: ["a tiempo"] },

  // ─── Con atraso ─────────────────────────────────────────────────────────────
  { id: 1196796, fechaCreacion: "15/03/2026 10:20", fechaValidacion: "15/03/2026 10:30", idAmplifica: "S-OKWU109850", seller: "Okwu", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Atrasado", preparacion: [sla("Atrasado: 2h", "red")], entrega: [sla("Atrasado: 8h", "red")], tags: [], conAtraso: true },
  { id: 1196791, fechaCreacion: "14/03/2026 09:00", fechaValidacion: "14/03/2026 09:10", idAmplifica: "S-MANA813590", seller: "Manabu", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Validado", estadoEnvio: "Intento de Entrega", preparacion: [sla("Atrasado: 6h", "red")], entrega: [sla("Atrasado: 1d", "red")], tags: [], conAtraso: true },
  { id: 1196789, fechaCreacion: "13/03/2026 11:30", fechaValidacion: "13/03/2026 11:40", idAmplifica: "W-LACO571O2", seller: "La Cocinería", sucursal: "La Reina", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Empacado", estadoEnvio: "Requiere atención", preparacion: [], entrega: [sla("Atrasado: 12h", "red")], tags: [], conAtraso: true },
  { id: 1196786, fechaCreacion: "12/03/2026 16:00", fechaValidacion: "12/03/2026 16:10", idAmplifica: "M-ERGO922195", seller: "Ergopouch", sucursal: "Providencia", canalVenta: "MercadoLibre", metodoEntrega: "Blue Express", estadoPreparacion: "Por empacar", estadoEnvio: "En ruta a devolución", preparacion: [sla("Atrasado: 1d", "red")], entrega: [sla("Atrasado: 2d", "red")], tags: [], conAtraso: true },

  // ─── Cancelado ──────────────────────────────────────────────────────────────
  { id: 1196784, fechaCreacion: "11/03/2026 08:45", fechaValidacion: "11/03/2026 08:50", idAmplifica: "S-MAMA428250", seller: "MamáMía", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Cancelado", estadoEnvio: "Cancelado", preparacion: [], entrega: [], tags: [] },
  { id: 1196783, fechaCreacion: "10/03/2026 15:20", fechaValidacion: "10/03/2026 15:30", idAmplifica: "F-OKWU109835", seller: "Okwu", sucursal: "Centro", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Cancelado", estadoEnvio: "Devuelto", preparacion: [], entrega: [], tags: [] },

  // ─── Extra — más variedad ───────────────────────────────────────────────────
  { id: 1196782, fechaCreacion: "Hoy a las 21:00", fechaValidacion: "-", idAmplifica: "S-SAIN743875", seller: "Saint Venik", sucursal: "Providencia", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Pendiente", estadoEnvio: "No Proporcionado", preparacion: [sla("Próximo: 20h", "blue")], entrega: [sla("Próximo: 20h", "blue")], tags: [] },
  { id: 1196781, fechaCreacion: "Hoy a las 20:45", fechaValidacion: "Hoy a las 20:50", idAmplifica: "M-BASIC61370", seller: "Basics", sucursal: "La Reina", canalVenta: "MercadoLibre", metodoEntrega: "Blue Express", estadoPreparacion: "Validado", estadoEnvio: "Solicitado", preparacion: [sla("Próximo: 22h", "blue")], entrega: [sla("Próximo: 22h", "blue")], tags: [] },
  { id: 1196779, fechaCreacion: "Ayer a las 19:00", fechaValidacion: "Ayer a las 19:10", idAmplifica: "S-LACO571O1", seller: "La Cocinería", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Empacado", estadoEnvio: "En Ruta a Pickup", preparacion: [], entrega: [sla("Próximo: 1d", "blue")], tags: [] },
  { id: 1196778, fechaCreacion: "Ayer a las 15:30", fechaValidacion: "Ayer a las 15:40", idAmplifica: "W-OKWU109830", seller: "Okwu", sucursal: "Providencia", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Listo para retiro", estadoEnvio: "Listo para retiro", preparacion: [], entrega: [sla("Próximo: 10h", "blue")], tags: [] },
  { id: 1196777, fechaCreacion: "17/03/2026 10:00", fechaValidacion: "17/03/2026 10:10", idAmplifica: "S-MANA813595", seller: "Manabu", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Solicitado", preparacion: [sla("Próximo: 10h", "blue")], entrega: [sla("Próximo: 18h", "blue")], tags: [] },
  { id: 1196776, fechaCreacion: "17/03/2026 09:30", fechaValidacion: "17/03/2026 09:40", idAmplifica: "F-ERGO922205", seller: "Ergopouch", sucursal: "La Reina", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Por empacar", estadoEnvio: "Programado", preparacion: [sla("Próximo: 12h", "blue")], entrega: [sla("Próximo: 2d", "blue")], tags: [] },

  // ─── Generados programáticamente (70 pedidos adicionales) ──────────────────
  ...generateExtraPedidos(),
];

function generateExtraPedidos(): Pedido[] {
  const sellers = ["Basics", "Manabu", "Ergopouch", "Okwu", "La Cocinería", "MamáMía", "Saint Venik", "NutriPro", "VitaFit", "BioNature"];
  const sucursales = ["Quilicura", "Centro", "La Reina", "Providencia", "Las Condes", "Lo Barnechea", "Santiago Centro"];
  const canales = ["Shopify", "MercadoLibre", "Falabella", "Woocommerce", "Paris"];
  const metodos = ["Blue Express", "Fazt", "Amplifica Priority", "Retiro en tienda", "Chilexpress"];
  const prefixMap: Record<string, string> = { Shopify: "S", MercadoLibre: "M", Falabella: "F", Woocommerce: "W", Paris: "P" };

  const estados: { estado: PedidoStatus; envios: EnvioStatus[]; weight: number }[] = [
    { estado: "Pendiente", envios: ["Pendiente", "No Proporcionado"], weight: 12 },
    { estado: "Validado", envios: ["Pendiente", "Solicitado"], weight: 10 },
    { estado: "En preparación", envios: ["Pendiente", "Solicitado"], weight: 10 },
    { estado: "Por empacar", envios: ["Solicitado", "Programado"], weight: 8 },
    { estado: "Empacado", envios: ["Retirado por courier", "Enviado", "En Ruta Final", "En Ruta a Pickup"], weight: 10 },
    { estado: "Listo para retiro", envios: ["Listo para retiro", "Enviado", "Retirado por courier"], weight: 8 },
    { estado: "Entregado", envios: ["Entregado", "Retirado"], weight: 6 },
    { estado: "Cancelado", envios: ["Cancelado", "Devuelto", "Expirado"], weight: 4 },
  ];

  const enviosAtraso: EnvioStatus[] = ["Atrasado", "Intento de Entrega", "Requiere atención", "En ruta a devolución"];

  const pick = <T,>(arr: T[], seed: number): T => arr[seed % arr.length];
  const hrs = (seed: number) => (8 + (seed % 14)).toString().padStart(2, "0");
  const mins = (seed: number) => ((seed * 7) % 60).toString().padStart(2, "0");

  const result: Pedido[] = [];
  let idCounter = 1196750;

  for (let i = 0; i < 70; i++) {
    const seed = i * 17 + 3;
    const seller = pick(sellers, seed);
    const sucursal = pick(sucursales, seed + 5);
    const canal = pick(canales, seed + 2);
    const metodo = pick(metodos, seed + 7);
    const prefix = prefixMap[canal] || "S";
    const sellerCode = seller.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 4);
    const idAmplifica = `${prefix}-${sellerCode}${100000 + idCounter % 100000}`;

    // Pick estado weighted
    const totalWeight = estados.reduce((s, e) => s + e.weight, 0);
    let w = (seed * 13) % totalWeight;
    let estadoInfo = estados[0];
    for (const e of estados) { w -= e.weight; if (w < 0) { estadoInfo = e; break; } }

    const day = 1 + (i % 18);
    const month = day <= 18 ? "03" : "02";
    const fecha = `${day.toString().padStart(2, "0")}/${month}/2026 ${hrs(seed)}:${mins(seed)}`;
    const fechaVal = estadoInfo.estado === "Pendiente" && i % 3 === 0 ? "-" : fecha;

    const conAtraso = i % 9 === 0 && estadoInfo.estado !== "Entregado" && estadoInfo.estado !== "Cancelado";

    // Pick envio status
    const envio: EnvioStatus = conAtraso
      ? pick(enviosAtraso, seed + 11)
      : pick(estadoInfo.envios, seed + 11);

    let prep: SLABadge[] = [];
    let entr: SLABadge[] = [];
    if (conAtraso) {
      const h = 1 + (i % 24);
      prep = [sla(`Atrasado: ${h}h`, "red")];
      entr = [sla(`Atrasado: ${h + 4}h`, "red")];
    } else if (estadoInfo.estado !== "Entregado" && estadoInfo.estado !== "Cancelado") {
      const h = 4 + (i % 36);
      if (estadoInfo.estado !== "Listo para retiro") prep = [sla(`Próximo: ${h}h`, h > 20 ? "amber" : "blue")];
      entr = [sla(`Próximo: ${h + 8}h`, h + 8 > 30 ? "amber" : "blue")];
    }

    const tags: string[] = estadoInfo.estado === "Entregado" ? [i % 2 === 0 ? "a tiempo" : "con retraso"] : [];

    result.push({
      id: idCounter,
      fechaCreacion: fecha,
      fechaValidacion: fechaVal,
      idAmplifica,
      seller,
      sucursal,
      canalVenta: canal,
      metodoEntrega: metodo,
      estadoPreparacion: estadoInfo.estado,
      estadoEnvio: envio,
      preparacion: prep,
      entrega: entr,
      tags,
      conAtraso: conAtraso || undefined,
    });

    idCounter--;
  }
  return result;
}
