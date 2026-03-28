"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, Package, Camera,
  Clock, Info, Printer, Ban, Truck, Send, MapPin,
  ExternalLink, Image as ImageIcon, Warehouse,
  CheckCircle2, AlertTriangle, Info as InfoIcon, X,
} from "lucide-react";

import { MOCK_RETURNS, type ReturnRecord } from "@/app/devoluciones/_data";
import ReturnStatusBadge, { type ReturnStatus } from "@/components/devoluciones/ReturnStatusBadge";
import ReturnTimeline, { type TimelineEntry } from "@/components/devoluciones/ReturnTimeline";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import Button from "@/components/ui/Button";
import BatchRetiroModal from "@/components/devoluciones/BatchRetiroModal";
import EnvioAlSellerModal from "@/components/devoluciones/EnvioAlSellerModal";
import CancelReturnModal from "@/components/devoluciones/CancelReturnModal";
import AlertModal from "@/components/ui/AlertModal";
import CopyableId from "@/components/ui/CopyableId";
import { getRole, can, type Role } from "@/lib/roles";

// ─── Date formatter ─────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return (
      date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return d;
  }
}

// ─── Build mock timeline based on current status ────────────────────────────
function buildTimeline(ret: ReturnRecord): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  const STATUS_FLOW: ReturnStatus[] = [
    "creada",
    "recibida_en_bodega",
    "lista_para_devolver",
    "en_transferencia",
    "recibida_en_cd",
    "retirada_en_bodega",
    "enviada_al_seller",
  ];

  // Special case: cancelled
  if (ret.status === "cancelada") {
    entries.push({
      status: "creada",
      timestamp: ret.createdAt,
      userName: "Sistema",
      description: "Devolución registrada",
    });
    if (ret.receivedAt) {
      entries.push({
        status: "recibida_en_bodega",
        timestamp: ret.receivedAt,
        userName: ret.receivedByUserName ?? "Operador",
        description: "Bulto recepcionado en bodega",
      });
    }
    entries.push({
      status: "cancelada",
      timestamp: new Date(new Date(ret.receivedAt ?? ret.createdAt).getTime() + 3600000).toISOString(),
      userName: "Admin",
      description: ret.cancellationReason ?? "Devolución anulada",
    });
    return entries.reverse();
  }

  const currentIdx = STATUS_FLOW.indexOf(ret.status);
  const endIdx = currentIdx >= 0 ? currentIdx : 0;

  // Always add "creada"
  entries.push({
    status: "creada",
    timestamp: ret.createdAt,
    userName: "Sistema",
    description: "Devolución registrada en el sistema",
  });

  if (endIdx >= 1 && ret.receivedAt) {
    entries.push({
      status: "recibida_en_bodega",
      timestamp: ret.receivedAt,
      userName: ret.receivedByUserName ?? "Operador",
      description: `Recepcionado en ${ret.branchName}${ret.location ? ` — ubicación ${ret.location}` : ""}`,
    });
  }

  if (endIdx >= 2) {
    const ts = ret.receivedAt
      ? new Date(new Date(ret.receivedAt).getTime() + 86400000).toISOString()
      : new Date(new Date(ret.createdAt).getTime() + 172800000).toISOString();
    entries.push({
      status: "lista_para_devolver",
      timestamp: ts,
      userName: ret.receivedByUserName ?? "Operador",
      description: "Bulto clasificado y disponible para retiro o envío",
    });
  }

  if (endIdx >= 3) {
    const base = entries[entries.length - 1]?.timestamp ?? ret.createdAt;
    entries.push({
      status: "en_transferencia",
      timestamp: new Date(new Date(base).getTime() + 86400000).toISOString(),
      userName: "Sistema",
      description: `Transferencia iniciada vía ${ret.courier}`,
    });
  }

  if (endIdx >= 4) {
    const base = entries[entries.length - 1]?.timestamp ?? ret.createdAt;
    entries.push({
      status: "recibida_en_cd",
      timestamp: new Date(new Date(base).getTime() + 172800000).toISOString(),
      userName: "Operador CD",
      description: `Recibido en ${ret.currentBranchName}`,
    });
  }

  // Terminal states: retirada_en_bodega or enviada_al_seller
  if (ret.status === "retirada_en_bodega") {
    const base = entries[entries.length - 1]?.timestamp ?? ret.createdAt;
    entries.push({
      status: "retirada_en_bodega",
      timestamp: new Date(new Date(base).getTime() + 86400000).toISOString(),
      userName: "Seller",
      description: `Retirado por ${ret.sellerName}`,
    });
  }

  if (ret.status === "enviada_al_seller") {
    const base = entries[entries.length - 1]?.timestamp ?? ret.createdAt;
    entries.push({
      status: "enviada_al_seller",
      timestamp: new Date(new Date(base).getTime() + 86400000).toISOString(),
      userName: "Operador",
      description: `Despachado por ${ret.courier} a ${ret.sellerName}`,
    });
  }

  // Return most recent first
  return entries.reverse();
}

