# Sesión: automatizar migrate + seed al iniciar contenedor

Fecha: 2026-05-31

## Solicitud
Automatizar migraciones y seeders al construirse/iniciarse contenedores.

## Implementación
- `backend/entrypoint.sh`
  - agrega ejecución automática:
    - `python manage.py migrate --noinput`
    - `python manage.py seed`
  - configurable por env:
    - `AUTO_MIGRATE` (default `true`)
    - `AUTO_SEED` (default `true`)
- `docker-compose.yml`
  - backend `environment` incluye:
    - `AUTO_MIGRATE: ${AUTO_MIGRATE:-true}`
    - `AUTO_SEED: ${AUTO_SEED:-true}`

## Validación
- `docker compose up -d --build backend` ✅
- `docker compose logs backend` muestra:
  - `Applying database migrations...`
  - `Running seeders...`
  - arranque normal de Django después.
