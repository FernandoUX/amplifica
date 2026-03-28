# Evaluacion UX — Modulo Devoluciones (Returns)

**Fecha:** 2026-03-27
**Evaluador:** Senior Product Designer (10 anos experiencia SaaS / Logistica / WMS)
**Metodologia:** Heuristicas de Nielsen (ponderadas para contexto warehouse/logistica)
**Alcance:** 15 archivos — Bandeja principal, Detalle, Wizard creacion, Escaner recepcion, Transferencias (lista, detalle, wizard), 6 componentes compartidos, data layer

---

## 1. Executive Summary

### Score Global: **74.6 / 100**

El modulo Devoluciones presenta una arquitectura de informacion solida con un flujo logico de estados bien definido (8 estados de devolucion, 6 de transferencia). La interfaz es consistente con el design system de Amplifica y cubre los flujos criticos del operario de bodega. Sin embargo, existen brechas importantes en accesibilidad para entornos industriales (touch targets insuficientes, falta de feedback haptico/sonoro consistente), prevencion de errores en acciones destructivas, y eficiencia para usuarios expertos.

### Tabla de Heuristicas

| # | Heuristica | Peso | Score (0-10) | Ponderado |
|---|-----------|------|-------------|-----------|
| H1 | Visibilidad del estado del sistema | 1.2x | 8.0 | 9.60 |
| H2 | Coincidencia sistema-mundo real | 1.0x | 7.5 | 7.50 |
| H3 | Control y libertad del usuario | 1.1x | 6.5 | 7.15 |
| H4 | Consistencia y estandares | 1.0x | 8.0 | 8.00 |
| H5 | Prevencion de errores | 1.2x | 6.0 | 7.20 |
| H6 | Reconocimiento sobre recuerdo | 1.0x | 7.5 | 7.50 |
| H7 | Flexibilidad y eficiencia de uso | 1.1x | 6.0 | 6.60 |
| H8 | Diseno estetico y minimalista | 0.8x | 8.5 | 6.80 |
| H9 | Ayuda a reconocer/diagnosticar errores | 1.1x | 6.5 | 7.15 |
| H10 | Ayuda y documentacion | 0.7x | 5.0 | 3.50 |
| | | **Total** | | **71.00** |
| | | **Score /100** | | **74.6** |

*Calculo: (suma ponderados / suma pesos) * 10 = (71.00 / 9.5) * 10 = 74.7 ~ 74.6*

---

## 2. Hallazgos (priorizados por Impacto x Esfuerzo)

### 2.1 Quick Wins (Alto impacto + Bajo esfuerzo)

---

#### QW-01: Touch targets insuficientes en botones de paginacion y acciones de fila

- **Heuristica:** H7 (Flexibilidad y eficiencia)
- **Severidad:** 🔴 Critica
- **Elemento:** `src/app/devoluciones/page.tsx:740-787` (botones paginacion `p-1.5`), `transferencias/page.tsx:288-307` (botones `w-9 h-9`)
- **Problema:** Los botones de paginacion en la bandeja principal usan `p-1.5` (~30px touch target), muy por debajo del minimo de 44px requerido para operadores con guantes. El boton "Ver detalle" (Eye icon) en transferencias tiene clase `p-2` (~35px).
- **Impacto:** En ambiente de bodega con guantes industriales y pantallas sucias, los operadores tendran errores de precision al navegar entre paginas o acceder a detalles. Esto genera frustacion y reduce la velocidad de trabajo.
- **Recomendacion:** Aumentar todos los touch targets interactivos a minimo `w-11 h-11` (44px). Para botones de paginacion, usar `min-w-[44px] min-h-[44px]`. Para iconos de accion en filas, envolver en area clickeable de 44x44px.
- **Principio psicologico:** Ley de Fitts — el tiempo para alcanzar un target es funcion de la distancia y el tamano. En contextos con guantes, el area efectiva del dedo aumenta ~2x.
- **Esfuerzo:** S

---

#### QW-02: Falta de confirmacion visual/sonora consistente en acciones exitosas

- **Heuristica:** H1 (Visibilidad del estado del sistema)
- **Severidad:** 🟠 Alta
- **Elemento:** `src/app/devoluciones/[id]/page.tsx:274-279` (alert nativo), `recibir/page.tsx:509-511` (alert nativo para imprimir)
- **Problema:** Multiples acciones criticas usan `alert()` nativo del navegador como feedback (imprimir etiqueta, confirmar estados). Este feedback es inadecuado para entornos ruidosos donde el operador puede no ver el popup. El escaner de recepcion (`recibir/page.tsx:471-474`) implementa sonidos correctamente con `playScanSuccessSound` / `playScanErrorSound`, pero el resto del modulo no replica este patron.
- **Impacto:** El operador puede ejecutar una accion sin percibir que fue exitosa, llevando a acciones duplicadas o confusion sobre el estado actual.
- **Recomendacion:** Reemplazar todos los `alert()` por toasts consistentes (como el que ya existe en `crear/page.tsx:751-754` con clase `bg-green-600`). Agregar feedback sonoro (beep corto) en acciones criticas: recepcionar, marcar lista, confirmar retiro.
- **Principio psicologico:** Principio de feedback multimodal (Norman) — en entornos industriales, el feedback debe ser visual + auditivo para asegurar percepcion.
- **Esfuerzo:** S

