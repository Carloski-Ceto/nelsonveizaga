# Sesión: edición de receta óptica emitida

## Objetivo
Permitir corregir una receta óptica ya emitida dentro de la misma consulta, incluido cambiar su tipo, sin permitir una segunda receta para esa consulta.

## Implementación
- Backend: `PUT/PATCH` nested, validación de identidad de consulta/historial, servicio transaccional con `select_for_update`, sustitución completa de detalles y bitácora `EDITAR`.
- Seguridad: escritura limitada a `ADMIN` y al `ESPECIALISTA` asignado; nuevo permiso `recetas_opticas.editar`; eliminación no habilitada.
- Frontend: acción Editar, formulario reutilizado, precarga, cambio de tipo con conservación de campos compatibles, consulta inmutable, cancelar y permisos separados para crear/editar.
- Pruebas escritas: edición cambiando a `AMBOS`, PATCH de indicaciones, consulta inmutable, rechazo a médico general y DELETE no permitido.

## Validación
- ESLint focalizado: aprobado sin errores.
- Build Next: timeout mientras generaba el build optimizado.
- `tsc --noEmit`: bloqueado por errores preexistentes de tipos Web Speech API en `dashboard/reportes/page.tsx`.
- Suite Django en Docker: timeout sin salida; el daemon Docker no respondió de forma operativa durante la sesión.

## Operación pendiente
Ejecutar `python manage.py seed --only rbac`, renovar sesión y validar el flujo editar/imprimir con especialista asignado y administrador.
