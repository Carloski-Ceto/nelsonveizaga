# DECISIONS LOG

Este archivo documenta todas las decisiones técnicas arquitectónicas importantes tomadas en la evolución del proyecto.

## Formato de Registro
- **Fecha:** YYYY-MM-DD
- **Decisión:** Resumen de la decisión técnica.
- **Motivo:** ¿Por qué se tomó y qué alternativas se consideraron?
- **Impacto:** ¿Qué consecuencias operativas o de código implica?

---

### Registro 64

**Fecha:** 2026-06-20
**Decisión:** Registrar y asignar permisos explícitos de `historialclinico` (`historialclinico.listar` y `historialclinico.archivar`) en seeders y permitir el acceso de lectura al rol de Recepción (`ADMINISTRATIVO`) a través del permiso `IsMedicoOrAdminWriteAdministrativoRead` en `HistorialClinicoViewSet`.
**Motivo:** Se detectó un problema en el cual la barra lateral (Sidebar) no mostraba el enlace de "Historial clínico" a ningún usuario, ya que el sistema verifica permisos granulares y la base de datos de permisos carecía de entradas para `historialclinico`. Además, para que el rol de Recepción (ADMINISTRATIVO) pueda ver las evoluciones del paciente, este rol necesita listar y consultar el historial clínico (que sirve como punto de acceso).
**Impacto:** Registro en `seed_permisos.py` y mapeo en `seed_rbac_asignaciones.py` para asignar los permisos a los roles correspondientes. Actualización de `HistorialClinicoViewSet` en backend para admitir lectura para administrativos (`IsMedicoOrAdminWriteAdministrativoRead`) y actualización de `frontend/src/lib/authorization.ts` para autorizar a Receptionist a visualizar el módulo de historial clínico.

### Registro 63

**Fecha:** 2026-06-20
**Decisión:** Diseñar e integrar la interfaz de usuario para "Gestionar evolución del paciente (CU15)" en Next.js utilizando un diseño dividido (Split Layout) y edición/eliminación inline de notas históricas.
**Motivo:** Se optó por una interfaz de pantalla ancha que permite visualizar cronológicamente el listado de evoluciones registradas del paciente en el lado izquierdo, y en el lado derecho disponer de un formulario estático/fijo para registrar una nueva nota clínico-médica. Esto proporciona un excelente flujo de trabajo clínico reduciendo los clics. La edición inline simplifica las correcciones rápidas. Se restringieron las acciones de escritura en el cliente basándose en permisos RBAC del usuario y se implementó un banner visual informativo si el historial clínico está archivado.
**Impacto:** Modificación de `frontend/src/lib/authorization.ts` para registrar los permisos de evoluciones y mapear permisos a los roles clínicos/recepción. Modificación de `frontend/src/app/dashboard/historial-clinico/page.tsx` para incorporar el modal dividido, estados de manipulación de notas y catálogo de especialistas para resolución de nombres. Modificación de `frontend/src/app/dashboard/historial-clinico/page.module.css` para añadir clases de maquetación del modal de gran escala, tarjetas de notas y badges. Todo el código pasa linter y build de Next.js sin errores ni advertencias.

### Registro 62

**Fecha:** 2026-06-20
**Decisión:** Crear la aplicación modular `evoluciones` bajo `apps.GestionClinica` utilizando URLs anidadas bajo `/api/historial-clinico/{historial_id}/evoluciones` e implementar el permiso DRF `IsMedicoOrAdminWriteAdministrativoRead`.
**Motivo:** Asegurar la consistencia del dominio clínico vinculando de manera mandatoria cada nota de evolución a un expediente (historial clínico) activo. El enrutamiento anidado previene fugas de datos y corrupción de estado de base de datos. El nuevo permiso permite dar soporte al rol de recepción (ADMINISTRATIVO) para lectura histórica y restinge la escritura únicamente a personal médico (MEDICO/ESPECIALISTA) y administradores (ADMIN).
**Impacto:** Nuevo modelo `EvolucionPaciente` con borrado protegido y constraints de unicidad; validación en serializador; registro en bitácora para todas las modificaciones físicas; permisos integrados en seeders y asignaciones de roles clínicos.

### Registro 60

**Fecha:** 2026-05-31
**Decisión:** Configurar sistema multi-agente en formato oficial Cursor bajo `.cursor/agents/` con `orchestrator` y subagentes solo para capacidades confirmadas por evidencia del repo.
**Motivo:** Necesidad de estandarizar operación en Cursor sin mezclar formatos con OpenCode, preservando trazabilidad y routing por dominio real (Django/DRF + Next.js + Docker).
**Impacto:** nuevos agentes Cursor (`backend`, `frontend`, `infra`, `architect-planner`, `reviewer`, `qa-testing`, `security`, `docs-memory`, `puds`, `diagrams-modeling`), skill de diagramas (`.cursor/skills/uml-c4-puds-diagrams/SKILL.md`) y MCP de proyecto (`.cursor/mcp.json` + ejemplo con EA). Se excluyen `mobile`, `ai-inference`, `ai-researcher` por falta de evidencia suficiente.

### Registro 61

