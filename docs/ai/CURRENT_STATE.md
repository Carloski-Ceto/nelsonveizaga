# CURRENT STATE

## Edición de recetas ópticas emitidas (2026-06-22)
- La receta ya emitida puede corregirse mediante `PUT/PATCH /api/historial-clinico/{historial_id}/recetas-opticas/{id}` sin crear otra receta ni consumir otra consulta.
- Se pueden modificar indicaciones, graduación, datos de producto y el tipo `ANTEOJOS`/`CONTACTO`/`AMBOS`; consulta, historial, emisor y fecha de emisión permanecen inmutables.
- El reemplazo de detalles se ejecuta en una transacción con bloqueo de fila. `POST` conserva la restricción de una receta por consulta y `DELETE` continúa deshabilitado.
- Solo `ADMIN` o el `ESPECIALISTA` asignado pueden editar. Se agregó `recetas_opticas.editar` y auditoría `EDITAR` en bitácora.
- Frontend: modo de edición sobre el mismo formulario, precarga de la receta, cambio de tipo conservando datos compatibles, consulta bloqueada, cancelación y feedback accesible.
- Validación: ESLint focalizado aprobó. Build Next quedó bloqueado en compilación; TypeScript global está bloqueado por errores preexistentes de `SpeechRecognition` en Reportes; Docker no respondió antes del timeout y la suite backend queda pendiente de ejecución.

## Ajuste visual CU17 (2026-06-22)
- Corregido el desbordamiento horizontal del formulario de recetas ópticas: columnas principal/formulario y cuadrículas de campos ahora se adaptan al ancho disponible sin recortar controles.
- Las ayudas de Anteojos y Lentes de contacto se muestran debajo de su título y permiten salto de línea completo.
- El historial de recetas emitidas muestra condicionalmente indicaciones generales y observaciones por tipo de corrección/ojo; la versión imprimible conserva la misma información.
- El usuario confirmó el flujo CU17 operativo con el seeder demo. Este ajuste frontend queda pendiente de comprobación visual posterior, sin levantar servicios en esta sesión.

## Seeder CU17 demo (2026-06-22, implementación estática)
- Registrado `python manage.py seed --only cu17-demo` para garantizar un paciente con historial activo, cita atendida y consulta con refracción OD/OI pendiente de receta óptica.
- El escenario reutiliza una consulta mientras siga sin receta; después de emitir, una nueva ejecución crea una reconsulta sin sobrescribir el historial.
- Agregadas dos pruebas unitarias del seeder. El usuario confirmó que el escenario demo funciona; la ejecución automatizada de esas pruebas no se verificó en esta sesión.

## Prerrequisito CU17 — permisos de Citas (2026-06-21, corrección estática)
- La pantalla de Citas ahora espera a que `DashboardUserContext` termine de resolver perfil y permisos antes de mostrar denegaciones o cargar datos.
- El seeder RBAC asigna `Administrador del Sistema` a todos los usuarios con `tipo_usuario=ADMIN`, sin depender de un username concreto.
- Pendiente ejecutar `seed --only rbac`, renovar la sesión y validar el flujo cita -> consulta con CU13 -> receta óptica.

## Frontend CU17 (2026-06-21, implementación estática)
- Módulo `frontend/src/app/dashboard/recetas-opticas/` alineado con el contrato backend final: lectura clínica general y emisión solo para `ESPECIALISTA` o `ADMIN`.
- Flujo paciente -> historial inmutable -> consulta con refracción -> anteojos/contacto/ambos; precarga ESF/CIL/EJE desde CU13 y captura campos específicos de cada corrección.
- Carga de recetas desacoplada de consultas para que perfiles de solo lectura no fallen por un `403` del endpoint de consultas.
- Agregados formulario componentizado por ojo, campos de prisma/base, marca/modelo/material/reemplazo, validaciones HTML, feedback accesible, responsive e impresión clínica completa.
- Pendiente validación runtime: build/lint frontend, migración y tests backend, seed RBAC y prueba integrada por roles.

## Estado actual del proyecto
**Oftalmología SI1 — Clínica de Ojos Norte.** Backend Django + frontend Next.js (panel web IAM y auditoría). Modelo SI1: paciente = datos sin login; sin app móvil; sin registro público.

