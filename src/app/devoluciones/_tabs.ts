import type { TabDef } from "@/components/layout/ModuleTabs";

export const DEVOLUCIONES_MODULE_TABS: TabDef[] = [
  { label: "Bandeja de devoluciones", shortLabel: "Bandeja", href: "/devoluciones" },
  { label: "Crear devolución", shortLabel: "Crear", href: "/devoluciones/crear" },
  { label: "Transferencias", href: "/devoluciones/transferencias" },
  { label: "Entregas", href: "/devoluciones/entregas" },
  { label: "Paquetes desconocidos", shortLabel: "Paq. desconocidos", href: "/devoluciones/paquetes-desconocidos" },
];