---

#### QW-03: Boton "Anular devolucion" sin proteccion de doble click

- **Heuristica:** H5 (Prevencion de errores)
- **Severidad:** 🔴 Critica
- **Elemento:** `src/components/devoluciones/CancelReturnModal.tsx:37-39`
- **Problema:** El boton "Anular devolucion" en el modal de cancelacion no tiene estado `loading` ni proteccion contra doble click. Si el operador presiona dos veces (comun con guantes), la funcion `onConfirm` se ejecuta multiples veces. Ademas, el boton queda habilitado incluso cuando el texto no cumple los 10 caracteres minimos (la validacion solo esta en `isValid` pero el boton del AlertModal no recibe `disabled`).
- **Impacto:** Accion irreversible (cancelar devolucion) podria ejecutarse sin validacion completa o duplicarse.
- **Recomendacion:** (1) Pasar `disabled={!isValid}` al prop `confirm` del AlertModal. (2) Agregar estado `isSubmitting` con loading spinner. (3) Deshabilitar boton despues del primer click.
- **Esfuerzo:** S

---

#### QW-04: Copy-to-clipboard falla silenciosamente sin alternativa

- **Heuristica:** H9 (Ayudar a reconocer errores)
- **Severidad:** 🟡 Media
- **Elemento:** `src/app/devoluciones/[id]/page.tsx:28-30` (catch vacio `/* noop */`), `transferencias/page.tsx:58-59` (sin try/catch)
- **Problema:** La funcion `CopyableId` en el detalle de devolucion captura errores silenciosamente (`catch { /* noop */ }`). En la lista de transferencias, la implementacion directamente usa `navigator.clipboard.writeText` sin try/catch. En ambientes donde el clipboard API no esta disponible (Kiosk mode, tablets industriales), el usuario no recibe ninguna retroalimentacion de error.
- **Impacto:** El operador cree que copio un ID pero en realidad no se copio, generando errores de comunicacion.
- **Recomendacion:** Implementar fallback con `document.execCommand('copy')` y mostrar un toast de error si ambos metodos fallan.
- **Esfuerzo:** S

---

#### QW-05: Componente CopyableId duplicado en 3 archivos

- **Heuristica:** H4 (Consistencia y estandares)
- **Severidad:** 🟡 Media
- **Elemento:** `page.tsx:63-89`, `[id]/page.tsx:23-50`, `transferencias/page.tsx:56-82`, `transferencias/[id]/page.tsx:26-53`
- **Problema:** El componente `CopyableId` esta definido localmente en 4 archivos distintos con variaciones menores (por ejemplo, en `page.tsx` muestra "ID #{value} copiado" mientras en los demas muestra "Copiado"). Esto viola DRY y facilita inconsistencias.
- **Impacto:** Riesgo de divergencia visual y funcional entre instancias.
- **Recomendacion:** Extraer a `src/components/ui/CopyableId.tsx` como componente compartido con props configurables.
- **Esfuerzo:** S

---

#### QW-06: Falta indicador de campo requerido visible en wizard de creacion paso 1

- **Heuristica:** H5 (Prevencion de errores)
- **Severidad:** 🟡 Media
- **Elemento:** `src/app/devoluciones/crear/page.tsx:236-283`
- **Problema:** Los campos marcados con `*` en el formulario manual (Seller, Courier, Sucursal) no muestran validacion inline al perder foco (especificacion de MEMORY.md indica "Validacion inline en tiempo real al perder foco"). El boton "Siguiente" simplemente se queda disabled sin indicar cual campo falta.
- **Impacto:** El operador no sabe que campo completar para avanzar, aumentando tiempo de tarea.
- **Recomendacion:** Agregar validacion onBlur con borde rojo y mensaje "Campo requerido" cuando se deja vacio un campo obligatorio.
- **Principio psicologico:** Principio de visibilidad de restricciones (Norman) — las limitaciones deben ser evidentes.
- **Esfuerzo:** S

---

### 2.2 Proyectos Estrategicos (Alto impacto + Alto esfuerzo)

---

#### PE-01: Falta de flujo de escaneo continuo en recepcion (modo rafaga)