## Backend
- **CU17 recetas ópticas (2026-06-21, implementación estática):** creado `apps.GestionClinica.recetas_opticas` con modelos de cabecera/detalle, relación `ConsultaMedica 1 -> 0..1 RecetaOptica`, historial inmutable por reconsulta, API nested de creación/lectura, servicio transaccional, bitácora, migración inicial escrita, constraints clínicos y suite de 12 pruebas. Solo `ESPECIALISTA` asignado a la consulta o `ADMIN` puede emitir; `MEDICO` no puede crear. Pendiente ejecutar migración, tests y `makemigrations --check` cuando se autorice levantar el entorno.
- **Fix imports por reestructuración de paquetes (2026-06-01):** se reemplazaron imports inválidos `from backend.apps...` por `from apps...` en todo `backend/`, alineando dominios `apps.Usuarios.*`, `apps.GestionClinica.*`, `apps.ReportesEstadisticas.*` sin cambios de lógica.
- **Validación en Docker (2026-06-01):** `manage.py check` OK, `showmigrations` sin pendientes, `makemigrations --check --dry-run` sin cambios detectados, `seed --only admin` idempotente (0 creados, 1 existente).
- **Bootstrap automático en contenedor backend (2026-05-31):** `entrypoint.sh` ahora ejecuta automáticamente `migrate` y `seed` al iniciar el contenedor (controlado por envs `AUTO_MIGRATE` y `AUTO_SEED`, ambos `true` por defecto en `docker-compose.yml`).
- **Paquetización lógica por dominio CU (2026-05-30):** se crea estructura de paquetes lógicos en `backend/apps`:
  - `Usuarios/` (CU1-CU6)
  - `GestionClinica/` (CU7-CU17)
  - `HistorialClinico/` (CU18-CU20)
  - `ReportesEstadisticas/` (CU21-CU23, CU25)
  - `Bitacora/` (CU24)
  con aliases no disruptivos hacia apps reales actuales (`apps.auth`, `apps.users`, `apps.roles`, etc.).
- **Mapa formal CU->app:** nuevo `backend/apps/PACKAGE_CU_MAP.md` documenta cobertura actual y CUs pendientes (CU15-CU20 parcialmente/no implementados en módulo dedicado).
- **Paquetización fase 2 iniciada (traslado físico piloto):** módulo de roles movido a `apps/Usuarios/roles` como app Django activa (`INSTALLED_APPS: apps.Usuarios.roles`, include URLs desde `apps.Usuarios.roles.urls`) manteniendo compatibilidad de imports legacy vía wrappers en `apps.roles.*`.
- **TIME_ZONE:** `America/La_Paz` (Bolivia, UTC-4, sin horario de verano). Las fechas se almacenan en UTC (`USE_TZ = True`).
- **Usuario:** tipos `ADMIN`, `ADMINISTRATIVO`, `MEDICO`, `ESPECIALISTA` (sin `PACIENTE`).
- **Bloqueo temporal por login:** tras N intentos fallidos con la misma clave (email en minúsculas o username tal cual), el login devuelve **429** con `retry_after_seconds`. Umbrales en BD: `configuracion_login_seguridad` (fila única); estado por clave en `bloqueo_intento_login`. **Solo ADMIN:** `GET/PATCH /api/security/login-config/`. Panel: `/dashboard/seguridad-login`. Independiente del estado manual `BLOQUEADO` del usuario.
- **Paciente:** sin FK a `usuarios`.
- **Consultas médicas:** `apps.consultas` — `consultas_medicas` (OneToOne con `citas`, FK a `pacientes` y `especialistas`); al crear consulta, la cita pasa a `ATENDIDA`.
- **Fix backend consultas (2026-04-29):** corregida validación en `ConsultaMedicaSerializer.validate` para comparar objetos FK correctamente (`id_paciente`/`id_especialista`) y evitar `KeyError: 'id_paciente_id'` al registrar consulta.
- **API bajo** `/api/` (sin prefijo `v1` en `config/urls.py`). Incluye `apps.core`, **`apps.auth`**, **`apps.security`**, **`apps.users`**, `roles`, `permisos`, `bitacora`, `pacientes`, `especialistas`, `citas`, `consultas`.
- **Documentacion API (OpenAPI):**
  - `GET /api/schema/` (spec OpenAPI)
  - `GET /api/docs/` (Swagger UI)
  - `GET /api/redoc/` (ReDoc)
  - Implementado con `drf-spectacular`.
- **Nuevos endpoints clínicos (backend):**
  - `pacientes`: CRUD `GET/POST /api/pacientes`, `GET/PATCH/DELETE /api/pacientes/{id}`.
  - `especialistas`: CRUD `GET/POST /api/especialistas`, `GET/PATCH/DELETE /api/especialistas/{id}`.
  - `horarios`: CRUD `GET/POST /api/horarios-especialista`, `GET/PATCH/DELETE /api/horarios-especialista/{id}`.
  - `citas`: CRUD base + acciones `POST /api/citas/{id}/reprogramar`, `POST /api/citas/{id}/cancelar`.
  - `agenda`: `GET /api/agenda-medica` (solo lectura por rol médico/admin).
  - `consultas`: CRUD `GET/POST /api/consultas-medicas`.
  - `evoluciones`: CRUD `GET/POST /api/historial-clinico/{historial_id}/evoluciones`, `GET/PUT/DELETE /api/historial-clinico/{historial_id}/evoluciones/{id}`.
  - `recetas`: CRUD `GET/POST /api/historial-clinico/{historial_id}/recetas`, `GET/PUT/PATCH/DELETE /api/historial-clinico/{historial_id}/recetas/{id}`.
  - `antecedentes`: CRUD `GET/POST /api/historial-clinico/{historial_id}/antecedentes`, `GET/PUT/DELETE /api/historial-clinico/{historial_id}/antecedentes/{id}`.
