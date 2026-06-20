# Sesión: reportes fecha a fecha + médico + ajuste duplicidad visual citas

Fecha: 2026-05-31

## Solicitud
1) Reporte por período también por fecha (de fecha a fecha).  
2) Consultas con médico.  
3) Arreglar repetición de pacientes en citas demo.

## Implementación

### Reportes
- `backend/apps/reportes/views.py`
  - `citas-por-periodo` ahora agrupa por `fecha` y `estado` (`TruncDate`) y devuelve columnas:
    - `fecha`, `estado`, `total`.
  - export CSV/XLSX/PDF de `citas-por-periodo` actualizado con `fecha`.
- `frontend/src/app/dashboard/reportes/page.tsx`
  - tabla `Citas por período` adaptada a columnas `fecha/estado/total`.
  - filtros/sort/columnas visibles actualizados.
  - texto UI aclara “fecha a fecha”.

### Consultas
- `frontend/src/app/dashboard/consultas/page.tsx`
  - etiqueta de captura actualizada a `Médico (ID profesional)` para alinear flujo operativo.

### Citas demo / repetición visible
- `backend/seeders/seed_dashboard_demo.py`
  - selección de paciente cambiada a distribución con salto primo para reducir repetición consecutiva en tablas demo.

## Validación
- `docker compose exec frontend npm run lint` ✅
- `docker compose exec backend python manage.py check` ✅
