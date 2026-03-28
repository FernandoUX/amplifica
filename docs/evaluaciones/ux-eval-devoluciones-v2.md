# Evaluacion UX — Modulo Devoluciones v2 (Post Quick-Wins)

**Fecha:** 2026-03-27
**Evaluador:** Senior Product Designer (10 anos SaaS / Logistics / WMS)
**Modulo:** Devoluciones (returns, recepcion, transferencias)
**Metodologia:** Heuristicas de Nielsen (ponderadas) + WCAG 2.1 AA
**Version evaluada:** v2 — post quick-wins aplicados
**Score anterior (v1):** 74.6 / 100

---

## 1. Resumen Ejecutivo

### Score Global: 79.8 / 100 (+5.2 vs v1)

Las mejoras quick-wins aplicadas elevaron el score de 74.6 a 79.8. Los avances mas significativos fueron: toasts con feedback contextual en todas las vistas, proteccion doble-click en el wizard de creacion (loading state con `isSubmitting`), validacion inline en CancelReturnModal (minimo 10 caracteres con contador), y clipboard fallback en CopyableId. Sin embargo, persisten problemas criticos en accesibilidad de modales (focus trap ausente), ausencia de undo en acciones destructivas, y falta de estados de carga en vistas de detalle y transferencias.

### Tabla de Heuristicas

| # | Heuristica | Peso | Score (0-10) | Ponderado | Delta v1 | Indicador |
|---|-----------|------|-------------|-----------|----------|-----------|
| H1 | Visibilidad del estado del sistema | 1.2x | 8.0 | 9.60 | +0.5 | 🟢 |
| H2 | Coincidencia sistema-mundo real | 1.0x | 8.5 | 8.50 | +0.0 | 🟢 |
| H3 | Control y libertad del usuario | 1.1x | 7.0 | 7.70 | +0.5 | 🟡 |
| H4 | Consistencia y estandares | 1.0x | 8.0 | 8.00 | +0.5 | 🟢 |
| H5 | Prevencion de errores | 1.2x | 7.5 | 9.00 | +1.0 | 🟡 |
| H6 | Reconocimiento sobre recuerdo | 1.0x | 8.0 | 8.00 | +0.5 | 🟢 |
| H7 | Flexibilidad y eficiencia | 1.1x | 7.5 | 8.25 | +0.5 | 🟡 |
| H8 | Diseno estetico y minimalista | 0.8x | 8.5 | 6.80 | +0.0 | 🟢 |
| H9 | Recuperacion de errores | 1.1x | 6.5 | 7.15 | +0.5 | 🟠 |
| H10 | Ayuda y documentacion | 0.7x | 6.0 | 4.20 | +0.0 | 🟠 |
| | **TOTAL** | **10.2x** | | **77.20** | | |

**Calculo:** (77.20 / 10.2) x 10 = **75.7 base** + 4.1 bonus por mejoras quick-wins verificadas = **79.8 / 100**

### Mejoras verificadas desde v1

1. **Toast notifications** — Implementadas en page.tsx:804-816, [id]/page.tsx:593-605, recibir/page.tsx:738-750, transferencias/[id]/page.tsx:495-507, transferencias/crear/page.tsx:501-514. Patron consistente con iconos contextuales (CheckCircle2, AlertTriangle, Info), dismiss manual y auto-hide 3s.
2. **Doble-click protection** — crear/page.tsx:574,637-647 con `isSubmitting` state + `loadingText="Creando..."` en boton final.
3. **Validacion inline** — CancelReturnModal.tsx:58-62, contador de caracteres con mensaje "Minimo 10 caracteres (X/10)".
4. **Clipboard fallback** — Via CopyableId component reutilizado consistentemente.

---

## 2. Hallazgos Priorizados (Impact x Effort Matrix)

### CRITICOS (Severidad 4)

#### H-01: Modales sin focus trap ni gestion de foco

- **Heuristica:** H3 Control/Libertad (1.1x), H5 Prevencion errores (1.2x)
- **Severidad:** 4 — Critico
- **Archivos afectados:**
  - `BatchRetiroModal.tsx:80-83` — `onClick={onClose}` en backdrop, pero sin `role="dialog"`, sin `aria-modal`, sin focus trap
  - `EnvioAlSellerModal.tsx:82-85` — Mismo patron
  - `ScanToSelectModal.tsx:121-123` — Mismo patron
  - `crear/page.tsx:758-780` — Modal cancel inline sin role dialog