- **Bitácora:** `GET /api/bitacora/` (lectura; permisos según rol); escritura desde el backend en operaciones que registren eventos.
- **Seed unificado:** `python manage.py seed` en `apps/core/management/commands/seed.py` — ejecuta `seeders.seed_admin`, `seeders.seed_roles`, `seeders.seed_permisos`, `seeders.seed_rbac_asignaciones`, `seeders.seed_clinica`, `seeders.seed_consultas_demo`, `seeders.seed_dashboard_demo`. Opción `--only admin|roles|permisos|rbac|clinica|consultas-demo|dashboard-demo`.
- **Seeder clínico (`--only clinica`):** crea datos base idempotentes para demo (usuarios clínicos, especialistas, pacientes, horarios y cita futura).
- **Seeder consultas demo (`--only consultas-demo`):** crea consultas médicas idempotentes a partir de citas `PROGRAMADA/CONFIRMADA` y marca esas citas como `ATENDIDA`.
- **Robustez seed consultas demo:** si ya no hay citas `PROGRAMADA/CONFIRMADA`, el seeder genera una cita futura mínima con datos clínicos existentes y luego crea la consulta demo (evita fallar el `seed` completo).
- **Recuperación de contraseña:** `POST /api/auth/reset-password/` (email) envía correo con código numérico; `POST /api/auth/reset-password/verify-code/` (`email`, `codigo`); `POST /api/auth/reset-password/confirm/` (`email`, `codigo`, `password_nuevo`, `password_nuevo2`). TTL y longitud: `PASSWORD_RESET_CODE_TTL_SECONDS` (por defecto **180 s**, ~3 min), `PASSWORD_RESET_CODE_LENGTH` en `settings`/`.env`. Tras **verify-code** válido, el backend **renueva `expira_en`** del mismo token para que confirmar no falle por tiempo consumido entre pasos. Correo vía `EMAIL_HOST` (p. ej. MailHog `mailhog:1025` en Docker).
- **Política de contraseñas reforzada (backend):** además de longitud mínima, la contraseña debe ser estrictamente alfanumérica (`A-Z`, `a-z`, `0-9`), incluir al menos una mayúscula, una minúscula y un número; no se permiten símbolos (`#@%^&...`) ni espacios.
- **Suite de pruebas inicial (backend):** se agregaron pruebas automáticas para política de contraseña, creación de usuario con validación de password y endpoint `/api/auth/permissions` (roles+permisos efectivos).

## Frontend (Next.js)
<<<<<<< HEAD
- **Módulo Emitir Recetas (CU16 - 2026-06-20):**
  - Implementado como una página dedicada independiente en `/dashboard/recetas` y rotulado en el menú como **"Emitir Recetas"**.
  - Ofrece un diseño split-screen premium consistente con el de evoluciones (listado de pacientes activos buscables a la izquierda; historial de recetas y formulario interactivo a la derecha).
  - Incorpora un formulario dinámico que permite añadir/remover medicamentos de forma reactiva, validando obligatoriedad de dosis, frecuencia y duración, asociando de forma inmutable la firma del médico logueado.
  - Implementa edición inline reactiva y borrado seguro de recetas emitidas en la columna de recetas anteriores, regulado bajo permisos de RBAC (`canWrite` evaluando `recetas.editar` y `recetas.eliminar`).
  - Diseñado con soporte de impresión profesional mediante CSS `@media print` que oculta el portal web e imprime una receta de medicamentos limpia y formateada.
- **Módulo Antecedentes del Paciente (CU19 - 2026-06-20):**
  - Implementado como página dedicada independiente en `/dashboard/antecedentes`.
  - Ofrece un diseño split-screen premium:
    - Columna izquierda: listado de pacientes con su nombre completo e historiales clínicos activos (buscables por ID/nombre y paginados).
    - Columna derecha: si no hay selección, muestra un estado vacío instructivo con iconografía de salud. Si se selecciona un paciente, despliega su nombre completo en la cabecera, sus antecedentes históricos ordenados de manera cronológica descendente, filtrables por tipo (Patológico, No Patológico, Familiar, Quirúrgico, Alérgico, Otro) y con opciones de edición rápida y eliminación inline reguladas por RBAC, y el formulario correspondiente para registrar nuevos antecedentes (validando estado del expediente).
  - El helper `frontend/src/lib/authorization.ts` mapea la ruta `/dashboard/antecedentes` y controla accesos independientes con permisos finos.
- **Módulo Evoluciones del Paciente (CU15 - 2026-06-20):**
  - Implementado como una página dedicada independiente en `/dashboard/evoluciones`.
  - Ofrece un diseño split-screen premium:
    - Columna izquierda: listado de pacientes con su nombre completo e historiales clínicos activos (buscables por ID/nombre y paginados).
    - Columna derecha: si no hay selección, muestra un estado vacío instructivo. Si se selecciona un paciente, despliega su nombre completo en la cabecera, sus notas de evolución histórica ordenadas de manera cronológica descendente (con opciones de edición rápida y eliminación inline reguladas por RBAC) y el formulario correspondiente para registrar nuevas evoluciones (validando especialista activo y el estado del expediente).
  - El serializer `HistorialClinicoSerializer` del backend se extendió para incluir el campo calculado `paciente_nombre_completo` para poblar el nombre del paciente en la UI de Historial Clínico y Evoluciones sin consultas N+1.
  - El helper `frontend/src/lib/authorization.ts` mapea la ruta `/dashboard/evoluciones` y controla accesos de forma independiente.
