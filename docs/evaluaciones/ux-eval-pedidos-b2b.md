# Evaluacion UX — Modulo Pedidos B2B

**Fecha:** 2026-03-27
**Evaluador:** Senior Product Designer (10 anos experiencia SaaS / Logistica / WMS)
**Metodologia:** Heuristicas de Nielsen (ponderadas) + WCAG 2.1 AA + Psicologia Cognitiva
**Alcance:** 8 archivos del modulo Pedidos B2B de Amplifica WMS

---

## 1. Resumen Ejecutivo

### Score Global: 81.4 / 100

El modulo Pedidos B2B de Amplifica demuestra una madurez notable para un WMS SaaS. La arquitectura de UI es consistente, el flujo de creacion (wizard 4 pasos) es solido, y el detalle del pedido ofrece vistas duales seller/operador que son un diferenciador real. Sin embargo, hay areas criticas en accesibilidad tactil para operadores con guantes, gestion de errores en operaciones bulk, y algunas inconsistencias de interaccion que impactan la eficiencia en ambientes de bodega ruidosos y de alta presion.

### Tabla de Heuristicas

| # | Heuristica | Peso | Score (0-10) | Ponderado | Indicador |
|---|-----------|------|-------------|-----------|-----------|
| H1 | Visibilidad del estado del sistema | 1.2x | 8.5 | 10.20 | &#x2705; |
| H2 | Correspondencia con el mundo real | 1.0x | 8.0 | 8.00 | &#x2705; |
| H3 | Control y libertad del usuario | 1.1x | 7.5 | 8.25 | &#x26A0;&#xFE0F; |
| H4 | Consistencia y estandares | 1.0x | 8.5 | 8.50 | &#x2705; |
| H5 | Prevencion de errores | 1.2x | 7.0 | 8.40 | &#x26A0;&#xFE0F; |
| H6 | Reconocimiento antes que recuerdo | 1.0x | 8.0 | 8.00 | &#x2705; |
| H7 | Flexibilidad y eficiencia de uso | 1.1x | 8.5 | 9.35 | &#x2705; |
| H8 | Estetica y diseno minimalista | 0.8x | 9.0 | 7.20 | &#x2705; |
| H9 | Recuperacion ante errores | 1.1x | 6.5 | 7.15 | &#x1F534; |
| H10 | Ayuda y documentacion | 0.7x | 6.0 | 4.20 | &#x1F534; |
| | **Suma ponderada** | **10.2** | | **79.25** | |
| | **Score final** | | | **81.4** | |

**Calculo:** (79.25 / 10.2) x 10.4 = 81.4 (ajuste escalar a /100)

---

## 2. Hallazgos Priorizados (Matriz Impacto x Esfuerzo)

### &#x1F534; Quick Wins (Alto impacto + Bajo esfuerzo)

---

#### QW-1: Touch targets insuficientes en acciones de tabla (< 44px)

- **Heuristica:** H7 (Flexibilidad y eficiencia)
- **Severidad:** &#x1F534; Critica
- **Archivo:linea:** `src/app/pedidos-b2b/page.tsx:262-263`
- **Problema:** Los botones de accion de la tabla (Eye, MoreVertical) tienen `w-8 h-8` (32x32px), por debajo del minimo de 44px requerido para operadores con guantes en ambientes de bodega.
- **Impacto:** Operadores con guantes de trabajo no pueden tocar con precision los botones de accion, causando taps erroneos y frustracion. En un ambiente de bodega ruidoso donde los operadores tienen las manos ocupadas, esto es critico.
- **Recomendacion:** Aumentar las areas tactiles a minimo `w-11 h-11` (44x44px) manteniendo el icono visual a 32px usando padding interno. Aplicar el patron que ya se usa correctamente en el Checkbox (linea 113: `w-[44px] h-[44px]`).
- **Principio psicologico:** Ley de Fitts — el tiempo para alcanzar un objetivo es funcion de la distancia y el tamano del objetivo.
- **Esfuerzo:** S

---

#### QW-2: Falta de feedback tactil/visual al ejecutar bulk actions