**Fecha:** 2026-05-31
**Decisión:** Unificar definitivamente el sistema multi-agente en formato **OpenCode** y mover la configuración operativa a `.opencode/agents/` y `.opencode/skills/`.
**Motivo:** El runtime real en uso del proyecto es OpenCode; mantener paralelo Cursor + OpenCode generaba duplicidad y riesgo de deriva de prompts/routing.
**Impacto:** se actualiza `orchestrator` OpenCode con routing ampliado (`security`, `docs-memory`, `puds`, `diagrams-modeling`), se crea skill OpenCode `uml-c4-puds-diagrams`, y se retiran artefactos Cursor para evitar confusión.

### Registro 53

**Fecha:** 2026-05-30
**Decisión:** Adoptar formato oficial OpenCode para sistema multi-agente en `.opencode/agents/` (sin `README` dentro de `agents`) y mantener `.agents/agents` como legado no destructivo.
**Motivo:** Estandarizar compatibilidad con runtime OpenCode actual (frontmatter oficial `description`, `mode`, `permission`) y evitar carga accidental de agentes no deseados.
**Impacto:** nuevo `orchestrator` primary y subagentes especializados en `.opencode/agents/`; documentacion en `.opencode/README.md` y `.opencode/skills/README.md`; `mobile` no se crea por falta de evidencia de stack mobile.

### Registro 54

**Fecha:** 2026-05-30
**Decisión:** Implementar CU12/CU13/CU14 extendiendo `ConsultaMedica` (sin crear tabla separada de triaje/refracción) y exponer CU21/CU22/CU23 como endpoints de `reportes` dentro de `apps.dashboard`.
**Motivo:** minimizar complejidad de integración inicial, aprovechar flujo existente de consultas y habilitar valor funcional inmediato en frontend con cambios acotados y trazables.
**Impacto:** migración `consultas.0002_cu12_cu13_cu14_fields`; validaciones clínicas en serializer; nuevos endpoints `/api/reportes/*`; nueva ruta frontend `/dashboard/reportes`; permiso RBAC `reportes.ver` incorporado en seeders.

### Registro 55

**Fecha:** 2026-05-30
**Decisión:** Reubicar reportes clínicos en módulo backend dedicado `apps.reportes` y retirar esos handlers de `apps.dashboard`.
**Motivo:** reforzar arquitectura modular por dominio (analítica operacional dashboard vs reportes formales), reducir acoplamiento y facilitar mantenimiento/pruebas por módulo.
**Impacto:** `settings.py` agrega `apps.reportes`; `config/urls.py` incluye `apps.reportes.urls`; nuevos tests en `apps/reportes/tests`; endpoints públicos se mantienen sin cambios de ruta para evitar ruptura en frontend.

### Registro 56

**Fecha:** 2026-05-30
**Decisión:** Aumentar seeders demo para cubrir aproximadamente 6 meses de historial y remover prefijos `CUxx` de la UI de reportes.
**Motivo:** mejorar representatividad temporal de métricas/reportes y evitar exponer nomenclatura técnica de casos de uso al usuario final.
**Impacto:** `seed_dashboard_demo` pasa a patrón semanal en ventana de 6 meses; `seed_consultas_demo` incrementa volumen objetivo; `/dashboard/reportes` muestra títulos funcionales sin etiquetas CU.

### Registro 57

**Fecha:** 2026-05-30
**Decisión:** Incorporar exportación multi-formato en módulo `apps.reportes` con soporte CSV, Excel (`xlsx`) y PDF por cada reporte.
**Motivo:** necesidad operativa de compartir reportes fuera del sistema en formatos estándar para análisis, archivo e impresión.
**Impacto:** nuevos endpoints `/api/reportes/*/export` con `file_format=csv|xlsx|pdf`, integración frontend con botones de exportación por bloque, y nuevas dependencias backend (`openpyxl`, `reportlab`).

### Registro 58

**Fecha:** 2026-05-30
**Decisión:** Crear estilos dedicados para `dashboard/reportes` (`page.module.css`) y retirar nomenclatura `CUxx` de textos frontend.
**Motivo:** mejorar claridad para usuario final, elevar calidad visual y asegurar comportamiento responsivo consistente sin acoplarse a estilos genéricos del módulo clínico.
**Impacto:** layout más robusto en móvil/escritorio, controles de export con mejor jerarquía y eliminación total de referencias `CU` en `frontend/src`.

### Registro 59

**Fecha:** 2026-05-30
**Decisión:** Escalar seeders clínicos/reportes para asegurar volumen consistente de 6 meses en pacientes, citas y consultas.
**Motivo:** mejorar sentido analítico de reportes y evitar métricas pobres por dataset insuficiente.
**Impacto:** `seed_clinica` agrega base sintética idempotente (+60), `seed_dashboard_demo` aumenta densidad temporal (cada 3 días en 180 días), y `seed_consultas_demo` sube objetivo a 360 con autogeneración de citas faltantes.

### Registro 45

**Fecha:** 2026-05-07
**Decisión:** Robustecer endpoints de drilldown del dashboard validando `page` y `page_size` como enteros positivos y responder `400` en parámetros inválidos.
**Motivo:** Evitar errores 500 por `ValueError` al recibir query params malformados y mantener contrato API predecible para frontend/consumidores.
**Impacto:** `apps.dashboard.views` incorpora parseo seguro de enteros; se agregan pruebas backend para rango inválido, paginación inválida y export CSV.

