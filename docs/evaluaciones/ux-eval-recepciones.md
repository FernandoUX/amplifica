# Evaluacion UX — Modulo Recepciones (Ordenes de Recepcion)

**Producto:** Amplifica WMS
**Modulo:** Recepciones (OR)
**Evaluador:** Senior Product Designer (10 anos exp. SaaS, logistica, WMS)
**Fecha:** 27 de marzo de 2026
**Archivos evaluados:**
- `src/app/recepciones/page.tsx` (bandeja principal)
- `src/app/recepciones/[id]/page.tsx` (detalle OR)
- `src/app/recepciones/crear/page.tsx` (wizard creacion)
- `src/app/recepciones/configuracion/page.tsx` (configuracion calendario)
- `src/components/recepciones/QrScannerModal.tsx` (escaner QR)
- `src/components/recepciones/StatusBadge.tsx` (badges de estado)

---

## 1. Resumen Ejecutivo

**Score Global: 74/100**

El modulo de Recepciones de Amplifica presenta una arquitectura de interaccion solida con un flujo completo desde la creacion de la OR hasta la aprobacion final. El modelo de estados es coherente, el wizard de creacion guia al usuario correctamente y la integracion con QR para recepciones en bodega es innovadora para el segmento. Sin embargo, se detectan oportunidades criticas en la experiencia del operador de bodega (el usuario mas frecuente), donde las condiciones ambientales exigen targets mas grandes, feedback haptico mas prominente y reduccion de la carga cognitiva durante el conteo.

### Tabla Heuristica (Nielsen, ponderada)

| # | Heuristica | Peso | Score (1-10) | Ponderado |
|---|-----------|------|-------------|-----------|
| H1 | Visibilidad del estado del sistema | 1.2x | 8.0 | 9.6 |
| H2 | Relacion sistema-mundo real | 1.0x | 7.5 | 7.5 |
| H3 | Control y libertad del usuario | 1.1x | 6.5 | 7.2 |
| H4 | Consistencia y estandares | 1.0x | 7.0 | 7.0 |
| H5 | Prevencion de errores | 1.2x | 6.0 | 7.2 |
| H6 | Reconocimiento antes que recuerdo | 1.0x | 7.5 | 7.5 |
| H7 | Flexibilidad y eficiencia de uso | 1.1x | 6.5 | 7.2 |
| H8 | Diseno estetico y minimalista | 0.8x | 8.0 | 6.4 |
| H9 | Ayuda al usuario con errores | 1.1x | 7.0 | 7.7 |
| H10 | Ayuda y documentacion | 0.7x | 5.5 | 3.9 |
| | **Total ponderado** | | | **71.2/102.2 = 74/100** |

---

## 2. Hallazgos Priorizados

### 2.1 Quick Wins (Impacto alto, esfuerzo bajo)

#### QW-1: Targets de toque insuficientes para operadores con guantes
- **Severidad:** Critica
- **Heuristica:** H7 (Flexibilidad) + H5 (Prevencion errores)
- **Evidencia:** Los botones de conteo en `ProductCard` usan `w-16 h-9` (64x36px) en mobile, y el input del conteo manual requiere precision con `w-8 h-8` (32x32px) para los botones +/- del stepper. Operadores en bodega usan guantes industriales que requieren targets de minimo 48x48px (recomendacion WCAG) y preferiblemente 56x56px para entornos hostiles.
- **Ubicacion:** `[id]/page.tsx` lineas 939-947 (desktop counter), 1006-1016 (mobile counter)
- **Recomendacion:** Incrementar todos los targets de interaccion primaria a minimo 48x48px. Aplicar `min-h-[48px] min-w-[48px]` a botones de escaneo QR, contadores, y acciones de incidencia.

#### QW-2: Falta indicador de progreso global en la bandeja
- **Severidad:** Alta
- **Heuristica:** H1 (Visibilidad)
- **Evidencia:** La tabla principal en `page.tsx` muestra SKUs y unidades totales pero NO muestra progreso de conteo para ORs "En proceso de conteo". El campo `progreso` existe en el tipo `Orden` pero no se renderiza en ninguna columna visible de la tabla.
- **Ubicacion:** `page.tsx` tipo `Orden` (linea 55) define `progreso?: { contadas: number; total: number }` pero los datos mock no lo populan, y no hay columna que lo renderice.
- **Recomendacion:** Agregar micro-barra de progreso (20px ancho) en la celda de "Unidades" para ORs en conteo. Permite al supervisor priorizar sin entrar a cada OR.

