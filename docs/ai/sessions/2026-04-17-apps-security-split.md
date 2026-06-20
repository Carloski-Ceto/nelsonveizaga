# Sesión 2026-04-17 — App `apps.security`

## Objetivo
Sacar de `apps/users` los modelos y helpers de seguridad de acceso (no son el “usuario” de negocio).

## Contenido `apps.security`
- `models.py`: `ConfiguracionLoginSeguridad`, `BloqueoIntentoLogin`, `TokenRecuperacion` (`db_table` iguales).
- `login_lockout.py`, `tokens.py`, `emails.py`, `admin.py`.
- Migración `0001_initial`: `SeparateDatabaseAndState` sin operaciones en BD.

## `apps.users` tras el split
- `models.py`: solo `Usuario` (+ choices).
- `admin.py`: solo `Usuario`.
- `views.py`, `serializers.py`, `urls.py`, `managers.py`, migraciones.

## Comandos
`docker compose exec backend python manage.py migrate`
