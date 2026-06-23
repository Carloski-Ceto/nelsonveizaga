# Sesión CU17 — backend de recetas ópticas

## Alcance
Implementación y revisión estática del backend de CU17, sin levantar servicios ni ejecutar migraciones o pruebas.

## Decisiones
- `ConsultaMedica 1 -> 0..1 RecetaOptica`.
- Las reconsultas generan recetas nuevas; los documentos históricos no se editan ni eliminan.
- Una receta admite `ANTEOJOS`, `CONTACTO` o `AMBOS`.
- Los detalles se identifican de forma única por receta, tipo de corrección y ojo.
- Solo `ESPECIALISTA` asignado a la consulta o `ADMIN` puede emitir.
- CU13 es requisito; la receta almacena un snapshot de la prescripción final.

## Implementado
- Modelos y constraints.
- Serializer y validaciones cruzadas.
- Servicio `emitir_receta_optica()` transaccional.
- Endpoints nested de crear/listar/ver.
- Auditoría en bitácora.
- Permisos y asignaciones RBAC.
- Migración `0001_initial.py` escrita manualmente.
- Suite de 12 pruebas escrita.

## Pendiente de ejecución
- `python manage.py makemigrations --check --dry-run`.
- `python manage.py migrate`.
- Suite de pruebas de `recetas_opticas`.
- Ajustar el frontend al contrato backend final.
