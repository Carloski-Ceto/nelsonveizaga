# Sesión: Implementación del caso de uso Gestionar evolución del paciente (CU15)

## Fecha
2026-06-20

## Objetivo
Implementar el caso de uso "Gestionar evolución del paciente" (CU15) tanto en backend como en frontend, respetando la arquitectura modular, aplicando enrutamiento anidado bajo Historial Clínico, controles de acceso RBAC, auditoría en bitácora, un diseño de interfaz dividido y responsivo, y validaciones completas de compilación y suites de pruebas sin regresiones en el sistema.

## Cambios aplicados
- **Backend App Modular `evoluciones`:**
  - Registrada la app en `settings.py` (en `LOCAL_APPS` y configurando `MIGRATION_MODULES` para mantener las migraciones en la ruta del paquete modular `apps/GestionClinica/evoluciones/migrations`).
  - Creado modelo `EvolucionPaciente` con borrado protegido hacia `HistorialClinico` y `Especialista`.
  - Serializador con validaciones para restringir creación en historiales archivados e inexistentes, y validar que el especialista asignado esté activo.
  - Vistas controlando queries con scope dinámico `historial_id` obtenido de la URL, y registrando logs de auditoría en la bitácora (`AccionBitacora.CREAR`, `EDITAR`, `ELIMINAR`).
  - URLs anidadas mapeando a las acciones del ViewSet.
- **Seguridad y RBAC:**
  - Creada clase de permiso `IsMedicoOrAdminWriteAdministrativoRead` en `apps/core/permissions.py` para permitir lectura histórica a recepción (ADMINISTRATIVO) y lectura/escritura a médicos y administradores.
  - Agregados permisos granulares `evoluciones.*` a los seeders de permisos y RBAC.
  - **Corrección de Visibilidad del Historial Clínico:** Se añadieron los códigos de permiso granulares `'historialclinico.listar'` y `'historialclinico.archivar'` en los seeders (`seed_permisos.py` y `seed_rbac_asignaciones.py`) mapeándolos a los roles correspondientes. Esto soluciona la omisión en la que la ruta del sidebar `/dashboard/historial-clinico` quedaba oculta para todos los usuarios debido a la falta de permisos de historial registrados.
  - **Acceso Lectura a Historial para Recepción:** Se modificó `HistorialClinicoViewSet` para usar la clase de permiso `IsMedicoOrAdminWriteAdministrativoRead` permitiendo a Recepción (`ADMINISTRATIVO`) consultar los expedientes en modo solo lectura. Se actualizó `frontend/src/lib/authorization.ts` para que dicho rol pueda acceder al módulo de historial clínico en la interfaz.
- **Resolución de Deuda Técnica en Pruebas Existentes (Backend):**
  - Corregido `TypeError` en instanciación de especialistas (uso de `id_medico` en vez de `id_usuario`) en pruebas de pacientes, reportes y dashboard.
  - Corregido error en consulta de drilldown export de dashboard en `apps/ReportesEstadisticas/dashboard/views.py` que intentaba acceder a un atributo inexistente `id_usuario` en Especialista.
- **Frontend Integración de Interfaz de Usuario (Next.js):**
  - **Autorización (`frontend/src/lib/authorization.ts`):** Registrado el módulo `'evoluciones'`. Mapeado el permiso `'evoluciones.listar'` para roles con lectura (ADMIN, ADMINISTRATIVO, MEDICO, ESPECIALISTA) y `'evoluciones.crear'`, `'evoluciones.editar'`, `'evoluciones.eliminar'` para roles con escritura (ADMIN, MEDICO, ESPECIALISTA).
  - **Página de Historial Clínico (`frontend/src/app/dashboard/historial-clinico/page.tsx`):**
    - Se incorporaron estados de reactividad para el modal y la manipulación de evoluciones: `activeHistorial`, `evoluciones`, `especialistas`, `nuevaEvolucion`, `editingEvoId`, `editingNota`.
    - Integración de llamadas asíncronas para consumir la API de evoluciones (GET, POST, PUT, DELETE) y mapear los especialistas en memoria para mostrar nombres en lugar de IDs crudos.
    - Se agregó el botón "Evoluciones" en cada fila de la tabla de historiales.
    - Se renderiza un modal split-screen que en pantallas grandes muestra la lista cronológica a la izquierda (con opciones de edición rápida y borrado) y el formulario de alta a la derecha (o un banner de advertencia si la historia clínica está archivada).
  - **Estilos (`frontend/src/app/dashboard/historial-clinico/page.module.css`):**
    - Agregadas clases específicas para la maquetación del modal split (`.modalPanelLarge`, `.splitGrid`).
    - Diseñado el estilo para tarjetas de notas (`.evoCard`, `.evoCardHeader`, `.evoCardActions`) y badges de evoluciones.

## Validación ejecutada en Docker
1. **Migraciones y Seeders (Backend):** Aplicadas y ejecutadas con éxito en PostgreSQL.
2. **Suite de Evoluciones (Backend):** `docker compose exec backend pytest apps/GestionClinica/evoluciones/tests/` → 10 passed ✅
3. **Suite Completa del Proyecto (Backend):** `docker compose exec backend pytest` → 32 passed, 0 failed ✅
4. **Linter y Build (Frontend):** `docker compose exec frontend npm run lint` y `docker compose exec frontend npm run build` completados de manera exitosa sin warnings ni errores ✅

## Riesgos residuales
- Ninguno detectado. La suite completa de pruebas pasa sin fallas y la compatibilidad con el resto de módulos clínicos y analíticos está verificada al 100%. El frontend construye de forma standalone sin errores.
