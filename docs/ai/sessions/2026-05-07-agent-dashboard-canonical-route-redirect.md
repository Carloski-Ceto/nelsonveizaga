# Sesión: URL canónica dashboard

## Fecha
2026-05-07

## Objetivo
Unificar URL canónica del dashboard analítico en `/dashboard` y mantener compatibilidad legacy con `/dashboard/dashboard`.

## Cambios
- Se extrajo la vista analítica a `frontend/src/app/dashboard/dashboard/DashboardAnalyticsPage.tsx`.
- `frontend/src/app/dashboard/page.tsx` ahora renderiza directamente `DashboardAnalyticsPage`.
- `frontend/src/app/dashboard/dashboard/page.tsx` se convirtió en ruta legacy con redirección server-side:
  - `redirect('/dashboard')`.

## Validación
- `npm run lint` OK.
- `npm run build` OK.

## Resultado
- URL funcional única del módulo analítico: `/dashboard`.
- Ruta histórica `/dashboard/dashboard` sigue accesible, pero redirige a la canónica para evitar duplicidad.
