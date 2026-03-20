import type { PedidoStatus } from "@/components/pedidos/PedidoStatusBadge";

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
  estadoEnvio: string;
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
  "Todos":             { active: "bg-primary-500 text-white", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Pendiente":         { active: "bg-neutral-200 text-neutral-700", inactive: "bg-neutral-200/70 text-neutral-500" },
  "Validado":          { active: "bg-sky-100 text-sky-700",         inactive: "bg-sky-100/60 text-sky-600/70" },
  "En preparación":    { active: "bg-primary-100 text-primary-700", inactive: "bg-primary-100/60 text-primary-600/70" },
  "Por empacar":       { active: "bg-amber-100 text-amber-700",     inactive: "bg-amber-100/60 text-amber-600/70" },
  "Empacado":          { active: "bg-indigo-100 text-indigo-700",   inactive: "bg-indigo-100/60 text-indigo-600/70" },
  "Listo para retiro": { active: "bg-green-100 text-green-700",     inactive: "bg-green-100/60 text-green-600/70" },
  "Con atraso":        { active: "bg-red-100 text-red-700",         inactive: "bg-red-100/60 text-red-600/70" },
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
  "estadoPreparacion", "entrega",
];

export const COL_WIDTHS_ACTUAL: Record<PedidoColumnKey, string> = {
  fechaCreacion: "w-[120px]",
  fechaValidacion: "w-[120px]",
  idAmplifica: "w-[130px]",
  seller: "w-[100px]",
  sucursal: "w-[100px]",
  canalVenta: "w-[110px]",
  metodoEntrega: "w-[130px]",
  estadoPreparacion: "w-[130px]",
  estadoEnvio: "w-[100px]",
  preparacion: "w-[160px]",
  entrega: "w-[180px]",
  tags: "w-[60px]",
};

export const COL_WIDTHS_MEJORADA: Record<PedidoColumnKey, string> = {
  fechaCreacion: "w-[140px]",
  fechaValidacion: "w-[140px]",
  idAmplifica: "w-[150px]",
  seller: "w-[130px]",
  sucursal: "w-[130px]",
  canalVenta: "w-[130px]",
  metodoEntrega: "w-[150px]",
  estadoPreparacion: "min-w-[200px] w-[200px]",
  estadoEnvio: "w-[120px]",
  preparacion: "w-[180px]",
  entrega: "min-w-[200px] w-[200px]",
  tags: "w-[80px]",
};

// ─── Mock data ───────────────────────────────────────────────────────────────
function sla(label: string, color: SLABadge["color"], version?: string): SLABadge {
  return { label, color, version };
}

