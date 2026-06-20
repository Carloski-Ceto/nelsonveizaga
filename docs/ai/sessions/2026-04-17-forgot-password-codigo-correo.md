# Sesión 2026-04-17 — Recuperación contraseña por código

## Objetivo
Flujo «olvidé contraseña» con código numérico en correo (MailHog en dev), verificación explícita y cambio de contraseña.

## Cambios
- Backend: código en `tokens_recuperacion.token`, TTL `PASSWORD_RESET_CODE_TTL_SECONDS` (default 30, min 10 max 3600 en `tokens.py`), longitud `PASSWORD_RESET_CODE_LENGTH`. Endpoints `reset-password`, `reset-password/verify-code`, `reset-password/confirm` con `email` + `codigo`. Migración `0004` quita `unique` en `token`.
- Frontend: `/forgot-password` (pasos correo → código → nueva contraseña), enlace en `/login`.
- Docs: `CURRENT_STATE`, `HANDOFF_LATEST`, `NEXT_STEPS`, `DECISIONS_LOG` registro 7.

## Verificación local
1. `docker compose up` (incluye mailhog).
2. `docker compose exec backend python manage.py migrate`
3. Abrir http://localhost:8025, flujo desde http://localhost:3000/forgot-password

## Nota
30 s es muy corto para correo real; subir `PASSWORD_RESET_CODE_TTL_SECONDS` en `.env` si hace falta.