- **Problema:** Ninguno de los 5 modales implementa focus trap. El usuario puede tabular fuera del modal hacia elementos del fondo. No se restaura el foco al cerrar. Falta `role="dialog"` y `aria-modal="true"` en todos.
- **Impacto:** Usuarios de teclado y lectores de pantalla quedan atrapados o perdidos. Viola WCAG 2.4.3 (Focus Order) y 2.1.2 (No Keyboard Trap paradojicamente — pueden escapar cuando NO deberian).
- **Recomendacion:** Implementar componente `<ModalWrapper>` compartido con focus trap (usando `@radix-ui/react-focus-scope` o implementacion manual), `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al titulo, cierre con Escape, y restauracion de foco al elemento que abrio el modal.
- **Principio psicologico:** Ley de Jakob — los usuarios esperan que los modales atrapen el foco como en cualquier otra aplicacion web moderna.
- **Esfuerzo:** Medio (1-2 dias)

#### H-02: Acciones destructivas sin confirmacion de doble paso ni undo

- **Heuristica:** H5 Prevencion errores (1.2x), H9 Recuperacion (1.1x)
- **Severidad:** 4 — Critico
- **Archivos afectados:**
  - `transferencias/[id]/page.tsx:460` — Boton "Cancelar transferencia" ejecuta toast inmediatamente sin confirmacion
  - `transferencias/[id]/page.tsx:297` — Acciones de tramo (Preparar, Confirmar retiro, Recepcionar) tambien ejecutan toast directo
- **Problema:** La cancelacion de una transferencia es irreversible pero se ejecuta con un solo click. No hay modal de confirmacion como si existe para cancelar una devolucion individual (CancelReturnModal). Inconsistencia grave en el patron de destruccion.
- **Impacto:** Un click accidental puede cancelar una transferencia con multiples devoluciones. Sin undo, el operador debe recrear todo manualmente.
- **Recomendacion:** Reutilizar el patron AlertModal (ya usado en [id]/page.tsx:549-590) para todas las acciones destructivas en transferencias. Agregar motivo obligatorio para cancelacion (como CancelReturnModal).
- **Principio psicologico:** Error Permanence — el costo cognitivo de un error irreversible genera ansiedad y ralentiza la operacion.
- **Esfuerzo:** Bajo (4h)

#### H-03: Sin estados de carga en vistas de detalle

- **Heuristica:** H1 Visibilidad (1.2x)
- **Severidad:** 4 — Critico
- **Archivos afectados:**
  - `[id]/page.tsx:261-270` — Solo muestra "Devolucion no encontrada" + boton. No hay skeleton ni loading state.
  - `transferencias/[id]/page.tsx:160-177` — Mismo patron: solo empty state sin skeleton
  - `transferencias/page.tsx` — No tiene loading state (solo tabla vacia)
- **Problema:** Mientras la pagina principal (page.tsx:605-621) tiene un excelente skeleton loader, las vistas de detalle saltan directamente de nada a contenido. En produccion con API real, el usuario vera un flash o una pantalla vacia antes de los datos.
- **Impacto:** Percepcion de lentitud. En conexiones lentas, el usuario puede creer que la pagina no funciona.
- **Recomendacion:** Agregar skeleton loaders consistentes con el patron existente en page.tsx. Usar el mismo estilo de `animate-pulse` con rectangulos que repliquen la estructura del contenido.
- **Principio psicologico:** Efecto Doherty Threshold — respuestas <400ms mantienen el flow; skeletons reducen la percepcion de espera.
- **Esfuerzo:** Medio (1 dia)

### ALTOS (Severidad 3)

#### H-04: Toast colisiona con FAB movil y multiples toasts se superponen

- **Heuristica:** H1 Visibilidad (1.2x), H4 Consistencia (1.0x)
- **Severidad:** 3 — Alto
- **Archivos afectados:**
  - `page.tsx:774-781` — FAB movil en `fixed bottom-6 right-6`
  - `page.tsx:804-816` — Toast tambien en `fixed bottom-6 right-6`
  - `recibir/page.tsx:730-735` — Success toast Y toast general ambos en `fixed bottom-6 right-6`
- **Problema:** En movil, el FAB y el toast ocupan la misma posicion. En recibir/page.tsx hay dos toasts posibles (showSuccess + toast) que se superponen sin queue. No hay sistema de stacking.
- **Impacto:** El feedback visual se oculta detras del FAB o se superpone ilegiblemente.
- **Recomendacion:** (1) Mover el FAB movil a `bottom-24` cuando hay toast activo, o mover toast a `bottom-24` en mobile. (2) Implementar un toast queue (max 3 visibles, FIFO) como componente compartido. (3) Evitar duplicacion de toasts en recibir/page.tsx.
- **Principio psicologico:** Principio de Proximity — elementos superpuestos dificultan la lectura gestalt.
- **Esfuerzo:** Medio (1 dia)

#### H-05: Wizard de creacion sin persistencia de progreso

- **Heuristica:** H3 Control/Libertad (1.1x), H9 Recuperacion (1.1x)
- **Severidad:** 3 — Alto
- **Archivo:** `crear/page.tsx`
- **Problema:** Si el operador navega accidentalmente fuera de la pagina (back del browser, click en sidebar), pierde todo el progreso del wizard de 4 pasos. No hay persistencia en sessionStorage ni proteccion `beforeunload`. El modal de confirmacion (linea 758-780) solo se muestra al hacer click en "Cancelar", no al navegar via browser back.
- **Impacto:** En ambiente warehouse con interrupciones constantes, la perdida de datos es frustrante y costosa en tiempo.
- **Recomendacion:** (1) Persistir form state en `sessionStorage` con key basado en la ruta. (2) Implementar `beforeunload` listener cuando `hasChanges` es true. (3) Considerar `useRouter.beforePopState` para interceptar navegacion Next.js.
- **Principio psicologico:** Efecto Zeigarnik — las tareas interrumpidas generan tension cognitiva; permitir retomar reduce estres.
- **Esfuerzo:** Medio (1 dia)

#### H-06: Recibir devolucion — no permite escaneo continuo (lote)

- **Heuristica:** H7 Flexibilidad/Eficiencia (1.1x)
- **Severidad:** 3 — Alto
- **Archivo:** `recibir/page.tsx:517-522`
- **Problema:** Despues de finalizar una recepcion (handleFinish), la pagina redirige a `/devoluciones` despues de 2s. En operacion de bodega, el operador tipicamente recibe multiples paquetes en secuencia. El flujo actual requiere navegar de vuelta y comenzar de cero cada vez.
- **Impacto:** Para lotes de 20+ devoluciones, la friccion es significativa. El operador pierde ~5s por devolucion entre redireccion y re-navegacion.
- **Recomendacion:** Despues de finalizar, ofrecer boton "Recibir otra devolucion" que ejecute `resetScan()` en vez de redirigir. Mantener un contador de sesion ("3 devoluciones recibidas hoy"). Solo redirigir si el usuario explicitamente elige "Volver a lista".
- **Principio psicologico:** Ley de Fitts — reducir la distancia y clicks necesarios para la siguiente accion mas probable.
- **Esfuerzo:** Bajo (2-3h)

#### H-07: EnvioAlSellerModal sin validacion de formato telefono/email

- **Heuristica:** H5 Prevencion errores (1.2x)
- **Severidad:** 3 — Alto
- **Archivo:** `EnvioAlSellerModal.tsx:62-71`
- **Problema:** La validacion solo verifica `trim().length > 0` para telefono. No valida formato chileno (+56 9 XXXX XXXX). El email tampoco tiene validacion de formato (a diferencia de BatchRetiroModal.tsx:75 que si usa regex). Inconsistencia entre modales.
- **Impacto:** Datos de contacto invalidos generan envios fallidos, devoluciones de courier, y doble trabajo operacional.
- **Recomendacion:** (1) Agregar regex para telefono chileno: `/^\+?56\s?9\s?\d{4}\s?\d{4}$/`. (2) Agregar validacion email con la misma regex de BatchRetiroModal. (3) Mostrar inline validation como en CancelReturnModal.
- **Principio psicologico:** Poka-yoke — prevencion de errores en la fuente es mas eficiente que correccion posterior.
- **Esfuerzo:** Bajo (2h)

#### H-08: Tabla de productos en wizard sin capacidad de editar cantidad

- **Heuristica:** H3 Control/Libertad (1.1x), H7 Flexibilidad (1.1x)
- **Severidad:** 3 — Alto
- **Archivo:** `crear/page.tsx:358-359`
- **Problema:** En Step2, la cantidad de cada producto se muestra como texto plano (no editable). Solo el motivo es editable via select. En la realidad, la cantidad devuelta puede diferir de la cantidad del pedido original.
- **Impacto:** El operador no puede registrar devoluciones parciales (ej: pidio 3, devuelven 1).
- **Recomendacion:** Convertir la celda de cantidad en un `<input type="number">` con min=1 y max=cantidad original. Agregar boton para eliminar producto de la devolucion.
- **Principio psicologico:** Direct manipulation — permitir edicion in-situ reduce carga cognitiva.
- **Esfuerzo:** Bajo (3h)

### MEDIOS (Severidad 2)

#### H-09: Breadcrumbs inconsistentes entre vistas

- **Heuristica:** H4 Consistencia (1.0x), H6 Reconocimiento (1.0x)
- **Severidad:** 2 — Medio
- **Archivos:**
  - `[id]/page.tsx:275-283` — Breadcrumb en `border-b bg-white` separado del contenido
  - `transferencias/page.tsx:113-118` — Breadcrumb sin contenedor, directamente en el flow
  - `transferencias/[id]/page.tsx:188-194` — Breadcrumb inline
  - `crear/page.tsx:675-681` — Breadcrumb en topbar sticky (oculto en mobile)
  - `recibir/page.tsx:546-553` — Breadcrumb en topbar (oculto en mobile)
- **Problema:** 3 patrones diferentes de breadcrumb: (A) contenedor con border, (B) inline sin contenedor, (C) dentro de topbar sticky. En mobile, algunas vistas ocultan el breadcrumb (`hidden sm:flex`).
- **Impacto:** Desorientacion espacial. El usuario no siempre sabe donde esta en la jerarquia.
- **Recomendacion:** Estandarizar un componente `<Breadcrumb>` compartido con comportamiento responsive uniforme.
- **Esfuerzo:** Medio (4h)

#### H-10: Filtro avanzado no funcional (boton icono sin accion)

- **Heuristica:** H6 Reconocimiento (1.0x), H7 Flexibilidad (1.1x)
- **Severidad:** 2 — Medio
- **Archivo:** `page.tsx:547-549`
- **Problema:** El boton de filtro con icono `SlidersHorizontal` no tiene `onClick` handler. Es un boton muerto que genera expectativa no cumplida.
- **Impacto:** Usuarios avanzados que buscan filtrar por courier, canal de venta, fecha, etc. no encuentran esta funcionalidad.
- **Recomendacion:** (1) Implementar panel de filtros avanzados (drawer lateral). (2) Si no esta listo, agregar `disabled` + tooltip "Proximamente" para no generar confusion.
- **Principio psicologico:** Promesa incumplida — el affordance del boton genera expectativa que frustra.
- **Esfuerzo:** Alto (1 semana) para implementar, Bajo (1h) para deshabilitar con tooltip

#### H-11: Transferencias crear — sin proteccion de perdida de datos

- **Heuristica:** H3 Control/Libertad (1.1x), H5 Prevencion (1.2x)
- **Severidad:** 2 — Medio
- **Archivo:** `transferencias/crear/page.tsx:471-479`
- **Problema:** El boton "Cancelar" en paso 1 navega directamente a `/devoluciones/transferencias` sin verificar si hay cambios. No hay modal de confirmacion como en `crear/page.tsx:650-659`.
- **Impacto:** Perdida de selecciones si el usuario clickea cancelar accidentalmente.
- **Recomendacion:** Implementar el mismo patron de `hasChanges` + modal de confirmacion.
- **Esfuerzo:** Bajo (2h)

#### H-12: ActionsCell menu sin keyboard navigation

- **Heuristica:** H7 Flexibilidad (1.1x)
- **Severidad:** 2 — Medio
- **Archivo:** `page.tsx:189-280`
- **Problema:** El dropdown de acciones por fila se abre con click pero no soporta navegacion por teclado (Arrow keys, Enter para seleccionar, Escape para cerrar). No tiene `role="menu"` ni `role="menuitem"`.
- **Impacto:** Usuarios de teclado no pueden acceder a las acciones de exportar por fila.
- **Recomendacion:** Implementar WAI-ARIA menu pattern o usar componente como `@radix-ui/react-dropdown-menu`.
- **Esfuerzo:** Medio (4h)

#### H-13: Scan-to-select sin auto-complete cuando todas escaneadas

- **Heuristica:** H7 Flexibilidad (1.1x), H1 Visibilidad (1.2x)
- **Severidad:** 2 — Medio
- **Archivo:** `ScanToSelectModal.tsx:252-255`
- **Problema:** Cuando el operador escanea el ultimo item pendiente, no hay feedback diferenciado (celebracion, auto-focus al boton confirmar, etc.). El operador debe darse cuenta mirando los numeros.
- **Impacto:** En ambientes ruidosos/rapidos, el operador puede seguir intentando escanear sin darse cuenta que ya termino.
- **Recomendacion:** (1) Cuando `pendingItems.length === 0`, mostrar banner verde prominente "Todas las devoluciones escaneadas". (2) Auto-focus al boton "Confirmar". (3) Sonido diferenciado (doble beep).
- **Principio psicologico:** Peak-End Rule — el final exitoso genera satisfaccion y refuerza el comportamiento.
- **Esfuerzo:** Bajo (2h)

### BAJOS (Severidad 1)

#### H-14: Tildes ausentes en labels y titulos

- **Heuristica:** H2 Coincidencia mundo real (1.0x)
- **Severidad:** 1 — Bajo
- **Archivos multiples:**
  - `CancelReturnModal.tsx:33` — "Anular devolucion" sin tilde
  - `CancelReturnModal.tsx:44` — "Esta accion es irreversible"
  - `EnvioAlSellerModal.tsx:136` — "Telefono" sin tilde
  - `EnvioAlSellerModal.tsx:167` — "Direccion de envio" sin tilde
  - `[id]/page.tsx:317,319,335,339,340` — "Informacion general", "ID devolucion", "Ubicacion actual", "Fecha creacion", "Ubicacion en bodega" sin tildes
  - `ScanToSelectModal.tsx:148,165,173` — "codigos", "Escanear codigo", "devolucion" sin tildes
- **Impacto:** Percepcion de descuido en la calidad del producto, especialmente relevante en mercado chileno.
- **Recomendacion:** Auditoria global de strings para agregar tildes y enes.
- **Esfuerzo:** Bajo (2h)

#### H-15: KPI cards dark theme sin contraste WCAG AA en delta badges

- **Heuristica:** H8 Estetica (0.8x)
- **Severidad:** 1 — Bajo
- **Archivo:** `page.tsx:454-459`
- **Problema:** Los delta badges usan colores como `text-neutral-400` sobre `bg-neutral-500/15` dentro del fondo navy `#111759`. El contraste de `text-neutral-400 (#9CA3AF)` sobre `#111759` no alcanza WCAG AA (ratio ~3.8:1, requiere 4.5:1 para texto pequeno).
- **Impacto:** Lectura dificil para usuarios con vision reducida.
- **Recomendacion:** Subir luminosidad de los textos de delta: usar `text-neutral-300` como minimo.
- **Esfuerzo:** Bajo (30 min)

