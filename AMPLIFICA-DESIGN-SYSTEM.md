# Amplifica — Design System
> Versión: 1.4 | Última actualización: 2026-03-27
> Este archivo es la fuente de verdad para todos los tokens, componentes y patrones de UI de Amplifica.
> **INSTRUCCIÓN PARA CLAUDE:** Antes de crear cualquier componente, módulo o feature, revisa este archivo y respeta estrictamente los tokens definidos. No inventes colores, tipografías ni espaciados fuera de este sistema.

---

## 1. Fundamentos

### 1.1 Tipografía

| Token | Valor |
|---|---|
| Font family | `Inter, -apple-system, BlinkMacSystemFont, sans-serif` |
| Font size base | `13px` |
| Line height base | `1.5` |
| Font weight regular | `400` |
| Font weight medium | `500` |
| Font weight semibold | `600` |
| Font weight bold | `700` |

**Escala tipográfica:**

| Uso | Size | Weight | Color |
|---|---|---|---|
| Body / tabla | `13px` | `400` | `#374151` |
| Label / caption | `12px` | `400` | `#6B7280` |
| Heading página | `15px` | `700` | `#111827` |
| Subheading sección | `13px` | `600` | `#111827` |
| Logo wordmark | `15px` | `700` | `#111827` |
| Botón | `13px` | `500` | según variante |

---

### 1.2 Paleta de colores

#### Grises (base del sistema)

| Token | Hex | Uso |
|---|---|---|
| `gray-50` | `#F9FAFB` | Background global de la app |
| `gray-100` | `#F3F4F6` | Background hover, rows alternos, chips |
| `gray-200` | `#E5E7EB` | Bordes, divisores, separadores |
| `gray-300` | `#D1D5DB` | Bordes secundarios, inputs disabled |
| `gray-400` | `#9CA3AF` | Íconos, placeholders, texto disabled |
| `gray-500` | `#6B7280` | Texto secundario, labels, captions |
| `gray-600` | `#4B5563` | Texto secundario dark |
| `gray-700` | `#374151` | Texto body principal |
| `gray-800` | `#1F2937` | Texto énfasis |
| `gray-900` | `#111827` | Texto headings, logo, primary |

#### Colores de estado

| Token | Hex | Uso |
|---|---|---|
| `blue-500` | `#3B82F6` | Acciones primarias, links, selected state |
| `blue-600` | `#2563EB` | Hover de acciones primarias |
| `blue-50` | `#EFF6FF` | Background de badges informativos |
| `blue-100` | `#DBEAFE` | Background de badges selected |
| `green-500` | `#22C55E` | Estado "completado", "activo", "aprobado" |
| `green-50` | `#F0FDF4` | Background badge verde |
| `green-100` | `#DCFCE7` | Background badge verde secundario |
| `yellow-500` | `#EAB308` | Estado "pendiente", "en proceso", "advertencia" |
| `yellow-50` | `#FEFCE8` | Background badge amarillo |
| `yellow-100` | `#FEF9C3` | Background badge amarillo secundario |
| `red-500` | `#EF4444` | Error, estado "rechazado", "cancelado" |
| `red-50` | `#FEF2F2` | Background badge rojo |
| `red-100` | `#FEE2E2` | Background badge rojo secundario |
| `purple-500` | `#A855F7` | Estado especial / en revisión |
| `purple-50` | `#FAF5FF` | Background badge púrpura |

---

### 1.3 Espaciado

Sistema base de `4px`:

| Token | Valor | Uso |
|---|---|---|
| `space-1` | `4px` | Gap mínimo entre íconos e inline elements |
| `space-2` | `8px` | Padding interno de badges, gap entre elementos pequeños |
| `space-3` | `12px` | Padding de botones (vertical), gap estándar |
| `space-4` | `16px` | Padding de secciones, gap estándar de layouts |
| `space-5` | `20px` | Padding de contenedores medianos |
| `space-6` | `24px` | Padding de contenedores grandes |
| `space-8` | `32px` | Separación entre secciones principales |

---

### 1.4 Bordes y radio

| Token | Valor | Uso |
|---|---|---|
| `border-color` | `#E5E7EB` | Todos los bordes de componentes |
| `border-width` | `1px` | Estándar |
| `radius-sm` | `4px` | Badges, tags pequeños |
| `radius-md` | `6px` | Botones, inputs, cards pequeñas |
| `radius-lg` | `8px` | Cards, modals, dropdowns |
| `radius-full` | `9999px` | Avatars, pills |

---

### 1.5 Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Botones, inputs en focus |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)` | Modals, popovers |

---

## 2. Layout global

### 2.1 Estructura base de la app

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (232px fijo)  │  Main content (flex-1)      │
│  bg: #fff              │  bg: #F9FAFB                │
│  border-right: 1px     │                             │
│  #E5E7EB               │  ┌──── Topbar ─────────┐   │
│                        │  │ h: 48px, border-b    │   │
│  ┌── Logo (48px) ───┐  │  └─────────────────────┘   │
│  ├── Nav items ─────┤  │                             │
│  ├── Sub-items ─────┤  │  ┌──── Content area ───┐   │
│  └─────────────────-┘  │  │ padding: 16px        │   │
│                        │  └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2.2 Sidebar

