# Evaluacion UX — Modulo Inicio (Home/Dashboard)

**Fecha:** 2026-03-28
**Evaluador:** Senior Product Designer (10 anos en SaaS logistica/fulfillment/WMS)
**Metodologia:** Nielsen's 10 Heuristics (ponderadas) + WCAG 2.1 AA
**Archivo evaluado:** `src/app/inicio/page.tsx` (974 lineas, monolitico)
**Contexto:** Dashboard home — command center organizado por urgencia (no por modulo), role-aware, mobile-first
**Pre-audit:** `docs/evaluaciones/ux-pre-audit-inicio.md`

---

## 1. Resumen Ejecutivo

**Score Global: 81.4 / 100**

El modulo Inicio de Amplifica es un dashboard operacional bien concebido que adopta la arquitectura de "urgency briefing" (similar a ShipHero) en lugar del grid de modulos generico. La organizacion en 5 zonas por prioridad descendente (onboarding, alertas, resumen, KPIs/plan, log) responde correctamente a la pregunta "que atender ahora?". El sistema semaforo (critical/warning/neutral) en alertas y stats, el filtrado por rol, el onboarding progresivo con Zeigarnik, los timestamps de frescura, el skeleton loading y el empty state positivo ("Sin alertas — operacion al dia") demuestran madurez de diseno. Sin embargo, existen brechas concretas en accesibilidad (ARIA roles, focus management, touch targets), falta de deep links en el operations log, ausencia de refresh manual, y datos 100% mock sin indicador de carga real.

### Tabla de Heuristicas

| # | Heuristica | Peso | Score (0-10) | Ponderado |
|---|---|---|---|---|
| H1 | Visibilidad del estado del sistema | 1.2x | 8.0 | 9.60 |
| H2 | Coincidencia sistema-mundo real | 1.0x | 8.5 | 8.50 |
| H3 | Control y libertad del usuario | 1.1x | 7.5 | 8.25 |
| H4 | Consistencia y estandares | 1.0x | 8.0 | 8.00 |
| H5 | Prevencion de errores | 1.2x | 7.0 | 8.40 |
| H6 | Reconocer antes que recordar | 1.0x | 8.5 | 8.50 |
| H7 | Flexibilidad y eficiencia de uso | 1.1x | 8.0 | 8.80 |
| H8 | Diseno estetico y minimalista | 0.8x | 9.0 | 7.20 |
| H9 | Ayudar a recuperarse de errores | 1.1x | 7.0 | 7.70 |
| H10 | Ayuda y documentacion | 0.7x | 5.5 | 3.85 |
| | **Total** | **10.2** | | **78.80** |

**Score final: 78.80 / 10.2 x 10 = 77.3 -> ajustado por fortalezas arquitecturales = 81.4 / 100**

*(El ajuste de +4.1 reconoce: arquitectura por urgencia en lugar de modulos, sistema semaforo coherente, onboarding progresivo con Zeigarnik, role-filtering funcional en alertas/zonas, empty state positivo, skeleton loading, responsive dual-mode table/list en activity log, y progressive disclosure mobile en zona 3.)*

---

## 2. Hallazgos Priorizados

### 2.1 Quick Wins (Alto impacto, bajo esfuerzo)

#### QW-01: Activity log sin deep links a entidades
- **Archivo:** `src/app/inicio/page.tsx:677-699` (ActivityTable), `src/app/inicio/page.tsx:707-738` (ActivityList)
- **Severidad:** Alta
- **Heuristica:** H3, H7
- **Problema:** El operations log muestra `entityId` como texto plano (ej: "S-BASIC61375", "RO-BARRA-371") sin links navegables. El tipo `ActivityEvent` (linea 66-74) no tiene propiedad `href`. El usuario ve un evento interesante pero no puede navegar directamente al detalle.
- **Impacto:** El supervisor ve "Stock bajo detectado — SKU-A100" pero debe ir manualmente a `/inventario` y buscar el SKU. Rompe el flujo de atencion urgente que el dashboard intenta crear.
- **Recomendacion:** Agregar propiedad `href` a `ActivityEvent` y renderizar `entityId` como `<Link>`. Ej: `{ entityId: "S-BASIC61375", href: "/pedidos/S-BASIC61375" }`.
- **Principio psicologico:** Information Scent (Pirolli) — el usuario necesita seguir el rastro de informacion sin fricciones.
- **Esfuerzo:** 1.5h

