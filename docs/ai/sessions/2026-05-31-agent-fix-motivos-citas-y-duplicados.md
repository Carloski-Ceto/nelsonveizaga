# Sesión: motivos realistas y menor repetición en citas demo

Fecha: 2026-05-31

## Solicitud
- Confirmar si es normal múltiples citas por paciente.
- Cambiar motivos demo por textos realistas.
- Reducir repetición visible de pacientes en listado de citas seed.

## Implementación
- `backend/seeders/seed_dashboard_demo.py`
  - Nuevo catálogo `MOTIVOS_REALISTAS` (control PIO, seguimiento glaucoma, graduación, etc.).
  - Selección de paciente más distribuida para evitar repetición consecutiva evidente.
  - Limpieza legacy: actualiza citas antiguas con motivo `Dashboard demo ...` para reemplazarlas por motivo realista y reasignación demo de paciente.

## Validación
- `seed --only dashboard-demo` ✅
- muestra de últimas citas confirma:
  - motivos realistas
  - pacientes variados en filas recientes
