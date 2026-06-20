# Sesión: fix de "última atención" repetida en reportes

Fecha: 2026-05-31

## Problema
En `Pacientes atendidos` aún se observaban muchos empates exactos en `última atención`.

## Causa
Aunque se diversificaron citas, varias consultas terminaban con timestamps iguales por patrón de creación y actualización histórica.

## Solución aplicada
- `backend/seeders/seed_consultas_demo.py`
  - `fecha_creacion`/`fecha_actualizacion` de consulta ahora usa:
    - base: `fecha_hora_inicio` de la cita
    - + offset determinístico (`12 + ((id_paciente*3 + id_especialista) % 17)` minutos)
  - esto rompe empates artificiales y mantiene reproducibilidad (idempotente).

## Validación
- `seed --only consultas-demo` ejecutado ✅
- Verificación por shell:
  - `pacientes_con_consulta = 50`
  - `distinct_last = 50`
  - `top_repetidas = []`
