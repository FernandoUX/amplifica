// ─── QR Token helpers (localStorage-backed, demo-only) ─────────────────────

export type QrEstado = "activo" | "invalidado" | "escaneado";

export type QrToken = {
  id: string;
  orden_recepcion_id: string;
  qr_token: string;          // UUID v4
  version: number;
  estado: QrEstado;
  created_at: string;         // ISO
  scanned_at?: string;        // ISO
  invalidated_at?: string;    // ISO
};

export type TimeTolerance =
  | "en_horario"
  | "anticipada"
  | "tardia"
  | "fuera_de_fecha";

export const QR_TOKENS_KEY = "amplifica_qr_tokens";

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadQrTokens(): QrToken[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QR_TOKENS_KEY);
    return raw ? (JSON.parse(raw) as QrToken[]) : [];
  } catch {
    return [];
  }
}

export function saveQrTokens(tokens: QrToken[]) {
  localStorage.setItem(QR_TOKENS_KEY, JSON.stringify(tokens));
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export function getActiveTokenForOR(orId: string): QrToken | undefined {
  return loadQrTokens().find(
    (t) => t.orden_recepcion_id === orId && t.estado === "activo",
  );
}

export function getTokensForOR(orId: string): QrToken[] {
  return loadQrTokens().filter((t) => t.orden_recepcion_id === orId);
}

export function generateTokenForOR(orId: string): QrToken {
  const tokens = loadQrTokens();

  // Invalidate any existing active token for this OR
  const existing = tokens.find(
    (t) => t.orden_recepcion_id === orId && t.estado === "activo",
  );
  if (existing) {
    existing.estado = "invalidado";
    existing.invalidated_at = new Date().toISOString();
  }

  const maxVersion = tokens
    .filter((t) => t.orden_recepcion_id === orId)
    .reduce((max, t) => Math.max(max, t.version), 0);

  const newToken: QrToken = {
    id: `QRT-${orId}-v${maxVersion + 1}`,
    orden_recepcion_id: orId,
    qr_token: crypto.randomUUID(),
    version: maxVersion + 1,
    estado: "activo",
    created_at: new Date().toISOString(),
  };

  tokens.push(newToken);
  saveQrTokens(tokens);
  return newToken;
}

export function markTokenScanned(tokenId: string): QrToken | null {
  const tokens = loadQrTokens();
  const token = tokens.find((t) => t.id === tokenId);
  if (!token || token.estado !== "activo") return null;
  token.estado = "escaneado";
  token.scanned_at = new Date().toISOString();
  saveQrTokens(tokens);
  return token;
}

export function invalidateTokenForOR(orId: string): boolean {
  const tokens = loadQrTokens();
  const active = tokens.find(
    (t) => t.orden_recepcion_id === orId && t.estado === "activo",
  );
  if (!active) return false;
  active.estado = "invalidado";
  active.invalidated_at = new Date().toISOString();
  saveQrTokens(tokens);
  return true;
}

// ─── Scan validation ────────────────────────────────────────────────────────

export type ScanError =
  | "not_found"
  | "already_scanned"
  | "invalidated"
  | "wrong_sucursal"
  | "not_programado";

export type ScanResult =
  | { ok: true; token: QrToken }
  | { ok: false; error: ScanError; token?: QrToken };

export function validateScan(
  qrTokenValue: string,
  operadorSucursal?: string,
  orEstado?: string,
  orSucursal?: string,
): ScanResult {
  const tokens = loadQrTokens();
  const token = tokens.find((t) => t.qr_token === qrTokenValue);

  if (!token) return { ok: false, error: "not_found" };
  if (token.estado === "escaneado")
    return { ok: false, error: "already_scanned", token };
  if (token.estado === "invalidado")
    return { ok: false, error: "invalidated", token };

  // Check OR estado if provided
  if (orEstado && orEstado !== "Programado")
    return { ok: false, error: "not_programado", token };

  // Check sucursal match if provided
  if (operadorSucursal && orSucursal && operadorSucursal !== orSucursal)
    return { ok: false, error: "wrong_sucursal", token };

  return { ok: true, token };
}

// ─── Time tolerance ─────────────────────────────────────────────────────────

export function computeTimeTolerance(
  fechaAgendada: string,  // "DD/MM/YYYY HH:mm"
  now: Date = new Date(),
): { code: TimeTolerance; label: string } {
  const [datePart, timePart] = fechaAgendada.split(" ");
  const [d, m, y] = datePart.split("/").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const scheduled = new Date(y, m - 1, d, hh, mm);

  const diffMs = now.getTime() - scheduled.getTime();
  const diffMin = diffMs / 60_000;

  // Same day check
  const sameDay =
    now.getFullYear() === scheduled.getFullYear() &&
    now.getMonth() === scheduled.getMonth() &&
    now.getDate() === scheduled.getDate();

  if (!sameDay) {
    return diffMin < 0
      ? { code: "anticipada", label: "Anticipada (otro día)" }
      : { code: "fuera_de_fecha", label: "Fuera de fecha" };
  }

  // Same day — check time window (±30 min tolerance)
  if (diffMin >= -30 && diffMin <= 30) {
    return { code: "en_horario", label: "En horario" };
  }
  if (diffMin < -30) {
    return { code: "anticipada", label: "Anticipada" };
  }
  // diffMin > 30
  return { code: "tardia", label: "Tardía" };
}

// ─── Seed data ──────────────────────────────────────────────────────────────

/** Metadata for each seeded OR — seller, sucursal, product counts */
export type QrOrMeta = { seller: string; sucursal: string; skus: number; uTotales: string; pallets?: number; bultos?: number };

export const QR_OR_META: Record<string, QrOrMeta> = {
  "RO-BARRA-183": { seller: "Extra Life",  sucursal: "Quilicura",       skus: 3, uTotales: "150", pallets: 2, bultos: 10 },
  "RO-BARRA-182": { seller: "Extra Life",  sucursal: "La Reina",        skus: 2, uTotales: "80",  pallets: 1, bultos: 6 },
  "RO-BARRA-190": { seller: "Le Vice",     sucursal: "Lo Barnechea",    skus: 2, uTotales: "200", pallets: 3, bultos: 15 },
  "RO-BARRA-194": { seller: "VitaFit",     sucursal: "Quilicura",       skus: 4, uTotales: "320", pallets: 4, bultos: 20 },
  "RO-BARRA-195": { seller: "NutriPro",    sucursal: "La Reina",        skus: 1, uTotales: "60",  pallets: 1, bultos: 4 },
  "RO-BARRA-211": { seller: "BioNature",   sucursal: "Santiago Centro",  skus: 3, uTotales: "240", pallets: 3, bultos: 12 },
  "RO-BARRA-217": { seller: "Gohard",      sucursal: "Providencia",     skus: 2, uTotales: "100", pallets: 2, bultos: 8 },
  "RO-BARRA-226": { seller: "Gohard",      sucursal: "Las Condes",      skus: 5, uTotales: "400", pallets: 5, bultos: 25 },
  "RO-BARRA-227": { seller: "Le Vice",     sucursal: "Providencia",     skus: 2, uTotales: "180", pallets: 2, bultos: 10 },
  "RO-BARRA-228": { seller: "VitaFit",     sucursal: "Quilicura",       skus: 3, uTotales: "260", pallets: 3, bultos: 14 },
  "RO-BARRA-229": { seller: "NutriPro",    sucursal: "Lo Barnechea",    skus: 1, uTotales: "50",  pallets: 1, bultos: 3 },
  "RO-BARRA-230": { seller: "Extra Life",  sucursal: "La Reina",        skus: 2, uTotales: "120", pallets: 2, bultos: 8 },
  "RO-BARRA-180": { seller: "Le Vice",     sucursal: "Santiago Centro",  skus: 4, uTotales: "300", pallets: 4, bultos: 18 },
  "RO-BARRA-196": { seller: "BioNature",   sucursal: "Lo Barnechea",    skus: 2, uTotales: "90",  pallets: 1, bultos: 5 },
  "RO-BARRA-197": { seller: "Extra Life",  sucursal: "Providencia",     skus: 3, uTotales: "170", pallets: 2, bultos: 9 },
};

const PROGRAMADO_ORS = Object.keys(QR_OR_META);

function buildSeedTokens(): QrToken[] {
  return PROGRAMADO_ORS.map((orId, i) => ({
    id: `QRT-${orId}-v1`,
    orden_recepcion_id: orId,
    qr_token: `seed-qr-${orId.toLowerCase()}`,
    version: 1,
    estado: "activo" as const,
    created_at: new Date(2026, 1, 10 + i, 9, 0).toISOString(),
  }));
}

/** Initialize localStorage with seed tokens if empty */
export function ensureQrSeeded() {
  if (typeof window === "undefined") return;
  const existing = loadQrTokens();
  if (existing.length > 0) return;
  saveQrTokens(buildSeedTokens());
}