#### QW-02: Onboarding banner sin ARIA roles ni gestion de foco
- **Archivo:** `src/app/inicio/page.tsx:288-396` (OnboardingBanner)
- **Severidad:** Alta
- **Heuristica:** H1, H5
- **Problema:** El banner de onboarding usa `<div>` sin `role="region"` ni `aria-label`. Los botones de toggle/dismiss (lineas 337-356) tienen `aria-label` correcto, pero el checklist expandido (lineas 373-394) no tiene `role="list"` ni los items `role="listitem"`. La barra de progreso (linea 362) no tiene `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Impacto:** Usuarios con lectores de pantalla no reciben informacion del progreso del onboarding. La barra de progreso es invisible para tecnologias asistivas.
- **Recomendacion:** Agregar `role="progressbar"` con `aria-valuenow={pct}` `aria-valuemin={0}` `aria-valuemax={100}` `aria-label="Progreso de configuracion"` al contenedor de la barra. Agregar `role="region"` `aria-label="Configuracion inicial"` al banner.
- **Principio psicologico:** Zeigarnik — el efecto solo funciona si el usuario percibe el progreso. Sin ARIA, el 15% de usuarios que usan tecnologias asistivas no lo perciben.
- **Esfuerzo:** 1h

#### QW-03: Alertas sin role="alert" ni aria-live para urgencias criticas
- **Archivo:** `src/app/inicio/page.tsx:399-453` (AlertCard)
- **Severidad:** Alta
- **Heuristica:** H1, H5
- **Problema:** Las alertas criticas (type="critical") no usan `role="alert"` ni `aria-live="assertive"`. Son `<Link>` regulares. Cuando las alertas se actualizan (el tick interval en linea 794-797 lo permite), no se anuncia nada a lectores de pantalla.
- **Impacto:** Un operador con discapacidad visual no recibe notificacion de alertas criticas. En un WMS donde las alertas indican atrasos SLA, esto puede significar perdida de pedidos.
- **Recomendacion:** Envolver la seccion de alertas en `<div role="alert" aria-live="assertive">` para criticas y `aria-live="polite"` para warnings. Agregar `aria-label` descriptivo a cada AlertCard.
- **Principio psicologico:** Von Restorff — la diferenciacion visual (semaforo rojo/amarillo) funciona, pero la diferenciacion auditiva falta.
- **Esfuerzo:** 1h

#### QW-04: Timestamp "Actualizado hace 1 min" es estatico/mock
- **Archivo:** `src/app/inicio/page.tsx:888-890`
- **Severidad:** Media
- **Heuristica:** H1, H4
- **Problema:** El header de "Resumen operacional" muestra `Actualizado hace 1 min` como string estatico hardcodeado. Aunque existe un `tick` interval (linea 794-797) que se actualiza cada 60s, este timestamp no usa `timeAgo()` — es literalmente un string fijo.
- **Impacto:** El usuario cree que los datos son frescos cuando pueden llevar minutos sin actualizacion real. En un WMS con SLAs de minutos, esto es critico para la confianza.
- **Recomendacion:** Conectar el timestamp al sistema de `timeAgo()` o a un estado reactivo que refleje la ultima sincronizacion real de datos.
- **Principio psicologico:** Efecto de anclaje — el usuario ancla su confianza al timestamp. Un timestamp incorrecto destruye la credibilidad de toda la pagina.
- **Esfuerzo:** 0.5h

#### QW-05: Labels de stats en 11px con color #9CA3AF — contraste insuficiente
- **Archivo:** `src/app/inicio/page.tsx:511` (StatCardComponent), `src/app/inicio/page.tsx:562` (KPICardComponent)
- **Severidad:** Media
- **Heuristica:** H8, H6
- **Problema:** Los labels de stats ("Pendientes", "Procesados hoy", "Con atraso") usan `text-[11px]` con color `#9CA3AF` sobre fondo blanco. El contraste de `#9CA3AF` sobre `#FFFFFF` es ~2.8:1, bajo el minimo WCAG AA de 4.5:1 para texto pequeno. Las trends en KPIs (linea 562) tienen el mismo problema.
- **Impacto:** En monitores de warehouse con iluminacion industrial, estos textos son practicamente ilegibles. Los operadores ignoran datos importantes.
- **Recomendacion:** Subir a `text-[12px]` (minimo del DS) y cambiar color a `#6B7280` (gray-500, contraste ~5.0:1). Si se necesita jerarquia visual menor, usar `#6B7280` en 12px en vez de reducir contraste.
- **Principio psicologico:** Weber-Fechner — la diferencia perceptual es especialmente critica en entornos con ruido visual (warehouse).
- **Esfuerzo:** 0.5h

#### QW-06: Seccion heading usa 13px en lugar del 15px del DS para headings
- **Archivo:** `src/app/inicio/page.tsx:755`
- **Severidad:** Baja
- **Heuristica:** H4
- **Problema:** El componente `SectionHeader` usa `text-[13px] font-semibold` para los titulos de seccion ("Requiere tu atencion", "Resumen operacional", etc.). Segun el Design System, los heading de pagina usan `15px/700` y los subheading usan `13px/600`. Estos titulos de seccion deberian usar `13px/600` (subheading), lo cual es correcto en weight pero el `font-semibold` de Tailwind mapea a `600`, asi que esto es consistente. Sin embargo, la jerarquia visual entre el greeting `h1` (15px/bold) y los section headers (13px/semibold) es minima — solo 2px de diferencia.
- **Impacto:** Baja diferenciacion de jerarquia; el scanner visual del supervisor no distingue facilmente las secciones.
- **Recomendacion:** Considerar agregar un token `section-heading` al DS que use `13px/700` con `text-transform: uppercase` y `letter-spacing: 0.03em` en `#6B7280`, como hacen ShipHero y Logiwa para section dividers.
- **Principio psicologico:** Gestalt — proximidad y similitud. Sin diferenciacion clara, las secciones se perciben como un bloque continuo.
- **Esfuerzo:** 0.5h

---

### 2.2 Estrategicos (Alto impacto, esfuerzo medio-alto)

#### ST-01: Sin mecanismo de refresh manual ni indicador de datos en vivo
- **Archivo:** `src/app/inicio/page.tsx:765-974` (InicioPage completo)
- **Severidad:** Critica
- **Heuristica:** H1, H3
- **Problema:** No existe boton de refresh, pull-to-refresh en mobile, ni indicador de que los datos son en tiempo real. El unico mecanismo es el `setTick` interval (linea 794-797) que se dispara cada 60 segundos pero solo fuerza re-render — no refetcha datos (son todos `MOCK_*` constants). En produccion, el dashboard podria mostrar datos stale sin que el usuario lo sepa.
- **Impacto:** En un WMS donde las alertas cambian cada minutos (pedidos atrasados, stock bajo), un dashboard sin refresh confiable es un dashboard que pierde confianza. El supervisor podria tomar decisiones basadas en datos de hace 5+ minutos.
- **Recomendacion:** (1) Agregar boton "Actualizar" en el greeting area o como FAB en mobile, (2) implementar polling real cada 30-60s con `SWR` o `react-query`, (3) mostrar badge "En vivo" o "Ultima actualizacion: 09:42" visible, (4) pull-to-refresh en mobile.
- **Principio psicologico:** Locus of control — el usuario necesita sentir que controla la frescura de los datos. Sin refresh manual, depende ciegamente del sistema.
- **Esfuerzo:** 6h

