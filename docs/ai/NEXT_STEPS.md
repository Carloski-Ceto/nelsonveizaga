# NEXT STEPS

Lista priorizada de los siguientes pasos a realizar en el proyecto Oftalmología SI1.

## Inmediato
- [x] Ajustar flujo frontend `usuario -> medico -> especialista`: especialistas se crean desde `id_medico` y módulo médicos elimina campos `especialidad_principal/subespecialidad` en UI.
- [x] Corregir imports backend tras reestructuración (`backend.apps.*` -> `apps.*`) y validar en Docker (`check`, `showmigrations`, `makemigrations --check --dry-run`, `seed --only admin`).
- [x] Consolidar sistema multi-agente en **OpenCode** (`.opencode/agents/`) y retirar configuración paralela Cursor para evitar deriva.
- [x] Crear skill de diagramas PUDS/UML/C4 en `.opencode/skills/uml-c4-puds-diagrams/SKILL.md`.
- [x] Configurar sistema multi-agente OpenCode oficial en `.opencode/agents/` con `orchestrator` + subagentes por dominio.
- [x] Documentar sistema OpenCode en `.opencode/README.md` y estado de skills en `.opencode/skills/README.md`.
- [x] Levantar Docker (`docker-compose up --build`) y verificar migraciones sin errores.
- [ ] Regenerar entorno backend para instalar `drf-spectacular` y validar `/api/docs/` + `/api/schema/`.
- [ ] Ejecutar migraciones nuevas de dominio clínico (`pacientes`, `especialistas`, `citas`, `consultas`) y validar constraints de horarios/solapamiento.
- [x] Ejecutar seed: `docker-compose exec backend python manage.py seed` (o `docker compose` según tu CLI).
- [x] Automatizar bootstrap backend con `migrate + seed` al iniciar contenedor (flags `AUTO_MIGRATE`/`AUTO_SEED`).
- [x] Ejecutar seed clínico base: `docker compose exec backend python manage.py seed --only clinica`.
- [x] Ejecutar seed consultas demo: `docker compose exec backend python manage.py seed --only consultas-demo`.
- [x] Cliente Next: interceptar 401 → intentar `POST /api/auth/token/refresh/` con refresh guardado; solo si falla, limpiar sesión y mandar a `/login`.
- [ ] Probar flujo de trabajo con `orchestrator` + agentes especialistas en casos reales (backend/frontend/arquitectura/review/testing).
- [ ] Probar tareas VS Code (`Run Task`) para validar comandos rápidos en entorno real.
- [ ] Validar que runtime/agente que uses interpreta correctamente frontmatter en `.agents/agents/*.md`.
- [ ] Probar routing del `orchestrator` con casos que deban escalar a `architect-planner` e `infra`.
- [ ] Ejecutar `opencode debug config` para validar carga de agentes en runtime local (si CLI disponible en entorno).

## Corto Plazo
- [x] Frontend: conectar módulos clínicos al backend nuevo (pacientes, especialistas, horarios, citas, agenda, consulta) en versión base operativa.
- [x] Frontend: formularios base para programar/reprogramar/cancelar cita con feedback de error API.
- [x] Frontend + API: flujo «olvidé contraseña» con código por correo (`/forgot-password`, MailHog en dev); TTL configurable, renovación de vigencia al verificar código, avisos UI tipo «info».
- [x] Frontend: Login contra API real; tokens en localStorage; Axios + Bearer; logout API.
- [x] Frontend: Guard de rutas `/dashboard/*` (redirección si no hay access token).
- [x] Frontend: Bitácora conectada a `GET /api/bitacora/` (paginación y filtros).
- [x] Frontend: Listados IAM (usuarios, roles, permisos) contra API.
- [ ] Frontend: Formularios y acciones de escritura IAM (crear/editar usuario, roles, etc.) según endpoints y permisos.
- [x] Frontend: Módulo de gestión de Pacientes (tabla, alta, edición, eliminación, filtros y búsqueda).
- [x] Implementar CU12/CU13/CU14 en flujo de consultas (triaje + PIO, refracción, diagnóstico ampliado).
- [x] Implementar CU21/CU22/CU23 con endpoints y vista de reportes por período.

