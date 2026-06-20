# Sesión: citas y consultas con formulario modal de creación

Fecha: 2026-05-31

## Solicitud
Aplicar el mismo patrón de médicos/especialistas a:
- Citas
- Consultas

## Implementación

### Citas (`/dashboard/citas`)
- Se elimina formulario inline de programación.
- Se agrega botón `Programar cita` que abre modal con formulario.
- Validación mínima con mensaje si faltan campos requeridos.
- Cierre de modal con `ESC`, clic fuera y cancelación.

### Consultas (`/dashboard/consultas`)
- Se oculta formulario inline completo de registro clínico.
- Se agrega botón `Registrar consulta` que abre modal con el formulario clínico completo.
- Se mantiene validación obligatoria (`cita`, `diagnóstico`, `plan`).
- Cierre de modal con `ESC`, clic fuera y cancelación.

## Validación
- `docker compose exec frontend npm run lint` ✅