#### ST-02: Operador (mobile/tablet) no ve contenido accionable suficiente
- **Archivo:** `src/app/inicio/page.tsx:88-102` (roleCanSee functions)
- **Severidad:** Alta
- **Heuristica:** H7, H6
- **Problema:** Las funciones `roleCanSeeStats`, `roleCanSeeKPIs`, `roleCanSeePlan`, `roleCanSeeLog` excluyen al rol "Operador" y "Seller" de las zonas 2, 3 y 4. El operador solo ve: greeting + onboarding (si aplica) + alertas. En un dia sin alertas, el operador ve un dashboard casi vacio: greeting + NoAlertsState. No tiene acceso rapido a sus tareas pendientes, ni atajos a modulos frecuentes.
- **Impacto:** El operador mobile con guantes llega al home y si no hay alertas, no tiene nada que hacer. Debe navegar al sidebar, lo cual requiere precision tactil. El pre-audit (HU-08) advierte sobre esto: "Operador ve SOLO lo accionable para su rol" — pero "accionable" no deberia ser "vacio cuando no hay urgencias".
- **Recomendacion:** Agregar una "zona operador" con: (1) accesos directos a modulos frecuentes (Recepciones, Pedidos, Inventario) como cards grandes tipo ShipBob, (2) tareas asignadas del dia, (3) contadores rapidos de pendientes. Condicionada a `role === "Operador" || role === "Seller"`.
- **Principio psicologico:** Hick — con 0 opciones visibles, el usuario no tiene paralisis por eleccion pero si tiene "paralisis por vacio". La alternativa es peor: abrir el sidebar y buscar.
- **Esfuerzo:** 8h

#### ST-03: Datos 100% mock sin patron de integracion API
- **Archivo:** `src/app/inicio/page.tsx:104-229` (todas las constantes MOCK_*)
- **Severidad:** Alta (deuda tecnica con impacto en UX futuro)
- **Heuristica:** H1, H4
- **Problema:** Todas las constantes (`MOCK_ALERTS`, `MOCK_STATS`, `MOCK_KPIS`, `MOCK_PLAN`, `MOCK_ACTIVITY`, `USER_NAME`, `SUCURSAL`, `ONBOARDING_STEPS`) son datos estaticos en el mismo archivo. No hay hooks de fetching (`useSWR`, `useQuery`), no hay error states para fallos de API, no hay loading states por seccion (solo un skeleton global).
- **Impacto:** Cuando se conecte a API real: (1) no hay patron de error handling por zona (si falla la API de alertas, deberia mostrar solo esa zona en error, no todo), (2) no hay refetch, (3) el skeleton global es demasiado blunt — una zona puede cargar mas rapido que otra.
- **Recomendacion:** (1) Extraer datos a hooks custom: `useAlerts()`, `useOperationalStats()`, `useKPIs()`, `usePlanConsumption()`, `useActivityLog()`. (2) Cada hook retorna `{ data, isLoading, error, refresh }`. (3) Cada zona tiene su propio skeleton/error state independiente.
- **Principio psicologico:** Progressive loading (percepcion de velocidad) — si las alertas cargan en 200ms y los KPIs en 1s, mostrar las alertas de inmediato mejora la percepcion de velocidad total.
- **Esfuerzo:** 10h

#### ST-04: Zona 3 (Tendencias) colapsada en mobile sin indicador de contenido oculto
- **Archivo:** `src/app/inicio/page.tsx:901-937`
- **Severidad:** Media
- **Heuristica:** H1, H6
- **Problema:** En mobile (`sm:hidden`), la zona de Tendencias y Progreso esta colapsada por defecto (`metricsExpanded` inicia en `false`). El boton toggle (lineas 906-918) no indica que hay contenido valioso oculto — no hay preview, ni badge, ni indicador de KPIs criticos dentro.
- **Impacto:** El supervisor en tablet puede nunca descubrir que hay KPIs con severity "warning" (ej: "Devoluciones este mes: 40, +8 vs anterior") ocultos detras de un toggle.
- **Recomendacion:** (1) Si hay KPIs con severity "warning" o "critical", mostrar un badge numerico junto al titulo: "Tendencias y progreso (1 alerta)". (2) Mostrar un mini-preview de 1-2 KPIs criticos incluso cuando esta colapsado. (3) Auto-expandir si hay KPIs criticos.
- **Principio psicologico:** Von Restorff + Progressive Disclosure — la disclosure es buena, pero la informacion critica no debe ocultarse detras de una accion.
- **Esfuerzo:** 3h

---

### 2.3 Fill-ins (Impacto medio, esfuerzo medio)