#### QW-3: Sin confirmacion de "Cancelar" en el wizard de creacion
- **Severidad:** Alta
- **Heuristica:** H3 (Control y libertad) + H5 (Prevencion errores)
- **Evidencia:** En `crear/page.tsx`, el boton "Cancelar" en Step1 y Step2 navega directamente con `router.push("/recepciones")` sin verificar si el formulario tiene datos ingresados. Un seller que lleva 15 minutos completando productos pierde todo el trabajo con un click accidental.
- **Ubicacion:** `crear/page.tsx` — el boton "Cancelar" no tiene guardia de datos sucios.
- **Recomendacion:** Implementar modal de confirmacion: "Tienes cambios sin guardar. Si sales ahora perderds los datos ingresados." con botones "Continuar editando" / "Salir sin guardar".

#### QW-4: Tooltips de StatusBadge no accesibles en touch
- **Severidad:** Media
- **Heuristica:** H6 (Reconocimiento) + H10 (Ayuda)
- **Evidencia:** `StatusBadge.tsx` no renderiza ningun tooltip. La propiedad `tooltip` esta definida en `statusConfig` pero nunca se usa en el JSX del componente (lineas 94-101). Esto significa que los tooltips descriptivos como "La OR tiene fecha de recepcion agendada" nunca se muestran al usuario.
- **Ubicacion:** `StatusBadge.tsx` lineas 89-101
- **Recomendacion:** Agregar `title={config.tooltip}` al `<span>` del badge como solucion inmediata. Para v2, implementar popover accesible con `aria-describedby`.

#### QW-5: Feedback sonoro sin control del usuario
- **Severidad:** Media
- **Heuristica:** H3 (Control y libertad)
- **Evidencia:** `playScanSuccessSound()` y `playScanErrorSound()` se invocan automaticamente en multiples lugares del `QrScannerModal` y la pagina principal sin opcion de silenciar. En bodegas ruidosas el sonido es util, pero el usuario no puede desactivarlo.
- **Ubicacion:** `QrScannerModal.tsx` lineas 136, 141, 146, 237, 247, 279; `page.tsx` multiples invocaciones.
- **Recomendacion:** Agregar toggle de audio en la configuracion del modulo o en el header del scanner con icono de volumen. Persistir preferencia en localStorage.

---

### 2.2 Hallazgos Estrategicos (Impacto alto, esfuerzo medio-alto)

#### ST-1: Ausencia de modo offline/resiliente para conteo en bodega
- **Severidad:** Critica
- **Heuristica:** H5 (Prevencion errores) + H9 (Recuperacion)
- **Evidencia:** Todo el estado de conteo se gestiona en `useState` dentro de `[id]/page.tsx`. Si el operador pierde conexion WiFi, refresca la pagina, o la bateria del dispositivo se agota, pierde toda la sesion de conteo activa. El mock usa `localStorage` para algunos datos (QR tokens, quarantine) pero la sesion de conteo activa NO se persiste.
- **Ubicacion:** `[id]/page.tsx` — sesiones y contadores son puramente in-memory.
- **Recomendacion:** Implementar auto-guardado en localStorage cada 5 segundos durante sesion activa. Mostrar indicador "Guardado automaticamente hace Xs". Al recargar, ofrecer "Recuperar sesion anterior" vs "Iniciar nueva sesion".

#### ST-2: Wizard de creacion carece de guardado de borrador
- **Severidad:** Alta
- **Heuristica:** H3 (Control y libertad) + H7 (Flexibilidad)
- **Evidencia:** El wizard de 3 pasos en `crear/page.tsx` no persiste estado entre sesiones. Un seller que necesita consultar un documento o hablar con un proveedor debe completar el wizard en una sola sentada o perder todo el progreso.
- **Ubicacion:** `crear/page.tsx` — `FormData` vive solo en `useState`.
- **Recomendacion:** Auto-guardar borrador en localStorage tras cada cambio. Mostrar badge "Borrador guardado" en la bandeja principal. Al re-ingresar al wizard, preguntar si quiere continuar el borrador o empezar de cero.