export const PEDIDOS: Pedido[] = [
  // ─── Pendiente ──────────────────────────────────────────────────────────────
  { id: 1196807, fechaCreacion: "Hoy a las 22:15", fechaValidacion: "-", idAmplifica: "S-BASIC61375", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Pendiente", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue")], entrega: [sla("Próximo: 16h", "blue")], tags: [] },
  { id: 1196806, fechaCreacion: "Hoy a las 22:14", fechaValidacion: "Hoy a las 22:15", idAmplifica: "S-MANA813599", seller: "Manabu", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Pendiente", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue")], entrega: [sla("Próximo: 16h", "blue")], tags: [] },
  { id: 1196805, fechaCreacion: "Hoy a las 22:14", fechaValidacion: "Hoy a las 22:15", idAmplifica: "S-ERGO922214", seller: "Ergopouch", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Pendiente", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 14h", "blue")], entrega: [sla("Próximo: 14h", "blue")], tags: [] },

  // ─── Validado ───────────────────────────────────────────────────────────────
  { id: 1196804, fechaCreacion: "Hoy a las 22:13", fechaValidacion: "Hoy a las 22:14", idAmplifica: "S-OKWU109857", seller: "Okwu", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Validado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 15h", "blue", "2.0"), sla("Próximo: 23h", "red", "2.0")], entrega: [sla("Próximo: 23h", "red", "2.0")], tags: [] },
  { id: 1196803, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:13", idAmplifica: "S-MANA813598", seller: "Manabu", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Validado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue")], entrega: [sla("Próximo: 16h", "blue")], tags: [] },
  { id: 1196802, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "W-LACO571O4", seller: "La Cocinería", sucursal: "La Reina", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Validado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 12h", "blue")], entrega: [sla("Próximo: 12h", "blue")], tags: [] },

  // ─── En preparación ─────────────────────────────────────────────────────────
  { id: 1196801, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:13", idAmplifica: "S-MAMA428273", seller: "MamáMía", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue", "2.0"), sla("Próximo: 4d", "red", "2.0")], entrega: [sla("Próximo: 4d", "red", "2.0")], tags: [] },
  { id: 1196790, fechaCreacion: "Hoy a las 21:45", fechaValidacion: "Hoy a las 21:50", idAmplifica: "S-ERGO922200", seller: "Ergopouch", sucursal: "Providencia", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 18h", "blue")], entrega: [sla("Próximo: 24h", "blue")], tags: [] },

  // ─── Por empacar ────────────────────────────────────────────────────────────
  { id: 1196800, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "S-BASIC61374", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Por empacar", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 15h", "blue", "2.0"), sla("Próximo: 23h", "red", "2.0")], entrega: [sla("Próximo: 23h", "red", "2.0")], tags: [] },
  { id: 1196785, fechaCreacion: "Hoy a las 20:30", fechaValidacion: "Hoy a las 20:35", idAmplifica: "F-OKWU109840", seller: "Okwu", sucursal: "Centro", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Por empacar", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 20h", "blue")], entrega: [sla("Próximo: 3d", "blue")], tags: [] },

  // ─── Empacado ───────────────────────────────────────────────────────────────
  { id: 1196799, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "S-SAIN743878", seller: "Saint Venik", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Empacado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 16h", "blue", "2.0"), sla("Próximo: 3d", "red", "2.0")], entrega: [sla("Próximo: 3d", "red", "2.0")], tags: [] },
  { id: 1196798, fechaCreacion: "Hoy a las 22:12", fechaValidacion: "Hoy a las 22:12", idAmplifica: "S-BASIC61373", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Empacado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 15h", "blue", "2.0"), sla("Próximo: 23h", "red", "2.0")], entrega: [sla("Próximo: 23h", "red", "2.0")], tags: [] },
  { id: 1196780, fechaCreacion: "Hoy a las 19:30", fechaValidacion: "Hoy a las 19:35", idAmplifica: "M-MANA813580", seller: "Manabu", sucursal: "La Reina", canalVenta: "MercadoLibre", metodoEntrega: "Blue Express", estadoPreparacion: "Empacado", estadoEnvio: "En tránsito", preparacion: [], entrega: [sla("Próximo: 2d", "blue")], tags: [] },

  // ─── Listo para retiro ──────────────────────────────────────────────────────
  { id: 1196795, fechaCreacion: "Ayer a las 18:10", fechaValidacion: "Ayer a las 18:15", idAmplifica: "S-LACO571O0", seller: "La Cocinería", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Listo para retiro", estadoEnvio: "Por retirar", preparacion: [], entrega: [sla("Próximo: 8h", "blue")], tags: [] },
  { id: 1196794, fechaCreacion: "Ayer a las 17:50", fechaValidacion: "Ayer a las 17:55", idAmplifica: "S-ERGO922190", seller: "Ergopouch", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Listo para retiro", estadoEnvio: "Por retirar", preparacion: [], entrega: [sla("Próximo: 6h", "green")], tags: [] },
  { id: 1196793, fechaCreacion: "Ayer a las 16:30", fechaValidacion: "Ayer a las 16:40", idAmplifica: "W-MAMA428260", seller: "MamáMía", sucursal: "La Reina", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Listo para retiro", estadoEnvio: "Por retirar", preparacion: [], entrega: [sla("Próximo: 4h", "green")], tags: [] },

  // ─── Entregado ──────────────────────────────────────────────────────────────
  { id: 1196788, fechaCreacion: "16/03/2026 14:20", fechaValidacion: "16/03/2026 14:25", idAmplifica: "S-BASIC61368", seller: "Basics", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Entregado", estadoEnvio: "Entregado", preparacion: [], entrega: [], tags: ["a tiempo"] },
  { id: 1196787, fechaCreacion: "16/03/2026 13:00", fechaValidacion: "16/03/2026 13:05", idAmplifica: "F-SAIN743870", seller: "Saint Venik", sucursal: "Providencia", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Entregado", estadoEnvio: "Entregado", preparacion: [], entrega: [], tags: ["a tiempo"] },

  // ─── Con atraso ─────────────────────────────────────────────────────────────
  { id: 1196796, fechaCreacion: "15/03/2026 10:20", fechaValidacion: "15/03/2026 10:30", idAmplifica: "S-OKWU109850", seller: "Okwu", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Pendiente", preparacion: [sla("Atrasado: 2h", "red")], entrega: [sla("Atrasado: 8h", "red")], tags: [], conAtraso: true },
  { id: 1196791, fechaCreacion: "14/03/2026 09:00", fechaValidacion: "14/03/2026 09:10", idAmplifica: "S-MANA813590", seller: "Manabu", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Validado", estadoEnvio: "Pendiente", preparacion: [sla("Atrasado: 6h", "red")], entrega: [sla("Atrasado: 1d", "red")], tags: [], conAtraso: true },
  { id: 1196789, fechaCreacion: "13/03/2026 11:30", fechaValidacion: "13/03/2026 11:40", idAmplifica: "W-LACO571O2", seller: "La Cocinería", sucursal: "La Reina", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Empacado", estadoEnvio: "En tránsito", preparacion: [], entrega: [sla("Atrasado: 12h", "red")], tags: [], conAtraso: true },
  { id: 1196786, fechaCreacion: "12/03/2026 16:00", fechaValidacion: "12/03/2026 16:10", idAmplifica: "M-ERGO922195", seller: "Ergopouch", sucursal: "Providencia", canalVenta: "MercadoLibre", metodoEntrega: "Blue Express", estadoPreparacion: "Por empacar", estadoEnvio: "Pendiente", preparacion: [sla("Atrasado: 1d", "red")], entrega: [sla("Atrasado: 2d", "red")], tags: [], conAtraso: true },

  // ─── Cancelado ──────────────────────────────────────────────────────────────
  { id: 1196784, fechaCreacion: "11/03/2026 08:45", fechaValidacion: "11/03/2026 08:50", idAmplifica: "S-MAMA428250", seller: "MamáMía", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Cancelado", estadoEnvio: "Cancelado", preparacion: [], entrega: [], tags: [] },
  { id: 1196783, fechaCreacion: "10/03/2026 15:20", fechaValidacion: "10/03/2026 15:30", idAmplifica: "F-OKWU109835", seller: "Okwu", sucursal: "Centro", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Cancelado", estadoEnvio: "Cancelado", preparacion: [], entrega: [], tags: [] },

  // ─── Extra — más variedad ───────────────────────────────────────────────────
  { id: 1196782, fechaCreacion: "Hoy a las 21:00", fechaValidacion: "-", idAmplifica: "S-SAIN743875", seller: "Saint Venik", sucursal: "Providencia", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "Pendiente", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 20h", "blue")], entrega: [sla("Próximo: 20h", "blue")], tags: [] },
  { id: 1196781, fechaCreacion: "Hoy a las 20:45", fechaValidacion: "Hoy a las 20:50", idAmplifica: "M-BASIC61370", seller: "Basics", sucursal: "La Reina", canalVenta: "MercadoLibre", metodoEntrega: "Blue Express", estadoPreparacion: "Validado", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 22h", "blue")], entrega: [sla("Próximo: 22h", "blue")], tags: [] },
  { id: 1196779, fechaCreacion: "Ayer a las 19:00", fechaValidacion: "Ayer a las 19:10", idAmplifica: "S-LACO571O1", seller: "La Cocinería", sucursal: "Centro", canalVenta: "Shopify", metodoEntrega: "Fazt", estadoPreparacion: "Empacado", estadoEnvio: "En tránsito", preparacion: [], entrega: [sla("Próximo: 1d", "blue")], tags: [] },
  { id: 1196778, fechaCreacion: "Ayer a las 15:30", fechaValidacion: "Ayer a las 15:40", idAmplifica: "W-OKWU109830", seller: "Okwu", sucursal: "Providencia", canalVenta: "Woocommerce", metodoEntrega: "Amplifica Priority", estadoPreparacion: "Listo para retiro", estadoEnvio: "Por retirar", preparacion: [], entrega: [sla("Próximo: 10h", "blue")], tags: [] },
  { id: 1196777, fechaCreacion: "17/03/2026 10:00", fechaValidacion: "17/03/2026 10:10", idAmplifica: "S-MANA813595", seller: "Manabu", sucursal: "Quilicura", canalVenta: "Shopify", metodoEntrega: "Blue Express", estadoPreparacion: "En preparación", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 10h", "blue")], entrega: [sla("Próximo: 18h", "blue")], tags: [] },
  { id: 1196776, fechaCreacion: "17/03/2026 09:30", fechaValidacion: "17/03/2026 09:40", idAmplifica: "F-ERGO922205", seller: "Ergopouch", sucursal: "La Reina", canalVenta: "Falabella", metodoEntrega: "Retiro en tienda", estadoPreparacion: "Por empacar", estadoEnvio: "Pendiente", preparacion: [sla("Próximo: 12h", "blue")], entrega: [sla("Próximo: 2d", "blue")], tags: [] },

  // ─── Generados programáticamente (70 pedidos adicionales) ──────────────────
  ...generateExtraPedidos(),
];

function generateExtraPedidos(): Pedido[] {
  const sellers = ["Basics", "Manabu", "Ergopouch", "Okwu", "La Cocinería", "MamáMía", "Saint Venik", "NutriPro", "VitaFit", "BioNature"];
  const sucursales = ["Quilicura", "Centro", "La Reina", "Providencia", "Las Condes", "Lo Barnechea", "Santiago Centro"];
  const canales = ["Shopify", "MercadoLibre", "Falabella", "Woocommerce", "Paris"];
  const metodos = ["Blue Express", "Fazt", "Amplifica Priority", "Retiro en tienda", "Chilexpress"];
  const prefixMap: Record<string, string> = { Shopify: "S", MercadoLibre: "M", Falabella: "F", Woocommerce: "W", Paris: "P" };

  const estados: { estado: PedidoStatus; envio: string; weight: number }[] = [
    { estado: "Pendiente", envio: "Pendiente", weight: 12 },
    { estado: "Validado", envio: "Pendiente", weight: 10 },
    { estado: "En preparación", envio: "Pendiente", weight: 10 },
    { estado: "Por empacar", envio: "Pendiente", weight: 8 },
    { estado: "Empacado", envio: "En tránsito", weight: 10 },
    { estado: "Listo para retiro", envio: "Por retirar", weight: 8 },
    { estado: "Entregado", envio: "Entregado", weight: 6 },
    { estado: "Cancelado", envio: "Cancelado", weight: 4 },
  ];

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
      estadoEnvio: estadoInfo.envio,
      preparacion: prep,
      entrega: entr,
      tags,
      conAtraso: conAtraso || undefined,
    });

    idCounter--;
  }
  return result;
}