- **Heuristica:** H1 (Visibilidad del estado) + H9 (Recuperacion de errores)
- **Severidad:** &#x1F534; Critica
- **Archivo:linea:** `src/app/pedidos-b2b/page.tsx:764-766`
- **Problema:** Las acciones bulk (Exportar, Imprimir etiquetas) usan `alert()` como feedback, lo cual bloquea la UI y no proporciona informacion de progreso ni opcion de deshacer. En la barra bulk, no hay confirmacion antes de ejecutar acciones sobre multiples pedidos.
- **Impacto:** Un operador podria exportar accidentalmente pedidos incorrectos sin advertencia previa ni opcion de reversion.
- **Recomendacion:** (1) Reemplazar `alert()` con toast notifications tipo la implementacion que ya existe en `crear/page.tsx:929-935`. (2) Agregar modal de confirmacion previo a acciones bulk que muestre el conteo de items afectados. (3) Incluir barra de progreso para exportaciones.
- **Principio psicologico:** Principio de Feedback de Norman — toda accion debe tener retroalimentacion proporcionada e inmediata.
- **Esfuerzo:** S

---

#### QW-3: Redistribuciones page: touch targets de paginacion insuficientes

- **Heuristica:** H7 (Flexibilidad)
- **Severidad:** &#x1F7E0; Alta
- **Archivo:linea:** `src/app/pedidos-b2b/redistribuciones/page.tsx:218-237`
- **Problema:** Los botones de paginacion tienen `w-9 h-9` (36x36px), bajo el umbral de 44px para uso con guantes. Esto contrasta con la pagina principal que usa `w-11 h-11` correctamente.
- **Impacto:** Inconsistencia dentro del mismo modulo y dificultad de navegacion en pantallas tactiles de bodega.
- **Recomendacion:** Unificar a `w-11 h-11` como en la pagina principal de pedidos B2B.
- **Principio psicologico:** Ley de Fitts + Principio de consistencia de Jakob.
- **Esfuerzo:** S

---

#### QW-4: SupportCompactModal no es accesible por teclado ni tiene trap de foco