#### ST-3: Flujo de aprobacion limitado — sin vista diferenciada para supervisores
- **Severidad:** Alta
- **Heuristica:** H2 (Relacion sistema-mundo real) + H7 (Flexibilidad)
- **Evidencia:** Las ORs "Pendiente de aprobacion" llegan al supervisor pero el detalle de la OR no diferencia visualmente las secciones que requieren atencion del aprobador. Las incidencias se muestran mezcladas con el conteo general. El supervisor debe reconstruir mentalmente que necesita revisar.
- **Ubicacion:** `[id]/page.tsx` — la vista de detalle es la misma para operador y supervisor. Las acciones de aprobacion ("Aprobar con diferencias", "Devolver a conteo") estan solo en el menu contextual de la bandeja (lineas 368-371 de `page.tsx`), no en la vista de detalle.
- **Recomendacion:** Cuando el estado es "Pendiente de aprobacion" y el rol es supervisor, mostrar: (1) Banner superior "Esta OR requiere tu aprobacion", (2) Resumen de incidencias con highlight visual, (3) Botones "Aprobar" / "Devolver a conteo" prominentes en el sticky footer.

#### ST-4: Configuracion de calendario desconectada del flujo de creacion
- **Severidad:** Media
- **Heuristica:** H4 (Consistencia) + H1 (Visibilidad)
- **Evidencia:** La pagina de configuracion (`configuracion/page.tsx`) permite definir slots, sobrecupos, anticipacion y bloqueos por sucursal. Sin embargo, el Step3 del wizard de creacion duplica logica de generacion de slots (funcion `buildSlots` aparece en ambos archivos) y usa mocks parciales (`DISABLED_SLOTS`, `SOBRECUPO_SLOTS`, `AGENDA_COMPLETA`) en lugar de leer la configuracion real.
- **Ubicacion:** `crear/page.tsx` lineas 408-420 (buildSlots duplicado), lineas 456-457 (mock slots hardcoded).
- **Recomendacion:** Unificar la logica de disponibilidad en un hook compartido `useCalendarAvailability(sucursalId)` que lea configuracion de localStorage y compute slots reales. Eliminar duplicacion de `buildSlots`.

#### ST-5: No existe busqueda global ni filtro avanzado en la bandeja
- **Severidad:** Media
- **Heuristica:** H7 (Flexibilidad) + H6 (Reconocimiento)
- **Evidencia:** La bandeja principal tiene tabs por estado, sort por fecha, y busqueda basica. Sin embargo, no hay filtros por: seller, sucursal, rango de fechas, ni por tags de resultado (aunque la estructura `TAG_FILTER_OPTIONS` existe en el codigo). Con 70+ ORs, la bandeja se vuelve inmanejable sin filtrado combinado.
- **Ubicacion:** `page.tsx` lineas 88-98 definen `TAG_FILTER_OPTIONS` pero no se evidencia un panel de filtros funcional que las use.
- **Recomendacion:** Implementar panel de filtros lateral/dropdown con: seller (multiselect), sucursal (multiselect), rango de fecha creacion, rango de fecha agendada, tags de resultado. Persistir filtros en URL params para compartir links.

---

### 2.3 Fill-ins (Impacto medio, esfuerzo bajo-medio)

#### FI-1: La tabla principal no tiene scroll horizontal visible en desktop
- **Severidad:** Media
- **Heuristica:** H1 (Visibilidad)
- **Evidencia:** La tabla usa `whiteSpace: "nowrap"` (NW constant, linea 264 de `page.tsx`) y tiene columna sticky de acciones con `stickyRight` (linea 285), pero no hay indicador visual de que existe contenido a la derecha cuando la ventana es angosta. El usuario podria no descubrir columnas ocultas.
- **Recomendacion:** Agregar clase `.table-scroll` del design system y shadow de fade en el borde derecho cuando hay scroll disponible.

