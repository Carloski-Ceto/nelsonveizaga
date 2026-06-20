# Sesión: Fix cobertura reportes por especialista

Fecha: 2026-05-30

## Contexto
Usuario reporta que la vista de reportes no está al 100%; en "Consultas por especialista" solo aparecen 2 especialistas.

## Diagnóstico
- Conteos detectados antes del fix:
  - `usuarios_activos=3`
  - `especialistas_perfil=2`
- Luego de ampliar `seed_clinica`:
  - `usuarios_activos=7`
  - `especialistas_perfil=6`
- Persistía sesgo en consultas:
  - `ConsultaMedica` agrupado por especialista: `181` y `179` (solo IDs 1 y 2).

## Causa raíz
El dataset histórico de `consultas_demo` ya existente estaba concentrado en 2 especialistas. Aunque se agregaron más especialistas, la lógica previa no garantizaba distribución mínima por especialista cuando ya se había alcanzado el objetivo global de consultas.

## Cambios aplicados
1. `backend/seeders/seed_clinica.py`
   - Se agregan 4 usuarios clínicos y 4 perfiles de especialista adicionales.
   - Se agregan horarios para especialistas nuevos.
2. `backend/seeders/seed_consultas_demo.py`
   - Nueva constante: `MIN_CONSULTAS_POR_ESPECIALISTA = 40`.
   - Nueva rutina `_asegurar_consultas_minimas_por_especialista(registrador)`.
   - Integración de la rutina en `run()` antes de cierre.

## Validación ejecutada
- `docker compose exec backend python manage.py seed --only consultas-demo`
  - Resultado: `160 creados, 360 ya existían`.
- Verificación distribución:
  - `especialistas_activos=6`
  - `consultas_total=520`
  - por especialista: `181, 179, 40, 40, 40, 40`
- Tests backend reportes:
  - `python manage.py test apps.reportes.tests.test_reportes_endpoints` ✅

## Resultado
El reporte "Consultas por especialista" deja de mostrar solo 2 especialistas y ahora tiene cobertura para los 6 especialistas activos con datos consistentes de demo.
