"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, ArrowLeftRight,
  Package, Truck, Clock, Info, Ban, MapPin, AlertTriangle,
  User, Calendar, FileText, ExternalLink,
  CheckCircle2, X,
} from "lucide-react";

import {
  MOCK_TRANSFER_ORDERS, MOCK_RETURNS,
  type TransferOrder, type TransferLeg,
} from "@/app/devoluciones/_data";
import TransferStatusBadge, {
  type TransferStatus,
  LegStatusBadge,
  type TransferLegStatus,
} from "@/components/devoluciones/TransferStatusBadge";
import ReturnStatusBadge from "@/components/devoluciones/ReturnStatusBadge";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import Button from "@/components/ui/Button";
import CopyableId from "@/components/ui/CopyableId";
import AlertModal from "@/components/ui/AlertModal";

// ─── Date formatter ─────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "\u2014";
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

// ─── Info field ──────────────────────────────────────────────────────────────
function InfoField({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-neutral-700">{label}</dt>
      <dd className="text-sm text-neutral-900 mt-0.5">
        {children ?? (value || "\u2014")}
      </dd>
    </div>
  );
}

// ─── Build mock timeline ─────────────────────────────────────────────────────
type TimelineEvent = {
  label: string;
  timestamp: string;
  user: string;
  description: string;
  dotColor: string;
};