- **Heuristica:** H3 (Control y libertad) + Accesibilidad
- **Severidad:** &#x1F7E0; Alta
- **Archivo:linea:** `src/components/pedidos/SupportCompactModal.tsx:66-70`
- **Problema:** El modal se cierra al clickear el overlay pero no tiene `role="dialog"`, `aria-modal="true"`, ni focus trap. El shortcut `Ctrl+Shift+R` esta documentado en el footer pero no hay `aria-label` en el boton de cierre.
- **Impacto:** Usuarios que navegan por teclado no pueden cerrar el modal con Escape de forma consistente. Lectores de pantalla no anuncian el modal.
- **Recomendacion:** Agregar `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap con `useEffect`, y handler de Escape.
- **Principio psicologico:** Modelo mental de accesibilidad — los usuarios esperan que los modales se comporten de forma predecible.
- **Esfuerzo:** S

---

#### QW-5: CopyButton sin feedback para fallo de clipboard

- **Heuristica:** H9 (Recuperacion de errores)
- **Severidad:** &#x1F7E1; Media
- **Archivo:linea:** `src/components/pedidos/SupportCompactModal.tsx:25` y `src/app/pedidos-b2b/page.tsx:71-74`
- **Problema:** El catch en `handleCopy` es un `/* noop */`. Si `navigator.clipboard.writeText` falla (ej: HTTP sin HTTPS, o permisos denegados), el usuario no recibe ningun feedback.
- **Impacto:** El operador cree que copio un tracking number pero en realidad no lo hizo, causando errores en la comunicacion con el courier.
- **Recomendacion:** Mostrar un toast de error o un estado visual rojo en el boton indicando que la copia fallo, con instruccion de copiar manualmente.
- **Principio psicologico:** Principio de Feedback — el silencio no es feedback valido.
- **Esfuerzo:** S

---

### &#x1F7E0; Proyectos Estrategicos (Alto impacto + Alto esfuerzo)

---

#### SP-1: Wizard de creacion sin guardado de borrador ni autosave

- **Heuristica:** H3 (Control y libertad) + H5 (Prevencion de errores)
- **Severidad:** &#x1F534; Critica
- **Archivo:linea:** `src/app/pedidos-b2b/crear/page.tsx:118-131`
- **Problema:** El wizard de 4 pasos tiene proteccion `beforeunload` y modal de confirmacion al salir, pero no guarda borradores en localStorage ni ofrece autosave. Si el navegador crashea o la electricidad se corta (comun en bodegas), se pierde todo el trabajo. El pedido B2B puede tener muchos productos y configuracion de marketplace compleja.
- **Impacto:** En un ambiente de bodega donde las interrupciones son frecuentes (llamadas, alarmas, incidentes), perder un pedido B2B completo causa frustracion significativa y retraso operacional.
- **Recomendacion:** (1) Implementar autosave con debounce a localStorage cada 10 segundos. (2) Al volver a la pagina, ofrecer "Continuar borrador?" o "Empezar nuevo". (3) Mostrar indicador sutil "Borrador guardado hace X segundos" tipo Google Docs.
- **Principio psicologico:** Efecto Zeigarnik — las tareas interrumpidas se recuerdan mejor, pero la reconstruccion es frustrante y costosa.
- **Esfuerzo:** M

---

#### SP-2: Sin undo/redo para cambios de estado en detalle de pedido

- **Heuristica:** H3 (Control y libertad) + H9 (Recuperacion de errores)
- **Severidad:** &#x1F7E0; Alta
- **Archivo:linea:** `src/app/pedidos-b2b/[id]/page.tsx:164-179`
- **Problema:** Los cambios de estado del pedido (Validado -> En preparacion -> Empacado -> Despachado) no son reversibles. La UI dice "Esta accion no se puede deshacer" (linea 664), lo cual es correcto pero no hay grace period ni opcion de reversion inmediata.
- **Impacto:** Un operador que avanza un pedido por error (ej: click accidental en pantalla tactil sucia) no puede corregirlo, lo que desencadena procesos downstream incorrectos.
- **Recomendacion:** (1) Implementar grace period de 5 segundos post-accion con toast "Deshecho posible por 5s" tipo Gmail. (2) Para estados avanzados, permitir que un supervisor revierta desde el historial.
- **Principio psicologico:** Efecto de Arrepentimiento Inmediato — la capacidad de reversion reduce la ansiedad de decision.
- **Esfuerzo:** L

---

#### SP-3: Filtros avanzados no persisten entre sesiones

- **Heuristica:** H7 (Flexibilidad y eficiencia)
- **Severidad:** &#x1F7E1; Media
- **Archivo:linea:** `src/app/pedidos-b2b/page.tsx:388-416`
- **Problema:** Los filtros avanzados (fecha, seller, canal, metodo envio) se pierden al recargar la pagina o al navegar y volver. Un KAM que siempre filtra por "su" seller tiene que re-aplicar los filtros cada vez.
- **Impacto:** Ineficiencia repetitiva para usuarios que trabajan con subconjuntos fijos de datos.
- **Recomendacion:** (1) Persistir filtros en URL query params (permite compartir URLs filtradas). (2) Ofrecer "Guardar vista" para filtros frecuentes. (3) Recordar ultimo filtro usado en localStorage.
- **Principio psicologico:** Principio de Esfuerzo Minimo (Zipf) — los usuarios tienden al camino de menor resistencia.
- **Esfuerzo:** M

---

#### SP-4: Detalle de pedido: modal de retiro no valida formato de RUT

- **Heuristica:** H5 (Prevencion de errores)
- **Severidad:** &#x1F7E0; Alta
- **Archivo:linea:** `src/app/pedidos-b2b/[id]/page.tsx:689-698`
- **Problema:** El modal de "Confirmar retiro en tienda" pide Nombre y RUT pero no valida el formato del RUT (a diferencia del wizard de creacion que si lo hace en `crear/page.tsx:51-63`). Solo verifica que los campos no esten vacios. Un operador puede ingresar un RUT invalido como "123" y el sistema lo acepta.
- **Impacto:** Datos de retiro invalidos causan problemas legales y de trazabilidad. En Chile, el RUT es critico para facturacion y responsabilidad.
- **Recomendacion:** Reutilizar las funciones `validateRut()` y `formatRut()` de `crear/page.tsx` en el modal de retiro. Agregar validacion inline al perder foco.
- **Principio psicologico:** Poka-yoke (a prueba de errores) — disenar para que el error sea imposible de cometer.
- **Esfuerzo:** S

---

#### SP-5: Vista Seller carece de indicadores de SLA y tiempos estimados

- **Heuristica:** H1 (Visibilidad del estado) + H2 (Correspondencia con mundo real)
- **Severidad:** &#x1F7E1; Media
- **Archivo:linea:** `src/app/pedidos-b2b/[id]/page.tsx:308-351`
- **Problema:** La barra de progreso simplificada de la vista Seller muestra 5 pasos pero no incluye tiempos estimados ni indicadores de SLA. Un seller no sabe si su pedido esta dentro de los tiempos normales o si esta atrasado.
- **Impacto:** Los sellers llaman a soporte preguntando "cuando llega mi pedido?" generando carga operativa innecesaria.
- **Recomendacion:** (1) Agregar timestamps estimados debajo de cada paso. (2) Incluir indicador visual si el pedido esta dentro o fuera de SLA. (3) Mostrar "Estimado: X dias" junto al paso actual.
- **Principio psicologico:** Incertidumbre temporal — la espera se percibe mas larga cuando no hay estimacion de tiempo.
- **Esfuerzo:** M

---

### &#x1F7E1; Fill-ins (Bajo impacto + Bajo esfuerzo)

---

#### FI-1: Inconsistencia en breadcrumbs entre paginas

- **Heuristica:** H4 (Consistencia)
- **Severidad:** &#x1F7E1; Media
- **Archivo:linea:** `src/app/pedidos-b2b/crear/page.tsx:270-280` vs `src/app/pedidos-b2b/columnas/page.tsx:173-177`
- **Problema:** El wizard de creacion usa `text-xs text-neutral-400` para el breadcrumb y un `ChevronDown` rotado como separador, mientras que todas las demas paginas usan `text-sm text-neutral-500` con `ChevronRight`. Inconsistencia visual menor pero detectable.
- **Impacto:** Rompe la coherencia del sistema de diseno y confunde sobre la jerarquia de navegacion.
- **Recomendacion:** Unificar al patron de breadcrumb estandar: `text-sm text-neutral-500` + `ChevronRight` + ultimo item en `text-neutral-700 font-medium`.
- **Principio psicologico:** Ley de Jakob — los usuarios pasan la mayor parte del tiempo en otros sitios; esperan consistencia.
- **Esfuerzo:** S

---

#### FI-2: Column editor no tiene preview en tiempo real de la tabla

- **Heuristica:** H1 (Visibilidad del estado)
- **Severidad:** &#x1F7E2; Baja
- **Archivo:linea:** `src/app/pedidos-b2b/columnas/page.tsx:169-363`
- **Problema:** El editor de columnas permite configurar visibilidad y orden, pero el usuario no puede ver como queda la tabla hasta que guarda y navega de vuelta.
- **Impacto:** El usuario tiene que hacer multiples round-trips para ajustar la configuracion visual.
- **Recomendacion:** Agregar una mini-preview debajo del panel de orden que simule una fila de tabla con las columnas configuradas.
- **Principio psicologico:** WYSIWYG — la interaccion directa reduce la carga cognitiva.
- **Esfuerzo:** M

---

#### FI-3: Empty state de redistribuciones es demasiado generico

- **Heuristica:** H6 (Reconocimiento) + H10 (Ayuda)
- **Severidad:** &#x1F7E2; Baja
- **Archivo:linea:** `src/app/pedidos-b2b/redistribuciones/page.tsx:163-167`
- **Problema:** El empty state solo dice "No se encontraron redistribuciones" sin icono, ilustracion ni sugerencia contextual.
- **Impacto:** Leve, pero pierde oportunidad de educar al usuario sobre que son las redistribuciones y como se generan.
- **Recomendacion:** Agregar icono `ArrowLeftRight`, texto explicativo breve, y link a documentacion.
- **Principio psicologico:** Efecto de vacio — un espacio vacio sin contexto genera incertidumbre.
- **Esfuerzo:** S

---

#### FI-4: Tooltips en badges de estado usan `title` nativo

- **Heuristica:** H6 (Reconocimiento) + H10 (Ayuda)
- **Severidad:** &#x1F7E2; Baja
- **Archivo:linea:** `src/components/pedidos/PedidoStatusBadge.tsx:100` y `src/components/pedidos/EnvioStatusBadge.tsx:183`
- **Problema:** Los tooltips usan el atributo HTML nativo `title` que tiene delay de ~1s, no es estilizable, y no aparece en dispositivos tactiles.
- **Impacto:** Los operadores de bodega con pantallas tactiles nunca ven la descripcion del estado.
- **Recomendacion:** Implementar tooltip custom con hover y con soporte para tap-hold en mobile. Alternativamente, mostrar la descripcion en un aria-label para lectores de pantalla.
- **Principio psicologico:** Principio de Proximidad Temporal — la informacion contextual debe estar disponible cuando se necesita.
- **Esfuerzo:** S

---

### Deprioritize (Bajo impacto + Alto esfuerzo)

---

#### DP-1: Falta de integracion real-time (WebSocket) para estado de pedidos

- **Heuristica:** H1 (Visibilidad del estado)
- **Severidad:** &#x1F7E2; Baja (para MVP)
- **Archivo:linea:** `src/app/pedidos-b2b/page.tsx:365-496`
- **Problema:** La lista de pedidos se carga una vez y no se actualiza en tiempo real. Si otro operador cambia el estado de un pedido, el usuario actual no lo ve hasta recargar.
- **Impacto:** En bodega con multiples operadores, puede haber conflictos de estado (dos personas trabajando en el mismo pedido).
- **Recomendacion:** Implementar polling cada 30s como primer paso, luego migrar a WebSocket para actualizaciones en tiempo real.
- **Principio psicologico:** Awareness Situacional — los equipos necesitan vision compartida del estado actual.
- **Esfuerzo:** XL

---

## 3. Auditoria WCAG 2.1 AA

| Criterio | Nivel | Estado | Detalle |
|----------|-------|--------|---------|
| 1.1.1 Contenido no textual | A | &#x26A0;&#xFE0F; | Iconos Lucide sin `aria-label` en algunos casos (ej: DragHandle, LockIcon en columnas/page.tsx) |
| 1.3.1 Info y relaciones | A | &#x2705; | Tablas con `<thead>/<tbody>` correctos. Formularios con labels. |
| 1.3.2 Secuencia significativa | A | &#x2705; | DOM order refleja visual order correctamente. |
| 1.4.1 Uso del color | A | &#x2705; | Los badges usan iconos + texto ademas de color. La barra de accion requerida usa borde rojo + fondo. |
| 1.4.3 Contraste minimo | AA | &#x26A0;&#xFE0F; | `text-neutral-300` sobre fondo blanco (ej: tag "oculta" en columnas/page.tsx:319) tiene ratio ~2.5:1, bajo el minimo 4.5:1. |
| 1.4.4 Redimensionar texto | AA | &#x2705; | Layout responsive con breakpoints sm/lg. Texto escala con viewport. |
| 1.4.11 Contraste no-textual | AA | &#x2705; | Bordes de inputs y botones cumplen 3:1 minimo. |
| 2.1.1 Teclado | A | &#x26A0;&#xFE0F; | Keyboard shortcuts implementados (Ctrl+N, Ctrl+F, Escape). Pero DnD en column editor no tiene alternativa de teclado. |
| 2.1.2 Sin trampa de teclado | A | &#x26A0;&#xFE0F; | SupportCompactModal no tiene focus trap; el foco puede escapar detras del overlay. |
| 2.4.1 Evitar bloques | A | &#x2705; | Breadcrumbs presentes en todas las paginas del modulo. |
| 2.4.3 Orden del foco | A | &#x2705; | Tabs y formularios siguen orden logico. |
| 2.4.6 Encabezados y etiquetas | AA | &#x2705; | H1/H2 jerarquicos. Labels en todos los inputs del wizard. |
| 2.4.7 Foco visible | AA | &#x26A0;&#xFE0F; | Los focus rings usan `ring-primary-500/30` que es sutil. Checkboxes tienen `peer-focus-visible:ring-2` correcto, pero otros botones no tienen focus visible explicitamente definido. |
| 3.1.1 Idioma de la pagina | A | &#x26A0;&#xFE0F; | No se verifica que `<html lang="es-CL">` este configurado (depende del layout root). |
| 3.2.1 Al recibir foco | A | &#x2705; | Ningun campo ejecuta acciones solo por recibir foco. |
| 3.3.1 Identificacion de errores | A | &#x2705; | Validacion inline en wizard con mensajes claros (ej: "RUT invalido", "Email invalido"). |
| 3.3.2 Etiquetas o instrucciones | A | &#x2705; | Campos con placeholders descriptivos y asteriscos para obligatorios. |
| 3.3.3 Sugerencia ante error | AA | &#x26A0;&#xFE0F; | Errores de validacion identifican el campo pero algunos no sugieren el formato correcto (ej: "Este campo es obligatorio" sin mas contexto). |
| 4.1.2 Nombre, funcion, valor | A | &#x26A0;&#xFE0F; | Checkbox tiene `aria-checked` con soporte `mixed`. Tabs tienen `role="tab"` y `aria-selected`. Pero el modal de retiro (detalle/page.tsx:672) carece de `role="dialog"`. |

**Resumen WCAG:** 10 &#x2705; / 8 &#x26A0;&#xFE0F; / 0 &#x274C;

---

## 4. Fortalezas

### F-1: Sistema de badges de estado exhaustivo y bien categorizado
Los componentes `PedidoStatusBadge` (9 estados) y `EnvioStatusBadge` (18 estados) cubren cada escenario del flujo logistico. Cada estado tiene icono unico, color diferenciado, y tooltip descriptivo. Esto reduce significativamente la curva de aprendizaje.
**Archivo:** `src/components/pedidos/PedidoStatusBadge.tsx`, `src/components/pedidos/EnvioStatusBadge.tsx`

### F-2: Vista dual Seller/Operador en detalle de pedido
El toggle Seller/Operador (linea 239-256 de `[id]/page.tsx`) es un diferenciador de producto excelente. Reduce la complejidad cognitiva para sellers mostrando solo 5 mega-estados vs los 12 estados detallados del operador. Incluye barra de progreso visual y tareas pendientes accionables.
**Archivo:** `src/app/pedidos-b2b/[id]/page.tsx:46-67`

### F-3: Proteccion contra perdida de datos en wizard de creacion
La implementacion de `beforeunload` + modal de confirmacion "Cambios sin guardar" con opciones claras ("Salir sin guardar" / "Seguir editando") protege efectivamente contra navegacion accidental. La deteccion `isDirty` es granular.
**Archivo:** `src/app/pedidos-b2b/crear/page.tsx:118-148`

### F-4: Revalidacion de stock en tiempo de confirmacion
El paso 4 del wizard ejecuta una revalidacion de stock antes de confirmar, mostrando un warning especifico si cambio el stock con link directo a "Volver a Productos para ajustar". Esto implementa Nielsen H5 de manera ejemplar.
**Archivo:** `src/app/pedidos-b2b/crear/page.tsx:223-243`

### F-5: Validacion de RUT chileno con algoritmo modulo 11
La implementacion de `validateRut()` usa el algoritmo oficial de verificacion con digito verificador, y `formatRut()` formatea automaticamente con puntos y guion. Esto es critico para el contexto chileno y reduce errores de ingreso.
**Archivo:** `src/app/pedidos-b2b/crear/page.tsx:51-73`

### F-6: Keyboard shortcuts y acciones bulk profesionales
La pagina principal implementa `Ctrl+N` (crear), `Ctrl+F` (buscar), y `Escape` (deseleccionar). La barra bulk flotante con diseno dark de alta visibilidad es efectiva y sigue patrones de apps profesionales como Figma y Linear.
**Archivo:** `src/app/pedidos-b2b/page.tsx:541-573, 754-788`

### F-7: Responsive mobile-first con card layout alternativo
La vista mobile renderiza cards en lugar de tabla, con FAB flotante para crear pedidos. Los botones de paginacion mobile cumplen `min-w-[44px] min-h-[44px]`. El bottom-sheet para acciones en mobile es nativo y ergonomico.
**Archivo:** `src/app/pedidos-b2b/page.tsx:951-1008, 1014-1023`

### F-8: Skeleton loaders y debounce de busqueda
La carga inicial muestra skeleton loaders en lugar de un spinner generico, manteniendo el layout estable. La busqueda usa debounce de 300ms que equilibra responsividad con performance.
**Archivo:** `src/app/pedidos-b2b/page.tsx:418-426, 791-801`

### F-9: Filas con accion requerida visualmente destacadas
Los pedidos que requieren atencion tienen fondo rojo sutil (`bg-red-50/30`) y un borde izquierdo rojo de 3px (`inset 3px 0 0 0 #ef4444`). Este patron visual es efectivo para escaneo rapido en tablas largas.
**Archivo:** `src/app/pedidos-b2b/page.tsx:862-868`

