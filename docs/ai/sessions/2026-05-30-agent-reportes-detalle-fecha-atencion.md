# Sesión: detalle de fecha de atención en reportes

Fecha: 2026-05-30

## Solicitud
Agregar más detalle en reportes, específicamente "de cuándo fue atendido" en el bloque de pacientes atendidos.

## Cambios aplicados
1. **Backend (`apps.reportes`)**
   - `views.py` en `_build_pacientes_atendidos` ahora agrega por paciente:
     - `total_consultas`
     - `primera_atencion`
     - `ultima_atencion`
   - El agrupado se ordena por `ultima_atencion` descendente.
   - Export `pacientes-atendidos` (CSV/XLSX/PDF) incluye nuevas columnas.

2. **Frontend (`/dashboard/reportes`)**
   - Se amplía tipo `PacienteAtendido`.
   - Tabla agrega columnas:
     - Total consultas
     - Primera atención
     - Última atención
   - Formato de fecha/hora local `es-BO`.

3. **Pruebas/validación**
   - Se actualiza test backend para validar llaves nuevas en payload.
   - `python manage.py test apps.reportes.tests.test_reportes_endpoints` ✅
   - `npm run lint` frontend ✅

## Resultado
El usuario ahora puede ver no solo qué paciente fue atendido, sino también cuándo fue atendido por primera y última vez dentro del rango del reporte.