- **Flujo clínico actualizado `usuario -> medico -> especialista` (2026-06-01):**
  - `/dashboard/medicos`: se removieron en UI y payloads los campos `especialidad_principal` y `subespecialidad` en crear/editar/listar; se mantiene `usuario`, `matricula`, `anios_experiencia`, `activo`.
  - `/dashboard/especialistas`: creación ahora toma fuente desde `GET /api/medicos?page=1` (opciones `id_medico`, `nombre_usuario`) y `POST /api/especialistas` envía `id_medico`.
  - Tabla de especialistas mantiene nombre legible usando `nombre_usuario` y fallback compatible con `id_usuario`/`id_medico` cuando aplique.
- **Proxy API:** `next.config.js` reescribe `/api/:path*` → base interna (`INTERNAL_API_URL` o `NEXT_PUBLIC_API_URL` o `http://localhost:8000/api`) para evitar CORS en desarrollo y en Docker (servidor Next → `http://backend:8000/api`).
- **Auth:** Login (`/login`) hace `POST /api/auth/login/` con body `{ login, password }`; guarda `access` y `refresh` en **localStorage** (`src/lib/auth.ts`). Cliente Axios (`src/lib/api.ts`) adjunta `Authorization: Bearer` y ante **401** intenta `POST /api/auth/token/refresh/`; si renueva, reintenta la solicitud original; si falla, limpia sesión y redirige a `/login`. Logout llama `POST /api/auth/logout/` con refresh cuando existe.
- **Dashboard:** `layout.tsx` redirige a `/login` si no hay access token en cliente.
- **Rutas panel:** `/dashboard` (panel), `/dashboard/usuarios`, `/dashboard/roles`, `/dashboard/permisos`, `/dashboard/seguridad-login` (solo menú si `tipo_usuario === 'ADMIN'`), `/dashboard/contrasena` (cambio de contraseña con sesión; enlace en menú usuario del navbar), `/dashboard/bitacora`, `/dashboard/pacientes`, `/dashboard/especialistas`, `/dashboard/citas`, `/dashboard/agenda-medica`, `/dashboard/consultas`.
- **Dashboard KPI (frontend):** nueva ruta `/dashboard/kpi` totalmente responsiva (desktop/tablet/mobile) con tarjetas estratégicas, tabla de estados mensuales, operativo diario por especialista y alertas.
- **Dashboard clínico (frontend):** el módulo analítico deja de llamarse KPI en UI y en rutas activas. Se expone como `Dashboard` en `/dashboard` (principal) y el panel administrativo rápido se mueve a `/dashboard/inicio`.
- **Módulo Pacientes (frontend):** ruta `/dashboard/pacientes` conectada a `/api/pacientes` con listado paginado, búsqueda, filtros (`sexo`, `activo`), alta, edición y eliminación; feedback visual y diseño alineado a tokens de paleta violeta.
- **UX delete paciente/especialista reforzada (frontend):** cuando backend responde `409` por historial clínico protegido, UI ofrece desactivación inmediata y evita flujo roto de eliminación.
- **Módulo Especialistas + Horarios (frontend):** ruta `/dashboard/especialistas` conectada a `/api/especialistas` y `/api/horarios-especialista` con alta y eliminación base; política UI de escritura activa para `ADMIN`/`ADMINISTRATIVO`.
- **Fix UX funcional en Especialistas (2026-05-31):** botones `Crear especialista` y `Crear horario` ahora validan campos requeridos y muestran mensaje explícito de error cuando faltan datos (antes podían parecer "no funcionales" por return silencioso).
- **Formularios de gestión clínica mejorados (2026-05-31):**
  - `especialistas`: alta de especialista y alta de horario ahora por **modal de creación** (se removieron formularios inline), y edición en modal para especialista y horario.
  - `medicos`: alta ahora mediante **modal de creación** al pulsar `Crear médico` (se elimina el formulario inline), y edición en modal desde tabla para actualizar matrícula/especialidad/experiencia.
  - `citas`: programación ahora por **modal de creación** al pulsar `Programar cita` (se elimina formulario inline), con validación y feedback.
  - `consultas`: registro ahora por **modal de creación** al pulsar `Registrar consulta` (se oculta formulario extendido inline), manteniendo validación explícita de campos críticos (`cita`, `diagnóstico`, `plan`).
  - Modales clínicos (`medicos`/`especialistas`): cierre con tecla `ESC` y clic fuera del panel.
- **Nuevo módulo Médicos (backend+frontend, 2026-05-31):**
  - Backend `apps.medicos` con CRUD `/api/medicos` y atributos propios: `matricula`, `especialidad_principal`, `subespecialidad`, `anios_experiencia`, `activo`.
  - Frontend nueva ruta `/dashboard/medicos` con formulario y tabla operativa (crear, desactivar, eliminar).
  - Sidebar incluye acceso `Médicos` dentro de `Gestión clínica`.
  - RBAC ampliado con permisos `medicos.listar|crear|editar|eliminar`.