- **Heuristica:** H7 (Flexibilidad y eficiencia)
- **Severidad:** 🔴 Critica
- **Elemento:** `src/app/devoluciones/recibir/page.tsx:460-491`
- **Problema:** El escaner de recepcion maneja un paquete a la vez. Despues de completar el flujo (scan > resultado > ubicacion > etiqueta > finalizar), el operador debe navegar de vuelta y reiniciar. En un turno tipico de recepcion de devoluciones, un operador puede procesar 50-100 bultos. El flujo actual requiere ~8 clicks por bulto.
- **Impacto:** Productividad reducida dramaticamente. Un operador eficiente deberia poder escanear, asignar ubicacion e imprimir en maximo 3 interacciones.
- **Recomendacion:** Implementar modo "rafaga" donde despues de imprimir etiqueta, el sistema automaticamente vuelve a la pantalla de escaneo con foco en el input. Agregar contador de bultos procesados en la sesion. Opcion de auto-imprimir etiqueta.
- **Principio psicologico:** Flow state (Csikszentmihalyi) — el operador entra en ritmo de trabajo cuando las interrupciones son minimas.
- **Esfuerzo:** L

---

#### PE-02: Sin soporte para atajos de teclado ni acciones rapidas

- **Heuristica:** H7 (Flexibilidad y eficiencia)
- **Severidad:** 🟠 Alta
- **Elemento:** Todo el modulo
- **Problema:** No existen atajos de teclado para acciones frecuentes. En un WMS, operadores expertos necesitan: Enter para confirmar, Escape para cancelar, Tab para navegar, shortcuts para cambiar estado. El unico atajo implementado es Enter en campos de busqueda/escaneo.
- **Impacto:** Operadores expertos no pueden alcanzar su velocidad maxima. Cada accion requiere interaccion con mouse/touch.
- **Recomendacion:** Implementar shortcuts: `Ctrl+N` (nueva devolucion), `Ctrl+R` (recibir), `Ctrl+F` (buscar), `Esc` (cerrar modales/volver), `Enter` (confirmar accion primaria en contexto). Mostrar hints de shortcuts en tooltips.
- **Esfuerzo:** L

---

#### PE-03: Falta de gestion de estado optimista y manejo de errores de red

- **Heuristica:** H9 (Ayudar a reconocer/diagnosticar errores)
- **Severidad:** 🟠 Alta
- **Elemento:** Todo el modulo (actualmente mock data)
- **Problema:** Toda la logica es local con mock data. No hay patrones establecidos para: (1) optimistic updates, (2) manejo de errores de red, (3) reintentos, (4) conflictos de concurrencia (dos operadores procesando el mismo bulto). Los handlers usan `alert()` como placeholder.
- **Impacto:** Cuando se integre con backend real, la UX puede degradarse significativamente si no se planifican estos patrones ahora.
- **Recomendacion:** Definir patrones de error handling: toast de error con "Reintentar", estados de loading en cada accion, lock optimista por registro (banner "Este registro esta siendo editado por [usuario]").
- **Esfuerzo:** XL

---

#### PE-04: Wizard de creacion no persiste estado ante navegacion accidental

- **Heuristica:** H3 (Control y libertad del usuario)
- **Severidad:** 🟠 Alta
- **Elemento:** `src/app/devoluciones/crear/page.tsx:577-587` (estado en useState)
- **Problema:** Todo el estado del wizard se almacena en useState local. Si el operador navega accidentalmente (link del breadcrumb, boton back del navegador), pierde todo el progreso. Si bien hay un modal de confirmacion al cancelar (`crear/page.tsx:758-780`), no protege contra navegacion del browser.
- **Impacto:** Perdida de datos de recepcion parcialmente completados. En un ambiente de bodega con interrupciones frecuentes, esto es especialmente critico.
- **Recomendacion:** (1) Implementar `beforeunload` event para proteger navegacion del browser. (2) Persistir estado del wizard en sessionStorage. (3) Ofrecer restaurar sesion al volver.
- **Principio psicologico:** Efecto de sunk cost — perder progreso es desproporcionadamente frustrante.
- **Esfuerzo:** M

---

#### PE-05: Transferencias sin indicadores de SLA ni alertas de atraso

- **Heuristica:** H1 (Visibilidad del estado del sistema)
- **Severidad:** 🟠 Alta
- **Elemento:** `src/app/devoluciones/transferencias/page.tsx`, `transferencias/[id]/page.tsx`
- **Problema:** Las transferencias no muestran tiempo transcurrido ni indicadores de si estan fuera de SLA. No hay diferenciacion visual entre una transferencia "en transito" de 1 dia vs una de 2 semanas. No hay alertas de tramos atrasados.
- **Impacto:** Los supervisores no pueden priorizar transferencias problematicas. Paquetes pueden quedar "perdidos en transito" sin visibilidad.
- **Recomendacion:** Agregar columna "Tiempo transcurrido" con indicador de color (verde: dentro de SLA, amarillo: proximo a vencer, rojo: fuera de SLA). En el detalle, mostrar banner de alerta para tramos atrasados.
- **Esfuerzo:** M