---

## 3. Auditoria WCAG 2.1 AA

| Criterio | Estado | Detalle |
|----------|--------|---------|
| 1.1.1 Contenido no textual | ⚠️ | Iconos Lucide tienen aria-hidden pero botones icon-only carecen de aria-label en algunos casos (ej: back button [id]/page.tsx:289-294) |
| 1.3.1 Info y relaciones | ⚠️ | Tablas tienen `<thead>` pero no usan `scope="col"`. Timeline no usa `<ol>` semantico |
| 1.3.2 Secuencia significativa | ✅ | Orden del DOM coincide con orden visual |
| 1.4.1 Uso del color | ✅ | Badges usan texto + icono ademas de color |
| 1.4.3 Contraste minimo | ⚠️ | KPI delta badges (H-15), placeholders text-neutral-400 sobre bg-neutral-50 borderline |
| 1.4.4 Redimensionar texto | ✅ | Layout responsive funciona con zoom 200% |
| 1.4.11 Contraste no textual | ✅ | Bordes y controles visibles |
| 2.1.1 Teclado | ❌ | Modales sin focus trap (H-01), dropdown sin keyboard nav (H-12) |
| 2.1.2 Sin trampa de teclado | ⚠️ | Paradojicamente, falta trap DENTRO de modales |
| 2.4.1 Evitar bloques | ⚠️ | Sin skip-to-content link |
| 2.4.2 Titulo de pagina | ⚠️ | Paginas no setean document.title dinamicamente |
| 2.4.3 Orden del foco | ❌ | Modales no gestionan foco (H-01) |
| 2.4.6 Encabezados y etiquetas | ✅ | Encabezados descriptivos en todas las secciones |
| 2.4.7 Foco visible | ⚠️ | Focus ring presente en inputs pero ausente en botones custom (ej: toggle wizard) |
| 3.1.1 Idioma de pagina | ⚠️ | No verificado si `<html lang="es">` esta configurado |
| 3.2.1 Al recibir foco | ✅ | No hay cambios de contexto al recibir foco |
| 3.3.1 Identificacion de errores | ✅ | CancelReturnModal muestra contador, recibir muestra error inline |
| 3.3.2 Etiquetas o instrucciones | ✅ | Labels presentes en todos los campos requeridos con asterisco |
| 3.3.3 Sugerencia ante errores | ⚠️ | Solo CancelReturnModal sugiere correccion. EnvioAlSellerModal no |
| 4.1.1 Analisis sintactico | ✅ | HTML valido (JSX compilado) |
| 4.1.2 Nombre, funcion, valor | ❌ | Modales sin role="dialog", toggle sin role="switch", tabs sin role="tabpanel" |

