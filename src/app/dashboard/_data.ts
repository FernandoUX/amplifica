// ─── Mock Data: Dashboard C-Level ────────────────────────────────────────────

// KPIs are now defined inline in page.tsx with icons

// ─── Ventas por Canal (simplificado: Top 5 + Otros) ─────────────────────────
export type ChannelItem = { name: string; value: number; color: string };

export const CHANNELS: ChannelItem[] = [
  { name: "Cornershop",  value: 1_250_000_000, color: "#5B5BFF" },
  { name: "Rappi",       value: 820_000_000,   color: "#E84393" },
  { name: "PedidosYa",   value: 480_000_000,   color: "#FEDE00" },
  { name: "Justo",       value: 310_000_000,   color: "#3DDB85" },
  { name: "Web",         value: 215_000_000,   color: "#5B5BFF80" },
  { name: "Otros",       value: 320_491_104,   color: "#D1D5DB" },
];

// ─── Ventas por Sucursal ─────────────────────────────────────────────────────
export const BRANCH_COLORS: Record<string, string> = {
  "Lo Barnechea":   "#5B5BFF",
  "Centro":         "#E84393",
  "La Reina":       "#FEDE00",
  "Quilicura":      "#3DDB85",
};

export type BranchItem = { name: string; value: number };

export const BRANCHES: BranchItem[] = [
  { name: "Lo Barnechea", value: 1_420_000_000 },
  { name: "Centro",       value: 890_000_000 },
  { name: "La Reina",     value: 650_000_000 },
  { name: "Quilicura",    value: 435_491_104 },
];

// ─── Ventas por Tienda (stacked por sucursal) ────────────────────────────────
export type StoreItem = {
  tienda: string;
  "Lo Barnechea": number;
  "Centro": number;
  "La Reina": number;
  "Quilicura": number;
};

export const STORES: StoreItem[] = [
  { tienda: "Okwu",              "Lo Barnechea": 680_000_000, "Centro": 42_000_000,  "La Reina": 38_000_000,  "Quilicura": 12_000_000 },
  { tienda: "Mundo Fungi",       "Lo Barnechea": 210_000_000, "Centro": 95_000_000,  "La Reina": 45_000_000,  "Quilicura": 18_000_000 },
  { tienda: "Basics",            "Lo Barnechea": 120_000_000, "Centro": 140_000_000, "La Reina": 85_000_000,  "Quilicura": 60_000_000 },
  { tienda: "Xclusive",          "Lo Barnechea": 95_000_000,  "Centro": 130_000_000, "La Reina": 90_000_000,  "Quilicura": 70_000_000 },
  { tienda: "Saint Venik",       "Lo Barnechea": 80_000_000,  "Centro": 110_000_000, "La Reina": 95_000_000,  "Quilicura": 65_000_000 },
  { tienda: "Ortomolecular",     "Lo Barnechea": 70_000_000,  "Centro": 85_000_000,  "La Reina": 78_000_000,  "Quilicura": 55_000_000 },
  { tienda: "Japi Jane",         "Lo Barnechea": 55_000_000,  "Centro": 80_000_000,  "La Reina": 72_000_000,  "Quilicura": 48_000_000 },
  { tienda: "Tere Gott",         "Lo Barnechea": 50_000_000,  "Centro": 75_000_000,  "La Reina": 60_000_000,  "Quilicura": 42_000_000 },
  { tienda: "Your Goal",         "Lo Barnechea": 35_000_000,  "Centro": 68_000_000,  "La Reina": 50_000_000,  "Quilicura": 38_000_000 },
  { tienda: "Fuel Nutrition",    "Lo Barnechea": 25_000_000,  "Centro": 65_000_000,  "La Reina": 37_000_000,  "Quilicura": 27_000_000 },
];

// ─── Ventas por día (line chart) ─────────────────────────────────────────────
export type DailyItem = {
  date: string;
  "Lo Barnechea": number;
  "Centro": number;
  "La Reina": number;
  "Quilicura": number;
};