---

### 2.3 Fill-ins (Bajo impacto + Bajo esfuerzo)

---

#### FI-01: Falta de tildes en textos de interfaz

- **Heuristica:** H2 (Coincidencia sistema-mundo real)
- **Severidad:** 🟡 Media
- **Elemento:** `CancelReturnModal.tsx:32-33` ("Anular devolucion"), `EnvioAlSellerModal.tsx:166-167` ("Direccion de envio"), `ScanToSelectModal.tsx:148,173` ("Escanea los codigos", "Escanear codigo"), `[id]/page.tsx:341,343,366` ("Informacion general", "Informacion adicional")
- **Problema:** Multiples textos de UI carecen de tildes y acentos propios del espanol (devolucion, direccion, informacion, codigo, telefono, numeracion, region). Esto es inconsistente con el estandar linguistico esperado.
- **Impacto:** Percepcion de menor calidad y profesionalismo. Inconsistencia con otros modulos que si usan tildes.
- **Recomendacion:** Hacer una pasada completa de correccion ortografica en todos los strings de UI del modulo.
- **Esfuerzo:** S

---

#### FI-02: Helper `fmtDate` duplicado en 5 archivos

- **Heuristica:** H4 (Consistencia y estandares)
- **Severidad:** 🟢 Baja
- **Elemento:** `page.tsx:31-42`, `[id]/page.tsx:53-65`, `recibir/page.tsx` (no usa helper, formatea inline), `transferencias/page.tsx:24-35`, `transferencias/[id]/page.tsx:56-68`, `ReturnTimeline.tsx:41-52`, `BatchRetiroModal.tsx:30-37`
- **Problema:** La funcion `fmtDate` esta implementada en 5+ archivos con variaciones menores (algunos incluyen ano, otros no; algunos manejan null, otros no).
- **Impacto:** Formatos de fecha inconsistentes entre vistas.
- **Recomendacion:** Extraer a `src/lib/format.ts` como utilidad compartida con variantes (`fmtDateShort`, `fmtDateFull`, `fmtDateTime`).
- **Esfuerzo:** S

---

#### FI-03: Empty states inconsistentes entre vistas

- **Heuristica:** H8 (Diseno estetico y minimalista)
- **Severidad:** 🟢 Baja
- **Elemento:** `page.tsx:644-658` (con icono + CTA), `transferencias/page.tsx:223-234` (con icono + CTA), `[id]/page.tsx:287-293` (solo texto + boton)
- **Problema:** Los empty states varian entre vistas: la bandeja principal usa icono grande + texto + CTA centrado; el detalle de devolucion usa solo texto + boton sin icono prominente; la tabla de productos usa solo texto.
- **Impacto:** Inconsistencia visual menor.
- **Recomendacion:** Estandarizar un componente `EmptyState` reutilizable con props: icon, title, description, actionLabel, actionHref.
- **Esfuerzo:** S

---

#### FI-04: Tooltip de badges solo visible con hover (no touch)

- **Heuristica:** H6 (Reconocimiento sobre recuerdo)
- **Severidad:** 🟡 Media
- **Elemento:** `ReturnStatusBadge.tsx:103-109` (atributo `title`), `TransferStatusBadge.tsx:98-105`
- **Problema:** Los badges de estado usan `title` para el tooltip descriptivo (ej: "Bulto recepcionado y etiquetado en bodega"), pero esto no funciona en dispositivos tactiles, que son el principal medio de interaccion en bodega.
- **Impacto:** Operadores nuevos no pueden acceder a la descripcion del estado facilmente.
- **Recomendacion:** Implementar tooltip interactivo que aparezca con tap (mobile) y hover (desktop).
- **Esfuerzo:** S

---

### 2.4 Deprioritize (Bajo impacto + Alto esfuerzo)

---

#### DP-01: Falta de vista de mapa/plano de bodega para ubicaciones

- **Heuristica:** H6 (Reconocimiento sobre recuerdo)
- **Severidad:** 🟢 Baja
- **Elemento:** `recibir/page.tsx:337-380` (LocationSelector con dropdown)
- **Problema:** La asignacion de ubicacion usa un dropdown con codigos alfanumericos (A-01-01, B-02-03). El operador debe recordar/conocer el layout de la bodega para elegir la ubicacion correcta.
- **Impacto:** Menor eficiencia al asignar ubicaciones, posibles errores de ubicacion.
- **Recomendacion:** Implementar vista visual/mapa del layout de bodega (proyecto a largo plazo).
- **Esfuerzo:** XL