### Registro 46

**Fecha:** 2026-05-07
**Decisión:** Definir `/dashboard` como URL canónica del módulo analítico y convertir `/dashboard/dashboard` en ruta legacy con redirección server-side.
**Motivo:** Evitar duplicidad de rutas para la misma vista, simplificar navegación y mejorar coherencia de UX/soporte.
**Impacto:** la lógica analítica se mueve a componente reutilizable (`DashboardAnalyticsPage`) y `dashboard/dashboard/page.tsx` ahora ejecuta `redirect('/dashboard')`.

### Registro 47

**Fecha:** 2026-05-07
**Decisión:** Añadir pruebas E2E con Playwright para validar la ruta legacy `/dashboard/dashboard` y su comportamiento de redirección a la URL canónica.
**Motivo:** Incorporar verificación automatizada de navegación crítica y prevenir regresiones en rutas tras refactor del dashboard.
**Impacto:** se agrega infraestructura Playwright (`playwright.config.ts`, script `test:e2e`, dependencia `@playwright/test`) y test `dashboard-redirect.spec.ts` con ejecución verde.

### Registro 48

**Fecha:** 2026-05-07
**Decisión:** Extender suite E2E con pruebas de guard de sesión para `/dashboard` (sin token -> `/login`, con token presente -> permanece en `/dashboard`).
**Motivo:** Validar explícitamente el comportamiento de acceso protegido del layout del dashboard y prevenir regresiones en control de sesión cliente.
**Impacto:** `dashboard-redirect.spec.ts` cubre 3 flujos críticos de navegación (legacy redirect + guard sin token + guard con token).

### Registro 49

**Fecha:** 2026-05-07
**Decisión:** Extender pruebas E2E para autorización visual por rol en Sidebar usando mocks de `/api/auth/me` y `/api/auth/permissions`.
**Motivo:** Validar reglas RBAC de navegación frontend de forma determinista sin depender del estado de datos del backend en entorno local.
**Impacto:** se agregan casos E2E para `ADMIN` (ve IAM) y `MEDICO` (oculta IAM), quedando 5 pruebas E2E en verde.

### Registro 50

**Fecha:** 2026-05-07
**Decisión:** Reorganizar la suite E2E separando casos de autenticación/guard y RBAC de sidebar en archivos distintos.
**Motivo:** Mejorar legibilidad, mantenibilidad y escalabilidad de pruebas (cada spec con una responsabilidad clara).
**Impacto:** `dashboard-redirect.spec.ts` se divide en `auth-guard.spec.ts` y `rbac-sidebar.spec.ts`; la suite sigue estable (5/5 passing).

### Registro 51

**Fecha:** 2026-05-07
**Decisión:** Incorporar seeder dedicado `dashboard-demo` para generar volumen de citas con distribución de estados orientada a métricas de dashboard.
**Motivo:** En ambientes recién reiniciados el dataset base era insuficiente para validar tendencias (cancelación/atención/drilldown/export) de forma consistente.
**Impacto:** nuevo `seeders.seed_dashboard_demo` integrado al comando `seed --only dashboard-demo`; permite poblar datos analíticos idempotentes y verificar `/api/dashboard/*` con resultados no triviales.

### Registro 52

**Fecha:** 2026-05-07
**Decisión:** Endurecer `seed_dashboard_demo` para evitar colisiones con la restricción `uq_cita_especialista_fecha_hora_activa`.
**Motivo:** Al correr `seed` completo en bases con datos previos podía intentar crear una cita `PROGRAMADA/CONFIRMADA` en un slot ya ocupado por otra cita activa del mismo especialista.
**Impacto:** el seeder ahora detecta conflicto de slot activo (`especialista + fecha_hora_inicio`) y marca el registro como existente en lugar de insertar; `python manage.py seed` vuelve a ser estable e idempotente.

### Registro 44

**Fecha:** 2026-05-07
**Decisión:** Eliminar completamente compatibilidad legacy de KPI (`/dashboard/kpi`, `/api/kpi/*`, `kpi.ver`) y consolidar contrato final en `dashboard`.
**Motivo:** Cerrar deuda de transición y evitar ambigüedad semántica/operativa entre panel y dashboard.
**Impacto:** frontend y backend quedan con naming único `dashboard`; permisos y rutas legacy removidos de código y datos semilla.

### Registro 43

**Fecha:** 2026-05-07
**Decisión:** Renombrar módulo analítico de UI/API de `KPI` a `Dashboard` y extraerlo a nueva app backend modular `apps.dashboard`.
**Motivo:** Reducir ambigüedad conceptual entre “panel” y “dashboard”, y alinear arquitectura por dominio (analítica fuera de `apps.core`).
**Impacto:** nuevas rutas `/api/dashboard/*`, frontend principal `/dashboard` para analítica, `/dashboard/inicio` para accesos rápidos administrativos, permiso nuevo `dashboard.ver` con compatibilidad temporal `kpi.ver`.

### Registro 42