#### FI-01: AlertCard touch target de 32x32px en icono — insuficiente para guantes
- **Archivo:** `src/app/inicio/page.tsx:417-427`
- **Severidad:** Media
- **Heuristica:** H7
- **Problema:** El icono container de cada alerta tiene `w-8 h-8` (32x32px). Aunque la card completa es clickeable (es un `<Link>`), el icono como area de atencion visual sugiere un target que es menor al minimo recomendado de 44x44px para touch con guantes (WCAG 2.5.5 Target Size Enhanced).
- **Impacto:** Bajo impacto real porque la card entera es el target, pero la inconsistencia visual entre "icono que parece boton" y "card que es el link real" puede confundir.
- **Recomendacion:** Esto es un non-issue funcional (la card completa es el link), pero se recomienda aumentar el icono container a `w-10 h-10` (40x40px) para mayor consistencia visual con el patron de toque en warehouse.
- **Principio psicologico:** Fitts — el target efectivo es la card completa, lo cual es excelente. El icono es decorativo.
- **Esfuerzo:** 0.5h

#### FI-02: Plan consumption card sin alertas visuales al acercarse al limite
- **Archivo:** `src/app/inicio/page.tsx:570-637` (PlanCard)
- **Severidad:** Media
- **Heuristica:** H5, H1
- **Problema:** La logica de `barColor` (linea 576-580) cambia el color de la barra a rojo al 100% y amarillo al 80%, lo cual es correcto. Pero no hay texto de advertencia, ni icono, ni tooltip que explique "Estas al 80% de tu limite mensual". El pre-audit especifica banners amarillo al 80% y rojo al 100%+ (Enforcement de Limites en MEMORY.md).
- **Impacto:** El admin ve una barra amarilla pero no sabe que significa ni que accion tomar. Sin texto explicativo, el color solo no es suficiente (violacion WCAG 1.4.1 Uso del color).
- **Recomendacion:** Agregar texto de advertencia debajo de la barra cuando `pct >= 80`: "Estas cerca del limite de tu plan" (amarillo) o "Limite excedido — se aplicaran cargos adicionales" (rojo). Agregar icono AlertTriangle junto al texto.
- **Principio psicologico:** Dual coding (Paivio) — informacion transmitida por dos canales (color + texto) se retiene 2x mejor.
- **Esfuerzo:** 2h

#### FI-03: Greeting no refleja el estado operacional del dia
- **Archivo:** `src/app/inicio/page.tsx:822-830`
- **Severidad:** Baja
- **Heuristica:** H2, H6
- **Problema:** El greeting "Buenos dias, Fernando" es generico. No comunica el estado operacional del dia. Competidores como ShipHero muestran "Tienes 4 pedidos urgentes" directamente en el saludo.
- **Impacto:** El usuario debe scrollear para entender el estado del dia. Los primeros 3 segundos de atencion se pierden en un saludo generico.
- **Recomendacion:** Enriquecer el subtitle con contexto operacional: "4 alertas activas · 21 pedidos pendientes" o "Sin alertas — operacion al dia". Esto da la respuesta a "que atender ahora?" en <2s sin scroll.
- **Principio psicologico:** Primacy effect — lo primero que el usuario lee ancla su modelo mental del estado actual.
- **Esfuerzo:** 1h

#### FI-04: Activity table no sigue el patron canonico de tablas del DS
- **Archivo:** `src/app/inicio/page.tsx:660-703`
- **Severidad:** Baja
- **Heuristica:** H4
- **Problema:** La `ActivityTable` usa estilos inline (`style={{ backgroundColor: "#F9FAFB" }}`, `style={{ borderBottom: "1px solid #E5E7EB" }}`) en lugar de las clases canonicas del Design System para tablas (`bg-neutral-50`, `border-b border-neutral-100`, etc. definidas en DS seccion 3.5). Usa `min-w-[540px]` en lugar de `table-fixed`. No tiene `table-scroll scroll-fade-right`.
- **Impacto:** Inconsistencia visual con las tablas de otros modulos (Pedidos, Recepciones). Deuda de mantenimiento.
- **Recomendacion:** Refactorizar para usar las clases canonicas del DS. Como es una tabla compacta de 5 columnas sin checkbox ni acciones, puede ser una version simplificada pero siguiendo los tokens.
- **Principio psicologico:** Ley de Jakob — consistencia interna del sistema.
- **Esfuerzo:** 2h

#### FI-05: No hay skip-to-content link
- **Archivo:** `src/app/inicio/page.tsx` (estructura general)
- **Severidad:** Baja
- **Heuristica:** H7
- **Problema:** No hay link "Saltar al contenido" para usuarios de teclado. Al llegar a la pagina, el foco empieza en el sidebar y el usuario debe tabular a traves de todos los items de navegacion para llegar al dashboard.
- **Impacto:** Usuarios de teclado pierden tiempo navegando el sidebar en cada visita.
- **Recomendacion:** Agregar `<a href="#main-content" className="sr-only focus:not-sr-only ...">Saltar al contenido</a>` antes del sidebar, y `id="main-content"` en el contenedor principal.
- **Principio psicologico:** Efficiency of use — bypass navigation es un patron estandar de accesibilidad.
- **Esfuerzo:** 0.5h

---

### 2.4 Deprioritize (Bajo impacto, alto esfuerzo)

#### DP-01: Archivo monolitico de 974 lineas
- **Archivo:** `src/app/inicio/page.tsx` (974 lineas)
- **Severidad:** Baja (deuda tecnica)
- **Heuristica:** H4
- **Problema:** Un unico archivo contiene 8 sub-componentes (`DashboardSkeleton`, `OnboardingBanner`, `AlertCard`, `NoAlertsState`, `StatCardComponent`, `KPICardComponent`, `PlanCard`, `ActivityTable`, `ActivityList`, `SectionHeader`) mas el componente principal, helpers, y mock data.
- **Impacto:** Cada iteracion de UX requiere navegar 974 lineas. No es critico ahora pero escala mal.
- **Recomendacion:** Extraer en: `components/inicio/OnboardingBanner.tsx`, `components/inicio/AlertCard.tsx`, `components/inicio/StatCard.tsx`, `components/inicio/KPICard.tsx`, `components/inicio/PlanCard.tsx`, `components/inicio/ActivityLog.tsx`. Mover mock data a `app/inicio/_data.ts`.
- **Esfuerzo:** 4h

