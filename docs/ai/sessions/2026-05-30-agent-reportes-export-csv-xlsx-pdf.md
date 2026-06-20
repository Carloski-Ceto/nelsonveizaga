# Session Log - 2026-05-30 - reportes-export-csv-xlsx-pdf

## Objetivo
Agregar exportación de reportes en tres formatos: CSV, Excel y PDF.

## Cambios backend
- `apps/reportes/views.py`
  - Se agregan endpoints de export por reporte:
    - `reporte_pacientes_atendidos_export`
    - `reporte_citas_por_periodo_export`
    - `reporte_consultas_por_especialista_export`
  - Selector de formato por query param: `file_format=csv|xlsx|pdf`.
  - Implementación con:
    - CSV: `csv` estándar
    - Excel: `openpyxl`
    - PDF: `reportlab`
- `apps/reportes/urls.py`
  - Nuevas rutas `/api/reportes/*/export`.
- `requirements/base.txt`
  - Nuevas dependencias: `openpyxl`, `reportlab`.

## Cambios frontend
- `frontend/src/app/dashboard/reportes/page.tsx`
  - Botones de exportación por sección: CSV, Excel, PDF.
  - Descarga de blob desde `/api/reportes/{tipo}/export`.

## Validación
- `docker compose up -d --build backend` (rebuild por nuevas dependencias) -> OK.
- `docker compose exec backend python manage.py test apps.reportes.tests.test_reportes_endpoints` -> OK (4 tests).
- `docker compose exec frontend npm run lint` -> OK.
- `docker compose exec frontend npm run build` -> OK.