**Fecha:** 2026-05-07
**Decisión:** Ajustar dependencias de `useEffect` en frontend (`Citas`, `KPI`) para cumplir `react-hooks/exhaustive-deps` sin deshabilitar reglas.
**Motivo:** Mantener lint limpio y evitar comportamientos no deterministas por cierres (`closures`) con dependencias implícitas.
**Impacto:** `closeCancelModal` y `closeReschModal` pasan a `useCallback`; `useEffect` de KPI incluye `canViewKpi` en dependencias; `npm run lint` queda en verde.

### Registro 41

**Fecha:** 2026-05-07
**Decisión:** Implementar fallback UX de desactivación en frontend para errores `409` al eliminar pacientes/especialistas con historial protegido.
**Motivo:** Mantener continuidad operativa cuando la integridad referencial impide borrado físico, evitando bloqueos de flujo en recepción/administración.
**Impacto:** `Pacientes` y `Especialistas` agregan botón `Desactivar` y flujo de confirmación tras `409` para ejecutar `PATCH activo=false` en lugar de delete.

### Registro 40

**Fecha:** 2026-05-07
**Decisión:** Convertir falla técnica de borrado de especialista con dependencias (`ProtectedError`) en respuesta de negocio controlada `409 Conflict`.
**Motivo:** Evitar error 500 en UI al eliminar especialistas con citas/consultas históricas y entregar mensaje accionable al usuario.
**Impacto:** `EspecialistaViewSet.destroy` maneja `ProtectedError`; se agregan tests para flujos `204` (sin dependencias) y `409` (con dependencias).

### Registro 39

**Fecha:** 2026-05-07
**Decisión:** Incorporar suite mínima de pruebas automáticas backend para validar política de contraseña y endpoint de permisos efectivos, y habilitar lint frontend no interactivo.
**Motivo:** Hasta ahora no existían pruebas ejecutables (`0 tests`), lo que impedía validar regresiones en seguridad de password y RBAC de sesión.
**Impacto:** Nuevos tests en `apps/users/tests` y `apps/auth/tests`; `frontend/.eslintrc.json` permite ejecutar `npm run lint` en CI/CLI sin asistente inicial.

### Registro 38

**Fecha:** 2026-05-07
**Decisión:** Endurecer política de contraseña para exigir formato alfanumérico con complejidad mínima (al menos una mayúscula, una minúscula y un número), prohibiendo símbolos y espacios.
**Motivo:** Requisito funcional explícito del producto para evitar caracteres especiales y mantener una política uniforme en cambio y recuperación de contraseña.
**Impacto:** Nuevo validador `AlphanumericComplexityValidator` en backend integrado a `AUTH_PASSWORD_VALIDATORS`; la UI de cambio/recuperación muestra reglas actualizadas para reducir errores de usuario.

### Registro 37

**Fecha:** 2026-05-03
**Decisión:** Institucionalizar un contrato de diseño para agentes en `docs/ai/DESIGN.md` y formalizar continuidad con `SKILLS_REGISTRY.md` y `PROMPTS_LIBRARY.md` para habilitar un subagente de diseño por tipo de sistema.
**Motivo:** Reducir variabilidad visual entre sesiones/agentes, mejorar trazabilidad UX y acelerar handoff diseño -> implementación frontend.
**Impacto:** Se define estructura reusable de tokens, accesibilidad, estados de componentes, perfiles por tipo de sistema y prompt reutilizable para `design-orchestrator`.

### Registro 36

**Fecha:** 2026-04-30
**Decisión:** Refinar política clínica por acción: recepción sin permiso de cancelación de citas y perfiles clínicos asistenciales sin `kpi.ver` por defecto.
**Motivo:** Aplicar mínimo privilegio y separar acciones operativas sensibles (cancelación) y visibilidad estratégica (KPI) del flujo asistencial básico.
**Impacto:** `seed_rbac_asignaciones` ajusta permisos por rol clínico; `frontend` en módulo Citas controla `crear/reprogramar/cancelar` por permisos independientes.

### Registro 35

**Fecha:** 2026-04-30
**Decisión:** Separar explícitamente roles IAM de roles clínicos mediante nuevos roles dedicados (`Recepción Clínica`, `Médico Clínico`, `Especialista Clínico`) y sincronización RBAC con limpieza de asignaciones sobrantes.
**Motivo:** Evitar acumulación accidental de privilegios (ej. personal clínico con permisos IAM de gestión de usuarios/roles) y alinear autorización con responsabilidades operativas reales.
**Impacto:** `seed_roles` agrega roles clínicos; `seed_rbac_asignaciones` sincroniza permisos/roles por usuario seed con criterio de mínimo privilegio.

### Registro 34

**Fecha:** 2026-04-30
**Decisión:** Pasar autorización clínica frontend a evaluación explícita por códigos de permiso (`modulo.accion`) y ampliar catálogo backend con permisos clínicos finos.
**Motivo:** El matching heurístico por alias podía habilitar/denegar acciones de forma ambigua; se requiere trazabilidad y control fino por acción.
**Impacto:** `seed_permisos` incorpora permisos clínicos, `seed_rbac_asignaciones` actualiza mapeos por rol y `authorization.ts` usa matrices explícitas de permisos para vista/escritura.

### Registro 33

