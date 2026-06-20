# Sesión 2026-04-16 — Bloqueo temporal por login configurable

## Qué se hizo
- Modelos `ConfiguracionLoginSeguridad` (singleton lógico pk=1) y `BloqueoIntentoLogin` (`login_key` único).
- Lógica en `apps/users/login_lockout.py`; integración en `LoginView` (429 antes/después de intento; solo cuenta fallos con mensaje de credenciales incorrectas).
- API `GET/PATCH /api/security/login-config/` con `IsAdmin`.
- Frontend: `/dashboard/seguridad-login`, ítem sidebar solo ADMIN, login muestra espera con cuenta atrás en 429.

## Comandos
- Tras pull: `python manage.py migrate` (app `users`).

## Notas
- No sustituye `estado=BLOQUEADO` manual del usuario.