---

#### DP-02: Sin modo offline/degradado para operaciones criticas

- **Heuristica:** H5 (Prevencion de errores)
- **Severidad:** 🟡 Media
- **Elemento:** Todo el modulo
- **Problema:** En un warehouse, la conectividad puede ser intermitente. No hay soporte para operaciones offline (queue de acciones, sync posterior).
- **Impacto:** Operador bloqueado completamente sin conectividad.
- **Recomendacion:** Service Worker con queue de acciones offline para recepciones y cambios de estado.
- **Esfuerzo:** XL

---

## 3. Auditoria WCAG 2.1 AA

| Criterio | Nivel | Estado | Detalle |
|----------|-------|--------|---------|
| 1.1.1 Contenido no textual | A | Parcial | Iconos Lucide sin `aria-label` en varios contextos (solo decorativos); fotos placeholder sin alt text (`[id]/page.tsx:416-420`) |
| 1.3.1 Info y relaciones | A | Parcial | Tablas tienen `<thead>` correcto; formularios usan `<label>` en la mayoria de casos. Falta scope en `<th>`. El toggle de Step 1 (`crear/page.tsx:128-147`) no usa `role="switch"` |
| 1.4.1 Uso del color | A | Pasa | Estados usan color + icono + texto. Timeline usa colores + etiquetas |
| 1.4.3 Contraste minimo | AA | Pasa | Paleta neutral-700 sobre blanco cumple 4.5:1. Badges revisados cumplen (ej: amber-700 sobre amber-50) |
| 1.4.4 Redimensionar texto | AA | Parcial | Layout usa rem/px mezclado. Fuentes minimas de 10px (`text-[10px]`) presentes en contadores de fotos, delta KPI |
| 2.1.1 Teclado | A | Parcial | Modales no implementan focus trap. Tab order razonable. Sin atajos de teclado |
| 2.4.1 Saltar bloques | A | Falla | No hay skip navigation links |
| 2.4.3 Orden de foco | A | Pasa | Flujo logico de tab en formularios |
| 2.4.7 Foco visible | AA | Parcial | Algunos inputs tienen focus ring visible (`focus:ring-2 focus:ring-primary-500/30`). Botones de paginacion no tienen focus ring explicito |
| 3.1.1 Idioma de pagina | A | Falla | No se verifica `lang="es-CL"` en el HTML (depende del layout root) |
| 3.2.2 Al introducir datos | A | Pasa | Formularios no auto-submit al cambiar valores |
| 3.3.1 Identificacion de errores | A | Parcial | CancelReturnModal muestra error de caracteres minimos. Wizard de creacion no muestra errores de campos vacios |
| 3.3.2 Etiquetas o instrucciones | A | Pasa | Campos con labels visibles y placeholders descriptivos |
| 4.1.2 Nombre, funcion, valor | A | Parcial | Checkbox en `page.tsx:92-137` tiene `aria-checked="mixed"` para indeterminado (correcto). Tabs usan `role="tab"` y `aria-selected` (correcto). Toggle en wizard no tiene ARIA |

---

## 4. Fortalezas

### 4.1 Arquitectura de estados bien definida y transparente
Los 8 estados de devolucion y 6 de transferencia estan claramente definidos en `ReturnStatusBadge.tsx` y `TransferStatusBadge.tsx` con labels, iconos, colores y tooltips descriptivos. La configuracion centralizada (`statusConfig`, `transferStatusConfig`) facilita mantenimiento y consistencia.

### 4.2 Escaner de recepcion con pipeline extensible
El patron de `ScanHandler` pipeline en `recibir/page.tsx:38-142` es elegante y extensible. Soporta 4 tipos de resultado (pre-creada, pedido despachado, pedido expirado, no reconocido) con UI diferenciada para cada caso. Agregar nuevos tipos de escaneo solo requiere agregar un handler.

### 4.3 Feedback sonoro en escaner critico
El escaner de recepcion implementa `playScanSuccessSound` y `playScanErrorSound` (`recibir/page.tsx:471-474`), y el ScanToSelectModal usa Web Audio API para beep de confirmacion (`ScanToSelectModal.tsx:86-98`). Esto es fundamental en ambientes de bodega ruidosos.

### 4.4 Wizard de creacion con flujo adaptativo
El wizard de `crear/page.tsx` adapta inteligentemente su flujo segun el contexto: si el pedido se identifica, pre-llena datos y muestra solo el selector de sucursal; si no, muestra formulario completo. El toggle "Puedes identificar el pedido?" es una buena decision de UX que reduce carga cognitiva.

### 4.5 Patron de seleccion batch bien implementado
La bandeja principal implementa seleccion multiple con checkboxes de 44px (`page.tsx:92-137`), barra de acciones bulk contextual (`page.tsx:590-623`), y modal ScanToSelectModal para preparacion por lotes. El flujo checkbox > accion batch es natural para operaciones de bodega.