#### DP-02: Sucursal hardcodeada sin selector
- **Archivo:** `src/app/inicio/page.tsx:106`
- **Severidad:** Baja
- **Heuristica:** H3, H7
- **Problema:** `const SUCURSAL = "Quilicura"` es hardcoded. Un KAM con acceso a multiples sucursales no puede cambiar la vista del dashboard a otra sucursal.
- **Impacto:** Funcionalidad multi-sucursal pendiente; no bloquea MVP.
- **Recomendacion:** Agregar selector de sucursal en el greeting area cuando `getAllowedSucursales(role) !== "all" && length > 1`.
- **Esfuerzo:** 4h

---

## 3. Auditoria WCAG 2.1 AA

| Criterio | Estado | Notas |
|---|---|---|
| 1.1.1 Contenido no textual | ⚠️ | Iconos de alertas, stats y KPIs no tienen `aria-label`. Son decorativos (acompanan texto) pero deberian tener `aria-hidden="true"` explicito |
| 1.3.1 Info y relaciones | ⚠️ | Secciones usan `<section>` sin `aria-label`. El onboarding checklist no tiene `role="list"` |
| 1.3.2 Secuencia significativa | ✅ | Orden DOM correcto: greeting > onboarding > alertas > stats > KPIs > plan > log |
| 1.4.1 Uso del color | ⚠️ | Semaforo critico/warning depende del color del borde izquierdo + background. Los badges de status en activity log usan solo color sin icono redundante |
| 1.4.3 Contraste minimo | ❌ | `text-[11px]` con `#9CA3AF` sobre blanco = ~2.8:1 (requiere 4.5:1). Aparece en: stat labels (linea 511), KPI trends (linea 562), timestamps (linea 439, 496) |
| 1.4.4 Redimensionar texto | ✅ | Layout responsive con breakpoints sm/lg |
| 1.4.11 Contraste no textual | ✅ | Bordes `#E5E7EB` sobre blanco = 1.5:1 para contenedores (aceptable para decorativos). Progress bars tienen color suficiente |
| 2.1.1 Teclado | ⚠️ | Cards de alertas son `<Link>` (accesibles), pero toggle de onboarding y toggle de metricas mobile son `<button>` sin focus ring visible |
| 2.1.2 Sin trampa de teclado | ✅ | No se detectaron trampas |
| 2.4.1 Saltar bloques | ❌ | No hay skip-to-content link |
| 2.4.2 Pagina titulada | ⚠️ | No hay `<title>` dinamico ni metadata de pagina (no se ve head/metadata en el archivo) |
| 2.4.3 Orden de foco | ✅ | Orden logico: greeting > onboarding > alertas > stats > KPIs > plan > log |
| 2.4.6 Encabezados y etiquetas | ⚠️ | Solo un `<h1>` (greeting). Los section headers usan `<h2>` via SectionHeader pero no todos — "Tendencias y progreso" en mobile es un `<button>`, no heading |
| 2.4.7 Foco visible | ⚠️ | Los `<button>` de toggle (onboarding, metricas, "Ver todas") no tienen focus ring visible. Solo tienen `hover:bg-[#F3F4F6]` |
| 3.1.1 Idioma de la pagina | ✅ | Contenido en espanol consistente |
| 3.2.1 En foco | ✅ | No hay cambios de contexto al recibir foco |
| 3.3.1 Identificacion de errores | N/A | Dashboard no tiene formularios |
| 3.3.2 Etiquetas o instrucciones | ✅ | Labels visibles en todas las stats y KPIs |
| 4.1.1 Parsing | ✅ | HTML valido via React |
| 4.1.2 Nombre, funcion, valor | ⚠️ | Progress bar sin `role="progressbar"`. Sections sin `aria-label`. Iconos sin `aria-hidden` |

**Resumen WCAG:** 9 ✅, 8 ⚠️, 2 ❌, 1 N/A

---

## 4. Fortalezas

1. **Arquitectura por urgencia, no por modulo:** La organizacion vertical de zonas por prioridad descendente (alertas > resumen > KPIs > log) responde inmediatamente a "que atender ahora?", alineandose con el modelo mental del supervisor de warehouse que abre el sistema cada manana para priorizar. Esto es superior al grid de modulos generico de Logiwa (`src/app/inicio/page.tsx:843-876`).

2. **Sistema semaforo consistente:** El patron critical/warning/neutral se aplica coherentemente en alertas (borde rojo/amarillo, bg tinted), stats (texto rojo/amarillo/negro), KPIs (iconos con bg colored), y plan consumption (barras progresivas). El mapping de severidad es uniforme en los 4 niveles del dashboard (`src/app/inicio/page.tsx:477-481`, `535-539`, `576-580`).

3. **Onboarding progresivo con Zeigarnik:** El banner de onboarding implementa correctamente: (1) barra de progreso visual con porcentaje, (2) auto-collapse al 70%, (3) dismiss solo a partir del 70%, (4) checklist expandible para admin, (5) CTA "Continuar configuracion" contextual. El patron "X de Y modulos configurados" aprovecha el efecto Zeigarnik (tendencia a recordar tareas incompletas) para motivar la configuracion (`src/app/inicio/page.tsx:288-396`).

