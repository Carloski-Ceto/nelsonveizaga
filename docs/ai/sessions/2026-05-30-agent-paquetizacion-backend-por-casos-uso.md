# Sesión: Paquetización backend por casos de uso

Fecha: 2026-05-30

## Solicitud
Reorganizar módulos de `backend/apps` según paquetes funcionales de casos de uso (Usuarios, Gestión Clínica, Historial Clínico, Reportes/Estadísticas y Bitácora).

## Decisión aplicada
Se implementó **paquetización lógica no disruptiva**:
- Se crean carpetas por paquete solicitado.
- Se agregan aliases (`__init__.py`) que referencian las apps reales existentes.
- No se movieron físicamente apps Django para evitar ruptura de labels/migrations/imports.

## Estructura creada
- `backend/apps/Usuarios/*`
- `backend/apps/GestionClinica/*`
- `backend/apps/HistorialClinico/*`
- `backend/apps/ReportesEstadisticas/*`
- `backend/apps/Bitacora/*`

## Trazabilidad
Se añade `backend/apps/PACKAGE_CU_MAP.md` con mapeo explícito CU -> app actual y estado de cobertura.

## Validación
- `docker compose exec backend python manage.py check` ✅

## Resultado
El backend queda organizado por paquetes de negocio para lectura/defensa académica y continuidad, manteniendo estabilidad técnica del sistema actual.