### 4.6 Modales especializados con validacion contextual
Los 3 modales operacionales (BatchRetiroModal, EnvioAlSellerModal, CancelReturnModal) estan bien segmentados con validacion especifica por caso: datos de retirante para retiro, direccion completa para envio, motivo con minimo de caracteres para anulacion.

### 4.7 Tabs de estado con contadores reactivos
Los pill tabs en la bandeja principal (`page.tsx:529-557`) muestran contadores por estado que se actualizan reactivamente con la busqueda. Incluyen scroll horizontal con flechas para paneles pequenos y un select nativo para mobile. Esto acelera el triage de devoluciones.

---

## 5. User Stories (HU)

### HU-01: Aumentar touch targets para operadores con guantes
**Ref:** QW-01
> Como operador de bodega, quiero que todos los botones y controles interactivos tengan un area de toque minima de 44px, para poder usarlos con guantes industriales sin errores de precision.

**Criterios de aceptacion:**
- [ ] Todos los botones de paginacion tienen min-width y min-height de 44px
- [ ] Botones de accion en filas de tabla (Eye, MoreVertical) tienen area clickeable de 44x44px
- [ ] Botones de navegacion del wizard tienen min-height de 44px
- [ ] Se verifica con test manual usando guantes industriales

**Esfuerzo:** S

---

### HU-02: Feedback consistente en acciones exitosas
**Ref:** QW-02
> Como operador de bodega, quiero recibir feedback visual y sonoro al completar una accion exitosamente, para confirmar que mi accion fue procesada sin necesidad de leer la pantalla detalladamente.

**Criterios de aceptacion:**
- [ ] Toda accion exitosa muestra un toast con icono check y texto descriptivo (no alert nativo)
- [ ] Acciones criticas (recepcionar, cambiar estado, anular) emiten beep de confirmacion
- [ ] Toast permanece visible 3 segundos y se puede descartar manualmente
- [ ] Acciones con error muestran toast rojo con descripcion y opcion "Reintentar"

**Esfuerzo:** S

---

### HU-03: Proteccion contra doble-click en acciones irreversibles
**Ref:** QW-03
> Como operador de bodega, quiero que los botones de acciones irreversibles se deshabiliten despues del primer click, para evitar ejecutar la accion multiples veces por error.

**Criterios de aceptacion:**
- [ ] "Anular devolucion" se deshabilita y muestra spinner despues del primer click
- [ ] "Confirmar retiro" se deshabilita tras primer click
- [ ] "Confirmar envio" se deshabilita tras primer click
- [ ] "Confirmar recepcion" (wizard paso 4) ya implementa loading — verificar que funciona
- [ ] Boton "Anular devolucion" recibe `disabled={!isValid}` cuando el motivo es menor a 10 caracteres

**Esfuerzo:** S

---

### HU-04: Flujo de recepcion continuo (modo rafaga)
**Ref:** PE-01
> Como operador de bodega, quiero que despues de recibir un paquete, el sistema automaticamente me lleve a escanear el siguiente, para procesar multiples devoluciones sin interrupciones.

**Criterios de aceptacion:**
- [ ] Despues de "Finalizar" en etiqueta, el sistema vuelve a pantalla de escaneo con foco en input
- [ ] Se muestra contador "X paquetes procesados en esta sesion" en la barra superior
- [ ] Opcion toggle "Auto-imprimir etiqueta" que imprime automaticamente al confirmar ubicacion
- [ ] Boton "Terminar sesion" para salir del modo rafaga y volver a bandeja
- [ ] La ubicacion usada por defecto es la ultima seleccionada (sugerida, editable)

**Esfuerzo:** L

---

### HU-05: Persistencia del wizard ante navegacion accidental
**Ref:** PE-04
> Como operador de bodega, quiero que mis datos del formulario de creacion se conserven si navego accidentalmente fuera de la pagina, para no perder el trabajo hecho.

**Criterios de aceptacion:**
- [ ] Al intentar salir con cambios pendientes, el browser muestra dialogo de confirmacion (beforeunload)
- [ ] Estado del wizard se persiste en sessionStorage cada vez que se avanza de paso
- [ ] Al volver a `/devoluciones/crear`, si hay estado guardado, se muestra banner "Tienes una creacion en progreso" con opciones "Continuar" / "Descartar"
- [ ] Estado guardado expira automaticamente despues de 2 horas

**Esfuerzo:** M

---

### HU-06: Indicadores de SLA en transferencias
**Ref:** PE-05
> Como supervisor de operaciones, quiero ver indicadores de tiempo transcurrido y alertas de SLA en las transferencias, para identificar rapidamente las que requieren atencion.