// ─── Info field component ───────────────────────────────────────────────────
function InfoField({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-neutral-700">{label}</dt>
      <dd className="text-sm text-neutral-900 mt-0.5">
        {children ?? (value || "—")}
      </dd>
    </div>
  );
}

// ─── Action buttons per status (role-filtered) ─────────────────────────────
type ActionItem = { label: string; icon: React.ReactNode; variant: "primary" | "secondary" | "tertiary"; danger?: boolean; perm?: string };

function getActions(status: ReturnStatus, role: Role): ActionItem[] {
  const allActions: ActionItem[] = [];

  switch (status) {
    case "recibida_en_bodega":
      allActions.push(
        { label: "Marcar lista para devolver", icon: <Package className="w-4 h-4" />, variant: "primary", perm: "ret:ready" },
        { label: "Reimprimir etiqueta", icon: <Printer className="w-4 h-4" />, variant: "secondary", perm: "ret:receive" },
        { label: "Anular devolución", icon: <Ban className="w-4 h-4" />, variant: "tertiary", danger: true, perm: "ret:cancel" },
      );
      break;
    case "lista_para_devolver":
      allActions.push(
        { label: "Generar retiro", icon: <Truck className="w-4 h-4" />, variant: "primary", perm: "ret:retiro" },
        { label: "Enviar al seller", icon: <Send className="w-4 h-4" />, variant: "secondary", perm: "ret:envio" },
        { label: "Reimprimir etiqueta", icon: <Printer className="w-4 h-4" />, variant: "secondary", perm: "ret:receive" },
        { label: "Anular devolución", icon: <Ban className="w-4 h-4" />, variant: "tertiary", danger: true, perm: "ret:cancel" },
      );
      break;
    case "creada":
      allActions.push(
        { label: "Recepcionar", icon: <MapPin className="w-4 h-4" />, variant: "primary", perm: "ret:receive" },
        { label: "Anular devolución", icon: <Ban className="w-4 h-4" />, variant: "tertiary", danger: true, perm: "ret:cancel" },
      );
      break;
    default:
      allActions.push(
        { label: "Ver etiqueta", icon: <Printer className="w-4 h-4" />, variant: "secondary" },
      );
      break;
  }

  // Filter actions by role permissions; items without perm are always shown
  return allActions.filter(a => !a.perm || can(role, a.perm as any));
}

