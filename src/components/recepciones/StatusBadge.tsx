// ─── Status type — single source of truth ─────────────────────────────────────
type Status =
  | "Creado"
  | "Programado"
  | "Recepcionado en bodega"
  | "En proceso de conteo"
  | "Pendiente de aprobación"
  | "Completado sin diferencias"
  | "Completado con diferencias"
  | "Cancelado";

const statusConfig: Record<Status, { label: string; className: string }> = {
  "Creado": {
    label: "Creado",
    className: "text-gray-500 bg-gray-50 border border-gray-200",
  },
  "Programado": {
    label: "Programado",
    className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  },
  "Recepcionado en bodega": {
    label: "Recepcionado en bodega",
    className: "bg-slate-700 text-white",
  },
  "En proceso de conteo": {
    label: "En proceso de conteo",
    className: "bg-blue-50 text-blue-700 border border-blue-300",
  },
  "Pendiente de aprobación": {
    label: "Pendiente de aprobación",
    className: "bg-orange-50 text-orange-600 border border-orange-200",
  },
  "Completado sin diferencias": {
    label: "Completado sin diferencias",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  "Completado con diferencias": {
    label: "Completado con diferencias",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  "Cancelado": {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {status === "Cancelado"                  && <span>⊘</span>}
      {status === "Completado sin diferencias" && <span>✓</span>}
      {status === "Completado con diferencias" && <span>✓</span>}
      {status === "Pendiente de aprobación"    && <span>⏸</span>}
      {status === "Recepcionado en bodega"     && <span>⬡</span>}
      {config.label}
    </span>
  );
}

export type { Status };