## Mediano Plazo
- [ ] Continuar fase 2 de paquetización backend tras piloto de `roles`: mover físicamente `permisos`, `users`, `auth`, `security` con compatibilidad y regresión por app.
- [x] Dashboard KPI inicial (`/dashboard/kpi`) con endpoints agregados backend (`/api/kpi/summary`, `/api/kpi/operativo`) y diseño responsivo.
- [x] KPI avanzado: filtros por rango de fechas, drilldown por estado y snapshot cacheado en backend.
- [x] KPI pro: paginación de drilldown, export CSV y presets rápidos de período.
- [x] Frontend: Endurecer UX de Citas (base) reemplazando `prompt` por modales de cancelación/reprogramación y confirmación contextual.
- [x] Frontend: Endurecer UX de Citas (siguiente) con validación por campo y foco/teclado accesible en modales.
- [ ] Frontend: Endurecer UX de Citas (siguiente iteración) con estados avanzados de agenda y reglas de negocio guiadas por contexto.
- [ ] Frontend: Módulo de Historias Clínicas (rutas anidadas bajo historial; diagnósticos, recetas, etc.).
- [ ] Conectar `Médicos` con `Consultas` para seleccionar médico tratante explícito cuando aplique flujo clínico.
- [ ] Frontend: Mejorar módulo de Especialistas/Disponibilidades con validaciones de conflictos por bloque en edición (ya existe modal de edición).
- [ ] Revisión seguridad sesión: cookies http-only / CSRF si el despliegue lo exige.

## Largo Plazo
- [ ] Reportes y estadísticas (citas por período, pacientes por estado, etc.).
- [ ] Manejo de imágenes oftalmológicas (storage local o S3).
- [ ] Despliegue en nube (VM/VPS con Nginx reverso y volúmenes Docker).

## Pendientes Técnicos
- [x] Bloqueo temporal configurable por intentos fallidos de login (clave de login; ADMIN edita umbrales).
- [x] Permisos granulares expuestos en backend (`apps.permisos`); frontend ya distingue 403 en listados IAM/bitácora.
- [ ] Política explícita en UI: qué ve cada rol (ocultar rutas o deshabilitar acciones según permisos del JWT o `/api/auth/me/`).
  - Avance: Pacientes, Especialistas/Horarios y Citas aplican escritura solo para `ADMIN`/`ADMINISTRATIVO`; Consultas permite escritura para `ADMIN`/`MEDICO`/`ESPECIALISTA`.
  - Avance: Sidebar ya oculta rutas según rol con helper centralizado y Agenda médica valida vista por acceso directo.
  - Avance: guardas de vista por URL directa extendidas a módulos clínicos principales (`pacientes`, `especialistas`, `citas`, `consultas`, `agenda`, `kpi`).
  - Avance: frontend ya resuelve `permissionCodes` y evalúa acceso con permisos efectivos cuando están disponibles.
  - Completado: endpoint backend dedicado `GET /api/auth/permissions` ya expuesto.
  - Pendiente: mover completamente frontend a este endpoint y retirar fallback por múltiples llamadas cuando backend esté validado en todos los entornos.
  - Completado operativo: seeder `rbac` agregado para asignación `rol_permiso` y `usuario_rol`; endpoint validado con permisos no vacíos.
  - Completado de refactor: `DashboardUserContext` ya depende de `/api/auth/permissions` como fuente única.
  - Completado: contrato inicial de permisos clínicos finos (`pacientes.*`, `especialistas.*`, `citas.*`, `consultas.*`, `agenda.ver`, `kpi.ver`) con enforcement explícito en frontend.
  - Completado: política clínica base por roles dedicados (`Recepción Clínica`, `Médico Clínico`, `Especialista Clínico`) sin mezclar permisos IAM.
  - Completado: recepción sin `citas.cancelar`, y médico/especialista sin `kpi.ver` por defecto.
  - Pendiente: validar con stakeholders si `kpi.ver` debe habilitarse a jefaturas médicas mediante rol adicional (p. ej. `Coordinador Clínico`).
