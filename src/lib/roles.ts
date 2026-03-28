// ─── Role-based access control ───────────────────────────────────────────────
export type Role = "Super Admin" | "Operador" | "Seller" | "KAM";

// ── Demo assignment per role ─────────────────────────────────────────────────
// In production these come from the API. Here we hardcode for demo purposes.
const ROLE_SUCURSALES: Record<Role, string[] | "all"> = {
  "Super Admin": "all",
  "Operador":    ["Quilicura"],
  "KAM":         ["Quilicura", "La Reina"],
  "Seller":      ["Quilicura"],           // seller's tienda lives in Quilicura
};

const ROLE_SELLERS: Record<Role, string[] | "all"> = {
  "Super Admin": "all",
  "Operador":    "all",                   // sees all tiendas in their sucursal
  "KAM":         ["Extra Life", "Le Vice", "Gohard"],
  "Seller":      ["Extra Life"],
};

// ── Permissions ──────────────────────────────────────────────────────────────
export type Permission =
  | "or:create"          // Crear OR
  | "or:complete"        // Completar OR (Creado → Programado)
  | "or:receive"         // Recibir OR (Programado → Recepción en bodega)
  | "or:cancel"          // Cancelar OR
  | "or:scan_qr"        // Escanear QR desde lista
  | "scan:pallet_bulto"  // Escanear pallet/bulto en conteo
  | "session:start"      // Iniciar sesión de conteo
  | "session:finalize"   // Finalizar sesión
  | "session:release"    // Liberar sesión
  | "or:approve"         // Aprobar (pendiente de aprobación)
  | "or:edit"            // Ver/Editar OR
  | "filter:sucursal"    // Puede cambiar filtro de sucursal
  | "filter:seller"      // Puede cambiar filtro de tienda
  | "audit:view"         // Ver registros de auditoría
  // ── Devoluciones ──
  | "ret:create"         // Crear devolución (manual form)
  | "ret:receive"        // Recibir devolución (scanner)
  | "ret:ready"          // Marcar como lista para devolver
  | "ret:retiro"         // Generar batch retiro
  | "ret:envio"          // Enviar al seller
  | "ret:cancel"         // Cancelar devolución
  | "ret:transfer"       // Gestionar transferencias
  | "ret:initiate";      // Iniciar devolución (seller flow)

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  "Super Admin": [
    "or:create", "or:complete", "or:receive", "or:cancel", "or:scan_qr",
    "scan:pallet_bulto", "session:start", "session:finalize", "session:release",
    "or:approve", "or:edit", "filter:sucursal", "filter:seller", "audit:view",
    // Devoluciones — ALL
    "ret:create", "ret:receive", "ret:ready", "ret:retiro", "ret:envio",
    "ret:cancel", "ret:transfer", "ret:initiate",
  ],
  "Operador": [
    "or:receive", "or:scan_qr",
    "scan:pallet_bulto", "session:start", "session:finalize", "session:release",
    "or:edit",
    // Devoluciones
    "ret:create", "ret:receive", "ret:ready", "ret:retiro", "ret:envio", "ret:transfer",
  ],
  "KAM": [
    "or:create", "or:complete", "or:receive", "or:cancel",
    "session:start", "session:finalize", "session:release",
    "or:approve", "or:edit", "filter:sucursal", "filter:seller",
    // Devoluciones
    "ret:create", "ret:initiate",
  ],
  "Seller": [
    "or:create", "or:complete", "or:cancel",
    "or:edit",
    // Devoluciones
    "ret:initiate",
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
export function getRole(): Role {
  if (typeof window === "undefined") return "Super Admin";
  return (localStorage.getItem("amplifica_user_role") as Role) || "Super Admin";
}

export function hasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export function can(role: Role, perm: Permission): boolean {
  return hasPermission(role, perm);
}

export function getAllowedSucursales(role: Role): string[] | "all" {
  return ROLE_SUCURSALES[role];
}

export function getAllowedSellers(role: Role): string[] | "all" {
  return ROLE_SELLERS[role];
}
