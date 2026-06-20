# Sesión: fix seeders 6 meses (realismo temporal y documentos)

Fecha: 2026-05-31

## Problema reportado
Los datos demo mostraban demasiada similitud (fechas/horas repetidas y documentos de identidad muy "default"), afectando utilidad de reportes.

## Cambios aplicados

### `backend/seeders/seed_clinica.py`
- Pacientes sintéticos con:
  - documentos estilo `CI-<DEP>-<SECUENCIA+CHECK>`
  - mayor variedad de nombres/apellidos
  - fechas de nacimiento y teléfonos más variados
- Si el paciente ya existe por documento, se sincronizan atributos para mejorar dataset sin duplicar IDs.

### `backend/seeders/seed_dashboard_demo.py`
- Mayor variación de hora/minuto por cita.
- Motivo de cita con patrón trazable por fecha/especialista/paciente.

### `backend/seeders/seed_consultas_demo.py`
- Nueva dispersión temporal de citas para consultas (día/hora/minuto).
- `fecha_creacion` de consultas se sincroniza con la fecha/hora de su cita para reflejar histórico real (6 meses), evitando concentración en fecha de ejecución del seed.

## Validación
- Seed ejecutado:
  - `seed --only clinica` ✅
  - `seed --only dashboard-demo` ✅
  - `seed --only consultas-demo` ✅
- Verificación rápida por shell:
  - consultas distribuidas en múltiples fechas ✅
  - muestra de documentos de pacientes con formato variado ✅
