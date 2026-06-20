# Sesion 2026-04-29 - Swagger/OpenAPI

## Objetivo
Habilitar documentacion viva de API backend para integracion y pruebas.

## Cambios
- Dependencia agregada: `drf-spectacular` en `backend/requirements/base.txt`.
- Configuracion DRF actualizada en `backend/config/settings.py`:
  - `DEFAULT_SCHEMA_CLASS = drf_spectacular.openapi.AutoSchema`
  - `SPECTACULAR_SETTINGS` con metadata basica.
- Rutas nuevas en `backend/config/urls.py`:
  - `/api/schema/`
  - `/api/docs/`
  - `/api/redoc/`

## Validacion pendiente
- Rebuild backend para instalar dependencia nueva en contenedor.
- Probar acceso a Swagger/ReDoc en navegador.
