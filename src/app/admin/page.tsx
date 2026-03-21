"use client";

import StatsCard from "@/components/admin/StatsCard";
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";

const STATS = [
  {
    title: "Ingresos totales",
    value: "$45.231,89",
    delta: { value: "+20,1%", label: "desde el mes pasado", color: "green" as const },
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    title: "Suscripciones",
    value: "+2.350",
    delta: { value: "+180,1%", label: "desde el mes pasado", color: "green" as const },
    icon: <Users className="w-5 h-5" />,
  },
  {
    title: "Ventas",
    value: "+12.234",
    delta: { value: "+19%", label: "desde el mes pasado", color: "green" as const },
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    title: "Activos ahora",
    value: "+573",
    delta: { value: "+201", label: "desde la última hora", color: "blue" as const },
    icon: <Activity className="w-5 h-5" />,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Resumen general de la plataforma</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