| Propiedad | Valor |
|---|---|
| Width | `232px` (fijo, no colapsable en MVP) |
| Background | `#ffffff` |
| Border right | `1px solid #E5E7EB` |
| Logo area height | `~48px` |
| Padding horizontal | `16px` |
| Nav item height | `32px` |
| Nav item radius | `6px` |
| Nav item active bg | `#F3F4F6` |
| Nav item active text | `#111827` |
| Nav item default text | `#6B7280` |
| Nav item hover bg | `#F9FAFB` |
| Icon size | `16px` |
| Subitem indent | `28px` desde el borde |

### 2.3 Topbar / Header de módulo

| Propiedad | Valor |
|---|---|
| Height | `48px` |
| Background | `#ffffff` |
| Border bottom | `1px solid #E5E7EB` |
| Padding horizontal | `16px` |
| Título del módulo | `15px / 700 / #111827` |
| Subtítulo / breadcrumb | `12px / 400 / #6B7280` |

---

## 3. Componentes

### 3.1 Botones

#### Variante Primary

```
bg: #111827   text: #ffffff   border: none
hover: #1F2937
padding: 7px 12px   font: 13px/500   radius: 6px
```

#### Variante Secondary / Outline

```
bg: #ffffff   text: #374151   border: 1px solid #D1D5DB
hover bg: #F9FAFB
padding: 7px 12px   font: 13px/500   radius: 6px
```

#### Variante Ghost

```
bg: transparent   text: #6B7280   border: none
hover bg: #F3F4F6
padding: 7px 8px   font: 13px/500   radius: 6px
```

#### Variante Destructive

```
bg: #EF4444   text: #ffffff   border: none
hover: #DC2626
padding: 7px 12px   font: 13px/500   radius: 6px
```

#### Tamaños

| Tamaño | Padding | Font |
|---|---|---|
| `sm` | `5px 10px` | `12px` |
| `md` (default) | `7px 12px` | `13px` |
| `lg` | `9px 16px` | `14px` |

#### Íconos en botones

- Ícono a la izquierda: `gap: 6px`, ícono `14px`
- Solo ícono (icon button): `padding: 7px`, width/height `32px`

---

### 3.2 Inputs y campos de formulario

| Propiedad | Valor |
|---|---|
| Height | `32px` |
| Background | `#ffffff` |
| Border | `1px solid #D1D5DB` |
| Border (focus) | `1px solid #3B82F6` + `box-shadow: 0 0 0 3px rgba(59,130,246,0.15)` |
| Border radius | `6px` |
| Padding horizontal | `10px` |
| Font | `13px / 400 / #111827` |
| Placeholder | `#9CA3AF` |
| Disabled bg | `#F9FAFB` |
| Disabled text | `#9CA3AF` |

**Search input:** Ícono de búsqueda `14px / #9CA3AF` a la izquierda, `padding-left: 32px`

---

### 3.3 Select / Dropdown

Mismo estilo visual que input. Con chevron derecho `14px / #9CA3AF`. Dropdown:

| Propiedad | Valor |
|---|---|
| Background | `#ffffff` |
| Border | `1px solid #E5E7EB` |
| Border radius | `8px` |
| Shadow | `shadow-md` |
| Item height | `32px` |
| Item padding | `6px 10px` |
| Item hover bg | `#F3F4F6` |
| Item selected bg | `#EFF6FF` |
| Item selected text | `#2563EB` |
| Separator | `1px solid #F3F4F6` |

---

### 3.4 Badges / Status chips

Formato: `padding: 2px 8px / radius: 9999px / font: 12px/500`

| Estado | Background | Text | Uso |
|---|---|---|---|
| Pendiente | `#FEF9C3` | `#A16207` | Órdenes sin procesar |
| En proceso | `#FEF9C3` | `#A16207` | En tránsito / parcial |
| Completado | `#DCFCE7` | `#15803D` | Recibido / cerrado |
| Rechazado | `#FEE2E2` | `#B91C1C` | Cancelado / error |
| Borrador | `#F3F4F6` | `#6B7280` | Draft / sin confirmar |
| Info | `#DBEAFE` | `#1D4ED8` | Informativo / revisar |
| Especial | `#F3E8FF` | `#7E22CE` | Revisión / especial |

---

### 3.5 Tabla de datos — ESPECIFICACIÓN CANÓNICA

> **⚠️ FUENTE DE VERDAD:** Esta sección define la implementación OBLIGATORIA de tablas para TODOS los módulos de Amplifica. Cualquier tabla nueva DEBE seguir esta especificación exactamente. La referencia de implementación es `/src/app/pedidos/page.tsx` (vista mejorada).

#### Jerarquía de estructura

