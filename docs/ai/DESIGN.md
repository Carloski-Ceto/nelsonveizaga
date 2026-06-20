# DESIGN.md

Fuente de verdad de diseno para agentes y subagentes UI/UX del proyecto.

## 1) Objetivo
- Estandarizar decisiones visuales y de UX para que cualquier agente pueda disenar y luego implementar sin romper consistencia.
- Adaptar la propuesta segun el tipo de sistema (information system, landing page, dashboard, etc.).
- Funcionar como contrato entre diseno, frontend y QA de accesibilidad.

## 2) Scope de uso
- Este archivo debe leerse antes de proponer layouts, componentes o estilos nuevos.
- Aplica tanto para rediseno de pantallas existentes como para pantallas nuevas.
- Si una decision de diseno cambia, actualizar este archivo y registrar la decision en `docs/ai/DECISIONS_LOG.md`.

## 3) Product Type Profiles

### 3.1 information-system (default del proyecto)
- Prioridad: claridad, legibilidad de datos, velocidad operativa y baja carga cognitiva.
- Densidad: media-alta en tablas y formularios; espacios consistentes para escaneo rapido.
- Componentes clave: tabla, filtros, formularios, modales de confirmacion, estados de error/ok.
- Tono visual: profesional, confiable, clinico, sin ornamento excesivo.

### 3.2 landing-page
- Prioridad: narrativa, conversion, jerarquia visual fuerte, prueba social.
- Densidad: baja-media; bloques amplios con CTA claro.
- Componentes clave: hero, beneficios, secciones de confianza, FAQ, CTA final.

### 3.3 dashboard-analytics
- Prioridad: lectura rapida de KPI, comparabilidad temporal, alertas accionables.
- Componentes clave: cards KPI, tablas resumidas, filtros de tiempo, drilldown.

## 4) Design Tokens (base)

### 4.1 Color semantics (evitar hardcode por componente)
- `--color-bg`
- `--color-surface`
- `--color-surface-alt`
- `--color-text`
- `--color-text-muted`
- `--color-primary`
- `--color-primary-contrast`
- `--color-success`
- `--color-warning`
- `--color-danger`
- `--color-border`
- `--color-focus`

### 4.2 Typography
- Definir familia principal, secundaria y escala (h1-h6, body, caption).
- Mantener altura de linea >= 1.4 para texto funcional.
- Evitar stacks genericos por defecto; justificar la seleccion tipografica.

### 4.3 Spacing, radius y sombras
- Escala de spacing consistente (ej. 4, 8, 12, 16, 24, 32).
- Radius por nivel (input/card/modal) con criterio unico.
- Sombras sutiles y consistentes, nunca por componente ad hoc.

## 5) Component Contract
- Cada componente nuevo debe definir:
  - Proposito UX.
  - Estados (`default`, `hover`, `focus`, `disabled`, `error`, `loading`, `success`).
  - Accesibilidad (label, aria, navegacion teclado, foco visible).
  - Reutilizacion (props base y variantes).

## 6) Accessibility Baseline (WCAG)
- Contraste minimo AA.
- Foco visible en todos los elementos interactivos.
- Formularios con label explicito + mensajes de error accionables.
- Modales con `role="dialog"`, `aria-modal`, foco inicial y cierre con ESC.
- No depender solo de color para comunicar estado.

## 7) Motion Guidelines
- Usar animaciones cortas y funcionales (150-250ms).
- Evitar animaciones decorativas que afecten legibilidad o rendimiento.
- Respetar `prefers-reduced-motion` cuando aplique.

## 8) Responsive Rules
- Disenar mobile-first cuando el flujo lo requiera, con verificacion desktop final.
- Definir breakpoints explicitos y comportamiento por componente (tabla, formulario, cards).
- Evitar overflow horizontal accidental en modulos de gestion.

## 9) Output esperado del subagente de diseno
Cuando se invoque el subagente de diseno, debe devolver como minimo:
1. Diagnostico rapido del contexto (tipo de sistema + objetivo de pantalla).
2. Direccion visual propuesta (tono, jerarquia, layout).
3. Lista de componentes y variantes.
4. Tokens requeridos/ajustados.
5. Checklist de accesibilidad.
6. Plan de implementacion frontend por pasos.

## 10) Integracion con skills
- `ui-ux-pro-max`: skill principal para estrategia y consistencia UI/UX.
- `frontend-design`: skill para ejecucion visual y componentes de alta calidad.
- `accessibility`: obligatorio cuando haya cambios de interfaz relevantes.
- `seo`: solo para superficies publicas (landing/sitio marketing).

## 11) Gobernanza
- Cualquier nuevo patron visual reusable debe registrarse tambien en `docs/ai/UI_UX_SKILLS.md` cuando ese archivo exista.
- Este documento es de continuidad entre sesiones y agentes.