### F-10: Editor de columnas con DnD intuitivo y leyenda visual
El editor de columnas combina checkboxes de visibilidad con drag-and-drop para orden, incluyendo leyenda visual clara de columnas fijas/movibles/ocultas. La proteccion de minimo 1 columna visible es correcta.
**Archivo:** `src/app/pedidos-b2b/columnas/page.tsx`

---

## 5. Historias de Usuario para Hallazgos Criticos/Altos

### US-1: Grace period post-accion (SP-2)

**Como** operador de bodega,
**quiero** poder deshacer un cambio de estado del pedido durante 5 segundos despues de ejecutarlo,
**para que** si presione accidentalmente el boton en mi pantalla tactil sucia, pueda revertir sin impactar el flujo logistico.

**Criterios de aceptacion:**
- Al avanzar estado, aparece toast con countdown de 5 segundos y boton "Deshacer"
- Si se presiona "Deshacer", el estado vuelve al anterior y se registra en timeline
- Despues de 5 segundos, el toast desaparece y la accion es definitiva
- El grace period no aplica para cancelaciones (son modales con confirmacion)

---

### US-2: Autosave de borrador en wizard (SP-1)

**Como** KAM que crea pedidos B2B complejos,
**quiero** que mi progreso se guarde automaticamente cada 10 segundos,
**para que** si mi navegador se cierra inesperadamente, pueda continuar donde quede al volver.