- **Desactivación directa en tablas:** pacientes y especialistas ahora incluyen acción `Desactivar` (PATCH `activo=false`) para continuidad operativa sin borrar historial.
- **Borrado seguro de especialistas (backend):** si especialista tiene historial dependiente (citas/consultas), `DELETE /api/especialistas/{id}` responde `409` con mensaje de negocio (no 500) y recomienda desactivar en lugar de eliminar.
- **Módulo Citas (frontend):** ruta `/dashboard/citas` conectada a `/api/citas` con programación y acciones `cancelar`/`reprogramar` mediante modales en UI (sin `window.prompt`), con protección de doble envío, validación de fecha/hora, mínimo de caracteres en motivo y mejoras de accesibilidad (ESC, foco inicial, foco contenido en modal, `role="dialog"` + `aria-modal`, mensajes inline por campo). Política actual en UI: escritura habilitada para `ADMIN` y `ADMINISTRATIVO`; `MEDICO`/`ESPECIALISTA` operan en modo lectura en este módulo.
- **Módulo Agenda médica (frontend):** ruta `/dashboard/agenda-medica` en modo lectura contra `/api/agenda-medica`.
- **Módulo Consultas médicas (frontend):** ruta `/dashboard/consultas` conectada a `/api/consultas-medicas` para registrar consulta y listar historial; política UI de escritura activa para `ADMIN`/`MEDICO`/`ESPECIALISTA`.
- **CU12/CU13/CU14 implementados (consultas):** `ConsultaMedica` ahora almacena campos clínicos de triaje y presión intraocular (peso/talla/temperatura/PA/FC/FR/SatO2/PIO OD-OI), examen de refracción (OD/OI esfera-cilindro-eje y AV), y diagnóstico ampliado (`diagnostico_secundario`, `codigo_cie10`) con validaciones backend de rango.
- **Autorización frontend reusable:** nuevo helper `frontend/src/lib/authorization.ts` con `canWriteModule(me, module)` para centralizar políticas de acciones por módulo clínico.
- **Autorización frontend efectiva (RBAC):** `DashboardUserContext` resuelve `permissionCodes` desde `GET /api/auth/permissions` como fuente única; `authorization.ts` evalúa primero permisos efectivos y mantiene fallback por `tipo_usuario` solo en helper para compatibilidad controlada.
- **Endpoint backend de permisos efectivos:** nuevo `GET /api/auth/permissions` devuelve códigos efectivos de permiso y roles de la sesión, para reducir múltiples llamadas desde frontend y estabilizar evaluación RBAC en UI.
- **Seeder RBAC de asignaciones:** nuevo `backend/seeders/seed_rbac_asignaciones.py` (idempotente) para poblar `rol_permiso` y `usuario_rol` en entorno dev.
- **Validación endpoint permisos (Docker):** tras `seed --only rbac`, `GET /api/auth/permissions/` devuelve datos efectivos:
  - `admin` -> rol `Administrador del Sistema`, 13 permisos.
  - `dr.carlos` -> rol `Auditor`, 4 permisos (`bitacora.ver`, `users.ver`, `roles.listar`, `permisos.listar`).
- **Permisos clínicos finos:** `seed_permisos` ahora incluye códigos explícitos para `pacientes.*`, `especialistas.*`, `citas.*`, `consultas.*`, además de `agenda.ver` y `kpi.ver`.
- **Autorización frontend explícita:** `frontend/src/lib/authorization.ts` usa mapa explícito de códigos por módulo/acción (sin heurísticas por alias).
- **Roles clínicos dedicados (seed):** se agregaron `Recepción Clínica`, `Médico Clínico` y `Especialista Clínico` para separar operaciones asistenciales de roles IAM.
- **Sincronización RBAC idempotente:** `seed_rbac_asignaciones` ahora sincroniza (agrega y limpia sobrantes) tanto `rol_permiso` como `usuario_rol` para usuarios seed, evitando mezcla accidental IAM/Clínico.
- **Política clínica refinada (v2):**
  - `Recepción Clínica`: puede crear/reprogramar citas, pero no cancelar.
  - `Médico Clínico` y `Especialista Clínico`: no incluyen `kpi.ver` por defecto.
  - `Citas` en frontend ya controla acciones por permiso específico (`citas.crear`, `citas.reprogramar`, `citas.cancelar`).
- **Visibilidad de navegación por rol (frontend):** `Sidebar` agrupado por paquetes CU (frontend, 2026-06-20): navegación reorganizada por secciones: `Reportes y estadísticas`, `Usuarios`, `Gestión clínica` (incluye Evoluciones), `Historial clínico`, y `Bitácora`, manteniendo filtros RBAC por ruta (`canViewRoute`).
- **Ubicación de Evoluciones en Sidebar (2026-06-20):** Por requerimiento visual y funcional, el acceso directo a la gestión de Evoluciones clínicas se ubicó bajo el grupo "Gestión clínica", mientras que "Historial clínico" permanece bajo su propia sección independiente "Historial clínico".
- **Guardas de lectura directa (URL):** `agenda-medica`, `pacientes`, `especialistas`, `citas`, `consultas` y `kpi` validan acceso con `canViewClinicalModule` antes de consultar API.
- **Endpoints KPI (backend):**
  - `GET /api/dashboard/summary` (headline mensual + distribución de estados + datos tácticos).
  - `GET /api/dashboard/operativo` (métricas de hoy + carga por especialista + alertas operativas).
  - `GET /api/dashboard/citas-drilldown` (detalle de citas por estado, filtrable por rango de fechas).
  - `GET /api/dashboard/citas-drilldown/export` (export CSV).
  - Implementado en nueva app modular `apps.dashboard`.
  - Legacy removido: ya no existen rutas `/api/kpi/*` ni permiso `kpi.ver`.
