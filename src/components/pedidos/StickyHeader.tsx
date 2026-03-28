"use client";

import PedidoStatusBadge from "./PedidoStatusBadge";
import EnvioStatusBadge from "./EnvioStatusBadge";
import PagoStatusBadge from "./PagoStatusBadge";
import QuickActionsMenu from "./QuickActionsMenu";
import type { PedidoStatus } from "./PedidoStatusBadge";
import type { EnvioStatus } from "./EnvioStatusBadge";
import type { PagoStatus } from "@/app/pedidos/_data";

type QuickAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
};

type StickyHeaderProps = {
  visible: boolean;
  pedidoId: string;
  estadoPreparacion: PedidoStatus;
  estadoEnvio: EnvioStatus;
  estadoPago?: PagoStatus;
  quickActions: QuickAction[];
};

export default function StickyHeader({
  visible,
  pedidoId,
  estadoPreparacion,
  estadoEnvio,
  estadoPago,
  quickActions,
}: StickyHeaderProps) {
  return (
    <div
      data-no-print
      className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-6 h-12 flex items-center justify-between gap-4">
        {/* Left: ID */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-neutral-900 truncate font-sans">{pedidoId}</span>
          <div className="hidden sm:flex items-center gap-2">
            <PedidoStatusBadge status={estadoPreparacion} />
            <EnvioStatusBadge status={estadoEnvio} />
            {estadoPago && <PagoStatusBadge status={estadoPago} />}
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <QuickActionsMenu actions={quickActions} />
        </div>
      </div>
    </div>
  );
}
