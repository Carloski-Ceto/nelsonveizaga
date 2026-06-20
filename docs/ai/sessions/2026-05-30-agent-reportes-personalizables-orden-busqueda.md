# Sesión: Reportes personalizables (orden y búsqueda)

Fecha: 2026-05-30

## Solicitud
Hacer los reportes más personalizables, incluyendo orden A-Z / Z-A (y equivalente numérico asc/desc), con control amplio de la visualización.

## Implementación
Se actualizó `frontend/src/app/dashboard/reportes/page.tsx` para incluir en cada sección:

1. **Búsqueda local** (filtro por texto en filas visibles).
2. **Selector de campo de orden** por tabla.
3. **Dirección de orden** `asc` / `desc`.

### Secciones cubiertas
- Pacientes atendidos
- Citas por período
- Consultas por especialista

### Detalle técnico
- Se usa `useMemo` para construir vistas derivadas (`pacientesView`, `citasView`, `especialistasView`) sin mutar la respuesta original.
- Comparación de texto con `localeCompare('es')` para orden alfabético coherente.
- Comparación numérica directa para columnas de conteo/ID.

## UI/UX
Se añadieron controles visuales en cada bloque (input + selects) con diseño responsive.

Archivo CSS ajustado:
- `frontend/src/app/dashboard/reportes/page.module.css`

## Validación
- `docker compose exec frontend npm run lint` ✅

## Resultado
El usuario puede personalizar la lectura de reportes en tiempo real (A-Z/Z-A, mayor-menor y búsqueda por texto) sin esperar cambios backend ni recargas adicionales.