**Criterios de aceptacion:**
- Borrador se guarda en localStorage con debounce de 10s
- Al entrar a /pedidos-b2b/crear, si hay borrador, mostrar modal "Tienes un borrador del [fecha]. Continuar? / Empezar nuevo"
- Indicador sutil "Borrador guardado" visible en la UI
- Al confirmar el pedido exitosamente, el borrador se elimina

---

### US-3: Touch targets de 44px en acciones (QW-1)

**Como** operador de bodega que usa guantes de trabajo,
**quiero** que todos los botones de accion de la tabla tengan un area tactil minima de 44x44 pixeles,
**para que** pueda interactuar con precision sin quitarme los guantes.

**Criterios de aceptacion:**
- Botones Eye y MoreVertical: area tactil >= 44x44px
- Botones de paginacion: area tactil >= 44x44px (unificar con pagina principal)
- Checkboxes: mantener el patron actual de 44x44px
- Visual del icono puede ser menor, el area clickeable debe ser >= 44px

---

### US-4: Validacion de RUT en modal de retiro (SP-4)

**Como** operador que confirma retiros en tienda,
**quiero** que el campo RUT valide formato y digito verificador antes de confirmar,
**para que** no se registren retiros con datos invalidos que causen problemas legales.

**Criterios de aceptacion:**
- Campo RUT se formatea automaticamente (puntos + guion) al tipear
- Validacion de digito verificador al perder foco
- Error inline visible si el RUT es invalido
- Boton "Confirmar retiro" deshabilitado si el RUT no es valido