**Fecha:** 2026-04-30
**Decisión:** Eliminar fallback legacy de resolución de permisos en `DashboardUserContext` y usar `/api/auth/permissions` como única fuente de `permissionCodes`.
**Motivo:** Ya existe endpoint dedicado y seeder RBAC que entrega datos efectivos; mantener doble estrategia elevaba complejidad y deuda técnica.
**Impacto:** Menor latencia/ramas de error en frontend de sesión; autorización UI más predecible y alineada al contrato backend de permisos efectivos.

### Registro 32

**Fecha:** 2026-04-30
**Decisión:** Incorporar seeder `rbac` para poblar asignaciones `rol_permiso` y `usuario_rol` en entornos de desarrollo.
**Motivo:** Sin asignaciones, el endpoint `/api/auth/permissions` devolvía permisos vacíos y no permitía validar RBAC efectivo end-to-end.
**Impacto:** `manage.py seed --only rbac` ahora deja usuarios base con roles/permisos útiles para pruebas (`admin` con permisos completos IAM, `dr.carlos` con perfil auditor).

### Registro 31

**Fecha:** 2026-04-30
**Decisión:** Mantener temporalmente fallback por rol en frontend hasta disponer de asignaciones `usuario_rol` seed consistentes para poblar permisos efectivos.
**Motivo:** Las pruebas en Docker muestran que `/api/auth/permissions` responde listas vacías para usuarios seed actuales por falta de vínculo usuario-rol, lo que impediría decisiones RBAC solo por permisos.
**Impacto:** UI sigue funcional con fallback por `tipo_usuario`; se prioriza crear seeder de asignaciones usuario-rol como siguiente paso para cerrar RBAC real end-to-end.

### Registro 30

**Fecha:** 2026-04-30
**Decisión:** Exponer endpoint backend `GET /api/auth/permissions` para entregar permisos efectivos y roles de la sesión actual.
**Motivo:** Evitar que frontend dependa de múltiples endpoints administrativos para resolver permisos y reducir latencia/complejidad del flujo RBAC.
**Impacto:** Nuevo `MePermissionsView` en `apps.auth`, rutas en `apps.auth.urls`, y `DashboardUserContext` prioriza esta fuente antes del fallback legacy.

### Registro 29

**Fecha:** 2026-04-30
**Decisión:** Introducir resolución de permisos efectivos en frontend (`permissionCodes`) y priorizar esa fuente para autorización de vista/escritura, manteniendo fallback por rol.
**Motivo:** Avanzar desde reglas estáticas por tipo de usuario hacia RBAC real sin romper flujo actual mientras backend no expone aún un endpoint único de permisos efectivos.
**Impacto:** `DashboardUserContext` agrega carga de permisos (roles -> permisos -> códigos) y `authorization.ts` evalúa acceso por códigos cuando existen; módulos y Sidebar consumen este nuevo esquema.

### Registro 28

**Fecha:** 2026-04-30
**Decisión:** Extender guardas de lectura por URL directa a todos los módulos clínicos principales, reutilizando `canViewClinicalModule`.
**Motivo:** Evitar bypass de navegación (usuario sin menú visible pero con acceso directo por URL) y mantener consistencia de autorización UI.
**Impacto:** `pacientes`, `especialistas`, `citas`, `consultas`, `agenda-medica` y `kpi` validan permiso de vista antes de cargar datos desde API.

### Registro 27

**Fecha:** 2026-04-30
**Decisión:** Incorporar control de visibilidad de rutas del menú por rol (`canViewRoute`) y agregar guarda de acceso directo en agenda médica.
**Motivo:** Reducir exposición de navegación no autorizada en UI y evitar que la URL directa muestre módulos clínicos a perfiles sin permiso de lectura.
**Impacto:** `frontend/src/components/Sidebar.tsx` filtra `NAV_ITEMS` por `canViewRoute`; `frontend/src/app/dashboard/agenda-medica/page.tsx` valida vista antes de consultar API.

### Registro 26

**Fecha:** 2026-04-30
**Decisión:** Centralizar autorización de acciones en frontend clínico mediante helper reusable `canWriteModule` y aplicar la política en módulos Pacientes, Especialistas/Horarios, Citas y Consultas.
**Motivo:** Evitar duplicación de reglas por pantalla, mejorar mantenibilidad y reducir inconsistencias de UX al aplicar restricciones por rol.
**Impacto:** Nuevo archivo `frontend/src/lib/authorization.ts`; acciones de escritura deshabilitadas por rol en los módulos clínicos principales y mensajes de solo lectura en UI.

### Registro 25

**Fecha:** 2026-04-30
**Decisión:** Aplicar control de escritura por rol en el módulo de Citas del frontend, usando el perfil de `/api/auth/me` ya cargado en `DashboardUserContext`.
**Motivo:** Reducir riesgo operativo y alinear la interfaz con el principio de mínimo privilegio sin esperar una capa completa de permisos finos en todos los módulos.
**Impacto:** En `frontend/src/app/dashboard/citas/page.tsx`, solo `ADMIN` y `ADMINISTRATIVO` pueden programar/reprogramar/cancelar; `MEDICO` y `ESPECIALISTA` quedan en lectura con acciones deshabilitadas y mensaje contextual.

### Registro 24

