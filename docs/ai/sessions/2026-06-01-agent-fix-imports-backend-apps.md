# Sesión: Fix imports backend por movimiento de carpetas

## Fecha
2026-06-01

## Objetivo
Corregir imports inválidos `from backend.apps...` para usar el paquete real `apps...` en todo `backend/`, sin cambiar lógica.

## Cambios aplicados
- Reemplazo masivo de imports en:
  - `apps.Usuarios.*`
  - `apps.GestionClinica.*`
  - `apps.ReportesEstadisticas.*`
- Alcance: seeders, serializers, views y tests backend.

## Validación ejecutada en Docker
1. `python manage.py check` → OK (0 issues)
2. `python manage.py showmigrations` → OK (migraciones aplicadas)
3. `python manage.py makemigrations --check --dry-run` → OK (No changes detected)
4. `python manage.py seed --only admin` → OK (idempotente: 0 creados, 1 existente)

## Riesgos residuales
- Bajo: cambio de imports sin alteración de lógica.
- Recomendado: correr suite de tests backend completa en siguiente iteración para cobertura adicional.