```
Table Container (rounded-2xl wrapper, flex-col, flex-1)
├── Scroll Area (overflow-x-auto overflow-y-auto, flex-1)
│   └── <table> (w-full, table-fixed, border-collapse)
│       ├── <thead> (sticky top-0 z-10)
│       │   └── <tr> (border-b border-neutral-100 bg-neutral-50)
│       │       ├── <th> checkbox (w-[44px])
│       │       ├── <th> data columns (sortable o static)
│       │       └── <th> acciones (sticky right, w-[80px])
│       └── <tbody> (divide-y divide-neutral-50)
│           └── <tr> rows (hover:bg-neutral-50/60)
│               ├── <td> checkbox
│               ├── <td> data cells
│               └── <td> acciones (sticky right)
└── Pagination Bar (flex-shrink-0, border-t border-neutral-100)
    ├── Left: Mostrar select + counter "1–20 de 70"
    └── Right: First/Prev/Pages/Next/Last
```

---

#### Clases obligatorias por elemento

**Table container:**
```tsx
className="hidden sm:flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden relative"
```

**Scroll area:**
```tsx
className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full table-scroll scroll-fade-right"
```

**Table element:**
```tsx
className="w-full table-fixed text-sm border-collapse font-sans tracking-normal"
```

**thead:**
```tsx
className="sticky top-0 z-10"
```

**thead > tr:**
```tsx
className="border-b border-neutral-100 bg-neutral-50"
```

**th (columnas de datos):**
```tsx
className="text-left py-2 px-2 text-xs font-semibold text-neutral-700"
style={{ whiteSpace: "nowrap" }}
```

**th (columna checkbox, primera columna):**
```tsx
className="py-2 px-2 w-[44px]"
```

**th (columna acciones, sticky right, última columna):**
```tsx
className="w-[80px] py-2 px-2 text-xs font-semibold text-neutral-700 bg-neutral-50"
style={{ whiteSpace: "nowrap", position: "sticky", right: 0, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}
```

**tbody:**
```tsx
className="divide-y divide-neutral-50"
```

**tbody > tr:**
```tsx
className="hover:bg-neutral-50/60 transition-colors"
```
> **NUNCA** usar `style={{ height: 40 }}` en rows. El alto se define por el padding de las celdas.

**td (celdas de datos):**
```tsx
className="py-2 px-2"
```

**td (checkbox):**
```tsx
className="px-2 text-center"
```

**td (acciones, sticky right):**
```tsx
className="py-2 px-2 bg-white"
style={{ position: "sticky", right: 0, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)" }}
```

---

#### Helper constants (obligatorios)

```tsx
const NW: React.CSSProperties = { whiteSpace: "nowrap" };
const stickyRight: React.CSSProperties = {
  position: "sticky",
  right: 0,
  boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.07)",
};
```

---

#### Tokens de tabla (resumen)

| Propiedad | Valor |
|---|---|
| Container | `bg-white border border-neutral-200 rounded-2xl overflow-hidden` |
| Table layout | `table-fixed text-sm border-collapse font-sans tracking-normal` |
| Scroll | `overflow-x-auto overflow-y-auto table-scroll scroll-fade-right` |
| Header bg | `bg-neutral-50` (sticky top-0 z-10) |
| Header text | `text-xs font-semibold text-neutral-700` (**NO uppercase, NO tracking-wider**) |
| Header padding | `py-2 px-2` |
| Header border | `border-b border-neutral-100` |
| Row divider | `divide-y divide-neutral-50` en `<tbody>` |
| Row hover | `hover:bg-neutral-50/60 transition-colors` |
| Row selected | `bg-primary-50/40` |
| Cell padding | `py-2 px-2` |
| Cell text | `text-xs text-neutral-600` |
| Cell text primary | `text-xs text-neutral-700 font-medium` (ej. tienda, seller) |
| Cell numbers | `text-xs tabular-nums` |
| All cells | `white-space: nowrap` vía helper `NW` |

> **⚠️ REGLA:** Los headers de tabla NUNCA llevan `uppercase` ni `tracking-wider`. Siempre `text-xs font-semibold text-neutral-700`.

---

#### Sorting

| Propiedad | Valor |
|---|---|
| Sortable th extras | `cursor-pointer hover:text-neutral-900 select-none` + `onClick` |
| SortIcon inactivo | `ArrowUpDown` `w-3 h-3 text-neutral-400 inline ml-1 align-middle` |
| SortIcon asc | `ArrowUp` `w-3 h-3 text-primary-500 inline ml-1 align-middle` |
| SortIcon desc | `ArrowDown` `w-3 h-3 text-primary-500 inline ml-1 align-middle` |
| Estado | `sortField: string | null`, `sortDir: "asc" | "desc"` |
| Orden | Aplicar sort DESPUÉS de filtros, ANTES de paginación |