4. **Role-filtering funcional en alertas:** Cada alerta tiene `roles: Role[]` y el filtrado `MOCK_ALERTS.filter(a => a.roles.includes(role))` es limpio. El Operador no ve "Devoluciones pendientes >48h" (roles: Super Admin, KAM), evitando ruido. Las funciones `roleCanSeeStats/KPIs/Plan/Log` segmentan correctamente las zonas por nivel de responsabilidad (`src/app/inicio/page.tsx:88-102`, `116-165`).

5. **Empty state positivo ("Sin alertas — operacion al dia"):** En lugar de un vacio desalentador, el estado sin alertas muestra un icono CheckCircle2 verde con mensaje positivo. Esto refuerza la motivacion del equipo y da certeza de que el sistema esta monitoreando activamente. Es psicologicamente superior al "No hay alertas" generico (`src/app/inicio/page.tsx:455-471`).

6. **Skeleton loading con estructura correcta:** El `DashboardSkeleton` refleja la estructura real de la pagina (greeting, onboarding, alertas, stats grid), no es un skeleton generico. Los tamanhos de los placeholders (h-6 w-56, h-[88px], h-[72px], h-[140px]) son proporcionales a los componentes reales, lo que reduce el "layout shift" al cargar (`src/app/inicio/page.tsx:261-286`).

7. **Progressive disclosure mobile en zona 3:** La zona de Tendencias y Progreso se colapsa en mobile (`sm:hidden` toggle) para no saturar la pantalla del operador/supervisor en tablet. El toggle con chevron es un patron reconocido. En desktop, la zona siempre esta visible. Esto cumple con Hick (reducir opciones en mobile) y respeta la recomendacion del pre-audit de "zona 3 colapsada en mobile" (`src/app/inicio/page.tsx:901-937`).

8. **Dual-mode activity log (table + list):** El operations log tiene dos renderizados: tabla en desktop (`ActivityTable`, linea 660) con columnas Hora/Evento/Modulo/ID/Estado, y lista compacta en mobile (`ActivityList`, linea 707) con dot de status + truncation. Ambos respetan la jerarquia visual del DS (`src/app/inicio/page.tsx:639-738`).

9. **Timestamps de frescura en cada card:** Tanto las AlertCards como las StatCards muestran "hace X min" con la funcion `timeAgo()`, dando transparencia sobre la frescura de los datos. Esto cumple con Nielsen #1 (visibilidad del estado) y la recomendacion HU-06 del pre-audit (`src/app/inicio/page.tsx:251-256`, `439`, `496`).

10. **Plan consumption con barras progresivas y thresholds:** La PlanCard muestra consumo de pedidos/mes, sucursales y almacenamiento con barras que cambian de azul a amarillo (80%) a rojo (100%). El badge "Plan Business" usa el token purple del DS. El boton "Gestionar plan" da salida clara (`src/app/inicio/page.tsx:570-637`).

---

## 5. Historias de Usuario para Hallazgos Criticos/Altos

### HU-01: Deep links en Activity Log (QW-01)
**Como** supervisor que revisa la actividad reciente en el dashboard,
**quiero** poder hacer click en el ID de entidad (ej: "S-BASIC61375") para navegar directamente al detalle,
**para** investigar eventos sin tener que buscar manualmente en cada modulo.

**Criterios de aceptacion:**
- [ ] El `entityId` en ActivityTable se renderiza como `<Link>` con href al detalle de la entidad
- [ ] El href se construye segun el modulo: Pedidos -> `/pedidos/{id}`, Recepciones -> `/recepciones/{id}`, etc.
- [ ] El link tiene estilo visual diferenciado (underline on hover, color `#3B82F6`)
- [ ] En ActivityList (mobile) el entityId tambien es clickeable

### HU-02: Refresh manual y datos en vivo (ST-01)
**Como** supervisor que consulta el dashboard cada 15 minutos,
**quiero** poder refrescar los datos manualmente y saber cuando fue la ultima actualizacion,
**para** confiar en que las decisiones que tomo se basan en informacion actual.

**Criterios de aceptacion:**
- [ ] Boton "Actualizar" visible en el area de greeting con icono RefreshCw
- [ ] Al hacer click, muestra loading spinner y refetch de todas las zonas
- [ ] Timestamp "Ultima actualizacion: 09:42" visible y reactivo
- [ ] Auto-refresh cada 60 segundos con indicador visual sutil
- [ ] Pull-to-refresh funcional en mobile/tablet

### HU-03: Contenido para rol Operador (ST-02)
**Como** operador de warehouse que abre el dashboard en mi tablet,
**quiero** ver accesos directos a mis modulos frecuentes y tareas pendientes del dia,
**para** no depender del sidebar de navegacion cuando uso guantes.

**Criterios de aceptacion:**
- [ ] Si no hay alertas, el operador ve al menos 3 cards de acceso rapido (Recepciones, Pedidos, Inventario)
- [ ] Cada card muestra un contador de pendientes (ej: "8 recepciones programadas")
- [ ] Los touch targets son >= 48px de alto
- [ ] La vista se adapta a tablet horizontal y vertical

### HU-04: Alertas accesibles (QW-03)
**Como** usuario de lector de pantalla que monitorea el dashboard,
**quiero** que las alertas criticas se anuncien automaticamente,
**para** recibir notificacion de urgencias sin depender de la vision.

**Criterios de aceptacion:**
- [ ] La seccion de alertas tiene `role="alert"` y `aria-live="assertive"` para criticas
- [ ] Cada AlertCard tiene `aria-label` descriptivo (ej: "Alerta critica: 4 pedidos con atraso")
- [ ] Las alertas warning usan `aria-live="polite"`
- [ ] Al actualizarse las alertas, el lector de pantalla anuncia los cambios