// ─── Page component ─────────────────────────────────────────────────────────
export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;

  // ── Role-based permissions ────────────────────────────────────────────────
  const role = getRole();

  const ret = useMemo(
    () => MOCK_RETURNS.find((r) => r.id === returnId || r.displayId === returnId),
    [returnId]
  );

  const timeline = useMemo(() => (ret ? buildTimeline(ret) : []), [ret]);
  const actions = useMemo(() => (ret ? getActions(ret.status, role) : []), [ret, role]);

  // ── Loading skeleton (R-1) ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t); }, []);

  // ── Toast state with queue support (R-2, P-1) ─────────────────────────
  const [toast, setToast] = useState<{message: string; type: "success"|"error"|"info"; undoAction?: () => void} | null>(null);
  const toastTimer = useRef<NodeJS.Timeout>(undefined);
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success", undoAction?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, undoAction });
    toastTimer.current = setTimeout(() => setToast(null), undoAction ? 5000 : 3000);
  }, []);

  // ── Badge animation state (P-2) ───────────────────────────────────────
  const [badgeAnimating, setBadgeAnimating] = useState(false);
  const triggerBadgeAnimation = useCallback(() => {
    setBadgeAnimating(true);
    setTimeout(() => setBadgeAnimating(false), 600);
  }, []);

  // ── Modal states ──────────────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRetiroModal, setShowRetiroModal] = useState(false);
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [showConfirmReady, setShowConfirmReady] = useState(false);
  const [showConfirmReceive, setShowConfirmReceive] = useState(false);

  // Returns from same seller that are lista_para_devolver (for batch retiro/envio)
  const sameSellerReturns = useMemo(
    () =>
      ret
        ? MOCK_RETURNS.filter(
            r => r.sellerId === ret.sellerId && r.status === "lista_para_devolver"
          )
        : [],
    [ret]
  );

  // ── Action handler (routes each action to its modal/behavior) ─────────────
  const handleAction = useCallback(
    (label: string) => {
      switch (label) {
        case "Anular devolución":
          setShowCancelModal(true);
          break;
        case "Generar retiro":
          setShowRetiroModal(true);
          break;
        case "Enviar al seller":
          setShowEnvioModal(true);
          break;
        case "Marcar lista para devolver":
          setShowConfirmReady(true);
          break;
        case "Recepcionar":
          setShowConfirmReceive(true);
          break;
        case "Reimprimir etiqueta":
        case "Ver etiqueta":
          showToast("Etiqueta generada y enviada a impresión", "success");
          break;
        default:
          showToast(label, "info");
      }
    },
    []
  );

  // ── Skeleton loader (R-1) ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-8 space-y-4">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-200 rounded-lg animate-pulse" />
          <div className="h-7 w-64 bg-neutral-200 rounded animate-pulse" />
          <div className="h-6 w-32 bg-neutral-200 rounded-full animate-pulse" />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
              <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-20 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-32 animate-pulse bg-neutral-50" />
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-48 animate-pulse bg-neutral-50" />
            <div className="bg-white border border-neutral-200 rounded-xl p-4 h-32 animate-pulse bg-neutral-50" />
          </div>
        </div>
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-neutral-500 mb-4">Devolución no encontrada</p>
        <Button variant="secondary" size="md" onClick={() => router.push("/devoluciones")}>
          Volver a devoluciones
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="border-b border-neutral-200 bg-white">
        <nav className="max-w-6xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/devoluciones" className="hover:text-primary-500 transition-colors duration-300">
            Devoluciones
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-700 font-medium">{ret.displayId}</span>
        </nav>
      </div>

      <div className="p-4 lg:p-6 max-w-6xl mx-auto animate-in fade-in duration-300">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push("/devoluciones")}
              className="flex items-center justify-center w-8 h-8 border border-neutral-200 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors duration-300 flex-shrink-0 mt-0.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{ret.displayId}</h1>
                <CopyableId value={ret.displayId} />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`transition-all duration-300 ${badgeAnimating ? "scale-110 ring-2 ring-primary-200 rounded-full" : ""}`}>
                  <ReturnStatusBadge status={ret.status} />
                </span>
                <span className="text-xs text-neutral-500">
                  Creada {fmtDate(ret.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">

          {/* ── Left column (main content) ── */}
          <div className="flex flex-col gap-4">

            {/* Card 1: Informacion general */}
            <CollapsibleCard title="Informacion general" icon={Info} defaultOpen>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <InfoField label="ID devolucion">{ret.displayId}</InfoField>
                <InfoField label="ID pedido">
                  {ret.orderId ? (
                    <Link
                      href={`/pedidos/${ret.orderId}`}
                      className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1 transition-colors"
                    >
                      {ret.orderDisplayId ?? ret.orderId}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-neutral-500 italic">Sin pedido asociado</span>
                  )}
                </InfoField>
                <InfoField label="Seller" value={ret.sellerName} />
                <InfoField label="Sucursal origen" value={ret.branchName} />
                <InfoField label="Ubicacion actual" value={ret.currentBranchName} />
                <InfoField label="Courier" value={ret.courier} />
                <InfoField label="Canal de venta" value={ret.salesChannel} />
                <InfoField label="Origen" value={ret.origin === "externa" ? "Externa" : ret.origin} />
                <InfoField label="Fecha creacion" value={fmtDate(ret.createdAt)} />
                <InfoField label="Fecha recepcion" value={fmtDate(ret.receivedAt)} />
                {/* MEJORA-6: Ubicacion en bodega */}
                <InfoField label="Ubicacion en bodega" value={ret.location} />
              </dl>
            </CollapsibleCard>

            {/* Card 2: Productos devueltos */}
            {/* MEJORA-5: If rol=Seller, hide this section entirely */}
            {ret.items.length > 0 ? (
              <CollapsibleCard title="Productos devueltos" icon={Package} defaultOpen>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-xs font-semibold text-neutral-700 py-2 px-2">SKU</th>
                        <th className="text-xs font-semibold text-neutral-700 py-2 px-2">Producto</th>
                        <th className="text-xs font-semibold text-neutral-700 py-2 px-2 text-right">Cant.</th>
                        <th className="text-xs font-semibold text-neutral-700 py-2 px-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ret.items.map((item) => (
                        <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                          <td className="py-2 px-2 text-xs font-mono text-neutral-600 whitespace-nowrap">{item.sku}</td>
                          <td className="py-2 px-2 text-sm text-neutral-900 whitespace-nowrap">{item.productName}</td>
                          <td className="py-2 px-2 text-sm text-neutral-700 text-right tabular-nums">{item.quantity}</td>
                          <td className="py-2 px-2">
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                              {item.returnReason}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleCard>
            ) : (
              <CollapsibleCard title="Productos devueltos" icon={Package} defaultOpen>
                <p className="text-sm text-neutral-500 py-3 text-center">Sin detalle de productos</p>
              </CollapsibleCard>
            )}

            {/* Card 3: Evidencia fotografica */}
            <CollapsibleCard title="Evidencia fotografica" icon={Camera} defaultOpen={ret.photoEvidenceUrls.length > 0}>
              {ret.photoEvidenceUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {ret.photoEvidenceUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-neutral-300 transition-colors"
                    >
                      {/* Placeholder — in production this would be an <Image /> */}
                      <div className="flex flex-col items-center gap-1 text-neutral-300">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[10px]">Foto {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 py-3 text-center">Sin evidencia fotografica</p>
              )}
            </CollapsibleCard>

            {/* Card 4: Historial de estados (Timeline) */}
            <CollapsibleCard title="Historial de estados" icon={Clock} defaultOpen>
              <ReturnTimeline entries={timeline} />
            </CollapsibleCard>
          </div>

          {/* ── Right column (sidebar) ── */}
          <div className="flex flex-col gap-4">

            {/* Resumen del pedido */}
            {ret.orderId && (
              <div className="bg-white border border-neutral-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Resumen del pedido</h3>
                <dl className="space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">ID pedido</dt>
                    <dd>
                      <Link
                        href={`/pedidos/${ret.orderId}`}
                        className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
                      >
                        {ret.orderDisplayId ?? ret.orderId}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">Seller</dt>
                    <dd className="text-xs text-neutral-700 font-medium">{ret.sellerName}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">Productos</dt>
                    <dd className="text-xs text-neutral-700 font-medium">
                      {ret.items.length > 0
                        ? `${ret.items.reduce((s, i) => s + i.quantity, 0)} unidades (${ret.items.length} SKU)`
                        : "Sin detalle"
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Acciones disponibles */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Acciones disponibles</h3>
              <div className="flex flex-col gap-2">
                {actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant}
                    size="md"
                    className={`w-full justify-start ${action.danger ? "!text-red-600 hover:!bg-red-50" : ""}`}
                    iconLeft={action.icon}
                    onClick={() => handleAction(action.label)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Informacion adicional</h3>
              <dl className="space-y-2">
                {ret.receivedByUserName && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">Recepcionado por</dt>
                    <dd className="text-xs text-neutral-700 font-medium">{ret.receivedByUserName}</dd>
                  </div>
                )}
                {ret.pickupGroupId && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">Grupo de retiro</dt>
                    <dd className="text-xs text-neutral-700 font-medium">{ret.pickupGroupId}</dd>
                  </div>
                )}
                {ret.transferOrderId && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">Orden transferencia</dt>
                    <dd className="text-xs text-neutral-700 font-medium">{ret.transferOrderId}</dd>
                  </div>
                )}
                {ret.cancellationReason && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-neutral-500">Motivo anulacion</dt>
                    <dd className="text-xs text-red-600 font-medium">{ret.cancellationReason}</dd>
                  </div>
                )}
                {!ret.receivedByUserName && !ret.pickupGroupId && !ret.transferOrderId && !ret.cancellationReason && (
                  <p className="text-xs text-neutral-500 text-center py-1">Sin informacion adicional</p>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Cancel return */}
      <CancelReturnModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        displayId={ret.displayId}
        onConfirm={(reason) => {
          setShowCancelModal(false);
          showToast(`Devolución ${ret.displayId} anulada. Motivo: ${reason}`, "success");
        }}
      />

      {/* Batch retiro */}
      <BatchRetiroModal
        open={showRetiroModal}
        onClose={() => setShowRetiroModal(false)}
        sellerName={ret.sellerName}
        returns={sameSellerReturns.map(r => ({
          id: r.id,
          displayId: r.displayId,
          orderId: r.orderId,
          createdAt: r.createdAt,
        }))}
        onConfirm={(selectedIds, retirante) => {
          setShowRetiroModal(false);
          showToast(`Retiro confirmado para ${selectedIds.length} devoluciones. Retirante: ${retirante.nombre} ${retirante.apellido}`, "success");
        }}
      />

      {/* Envio al seller */}
      <EnvioAlSellerModal
        open={showEnvioModal}
        onClose={() => setShowEnvioModal(false)}
        sellerName={ret.sellerName}
        returns={sameSellerReturns.map(r => ({
          id: r.id,
          displayId: r.displayId,
        }))}
        onConfirm={(data) => {
          setShowEnvioModal(false);
          showToast(`Envío confirmado vía ${data.courier} a ${ret.sellerName}. ${data.cantidadBultos} bultos`, "success");
        }}
      />

      {/* Confirm: mark as lista_para_devolver */}
      <AlertModal
        open={showConfirmReady}
        onClose={() => setShowConfirmReady(false)}
        icon={Package}
        variant="primary"
        title="Marcar como lista para devolver"
        subtitle={ret.displayId}
        confirm={{
          label: "Confirmar",
          onClick: () => {
            setShowConfirmReady(false);
            triggerBadgeAnimation();
            showToast(
              `${ret.displayId} marcada como lista para devolver`,
              "success",
              () => {
                showToast("Cambio de estado revertido", "info");
                triggerBadgeAnimation();
              }
            );
          },
        }}
      >
        <p>
          La devolución pasará a estado <strong className="font-semibold">lista para devolver</strong> y
          estará disponible para retiro o envío al seller.
        </p>
      </AlertModal>

      {/* Confirm: receive return (creada → recibida_en_bodega) */}
      <AlertModal
        open={showConfirmReceive}
        onClose={() => setShowConfirmReceive(false)}
        icon={Warehouse}
        variant="info"
        title="Recibir devolución"
        subtitle={ret.displayId}
        confirm={{
          label: "Confirmar recepción",
          onClick: () => {
            setShowConfirmReceive(false);
            triggerBadgeAnimation();
            showToast(
              `${ret.displayId} recepcionada en bodega`,
              "success",
              () => {
                showToast("Cambio de estado revertido", "info");
                triggerBadgeAnimation();
              }
            );
          },
        }}
      >
        <p>
          La devolución será marcada como <strong className="font-semibold">recibida en bodega</strong> y
          quedará disponible para clasificación.
        </p>
      </AlertModal>

      {/* ── Toast notification (P-1: undo support) ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === "success" ? "bg-green-600 text-white" :
          toast.type === "error" ? "bg-red-600 text-white" :
          "bg-neutral-800 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
           toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> :
           <InfoIcon className="w-4 h-4" />}
          {toast.message}
          {toast.undoAction && (
            <button onClick={toast.undoAction} className="underline font-semibold hover:opacity-80">
              Deshacer
            </button>
          )}
          <button onClick={() => setToast(null)} className="ml-1 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </>
  );
}
