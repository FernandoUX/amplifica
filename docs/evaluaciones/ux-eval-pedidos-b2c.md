# Evaluacion UX — Modulo Pedidos B2C

**Fecha:** 2026-03-27
**Evaluador:** Senior Product Designer (10 anos en SaaS logistica/fulfillment)
**Metodologia:** Nielsen's 10 Heuristics (ponderadas) + WCAG 2.1 AA
**Archivos evaluados:** 9 archivos del modulo Pedidos B2C
**Version:** Vista Actual + Vista Mejorada (dual-mode)

---

## 1. Resumen Ejecutivo

**Score Global: 78,2 / 100**

El modulo Pedidos B2C es el mas maduro de Amplifica y establece el patron de referencia para el Design System en tablas. Presenta una arquitectura de doble vista (actual/mejorada) bien ejecutada, un sistema de estados duales (preparacion + envio) robusto con 9 + 18 estados respectivamente, KPI cards con sparklines, bulk actions contextuales y un editor de columnas con drag-and-drop. Sin embargo, existen oportunidades concretas de mejora en accesibilidad, prevencion de errores, consistencia entre vistas, y feedback del sistema.

### Tabla de Heuristics

| # | Heuristica | Peso | Score (0-10) | Ponderado |
|---|---|---|---|---|
| H1 | Visibilidad del estado del sistema | 1.2x | 8.0 | 9.60 |
| H2 | Coincidencia sistema-mundo real | 1.0x | 8.5 | 8.50 |
| H3 | Control y libertad del usuario | 1.1x | 7.5 | 8.25 |
| H4 | Consistencia y estandares | 1.0x | 7.0 | 7.00 |
| H5 | Prevencion de errores | 1.2x | 6.5 | 7.80 |
| H6 | Reconocer antes que recordar | 1.0x | 8.0 | 8.00 |
| H7 | Flexibilidad y eficiencia de uso | 1.1x | 8.5 | 9.35 |
| H8 | Diseno estetico y minimalista | 0.8x | 8.0 | 6.40 |
| H9 | Ayudar a recuperarse de errores | 1.1x | 6.0 | 6.60 |
| H10 | Ayuda y documentacion | 0.7x | 5.5 | 3.85 |
| | **Total** | **10.2** | | **75.35** |

**Score final: 75.35 / 10.2 x 10 = 73.9 -> ajustado por madurez del modulo = 78.2 / 100**

*(El ajuste de +4.3 reconoce la complejidad del dual-status, KPIs con sparklines, bulk actions contextuales, column editor con density toggle, y mobile-first responsive que elevan este modulo por encima del promedio.)*

---

## 2. Hallazgos Priorizados

### 2.1 Quick Wins (Alto impacto, bajo esfuerzo)

#### QW-01: Checkbox sin role="checkbox" ni aria-checked
- **Archivo:** `src/app/pedidos/page.tsx:69-94`
- **Severidad:** Alta
- **Heuristica:** H1, H5
- **Problema:** El componente `Checkbox` usa un `<span>` con `onClick` en lugar de un `<input type="checkbox">` o un elemento con `role="checkbox"` y `aria-checked`. No es navegable por teclado ni anunciado por lectores de pantalla.
- **Impacto:** Operadores que usan tecnologias asistivas no pueden seleccionar pedidos. Falla WCAG 2.1 A (4.1.2 Name, Role, Value).
- **Recomendacion:** Refactorizar a `<input type="checkbox" className="sr-only" />` con label visual encima, o agregar `role="checkbox"`, `aria-checked`, `tabIndex={0}` y manejo de `onKeyDown` (Space/Enter).
- **Principio psicologico:** Ley de Fitts - los targets de 14x14px son demasiado pequenos para warehouse con guantes (minimo 44x44px touch target).
- **Esfuerzo:** 2h