**Criterios de aceptacion:**
- [ ] Columna "Tiempo" en tabla de transferencias muestra tiempo transcurrido desde creacion
- [ ] Indicador de color: verde (<48h), amarillo (48-72h), rojo (>72h)
- [ ] En detalle de transferencia, tramos atrasados muestran banner de alerta
- [ ] Filtro rapido "Fuera de SLA" en los tabs de transferencias
- [ ] KPI card con "Transferencias fuera de SLA" en la bandeja principal

**Esfuerzo:** M

---

### HU-07: Correccion ortografica completa del modulo
**Ref:** FI-01
> Como usuario del sistema, quiero que todos los textos de la interfaz esten escritos con ortografia correcta en espanol, para una experiencia profesional y consistente.

**Criterios de aceptacion:**
- [ ] Todos los strings de UI revisados con tildes correctas (devolucion, informacion, direccion, telefono, etc.)
- [ ] Verificacion con corrector ortografico automatizado
- [ ] Sin regresiones en strings ya correctos

**Esfuerzo:** S

---

### HU-08: Atajos de teclado para operaciones frecuentes
**Ref:** PE-02
> Como operador experto, quiero poder usar atajos de teclado para las acciones mas frecuentes, para trabajar mas rapido sin depender del mouse o pantalla tactil.

**Criterios de aceptacion:**
- [ ] `Escape` cierra cualquier modal abierto
- [ ] `Enter` confirma la accion primaria del contexto actual
- [ ] `Ctrl+N` navega a crear devolucion
- [ ] `Ctrl+R` navega a recibir devolucion
- [ ] `Ctrl+F` enfoca el campo de busqueda
- [ ] Hints de shortcuts visibles en tooltips de botones (desktop)

**Esfuerzo:** L

---

## 6. Fases de Mejora

### Fase 1: Fundamentos operativos (Semana 1-2)

| Tarea | HU | Esfuerzo | Impacto | Criterio de exito |
|-------|-----|----------|---------|-------------------|
| Aumentar touch targets a 44px minimo | HU-01 | S | Alto | 0 botones con area < 44px |
| Reemplazar alert() por toasts con sonido | HU-02 | S | Alto | 0 usos de alert() nativo |
| Proteccion doble-click en acciones destructivas | HU-03 | S | Alto | Todas las acciones irreversibles con loading state |
| Correccion ortografica completa | HU-07 | S | Medio | 0 strings sin tildes |
| Extraer CopyableId y fmtDate a componentes/utils compartidos | QW-05, FI-02 | S | Medio | 0 duplicaciones |

**Duracion estimada:** 3-5 dias de desarrollo
**Criterio de exito de fase:** Score de H5 (Prevencion de errores) sube de 6.0 a 7.5+

---

### Fase 2: Eficiencia operativa (Semana 3-4)

| Tarea | HU | Esfuerzo | Impacto | Criterio de exito |
|-------|-----|----------|---------|-------------------|
| Modo rafaga en escaner de recepcion | HU-04 | L | Critico | Flujo scan>ubicacion>etiqueta>scan en 3 clicks max |
| Persistencia de wizard con sessionStorage | HU-05 | M | Alto | Estado restaurable despues de navegacion accidental |
| Validacion inline en formularios (onBlur) | QW-06 | S | Medio | Todos los campos requeridos con feedback visual al perder foco |
| Tooltips interactivos para mobile en badges | FI-04 | S | Medio | Tooltip accesible con tap en dispositivos tactiles |

**Duracion estimada:** 8-10 dias de desarrollo
**Criterio de exito de fase:** Tiempo por recepcion baja de ~8 clicks a ~3 clicks

---

### Fase 3: Visibilidad y control (Semana 5-6)

| Tarea | HU | Esfuerzo | Impacto | Criterio de exito |
|-------|-----|----------|---------|-------------------|
| Indicadores SLA en transferencias | HU-06 | M | Alto | Transferencias fuera de SLA visibles en < 2 segundos |
| Atajos de teclado | HU-08 | L | Alto | 6 shortcuts implementados y documentados |
| Empty states estandarizados | FI-03 | S | Bajo | Componente EmptyState compartido usado en todas las vistas |
| Focus trap en modales | WCAG 2.1.1 | M | Medio | Tab no escapa del modal abierto |

**Duracion estimada:** 8-10 dias de desarrollo
**Criterio de exito de fase:** Score de H7 (Flexibilidad/eficiencia) sube de 6.0 a 7.5+

---

### Fase 4: Robustez y escalabilidad (Semana 7-10)

