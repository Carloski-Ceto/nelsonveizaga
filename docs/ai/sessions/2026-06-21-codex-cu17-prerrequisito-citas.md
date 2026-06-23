# CU17 — corrección del prerrequisito Citas

## Problema
Una cuenta mostrada como administrador veía Citas como módulo sin permiso mientras el sidebar todavía indicaba que el perfil estaba cargando. Además, el seeder RBAC solo asociaba el rol administrador a usernames demo concretos.

## Causa
- `CitasPage` evaluaba permisos antes de finalizar `DashboardUserContext.loading`.
- La sincronización `usuario_rol` no cubría automáticamente cuentas nuevas de tipo `ADMIN`.

## Corrección
- Citas espera la resolución del perfil antes de cargar o mostrar denegaciones.
- El botón Programar cita permanece deshabilitado únicamente durante esa resolución.
- El seeder asigna `Administrador del Sistema` a todo usuario con `tipo_usuario=ADMIN`.

## Aplicación pendiente
```powershell
docker compose exec backend python manage.py seed --only rbac
```

Después se debe cerrar sesión, volver a ingresar y validar `/api/auth/me` y `/api/auth/permissions`.