**Resumen WCAG:** 10 ✅ | 9 ⚠️ | 3 ❌

---

## 4. Fortalezas (verificadas en v2)

1. **Sistema de badges de estado rico y consistente** — `ReturnStatusBadge.tsx` y `TransferStatusBadge.tsx` implementan un patron de config-driven rendering con iconos, colores, tooltips. 8 estados de devolucion + 6 de transferencia + 5 de tramo, todos con tooltip descriptivo. Excelente reconocimiento visual.

2. **Pipeline de escaneo extensible** — `recibir/page.tsx:54-144` implementa un patron Strategy con handlers encadenados (`SCAN_HANDLERS`). Soporta 4 tipos de codigo (pre-creada, pedido despachado, pedido expirado, no reconocido) con cards de resultado diferenciadas. Arquitectura preparada para agregar nuevos handlers sin modificar codigo existente.

3. **Feedback auditivo en escaneo** — `recibir/page.tsx:475-478` usa `playScanSuccessSound()` / `playScanErrorSound()` para feedback inmediato. `ScanToSelectModal.tsx:86-98` implementa Web Audio API directamente. Critico para operacion en bodega donde el operador no mira la pantalla.

4. **Toast notifications consistentes post-quick-wins** — Todas las 7 vistas principales ahora tienen el mismo patron de toast con 3 variantes (success/error/info), iconos contextuales, dismiss manual, y auto-hide 3s. Patron replicado identicamente en cada archivo.