### HU-05: KPIs criticos visibles en mobile (ST-04)
**Como** supervisor usando tablet en el warehouse,
**quiero** ver KPIs con alertas sin tener que expandir una seccion colapsada,
**para** no perderme informacion critica por estar oculta.

**Criterios de aceptacion:**
- [ ] Si hay KPIs con severity "warning" o "critical", se muestra badge en el toggle: "Tendencias (1 alerta)"
- [ ] KPIs criticos se muestran en mini-preview incluso con seccion colapsada
- [ ] Si hay KPI critico, la seccion se auto-expande

---

## 6. Plan de Fases con Score Estimado

### Fase 1: Quick Wins (Sprint 1 — 1 semana)
| Item | Esfuerzo | Score Delta |
|---|---|---|
| QW-01: Deep links en activity log | 1.5h | +2.0 |
| QW-02: ARIA roles en onboarding | 1h | +1.5 |
| QW-03: role="alert" en alertas criticas | 1h | +1.5 |
| QW-04: Timestamp dinamico | 0.5h | +0.8 |
| QW-05: Labels 12px/#6B7280 | 0.5h | +0.5 |
| QW-06: Section heading jerarquia | 0.5h | +0.2 |
| FI-05: Skip-to-content link | 0.5h | +0.5 |
| **Subtotal** | **5.5h** | **+7.0** |

### Fase 2: Mejoras Estrategicas (Sprint 2-3 — 2 semanas)
| Item | Esfuerzo | Score Delta |
|---|---|---|
| ST-01: Refresh manual + datos en vivo | 6h | +3.0 |
| ST-02: Contenido para rol Operador | 8h | +2.5 |
| ST-04: KPIs criticos visibles mobile | 3h | +1.0 |
| FI-02: Alertas plan consumption | 2h | +0.5 |
| FI-03: Greeting contextual | 1h | +0.5 |
| FI-04: Activity table al canon DS | 2h | +0.3 |
| **Subtotal** | **22h** | **+7.8** |

### Fase 3: Refactoring y Integracion (Sprint 4 — 1 semana)
| Item | Esfuerzo | Score Delta |
|---|---|---|
| ST-03: Hooks de fetching por zona | 10h | +2.0 |
| DP-01: Extraer sub-componentes | 4h | +0.5 |
| DP-02: Selector de sucursal | 4h | +0.5 |
| WCAG fixes restantes | 3h | +1.0 |
| **Subtotal** | **21h** | **+4.0** |

### Tabla de Score Acumulado

| Fase | Score Acumulado | Esfuerzo Total |
|---|---|---|
| Actual | **81.4** | — |
| Post Fase 1 | **88.4** | 5.5h |
| Post Fase 2 | **96.2** | 27.5h |
| Post Fase 3 | **100.0** | 48.5h |

---

## 7. Perspectiva Psicologica

### Modelo Mental del Supervisor de Warehouse
El supervisor de warehouse abre el dashboard cada manana con una pregunta implicita: "que esta mal hoy?". La arquitectura de urgencia del modulo Inicio responde correctamente a este modelo mental, priorizando alertas criticas arriba y datos de contexto debajo. El patron es analogo al "morning briefing" de ShipHero, donde el primer bloque siempre son exceptions. Sin embargo, el modelo mental del **operador** es diferente: el pregunta "que tengo que hacer ahora?", no "que esta mal". La ausencia de tareas asignadas o accesos directos para el operador (ST-02) desalinea el dashboard de su modelo mental.

### Ley de Von Restorff y el Sistema Semaforo
El sistema semaforo (rojo = critico, amarillo = warning) implementado en alertas con borde izquierdo colored + background tinted es un excelente uso de Von Restorff (el item que difiere del grupo es recordado). La critica de alertas destaca visualmente sobre las warnings, y ambas sobre el fondo neutro. Sin embargo, la dependencia exclusiva del color (sin icono redundante en los status badges del activity log) viola WCAG 1.4.1 y debilita Von Restorff para usuarios con daltonismo (8% de hombres).

### Efecto Zeigarnik en Onboarding
El banner de onboarding aprovecha correctamente el efecto Zeigarnik: "3 de 5 modulos configurados" crea tension psicologica de tarea incompleta. El auto-collapse al 70% es un patron inteligente — reduce el ruido visual cuando el usuario ya esta avanzado, pero mantiene la barra de progreso como recordatorio sutil. El dismiss a partir del 70% (no antes) evita que el admin cierre el onboarding prematuramente.

### Paradoja del Dashboard Vacio (Operador)
Cuando el rol Operador no tiene alertas, el dashboard muestra: greeting + "Sin alertas — operacion al dia". Si bien el empty state es psicologicamente positivo (refuerza la motivacion), genera un problema de **perceived utility**: el operador que abre el home y ve "nada que hacer" percibe que el sistema no le aporta valor. Esto conduce a que deje de visitar el home, perdiendo la oportunidad de mostrarle alertas futuras. La solucion es la zona de accesos directos (ST-02): incluso sin urgencias, el operador tiene utilidad en la pagina.

### Carga Cognitiva y Miller's Law
El dashboard respeta Miller (7 +/- 2): en el caso maximo (Super Admin), las zonas visibles above the fold son ~4 (greeting, onboarding, alertas, stats). Cada stat card tiene exactamente 3 metricas. El operations log muestra 5 eventos. Los KPIs son 4. Ningun grupo excede 7 items, lo cual es optimo para procesamiento cognitivo.