- **KPI filtros y cache:** `summary` y `operativo` aceptan `date_from` y `date_to` (`YYYY-MM-DD`) y usan snapshot cacheado (TTL 5 minutos) para reducir carga de consultas repetidas.
- **KPI drilldown avanzado:** `GET /api/kpi/citas-drilldown` ahora soporta paginación (`page`, `page_size`) y estado; nuevo `GET /api/kpi/citas-drilldown/export` para descarga CSV del detalle filtrado.
- **KPI UX filtros rápidos:** frontend `/dashboard/kpi` incluye presets de período (`Hoy`, `7d`, `30d`, `Mes`) + filtros personalizados por fecha.
- **Hardening dashboard drilldown (backend):** `GET /api/dashboard/citas-drilldown` valida `page` y `page_size` como enteros positivos; ante valor inválido responde `400` con mensaje funcional.
- **Cobertura dashboard (backend):** nuevas pruebas en `apps/dashboard/tests/test_dashboard_endpoints.py` para rango inválido en `summary`, paginación inválida en `drilldown` y contrato CSV en `export`.
- **Seeder dashboard analítico:** `python manage.py seed --only dashboard-demo` genera citas históricas/futuras con estados mixtos para alimentar KPIs, operativo diario y drilldown exportable.
- **Seeder dashboard robustecido:** `seed_dashboard_demo` evita conflictos de slot activo (`PROGRAMADA/CONFIRMADA`) por especialista+fecha_hora_inicio, previniendo `IntegrityError` en corridas repetidas de `seed`.
- **Login:** respuesta **429** por bloqueo temporal; UI muestra cuenta atrás aproximada (`retry_after_seconds`).
- **IAM (listados):** páginas consumen API paginada: `GET /api/users/`, `GET /api/roles/`, `GET /api/permisos/`; manejo de 403 con mensaje al usuario.
- **Bitácora:** datos reales vía `GET /api/bitacora/` con filtros, orden, búsqueda y paginación; KPIs y horas en **Bolivia** (`src/lib/timezone.ts`, `America/La_Paz`, locale `es-BO`).
- **Landing** pública (`/`), **login** y **`/forgot-password`** (flujo en 3 pasos: correo → código → nueva contraseña) con UI alineada al login.
- **Mensajería UX de contraseña:** `dashboard/contrasena` y `forgot-password` muestran regla explícita: mínimo 8, una mayúscula, una minúscula, un número y solo letras/números.
- **Lint frontend no interactivo:** agregado `frontend/.eslintrc.json` (`next/core-web-vitals`) para ejecutar `npm run lint` sin wizard.
- **Lint frontend limpio:** corregidos warnings de dependencias `useEffect` en módulos `citas` y `kpi`; `npm run lint` queda sin warnings/errores.
- **Navegación dashboard simplificada:** se elimina entrada duplicada `Dashboard clínico` del `Sidebar`; se mantiene `Dashboard` como acceso principal y `Inicio` como panel rápido.
- **Ruta canónica dashboard:** `/dashboard` queda como única URL funcional del módulo analítico; `/dashboard/dashboard` se conserva solo como alias legacy con redirección server-side a `/dashboard`.
- **Pruebas E2E iniciales (frontend):** se integra Playwright con `npm run test:e2e`; primer caso valida que `/dashboard/dashboard` no permanezca como URL final y respete el flujo de redirección canónica.
- **Guard de sesión validado por E2E:** suite Playwright ahora cubre `/dashboard` sin token (redirige a `/login`) y `/dashboard` con token presente en localStorage (permanece en dashboard).
- **CU21/CU22/CU23 implementados (reportes):** nuevos endpoints backend
  - `GET /api/reportes/pacientes-atendidos`
  - `GET /api/reportes/citas-por-periodo`
  - `GET /api/reportes/consultas-por-especialista`
  con filtros `date_from/date_to` y respuesta `periodo + summary + items`.
- **Refactor modular de reportes (2026-05-30):** los endpoints de reportes se mueven de `apps.dashboard` a módulo dedicado `apps.reportes` (views, urls, tests propios) para respetar separación por dominio.
- **Seeders ampliados (2026-05-30):** `seed_dashboard_demo` ahora genera volumen semanal para ~6 meses de historial + ventana futura corta; `seed_consultas_demo` amplía objetivo y consume también citas `ATENDIDA` para poblar reportes clínicos con mayor densidad.
- **Seeders masivos 6 meses (actualización):**
  - `seed_clinica` genera base ampliada de pacientes (objetivo +60 sintéticos idempotentes).
  - `seed_dashboard_demo` aumenta densidad temporal (cada 3 días en ventana de 180 días + proyección futura).
  - `seed_consultas_demo` eleva objetivo a `360` consultas y completa citas faltantes para sostener ese volumen.
  - Verificación post-seed en entorno actual: `pacientes=72`, `citas=412`, `consultas=360`.