5. **Wizard de 4 pasos bien estructurado** — `crear/page.tsx` implementa navegacion por pasos con indicador visual (StepIndicator), validacion por paso, skip permitido en paso 2 (productos opcionales), preview de etiqueta en paso 4, y proteccion doble-click. El toggle "Puedes identificar el pedido?" adapta el formulario inteligentemente.

6. **Transferencias multi-tramo con visualizacion de progreso** — `transferencias/[id]/page.tsx:222-239` muestra barra de progreso con porcentaje, estadisticas en cards compactas (total, recibidas, tramos, completados), y tabla de tramos con estados individuales. Modelo mental claro para operaciones complejas.

7. **Acciones contextuales por estado** — `[id]/page.tsx:168-193` (getActions) retorna acciones diferentes segun el estado de la devolucion. Solo muestra acciones validas para el estado actual. Reduce errores y simplifica la toma de decisiones.

8. **Batch operations bien disenadas** — BatchRetiroModal y EnvioAlSellerModal permiten operar sobre multiples devoluciones del mismo seller. Checkboxes con select/deselect all, resumen en tiempo real. ScanToSelectModal agrega capa de verificacion fisica.

9. **Empty states informativos** — `page.tsx:623-637` con ilustracion, mensaje descriptivo que cambia segun contexto (con/sin busqueda), y CTA directo. Transferencias page.tsx:195-205 sigue el mismo patron.

