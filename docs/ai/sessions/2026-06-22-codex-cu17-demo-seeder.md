# CU17 — seeder de escenario demo

## Objetivo
Disponer de un paciente reproducible con consulta y refracción OD/OI para probar la emisión de receta óptica desde el frontend.

## Implementación
- Seeder: `backend/seeders/seed_cu17_demo.py`.
- Registro CLI: `python manage.py seed --only cu17-demo`.
- Paciente: `Paciente Demo CU17` (`CU17-DEMO-001`).
- Historial activo.
- Cita atendida.
- Consulta con esfera, cilindro y eje de ambos ojos.
- Sin receta óptica inicial.

## Regla de repetición
- Si hay consulta pendiente, no duplica datos.
- Si la consulta ya tiene receta, crea una reconsulta nueva.
- Nunca modifica o elimina recetas emitidas.

## Validación pendiente
El seeder y sus dos pruebas fueron escritos pero no ejecutados por solicitud del usuario.