function buildTransferTimeline(order: TransferOrder): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    label: "Transferencia creada",
    timestamp: order.createdAt,
    user: order.requestedByUser,
    description: `${order.totalReturns} devoluciones asignadas desde ${order.legs.length} sucursales`,
    dotColor: "bg-neutral-400",
  });

  // Add events for each leg
  for (const leg of order.legs) {
    if (leg.preparedAt) {
      events.push({
        label: `Tramo preparado: ${leg.originBranch}`,
        timestamp: leg.preparedAt,
        user: "Operador",
        description: `${leg.returnsCount} devoluciones preparadas para retiro`,
        dotColor: "bg-amber-500",
      });
    }
    if (leg.pickedUpAt) {
      events.push({
        label: `Retiro confirmado: ${leg.originBranch}`,
        timestamp: leg.pickedUpAt,
        user: "Transporte",
        description: `Tramo retirado por courier`,
        dotColor: "bg-sky-500",
      });
    }
    if (leg.receivedAt) {
      events.push({
        label: `Recepción: ${leg.originBranch}`,
        timestamp: leg.receivedAt,
        user: "Operador CD",
        description: leg.status === "recibido_con_diferencias"
          ? "Recibido con diferencias"
          : `${leg.returnsCount} devoluciones recibidas en ${order.destinationBranch}`,
        dotColor: leg.status === "recibido_con_diferencias" ? "bg-orange-500" : "bg-green-500",
      });
    }
  }

  if (order.status === "recibida_completa") {
    const lastReceived = order.legs
      .filter(l => l.receivedAt)
      .sort((a, b) => new Date(b.receivedAt!).getTime() - new Date(a.receivedAt!).getTime())[0];
    if (lastReceived?.receivedAt) {
      events.push({
        label: "Transferencia completada",
        timestamp: new Date(new Date(lastReceived.receivedAt).getTime() + 3600000).toISOString(),
        user: "Sistema",
        description: "Todas las devoluciones recibidas en destino",
        dotColor: "bg-green-600",
      });
    }
  }

  if (order.status === "cancelada") {
    events.push({
      label: "Transferencia cancelada",
      timestamp: new Date(new Date(order.createdAt).getTime() + 86400000).toISOString(),
      user: "Admin",
      description: order.notes || "Transferencia anulada",
      dotColor: "bg-red-500",
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Leg action button label ─────────────────────────────────────────────────
function getLegActionLabel(status: TransferLegStatus): { label: string; disabled: boolean } {
  switch (status) {
    case "pendiente": return { label: "Preparar", disabled: false };
    case "preparado": return { label: "Confirmar retiro", disabled: false };
    case "retirado_por_transporte": return { label: "Recepcionar", disabled: false };
    default: return { label: "\u2014", disabled: true };
  }
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function TransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // ── Loading skeleton (R-1) ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t); }, []);

  // ── Toast state with queue support (R-2) ──────────────────────────────
  const [toast, setToast] = useState<{message: string; type: "success"|"error"|"info"} | null>(null);
  const toastTimer = useRef<NodeJS.Timeout>(undefined);
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Cancel confirmation state (A11Y-2) ──────────────────────────────
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const order = useMemo(
    () => MOCK_TRANSFER_ORDERS.find(o => o.id === orderId),
    [orderId]
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

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-4 pb-6">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-6">
          <Link href="/devoluciones" className="hover:text-primary-500 transition-colors">Devoluciones</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <Link href="/devoluciones/transferencias" className="hover:text-primary-500 transition-colors">Transferencias</Link>
        </nav>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ArrowLeftRight className="w-12 h-12 text-neutral-200" />
          <p className="text-neutral-500 text-sm">Transferencia no encontrada</p>
          <Button href="/devoluciones/transferencias" variant="secondary" size="sm" iconLeft={<ChevronLeft className="w-3.5 h-3.5" />}>
            Volver a transferencias
          </Button>
        </div>
      </div>
    );
  }

  const timeline = buildTransferTimeline(order);
  const allReturnIds = order.legs.flatMap(l => l.returnIds);
  const relatedReturns = MOCK_RETURNS.filter(r => allReturnIds.includes(r.id));
  const isFinalState = ["recibida_completa", "cancelada"].includes(order.status);
  const progressPct = order.totalReturns > 0 ? Math.round((order.totalReceived / order.totalReturns) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 pb-6 space-y-5 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/devoluciones" className="hover:text-primary-500 transition-colors">Devoluciones</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <Link href="/devoluciones/transferencias" className="hover:text-primary-500 transition-colors">Transferencias</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">{order.displayId}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-neutral-900">{order.displayId}</h1>
              <TransferStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">
              {order.sellerName} &rarr; {order.destinationBranch}
            </p>
          </div>
        </div>
        <Button
          href="/devoluciones/transferencias"
          variant="secondary"
          size="sm"
          iconLeft={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Volver
        </Button>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Progreso de recepción</span>
          <span className="text-sm font-mono text-neutral-600">
            {order.totalReceived}/{order.totalReturns} recibidas ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              order.status === "recibida_completa" ? "bg-green-500" :
              order.status === "cancelada" ? "bg-red-400" :
              "bg-primary-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main layout: content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Left: main content */}
        <div className="space-y-5">
          {/* Card 1: Tramos de transferencia */}
          <CollapsibleCard
            title="Tramos de transferencia"
            icon={Truck}
            action={
              <span className="text-xs font-medium text-neutral-500">
                {order.legs.length} tramos
              </span>
            }
          >
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-sm" style={{ whiteSpace: "nowrap" }}>
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Sucursal origen</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Estado</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-700">Devoluciones</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Preparación</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Retiro</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Recepción</th>
                    {!isFinalState && (
                      <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-700">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.legs.map(leg => {
                    const action = getLegActionLabel(leg.status);
                    return (
                      <tr key={leg.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-800">{leg.originBranch}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <LegStatusBadge status={leg.status} />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                            {leg.returnsCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-xs text-neutral-500">{fmtDate(leg.preparedAt)}</td>
                        <td className="py-2.5 px-2 text-xs text-neutral-500">{fmtDate(leg.pickedUpAt)}</td>
                        <td className="py-2.5 px-2 text-xs text-neutral-500">{fmtDate(leg.receivedAt)}</td>
                        {!isFinalState && (
                          <td className="py-2.5 px-2 text-right">
                            {!action.disabled ? (
                              <button
                                onClick={() => showToast(`${action.label} para tramo ${leg.originBranch}`, "success")}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                              >
                                {action.label}
                              </button>
                            ) : (
                              <span className="text-xs text-neutral-300">{action.label}</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleCard>

          {/* Card 2: Devoluciones incluidas */}
          <CollapsibleCard
            title="Devoluciones incluidas"
            icon={Package}
            action={
              <span className="text-xs font-medium text-neutral-500">
                {relatedReturns.length} devoluciones
              </span>
            }
          >
            {relatedReturns.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">Sin devoluciones asociadas</p>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="w-full text-sm" style={{ whiteSpace: "nowrap" }}>
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">ID Devolución</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Seller</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Sucursal origen</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Estado</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-700">Tramo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedReturns.map(ret => {
                      const leg = order.legs.find(l => l.returnIds.includes(ret.id));
                      return (
                        <tr key={ret.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                          <td className="py-2 px-2">
                            <Link
                              href={`/devoluciones/${ret.id}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              {ret.displayId}
                            </Link>
                          </td>
                          <td className="py-2 px-2 text-sm text-neutral-700">{ret.sellerName}</td>
                          <td className="py-2 px-2 text-sm text-neutral-600">{ret.branchName}</td>
                          <td className="py-2 px-2">
                            <ReturnStatusBadge status={ret.status} />
                          </td>
                          <td className="py-2 px-2 text-sm text-neutral-600">
                            {leg ? leg.originBranch : "\u2014"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleCard>

          {/* Card 3: Historial */}
          <CollapsibleCard
            title="Historial"
            icon={Clock}
            action={
              <span className="text-xs font-medium text-neutral-500">
                {timeline.length} eventos
              </span>
            }
          >
            {timeline.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">Sin historial de eventos</p>
            ) : (
              <div className="relative">
                {timeline.map((event, idx) => {
                  const isLast = idx === timeline.length - 1;
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${event.dotColor}`} />
                        {!isLast && (
                          <div className="w-px flex-1 bg-neutral-200 min-h-[24px]" />
                        )}
                      </div>
                      <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                        <p className="text-sm font-medium text-neutral-900 leading-tight">
                          {event.label}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{fmtDate(event.timestamp)}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          <span className="font-medium text-neutral-600">{event.user}</span>
                          {event.description && (
                            <span> &mdash; {event.description}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleCard>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-5">
          {/* Summary card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Resumen</h3>
            <dl className="space-y-3">
              <InfoField label="Seller">
                <span className="text-sm font-medium text-neutral-900">{order.sellerName}</span>
              </InfoField>
              <InfoField label="Destino">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm text-neutral-900">{order.destinationBranch}</span>
                </div>
              </InfoField>
              <InfoField label="Creado por">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm text-neutral-900">{order.requestedByUser}</span>
                </div>
              </InfoField>
              <InfoField label="Fecha de creación">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm text-neutral-900">{fmtDate(order.createdAt)}</span>
                </div>
              </InfoField>
              {order.notes && (
                <InfoField label="Notas">
                  <div className="flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-400 mt-0.5" />
                    <span className="text-sm text-neutral-700">{order.notes}</span>
                  </div>
                </InfoField>
              )}
            </dl>
          </div>

          {/* Actions card */}
          {!isFinalState && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-neutral-900">Acciones</h3>
              <Button
                variant="secondary"
                size="sm"
                className="w-full !text-red-600 hover:!bg-red-50"
                iconLeft={<Ban className="w-3.5 h-3.5" />}
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancelar transferencia
              </Button>
            </div>
          )}

          {/* Quick stats */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-neutral-900">{order.totalReturns}</p>
                <p className="text-xs text-neutral-500">Total dev.</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-neutral-900">{order.totalReceived}</p>
                <p className="text-xs text-neutral-500">Recibidas</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-neutral-900">{order.legs.length}</p>
                <p className="text-xs text-neutral-500">Tramos</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-neutral-900">
                  {order.legs.filter(l => l.status === "recibido" || l.status === "recibido_con_diferencias").length}
                </p>
                <p className="text-xs text-neutral-500">Completados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel transfer confirmation modal (A11Y-2) ── */}
      {showCancelConfirm && (
        <AlertModal
          open={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          icon={AlertTriangle}
          variant="danger"
          title="Cancelar transferencia"
          subtitle={order.displayId}
          confirm={{
            label: "Cancelar transferencia",
            onClick: () => {
              showToast(`Transferencia ${order.displayId} cancelada (mock)`, "success");
              setShowCancelConfirm(false);
            },
          }}
          cancelLabel="Volver"
        >
          <p className="text-sm text-neutral-600">
            Esta acción es irreversible. Todas las devoluciones incluidas volverán a su estado anterior.
          </p>
        </AlertModal>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" :
          toast.type === "error" ? "bg-red-600 text-white" :
          "bg-neutral-800 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
           toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> :
           <Info className="w-4 h-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
