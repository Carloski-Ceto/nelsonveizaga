# Sesión: Paquetización fase 2 (piloto roles)

Fecha: 2026-05-30

## Objetivo
Iniciar traslado físico real de apps Django al esquema por paquetes CU sin romper compatibilidad.

## Alcance aplicado
Se ejecutó el piloto sobre **Roles**:

- Nuevo app path activo: `backend/apps/Usuarios/roles`
- Nuevo `AppConfig`:
  - `name = 'apps.Usuarios.roles'`
  - `label = 'roles'` (preserva identidad lógica/migraciones)
- Se copiaron módulos funcionales: `models`, `serializers`, `views`, `urls`, `admin`, `migrations`.

## Compatibilidad
Se dejaron wrappers en `backend/apps/roles/*` para no romper imports existentes (`apps.roles.models`, etc.) mientras se migra gradualmente el resto del código.

## Configuración actualizada
- `backend/config/settings.py`: `apps.roles` -> `apps.Usuarios.roles`
- `backend/config/urls.py`: include de `apps.Usuarios.roles.urls`

## Validación
- `docker compose exec backend python manage.py check` ✅
- `docker compose exec backend python manage.py test apps.auth.tests.test_permissions_endpoint` ✅

## Próximo paso recomendado
Aplicar la misma estrategia app por app (`permisos`, `users`, `auth`, `security`) con pruebas focalizadas por dominio después de cada traslado.