```tsx
function SortIcon({ field, sortField, sortDir }: {
  field: string; sortField: string | null; sortDir: "asc" | "desc"
}) {
  if (sortField !== field)
    return <ArrowUpDown className="w-3 h-3 text-neutral-400 inline ml-1 align-middle" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />
    : <ArrowDown className="w-3 h-3 text-primary-500 inline ml-1 align-middle" />;
}

const toggleSort = (f: string) => {
  if (sortField === f) {
    if (sortDir === "asc") setSortDir("desc");
    else { setSortField(null); setSortDir("asc"); }
  } else { setSortField(f); setSortDir("asc"); }
};
```

---

#### ID chip

```tsx
<span className="inline-block bg-neutral-100 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded px-1 py-0.5 text-xs font-mono transition-colors cursor-pointer">
  {id}
</span>
```

---

#### Checkbox de selección

| Propiedad | Valor |
|---|---|
| Size | `w-3.5 h-3.5` (14x14px) |
| Border | `border-[1.5px] border-neutral-300` |
| Border radius | `rounded-[3px]` |
| Checked | `bg-primary-500 border-primary-500` + check SVG blanco |
| Indeterminate | línea blanca `w-2 h-2` |
| Column width | `w-[44px]` (touch target) |

---

#### Acciones de fila (sticky right)

| Propiedad | Valor |
|---|---|
| Column width | `w-[80px]` |
| Position | `sticky right-0` |
| Shadow | `box-shadow: -4px 0 8px -2px rgba(0,0,0,0.07)` |
| Header bg | `bg-neutral-50` (match header) |
| Row bg | `bg-white` |
| Botones | `p-1.5 rounded-lg`, hover: `text-primary-600 bg-primary-50` |
| Icon size | `w-3.5 h-3.5` |

---

#### Indicador de atención (línea roja lateral)

Para filas que requieren acción inmediata (ej: "Con atraso", "Entrega fallida"):

| Propiedad | Valor |
|---|---|
| Método | `style={{ boxShadow: "inset 3px 0 0 0 #f87171" }}` en `<tr>` |
| Alternativa CSS | `border-l-[3px] border-l-red-500 bg-red-50/30` |

---

#### Paginación (DENTRO del table container)

> **⚠️ OBLIGATORIO:** La paginación siempre va DENTRO del table container (`rounded-2xl`), nunca fuera.

**Container paginación:**
```tsx
className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100"
```

**Lado izquierdo — Mostrar select + counter:**

| Elemento | Clase |
|---|---|
| Wrapper | `flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer` |
| Label "Mostrar" | `text-neutral-500` |
| Select | `bg-transparent font-medium focus:outline-none cursor-pointer` |
| Opciones | `20`, `50`, `100` |
| Counter | `text-sm text-neutral-500 tabular-nums` → "1–20 de 70" |

**Lado derecho — Navegación con números de página:**

| Elemento | Clase |
|---|---|
| Nav arrows | `w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30` |
| First/Last icons | `ChevronsLeft` / `ChevronsRight` `w-4 h-4` |
| Prev/Next icons | `ChevronLeft` / `ChevronRight` `w-4 h-4` |
| Page number | `w-9 h-9 rounded-lg text-sm font-medium` |
| Page active | `bg-primary-25 text-primary-900` |
| Page inactive | `text-neutral-600 hover:bg-neutral-100` |
| Ellipsis | `text-neutral-400 text-sm` "..." |
| Pages visible | Primeras 3 + ... + últimas 3 (si > 7 páginas) |
| Mobile | Page numbers hidden (`hidden sm:flex`), solo flechas |

```tsx
// Helper: genera [1, 2, 3, "...", 6, 7, 8]
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= Math.min(3, total); i++) pages.push(i);
  const mid = new Set<number>();
  for (let i = current - 1; i <= current + 1; i++) {
    if (i > 3 && i < total - 2) mid.add(i);
  }
  if (mid.size > 0) {
    if (Math.min(...mid) > 4) pages.push("...");
    [...mid].sort((a, b) => a - b).forEach(p => pages.push(p));
    if (Math.max(...mid) < total - 3) pages.push("...");
  } else { pages.push("..."); }
  for (let i = Math.max(total - 2, 4); i <= total; i++) pages.push(i);
  return pages;
}
```

**JSX canónico de paginación:**

```tsx
<div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-white border-t border-neutral-100">
  {/* Left: Mostrar + counter */}
  <div className="flex items-center gap-3">
    <label className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-3 h-9 text-sm text-neutral-700 cursor-pointer">
      <span className="text-neutral-500">Mostrar</span>
      <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
        className="bg-transparent font-medium focus:outline-none cursor-pointer">
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </label>
    <span className="text-sm text-neutral-500 tabular-nums">{fromRow}–{toRow} de {total}</span>
  </div>
  {/* Right: page navigation */}
  <div className="flex items-center gap-1">
    <button title="Primera" onClick={() => setPage(1)} disabled={page <= 1}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
      <ChevronsLeft className="w-4 h-4" />
    </button>
    <button title="Anterior" onClick={() => setPage(p => p - 1)} disabled={page <= 1}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
      <ChevronLeft className="w-4 h-4" />
    </button>
    <div className="hidden sm:flex items-center gap-0.5">
      {getPageNumbers(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-neutral-400 text-sm">...</span>
        ) : (
          <button key={p} onClick={() => setPage(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium ${
              p === page ? "bg-primary-25 text-primary-900" : "text-neutral-600 hover:bg-neutral-100"
            }`}>{p}</button>
        )
      )}
    </div>
    <button title="Siguiente" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
      <ChevronRight className="w-4 h-4" />
    </button>
    <button title="Última" onClick={() => setPage(totalPages)} disabled={page >= totalPages}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
      <ChevronsRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

