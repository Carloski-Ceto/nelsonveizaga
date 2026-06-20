## Sesión: flujo frontend usuario -> médico -> especialista

### Cambios realizados
- `frontend/src/app/dashboard/medicos/page.tsx`
  - Se eliminaron `especialidad_principal` y `subespecialidad` de:
    - tipos TS (`MedicoRow`, `MedicoEditForm`),
    - formulario de creación,
    - modal de edición,
    - payload `POST /api/medicos`,
    - payload `PATCH /api/medicos/{id}`,
    - tabla (columnas y `colSpan`).
  - Se preservaron permisos, acciones y UX de modales.

- `frontend/src/app/dashboard/especialistas/page.tsx`
  - Fuente de creación cambia de usuarios a médicos:
    - reemplazo de estado/opciones a `medicos: { id_medico, nombre_usuario }[]`,
    - carga desde `GET /api/medicos?page=1`.
  - Formulario de creación ahora usa `id_medico`.
  - `POST /api/especialistas` ahora envía `id_medico`.
  - Tabla conserva nombre legible y fallback compatible `nombre_usuario || id_usuario || id_medico`.
  - Se preservaron UX modal, permisos RBAC y acciones existentes.

### Validación
- Intento de `npm run lint` en `frontend/`: falla de entorno local (`next` no reconocido en host, dependencias no instaladas).

### Notas
- Cambio funcional sin rediseño visual.
- Queda recomendado validar `lint/build` dentro del contenedor/frontend con dependencias instaladas.