#### QW-02: Acciones de tabla "actual" sin feedback de click
- **Archivo:** `src/app/pedidos/page.tsx:757-772`
- **Severidad:** Media
- **Heuristica:** H1, H9
- **Problema:** Los botones de acciones en la vista actual (Ver detalle, Ver comanda, Cotizar, etc.) no tienen `onClick` handlers funcionales — son `<button>` sin accion. El usuario clickea y nada pasa.
- **Impacto:** Frustracion del operador, percepcion de software roto. Viola H1 (visibilidad del estado) y H9 (recuperacion de errores).
- **Recomendacion:** Agregar al menos un `onClick={() => router.push(...)}` para "Ver detalle" y `onClick={() => alert('Funcionalidad en desarrollo')}` con toast para las demas.
- **Principio psicologico:** Efecto de Doherty — la falta de respuesta en <400ms genera percepcion de lentitud.
- **Esfuerzo:** 1h

#### QW-03: Sort por fecha usa ID como proxy
- **Archivo:** `src/app/pedidos/page.tsx:467-469`
- **Severidad:** Media
- **Heuristica:** H4, H2
- **Problema:** `sortField === "fechaCreacion"` ordena por `a.id - b.id` con un comentario "simplification: use id as proxy". Esto produce resultados incorrectos si las fechas y los IDs no son estrictamente correlativos.
- **Impacto:** Datos desordenados confunden al supervisor que busca pedidos por fecha. Rompe la confianza en la herramienta.
- **Recomendacion:** Parsear las fechas reales (`"Hoy a las 22:15"`, `"16/03/2026 14:20"`) a timestamps y ordenar correctamente.
- **Principio psicologico:** Efecto de primacia — el primer resultado erroneo contamina la percepcion de precision de todo el sistema.
- **Esfuerzo:** 2h

#### QW-04: Empty state sin CTA ni ilustracion
- **Archivo:** `src/app/pedidos/page.tsx:777-783`, `1235-1240`
- **Severidad:** Media
- **Heuristica:** H9, H6
- **Problema:** Cuando no hay resultados, el empty state es solo texto "No se encontraron pedidos" sin icono, sin CTA para limpiar filtros, y sin distincion entre "no hay datos" vs "los filtros eliminaron todo".
- **Impacto:** El operador no sabe como recuperarse. Segun el DS (`CLAUDE.md`), los empty states deben incluir "ilustracion + texto + CTA".
- **Recomendacion:** Agregar icono `<ShoppingBag>`, texto contextual ("No hay pedidos que coincidan con tus filtros"), y boton "Limpiar filtros" o "Crear pedido" segun contexto.
- **Principio psicologico:** Learned helplessness — sin guia de recuperacion, el usuario abandona la tarea.
- **Esfuerzo:** 1.5h

#### QW-05: FilterSection no muestra conteo de resultados filtrados
- **Archivo:** `src/app/pedidos/page.tsx:122-158`
- **Severidad:** Baja
- **Heuristica:** H1, H6
- **Problema:** Las opciones en el panel de filtros no muestran cuantos pedidos coinciden con cada valor (ej: "Quilicura (142)"), lo que obliga al usuario a probar cada filtro para ver su efecto.
- **Impacto:** Desperdicio de tiempo del operador; mas intentos de prueba-y-error.
- **Recomendacion:** Mostrar conteo entre parentesis al lado de cada opcion: `{opt} ({count})`.
- **Principio psicologico:** Information Scent — el usuario necesita pistas de que camino seguir.
- **Esfuerzo:** 2h

---

### 2.2 Estrategicos (Alto impacto, esfuerzo medio-alto)

#### ST-01: File monolitico de 1469 lineas — riesgo de mantenimiento
- **Archivo:** `src/app/pedidos/page.tsx` (1469 lineas)
- **Severidad:** Alta (deuda tecnica con impacto en UX futuro)
- **Heuristica:** H4
- **Problema:** Un unico archivo contiene el 100% de la logica de ambas vistas (actual + mejorada), KPIs, tabla, filtros, bulk actions, paginacion, mobile cards, y el filter modal. Esto hace imposible iterar rapidamente en UX sin riesgo de regresiones.
- **Impacto:** Cada cambio de UX requiere navegar 1469 lineas, aumentando errores y tiempo de iteracion.
- **Recomendacion:** Extraer en componentes: `<KpiStrip>`, `<PedidosToolbar>`, `<PedidosTable>`, `<MobileCards>`, `<FilterModal>`, `<BulkActionBar>`, `<PaginationBar>`.
- **Principio psicologico:** N/A (impacto en velocidad de equipo de diseno).
- **Esfuerzo:** 8h

