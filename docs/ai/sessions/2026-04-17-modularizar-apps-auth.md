# Sesión 2026-04-17 — App `apps.auth` modular

## Qué se hizo
- Nueva app Django `apps/auth/` (import `apps.auth`): `serializers.py`, `urls.py`, subpaquete `views/` (`login`, `logout`, `profile`, `password_change`, `password_reset`, `security`, `common`).
- `apps/users`: solo modelos + helpers (`tokens`, `emails`, `login_lockout`) + `UsuarioViewSet` y serializers de usuario.
- `config/urls.py`: `include('apps.auth.urls')` luego `include('apps.users.urls')`.
- `AuthConfig.label = 'oftalmologia_auth'` (evitar conflicto con `django.contrib.auth`).

## Rutas
Sin cambio de URL pública (`/api/auth/...`, `/api/security/login-config/`, `/api/users/...`).
