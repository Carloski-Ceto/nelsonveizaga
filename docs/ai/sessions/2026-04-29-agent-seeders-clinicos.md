# Sesion 2026-04-29 - Seeders clinicos

## Objetivo
Agregar seeders de dominio clinico para poblar datos base de pruebas de forma rapida e idempotente.

## Cambios
- `backend/seeders/seed_clinica.py` (nuevo):
  - usuarios clinicos base (`MEDICO`, `ESPECIALISTA`)
  - especialistas
  - pacientes
  - horarios por especialista
  - una cita futura de ejemplo
- `backend/apps/core/management/commands/seed.py`:
  - nuevo target `clinica` en `SEEDERS`
  - uso: `python manage.py seed --only clinica`

## Verificacion
- Comando ejecutado en contenedor backend:
  - `docker compose exec backend python manage.py seed --only clinica`
- Resultado:
  - `10 creados, 0 ya existían`

## Nota
El seeder es idempotente por claves naturales (username, documento, registro profesional y bloque horario).