**Fecha:** 2026-04-30
**Decisión:** Reemplazar flujos de `window.prompt` en Citas por modales de aplicación para cancelar/reprogramar y enriquecer la tabla con nombres legibles.
**Motivo:** Mejorar UX operativa, reducir errores de captura y alinear la interacción de Citas con el patrón visual reutilizable del dashboard clínico.
**Impacto:** `frontend/src/app/dashboard/citas/page.tsx` ahora maneja estado de modales, validación mínima de campos y presentación de paciente/especialista por nombre en la tabla.

### Registro 23

**Fecha:** 2026-04-29
**Decisión:** Evolucionar KPI drilldown con paginación server-side, export CSV y presets rápidos de período en UI.
**Motivo:** Mejorar usabilidad analítica y escalabilidad de consulta cuando crece el volumen de citas.
**Impacto:** Endpoint `kpi/citas-drilldown` paginado, endpoint `kpi/citas-drilldown/export`, y UX de filtros rápidos en `/dashboard/kpi`.

### Registro 22

**Fecha:** 2026-04-29
**Decisión:** Extender módulo KPI con filtros de rango de fechas, endpoint drilldown de citas por estado y cache de snapshots (TTL 5 min).
**Motivo:** Mejorar análisis operacional en tiempo real sin penalizar consultas repetidas al backend y permitir investigación de causas desde la UI.
**Impacto:** Nuevos parámetros `date_from/date_to` en endpoints KPI, nuevo `GET /api/kpi/citas-drilldown` y frontend con drilldown interactivo.

### Registro 21

**Fecha:** 2026-04-29
**Decisión:** Implementar un dashboard KPI clínico inicial con dos endpoints agregados (`kpi/summary`, `kpi/operativo`) y vista frontend responsiva dedicada.
**Motivo:** Dar visibilidad ejecutiva/operativa inmediata sobre adopción clínica (atención, cancelación, carga diaria por especialista) sin depender de BI externo.
**Impacto:** Nuevo módulo `/dashboard/kpi`, navegación actualizada en sidebar y base de métricas reusable para iteraciones de drilldown.

### Registro 20

**Fecha:** 2026-04-29
**Decisión:** Añadir seeder `consultas-demo` para completar datos de pruebas del flujo cita -> consulta -> estado `ATENDIDA`.
**Motivo:** Permitir validación rápida del módulo de consultas y de transiciones clínicas sin carga manual repetitiva.
**Impacto:** Nuevo archivo `backend/seeders/seed_consultas_demo.py`; `manage.py seed` ahora soporta `--only consultas-demo`.

### Registro 19

**Fecha:** 2026-04-29
**Decisión:** Incorporar seeder clínico único (`seed_clinica`) dentro del comando `manage.py seed` con flag `--only clinica`.
**Motivo:** Acelerar pruebas manuales e integración frontend-backend con datos mínimos pero realistas del flujo clínico (paciente -> especialista -> horario -> cita).
**Impacto:** Menor fricción de arranque en entornos nuevos; seeding idempotente para demos y QA sin depender de carga manual.

### Registro 18

**Fecha:** 2026-04-29
**Decisión:** Implementar un mini plan frontend por fases: (F1) refresh automático de token en Axios, (F2) especialistas+horarios, (F3) citas+agenda+consultas con pantallas operativas base.
**Motivo:** Reducir fricción de sesión en operaciones largas y cerrar un primer flujo clínico end-to-end en panel sin esperar refinamientos avanzados de UX.
**Impacto:** Nuevas rutas clínicas en `/dashboard/*`, patrón de UI reutilizable en `dashboard/clinic.module.css`, y base funcional para iteración posterior en validaciones por campo, selectores enriquecidos y permisos por rol.

### Registro 17

**Fecha:** 2026-04-29
**Decisión:** Implementar primero en frontend el módulo de `pacientes` como vertical completo (ruta dedicada + tabla + filtros + formulario CRUD) antes de extender citas/agenda/consultas.
**Motivo:** Entregar un flujo clínico usable de extremo a extremo con baja complejidad de reglas, validar contrato API real y consolidar patrón UI reutilizable para módulos restantes.
**Impacto:** Nueva página `frontend/src/app/dashboard/pacientes/page.tsx`, estilos dedicados `page.module.css`, y entrada de navegación en `Sidebar`; base lista para replicar estructura en especialistas/citas.

### Registro 14

**Fecha:** 2026-04-29
**Decisión:** Implementar backend clínico con cuatro apps modulares nuevas: `apps.pacientes`, `apps.especialistas`, `apps.citas`, `apps.consultas`.
**Motivo:** Mantener separación por dominio (datos maestros, disponibilidad, agenda, acto clínico) y evitar acoplar lógica en una sola app monolítica.
**Impacto:** Nuevos modelos, rutas y migraciones; endpoints clínicos bajo `/api/` para pacientes, especialistas, horarios, citas, agenda y consultas.

### Registro 15

**Fecha:** 2026-04-29
**Decisión:** En programación de citas, validar disponibilidad por horario de especialista + evitar solapamientos en capa servicio y en BD con `UniqueConstraint` condicional para citas activas (`PROGRAMADA`/`CONFIRMADA`).
**Motivo:** Reducir riesgo de doble reserva por error funcional o concurrencia.
**Impacto:** Reglas de negocio centralizadas en `apps.citas.services.validar_disponibilidad`, respuesta consistente a conflictos de agenda y mayor integridad temporal.