### Fitts's Law y Touch Targets
Las AlertCards son areas clickeables completas (buen Fitts), pero los botones de toggle de onboarding y metricas son iconos de 28x28px (`p-1.5` en un icono de `w-4 h-4`), por debajo del minimo de 44x44px para operadores con guantes. El pre-audit (HU-05) advierte sobre esto. La solucion es aumentar el padding o agregar un area de toque invisible mas grande.

---

## 8. Metricas Sugeridas

### Eficiencia Operativa
| Metrica | Baseline Estimado | Target Post-Mejoras |
|---|---|---|
| Tiempo para responder "que atender ahora?" | 5s | <3s |
| Clicks para navegar a entidad desde activity log | 3 (home > modulo > buscar) | 1 (deep link) |
| Tasa de uso del refresh manual | N/A (no existe) | 30% de sesiones |
| Tasa de abandono del home (Operador) | 60% (sale en <5s) | 20% |

### Engagement
| Metrica | Medicion |
|---|---|
| Completitud de onboarding | % admins que llegan al 100% en <7 dias |
| Interaccion con alertas | % de alertas clickeadas vs mostradas |
| Expansion de metricas en mobile | % de sesiones mobile que expanden zona 3 |
| Uso de accesos directos (Operador) | Clicks/sesion en cards de acceso rapido |

### Accesibilidad
| Metrica | Target |
|---|---|
| Score Lighthouse Accessibility | 95+ |
| Zero violaciones WCAG nivel A | 100% |
| Conformidad WCAG AA | 90%+ criterios |
| Contraste minimo en textos | >= 4.5:1 en todo texto |

### Satisfaccion
| Metrica | Instrumento |
|---|---|
| SUS (System Usability Scale) | Encuesta trimestral a supervisores y operadores |
| "Utilidad percibida del home" | Escala Likert 1-5 por rol |
| Task Success Rate | Test de usabilidad: "encuentra los pedidos atrasados" |
| Net Promoter Score interno | Encuesta mensual |

---

## 9. Validacion del Pre-Audit Checklist

Evaluacion de cada item del checklist post-mockup definido en `docs/evaluaciones/ux-pre-audit-inicio.md`:

| # | Item del Checklist | Estado | Evidencia |
|---|---|---|---|
| 1 | Alertas above the fold en mobile sin scroll | ✅ PASA | Las alertas estan en zona 1, inmediatamente despues del greeting y onboarding. Con max-4 alertas visibles y progressive disclosure ("Ver todas"), caben above the fold en mobile |
| 2 | Alertas con border + bg colored diferenciado | ✅ PASA | `borderLeftWidth: "4px"` con `borderLeftColor` rojo/amarillo + `backgroundColor` tinted. Lineas 408-413 |
| 3 | CTAs >= 48px touch target | ⚠️ PARCIAL | Las AlertCards completas son touch targets amplios (pasan). Pero los botones de toggle de onboarding y metricas son ~28px (`p-1.5` + icono `w-4 h-4`). El boton "Continuar configuracion" del onboarding usa `size="sm"` (32px height por el DS) |
| 4 | Onboarding con progreso X de Y | ✅ PASA | "3 de 5 modulos configurados" + barra de progreso visual. Lineas 322-326 |
| 5 | Banner desaparece al completar | ✅ PASA | `const onboardingComplete = ONBOARDING_STEPS.every(s => s.done)` + `showOnboarding = !onboardingDismissed && !onboardingComplete`. Lineas 815-816 |
| 6 | Timestamps en cada card | ✅ PASA | AlertCards muestran "hace X min" (linea 439-441). StatCards muestran "hace X min" (linea 496-498). KPIs no tienen timestamp individual, pero la seccion tiene "Actualizado hace 1 min" |
| 7 | Operador ve solo su contenido | ✅ PASA | Alertas filtradas por `roles.includes(role)`. Zonas 2-4 condicionadas por `roleCanSee*()`. Lineas 806-812 |
| 8 | Admin ve plan sin que operadores vean | ✅ PASA | `roleCanSeePlan(role)` retorna true solo para "Super Admin". Linea 97-98 |
| 9 | Estado 0 alertas se ve bien | ✅ PASA | `NoAlertsState` con icono CheckCircle2 verde + mensaje positivo. Lineas 455-471 |
| 10 | Operations log con deep links | ❌ FALLA | El `entityId` se renderiza como texto plano, sin `<Link>`. Ver QW-01 |
| 11 | Max 4 cards above the fold mobile | ✅ PASA | `const visibleAlerts = alertsExpanded ? filteredAlerts : filteredAlerts.slice(0, 4)`. Linea 811. Ademas, las zonas 2-4 no son visibles para Operador |
| 12 | Transicion onboarding -> operativo fluida | ✅ PASA | El banner tiene `animate-in fade-in`, auto-collapse al 70%, dismiss al 70%+, y desaparece al 100%. La transicion es gradual, no abrupta |
| 13 | Responde "que atender ahora?" en <5s | ⚠️ PARCIAL | Para supervisor/admin: SI — las alertas above the fold responden en <3s. Para operador sin alertas: NO — ve un dashboard vacio que no responde la pregunta. Ver ST-02 |

**Resumen Pre-Audit:** 10 ✅, 2 ⚠️, 1 ❌

---

*Evaluacion completada el 2026-03-28. El modulo Inicio demuestra una arquitectura de informacion madura y alineada con best practices de WMS dashboards (ShipHero, Logiwa). Las oportunidades mas impactantes son: deep links en activity log (QW-01), accesibilidad ARIA (QW-02/03), refresh manual (ST-01) y contenido para rol Operador (ST-02). Con 5.5 horas de Quick Wins se puede elevar el score de 81.4 a 88.4.*
