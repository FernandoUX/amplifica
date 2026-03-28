# UX Pre-Design Audit — Módulo Inicio (Home/Dashboard)

**Fecha**: 2026-03-28
**Tipo**: Dashboard home — hub operacional con onboarding contextual por rol
**Usuarios**: Operadores (guantes, mobile), supervisores, gerentes, admin/landlord

---

## Diagnóstico

Riesgo principal: que el home intente mostrar todo a todos y termine sin jerarquía clara — un "muro de cards" donde nada grita urgencia.

Arquitectura decidida: 3 zonas por urgencia (no por módulo), role-aware, dual-mode (onboarding/operativo).

---

## Leyes UX aplicadas

| Ley | Riesgo | Decisión |
|-----|--------|----------|
| Hick | CRÍTICO | Máx 4 cards above the fold por rol |
| Von Restorff | CRÍTICO | Semáforo agresivo: rojo solo para acciones pendientes |
| Progressive Disclosure | CRÍTICO | Filtrar por rol, zona 3 colapsada en mobile |
| Nielsen #1 | ALTO | Timestamps en cada card operacional |
| Zeigarnik | ALTO | Onboarding con barra progreso, colapsa al 70% |
| Fitts | ALTO | CTAs ≥48px en mobile, cards full-width clickeables |
| Jakob | ALTO | Vertical por urgencia (como ShipHero), no grid de módulos |
| Miller | MEDIO | Máx 3 stats por card, 5 eventos en operations log |

---

## HUs críticas

| ID | Historia | Ley | Riesgo si se omite |
|----|----------|-----|--------------------|
| HU-01 | Supervisor ve órdenes atrasadas al abrir home | Von Restorff | Home irrelevante |
| HU-02 | Admin ve consumo plan sin que operadores lo vean | Progressive Disclosure | Ruido para operativos |
| HU-03 | Usuario nuevo ve onboarding con progreso visible | Zeigarnik | Tickets de soporte |
| HU-04 | Gerente ve KPIs cross-módulo en una vista | Miller | Prefiere spreadsheets |
| HU-05 | Operador mobile con guantes usa CTAs ≥48px | Fitts | No puede interactuar |
| HU-06 | Todos ven timestamp de frescura en cada card | Nielsen #1 | Desconfianza |
| HU-07 | Supervisor ve operations log con deep links | Jakob | Sin contexto reciente |
| HU-08 | Operador ve SOLO lo accionable para su rol | Hick | Parálisis |

---

## Recomendaciones

1. Mobile-first: diseña para operador primero
2. Zona 1 es "inbox de urgencias" dinámico (no estático)
3. Onboarding sticky encima de zona 1, colapsa al 70%
4. Operations log es tabla compacta (no cards)
5. 1 CTA principal por card
6. Estado vacío positivo: "Operación al día"

---

## Checklist post-mockup

- [ ] Alertas above the fold en mobile sin scroll
- [ ] Alertas con border + bg colored diferenciado
- [ ] CTAs ≥48px touch target
- [ ] Onboarding con progreso X de Y
- [ ] Banner desaparece al completar
- [ ] Timestamps en cada card
- [ ] Operador ve solo su contenido
- [ ] Admin ve plan sin que operadores vean
- [ ] Estado 0 alertas se ve bien
- [ ] Operations log con deep links
- [ ] Máx 4 cards above the fold mobile
- [ ] Transición onboarding→operativo fluida
- [ ] Responde "¿qué atender ahora?" en <5s