---

#### Features obligatorias (checklist para TODA tabla)

Cada tabla de la plataforma DEBE implementar:

1. ✅ **Checkbox bulk selection** — th + td con `w-[44px]` touch target
2. ✅ **Sticky header** — thead `sticky top-0 z-10`
3. ✅ **Sticky actions column** — última columna `sticky right-0` con sombra
4. ✅ **Column sorting** — al menos fecha + columnas clave con `toggleSort()`
5. ✅ **Paginación numerada** — Mostrar select (20/50/100) + page numbers + flechas
6. ✅ **Empty state** — icono + mensaje + CTA cuando no hay datos
7. ✅ **Loading skeleton** — rows con `animate-pulse` mientras carga
8. ✅ **Search con debounce** — input de búsqueda con al menos 300ms debounce
9. ✅ **Status tabs** — Variante B pills (ver §3.9) para filtrar por estado
10. ✅ **Scroll fade right** — indicador visual de scroll horizontal (`scroll-fade-right`)

---

#### Anti-patterns (NUNCA hacer)

| Anti-pattern | Razón |
|---|---|
| ❌ Paginación FUERA del table container | Debe estar dentro del `rounded-2xl` wrapper |
| ❌ `border-t` / `border-b` en rows individuales | Usar `divide-y divide-neutral-50` en `<tbody>` |
| ❌ `style={{ height: 40 }}` en rows | El alto lo define el padding de celdas |
| ❌ `uppercase tracking-wide` en headers | Headers siempre `text-xs font-semibold text-neutral-700` |
| ❌ Padding diferente entre módulos | Siempre `py-2 px-2` en headers y celdas |
| ❌ Falta `table-fixed` o `border-collapse` | Obligatorios en el `<table>` |
| ❌ Falta `font-sans tracking-normal` en `<table>` | Previene herencia incorrecta de fuente |
| ❌ Falta `min-h-0` en container y scroll area | Necesarios para que flex-1 funcione con overflow |

---

### 3.6 Toolbar de tabla (filtros y acciones)

Layout en 2 filas dentro de un contenedor `flex flex-col gap-3 mb-3`:

#### Fila 1: Tabs de estado + acciones principales

```
[Status Tabs pill scroll (flex-1)]  │  [Exportar] [Escanear QR] [Crear recepción]
```

- Tabs: componente pill scroll (ver sección 3.9 Variante B)
- Acciones: `flex items-center gap-2 flex-shrink-0`

#### Fila 2: Filtros + búsqueda + configuración

```
[≡ Filtros (badge)]  [🔍 Buscar por ID, seller o destino…]  [⫶ Columnas]
```

| Elemento | Specs |
|---|---|
| Botón filtros | `h-9 w-9 bg-neutral-100 rounded-lg`, icono SlidersHorizontal `w-4 h-4` |
| Badge filtros | `absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full` |
| Search input | `h-9 bg-neutral-100 rounded-lg px-3`, icono Search `w-4 h-4 text-neutral-400`, placeholder `text-sm` |
| Botón columnas | `h-9 w-9 bg-neutral-100 rounded-lg`, icono Columns3 `w-4 h-4` |

---

### 3.8 Modal / Dialog

| Propiedad | Valor |
|---|---|
| Overlay bg | `rgba(0,0,0,0.40)` |
| Modal bg | `#ffffff` |
| Border radius | `12px` |
| Shadow | `shadow-lg` |
| Max width (sm) | `480px` |
| Max width (md) | `600px` |
| Max width (lg) | `800px` |
| Header padding | `20px 24px 16px` |
| Body padding | `0 24px 20px` |
| Footer padding | `16px 24px 20px` |
| Footer border-top | `1px solid #E5E7EB` |
| Title | `15px / 700 / #111827` |
| Subtitle | `13px / 400 / #6B7280` |

---

### 3.9 Tabs

> **⚠️ REGLA OBLIGATORIA:** Los tabs NUNCA deben tener scroll vertical. Siempre usar `overflow-x-auto overflow-y-hidden` con `scrollbar-width: none`. Esto aplica a ambas variantes (A y B).

#### Variante A: Tabs de módulo (show de detalle)

| Propiedad | Valor |
|---|---|
| Container overflow | `overflow-x-auto overflow-y-hidden`, `scrollbar-width: none` |
| Container border-bottom | `1px solid #E5E7EB` |
| Tab padding | `8px 16px` |
| Tab font | `13px / 500` |
| Active text | `#111827` |
| Active border-bottom | `2px solid #111827` |
| Default text | `#6B7280` |
| Hover bg | `#F9FAFB` |