- [ ] Evaluar paginación y filtros avanzados en listas grandes de dominio clínico.
- [x] Agregar export CSV para reportes de pacientes atendidos, citas por período y consultas por especialista.
- [x] Agregar export en CSV, Excel y PDF para reportes de pacientes, citas y consultas por especialista.
- [ ] Incorporar filtros por especialista y estado en UI de `/dashboard/reportes`.
- [ ] Agregar filtro visual `especialista` en bloque "Consultas por especialista" para auditoría rápida de cobertura por médico.
- [ ] Agregar detalle opcional de "último especialista que atendió" en bloque "Pacientes atendidos" para mayor trazabilidad clínica.
- [ ] Añadir selector visual único de formato de exportación (CSV/Excel/PDF) con preferencia persistente por usuario en `/dashboard/reportes`.
- [x] Persistir preferencias de personalización de reportes por usuario (orden, dirección, búsquedas) en localStorage o perfil.
- [ ] Extender export para respetar también columnas visibles activas (además de filtros/orden), vía `columns=` en backend.
- [x] Ampliar dataset demo para reportes a 6 meses con mayor densidad y coherencia entre pacientes/citas/consultas.
- [ ] Añadir comando smoke `seed --only reportes-6m` que encadene `clinica + dashboard-demo + consultas-demo` en una sola ejecución.
- [x] Limpiar etiquetas `CUxx` en textos visibles de la UI de reportes.
- [ ] Refactor fase 2 de `apps.consultas`: evaluar descomposición en submódulos internos (`triaje`, `refraccion`, `diagnostico`) con contratos y migración progresiva sin romper API.
- [ ] Ampliar suite E2E Playwright (login, guards de rol, flujo citas y fallback 409 desactivar).
- [ ] Añadir seeder complementario para series mensuales largas (>= 90 días) orientado a pruebas de tendencia dashboard.
- [ ] Agregar validación automática post-seed para `/api/dashboard/*` en script de smoke (status + shape mínima de payload).
- [ ] Estandarizar plantilla para nuevos agentes en `.agents/agents/` (scope, guardrails, output contract).
- [ ] Implementar artefacto operativo del subagente `design-orchestrator` en `.agents/agents/` y conectarlo en reglas de enrutamiento del `orchestrator`.
- [ ] Crear `docs/ai/UI_UX_SKILLS.md` para registrar patrones visuales reusables derivados de `DESIGN.md`.
- [x] Evaluar retiro definitivo de alias legacy `/dashboard/kpi` y permisos `kpi.ver` tras estabilizar clientes.
- [ ] Evaluar si onboarding/ayuda contextual de contraseña requiere indicador en vivo de cumplimiento (checklist mayúscula/minúscula/número/alfanumérico).
- [x] Corregir warnings `react-hooks/exhaustive-deps` en `dashboard/citas` y `dashboard/kpi` para dejar lint limpio sin warnings.
- [ ] Extender UX en `/dashboard/especialistas` para ofrecer acción "Desactivar" cuando backend devuelva `409` al eliminar por dependencias clínicas.
- [x] Extender UX en `/dashboard/especialistas` y `/dashboard/pacientes` para ofrecer acción "Desactivar" cuando backend devuelva `409` al eliminar por dependencias clínicas.
- [x] Hardening de `GET /api/dashboard/citas-drilldown`: validar `page/page_size` y responder `400` en parámetros inválidos.
- [x] Agregar pruebas backend de dashboard para rango inválido, paginación inválida y export CSV.
- [x] Eliminar warning de `INTERNAL_API_URL` en compose evitando interpolación redundante en `environment` del servicio frontend.
- [x] Evaluar redirección técnica de `/dashboard/dashboard` -> `/dashboard` para unificar URL canónica del módulo analítico.