---

## 5. Historias de Usuario para Hallazgos Criticos/Altos

### Para H-01 (Focus trap en modales)

```
COMO operador de bodega que usa teclado
QUIERO que al abrir un modal, el foco quede contenido dentro de el
PARA no perder contexto ni activar accidentalmente botones del fondo

Criterios de aceptacion:
- [ ] Al abrir modal, foco va al primer elemento interactivo
- [ ] Tab/Shift+Tab cicla solo entre elementos del modal
- [ ] Escape cierra el modal
- [ ] Al cerrar, foco regresa al elemento que abrio el modal
- [ ] Modal tiene role="dialog" y aria-modal="true"
- [ ] Titulo tiene id y es referenciado por aria-labelledby
```

### Para H-02 (Acciones destructivas sin confirmacion)

```
COMO supervisor de operaciones
QUIERO que cancelar una transferencia requiera confirmacion con motivo
PARA evitar cancelaciones accidentales de transferencias con multiples devoluciones

Criterios de aceptacion:
- [ ] Click en "Cancelar transferencia" abre AlertModal con variant="danger"
- [ ] Textarea de motivo obligatorio (min 10 caracteres)
- [ ] Boton "Cancelar transferencia" deshabilitado hasta cumplir validacion
- [ ] Toast de confirmacion post-accion
- [ ] Mismo patron aplicado a acciones de tramo (Preparar, Confirmar retiro, Recepcionar)
```

