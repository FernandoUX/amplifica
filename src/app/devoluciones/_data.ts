import type { ReturnStatus } from "@/components/devoluciones/ReturnStatusBadge";

// ─── Return origin type ──────────────────────────────────────────────────────
export type ReturnOrigin = "externa";

// ─── Return item record ──────────────────────────────────────────────────────
export type ReturnItemRecord = {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  returnReason: string;
};

// ─── Return record ───────────────────────────────────────────────────────────
export type ReturnRecord = {
  id: string;
  displayId: string;              // RET-SELLER-NNN
  orderId: string | null;         // nullable if unknown
  orderDisplayId: string | null;
  sellerId: string;
  sellerName: string;
  origin: ReturnOrigin;
  status: ReturnStatus;
  branchName: string;             // sucursal de recepción
  currentBranchName: string;      // ubicación actual
  courier: string;
  salesChannel: string;
  photoEvidenceUrls: string[];
  receivedByUserName: string | null;
  receivedAt: string | null;      // ISO date
  createdAt: string;              // ISO date
  location: string | null;        // ubicación física en bodega (MEJORA-6)
  pickupGroupId: string | null;
  transferOrderId: string | null;
  cancellationReason: string | null;
  items: ReturnItemRecord[];
};

// ─── Unknown package type ────────────────────────────────────────────────────
export type UnknownPackage = {
  id: string;
  photoUrl: string;
  location: string;
  branchName: string;
  receivedByUserName: string;
  receivedAt: string;
  resolvedAs: "devolucion" | "recepcion" | null;
  resolvedId: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────
export const RETURN_REASONS = [
  "Defectuoso",
  "Producto equivocado",
  "Dañado en transporte",
  "No deseado",
  "Incompleto",
  "Otro",
];

export const SELLERS = [
  { id: "s-extralife",   name: "Extra Life" },
  { id: "s-levice",      name: "Le Vice" },
  { id: "s-gohard",      name: "GoHard" },
  { id: "s-bekoko",      name: "Bekoko" },
  { id: "s-fungi",       name: "Mundo Fungi" },
  { id: "s-xclusive",    name: "Xclusive" },
  { id: "s-boqa",        name: "Boqa" },
  { id: "s-mindnut",     name: "Mind Nutrition" },
  { id: "s-basics",      name: "Basics" },
  { id: "s-yourgoal",    name: "Your Goal" },
  { id: "s-mamamia",     name: "MamáMía" },
  { id: "s-saintvenik",   name: "Saint Venik" },
  { id: "s-teregott",    name: "Teregott" },
  { id: "s-ergopouch",   name: "Ergopouch" },
  { id: "s-okwu",        name: "Okwu" },
  { id: "s-manabu",      name: "Manabu" },
];

export const BRANCHES = [
  "Quilicura",
  "Santiago Centro",
  "La Reina",
  "Lo Barnechea",
  "CD Quilicura",
];

export const COURIERS = [
  "Blue Express",
  "Chilexpress",
  "Starken",
  "Uber Direct",
  "Entrega presencial",
  "No identificado",
];

export const SALES_CHANNELS = [
  "Falabella",
  "MercadoLibre",
  "Shopify",
  "Venta directa",
  "No identificado",
];

// ─── Mock data — 40 returns ──────────────────────────────────────────────────

export const MOCK_RETURNS: ReturnRecord[] = [
  // ── creada (4) — Pre-created by seller, waiting for physical arrival ──────
  {
    id: "ret-001", displayId: "RET-FUNGI-001",
    orderId: "PED-8821", orderDisplayId: "PED-8821",
    sellerId: "s-fungi", sellerName: "Mundo Fungi",
    origin: "externa", status: "creada",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Blue Express", salesChannel: "Falabella",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-03-27T09:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-001a", sku: "MF-100", productName: "Mundo Fungi Shiitake Deshidratado 200g", quantity: 3, returnReason: "Defectuoso" },
    ],
  },
  {
    id: "ret-002", displayId: "RET-VICE-042",
    orderId: null, orderDisplayId: null,
    sellerId: "s-levice", sellerName: "Le Vice",
    origin: "externa", status: "creada",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "No identificado", salesChannel: "No identificado",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-03-26T14:30:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-003", displayId: "RET-XCLU-018",
    orderId: "PED-9102", orderDisplayId: "PED-9102",
    sellerId: "s-xclusive", sellerName: "Xclusive",
    origin: "externa", status: "creada",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "Chilexpress", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-03-26T11:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-003a", sku: "XC-055", productName: "Xclusive Mochila Urbana Negra", quantity: 1, returnReason: "Dañado en transporte" },
    ],
  },
  {
    id: "ret-004", displayId: "RET-ERGO-007",
    orderId: null, orderDisplayId: null,
    sellerId: "s-ergopouch", sellerName: "Ergopouch",
    origin: "externa", status: "creada",
    branchName: "Lo Barnechea", currentBranchName: "Lo Barnechea",
    courier: "Starken", salesChannel: "Shopify",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-03-25T16:45:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },

  // ── recibida_en_bodega (10) ───────────────────────────────────────────────
  {
    id: "ret-005", displayId: "RET-GOHARD-015",
    orderId: "PED-8790", orderDisplayId: "PED-8790",
    sellerId: "s-gohard", sellerName: "GoHard",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Blue Express", salesChannel: "Falabella",
    photoEvidenceUrls: ["/photos/ret-005-1.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-25T10:30:00",
    createdAt: "2026-03-24T08:00:00", location: "A-02-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-005a", sku: "GH-001", productName: "GoHard Proteína Vegana 1kg Chocolate", quantity: 2, returnReason: "Producto equivocado" },
      { id: "ri-005b", sku: "GH-009", productName: "GoHard BCAA 500g Mango", quantity: 1, returnReason: "Defectuoso" },
    ],
  },
  {
    id: "ret-006", displayId: "RET-BEKOKO-009",
    orderId: "PED-8755", orderDisplayId: "PED-8755",
    sellerId: "s-bekoko", sellerName: "Bekoko",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "Chilexpress", salesChannel: "MercadoLibre",
    photoEvidenceUrls: ["/photos/ret-006-1.jpg", "/photos/ret-006-2.jpg"], receivedByUserName: "María González", receivedAt: "2026-03-24T14:00:00",
    createdAt: "2026-03-23T11:30:00", location: "B-01-03",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-006a", sku: "BK-022", productName: "Bekoko Barras Energéticas Pack x12", quantity: 5, returnReason: "Dañado en transporte" },
    ],
  },
  {
    id: "ret-007", displayId: "RET-MIND-033",
    orderId: null, orderDisplayId: null,
    sellerId: "s-mindnut", sellerName: "Mind Nutrition",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "No identificado", salesChannel: "No identificado",
    photoEvidenceUrls: ["/photos/ret-007-1.jpg"], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-23T09:15:00",
    createdAt: "2026-03-22T15:00:00", location: "C-03-02",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-008", displayId: "RET-EXTRA-028",
    orderId: "PED-8680", orderDisplayId: "PED-8680",
    sellerId: "s-extralife", sellerName: "Extra Life",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Blue Express", salesChannel: "Shopify",
    photoEvidenceUrls: [], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-22T11:00:00",
    createdAt: "2026-03-21T08:30:00", location: "A-04-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-008a", sku: "EL-010", productName: "Extra Life Vitamina C 1000mg x60", quantity: 10, returnReason: "Incompleto" },
    ],
  },
  {
    id: "ret-009", displayId: "RET-MAMA-005",
    orderId: "PED-8622", orderDisplayId: "PED-8622",
    sellerId: "s-mamamia", sellerName: "MamáMía",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Lo Barnechea", currentBranchName: "Lo Barnechea",
    courier: "Uber Direct", salesChannel: "Venta directa",
    photoEvidenceUrls: ["/photos/ret-009-1.jpg"], receivedByUserName: "Ana López", receivedAt: "2026-03-21T16:00:00",
    createdAt: "2026-03-20T13:45:00", location: "D-01-02",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-009a", sku: "MM-018", productName: "MamáMía Pañales Ecológicos Talla M x24", quantity: 2, returnReason: "No deseado" },
    ],
  },
  {
    id: "ret-010", displayId: "RET-BOQA-021",
    orderId: null, orderDisplayId: null,
    sellerId: "s-boqa", sellerName: "Boqa",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Starken", salesChannel: "Falabella",
    photoEvidenceUrls: [], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-20T10:00:00",
    createdAt: "2026-03-19T14:30:00", location: "A-05-03",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-011", displayId: "RET-SAINT-012",
    orderId: "PED-8590", orderDisplayId: "PED-8590",
    sellerId: "s-saintvenik", sellerName: "Saint Venik",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "Chilexpress", salesChannel: "MercadoLibre",
    photoEvidenceUrls: ["/photos/ret-011-1.jpg"], receivedByUserName: "María González", receivedAt: "2026-03-19T09:30:00",
    createdAt: "2026-03-18T11:00:00", location: "B-02-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-011a", sku: "SV-012", productName: "Saint Venik Shampoo Natural Lavanda 400ml", quantity: 4, returnReason: "Defectuoso" },
    ],
  },
  {
    id: "ret-012", displayId: "RET-TERE-008",
    orderId: "PED-8545", orderDisplayId: "PED-8545",
    sellerId: "s-teregott", sellerName: "Teregott",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "Blue Express", salesChannel: "Shopify",
    photoEvidenceUrls: [], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-18T15:45:00",
    createdAt: "2026-03-17T09:00:00", location: "C-01-04",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-012a", sku: "TG-007", productName: "Teregott Crema Facial Antioxidante 50ml", quantity: 3, returnReason: "Producto equivocado" },
    ],
  },
  {
    id: "ret-013", displayId: "RET-OKWU-004",
    orderId: null, orderDisplayId: null,
    sellerId: "s-okwu", sellerName: "Okwu",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "No identificado", salesChannel: "No identificado",
    photoEvidenceUrls: ["/photos/ret-013-1.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-17T11:20:00",
    createdAt: "2026-03-16T08:00:00", location: "A-06-02",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-014", displayId: "RET-MANABU-011",
    orderId: "PED-8510", orderDisplayId: "PED-8510",
    sellerId: "s-manabu", sellerName: "Manabu",
    origin: "externa", status: "recibida_en_bodega",
    branchName: "Lo Barnechea", currentBranchName: "Lo Barnechea",
    courier: "Uber Direct", salesChannel: "Venta directa",
    photoEvidenceUrls: [], receivedByUserName: "Ana López", receivedAt: "2026-03-16T14:00:00",
    createdAt: "2026-03-15T10:30:00", location: "D-02-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-014a", sku: "MN-014", productName: "Manabu Té Verde Sencha Hojas 200g", quantity: 6, returnReason: "Dañado en transporte" },
    ],
  },

  // ── lista_para_devolver (8) ───────────────────────────────────────────────
  {
    id: "ret-015", displayId: "RET-XCLU-019",
    orderId: "PED-8410", orderDisplayId: "PED-8410",
    sellerId: "s-xclusive", sellerName: "Xclusive",
    origin: "externa", status: "lista_para_devolver",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Blue Express", salesChannel: "Falabella",
    photoEvidenceUrls: ["/photos/ret-015-1.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-12T09:00:00",
    createdAt: "2026-03-10T08:00:00", location: "A-07-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-015a", sku: "XC-030", productName: "Xclusive Billetera Cuero Premium", quantity: 2, returnReason: "No deseado" },
    ],
  },
  {
    id: "ret-016", displayId: "RET-BASICS-014",
    orderId: "PED-8388", orderDisplayId: "PED-8388",
    sellerId: "s-basics", sellerName: "Basics",
    origin: "externa", status: "lista_para_devolver",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "Chilexpress", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: "María González", receivedAt: "2026-03-11T14:30:00",
    createdAt: "2026-03-09T11:00:00", location: "B-03-02",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-016a", sku: "BS-041", productName: "Basics Toallas de Microfibra Pack x6", quantity: 3, returnReason: "Incompleto" },
    ],
  },
  {
    id: "ret-017", displayId: "RET-GOAL-022",
    orderId: null, orderDisplayId: null,
    sellerId: "s-yourgoal", sellerName: "Your Goal",
    origin: "externa", status: "lista_para_devolver",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "Starken", salesChannel: "Shopify",
    photoEvidenceUrls: ["/photos/ret-017-1.jpg"], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-10T10:00:00",
    createdAt: "2026-03-08T15:30:00", location: "C-02-03",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-018", displayId: "RET-FUNGI-002",
    orderId: "PED-8340", orderDisplayId: "PED-8340",
    sellerId: "s-fungi", sellerName: "Mundo Fungi",
    origin: "externa", status: "lista_para_devolver",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Blue Express", salesChannel: "Falabella",
    photoEvidenceUrls: [], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-09T09:00:00",
    createdAt: "2026-03-07T08:30:00", location: "A-08-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-018a", sku: "MF-105", productName: "Mundo Fungi Extracto Reishi 60 cáps", quantity: 8, returnReason: "Defectuoso" },
      { id: "ri-018b", sku: "MF-100", productName: "Mundo Fungi Shiitake Deshidratado 200g", quantity: 4, returnReason: "Dañado en transporte" },
    ],
  },
  {
    id: "ret-019", displayId: "RET-EXTRA-029",
    orderId: "PED-8305", orderDisplayId: "PED-8305",
    sellerId: "s-extralife", sellerName: "Extra Life",
    origin: "externa", status: "lista_para_devolver",
    branchName: "Lo Barnechea", currentBranchName: "Lo Barnechea",
    courier: "Uber Direct", salesChannel: "Venta directa",
    photoEvidenceUrls: ["/photos/ret-019-1.jpg", "/photos/ret-019-2.jpg"], receivedByUserName: "Ana López", receivedAt: "2026-03-08T16:00:00",
    createdAt: "2026-03-06T13:00:00", location: "D-03-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-019a", sku: "EL-015", productName: "Extra Life Omega-3 120 cáps", quantity: 5, returnReason: "Producto equivocado" },
    ],
  },
  {
    id: "ret-020", displayId: "RET-VICE-043",
    orderId: "PED-8280", orderDisplayId: "PED-8280",
    sellerId: "s-levice", sellerName: "Le Vice",
    origin: "externa", status: "lista_para_devolver",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "Chilexpress", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: "María González", receivedAt: "2026-03-07T11:00:00",
    createdAt: "2026-03-05T09:30:00", location: "B-04-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-020a", sku: "LV-002", productName: "Le Vice Bombones Artesanales 250g", quantity: 6, returnReason: "Dañado en transporte" },
    ],
  },
  {
    id: "ret-021", displayId: "RET-BOQA-022",
    orderId: null, orderDisplayId: null,
    sellerId: "s-boqa", sellerName: "Boqa",
    origin: "externa", status: "lista_para_devolver",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "No identificado", salesChannel: "No identificado",
    photoEvidenceUrls: ["/photos/ret-021-1.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-06T10:00:00",
    createdAt: "2026-03-04T14:00:00", location: "A-09-02",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-022", displayId: "RET-MIND-034",
    orderId: "PED-8240", orderDisplayId: "PED-8240",
    sellerId: "s-mindnut", sellerName: "Mind Nutrition",
    origin: "externa", status: "lista_para_devolver",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "Blue Express", salesChannel: "Shopify",
    photoEvidenceUrls: [], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-05T15:00:00",
    createdAt: "2026-03-03T10:30:00", location: "C-04-01",
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-022a", sku: "MN-020", productName: "Mind Nutrition Magnesio Bisglicinato 90 cáps", quantity: 4, returnReason: "Otro" },
    ],
  },

  // ── en_transferencia (3) ──────────────────────────────────────────────────
  {
    id: "ret-023", displayId: "RET-GOHARD-016",
    orderId: "PED-8190", orderDisplayId: "PED-8190",
    sellerId: "s-gohard", sellerName: "GoHard",
    origin: "externa", status: "en_transferencia",
    branchName: "La Reina", currentBranchName: "En tránsito",
    courier: "Starken", salesChannel: "Falabella",
    photoEvidenceUrls: ["/photos/ret-023-1.jpg"], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-01T10:00:00",
    createdAt: "2026-02-28T08:00:00", location: null,
    pickupGroupId: null, transferOrderId: "TRF-001", cancellationReason: null,
    items: [
      { id: "ri-023a", sku: "GH-015", productName: "GoHard Pre-Workout 300g", quantity: 3, returnReason: "Defectuoso" },
    ],
  },
  {
    id: "ret-024", displayId: "RET-BEKOKO-010",
    orderId: null, orderDisplayId: null,
    sellerId: "s-bekoko", sellerName: "Bekoko",
    origin: "externa", status: "en_transferencia",
    branchName: "Lo Barnechea", currentBranchName: "En tránsito",
    courier: "No identificado", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: "Ana López", receivedAt: "2026-02-27T14:00:00",
    createdAt: "2026-02-26T11:30:00", location: null,
    pickupGroupId: null, transferOrderId: "TRF-002", cancellationReason: null,
    items: [],
  },
  {
    id: "ret-025", displayId: "RET-SAINT-013",
    orderId: "PED-8155", orderDisplayId: "PED-8155",
    sellerId: "s-saintvenik", sellerName: "Saint Venik",
    origin: "externa", status: "en_transferencia",
    branchName: "Santiago Centro", currentBranchName: "En tránsito",
    courier: "Chilexpress", salesChannel: "Shopify",
    photoEvidenceUrls: ["/photos/ret-025-1.jpg"], receivedByUserName: "María González", receivedAt: "2026-02-25T09:30:00",
    createdAt: "2026-02-24T15:00:00", location: null,
    pickupGroupId: null, transferOrderId: "TRF-003", cancellationReason: null,
    items: [
      { id: "ri-025a", sku: "SV-020", productName: "Saint Venik Acondicionador Argán 400ml", quantity: 8, returnReason: "No deseado" },
    ],
  },

  // ── recibida_en_cd (2) ────────────────────────────────────────────────────
  {
    id: "ret-026", displayId: "RET-ERGO-008",
    orderId: "PED-8120", orderDisplayId: "PED-8120",
    sellerId: "s-ergopouch", sellerName: "Ergopouch",
    origin: "externa", status: "recibida_en_cd",
    branchName: "La Reina", currentBranchName: "CD Quilicura",
    courier: "Uber Direct", salesChannel: "Venta directa",
    photoEvidenceUrls: ["/photos/ret-026-1.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-02-20T10:00:00",
    createdAt: "2026-02-18T08:00:00", location: "CD-A-01-01",
    pickupGroupId: null, transferOrderId: "TRF-004", cancellationReason: null,
    items: [
      { id: "ri-026a", sku: "EP-030", productName: "Ergopouch Swaddle Bag 2.5 TOG 0-3m", quantity: 2, returnReason: "Producto equivocado" },
    ],
  },
  {
    id: "ret-027", displayId: "RET-OKWU-005",
    orderId: null, orderDisplayId: null,
    sellerId: "s-okwu", sellerName: "Okwu",
    origin: "externa", status: "recibida_en_cd",
    branchName: "Lo Barnechea", currentBranchName: "CD Quilicura",
    courier: "Starken", salesChannel: "Falabella",
    photoEvidenceUrls: [], receivedByUserName: "Juan Pérez", receivedAt: "2026-02-18T14:30:00",
    createdAt: "2026-02-16T11:00:00", location: "CD-B-02-01",
    pickupGroupId: null, transferOrderId: "TRF-005", cancellationReason: null,
    items: [],
  },

  // ── retirada_en_bodega (5) ────────────────────────────────────────────────
  {
    id: "ret-028", displayId: "RET-TERE-009",
    orderId: "PED-8050", orderDisplayId: "PED-8050",
    sellerId: "s-teregott", sellerName: "Teregott",
    origin: "externa", status: "retirada_en_bodega",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Entrega presencial", salesChannel: "Shopify",
    photoEvidenceUrls: ["/photos/ret-028-1.jpg", "/photos/ret-028-2.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-02-10T09:00:00",
    createdAt: "2026-02-08T14:00:00", location: null,
    pickupGroupId: "PG-001", transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-028a", sku: "TG-003", productName: "Teregott Sérum Vitamina C 30ml", quantity: 5, returnReason: "Defectuoso" },
    ],
  },
  {
    id: "ret-029", displayId: "RET-MANABU-012",
    orderId: "PED-8020", orderDisplayId: "PED-8020",
    sellerId: "s-manabu", sellerName: "Manabu",
    origin: "externa", status: "retirada_en_bodega",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "Entrega presencial", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: "María González", receivedAt: "2026-02-08T11:00:00",
    createdAt: "2026-02-06T09:30:00", location: null,
    pickupGroupId: "PG-002", transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-029a", sku: "MN-005", productName: "Manabu Matcha Orgánico Premium 100g", quantity: 3, returnReason: "No deseado" },
    ],
  },
  {
    id: "ret-030", displayId: "RET-MAMA-006",
    orderId: null, orderDisplayId: null,
    sellerId: "s-mamamia", sellerName: "MamáMía",
    origin: "externa", status: "retirada_en_bodega",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "Entrega presencial", salesChannel: "Venta directa",
    photoEvidenceUrls: ["/photos/ret-030-1.jpg"], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-15T10:30:00",
    createdAt: "2026-03-13T14:00:00", location: null,
    pickupGroupId: "PG-003", transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-031", displayId: "RET-EXTRA-030",
    orderId: "PED-7980", orderDisplayId: "PED-7980",
    sellerId: "s-extralife", sellerName: "Extra Life",
    origin: "externa", status: "retirada_en_bodega",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Entrega presencial", salesChannel: "Falabella",
    photoEvidenceUrls: [], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-18T09:00:00",
    createdAt: "2026-03-16T11:30:00", location: null,
    pickupGroupId: "PG-004", transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-031a", sku: "EL-020", productName: "Extra Life Probióticos 30 cáps", quantity: 12, returnReason: "Incompleto" },
    ],
  },
  {
    id: "ret-032", displayId: "RET-VICE-044",
    orderId: "PED-7950", orderDisplayId: "PED-7950",
    sellerId: "s-levice", sellerName: "Le Vice",
    origin: "externa", status: "retirada_en_bodega",
    branchName: "Lo Barnechea", currentBranchName: "Lo Barnechea",
    courier: "Entrega presencial", salesChannel: "Shopify",
    photoEvidenceUrls: ["/photos/ret-032-1.jpg"], receivedByUserName: "Ana López", receivedAt: "2026-03-20T14:00:00",
    createdAt: "2026-03-18T10:00:00", location: null,
    pickupGroupId: "PG-005", transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-032a", sku: "LV-008", productName: "Le Vice Alfajores Artesanales x6", quantity: 4, returnReason: "Dañado en transporte" },
    ],
  },

  // ── enviada_al_seller (5) ─────────────────────────────────────────────────
  {
    id: "ret-033", displayId: "RET-GOHARD-017",
    orderId: "PED-7900", orderDisplayId: "PED-7900",
    sellerId: "s-gohard", sellerName: "GoHard",
    origin: "externa", status: "enviada_al_seller",
    branchName: "Quilicura", currentBranchName: "Despachada",
    courier: "Blue Express", salesChannel: "Falabella",
    photoEvidenceUrls: ["/photos/ret-033-1.jpg"], receivedByUserName: "Juan Pérez", receivedAt: "2026-02-01T10:00:00",
    createdAt: "2026-01-30T08:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-033a", sku: "GH-001", productName: "GoHard Proteína Vegana 1kg Chocolate", quantity: 5, returnReason: "Defectuoso" },
    ],
  },
  {
    id: "ret-034", displayId: "RET-FUNGI-003",
    orderId: null, orderDisplayId: null,
    sellerId: "s-fungi", sellerName: "Mundo Fungi",
    origin: "externa", status: "enviada_al_seller",
    branchName: "Santiago Centro", currentBranchName: "Despachada",
    courier: "Chilexpress", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: "María González", receivedAt: "2026-02-05T14:00:00",
    createdAt: "2026-02-03T11:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [],
  },
  {
    id: "ret-035", displayId: "RET-XCLU-020",
    orderId: "PED-7860", orderDisplayId: "PED-7860",
    sellerId: "s-xclusive", sellerName: "Xclusive",
    origin: "externa", status: "enviada_al_seller",
    branchName: "La Reina", currentBranchName: "Despachada",
    courier: "Starken", salesChannel: "Shopify",
    photoEvidenceUrls: ["/photos/ret-035-1.jpg"], receivedByUserName: "Carlos Muñoz", receivedAt: "2026-03-01T09:30:00",
    createdAt: "2026-02-27T15:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-035a", sku: "XC-055", productName: "Xclusive Mochila Urbana Negra", quantity: 1, returnReason: "No deseado" },
    ],
  },
  {
    id: "ret-036", displayId: "RET-BASICS-015",
    orderId: "PED-7830", orderDisplayId: "PED-7830",
    sellerId: "s-basics", sellerName: "Basics",
    origin: "externa", status: "enviada_al_seller",
    branchName: "Quilicura", currentBranchName: "Despachada",
    courier: "Blue Express", salesChannel: "Venta directa",
    photoEvidenceUrls: [], receivedByUserName: "Juan Pérez", receivedAt: "2026-03-10T10:00:00",
    createdAt: "2026-03-08T08:30:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-036a", sku: "BS-050", productName: "Basics Set Organizadores Pack x4", quantity: 2, returnReason: "Incompleto" },
    ],
  },
  {
    id: "ret-037", displayId: "RET-MIND-035",
    orderId: "PED-7800", orderDisplayId: "PED-7800",
    sellerId: "s-mindnut", sellerName: "Mind Nutrition",
    origin: "externa", status: "enviada_al_seller",
    branchName: "Lo Barnechea", currentBranchName: "Despachada",
    courier: "Uber Direct", salesChannel: "Falabella",
    photoEvidenceUrls: ["/photos/ret-037-1.jpg"], receivedByUserName: "Ana López", receivedAt: "2026-03-12T14:30:00",
    createdAt: "2026-03-10T10:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: null,
    items: [
      { id: "ri-037a", sku: "MN-020", productName: "Mind Nutrition Magnesio Bisglicinato 90 cáps", quantity: 7, returnReason: "Otro" },
    ],
  },

  // ── cancelada (3) ─────────────────────────────────────────────────────────
  {
    id: "ret-038", displayId: "RET-BOQA-023",
    orderId: "PED-7750", orderDisplayId: "PED-7750",
    sellerId: "s-boqa", sellerName: "Boqa",
    origin: "externa", status: "cancelada",
    branchName: "Quilicura", currentBranchName: "Quilicura",
    courier: "Blue Express", salesChannel: "MercadoLibre",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-03-05T09:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: "Seller indicó que el pedido fue reenviado correctamente",
    items: [
      { id: "ri-038a", sku: "BQ-010", productName: "Boqa Taza Cerámica Artesanal 350ml", quantity: 2, returnReason: "Producto equivocado" },
    ],
  },
  {
    id: "ret-039", displayId: "RET-ERGO-009",
    orderId: null, orderDisplayId: null,
    sellerId: "s-ergopouch", sellerName: "Ergopouch",
    origin: "externa", status: "cancelada",
    branchName: "Santiago Centro", currentBranchName: "Santiago Centro",
    courier: "No identificado", salesChannel: "Shopify",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-02-20T11:00:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: "Devolución duplicada, ya existe RET-ERGO-008",
    items: [],
  },
  {
    id: "ret-040", displayId: "RET-GOAL-023",
    orderId: "PED-7700", orderDisplayId: "PED-7700",
    sellerId: "s-yourgoal", sellerName: "Your Goal",
    origin: "externa", status: "cancelada",
    branchName: "La Reina", currentBranchName: "La Reina",
    courier: "Chilexpress", salesChannel: "Falabella",
    photoEvidenceUrls: [], receivedByUserName: null, receivedAt: null,
    createdAt: "2026-02-15T14:30:00", location: null,
    pickupGroupId: null, transferOrderId: null, cancellationReason: "Cliente final desistió de la devolución",
    items: [
      { id: "ri-040a", sku: "YG-005", productName: "Your Goal Whey Protein 2kg Vainilla", quantity: 1, returnReason: "No deseado" },
    ],
  },
];