export const DAILY_SALES: DailyItem[] = [
  { date: "2026-02-18", "Lo Barnechea": 42_000_000, "Centro": 25_000_000, "La Reina": 18_000_000, "Quilicura": 12_000_000 },
  { date: "2026-02-19", "Lo Barnechea": 48_000_000, "Centro": 27_000_000, "La Reina": 21_000_000, "Quilicura": 14_000_000 },
  { date: "2026-02-20", "Lo Barnechea": 38_000_000, "Centro": 30_000_000, "La Reina": 19_000_000, "Quilicura": 11_000_000 },
  { date: "2026-02-21", "Lo Barnechea": 55_000_000, "Centro": 26_000_000, "La Reina": 23_000_000, "Quilicura": 15_000_000 },
  { date: "2026-02-22", "Lo Barnechea": 52_000_000, "Centro": 32_000_000, "La Reina": 17_000_000, "Quilicura": 13_000_000 },
  { date: "2026-02-23", "Lo Barnechea": 35_000_000, "Centro": 22_000_000, "La Reina": 15_000_000, "Quilicura": 10_000_000 },
  { date: "2026-02-24", "Lo Barnechea": 60_000_000, "Centro": 35_000_000, "La Reina": 25_000_000, "Quilicura": 16_000_000 },
  { date: "2026-02-25", "Lo Barnechea": 58_000_000, "Centro": 33_000_000, "La Reina": 22_000_000, "Quilicura": 18_000_000 },
  { date: "2026-02-26", "Lo Barnechea": 50_000_000, "Centro": 29_000_000, "La Reina": 20_000_000, "Quilicura": 14_000_000 },
  { date: "2026-02-27", "Lo Barnechea": 65_000_000, "Centro": 38_000_000, "La Reina": 28_000_000, "Quilicura": 19_000_000 },
  { date: "2026-02-28", "Lo Barnechea": 45_000_000, "Centro": 24_000_000, "La Reina": 16_000_000, "Quilicura": 12_000_000 },
  { date: "2026-03-01", "Lo Barnechea": 70_000_000, "Centro": 40_000_000, "La Reina": 30_000_000, "Quilicura": 20_000_000 },
  { date: "2026-03-02", "Lo Barnechea": 62_000_000, "Centro": 36_000_000, "La Reina": 26_000_000, "Quilicura": 17_000_000 },
  { date: "2026-03-03", "Lo Barnechea": 55_000_000, "Centro": 31_000_000, "La Reina": 22_000_000, "Quilicura": 15_000_000 },
  { date: "2026-03-04", "Lo Barnechea": 78_000_000, "Centro": 42_000_000, "La Reina": 32_000_000, "Quilicura": 22_000_000 },
  { date: "2026-03-05", "Lo Barnechea": 68_000_000, "Centro": 38_000_000, "La Reina": 28_000_000, "Quilicura": 18_000_000 },
  { date: "2026-03-06", "Lo Barnechea": 72_000_000, "Centro": 35_000_000, "La Reina": 25_000_000, "Quilicura": 16_000_000 },
  { date: "2026-03-07", "Lo Barnechea": 58_000_000, "Centro": 30_000_000, "La Reina": 21_000_000, "Quilicura": 14_000_000 },
  { date: "2026-03-08", "Lo Barnechea": 40_000_000, "Centro": 22_000_000, "La Reina": 16_000_000, "Quilicura": 11_000_000 },
  { date: "2026-03-09", "Lo Barnechea": 82_000_000, "Centro": 45_000_000, "La Reina": 35_000_000, "Quilicura": 24_000_000 },
  { date: "2026-03-10", "Lo Barnechea": 75_000_000, "Centro": 41_000_000, "La Reina": 30_000_000, "Quilicura": 21_000_000 },
  { date: "2026-03-11", "Lo Barnechea": 90_000_000, "Centro": 48_000_000, "La Reina": 38_000_000, "Quilicura": 26_000_000 },
  { date: "2026-03-12", "Lo Barnechea": 85_000_000, "Centro": 44_000_000, "La Reina": 33_000_000, "Quilicura": 23_000_000 },
  { date: "2026-03-13", "Lo Barnechea": 95_000_000, "Centro": 50_000_000, "La Reina": 40_000_000, "Quilicura": 28_000_000 },
  { date: "2026-03-14", "Lo Barnechea": 80_000_000, "Centro": 43_000_000, "La Reina": 34_000_000, "Quilicura": 22_000_000 },
  { date: "2026-03-15", "Lo Barnechea": 105_000_000,"Centro": 55_000_000, "La Reina": 42_000_000, "Quilicura": 30_000_000 },
  { date: "2026-03-16", "Lo Barnechea": 98_000_000, "Centro": 52_000_000, "La Reina": 38_000_000, "Quilicura": 27_000_000 },
  { date: "2026-03-17", "Lo Barnechea": 110_000_000,"Centro": 58_000_000, "La Reina": 45_000_000, "Quilicura": 32_000_000 },
  { date: "2026-03-18", "Lo Barnechea": 115_000_000,"Centro": 60_000_000, "La Reina": 48_000_000, "Quilicura": 35_000_000 },
];

