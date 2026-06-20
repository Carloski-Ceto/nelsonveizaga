# Sesión: Módulo Médicos + fix botones frontend

Fecha: 2026-05-31

## Solicitud
1) Implementar un médico con módulo propio en backend y frontend (sidebar).  
2) Revisar problemas de botones en frontend.

## Implementación

### Backend
- Nueva app: `backend/apps/medicos`
  - `models.py`: entidad `Medico` con atributos propios:
    - `matricula` (única)
    - `especialidad_principal`
    - `subespecialidad`
    - `anios_experiencia`
    - `activo`
  - `serializers.py`: validación de tipo usuario (`MEDICO` o `ADMIN`) y rango de experiencia.
  - `views.py`: CRUD con bitácora y manejo de `ProtectedError`.
  - `urls.py`: expone `/api/medicos`.
  - `admin.py`, `apps.py`, migración `0001_initial`.
- Registro en proyecto:
  - `config/settings.py` -> `apps.medicos`
  - `config/urls.py` -> include `apps.medicos.urls`
- RBAC/seed:
  - `seed_permisos.py` agrega `medicos.listar|crear|editar|eliminar`
  - `seed_rbac_asignaciones.py` asigna `medicos.listar` a roles clínicos y `medicos.*` a admin
  - `seed_clinica.py` crea perfiles médicos demo con atributos propios.

### Frontend
- Nueva página: `frontend/src/app/dashboard/medicos/page.tsx`
  - Alta de médico
  - Lista de médicos
  - Desactivar / Eliminar
  - Botones con validación (sin returns silenciosos)
- Sidebar:
  - `frontend/src/components/Sidebar.tsx` agrega entrada **Médicos** en Gestión clínica.
- Autorización:
  - `frontend/src/lib/authorization.ts` incluye módulo/ruta `medicos` y permisos `medicos.*`.

### Fix botones (UX)
- En especialistas ya no hay retornos silenciosos: ahora se muestran errores claros cuando faltan campos.
- En módulo médicos se aplica la misma política.

## Validación
- `docker compose exec backend python manage.py migrate` ✅
- `docker compose exec backend python manage.py seed --only permisos` ✅
- `docker compose exec backend python manage.py seed --only rbac` ✅
- `docker compose exec backend python manage.py seed --only clinica` ✅
- `docker compose exec backend python manage.py check` ✅
- `docker compose exec frontend npm run lint` ✅
