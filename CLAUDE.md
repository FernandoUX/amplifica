# Amplifica — Instrucciones para Claude Code

## Proyecto

Amplifica es un WMS (Warehouse Management System) SaaS. Stack: React + TypeScript. Íconos: Lucide React.

---

## Design System — Fuente de verdad

**OBLIGATORIO:** Antes de crear, modificar o proponer cualquier componente, módulo o feature de UI, lee el archivo `AMPLIFICA-DESIGN-SYSTEM.md` en la raíz del proyecto. Ese archivo es la única fuente de verdad para tokens visuales.

```
cat AMPLIFICA-DESIGN-SYSTEM.md
```

No inventes colores, tipografías, espaciados ni variantes de componentes que no estén definidos ahí. Si necesitas algo que no existe en el design system, **propón opciones basadas en los tokens existentes** y espera confirmación antes de implementar.

### Actualización del Design System

Cuando yo diga "actualiza el design system" o "agrega esto al design system":

1. Lee el archivo actual: `cat AMPLIFICA-DESIGN-SYSTEM.md`
2. Identifica la sección correcta donde va el cambio (o crea una nueva si aplica)
3. Aplica el cambio manteniendo el formato markdown existente (tablas, headers, bloques de código)
4. Incrementa la versión en la sección 7 (Changelog) con fecha y descripción del cambio
5. Confirma qué se cambió con un resumen breve

---

## Tokens de referencia rápida

Estos son los valores más usados para evitar consultar el archivo completo en cada cambio menor. **En caso de duda, el archivo `AMPLIFICA-DESIGN-SYSTEM.md` siempre prevalece.**

### Tipografía

- Font: `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
- Base: `13px / 400 / #374151` (body)
- Labels: `12px / 400 / #6B7280`
- Heading: `15px / 700 / #111827`
- Subheading: `13px / 600 / #111827`
- Botón: `13px / 500`

### Grises

| Token | Hex | Uso principal |
|---|---|---|
| gray-50 | `#F9FAFB` | Bg global, hover, disabled input |
| gray-100 | `#F3F4F6` | Active nav, hover rows, chips |
| gray-200 | `#E5E7EB` | Bordes principales |
| gray-300 | `#D1D5DB` | Bordes inputs, secundarios |
| gray-400 | `#9CA3AF` | Placeholders, íconos |
| gray-500 | `#6B7280` | Labels, texto secundario |
| gray-700 | `#374151` | Texto body |
| gray-900 | `#111827` | Headings, botón primary bg |

### Colores de estado

| Color | Hex | Badge bg | Badge text |
|---|---|---|---|
| Blue | `#3B82F6` | `#DBEAFE` | `#1D4ED8` |
| Green | `#22C55E` | `#DCFCE7` | `#15803D` |
| Yellow | `#EAB308` | `#FEF9C3` | `#A16207` |
| Red | `#EF4444` | `#FEE2E2` | `#B91C1C` |
| Purple | `#A855F7` | `#F3E8FF` | `#7E22CE` |

### Espaciado (base 4px)

`4 · 8 · 12 · 16 · 20 · 24 · 32`

### Bordes y radios

- Border color: `#E5E7EB` (principal), `#D1D5DB` (inputs), `#F3F4F6` (rows)
- Radius: `4px` (badges) · `6px` (botones, inputs) · `8px` (cards, modals) · `9999px` (pills)

### Sombras

- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)`
- lg: `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)`

---

## Reglas de código

### Generales

- Componentes funcionales React + TypeScript. No class components.
- Lucide React para íconos (`16px` default, `14px` en botones, `strokeWidth={1.5}`).
- Espaciado siempre en múltiplos de 4px.
- No usar colores de Tailwind fuera de la paleta del design system. Si usas Tailwind, mapea a los tokens.

### Tablas (componente central)

- Filas siempre en una sola línea: `white-space: nowrap` + scroll horizontal.
- Header: `bg #F9FAFB`, `12px/600/#6B7280`.
- Rows: height `40px`, border `1px solid #F3F4F6`, hover `#F9FAFB`.
- Checkbox columna izquierda `44px`, acciones columna derecha `80px`.

### Botones

| Variante | Bg | Text | Border | Hover bg |
|---|---|---|---|---|
| Primary | `#111827` | `#fff` | none | `#1F2937` |
| Secondary | `#fff` | `#374151` | `1px solid #D1D5DB` | `#F9FAFB` |
| Ghost | transparent | `#6B7280` | none | `#F3F4F6` |
| Destructive | `#EF4444` | `#fff` | none | `#DC2626` |

Padding default: `7px 12px`. Radius: `6px`. Font: `13px/500`.

### Badges de estado

`padding: 2px 8px` · `radius: 9999px` · `font: 12px/500`

| Estado | Bg | Text |
|---|---|---|
| Pendiente | `#FEF9C3` | `#A16207` |
| En proceso | `#FEF9C3` | `#A16207` |
| Completado | `#DCFCE7` | `#15803D` |
| Rechazado | `#FEE2E2` | `#B91C1C` |
| Borrador | `#F3F4F6` | `#6B7280` |
| Info | `#DBEAFE` | `#1D4ED8` |
| Especial | `#F3E8FF` | `#7E22CE` |

### Layout de módulos

Todos los módulos siguen: Sidebar (232px, fijo, bg blanco) + Main (flex-1, bg `#F9FAFB`) con Topbar (48px, border-bottom) + Content (padding 16px).

### Inputs

Height `32px`, border `1px solid #D1D5DB`, radius `6px`, font `13px/400/#111827`. Focus: border `#3B82F6` + ring `0 0 0 3px rgba(59,130,246,0.15)`.

---

## Checklist pre-entrega

Antes de dar por terminado cualquier componente o módulo, verificar:

- [ ] Font Inter 13px base
- [ ] Colores exclusivamente del design system
- [ ] Bordes: `#E5E7EB` o `#D1D5DB` según contexto
- [ ] Espaciado en múltiplos de 4px
- [ ] Badges con colores exactos de la tabla de estados
- [ ] Tablas con filas en una línea (`white-space: nowrap`)
- [ ] Botones con padding y radius correcto
- [ ] Empty states y loading/skeleton contemplados
- [ ] Accesibilidad: ARIA roles, labels en inputs, contraste WCAG AA

---

## Módulos existentes

- `/recepciones` — Órdenes de recepción (entrada al warehouse)
- `/pedidos` — Pedidos de salida (fulfillment a clientes) y transferencias internas. Incluye KPI cards, tabs de estado, tabla con doble estado (preparación + envío), vista cards, paginación configurable.

Consultar `AMPLIFICA-DESIGN-SYSTEM.md` sección 5 para detalle de columnas, estados y acciones de cada módulo.

---

## Comandos útiles

```bash
# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```