- **Ajuste de realismo en seeders (2026-05-31):**
  - `seed_clinica`: pacientes sintéticos con documentos más realistas (prefijo por departamento + secuencia) y mayor variedad de nombres/fechas/telefonía.
  - `seed_dashboard_demo`: citas con distribución más variada de horas/minutos y motivos clínicos realistas.
  - `seed_consultas_demo`: dispersión temporal reforzada (día/hora/minuto), y sincronización de `fecha_creacion` de consulta con `fecha_hora_inicio` de la cita para que reportes reflejen 6 meses reales (no concentrado en un solo día).
  - Ajuste adicional: `fecha_creacion` de consultas ahora incorpora offset determinístico por paciente+especialista para evitar empates masivos en "última atención" dentro del reporte de pacientes atendidos.
  - `seed_dashboard_demo`: distribución de pacientes por salto primo para reducir repeticiones consecutivas evidentes en listado de citas demo; además sincroniza registros legacy con motivo `Dashboard demo` a motivos clínicos reales.
  - `seed_clinica`: normalización fuerte de pacientes demo (email `paciente.*`) para garantizar unicidad de combinación de nombres y apellidos en el conjunto generado (sin duplicados en los 60 sintéticos).
- **Reporte por período refinado (2026-05-31):** bloque `Citas por período` ahora retorna y muestra `fecha + estado + total` (no solo estado agregado), manteniendo filtro `date_from/date_to`.
- **Consultas con médico (UX):** en formulario de consultas se ajusta etiqueta a `Médico (ID profesional)` para alinear lenguaje operativo.
- **Ajuste de cobertura de reportes por especialista (2026-05-30):**
  - Se detectó sesgo de datos: reporte `consultas-por-especialista` mostraba solo 2 especialistas porque las 360 consultas existentes estaban concentradas en IDs 1 y 2.
  - `seed_clinica` amplía staff clínico (7 usuarios activos; 6 perfiles de especialista activos).
  - `seed_consultas_demo` ahora asegura piso mínimo por especialista (`MIN_CONSULTAS_POR_ESPECIALISTA = 40`) para evitar reportes incompletos.
  - Verificación post-ajuste: distribución consultas por especialista `181, 179, 40, 40, 40, 40`.
- **UI reportes sin prefijos CU:** pantalla `/dashboard/reportes` reemplaza títulos/descripción con nombres funcionales (sin etiquetas `CUxx`).
- **Exportables de reportes (nuevo):** cada reporte en `/dashboard/reportes` permite exportación en **CSV, Excel (`.xlsx`) y PDF** mediante endpoints dedicados:
  - `/api/reportes/pacientes-atendidos/export`
  - `/api/reportes/citas-por-periodo/export`
  - `/api/reportes/consultas-por-especialista/export`
  con `file_format=csv|xlsx|pdf`.
- **Detalle temporal en "Pacientes atendidos" (2026-05-30):** el reporte ahora incluye por paciente `total_consultas`, `primera_atencion` y `ultima_atencion` (ISO datetime), visible en UI y en exportables CSV/XLSX/PDF.
- **Consultas como módulo clínico propio:** CU12/CU13/CU14 permanecen en `apps.consultas` (módulo dedicado del dominio de atención), separado de analítica/reportes.
- **Frontend reportes clínicos:** nueva ruta `/dashboard/reportes` con generación por rango de fechas para CU21/CU22/CU23; navegación habilitada en Sidebar y control de acceso por permiso `reportes.ver`.
- **UI reportes mejorada (responsive):** `/dashboard/reportes` usa layout adaptativo móvil/escritorio (toolbar en grid responsivo, secciones en cards con acciones de export por bloque y tablas con scroll horizontal controlado).
- **UI reportes personalizable (2026-05-30):** cada bloque (`pacientes atendidos`, `citas por período`, `consultas por especialista`) incorpora búsqueda local + orden configurable asc/desc por columnas clave (A-Z / Z-A y menor-mayor / mayor-menor).
- **UI reportes personalizable v2 (2026-05-30):** se agrega persistencia por usuario en `localStorage` de filtros/orden/dirección/tamaño de página/columnas visibles, paginación por bloque, selector de columnas visible/oculta y exportación alineada con filtros/orden actuales enviando `q`, `sort_by`, `sort_dir` al backend.
- **Backend reportes (query customization):** endpoints y exportables de `apps.reportes` aceptan `q`, `sort_by`, `sort_dir` para aplicar búsqueda y orden en respuesta y archivos exportados.
- **Texto frontend sin prefijos CU:** no quedan menciones `CUxx` en código de `frontend/src` para títulos/descripciones de módulos clínicos y reportes.
- **RBAC reportes:** `seed_permisos` agrega `reportes.ver`; `seed_rbac_asignaciones` lo asigna a roles clínicos y admin.
- **Migración clínica nueva:** `consultas.0002_cu12_cu13_cu14_fields` aplicada.
- **RBAC Sidebar validado por E2E:** Playwright verifica visibilidad de navegación por rol en `Menú principal` (ADMIN ve IAM; MEDICO no ve IAM y mantiene módulos clínicos permitidos), con mocks de endpoints de sesión/permisos.
- **Suite E2E organizada por responsabilidad:** pruebas separadas en `auth-guard.spec.ts` (redirect + guard sesión) y `rbac-sidebar.spec.ts` (visibilidad de navegación por rol).
- **Docker compose (frontend env):** se evita interpolación redundante en `docker-compose.yml`; variables de app se leen desde `.env` vía `env_file` y desaparece warning por variable no seteada en shell.