// ─── Transfer order types ─────────────────────────────────────────────────────

export type TransferStatus = "pendiente" | "en_preparacion" | "en_transito" | "recibida_parcial" | "recibida_completa" | "cancelada";

export type TransferLegStatus = "pendiente" | "preparado" | "retirado_por_transporte" | "recibido" | "recibido_con_diferencias";

export type TransferLeg = {
  id: string;
  originBranch: string;
  status: TransferLegStatus;
  returnsCount: number;
  returnIds: string[];
  preparedAt: string | null;
  pickedUpAt: string | null;
  receivedAt: string | null;
};

export type TransferOrder = {
  id: string;
  displayId: string;        // TRF-0000001
  sellerName: string;
  destinationBranch: string;
  status: TransferStatus;
  totalReturns: number;
  totalReceived: number;
  legs: TransferLeg[];
  requestedByUser: string;
  createdAt: string;
  notes: string;
};

// ─── Mock transfer orders (8) ─────────────────────────────────────────────────

export const MOCK_TRANSFER_ORDERS: TransferOrder[] = [
  // ── pendiente (2) — All legs pendiente ─────────────────────────────────────
  {
    id: "trf-001", displayId: "TRF-0000001",
    sellerName: "GoHard", destinationBranch: "CD Quilicura",
    status: "pendiente", totalReturns: 5, totalReceived: 0,
    requestedByUser: "Juan Pérez", createdAt: "2026-03-26T10:00:00",
    notes: "Consolidar stock GoHard para envío a seller",
    legs: [
      { id: "leg-001a", originBranch: "Santiago Centro", status: "pendiente", returnsCount: 2, returnIds: ["ret-006", "ret-011"], preparedAt: null, pickedUpAt: null, receivedAt: null },
      { id: "leg-001b", originBranch: "La Reina", status: "pendiente", returnsCount: 2, returnIds: ["ret-007", "ret-012"], preparedAt: null, pickedUpAt: null, receivedAt: null },
      { id: "leg-001c", originBranch: "Lo Barnechea", status: "pendiente", returnsCount: 1, returnIds: ["ret-009"], preparedAt: null, pickedUpAt: null, receivedAt: null },
    ],
  },
  {
    id: "trf-002", displayId: "TRF-0000002",
    sellerName: "Extra Life", destinationBranch: "CD Quilicura",
    status: "pendiente", totalReturns: 4, totalReceived: 0,
    requestedByUser: "María González", createdAt: "2026-03-26T14:30:00",
    notes: "",
    legs: [
      { id: "leg-002a", originBranch: "Lo Barnechea", status: "pendiente", returnsCount: 2, returnIds: ["ret-019", "ret-014"], preparedAt: null, pickedUpAt: null, receivedAt: null },
      { id: "leg-002b", originBranch: "La Reina", status: "pendiente", returnsCount: 2, returnIds: ["ret-017", "ret-022"], preparedAt: null, pickedUpAt: null, receivedAt: null },
    ],
  },

  // ── en_preparacion (2) — Some legs prepared ────────────────────────────────
  {
    id: "trf-003", displayId: "TRF-0000003",
    sellerName: "Mundo Fungi", destinationBranch: "CD Quilicura",
    status: "en_preparacion", totalReturns: 6, totalReceived: 0,
    requestedByUser: "Juan Pérez", createdAt: "2026-03-24T09:00:00",
    notes: "Seller solicita devolución urgente por fecha de vencimiento",
    legs: [
      { id: "leg-003a", originBranch: "Quilicura", status: "preparado", returnsCount: 3, returnIds: ["ret-018", "ret-015", "ret-021"], preparedAt: "2026-03-25T11:00:00", pickedUpAt: null, receivedAt: null },
      { id: "leg-003b", originBranch: "Santiago Centro", status: "pendiente", returnsCount: 2, returnIds: ["ret-016", "ret-020"], preparedAt: null, pickedUpAt: null, receivedAt: null },
      { id: "leg-003c", originBranch: "Lo Barnechea", status: "preparado", returnsCount: 1, returnIds: ["ret-019"], preparedAt: "2026-03-25T14:00:00", pickedUpAt: null, receivedAt: null },
    ],
  },
  {
    id: "trf-004", displayId: "TRF-0000004",
    sellerName: "Le Vice", destinationBranch: "CD Quilicura",
    status: "en_preparacion", totalReturns: 3, totalReceived: 0,
    requestedByUser: "Carlos Muñoz", createdAt: "2026-03-23T16:00:00",
    notes: "Coordinar con courier Blue Express",
    legs: [
      { id: "leg-004a", originBranch: "Santiago Centro", status: "preparado", returnsCount: 2, returnIds: ["ret-020", "ret-016"], preparedAt: "2026-03-24T10:30:00", pickedUpAt: null, receivedAt: null },
      { id: "leg-004b", originBranch: "La Reina", status: "pendiente", returnsCount: 1, returnIds: ["ret-017"], preparedAt: null, pickedUpAt: null, receivedAt: null },
    ],
  },

  // ── en_transito (1) — Legs retirado_por_transporte ─────────────────────────
  {
    id: "trf-005", displayId: "TRF-0000005",
    sellerName: "Bekoko", destinationBranch: "CD Quilicura",
    status: "en_transito", totalReturns: 4, totalReceived: 0,
    requestedByUser: "Ana López", createdAt: "2026-03-20T08:30:00",
    notes: "Retiro coordinado con Starken para 22 marzo",
    legs: [
      { id: "leg-005a", originBranch: "Santiago Centro", status: "retirado_por_transporte", returnsCount: 2, returnIds: ["ret-006", "ret-011"], preparedAt: "2026-03-21T09:00:00", pickedUpAt: "2026-03-22T11:00:00", receivedAt: null },
      { id: "leg-005b", originBranch: "Lo Barnechea", status: "retirado_por_transporte", returnsCount: 2, returnIds: ["ret-024", "ret-009"], preparedAt: "2026-03-21T10:30:00", pickedUpAt: "2026-03-22T14:00:00", receivedAt: null },
    ],
  },

  // ── recibida_parcial (1) — Some legs received, some not ────────────────────
  {
    id: "trf-006", displayId: "TRF-0000006",
    sellerName: "Saint Venik", destinationBranch: "CD Quilicura",
    status: "recibida_parcial", totalReturns: 5, totalReceived: 3,
    requestedByUser: "Juan Pérez", createdAt: "2026-03-15T10:00:00",
    notes: "",
    legs: [
      { id: "leg-006a", originBranch: "Santiago Centro", status: "recibido", returnsCount: 3, returnIds: ["ret-025", "ret-011", "ret-016"], preparedAt: "2026-03-16T09:00:00", pickedUpAt: "2026-03-17T11:00:00", receivedAt: "2026-03-19T10:30:00" },
      { id: "leg-006b", originBranch: "La Reina", status: "retirado_por_transporte", returnsCount: 2, returnIds: ["ret-012", "ret-017"], preparedAt: "2026-03-16T14:00:00", pickedUpAt: "2026-03-18T10:00:00", receivedAt: null },
    ],
  },

  // ── recibida_completa (1) ──────────────────────────────────────────────────
  {
    id: "trf-007", displayId: "TRF-0000007",
    sellerName: "Ergopouch", destinationBranch: "CD Quilicura",
    status: "recibida_completa", totalReturns: 3, totalReceived: 3,
    requestedByUser: "María González", createdAt: "2026-03-10T09:00:00",
    notes: "Transferencia completada sin incidencias",
    legs: [
      { id: "leg-007a", originBranch: "La Reina", status: "recibido", returnsCount: 2, returnIds: ["ret-026", "ret-003"], preparedAt: "2026-03-11T10:00:00", pickedUpAt: "2026-03-12T14:00:00", receivedAt: "2026-03-14T09:30:00" },
      { id: "leg-007b", originBranch: "Lo Barnechea", status: "recibido_con_diferencias", returnsCount: 1, returnIds: ["ret-004"], preparedAt: "2026-03-11T11:30:00", pickedUpAt: "2026-03-12T15:00:00", receivedAt: "2026-03-14T10:00:00" },
    ],
  },

  // ── cancelada (1) ──────────────────────────────────────────────────────────
  {
    id: "trf-008", displayId: "TRF-0000008",
    sellerName: "Xclusive", destinationBranch: "CD Quilicura",
    status: "cancelada", totalReturns: 2, totalReceived: 0,
    requestedByUser: "Carlos Muñoz", createdAt: "2026-03-18T11:00:00",
    notes: "Cancelada — seller retiró directamente desde sucursales",
    legs: [
      { id: "leg-008a", originBranch: "La Reina", status: "pendiente", returnsCount: 1, returnIds: ["ret-003"], preparedAt: null, pickedUpAt: null, receivedAt: null },
      { id: "leg-008b", originBranch: "Quilicura", status: "pendiente", returnsCount: 1, returnIds: ["ret-015"], preparedAt: null, pickedUpAt: null, receivedAt: null },
    ],
  },
];

// ─── Derived stats ───────────────────────────────────────────────────────────
export const OR_STATS = {
  total: MOCK_RETURNS.length,
  pendientes: MOCK_RETURNS.filter(r => r.status === "recibida_en_bodega").length,
  listasParaDevolver: MOCK_RETURNS.filter(r => r.status === "lista_para_devolver").length,
  entregadasEsteMes: MOCK_RETURNS.filter(r =>
    (r.status === "retirada_en_bodega" || r.status === "enviada_al_seller") &&
    r.createdAt.startsWith("2026-03")
  ).length,
};