#### Variante B: Tabs de estado en listas (pill tabs) — PATRÓN PRINCIPAL

Usado en todas las listas (B2C, B2B, recepciones) para filtrar por estado. Es el estándar de la plataforma.

| Propiedad | Valor |
|---|---|
| Container | `bg-neutral-100 rounded-lg h-9 gap-0.5 px-0.5`, scroll horizontal con `tabs-scroll`, `scrollbar-width: none` |
| Tab pill (default) | `h-8 px-2.5 rounded-md text-[13px] leading-tight text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5 flex-shrink-0` |
| Tab pill (active) | `bg-white text-neutral-900 font-medium shadow-sm` |
| Letter spacing | `-0.02em` |
| Ícono (opcional) | `w-3.5 h-3.5 text-neutral-400`, a la izquierda del label. Active: color del estado |
| Badge count | `ml-0.5 text-[10px] tabular-nums rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 font-medium` |
| Badge count (active "Todos") | `bg-primary-500 text-white` |
| Badge count (active estado) | Color del estado (ver TAB_BADGE_COLORS por módulo) |
| Badge count (inactive) | `bg-neutral-200/70 text-neutral-500` |
| Scroll arrows | Gradient overlays `from-neutral-100 to-transparent w-16` + ChevronLeft/Right `w-4 h-4` |
| Drag-to-scroll | `onMouseDown` drag behavior con `tabsDragRef` |

```tsx
// Estructura estándar
<div className="flex items-center gap-0.5 overflow-x-auto px-0.5 bg-neutral-100 rounded-lg select-none h-9 tabs-scroll"
  style={{ scrollbarWidth: "none" }}>
  <button
    style={{ whiteSpace: "nowrap", letterSpacing: "-0.02em" }}
    className={`px-2.5 gap-1.5 rounded-md text-[13px] leading-tight flex-shrink-0 flex items-center h-8 ${
      active ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-500 hover:text-neutral-700"
    }`}>
    {icon && <Icon className={`w-3.5 h-3.5 ${active ? activeIconColor : "text-neutral-400"}`} />}
    {label}
    <span className={`ml-0.5 text-[10px] tabular-nums rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 font-medium ${badgeCls}`}>
      {count}
    </span>
  </button>
</div>
```

**Regla:** Usar Variante B en todas las listas con filtros por estado. Usar Variante A solo en vistas de detalle (show) para navegar tabs de contenido.

---

### 3.10 Modal de filtros

Patrón de filtro avanzado usado en tablas. Se activa desde el botón SlidersHorizontal en el toolbar.

| Propiedad | Valor |
|---|---|
| Overlay | `fixed inset-0 z-50, rgba(0,0,0,0.35)` |
| Container | `bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4` |
| Header | `px-5 py-4 border-b border-neutral-100` |
| Header icon | `w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center` con SlidersHorizontal `w-4 h-4 text-neutral-600` |
| Header title | `text-base font-semibold text-neutral-900` |
| Header badge | `w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full` (count de filtros activos) |
| Body | `p-5 space-y-5 overflow-y-auto max-h-[60vh]` |
| Date range | Label `text-[10px] font-semibold text-neutral-500 uppercase tracking-wider`, input `text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500` |
| Footer | `px-5 py-4 border-t border-neutral-100 bg-neutral-50` |
| Footer clear | `text-sm text-neutral-500 hover:text-neutral-700 font-medium disabled:opacity-40` |
| Footer apply | `bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg` |

#### FilterSection (accordion)

| Propiedad | Valor |
|---|---|
| Header | `text-xs font-semibold text-neutral-500 uppercase tracking-wide` |
| Header badge | `min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-bold rounded-full` |
| Chevron | `w-3.5 h-3.5 text-neutral-400`, rotate `-90deg` cuando cerrado |
| Option row | `px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors` |
| Checkbox | `w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500` |
| Scrollable | Cuando ≥4 opciones: `overflow-y-auto max-h-[176px] pr-1 filter-scroll` |

---

### 3.11 MiniTimeline (detalle de pedido)

Componente de timeline horizontal para mostrar el progreso de fases de un pedido. Muestra 3 pasos visibles a la vez con navegación.

#### Estructura

```
┌─ Card size="sm" ──────────────────────────────────────────┐
│ FASE VALIDACIÓN                              ✓ Cumplido   │ ← header
│ SLA: 19 mar 2026 22:15                                    │
│     Recepción     Validación     Preparación              │ ← labels
│   ──── ●(✓) ──────── ●(📋) ─────── ○(📦) ───            │ ← line + icons
│  ◄     22:15          22:15       21 mar 2026          ►  │ ← times + nav
│                    Paso 2 de 6                            │ ← counter
└───────────────────────────────────────────────────────────┘
```

#### Tokens

