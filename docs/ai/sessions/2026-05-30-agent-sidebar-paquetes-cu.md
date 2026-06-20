# Sesión: Sidebar por paquetes CU

Fecha: 2026-05-30

## Solicitud
Reorganizar el Sidebar del frontend siguiendo la misma lógica de paquetes funcionales usada en backend.

## Cambios aplicados

### `frontend/src/components/Sidebar.tsx`
- Se reemplaza lista plana por `NAV_GROUPS` con secciones:
  - Reportes y estadísticas
  - Usuarios
  - Gestión clínica
  - Historial clínico (sin rutas, nota `Próximamente`)
  - Bitácora
- Se mantiene filtro de visibilidad por permisos (`canViewRoute`).
- Se renderizan divisores entre grupos.

### `frontend/src/components/Sidebar.module.css`
- Ajustes para grupos y nota de sección.
- Soporte visual para separadores y etiqueta de roadmap.

## Validación
- `docker compose exec frontend npm run lint` ✅

## Resultado
El Sidebar queda alineado con la arquitectura por paquetes de casos de uso, más legible para operación y defensa técnica.
