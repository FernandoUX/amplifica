import type { TabDef } from "@/components/layout/ModuleTabs";

export const RECEPCIONES_TABS: TabDef[] = [
  { label: "Órdenes de recepción", shortLabel: "Órdenes", href: "/recepciones" },
  { label: "Cuarentena", href: "/recepciones/cuarentena" },
  { label: "Configuración", shortLabel: "Config.", href: "/recepciones/configuracion" },
];
