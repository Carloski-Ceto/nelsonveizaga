# Sesión: unicidad de pacientes demo en selector de citas

Fecha: 2026-05-31

## Solicitud
Evitar que en programación de citas aparezcan pacientes demo con apellidos/nombres repetidos que confundan selección.

## Implementación
- `backend/seeders/seed_clinica.py`
  - Se normaliza el bloque de pacientes generados (`email` prefijo `paciente.`).
  - Se precomputan pares ordenados únicos de nombres y apellidos.
  - Se asigna combinación única por índice para 60 pacientes sintéticos.

## Validación
- `seed --only clinica` ✅
- Verificación shell:
  - `count=60`
  - `dup_apellidos=0`
  - `dup_nombres=0`