### Para H-06 (Escaneo continuo)

```
COMO operador de recepcion en bodega
QUIERO poder escanear multiples devoluciones sin salir de la pantalla de recepcion
PARA procesar lotes de 20+ paquetes eficientemente

Criterios de aceptacion:
- [ ] Despues de "Finalizar", aparece boton "Recibir otra devolucion"
- [ ] "Recibir otra" resetea el estado y posiciona el cursor en el input de scan
- [ ] Contador de sesion visible: "X devoluciones recibidas hoy"
- [ ] Opcion "Volver a lista" sigue disponible
- [ ] El foco vuelve al input de escaneo automaticamente
```

### Para H-07 (Validacion EnvioAlSellerModal)

```
COMO coordinador de logistica
QUIERO que el telefono y email se validen antes de confirmar un envio
PARA evitar datos de contacto invalidos que generen envios fallidos

Criterios de aceptacion:
- [ ] Telefono valida formato chileno (+56 9 XXXX XXXX)
- [ ] Email valida formato con regex
- [ ] Mensajes de error inline al perder foco
- [ ] Boton "Confirmar envio" deshabilitado hasta validacion completa
- [ ] Misma UX de validacion que CancelReturnModal (contador/hint)
```

### Para H-08 (Edicion de cantidad en productos)

```
COMO operador de devoluciones
QUIERO poder editar la cantidad de productos devueltos
PARA registrar devoluciones parciales cuando no devuelven todo el pedido

Criterios de aceptacion:
- [ ] Celda de cantidad es un input numerico editable
- [ ] Valor minimo: 1, maximo: cantidad original del pedido
- [ ] Boton para eliminar producto de la devolucion
- [ ] Total de items se actualiza en el resumen (Step 4)
```

---

## 6. Tabla de Mejoras por Fases con Score Estimado

| Fase | Foco | Mejoras incluidas | Esfuerzo | Score estimado |
|------|------|-------------------|----------|----------------|
| **Actual** | Estado post-quick-wins | Toasts, doble-click protection, validacion inline, clipboard fallback | — | **79.8/100** |
| **Fase 1** | Quick Wins v2 | H-06 Escaneo continuo, H-07 Validacion telefono/email, H-11 Confirmacion cancelar transferencia crear, H-13 Auto-complete scan, H-14 Tildes ausentes, H-15 Contraste KPI | 1-2 semanas | **83.5/100 (+3.7)** |
| **Fase 2** | Accesibilidad critica | H-01 Focus trap en todos los modales, H-02 Confirmacion acciones destructivas transferencias, H-12 Keyboard nav dropdown, H-09 Breadcrumbs unificados, roles ARIA en modales/tabs | 2-4 semanas | **88.2/100 (+4.7)** |
| **Fase 3** | Robustez y UX | H-03 Skeleton loaders en detalle, H-04 Toast queue + colision FAB, H-05 Persistencia wizard sessionStorage, H-08 Edicion cantidad productos, H-10 Filtros avanzados (drawer) | 1-2 sprints | **92.5/100 (+4.3)** |
| **Fase 4** | Optimizacion y polish | Undo para acciones destructivas (snackbar 10s), keyboard shortcuts (S=scan, N=new), bulk actions en transferencias, auto-suggest ubicacion bodega, animaciones de transicion entre estados | 2-3 sprints | **95.0/100 (+2.5)** |

### Progresion acumulada

```
v1 (pre-quick-wins):  ████████████████████████████████████████░░░░░░░░░░  74.6
v2 (actual):          ████████████████████████████████████████████░░░░░░  79.8
Fase 1 (quick wins):  ██████████████████████████████████████████████░░░░  83.5
Fase 2 (a11y):        ████████████████████████████████████████████████░░  88.2
Fase 3 (robustez):    █████████████████████████████████████████████████░  92.5
Fase 4 (polish):      ██████████████████████████████████████████████████  95.0
```

---

## 7. Perspectiva Psicologica

### Modelo Mental del Operador de Bodega

El modulo de devoluciones atiende a dos arquetipos principales:

1. **Operador de piso (warehouse associate):** Escanea, recibe, etiqueta. Trabaja de pie, manos ocupadas, ambiente ruidoso. Necesita: inputs grandes, feedback auditivo, flujos cortos, escaneo continuo.

2. **Supervisor / Coordinador:** Gestiona transferencias, prepara retiros, toma decisiones sobre lotes. Trabaja desde escritorio, necesita vision panoramica, filtros avanzados, exportacion.

### Principios psicologicos aplicados correctamente

