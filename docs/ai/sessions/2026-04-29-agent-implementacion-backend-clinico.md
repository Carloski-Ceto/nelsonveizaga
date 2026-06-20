# Sesión 2026-04-29 — Implementación backend clínico

## Objetivo
Implementar casos de uso clínicos en backend con arquitectura modular:
- Registrar paciente
- Editar paciente
- Directorio de pacientes
- Registrar especialista
- Gestionar horarios de especialista
- Programar cita
- Reprogramar cita
- Cancelar cita
- Consultar agenda médica
- Registrar consulta médica

## Cambios realizados
- Nuevas apps Django:
  - `apps.pacientes`
  - `apps.especialistas`
  - `apps.citas`
  - `apps.consultas`
- Nuevos modelos y rutas REST para CRUD clínico.
- Reglas de disponibilidad y solapamiento de citas en `apps.citas.services`.
- Acciones de negocio en citas:
  - `POST /api/citas/{id}/reprogramar`
  - `POST /api/citas/{id}/cancelar`
- Agenda médica de lectura:
  - `GET /api/agenda-medica`
- Registro de consulta médica con cambio de estado de cita a `ATENDIDA`.
- Integración en proyecto:
  - `backend/config/settings.py` (INSTALLED_APPS)
  - `backend/config/urls.py` (inclusión de rutas)

## Migraciones creadas
- `apps/pacientes/migrations/0001_initial.py`
- `apps/especialistas/migrations/0001_initial.py`
- `apps/citas/migrations/0001_initial.py`
- `apps/consultas/migrations/0001_initial.py`

## Validación ejecutada
- `python -m compileall apps` en `backend/` para validar sintaxis de módulos nuevos.

## Riesgos / pendientes
- No se ejecutó `manage.py makemigrations` ni `migrate` en este host por falta de dependencia local (`python-decouple`).
- Falta validar en entorno Docker/venv del proyecto:
  - migraciones aplican sin conflicto,
  - constraints condicionales en PostgreSQL,
  - pruebas de concurrencia para doble reserva de horario.

## Siguientes pasos
1. Levantar stack Docker y correr `python manage.py migrate`.
2. Probar endpoints clínicos con Postman/Insomnia.
3. Implementar frontend conectado a estos endpoints.
