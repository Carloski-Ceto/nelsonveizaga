# Mapa de paquetes y casos de uso (backend)

## Usuarios (CU1-CU6)
- CU1 Iniciar sesión -> `apps.auth`
- CU2 Cerrar sesión -> `apps.auth`
- CU3 Gestionar usuarios -> `apps.users`
- CU4 Gestionar roles y permisos -> `apps.roles`, `apps.permisos`
- CU5 Cambiar contraseña -> `apps.auth`
- CU6 Recuperar contraseña -> `apps.auth`

Alias lógico: `apps/Usuarios/*`

## Gestión Clínica (CU7-CU17)
- CU7 Gestionar paciente -> `apps.pacientes`
- CU8 Gestionar especialista -> `apps.especialistas`
- CU9 Gestionar cita -> `apps.citas`
- CU10 Consultar agenda médica -> `apps.citas` (endpoint agenda)
- CU11 Registrar consulta médica -> `apps.consultas`
- CU12 Registrar triaje y PIO -> `apps.consultas`
- CU13 Registrar examen de refracción -> `apps.consultas`
- CU14 Registrar diagnóstico -> `apps.consultas`
- CU15 Registrar evolución del paciente -> **pendiente módulo dedicado**
- CU16 Emitir receta de medicamentos -> **pendiente módulo dedicado**
- CU17 Emitir receta de lentes/contacto -> **pendiente módulo dedicado**

Alias lógico: `apps/GestionClinica/*`

## Historial Clínico (CU18-CU20)
- CU18 Consultar historial clínico -> cobertura parcial desde `apps.consultas`
- CU19 Registrar antecedentes -> **pendiente**
- CU20 Archivar historial -> **pendiente**

Alias lógico: `apps/HistorialClinico/*`

## Reportes y estadísticas (CU21-CU23, CU25)
- CU21 Pacientes atendidos -> `apps.reportes`
- CU22 Citas por período -> `apps.reportes`
- CU23 Consultas por especialista -> `apps.reportes`
- CU25 Dashboard administrativo -> `apps.dashboard`

Alias lógico: `apps/ReportesEstadisticas/*`

## Bitácora (CU24)
- CU24 Gestionar bitácora -> `apps.bitacora`

Alias lógico: `apps/Bitacora/*`

---

## Nota técnica importante
Esta iteración crea **organización lógica por paquetes** sin mover físicamente
las apps Django productivas, para evitar romper imports, migraciones y labels.

Si deseas, la siguiente fase puede hacer el **traslado físico real** app por app,
con plan de compatibilidad y pruebas de regresión.