## Esquema de base de datos (referencia)
El archivo **`BaseDeDatos.sql`** (DBML para dbdiagram.io) debe mantenerse alineado con SI1:
- `tipo_usuario` sin `PACIENTE`.
- Tabla `pacientes` **sin** `id_usuario`.
- Tabla **`consultas_medicas`** y relaciones con `citas`, `historias_clinicas`, `especialistas`, `usuarios` (`registrado_por`).

## Apps Django (resumen)
| App | Rol |
|-----|-----|
| `apps.core` | health, comando `seed` |
| `apps.users` | modelo `Usuario` (AUTH_USER_MODEL), CRUD `/api/users/` |
| `apps.security` | bloqueo por intentos de login, config umbral, tokens recuperación contraseña |
| `apps.auth` | login, logout, JWT, `/auth/me`, reset password, `security/login-config` |
| `apps.roles`, `apps.permisos` | RBAC |
| `apps.bitacora` | auditoría |
| `apps.pacientes` | Paciente |
| `apps.especialistas` | Especialista |
| `apps.historial_clinico` + subapps | historia clínica |
| `apps.citas` | citas, tipos, disponibilidades |
| `apps.consultas` | ConsultaMedica |

## Pendientes inmediatos
- Formularios IAM en frontend: alta/edición usuarios, asignación roles, edición catálogo permisos (si aplica a la API).
- CRUD frontend dominio clínico: pacientes, especialistas/horarios, citas, agenda, consultas (base implementada); Citas ya migró a modales para cancelar/reprogramar y muestra nombres enriquecidos en tabla. Permisos por rol en UI aplicados en Pacientes, Especialistas/Horarios, Citas y Consultas mediante helper compartido.
- Endurecer almacenamiento de sesión (p. ej. cookies **http-only**) si se exige para producción.
- Módulo reportes (fuera de alcance corto según decisión previa).

## Sistema de agentes local (`.agents/agents`)
- Se definió un **agente principal `orchestrator`** para enrutar solicitudes a especialistas por dominio.
- Agentes especialistas creados: `backend`, `frontend`, `architecture`, `architect-planner`, `code-review`, `qa-testing`, `infra`.
- Cada agente tiene prompt operativo dedicado en `.agents/agents/*.md` con alcance, reglas y entregables.
- `orchestrator` contempla invocación de skills (`caveman`, `deploy-to-vercel`, `find-skills` cuando disponible) según tipo de solicitud.
- Registro índice: `.agents/agents/README.md`.
- Formato adoptado: **híbrido** (frontmatter machine-readable + cuerpo detallado de operación) para compatibilidad con runners de agentes y legibilidad humana.
- **Gobernanza de diseño para agentes:** se agrega `docs/ai/DESIGN.md` como contrato de diseño UI/UX por tipo de sistema, junto a `docs/ai/SKILLS_REGISTRY.md` y `docs/ai/PROMPTS_LIBRARY.md` para habilitar un subagente especializado `design-orchestrator`.

## Sistema multi-agente OpenCode oficial (`.opencode/agents`)
- Se configura estructura oficial OpenCode en `.opencode/`.
- Agente principal `orchestrator` creado con `mode: primary` y delegacion por dominio mediante `permission.task`.
- Subagentes creados: `backend`, `frontend`, `ui-ux`, `architecture`, `architect-planner`, `code-review`, `qa-testing`, `devops`.
- `code-review` queda en modo solo revision (`edit: deny`).
- No se crea `mobile` por falta de evidencia de app mobile en el repo actual.
- Se crea documentacion operativa en `.opencode/README.md` y skills en `.opencode/skills/README.md`.

## Sistema multi-agente OpenCode consolidado (`.opencode/agents`)
- Se mantiene **solo** formato OpenCode para agentes de proyecto.
- `orchestrator` (`mode: primary`) enruta por dominio y usa `permission.task` para delegación controlada.
- Subagentes activos (stack aplicable): `backend`, `frontend`, `ui-ux`, `architecture`, `architect-planner`, `code-review`, `qa-testing`, `devops`, `security`, `docs-memory`, `puds`, `diagrams-modeling`.
- No se crean por falta de evidencia: `mobile`, `ai-inference`, `ai-researcher`.
- Skills OpenCode: `.opencode/skills/README.md` + `.opencode/skills/uml-c4-puds-diagrams/SKILL.md`.

## Setup VS Code (`.vscode/`)
- Se agregó `.vscode/settings.json` para flujo consistente en equipo (PowerShell, format on save, exclusiones de búsqueda/archivos, pestañas persistentes).
- Se agregó `.vscode/tasks.json` con tareas operativas rápidas: abrir docs/ai clave, `docker compose up --build`, `migrate`, `seed`, `git status`.
- Objetivo: reducir pasos manuales y estandarizar ejecución del flujo agente-first.

---
*(Actualizado: 2026-06-20)*