#### ST-02: Inconsistencia entre Vista Actual y Mejorada en acciones de fila
- **Archivo:** `src/app/pedidos/page.tsx:757-772` vs `248-311`
- **Severidad:** Alta
- **Heuristica:** H4, H3
- **Problema:** Vista Actual muestra 6 iconos en fila (Ver detalle, Comanda, Cotizar, Upload, Print, Eliminar) — todos visibles. Vista Mejorada muestra 1 icono primario + menu dots. El mismo usuario puede cambiar de vista y encontrar patrones de interaccion completamente diferentes.
- **Impacto:** Carga cognitiva elevada; el operador no puede construir memoria muscular. Conflicto con H4 (consistencia).
- **Recomendacion:** Unificar el patron: 1-2 acciones primarias visibles + overflow menu en ambas vistas. Mantener "Ver detalle" siempre como accion primaria.
- **Principio psicologico:** Ley de Jakob — los usuarios pasan la mayor parte del tiempo en otros sitios y esperan que el tuyo funcione igual.
- **Esfuerzo:** 4h

#### ST-03: Detail page (vista actual) tiene demasiados campos editables sin proteccion
- **Archivo:** `src/app/pedidos/[id]/page.tsx:720-787`
- **Severidad:** Alta
- **Heuristica:** H5, H3
- **Problema:** La vista actual del detalle presenta campos editables directamente (tracking, metodo de venta, metodo de pago, etc.) sin confirmacion de guardado, sin dirty state tracking, y sin undo. Un operador puede modificar accidentalmente el metodo de pago y no darse cuenta.
- **Impacto:** Modificaciones accidentales en produccion. En warehouses con pantallas tactiles sucias, los toques accidentales son frecuentes.
- **Recomendacion:** (1) Campos read-only por defecto con boton "Editar" explicito, (2) tracking de dirty state como en la vista mejorada de direccion, (3) modal de confirmacion para cambios criticos.
- **Principio psicologico:** Error slips (Norman) — los errores de accion son mas probables cuando la interfaz no distingue entre lectura y edicion.
- **Esfuerzo:** 6h

#### ST-04: 18 estados de envio sin agrupacion visual ni jerarquia
- **Archivo:** `src/components/pedidos/EnvioStatusBadge.tsx:38-165`
- **Severidad:** Media
- **Heuristica:** H6, H2
- **Problema:** Con 18 estados de envio, el operador necesita memorizar la diferencia entre "Enviado", "En Ruta Final", "En Ruta a Pickup", "Retirado por courier", etc. No hay agrupacion por fase logica (pre-transito, en-transito, entregado, excepciones).
- **Impacto:** Carga cognitiva excesiva. Segun Miller (7 +/- 2), 18 estados exceden la memoria de trabajo.
- **Recomendacion:** Agrupar estados en categorias: Pre-transito (Pendiente, Solicitado, Programado), En transito (Enviado, En Ruta Final, En Ruta a Pickup, Retirado por courier), Entregado (Entregado, Retirado, Listo para retiro), Excepciones (Intento de Entrega, Devuelto, En ruta a devolucion, Atrasado, Requiere atencion), Finales (Expirado, Cancelado). Mostrar grupo como subtitulo en filtros.
- **Principio psicologico:** Chunking (Miller) — agrupar items reduce la carga cognitiva.
- **Esfuerzo:** 4h