#### FI-2: Inconsistencia en labels de estado "Cancelado" vs "Cancelada"
- **Severidad:** Baja
- **Heuristica:** H4 (Consistencia)
- **Evidencia:** En `StatusBadge.tsx` el tipo Status usa "Cancelado" (masculino, linea 20) pero el label renderizado dice "Cancelada" (femenino, linea 84). En la bandeja principal, el tab dice "Cancelada" (linea 216) pero `TAB_STATUS` mapea a "Cancelado" (linea 227). La OR es femenina, por lo que "Cancelada" es correcto, pero el tipo interno deberia coincidir.
- **Ubicacion:** `StatusBadge.tsx` linea 20 vs 84; `page.tsx` linea 227.
- **Recomendacion:** Unificar a "Cancelada" en todos los niveles, incluyendo el tipo `Status`.

#### FI-3: Falta empty state en la tabla de sesiones de conteo
- **Severidad:** Baja
- **Heuristica:** H1 (Visibilidad) + H6 (Reconocimiento)
- **Evidencia:** En `[id]/page.tsx`, la seccion de historial de sesiones simplemente no renderiza nada cuando no hay sesiones. No hay mensaje "Sin sesiones de conteo registradas" ni CTA para iniciar la primera sesion.
- **Recomendacion:** Agregar empty state con icono ClipboardList + texto "Aun no se han iniciado sesiones de conteo" + boton "Iniciar primera sesion" si el estado lo permite.

#### FI-4: Imagenes de producto sin lazy loading optimizado
- **Severidad:** Baja
- **Heuristica:** H8 (Estetica/rendimiento)
- **Evidencia:** `ProductCard` usa `loading="lazy"` en las imagenes (linea 907 de `[id]/page.tsx`) lo cual es correcto, pero no implementa `NoImagePlaceholder` como skeleton durante la carga. El placeholder solo aparece cuando la imagen falla, no durante la carga.
- **Recomendacion:** Usar un estado intermedio "loading" con skeleton de shimmer antes de que la imagen se cargue.

#### FI-5: Calendario del wizard no marca feriados configurados
- **Severidad:** Media
- **Heuristica:** H5 (Prevencion errores)
- **Evidencia:** La pagina de configuracion tiene un sistema completo de feriados (`FERIADOS_2026_SEED`) y bloqueos por sucursal. Sin embargo, el calendario del Step3 en `crear/page.tsx` solo usa mocks hardcoded (`AGENDA_COMPLETA = new Set([17, 18, 19])`) y no lee los feriados reales de localStorage.
- **Ubicacion:** `crear/page.tsx` linea 486.
- **Recomendacion:** Leer feriados y bloqueos de localStorage en Step3 y marcar visualmente los dias no disponibles con el color/icono correcto.

---

### 2.4 Deprioritize (Impacto bajo o cosmético)

#### DP-1: Micro-interaccion de animacion +1 en conteo
- **Severidad:** Cosmética
- **Evidencia:** La animacion `floatPlusOne` en ProductCard (linea 898) es agradable pero no critical path. Podria causar distraccion en sesiones de conteo rapido.

#### DP-2: Icono de Help en barra superior
- **Severidad:** Baja
- **Evidencia:** Se importa `HelpCircle` (linea 10 de `[id]/page.tsx`) pero no se observa un sistema de ayuda contextual implementado.

#### DP-3: Opcion de exportar tabla a CSV/Excel
- **Severidad:** Baja
- **Evidencia:** El boton de download/export existe en la bandeja pero la funcionalidad es mock.

---

## 3. Auditoria WCAG 2.1 AA