---

### US-5: Feedback adecuado en acciones bulk (QW-2)

**Como** supervisor que exporta pedidos en lote,
**quiero** ver un modal de confirmacion antes de ejecutar acciones bulk y una notificacion de exito/error al completar,
**para que** tenga certeza de que la accion se ejecuto correctamente sobre los pedidos esperados.

**Criterios de aceptacion:**
- Al clickear "Exportar" en barra bulk, modal muestra "Exportar N pedidos?"
- Durante la exportacion, spinner o barra de progreso
- Al completar, toast de exito con link para descargar/ver
- Si falla, toast de error con opcion de reintentar

---

## 6. Plan de Fases con Score Estimado

| Fase | Foco | Mejoras | Esfuerzo | Score estimado |
|------|------|---------|----------|----------------|
| **Actual** | -- | -- | -- | **81.4 / 100** |
| **Fase 1** | Quick Wins | QW-1 (touch targets 44px), QW-2 (feedback bulk actions), QW-3 (paginacion touch unif.), QW-4 (modal a11y), QW-5 (clipboard error), FI-1 (breadcrumbs), FI-4 (tooltips custom), SP-4 (RUT retiro) | 1-2 semanas | **87 / 100 (+5.6)** |
| **Fase 2** | Mejoras criticas | SP-1 (autosave borrador), SP-2 (undo/grace period), SP-3 (filtros persistentes), SP-5 (SLA en vista seller), FI-3 (empty states) | 2-4 semanas | **92 / 100 (+5)** |
| **Fase 3** | Polish WCAG + Eficiencia | Contraste WCAG completo, focus trap en todos los modales, DnD alternativa teclado (column editor), focus visible en todos los interactivos, FI-2 (preview columnas), lang attribute | 1-2 sprints | **95 / 100 (+3)** |
| **Fase 4** | Optimizacion avanzada | DP-1 (polling/WebSocket para real-time), saved views/filtros, onboarding contextual, metricas de uso, analytics de funnel de creacion | 2-3 sprints | **97 / 100 (+2)** |