| Propiedad | Valor |
|---|---|
| Card | `<Card size="sm">`, `<CardContent className="!py-2 !px-3">` |
| Phase label | `text-[10px] font-bold uppercase tracking-wider`, color por estado |
| SLA text | `text-[10px] text-neutral-500` |
| SLA badge | `rounded-full px-2 py-0.5 text-[10px] font-semibold` |
| SLA cumplido | `bg-green-50 text-green-700` |
| SLA atrasado | `bg-red-50 text-red-600` |
| SLA en riesgo | `bg-amber-50 text-amber-700` |
| Step label | `text-[10px] font-medium`, active: `font-semibold text-neutral-900`, done: `text-neutral-600`, pending: `text-neutral-400` |
| Icon circle | `w-8 h-8 rounded-full flex items-center justify-center` |
| Icon circle done | `bg-neutral-500 border-neutral-500` (check blanco) |
| Icon circle active | `bg-sky-500 border-sky-500 ring-4 ring-sky-100` |
| Icon circle late | `bg-red-500 border-red-500 ring-4 ring-red-100` |
| Icon circle pending | `bg-white border-neutral-300` |
| Icon inner | `w-4 h-4` |
| Timeline line | `h-0.5 bg-neutral-200`, progreso: `bg-neutral-500` |
| Time text | `text-[9px] tabular-nums`, done: `text-neutral-500`, late: `text-red-500` |
| Nav arrows | Absolutas sobre la línea, `w-7 h-7 rounded-full`, degradé `from-white via-white/90 to-transparent` |
| Step counter | `text-[9px] text-neutral-400` "Paso X de N" |
| Visible steps | Máximo 3 a la vez, navegación con offset |

---

### 3.12 Tooltips

```
bg: #111827   text: #ffffff   font: 12px/400
padding: 5px 8px   radius: 6px   max-width: 220px
```

---

### 3.13 Toast / Notificaciones

| Propiedad | Valor |
|---|---|
| Background | `#ffffff` |
| Border | `1px solid #E5E7EB` |
| Shadow | `shadow-md` |
| Border radius | `8px` |
| Padding | `12px 16px` |
| Min width | `300px` |
| Max width | `420px` |
| Posición | Bottom-right, `24px` del borde |
| Icono éxito | Verde `#22C55E` |
| Icono error | Rojo `#EF4444` |
| Icono info | Azul `#3B82F6` |
| Título | `13px / 600 / #111827` |
| Descripción | `13px / 400 / #6B7280` |

---

### 3.14 Empty state

```
Centro del contenedor, padding vertical 48px
Ícono grande: 40px, color #D1D5DB
Título: 14px/600/#111827
Descripción: 13px/400/#6B7280
Acción (si aplica): botón primary centrado, margin-top: 16px
```

---

### 3.15 KPI Cards (módulos de lista)

Cards de métricas clave en la parte superior de cada lista de módulo (pedidos B2C, B2B, recepciones). Son el patrón estándar para resumen operativo.

#### Container

| Propiedad | Valor |
|---|---|
| Background | `bg-[#111759]` (navy dark) con gradiente sutil |
| Border radius | `16px` (rounded-2xl) |
| Overflow | Horizontal scroll en mobile |
| Grid | Flex row, scroll horizontal, divididos por separador vertical `border-r border-white/10` |

#### Card individual

| Propiedad | Valor |
|---|---|
| Min width mobile | `65vw` |
| Min width desktop | `200px` |
| Padding | `20px` (p-5) |
| Ícono | Lucide 16px, `text-neutral-300` |
| Label | `text-xs font-semibold text-neutral-300` |
| Valor | `text-xl font-bold text-white leading-none tracking-tight tabular-nums` |
| Delta badge (positivo) | `bg-green-500/15 text-green-400 text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-full` |
| Delta badge (negativo) | `bg-red-500/15 text-red-400` (misma estructura) |
| Delta badge (neutro) | `bg-neutral-500/15 text-neutral-400` (misma estructura) |
| Sparkline | Recharts AreaChart, `w-16 h-10 2xl:w-24 2xl:h-12`, con gradient fill |
| Sparkline color green | `stroke: #4ade80`, gradient `0.3 → 0` opacity |
| Sparkline color neutral | `stroke: #a3a3a3`, gradient `0.3 → 0` opacity |

```tsx
// Estructura estándar de una KPI card
<div className="min-w-[65vw] sm:min-w-[200px] px-5 py-5 flex flex-col gap-0.5 flex-1">
  <div className="flex items-center gap-1.5">
    <Icon className="w-4 h-4 text-neutral-300" />
    <span className="text-xs font-semibold text-neutral-300">{title}</span>
  </div>
  <div className="flex items-end justify-between gap-2">
    <div className="flex flex-col gap-1">
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
      <span className={`text-[11px] px-2 py-0.5 rounded-full ${deltaColor}`}>{delta}</span>
    </div>
    <Sparkline />
  </div>
</div>
```

**Regla:** Usar este patrón en todas las listas de módulos operativos (pedidos, recepciones, inventario). Máximo 6 KPIs. Las cards deben ser específicas al módulo (no genéricas).

---

### 3.16 Loading / Skeleton

