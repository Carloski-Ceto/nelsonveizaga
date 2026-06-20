# Sesión: formularios para registrar/gestionar datos clínicos

Fecha: 2026-05-31

## Solicitud
Implementar formularios en módulos de especialistas, médicos y registro de consultas para mejorar usabilidad al registrar/gestionar datos.

## Cambios aplicados

### Frontend — Especialistas (`/dashboard/especialistas`)
- Alta de especialista y alta de horario convertidas a `<form>` con submit.
- Nuevo modal de edición para especialista (especialidad, registro profesional).
- Nuevo modal de edición para horario (día, bloque horario, duración).
- Se mantiene validación y feedback de errores.

### Frontend — Médicos (`/dashboard/medicos`)
- Alta convertida a `<form>` con submit.
- Nuevo modal de edición para gestionar matrícula, especialidad principal, subespecialidad y años de experiencia.

### Frontend — Consultas (`/dashboard/consultas`)
- Bloque principal de registro convertido a `<form>` con submit.
- Validaciones explícitas: cita válida, diagnóstico principal y plan de tratamiento obligatorios.
- CTA `Registrar consulta` deshabilitado hasta cumplir datos mínimos.

## Validación
- `docker compose exec frontend npm run lint` ✅
