# Sesion 2026-04-29 - Fix registro consultas KeyError

## Problema
Al registrar una consulta desde frontend (`POST /api/consultas-medicas`) backend devolvia 500 con:
- `KeyError: 'id_paciente_id'`
- origen: `apps/consultas/serializers.py` en `validate`.

## Causa
En `ModelSerializer`, `attrs` trae instancias de modelo para FKs (`id_paciente`, `id_especialista`), no llaves `id_paciente_id`/`id_especialista_id`.

## Solucion aplicada
- Archivo: `backend/apps/consultas/serializers.py`
- Se cambió la validación para usar:
  - `paciente = attrs['id_paciente']`
  - `especialista = attrs['id_especialista']`
  - comparación con `paciente.id_paciente` y `especialista.id_especialista` contra la cita.

## Verificacion
- `docker compose exec backend python manage.py check` -> sin issues.

## Siguiente paso recomendado
Agregar test de integración para `POST /api/consultas-medicas` con caso exitoso y caso de mismatch paciente/especialista.