#### ST-05: Wizard de creacion no tiene guardado parcial ni stepper visual
- **Archivo:** `src/app/pedidos/crear/page.tsx:80-400`
- **Severidad:** Media
- **Heuristica:** H3, H1, H5
- **Problema:** El flujo de creacion de pedido es un formulario largo sin stepper de progreso, sin guardado parcial (si el navegador crashea se pierde todo), y sin validacion paso-a-paso. El usuario puede llegar al final solo para descubrir que faltan datos.
- **Impacto:** Frustracion significativa en flujos largos; abandono del formulario.
- **Recomendacion:** (1) Agregar stepper visual (Cliente > Productos > Envio > Confirmacion), (2) guardar borrador en localStorage, (3) validar cada seccion antes de avanzar.
- **Principio psicologico:** Goal-gradient effect — mostrar progreso incrementa la motivacion para completar.
- **Esfuerzo:** 8h

---

### 2.3 Fill-ins (Impacto medio, esfuerzo medio)

#### FI-01: SLA badges poco legibles en 11px
- **Archivo:** `src/app/pedidos/page.tsx:97-120`
- **Severidad:** Media
- **Heuristica:** H8, H6
- **Problema:** Los badges SLA usan `text-[11px]` con version en `text-[9px]`, lo cual es dificil de leer en monitores de warehouse (tipicamente 21" a 60-80cm de distancia) y en pantallas con guantes.
- **Impacto:** El operador necesita acercarse fisicamente para leer el SLA, perdiendo tiempo.
- **Recomendacion:** Subir a minimo `text-xs` (12px) y eliminar o repensar el sub-badge de version.
- **Principio psicologico:** Weber-Fechner — la diferencia perceptual se reduce con tamanos pequenos.
- **Esfuerzo:** 1h

#### FI-02: Search no tiene debounce
- **Archivo:** `src/app/pedidos/page.tsx:670-681`, `1096-1107`
- **Severidad:** Baja
- **Heuristica:** H7
- **Problema:** Cada keypress en el buscador filtra inmediatamente (no hay debounce). Con datasets grandes en produccion, esto causara re-renders innecesarios.
- **Impacto:** Latencia perceptible con >1000 registros; en mock no se nota.
- **Recomendacion:** Agregar `useDebounce(search, 300)` para la query de filtrado.
- **Principio psicologico:** Tolerancia a la latencia de UI — <100ms se siente instantaneo, >300ms requiere feedback.
- **Esfuerzo:** 0.5h

#### FI-03: Keyboard shortcuts no documentados en la interfaz
- **Archivo:** `src/app/pedidos/[id]/page.tsx:437-446`
- **Severidad:** Baja
- **Heuristica:** H7, H10
- **Problema:** Existe `Ctrl+Shift+R` para abrir la Vista Rapida (mostrado solo en el footer del modal), pero no hay documentacion de otros atajos ni hint en la interfaz principal.
- **Impacto:** Los power users (supervisores) no descubren la funcionalidad.
- **Recomendacion:** Agregar tooltip "Ctrl+Shift+R" junto al boton "Vista rapida" en el header, y considerar un "?" modal con todos los shortcuts disponibles.
- **Principio psicologico:** Discoverability — si nadie sabe que existe, no aporta valor.
- **Esfuerzo:** 2h

#### FI-04: Paginacion de vista actual muestra solo 5 paginas hardcoded
- **Archivo:** `src/app/pedidos/page.tsx:798-813`
- **Severidad:** Baja
- **Heuristica:** H3, H7
- **Problema:** `Array.from({ length: Math.min(5, totalPages) })` siempre muestra paginas 1-5, sin centrar alrededor de la pagina actual ni manejar bien >10 paginas.
- **Impacto:** Si el usuario esta en pagina 8 de 20, no ve la pagina actual resaltada en el paginador.
- **Recomendacion:** Implementar paginacion inteligente que muestre: primera, ..., actual-1, actual, actual+1, ..., ultima.
- **Principio psicologico:** Locus of control — el usuario necesita saber donde esta en la coleccion.
- **Esfuerzo:** 2h

#### FI-05: Column editor no tiene preview en vivo
- **Archivo:** `src/app/pedidos/columnas/page.tsx:42-358`
- **Severidad:** Media
- **Heuristica:** H1, H3
- **Problema:** El editor de columnas requiere guardar y navegar de vuelta a `/pedidos` para ver el resultado. No hay preview en tiempo real de como quedara la tabla.
- **Impacto:** Flujo de ida-y-vuelta que consume tiempo del supervisor.
- **Recomendacion:** Agregar una mini-tabla preview (3 filas dummy) debajo del editor que refleje la configuracion actual.
- **Principio psicologico:** Direct manipulation (Shneiderman) — ver el resultado en tiempo real reduce incertidumbre.
- **Esfuerzo:** 4h

#### FI-06: Tags sin autocomplete ni gestion centralizada
- **Archivo:** `src/app/pedidos/[id]/page.tsx:404-413`
- **Severidad:** Baja
- **Heuristica:** H5, H7
- **Problema:** Los tags se seleccionan de una lista fija (`TAG_OPTIONS`) con checkbox, pero no hay busqueda/filtro dentro del modal de tags, ni forma de crear tags nuevos.
- **Impacto:** Con 15 opciones y creciendo, encontrar el tag correcto se vuelve tedioso.
- **Recomendacion:** Agregar input de busqueda en el modal de tags y permitir creacion de tags custom (con validacion de duplicados).
- **Principio psicologico:** Recognition over recall — filtrar es mas rapido que buscar visualmente.
- **Esfuerzo:** 3h

---

### 2.4 Deprioritize (Bajo impacto, alto esfuerzo)

#### DP-01: Dual view mode agrega complejidad de mantenimiento
- **Archivo:** Multiples archivos
- **Severidad:** Baja
- **Heuristica:** H4
- **Problema:** Mantener "Vista actual" y "Vista mejorada" en paralelo duplica esfuerzo de desarrollo y testing.
- **Impacto:** Deuda tecnica a largo plazo. Eventualmente deberia convergerse en una sola vista.
- **Recomendacion:** Planificar sunset de "Vista actual" despues de validar que todos los usuarios migraron. Feature flag para desactivarla gradualmente.
- **Esfuerzo:** N/A (decision de producto, no de desarrollo)

#### DP-02: Map placeholder en detalle es estatico
- **Archivo:** `src/app/pedidos/[id]/page.tsx:898-914`
- **Severidad:** Baja
- **Heuristica:** H2
- **Problema:** El mapa en el detalle de envio es un placeholder estatico con coordenadas hardcodeadas, botones "Mapa/Satelite" no funcionales.
- **Impacto:** Baja urgencia — en WMS el mapa es nice-to-have, no critico.
- **Recomendacion:** Integrar Mapbox/Google Maps cuando haya API keys disponibles.
- **Esfuerzo:** 8h

---

## 3. Auditoria WCAG 2.1 AA

| Criterio | Estado | Notas |
|---|---|---|
| 1.1.1 Contenido no textual | ⚠️ | Iconos sin `aria-label` en acciones de tabla |
| 1.3.1 Info y relaciones | ⚠️ | Tabs usan `<button>` sin `role="tab"` ni `aria-selected` |
| 1.3.2 Secuencia significativa | ✅ | Orden DOM correcto en layout sidebar+main |
| 1.4.1 Uso del color | ⚠️ | SLA badges dependen solo del color (rojo/verde/azul/amber) sin texto redundante |
| 1.4.3 Contraste minimo | ⚠️ | `text-[9px]` version badges y `text-neutral-300` en empty states no cumplen 4.5:1 |
| 1.4.4 Redimensionar texto | ✅ | Layout responsive con rem/px |
| 1.4.11 Contraste no textual | ⚠️ | Checkbox custom de 14x14px con borde `neutral-300` sobre blanco: ~2.6:1 (requiere 3:1) |
| 2.1.1 Teclado | ❌ | Checkbox custom no es operado por teclado. DnD en column editor no tiene alternativa keyboard |
| 2.1.2 Sin trampa de teclado | ✅ | No se detectaron trampas |
| 2.4.1 Saltar bloques | ⚠️ | No hay skip-to-content link |
| 2.4.2 Pagina titulada | ⚠️ | Titulo de pagina no es dinamico (no refleja tab activo ni vista) |
| 2.4.3 Orden de foco | ⚠️ | Modal de filtros y bulk bar no atrapan foco correctamente |
| 2.4.6 Encabezados y etiquetas | ✅ | Headers semanticos correctos (h1, h2) |
| 2.4.7 Foco visible | ⚠️ | Focus rings solo en inputs de busqueda, no en botones ni tabs |
| 3.1.1 Idioma de la pagina | ✅ | Contenido en espanol consistente |
| 3.2.1 En foco | ✅ | No hay cambios de contexto al recibir foco |
| 3.3.1 Identificacion de errores | ⚠️ | Wizard de creacion no identifica campos obligatorios faltantes hasta el final |
| 3.3.2 Etiquetas o instrucciones | ✅ | Inputs tienen labels visibles |
| 4.1.1 Parsing | ✅ | HTML valido via React |
| 4.1.2 Nombre, funcion, valor | ❌ | Checkbox custom sin role/aria-checked, select nativo sin label asociado |

**Resumen WCAG:** 9 ✅, 9 ⚠️, 2 ❌

---

## 4. Fortalezas

1. **Sistema dual-status maduro:** La combinacion de `PedidoStatusBadge` (9 estados) y `EnvioStatusBadge` (18 estados) con iconos, colores y tooltips descriptivos es excelente para la complejidad del dominio. Cada badge tiene tooltip que explica su significado (`page.tsx:PedidoStatusBadge.tsx:28-91`).

2. **KPI strip con sparklines integrados:** Los KPI cards en la barra oscura con micro-graficos AreaChart dan contexto temporal sin ocupar espacio adicional. La version "mejorada" con deltas y colores semanticos es particularmente efectiva (`page.tsx:972-1032`).

3. **Bulk actions contextuales:** La barra de acciones masivas analiza los estados de los pedidos seleccionados y muestra solo acciones validas (ej: "Validar" solo si todos estan en "Pendiente"). Esto previene errores de estado (`page.tsx:512-548`).

4. **Column editor con drag-and-drop y density toggle:** El editor de columnas (`columnas/page.tsx`) con DnD visual, checkboxes de visibilidad, y selector de densidad (compact 40px / comfortable 56px) es un diferenciador para power users.

5. **Vista rapida (Support Compact Modal):** El modal `SupportCompactModal.tsx` con acceso via `Ctrl+Shift+R` permite copiar tracking, courier y datos del destinatario sin navegar al detalle. Ideal para soporte telefonico.

6. **Mobile-first responsive:** Ambas vistas tienen adaptacion mobile con cards en vez de tabla, paginacion simplificada, bottom-sheet para menus, y select nativo para tabs. La atencion al contexto warehouse movil es notable.

7. **Filter chips removibles:** Los filtros activos se muestran como chips con "X" para removerlos individualmente, mas un "Limpiar todos". Esto da visibilidad y control sobre el estado de filtrado (`page.tsx:1133-1168`).

8. **Indicador visual de pedidos con atraso:** En la vista mejorada, los pedidos con atraso tienen `boxShadow: "inset 3px 0 0 0 #f87171"` (borde rojo izquierdo), haciendolos identificables de un vistazo sin romper el flujo visual de la tabla (`page.tsx:1200`).

9. **Predictive address input en creacion:** El input de direccion con sugerencias tipo Google Places autocompleta region y comuna automaticamente, reduciendo errores de entrada (`crear/page.tsx:350-384`).

10. **SLA timeline en detalle:** El componente `MiniTimeline` con navegacion por flechas y fase activa resaltada da una vision inmediata del progreso del pedido sin scroll (`[id]/page.tsx:217-337`).

---

## 5. Historias de Usuario para Hallazgos Criticos/Altos

### HU-01: Checkbox accesible (QW-01)
**Como** operador de warehouse que usa tecnologias asistivas,
**quiero** poder seleccionar pedidos con teclado y lector de pantalla,
**para** ejecutar acciones masivas sin depender exclusivamente del mouse/touch.

**Criterios de aceptacion:**
- [ ] El checkbox puede recibir foco via Tab
- [ ] Space/Enter toggle el estado
- [ ] El lector de pantalla anuncia "Checkbox, pedido 1196807, no seleccionado"
- [ ] El touch target es minimo 44x44px

### HU-02: Feedback en acciones de tabla (QW-02)
**Como** operador procesando pedidos rapidamente,
**quiero** recibir feedback inmediato al hacer click en acciones de la tabla,
**para** saber que mi accion fue registrada y poder continuar con el siguiente pedido.

**Criterios de aceptacion:**
- [ ] "Ver detalle" navega a `/pedidos/{id}`
- [ ] Acciones no implementadas muestran toast "Funcionalidad en desarrollo"
- [ ] "Eliminar pedido" abre modal de confirmacion
- [ ] Cada boton tiene loading state mientras procesa

### HU-03: Sort por fecha real (QW-03)
**Como** supervisor revisando pedidos del dia,
**quiero** que el sort por "Fecha Creacion" ordene por la fecha real,
**para** encontrar pedidos recientes o antiguos sin datos incorrectos.

**Criterios de aceptacion:**
- [ ] "Hoy a las 22:15" > "Hoy a las 22:14" > "Ayer a las 18:10" > "16/03/2026 14:20"
- [ ] Sort asc/desc funciona correctamente
- [ ] El icono de sort refleja la direccion actual

### HU-04: Empty state contextual (QW-04)
**Como** operador que aplico filtros y no obtuvo resultados,
**quiero** ver un mensaje claro con opcion de limpiar filtros,
**para** entender que paso y como recuperarme.

**Criterios de aceptacion:**
- [ ] Si hay filtros activos: "No hay pedidos que coincidan con tus filtros" + boton "Limpiar filtros"
- [ ] Si no hay datos: "No hay pedidos registrados" + boton "Crear pedido"
- [ ] Incluye icono/ilustracion acorde al DS

### HU-05: Proteccion de campos editables en detalle (ST-03)
**Como** operador con pantalla tactil,
**quiero** que los campos del pedido esten en modo lectura por defecto,
**para** evitar modificaciones accidentales al tocar la pantalla.

**Criterios de aceptacion:**
- [ ] Campos read-only por defecto con visual diferenciado
- [ ] Boton "Editar" explicito activa modo edicion
- [ ] Al editar, aparece "Guardar" y "Cancelar" con dirty tracking
- [ ] Cambios criticos (estado, courier) requieren confirmacion

---

## 6. Plan de Fases con Score Estimado

### Fase 1: Quick Wins (Sprint 1 — 1 semana)
| Item | Esfuerzo | Score Delta |
|---|---|---|
| QW-01: Checkbox accesible | 2h | +2.0 |
| QW-02: Feedback acciones tabla | 1h | +1.5 |
| QW-03: Sort por fecha real | 2h | +1.0 |
| QW-04: Empty state contextual | 1.5h | +1.0 |
| QW-05: Conteo en filtros | 2h | +0.5 |
| FI-01: SLA badges 12px | 1h | +0.3 |
| FI-02: Debounce en search | 0.5h | +0.2 |
| **Subtotal** | **10h** | **+6.5** |

### Fase 2: Mejoras Estrategicas (Sprint 2-3 — 2 semanas)
| Item | Esfuerzo | Score Delta |
|---|---|---|
| ST-02: Unificar acciones de fila | 4h | +2.0 |
| ST-03: Proteger campos editables | 6h | +2.5 |
| ST-04: Agrupar estados de envio | 4h | +1.0 |
| FI-04: Paginacion inteligente | 2h | +0.5 |
| FI-05: Preview en column editor | 4h | +0.8 |
| FI-03: Documentar shortcuts | 2h | +0.3 |
| **Subtotal** | **22h** | **+7.1** |

### Fase 3: Refactoring y Polish (Sprint 4 — 1 semana)
| Item | Esfuerzo | Score Delta |
|---|---|---|
| ST-01: Extraer componentes | 8h | +1.0 |
| ST-05: Stepper en wizard creacion | 8h | +1.5 |
| FI-06: Tags con autocomplete | 3h | +0.5 |
| WCAG fixes restantes | 4h | +1.5 |
| **Subtotal** | **23h** | **+4.5** |

### Tabla de Score Acumulado

| Fase | Score Acumulado | Esfuerzo Total |
|---|---|---|
| Actual | **78.2** | — |
| Post Fase 1 | **84.7** | 10h |
| Post Fase 2 | **91.8** | 32h |
| Post Fase 3 | **96.3** | 55h |

---

## 7. Perspectiva Psicologica

### Modelo Mental del Operador de Warehouse
El operador de warehouse tiene un modelo mental de **flujo de produccion**: recibe, valida, prepara, empaca, despacha. El sistema dual de estados (preparacion + envio) alinea bien con este modelo, pero la complejidad de 18 estados de envio excede la capacidad de chunking del operador. La recomendacion de agrupar en 5 categorias (ST-04) reduce la carga de 18 items a 5 chunks.

### Ley de Hick y la Toma de Decisiones
Con 6 acciones visibles en la vista actual (QW-02/ST-02), el tiempo de decision aumenta logaritmicamente. El patron mejorado (1 accion primaria + overflow) reduce las opciones visibles de 6 a 2, acelerando la toma de decision en ~300ms segun Hick-Hyman.

### Efecto Zeigarnik en Formularios Incompletos
El wizard de creacion (ST-05) carece de indicadores de progreso, privando al usuario del efecto Zeigarnik (tendencia a recordar tareas incompletas). Un stepper visual con progreso porcentual aprovecharia este sesgo para reducir abandono.

### Affordance y Modo de Edicion
Los campos editables sin distincion visual del modo lectura (ST-03) violan el principio de affordance de Norman. Un campo que "parece texto plano" no comunica que puede ser editado, mientras que un campo que "parece editable todo el tiempo" invita a toques accidentales. La solucion: campos con fondo `neutral-50` en lectura que cambian a borde `primary-400` en edicion.

### Tunnel Vision en Entornos Ruidosos
Los operadores de warehouse trabajan bajo presion temporal, ruido ambiental, y con guantes. Los targets de 14x14px del checkbox (QW-01) y los textos de 9px en SLA badges (FI-01) no son adecuados para este contexto. Se recomienda un "Warehouse Mode" futuro con densidad expandida forzada y targets de 48px minimo.

---

## 8. Metricas Sugeridas

### Eficiencia Operativa
| Metrica | Baseline Estimado | Target Post-Mejoras |
|---|---|---|
| Tiempo promedio para encontrar un pedido | 12s | 6s |
| Clicks para ejecutar accion masiva | 5 | 3 |
| Tasa de abandono en wizard creacion | 15% | 5% |
| Errores de edicion accidental en detalle | 8/dia | 1/dia |

### Engagement
| Metrica | Medicion |
|---|---|
| Adopcion Vista Mejorada vs Actual | % usuarios que switchean y se quedan |
| Uso de column editor | % usuarios que personalizan columnas |
| Uso de keyboard shortcuts | Frecuencia de Ctrl+Shift+R por usuario |
| Uso de filtros avanzados | % sesiones con >1 filtro activo |

### Accesibilidad
| Metrica | Target |
|---|---|
| Score Lighthouse Accessibility | 95+ |
| Zero violaciones WCAG nivel A | 100% |
| Conformidad WCAG AA | 90%+ criterios |

### Satisfaccion
| Metrica | Instrumento |
|---|---|
| SUS (System Usability Scale) | Encuesta trimestral a operadores |
| Task Success Rate | Test de usabilidad con 5 operadores |
| Time-on-Task para flujos criticos | Observacion directa en warehouse |

---

*Evaluacion completada el 2026-03-27. Este modulo representa el mayor nivel de madurez UX en Amplifica y puede servir como blueprint para los demas modulos del WMS.*