- Skeleton color base: `#F3F4F6`
- Skeleton shimmer: `#E5E7EB`
- Animation: shimmer de izquierda a derecha, `1.5s infinite`
- Spinner: border `2px solid #E5E7EB`, top border `#111827`, size `20px`

---

### 3.17 Bulk Action Bar (Acciones masivas)

Floating dark bar fijo en la parte inferior cuando hay items seleccionados en una tabla.

| Propiedad | Valor |
|---|---|
| Container outer | `fixed bottom-6 left-1/2 -translate-x-1/2 z-40` |
| Container inner | `flex items-center gap-3 bg-[#1d1d1f] rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/30 border border-white/10` |
| Count section | `pr-3 border-r border-white/15`, count `text-sm font-semibold text-white tabular-nums`, label `text-sm text-neutral-400` |
| Action buttons | `px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white` |
| Danger actions | `text-red-400 hover:bg-red-500/15 hover:text-red-300` |
| Close/deselect | `pl-3 border-l border-white/15`, X icon button |
| Animation | `animate-in fade-in slide-in-from-bottom-4 duration-200` |

**Comportamiento:**
- Aparece cuando `selectedIds.size > 0` en una tabla con selección múltiple
- Muestra contador de items seleccionados + acciones contextuales
- Acciones típicas: Mover, Asignar, Etiquetar, Exportar, Eliminar (danger)
- El botón de cerrar (X) deselecciona todos los items
- Siempre centrado horizontalmente, `bottom-6` sobre el contenido

---

## 4. Íconos

- Librería: **Lucide React** (o similar, stroke-based)
- Tamaño default: `16px`
- Tamaño en navegación: `16px`
- Tamaño en botones: `14px`
- Tamaño hero/empty state: `40px`
- Stroke width: `1.5`
- Color: hereda del texto del contexto (currentColor)

---

## 5. Módulos existentes

### 5.1 Órdenes de Recepción (`/recepciones`)

**Propósito:** Gestión de órdenes de entrada al warehouse.

**Columnas de la tabla:**
- Checkbox | # Orden | Proveedor | Fecha esperada | Estado | Productos | Acciones

**Estados posibles:**
- `Pendiente` (yellow)
- `En proceso` (yellow/blue)
- `Completado` (green)
- `Rechazado` (red)

**Filtros disponibles:**
- Búsqueda por texto (orden/proveedor)
- Filtro por estado
- Filtro por fecha

**Acciones:**
- Nueva orden (botón primary)
- Ver detalle (click en fila o ícono)
- Editar, cancelar (menú de acciones)

---

## 6. Reglas de implementación

### Para Claude — instrucciones obligatorias

1. **Siempre** usar los tokens de este archivo. No generar colores ad-hoc.
2. **Siempre** usar `Inter` como font family con base de `13px`.
3. **Siempre** mantener filas de tabla en una sola línea (`white-space: nowrap`, scroll horizontal).
4. Los estados de badge deben usar exactamente los colores definidos en sección 3.4.
5. Si un componente nuevo no está en el design system, **proponer opciones** basadas en los tokens existentes antes de implementar.
6. Los nuevos módulos deben seguir el mismo layout (sidebar + topbar + content) definido en sección 2.
7. No usar Tailwind con colores fuera de la paleta definida. Si usas Tailwind, mapear clases a los tokens de esta sección.
8. Preferir componentes funcionales en React con TypeScript.
9. Accesibilidad mínima: roles ARIA en interactivos, labels en inputs, contraste WCAG AA.

### Checklist antes de entregar cualquier componente

- [ ] ¿Usa font Inter 13px?
- [ ] ¿Los colores son del sistema definido?
- [ ] ¿Los bordes son `1px solid #E5E7EB` o `#D1D5DB`?
- [ ] ¿El espaciado es múltiplo de 4px?
- [ ] ¿Los badges usan los colores exactos de la sección 3.4?
- [ ] ¿La tabla tiene filas en una sola línea?
- [ ] ¿Los botones tienen el padding y radius correcto?
- [ ] ¿Hay estados vacíos y loading contemplados?

---

## 7. Changelog

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-03-26 | Versión inicial basada en diseño actual de Amplifica |
| 1.1 | 2026-03-26 | Agregar: Indicador de atención en fila (línea roja lateral) §3.5, Tabs pill de estado §3.9 Variante B, KPI Cards dark §3.13 |
| 1.2 | 2026-03-26 | Agregar regla obligatoria: tabs NUNCA con scroll vertical (overflow-y-hidden) §3.9 |
| 1.3 | 2026-03-27 | Agregar: Bulk Action Bar (floating dark bar para acciones masivas) §3.17 |
| 1.4 | 2026-03-27 | REWRITE: §3.5 Tabla de datos — Especificación canónica completa con jerarquía de estructura, clases obligatorias, helpers, sorting, paginación numerada, checklist de features y anti-patterns. Paginación integrada en §3.5 (antes §3.7 separada) |

---

*Mantener este archivo actualizado con cada nuevo componente o token que se agregue al sistema.*