### Registro 16

**Fecha:** 2026-04-29
**Decisión:** Estandarizar documentacion de API con OpenAPI/Swagger usando `drf-spectacular`.
**Motivo:** Acelerar integracion frontend, pruebas manuales y onboarding tecnico con contrato vivo de endpoints.
**Impacto:** Nuevas rutas `/api/schema/`, `/api/docs/`, `/api/redoc/`; `DEFAULT_SCHEMA_CLASS` activo en DRF y dependencia agregada en `requirements/base.txt`.

### Registro 10

**Fecha:** 2026-04-29
**Decisión:** Crear sistema de agentes local en `.agents/agents/` con un agente principal **`orchestrator`** y especialistas por dominio: `backend`, `frontend`, `architecture`, `code-review`, `qa-testing`.
**Motivo:** Formalizar orquestación por tipo de tarea, reducir ambigüedad operativa y mejorar consistencia técnica en ejecuciones multi-área.
**Impacto:** Nuevos prompts versionables en repo para cada agente, reglas explícitas de enrutamiento y posibilidad de invocar skills desde `orchestrator` según intención del usuario.

### Registro 11

**Fecha:** 2026-04-29
**Decisión:** Estandarizar entorno de trabajo en VS Code con configuración versionada en `.vscode/settings.json` y `.vscode/tasks.json`.
**Motivo:** Reducir fricción operativa, evitar variaciones de flujo entre sesiones y acelerar comandos repetitivos del stack Docker + Django + docs/ai.
**Impacto:** Tareas listas para `Run Task` (up/build, migrate, seed, git status, apertura de archivos clave de memoria) y defaults de editor/terminal consistentes en Windows.

### Registro 12

**Fecha:** 2026-04-29
**Decisión:** Adoptar formato **híbrido** en agentes locales (`.agents/agents/*.md`): frontmatter machine-readable + cuerpo detallado operativo.
**Motivo:** Mantener compatibilidad con orquestadores/runtimes que parsean metadata y, al mismo tiempo, conservar instrucciones extensas para ejecución humana/CLI.
**Impacto:** Se añadieron campos `name`, `description`, `model`, `tools`, `triggers`, `escalate_to` y `output_schema` en todos los agentes existentes.

### Registro 13

**Fecha:** 2026-04-29
**Decisión:** Incorporar dos agentes adicionales en `.agents/agents/`: `architect-planner` e `infra`.
**Motivo:** Cubrir explícitamente dos vacíos de operación: planificación arquitectónica por fases y ejecución/validación de infraestructura por entorno.
**Impacto:** `orchestrator` dispone de destinos especializados para cambios estructurales y tareas Docker/deploy/env, reduciendo sobrecarga en agentes de implementación.

### Registro 9

**Fecha:** 2026-04-17
**Decisión:** Nueva app **`apps.security`** (`label=oftalmologia_security`) con modelos `ConfiguracionLoginSeguridad`, `BloqueoIntentoLogin`, `TokenRecuperacion` (mismos `db_table`), más `login_lockout.py`, `tokens.py`, `emails.py` y admin asociado. **`apps.users`** reduce a `Usuario` + CRUD + managers. Migración **`security.0001_initial`** con `SeparateDatabaseAndState` (solo estado); **`users.0005`** elimina esos modelos del estado de `users` sin `DROP TABLE`.
**Motivo:** Menos ruido en la app de usuario; agrupar políticas de acceso y recuperación en un módulo coherente.
**Impacto:** Imports actualizados en `apps.auth`; orden `INSTALLED_APPS`: `users` → `security` → `auth`.

### Registro 8

**Fecha:** 2026-04-17
**Decisión:** Extraer autenticación HTTP a la app Django **`apps.auth`** (paquete `apps/auth/` con submódulos `views/login.py`, `logout.py`, `profile.py`, `password_change.py`, `password_reset.py`, `security.py` + `serializers.py` + `urls.py`). `apps.users` conserva modelos (`Usuario`, recuperación, bloqueo login), `tokens.py`, `emails.py`, `login_lockout.py` y solo el **ViewSet** de usuarios. `INSTALLED_APPS`: `apps.auth` con `AppConfig.label = 'oftalmologia_auth'` para no colisionar con `django.contrib.auth`.
**Motivo:** Modularidad por responsabilidad; `users` dejaba de ser solo “dominio usuario”.
**Impacto:** `config/urls.py` incluye `apps.auth.urls` antes de `apps.users.urls`. Rutas `/api/auth/*` y `/api/security/login-config` sin cambio de path.

### Registro 7