// ─── Top Productos ───────────────────────────────────────────────────────────
export type ProductItem = {
  sku: string;
  producto: string;
  cantidad: number;
  montoTotal: number;
  tienda: string;
};

export const TOP_PRODUCTS: ProductItem[] = [
  { sku: "A023",           producto: "Brocha Base Pro Travel",                                    cantidad: 4120, montoTotal: 49_398_800, tienda: "Okwu" },
  { sku: "7804676870225",  producto: "Cookies Cacao",                                             cantidad: 3883, montoTotal: 1_843_879,  tienda: "Under Five" },
  { sku: "BR001",          producto: "Bolsa chica",                                               cantidad: 3848, montoTotal: 3_635,      tienda: "Okwu" },
  { sku: "7804676870218",  producto: "Cookies Manzana",                                           cantidad: 3448, montoTotal: 1_627_983,  tienda: "Under Five" },
  { sku: "BR002",          producto: "Bolsa Mediana",                                             cantidad: 3058, montoTotal: 2_929,      tienda: "Okwu" },
  { sku: "200101",         producto: "PROTEIN BITE CHOCOLATE CRUNCH - UNIDAD 1 un",               cantidad: 2988, montoTotal: 5_404_025,  tienda: "Your Goal" },
  { sku: "GMF50",          producto: "Melena de León en Gotas - Ultra Concentrado 50ML",          cantidad: 2436, montoTotal: 43_561_845, tienda: "Mundo Fungi" },
  { sku: "CALM2024V1BLACK",producto: "Calm Black",                                                cantidad: 2022, montoTotal: 36_084_923, tienda: "Mute" },
  { sku: "SV-BOX",         producto: "Box Packaging",                                             cantidad: 1897, montoTotal: 1_896,      tienda: "Saint Venik" },
  { sku: "200405",         producto: "PROTEIN BITE CARAMEL PEANUTS SALTY - DISPLAY 4 UNIDADES",   cantidad: 1853, montoTotal: 13_697_298, tienda: "Your Goal" },
];

// ─── Orders table (Vista por Pedidos) ────────────────────────────────────────
export type OrderItem = {
  id: number;
  codigoPedido: string;
  nroBoleta: string;
  canalVenta: string;
  montoTotal: number;
  fecha: string;
  sucursal: string;
  tienda: string;
};

export const ORDERS_TABLE: OrderItem[] = [
  { id: 1150804, codigoPedido: "S-BASIC58484", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 65426, fecha: "2026-02-23 21:13:45", sucursal: "Lo Barnechea", tienda: "Basics" },
  { id: 1150796, codigoPedido: "S-BASIC58483", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 51098, fecha: "2026-02-23 21:07:52", sucursal: "Lo Barnechea", tienda: "Basics" },
  { id: 1150788, codigoPedido: "S-BASIC58481", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 132854, fecha: "2026-02-23 21:04:42", sucursal: "Lo Barnechea", tienda: "Basics" },
  { id: 1150761, codigoPedido: "S-MELLY5284", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 90282, fecha: "2026-02-23 20:42:34", sucursal: "Lo Barnechea", tienda: "Melly Mood" },
  { id: 1150760, codigoPedido: "S-NUTRI9103", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 34990, fecha: "2026-02-23 20:42:09", sucursal: "Lo Barnechea", tienda: "NutriFoods" },
  { id: 1150756, codigoPedido: "S-MANAB12880", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 15800, fecha: "2026-02-23 20:39:29", sucursal: "Lo Barnechea", tienda: "Manabu" },
  { id: 1150752, codigoPedido: "S-SAINT40762", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 23741, fecha: "2026-02-23 20:37:11", sucursal: "Lo Barnechea", tienda: "Saint Venik" },
  { id: 1150750, codigoPedido: "S-BORAN13112", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 54974, fecha: "2026-02-23 20:36:51", sucursal: "Lo Barnechea", tienda: "Borangora" },
  { id: 1150748, codigoPedido: "S-BASIC58479", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 51098, fecha: "2026-02-23 20:35:50", sucursal: "Lo Barnechea", tienda: "Basics" },
  { id: 1150740, codigoPedido: "S-OKWU28844", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 89900, fecha: "2026-02-23 20:30:12", sucursal: "Lo Barnechea", tienda: "Okwu" },
  { id: 1150735, codigoPedido: "S-MUTE6721", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 45990, fecha: "2026-02-23 20:28:33", sucursal: "Quilicura", tienda: "Mute" },
  { id: 1150730, codigoPedido: "S-FUNGI4455", nroBoleta: "Producto sin boleta", canalVenta: "Shopify", montoTotal: 67800, fecha: "2026-02-23 20:25:01", sucursal: "Quilicura", tienda: "Mundo Fungi" },
];