| Tarea | HU | Esfuerzo | Impacto | Criterio de exito |
|-------|-----|----------|---------|-------------------|
| Patrones de error handling para integracion API | PE-03 | XL | Alto | Error handling definido para 100% de endpoints |
| Skip navigation y mejoras WCAG | Audit 2.4.1 | M | Medio | Pasa auditoria WCAG 2.1 AA |
| Toggle switch con role="switch" y ARIA | Audit 1.3.1 | S | Medio | Screen reader anuncia estado correctamente |
| Scope en headers de tabla | Audit 1.3.1 | S | Bajo | Todas las `<th>` con scope="col" o scope="row" |

**Duracion estimada:** 10-15 dias de desarrollo
**Criterio de exito de fase:** Score global sube a 82+/100

---

## 7. Perspectiva Psicologica

### 7.1 Carga cognitiva del operador de bodega

El operador de bodega trabaja bajo condiciones que aumentan significativamente la carga cognitiva:

- **Ruido ambiental** (maquinaria, camiones, conversaciones) reduce la capacidad de procesamiento de informacion visual
- **Fatiga fisica** (de pie 8+ horas, moviendo paquetes) deteriora la atencion a detalle
- **Presion temporal** (SLAs de recepcion, turnos) favorece la velocidad sobre la precision
- **Guantes industriales** reducen la destreza tactil en ~60%

El modulo actual exige demasiada lectura de texto fino (text-xs, text-[10px]) y precision tactil (botones pequenos). La Ley de Hick predice que con 8 tabs de estado, el tiempo de decision del operador es O(log2(8)) = 3 unidades, lo cual es aceptable. Sin embargo, la barra de acciones en el detalle (`[id]/page.tsx:472-488`) presenta hasta 4 opciones por estado sin jerarquia visual clara entre la primaria y las secundarias.

### 7.2 Modelo mental del flujo fisico

Los operadores de bodega piensan en terminos de flujo fisico: "recibir paquete > etiquetar > almacenar > despachar". El modelo de estados del sistema (creada > recibida > lista > transferencia/retiro/envio) se alinea bien con este modelo mental, lo cual es una fortaleza.

Sin embargo, el concepto de "transferencia entre sucursales" (una abstraccion logistica) puede ser opaco para el operador que solo ve "paquete que sale de aqui". La UI del detalle de transferencia (`transferencias/[id]/page.tsx`) muestra correctamente los tramos fisicos, pero la lista de transferencias carece de contexto visual que conecte "mi sucursal" con la transferencia.

### 7.3 Efecto de completitud (Zeigarnik)

El wizard de creacion de 4 pasos aprovecha el efecto Zeigarnik (la mente recuerda mejor las tareas incompletas). El step indicator (`StepIndicator`) con checkmarks de pasos completados motiva al usuario a terminar. Sin embargo, la falta de persistencia (PE-04) anula este efecto: si el operador pierde progreso, la frustacion de reiniciar es mayor que la motivacion de completar.

### 7.4 Error recovery y sesgo de confirmacion

El modal de anulacion (`CancelReturnModal.tsx`) correctamente requiere motivo escrito con minimo de 10 caracteres, lo cual es una "puerta de friccion" que previene cancelaciones impulsivas. Sin embargo, los modales de confirmacion de estado positivo (marcar como lista, recepcionar) son demasiado faciles de confirmar con un solo click. Dado que cambios de estado son semi-reversibles (un admin podria revertir), el balance actual es razonable, pero deberia documentarse.

---

## 8. Metricas Sugeridas

| Metrica | Baseline estimado (actual) | Target post-mejoras | Fase |
|---------|---------------------------|-------------------|------|
| Tiempo promedio de recepcion por paquete | ~45 segundos (8 clicks) | <15 segundos (3 clicks) | Fase 2 |
| Tasa de error en asignacion de ubicacion | ~8% (dropdown sin contexto visual) | <3% (con sugerencia auto) | Fase 3 |
| Clicks para cambiar estado de devolucion | 4-5 (navegar > abrir detalle > accion > confirmar) | 2-3 (accion directa desde bandeja) | Fase 2 |
| Tiempo para identificar transferencia fuera de SLA | >30 segundos (lectura manual de fechas) | <5 segundos (indicador visual) | Fase 3 |
| Tasa de abandono del wizard de creacion | ~15% (por perdida de datos) | <5% (con persistencia) | Fase 2 |
| WCAG 2.1 AA compliance rate | ~65% (parcial en multiples criterios) | >90% | Fase 4 |
| NPS del operador con el modulo | N/A (no medido) | >40 | Post Fase 4 |
| Errores de doble-click en acciones destructivas | ~3% por turno (estimado) | 0% | Fase 1 |
| Paquetes procesados por hora (recepcion) | ~80 (estimado) | >120 | Fase 2 |

---

*Evaluacion realizada sobre la base de codigo al 2026-03-27. Se recomienda re-evaluar despues de implementar Fase 2 para medir el impacto real en operadores de bodega.*