**Fecha:** 2026-04-17
**Decisión:** Recuperación de contraseña por **código numérico** enviado por correo (MailHog/SMTP), con vigencia **`PASSWORD_RESET_CODE_TTL_SECONDS`** (por defecto 30 s, acotado 10–3600 s en código) y longitud **`PASSWORD_RESET_CODE_LENGTH`** (4–12 dígitos). Flujo API: `POST /api/auth/reset-password/` → `POST .../verify-code/` → `POST .../confirm/` con `email` + `codigo` + nueva contraseña. Se quitó `unique` global en `tokens_recuperacion.token` para permitir el mismo patrón numérico en distintos usuarios (búsqueda por usuario + código).
**Motivo:** Pedido de producto: verificación tipo OTP en pantalla dedicada (`/forgot-password`) sin depender de enlaces con token largo.
**Impacto:** Migración `users.0004_alter_tokenrecuperacion_token`; variables nuevas en `.env.example`; **breaking** para clientes que usaban `POST .../confirm/` solo con campo `token` — ahora requieren `email` y `codigo`.

### Registro 6

**Fecha:** 2026-04-16
**Decisión:** Bloqueo temporal por **clave de login** (email normalizado en minúsculas o username sin `@`) con umbrales en BD editables solo por **ADMIN** (`ConfiguracionLoginSeguridad` + `BloqueoIntentoLogin`); sin librería externa.
**Motivo:** Cumplir requisito de bloqueo tras intentos fallidos y duración configurable desde el panel; la fuente de verdad debe ser el backend (no el navegador). Se descartó bloqueo por IP para alinear con el alcance acordado.
**Impacto:** `LoginView` devuelve **429** con `retry_after_seconds`; `GET/PATCH /api/security/login-config/`; página `/dashboard/seguridad-login`; login UI muestra cuenta atrás. No altera el campo `estado=BLOQUEADO` administrativo del usuario.

### Registro 5

**Fecha:** 2026-04-15
**Decisión:** Proxy de API en Next.js (`rewrites` `/api/*` → Django) y JWT en cliente vía localStorage + Axios.
**Motivo:** El navegador llama al mismo origen (`/api/...`); el servidor Next reenvía a la URL interna del backend (en Docker `http://backend:8000/api` vía `INTERNAL_API_URL`), evitando CORS y simplificando dev. Los tokens se adjuntan en el cliente con interceptor estándar.
**Impacto:**
- `frontend/next.config.js`: `internalApiBase()`, rewrites, `output: 'standalone'`.
- `frontend/src/lib/auth.ts`, `api.ts`: persistencia access/refresh, logout con body `refresh`.
- Login y páginas dashboard consumen API real (IAM + bitácora).

### Registro 4

**Fecha:** 2026-03-30
**Decisión:** Zona horaria de negocio Bolivia (`America/La_Paz`) y documentación del esquema en `BaseDeDatos.sql`.
**Motivo:** El software lo usa personal en Santa Cruz / Bolivia; la hora mostrada debe ser coherente (UTC-4). El archivo DBML debía reflejar SI1 + `consultas_medicas` y la eliminación de `pacientes.id_usuario`.
**Impacto:**
- Django: `TIME_ZONE = 'America/La_Paz'` en `settings.py`.
- Frontend: utilidades en `frontend/src/lib/timezone.ts` y UI de bitácora/dashboard usando `Intl` con `America/La_Paz`.
- `BaseDeDatos.sql`: tabla `consultas_medicas`, `tipo_usuario` sin PACIENTE, `pacientes` sin FK a usuarios.

### Registro 3

**Fecha:** 2026-03-30
**Decisión:** Bitácora en frontend como página dedicada (`/dashboard/bitacora`) con datos mock hasta conectar API.
**Motivo:** La bitácora es crítica para auditoría; se necesita vista operativa con hora Bolivia antes del cableado JWT completo.
**Impacto:** Nueva ruta en App Router; Sidebar ya enlazaba a `/dashboard/bitacora`.

**Actualización 2026-04-15:** La página consume `GET /api/bitacora/` con autenticación JWT; se mantiene el criterio de hora Bolivia en UI.

---

### Registro 2

**Fecha:** 2026-03-29
**Decisión:** Adaptación del proyecto Si2 al modelo SI1 — eliminar paciente como actor del sistema y eliminar la app mobile.
**Motivo:** El SI1 es un Sistema de Información/Gestión de uso exclusivo del personal interno. Los pacientes son entidades de datos, no usuarios. No existe interfaz móvil.
**Impacto:**
- `TipoUsuario.PACIENTE` eliminado del enum.
- FK `pacientes.id_usuario` eliminada del modelo y su migración (`0002_initial.py`) borrada.
- `RegisterView` (registro público) y `RegistroSerializer` eliminados.
- Endpoint `POST /auth/register/` removido de URLs.
- Rol 'Paciente' eliminado del seeder.
- Carpeta `/mobile` eliminada del monorepo.


**Fecha:** 2026-03-21
**Decisión:** Purga intensiva (Lienzo en Blanco) para Frontend Web, App Mobile y Backend en el Scaffold inicial.
**Motivo:** Evitar arrastrar configuraciones boilerplate basuras o vistas dummy de ejemplo que limiten o confundan el stack real a construir paso a paso. Se optó por un control hiper-granular por el Arquitecto Humano en el ecosistema multiplataforma (Web + Mobile).
**Impacto:** El Backend tiene comentadas sus `LOCAL_APPS`. El Frontend Web es un cascarón Next.js limpio. La app Mobile Flutter fue inicializada pero espera sus directivas de ui/theming. Todo se construirá bajo demanda estricta.