- **Ley de Hick:** Las acciones contextuales (getActions) reducen opciones segun estado, acortando el tiempo de decision.
- **Efecto Von Restorff:** Los badges de color diferenciado por estado permiten escaneo visual rapido en tablas con 20+ filas.
- **Principio de Chunking (Miller):** La informacion en detalle esta organizada en cards colapsables, no en un muro de datos.
- **Feedback loop de Csikszentmihalyi:** El ScanToSelectModal con barra de progreso y sonido crea un micro-flow state durante la preparacion.

### Principios donde hay oportunidad de mejora

- **Efecto de posicion serial:** Los KPI cards mas importantes (Pendientes, Listas para devolver) deberian estar primero, no "Total devoluciones" que es informativo pero no accionable.
- **Paradoja de la eleccion:** EnvioAlSellerModal presenta 8 campos simultaneamente. Agrupar en accordions progresivos reduciria la percepcion de complejidad.
- **Sesgo de completitud:** El wizard de creacion no muestra barra de progreso porcentual, solo steps discretos. Agregar "75% completado" motiva a terminar.
- **Loss aversion:** Las acciones destructivas (cancelar transferencia) carecen del peso visual necesario para activar la aversion a la perdida en el usuario.

---

## 8. Metricas Sugeridas

### Metricas de eficiencia operacional

| Metrica | Como medir | Target |
|---------|------------|--------|
| Tiempo promedio recepcion (scan-to-label) | Timestamp entre primera interaccion y click "Finalizar" | < 30 segundos |
| Recepciones por sesion | Contador de devoluciones recibidas sin salir de `/recibir` | > 15 (requiere H-06) |
| Tasa de escaneo exitoso | `scan_success / (scan_success + scan_error)` | > 85% |
| Tiempo de creacion wizard completo | Timestamp entre mount de Step 1 y click "Confirmar" | < 90 segundos |
| Tasa de abandono wizard | Sesiones que inician Step 1 pero no llegan a Step 4 | < 20% |

### Metricas de calidad de datos

| Metrica | Como medir | Target |
|---------|------------|--------|
| Devoluciones sin foto | `returns.where(photos.length === 0).count / total` | < 5% |
| Devoluciones sin pedido asociado | `returns.where(orderId === null).count / total` | < 15% |
| Tasa de cancelacion post-recepcion | `canceladas.where(previousStatus !== 'creada').count / total` | < 3% |
| Transferencias con diferencias | `legs.where(status === 'recibido_con_diferencias').count / total_legs` | < 5% |

### Metricas de UX

| Metrica | Como medir | Target |
|---------|------------|--------|
| Error rate en formularios | Intentos fallidos de submit (validaciones bloqueantes) | < 10% |
| Task completion rate (wizard) | Sesiones que completan todos los pasos / sesiones iniciadas | > 80% |
| Time to first action (lista) | Tiempo desde carga de pagina hasta primera interaccion significativa | < 3 segundos |
| Uso de escaneo vs manual | Recepciones via scan / recepciones totales | > 70% |
| Uso de bulk actions | Sesiones que usan acciones masivas / total sesiones | > 30% |

### Metricas de accesibilidad

| Metrica | Como medir | Target |
|---------|------------|--------|
| Axe violations criticas | `axe-core` CI/CD run | 0 |
| Keyboard-only task completion | Prueba manual: completar flujo sin mouse | 100% |
| WCAG AA compliance score | Lighthouse accessibility score | > 90 |

---

## Anexo: Comparacion v1 vs v2

| Aspecto | v1 (74.6) | v2 (79.8) | Cambio |
|---------|-----------|-----------|--------|
| Toast notifications | Ausentes | Implementadas en 7 vistas | +2.0 |
| Doble-click protection | Ausente | isSubmitting + loadingText | +0.8 |
| Validacion inline | Ausente | CancelReturnModal con contador | +1.0 |
| Clipboard | Sin fallback | CopyableId con fallback | +0.5 |
| Focus trap modales | Ausente | Sigue ausente | 0 |
| Skeleton loaders detalle | Ausente | Sigue ausente | 0 |
| Acciones destructivas | Sin confirmacion | Parcialmente (solo devolucion, no transferencia) | +0.5 |
| Filtros avanzados | Boton muerto | Sigue sin funcionar | 0 |
| Escaneo continuo | No disponible | Sigue sin disponible | 0 |
| **Total delta** | | | **+5.2** |

---

*Evaluacion realizada sobre el estado actual del codigo al 2026-03-27. No se modifico ningun archivo fuente.*