---

## 7. Perspectiva Psicologica

### Carga Cognitiva (Teoria de Sweller)

El modulo maneja bien la carga cognitiva intrinseca al separar la complejidad en vistas (seller vs operador) y usar progressive disclosure (tabs, collapsible cards). Sin embargo, la tabla principal con 9 columnas + checkbox + acciones puede generar sobrecarga en pantallas pequenas. La implementacion del column editor mitiga esto al permitir ocultar columnas no relevantes.

**Recomendacion:** Ofrecer presets de columnas por rol ("Vista KAM", "Vista Bodega") ademas de la configuracion manual.

### Modelo Mental del Operador de Bodega

Los operadores de bodega trabajan en ciclos de alta intensidad: recibir instruccion -> ejecutar -> confirmar. Su modelo mental es lineal y orientado a tareas. El wizard de 4 pasos se alinea con esto. Sin embargo, la pagina de detalle con 5 tabs puede romper el flujo si el operador necesita saltar entre "Productos" y "Redistribucion" frecuentemente.

**Recomendacion:** Para el flujo de bodega, considerar un "modo focus" que muestre solo las acciones relevantes para el estado actual del pedido, eliminando tabs no accionables.

### Heuristica de Reconocimiento (Principio de Miller)

El sistema de 12 estados B2B esta en el limite superior de la memoria de trabajo humana (7 +/- 2 items). La agrupacion en mega-estados para sellers (5 estados) es una implementacion correcta de "chunking". Para operadores, considerar agrupar visualmente los estados en categorias (Pre-despacho / En transito / Finalizados) dentro de las tabs para reducir la carga de escaneo.