// ─── Product-Order table (Vista por Producto Pedido) ─────────────────────────
export type ProductOrderItem = {
  sku: string;
  producto: string;
  codigoPedido: string;
  nroBoleta: string;
  fechaEntrega: string;
  fechaBoleta: string;
  precioUnitario: number;
};

export const PRODUCT_ORDERS_TABLE: ProductOrderItem[] = [
  { sku: "CCSA-200-103", producto: "Compota 0% fragancia 120ml", codigoPedido: "S-DLSAV7694", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:37:40", fechaBoleta: "Producto sin boleta", precioUnitario: 13515 },
  { sku: "CLGNx1", producto: "GRASS-FED COLLAGEN PEPTIDES 1 mes", codigoPedido: "S-BASIC58501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:35:22", fechaBoleta: "Producto sin boleta", precioUnitario: 19900 },
  { sku: "SB3MESES", producto: "Pack x3 unidades SLEEP BASICS - MAGNESIO BISGLICINATO", codigoPedido: "S-BASIC58501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:35:22", fechaBoleta: "Producto sin boleta", precioUnitario: 44490 },
  { sku: "OMG33", producto: "Pack x3 unidades OMEGA-3 (800 EPA- 400 DHA)", codigoPedido: "S-BASIC58501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:35:22", fechaBoleta: "Producto sin boleta", precioUnitario: 39990 },
  { sku: "CLGNx1", producto: "GRASS-FED COLLAGEN PEPTIDES 1 mes", codigoPedido: "S-BASIC58501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:35:22", fechaBoleta: "Producto sin boleta", precioUnitario: 15920 },
  { sku: "THESUPERELIXIR", producto: "The Super Elixir WelleCo", codigoPedido: "S-MUSEE2501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:32:58", fechaBoleta: "Producto sin boleta", precioUnitario: 85876 },
  { sku: "CUCHARAELIXIR", producto: "Cuchara Elixir WelleCo", codigoPedido: "S-MUSEE2501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:32:58", fechaBoleta: "Producto sin boleta", precioUnitario: 5000 },
  { sku: "CLEARHYDRATORBOT", producto: "Clear Hydrator Bottle", codigoPedido: "S-MUSEE2501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:32:58", fechaBoleta: "Producto sin boleta", precioUnitario: 19990 },
  { sku: "8809932160699", producto: "Máscara EXOSOMAS Galvánica Energética LuciDor (6 unidades)", codigoPedido: "S-MUSEE2501", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:32:58", fechaBoleta: "Producto sin boleta", precioUnitario: 75000 },
  { sku: "4WBLBM", producto: "Bra Long Navy M", codigoPedido: "S-4WOME2089", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:32:15", fechaBoleta: "Producto sin boleta", precioUnitario: 24990 },
  { sku: "NUTRI-2", producto: "Nutri Protein +", codigoPedido: "S-NUTRI9105", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:28:44", fechaBoleta: "Producto sin boleta", precioUnitario: 45990 },
  { sku: "SB1MES", producto: "SLEEP BASICS - MAGNESIO BISGLICINATO 1mes", codigoPedido: "S-BASIC58499", nroBoleta: "Producto sin boleta", fechaEntrega: "2026-02-23 22:22:47", fechaBoleta: "Producto sin boleta", precioUnitario: 17910 },
];

// ─── Formatter helpers ───────────────────────────────────────────────────────
export function fmtCLP(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

export function fmtShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