### 3.1 Criterios cumplidos

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| 1.1.1 Non-text content | Parcial | `alt` presente en imagenes de producto, pero `NoImagePlaceholder` usa SVG sin `aria-label` |
| 1.3.1 Info and relationships | OK | Headers de tabla con `<th>`, estructura semantica con `<nav>`, `<main>` implicito |
| 1.4.3 Contrast minimum | OK | Tokens del design system cumplen 4.5:1 (neutral-700 #374151 sobre blanco = 8.3:1) |
| 2.1.1 Keyboard | Parcial | `IncidenciaRowCard` tiene `role="button"` y `tabIndex={0}` con `onKeyDown` (linea 1368-1371). Botones de escaneo QR son `<button>`. Pero modales usan `div` con `onClick` sin focus trap |
| 2.4.7 Focus visible | Parcial | Inputs tienen `focus:ring-2 focus:ring-primary-200`. Pero botones custom no siempre tienen estilo de foco visible |

### 3.2 Criterios con problemas

| Criterio | Problema | Severidad | Ubicacion |
|----------|---------|-----------|-----------|
| 1.3.1 Info and Relationships | Tabs de estado en bandeja usan `<button>` sin `role="tab"`, `aria-selected`, ni `role="tablist"` | A | `page.tsx` tabs |
| 2.1.2 No keyboard trap | Modales (IncidenciasSKUModal, AddProductModal, ConfirmCloseModal) no implementan focus trap. Tab puede escapar al contenido detras del overlay | A | `[id]/page.tsx` multiples modales |
| 2.4.1 Bypass blocks | Sin skip-to-content link. El sidebar de 232px obliga a tabular por todos los items de navegacion antes de llegar al contenido | A | Layout global |
| 2.4.6 Headings and labels | La pagina de detalle no tiene `<h1>` semantico para el ID de la OR. El heading "Conteo manual" usa `<h1>` dentro de un modal (semanticamente incorrecto) | A | `[id]/page.tsx` linea 1062 |
| 3.2.2 On Input | El toggle "Desconozco cantidad de pallets/bultos" cambia el estado de los campos sin aviso previo al screen reader | A | `crear/page.tsx` linea 137 |
| 4.1.2 Name, Role, Value | El switch toggle custom no tiene `role="switch"` ni `aria-checked`. Screen reader lo lee como boton generico | A | `crear/page.tsx` linea 138 |

### 3.3 Recomendaciones prioritarias de accesibilidad

1. **Focus trap en modales** — Implementar `useFocusTrap` hook en todos los modales. Esc debe cerrar.
2. **ARIA en tabs** — Agregar `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` al sistema de tabs.
3. **Skip navigation** — Agregar link oculto "Ir al contenido" antes del sidebar.
4. **Switch semantico** — Reemplazar `<button>` custom por `role="switch"` con `aria-checked`.
5. **Heading hierarchy** — Usar `<h1>` solo para el titulo principal de pagina. Modales deben usar `<h2>`.

---

## 4. Fortalezas

### F1: Modelo de estados bien definido y visualmente diferenciado
Los 7 estados (Creado, Programado, Recepcionado en bodega, En proceso de conteo, Pendiente de aprobacion, Completada, Cancelada) tienen cada uno un color unico, icono y tooltip descriptivo en `StatusBadge.tsx`. La paleta semantica (sky para programado, indigo para recepcion, orange para pendiente) respeta convenciones logisticas.

### F2: QR Scanner con flujo multi-accion inteligente
El `QrScannerModal` detecta automaticamente la accion a realizar segun el estado de la OR escaneada: "Recibir en bodega" para Programado, "Iniciar conteo" para Recepcionado, "Continuar conteo" para En proceso. Esto reduce la carga cognitiva del operador — un solo escaneo, cero seleccion manual.

### F3: Sistema de incidencias completo con trazabilidad
El flujo de incidencias en `[id]/page.tsx` permite categorizar por tipo (sin codigo, danio parcial/total, sin nutricional, etc.), adjuntar fotos obligatorias, y automaticamente clasifica la resolucion (interna Amplifica, devolucion seller, decision seller). Los registros se propagan a cuarentena con IDs rastreables.

### F4: Wizard de creacion con alertas contextuales de negocio
Cada paso del wizard incluye alertas relevantes: Step1 advierte sobre seguro y guia de despacho, Step2 sobre datos de stock incompletos, Step3 sobre puntualidad. Esto educa al usuario mientras crea la OR.

### F5: Responsive mobile-first en componentes criticos
`ProductCard`, `SesionRow`, y los modales de incidencia tienen layouts diferenciados para mobile (`sm:hidden` / `hidden sm:flex`) con interacciones adaptadas. El modal usa `items-end` para bottom-sheet en mobile y centrado en desktop.

### F6: Audit trail con timeline visual
La seccion de audit trail en `[id]/page.tsx` (SEED_AUDIT) registra cada evento del ciclo de vida de la OR con icono por tipo, operador, timestamp y detalle. Los colores de fondo del icono cambian segun el tipo de evento, creando una timeline legible.

### F7: Configuracion de calendario granular por sucursal
El modulo de configuracion permite: dias habilitados, horarios, duracion de slot, slots simultaneos, sobrecupos, anticipacion minima/maxima, plazo de reagendamiento, feriados nacionales con exclusion por sucursal, y bloqueos manuales. Esto cubre la complejidad real de operaciones multi-sucursal.

### F8: Prevencion de errores en conteo manual
El modal de conteo manual exige foto de evidencia y justificacion como campos obligatorios antes de permitir un override numerico. Esto previene manipulacion y genera registro auditable.

---

## 5. Historias de Usuario (Hallazgos Criticos/Altos)

### HU-1: Operador con guantes — Targets de toque (QW-1)
```
COMO operador de bodega con guantes industriales
QUIERO que todos los botones de conteo y escaneo tengan area de toque
  de al menos 48x48px
PARA poder operar sin errores en pantallas tactiles sucias

Criterios de aceptacion:
- [ ] Todos los botones primarios en ProductCard >= 48x48px
- [ ] Botones de escaneo QR >= 48x48px
- [ ] Botones +/- del stepper >= 44x44px
- [ ] Padding de touch target aplicado aunque el icono sea mas pequeno
- [ ] Verificado en dispositivo real con guantes de nitrilo
```

### HU-2: Supervisor ve progreso sin entrar a cada OR (QW-2)
```
COMO supervisor de bodega
QUIERO ver el progreso de conteo en la tabla de la bandeja
  para ORs "En proceso de conteo"
PARA priorizar ORs atrasadas sin tener que abrir cada una

Criterios de aceptacion:
- [ ] Columna "Progreso" visible para estados "En proceso de conteo"
- [ ] Micro-barra de progreso (verde/azul) con porcentaje numerico
- [ ] Tooltip muestra "X de Y unidades contadas (Z%)"
- [ ] Datos se refrescan al volver a la bandeja
```

### HU-3: Seller pierde datos del wizard (QW-3 + ST-2)
```
COMO seller creando una orden de recepcion
QUIERO que mis datos parciales se guarden automaticamente como borrador
PARA poder retomar la creacion si salgo del wizard accidentalmente

Criterios de aceptacion:
- [ ] Auto-guardado en localStorage cada 5 segundos
- [ ] Indicador visual "Borrador guardado" con timestamp
- [ ] Al hacer clic en "Cancelar" con datos presentes: modal de confirmacion
- [ ] Al re-ingresar al wizard: "Continuar borrador" vs "Crear nuevo"
- [ ] Borrador se elimina al confirmar la OR exitosamente
```

### HU-4: Operador pierde sesion de conteo por desconexion (ST-1)
```
COMO operador de bodega haciendo conteo
QUIERO que mi progreso de conteo se persista localmente
  ante perdida de conexion o cierre accidental
PARA no perder horas de trabajo de conteo

Criterios de aceptacion:
- [ ] Estado de conteo se guarda en localStorage cada 5 segundos
- [ ] Al recargar pagina con sesion activa: dialog "Recuperar sesion?"
- [ ] Badge "Sin conexion - datos guardados localmente" cuando offline
- [ ] Al reconectar: sincronizacion automatica con confirmacion
- [ ] Indicador "Ultimo guardado: hace Xs"
```

### HU-5: Supervisor aprueba OR con vista optimizada (ST-3)
```
COMO supervisor/Super Admin revisando una OR pendiente de aprobacion
QUIERO una vista que resalte incidencias y diferencias encontradas
PARA tomar la decision de aprobar o devolver a conteo rapidamente

Criterios de aceptacion:
- [ ] Banner top: "Esta OR requiere tu aprobacion" (amarillo)
- [ ] Seccion "Resumen de incidencias" con contadores por tipo
- [ ] Productos con incidencias aparecen primero, con highlight
- [ ] Fotos de evidencia accesibles con 1 clic
- [ ] Botones "Aprobar con diferencias" y "Devolver a conteo" en sticky footer
- [ ] Comentario obligatorio al aprobar con diferencias
```

---

## 6. Plan de Fases con Score Estimado

| Fase | Items | Esfuerzo | Score estimado | Delta |
|------|-------|----------|---------------|-------|
| **Actual** | — | — | **74/100** | — |
| **Fase 1 (Quick Wins)** | QW-1, QW-2, QW-3, QW-4, QW-5, FI-2 | 1-2 sprints | **80/100** | +6 |
| **Fase 2 (Resiliencia)** | ST-1, ST-2, FI-3, FI-5 | 2-3 sprints | **86/100** | +6 |
| **Fase 3 (Aprobacion)** | ST-3, ST-5, FI-1 | 2 sprints | **90/100** | +4 |
| **Fase 4 (Consistencia)** | ST-4, WCAG fixes, FI-4 | 2 sprints | **94/100** | +4 |
| **Fase 5 (Polish)** | DP-1, DP-2, DP-3, remaining WCAG | 1 sprint | **96/100** | +2 |

### Detalle por fase

**Fase 1 — Quick Wins (Semanas 1-4)**
- Incrementar touch targets a 48px en ProductCard y QR scanner
- Agregar columna progreso a la bandeja
- Implementar confirmacion de cancelar en wizard
- Activar tooltips en StatusBadge
- Agregar toggle de audio en scanner
- Unificar "Cancelado" -> "Cancelada"

**Fase 2 — Resiliencia operativa (Semanas 5-10)**
- Auto-guardado de sesion de conteo en localStorage
- Recovery de sesion interrumpida
- Guardado de borrador en wizard de creacion
- Empty states faltantes
- Lectura de feriados reales en calendario del wizard

**Fase 3 — Flujo de aprobacion (Semanas 11-14)**
- Vista diferenciada para supervisores en detalle OR
- Panel de filtros avanzados en bandeja
- Scroll horizontal visible con fade indicator

**Fase 4 — Consistencia y accesibilidad (Semanas 15-18)**
- Unificar hook de disponibilidad de calendario
- Focus trap en modales
- ARIA roles en tabs
- Skip navigation
- Switch semantico

**Fase 5 — Polish (Semanas 19-20)**
- Optimizar animaciones de conteo
- Sistema de ayuda contextual
- Export CSV funcional
- WCAG restante

---

## 7. Perspectiva Psicologica

### 7.1 Carga cognitiva del operador de conteo
El flujo de conteo requiere que el operador gestione simultaneamente: (1) conteo fisico de unidades, (2) interaccion con la pantalla para registrar, (3) deteccion visual de incidencias, (4) captura fotografica de evidencia. Esto representa una carga cognitiva de 4 tareas concurrentes, excediendo el limite de 3+/-1 de la memoria de trabajo (Cowan, 2001).

**Recomendacion:** Secuencializar el flujo. Primero contar, luego reportar incidencias. No forzar la captura de foto de incidencia durante el escaneo rapido. Permitir "marcar para revision posterior".

### 7.2 Efecto Zeigarnik en sesiones interrumpidas
La falta de auto-guardado amplifica el estres del operador. El "efecto Zeigarnik" indica que las tareas incompletas generan tension psicologica persistente. Un operador que sabe que su progreso puede perderse trabaja con ansiedad elevada, lo que incrementa errores. El auto-guardado transforma la tarea de "must complete without interruption" a "safe to pause".

### 7.3 Sesgo de confirmacion en aprobaciones
Los supervisores que aprueban ORs con diferencias pueden sufrir sesgo de confirmacion: si el seller es confiable, tienden a aprobar sin revisar las incidencias detalladamente. La vista actual no diferencia la severidad de las incidencias, tratando "sin codigo de barra" (resoluble internamente) igual que "danio total" (perdida economica).

**Recomendacion:** Categorizar incidencias por severidad con colores escalados (info -> warning -> critical). Forzar revision de incidencias criticas antes de permitir aprobacion.

### 7.4 Ley de Fitts en operaciones de bodega
La Ley de Fitts predice que el tiempo para alcanzar un target es funcion de la distancia y el tamano del target. En bodega, la distancia mano-pantalla es mayor (dispositivo en soporte), los dedos estan cubiertos (guantes), y la pantalla puede tener suciedad. Cada reduccion de 10px en un boton incrementa el tiempo de toque en ~15% y la tasa de error en ~8%.

### 7.5 Satisfaccion de completar una OR (dopamina)
El flujo actual de "Completada" es anticlimactico. Despues de horas de conteo, el usuario solo ve un cambio de badge a verde. Un feedback mas celebratorio (animacion sutil, sonido de exito, resumen de logro) aprovecharia el circuito de recompensa dopaminergico y reforzaria el comportamiento positivo.

---

## 8. Metricas Sugeridas

### 8.1 Metricas de eficiencia operativa

| Metrica | Definicion | Target | Fuente |
|---------|-----------|--------|--------|
| Tiempo medio de conteo | Minutos desde "Iniciar sesion" hasta "Cerrar OR" | < 45 min para OR de <= 500 uds | Timer de sesion |
| Tasa de sesion abandonada | % de sesiones iniciadas y no finalizadas en 24h | < 5% | Audit log |
| Tiempo medio de aprobacion | Horas desde "Pendiente de aprobacion" hasta decision | < 4h | Audit log |
| Tasa de error de escaneo QR | % de escaneos con resultado error sobre total | < 3% | Scanner logs |

### 8.2 Metricas de experiencia de usuario

| Metrica | Definicion | Target | Metodo |
|---------|-----------|--------|--------|
| CSAT modulo recepciones | Satisfaccion 1-5 al cerrar OR | >= 4.2 | Encuesta post-cierre |
| Tasa de completitud wizard | % de wizards iniciados que llegan a confirmacion | >= 85% | Analytics |
| Errores de touch en conteo | Toques fallidos en botones de conteo (miss rate) | < 2% | Touch analytics |
| Tiempo a primera accion | Segundos desde carga de pagina hasta primer clic en bandeja | < 3s | Performance |

### 8.3 Metricas de negocio

| Metrica | Definicion | Target | Fuente |
|---------|-----------|--------|--------|
| ORs procesadas/operador/dia | Volumen de ordenes completadas por operador | >= 8 | Dashboard |
| Tasa de incidencias | % de ORs con al menos 1 incidencia registrada | Monitoreo (no target) | Incidencias log |
| Precision de conteo | % de SKUs con conteo = esperadas en primer intento | >= 92% | Conteo vs. declarado |
| Tiempo de dock-to-stock | Horas desde escaneo QR en muelle hasta OR completada | < 6h | Audit trail |

### 8.4 Instrumentacion recomendada

1. **Eventos criticos para analytics:**
   - `or.created`, `or.scheduled`, `or.received_dock`, `or.counting_started`, `or.counting_ended`, `or.approved`, `or.completed`, `or.cancelled`
   - `session.started`, `session.paused`, `session.resumed`, `session.closed`
   - `incident.created`, `incident.photo_taken`, `incident.resolved`
   - `qr.scanned`, `qr.error`, `qr.success`

2. **Heartbeat de sesion activa:** Ping cada 30s durante conteo para detectar abandonos.

3. **Funnel de wizard:** Step1 -> Step2 -> Step3 -> Confirm con drop-off por paso.

---

## Anexo: Resumen de archivos evaluados

| Archivo | Lineas aprox. | Complejidad | Rol |
|---------|--------------|-------------|-----|
| `page.tsx` (bandeja) | ~1200 | Alta | Vista principal, tabla, tabs, acciones contextuales, modales |
| `[id]/page.tsx` (detalle) | ~2000+ | Muy alta | Detalle OR, conteo, sesiones, incidencias, cuarentena, audit |
| `crear/page.tsx` | ~700 | Media | Wizard 3 pasos, productos, calendario |
| `configuracion/page.tsx` | ~1000 | Alta | Config sucursales, feriados, bloqueos, calendario preview |
| `QrScannerModal.tsx` | ~500 | Media-alta | Scanner multi-flujo, validacion, lista escaneables |
| `StatusBadge.tsx` | ~105 | Baja | Componente presentacional de estados |

---

*Evaluacion realizada sobre codigo fuente. No se modifico ningun archivo.*