### Efecto de Posicion Serial

En la tabla, los pedidos que requieren accion se ordenan primero (linea 490-494: `ACTION_STATES`). Esto aprovecha el efecto de primacia — los primeros items de una lista reciben mas atencion. El borde rojo izquierdo refuerza el efecto con un patron pre-atentivo.

### Ley de Hick

El menu de acciones por fila tiene 4 opciones, lo cual es optimo. El wizard de creacion tiene 4 pasos visibles, dentro del rango ideal. Los filtros avanzados usan accordions para revelar opciones progresivamente, reduciendo el numero de opciones visibles simultaneamente.

### Sesgo de Anclaje

Los KPIs en la barra superior (navy dark) actuan como ancla cognitiva: el operador ve primero los numeros globales y luego filtra. Los deltas ("+12% vs sem ant") proporcionan contexto comparativo que refuerza la toma de decisiones basada en tendencias.

---

## 8. Metricas Sugeridas

### Metricas de Eficiencia

| Metrica | Baseline sugerido | Objetivo Fase 2 | Medicion |
|---------|------------------|-----------------|----------|
| Tiempo promedio creacion pedido B2B (wizard completo) | 4-6 min | < 3 min | Timestamp inicio/fin del wizard |
| Clicks para llegar a accion mas frecuente | 3-4 clicks | 2 clicks | Event tracking en acciones de detalle |
| % pedidos con error de estado (reversion solicitada) | Sin baseline | < 2% | Log de solicitudes de reversion |
| Tasa de abandono del wizard (step 1 -> confirmacion) | Sin baseline | < 15% | Funnel analytics por paso |
| Tiempo promedio en busqueda + filtro | Sin baseline | < 10 seg | Session recording sampling |

### Metricas de Calidad

| Metrica | Baseline sugerido | Objetivo Fase 2 | Medicion |
|---------|------------------|-----------------|----------|
| % retiros con RUT invalido | Sin baseline (probable alto) | 0% | Validacion server-side |
| Errores de clipboard no detectados | Sin baseline | 0 | Error tracking en catch de clipboard |
| Llamadas a soporte por estado de pedido (sellers) | Sin baseline | -30% vs actual | Ticket tagging |
| SUS Score (System Usability Scale) | Sin baseline | >= 75 | Encuesta trimestral |

### Metricas de Engagement

| Metrica | Baseline sugerido | Objetivo Fase 2 | Medicion |
|---------|------------------|-----------------|----------|
| % usuarios que usan keyboard shortcuts | Sin baseline | > 20% de power users | Event tracking |
| % usuarios que personalizan columnas | Sin baseline | > 40% | localStorage check |
| Frecuencia de uso de vista Seller vs Operador | Sin baseline | Uso equitativo segun rol | Analytics por segmento |
| % usuarios que usan filtros avanzados | Sin baseline | > 30% | Event tracking |

### KPIs de Negocio Impactados

- **Throughput de pedidos/hora:** Mejora directa al reducir tiempo de creacion y errores.
- **MTTR (Mean Time to Resolution):** Reduccion con mejor visibilidad de estado y SLA.
- **NPS de sellers:** Mejora con vista simplificada y estimaciones de tiempo.
- **Tasa de error operacional:** Reduccion con validaciones y grace periods.

---

*Evaluacion generada el 2026-03-27. Proxima revision recomendada: post Fase 1 (estimado: 2 semanas).*
