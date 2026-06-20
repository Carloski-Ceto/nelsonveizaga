# ARCHITECTURE

## Arquitectura del Proyecto
Sistema de Información/Gestión Clínica Oftalmológica. Monorepo estructurado en dos vértices (Backend + Frontend Web) sustentados por Infraestructura (Docker, DB). No existe app móvil — los pacientes no son actores del sistema.

## Principios Arquitectónicos
- **Modularidad Total:** Separación por responsabilidades tanto en carpetas como en apps internas de Django.
- **API Universal:** El Backend expone endpoints uniformes consumidos exclusivamente por el panel web administrativo.
- **Seguridad y UX Base:** Desde la capa más baja se deben establecer validaciones fuertes, sanitización de datos (Backend) y feedback visual, validaciones cliente y prevención de errores (Frontend).
- **DRY (Don't Repeat Yourself) & SOLID.**

## Reglas que No Deben Romperse
1. El Frontend (`/frontend`) es un mero visualizador e interactuador; TODA la lógica de negocio vive aislada en el Backend.
2. Cada aplicación/módulo soluciona un solo dominio (Auth, Pacientes, Turnos).
3. Todas las variables sensibles habitan vía variables de entorno (`.env`), preparadas para escalar a secretos de nube (ej. AWS Secrets). Jamás en commits de código.
4. **Los pacientes NO tienen cuenta de usuario.** Son registros de datos creados y gestionados por el personal. No existe endpoint de registro público (`/auth/register/`).

## Organización Modular y Responsabilidades
- `/backend`: API REST (Django + DRF). Responsable de validación, DB, seguridad JWT y lógica de negocio.
- **Django apps (dominio):** `apps.auth` — rutas y vistas de sesión (login, logout, `/auth/me`, refresh/verify JWT, reset de contraseña, `security/login-config`); **sin modelos propios**. `apps.security` — modelos y lógica de **bloqueo por intentos de login**, **configuración de umbral** y **tokens/códigos de recuperación de contraseña** (mismas tablas que antes bajo `users`; migración solo de estado). `apps.users` — solo **`Usuario`** (`AUTH_USER_MODEL`) + **CRUD** `/api/users/`.
- `/frontend`: Panel Web de Gestión (Next.js). Administradores, médicos y personal administrativo.
- `/infra` o raíz: Docker, Docker Compose y entorno local.
- **`BaseDeDatos.sql`** (raíz del repo): esquema de referencia en DBML; debe coincidir con los modelos Django (ver `CURRENT_STATE.md`).

## Zona horaria (negocio)
- Operación en **Bolivia** (`America/La_Paz`, UTC-4). Backend: `TIME_ZONE` en Django. Frontend: formateo con `Intl` y la misma zona. La BD guarda timestamps en UTC cuando `USE_TZ=True`.

## Flujo General del Sistema
- **Web Flow:** Browser -> Next.js Render/Fetch -> API Django -> PostgreSQL -> API Django -> UI State.
- **Llamadas API desde el navegador:** rutas relativas `/api/...`. El servidor Next (desarrollo y contenedor) reescribe esas peticiones hacia la base configurada (`INTERNAL_API_URL` / `NEXT_PUBLIC_API_URL`), de modo que el backend Django sigue siendo la única implementación de la API; el frontend no duplica lógica de negocio.

## Actores del Sistema
| Tipo | Descripción |
|------|-------------|
| ADMIN | Acceso total. Gestión de usuarios, configuración y auditoría. |
| ADMINISTRATIVO | Registro de pacientes, agendamiento de citas. |
| MEDICO | Historias clínicas, diagnósticos, recetas, citas propias. |
| ESPECIALISTA | Estudios diagnósticos, resultados. |

> El **Paciente** es una entidad de datos — no un actor del sistema. No tiene login ni acceso al panel.

## Diseño de la API REST (Decisión de Enrutamiento Anidado)
Para maximizar la **seguridad de datos clínicos** y la consistencia del estado en el cliente, todas las entidades que le pertenezcan a un perfil maestro deben usar **URLs Anidadas** en lugar de planas.

Ejemplo implementado: Para acceder o crear recetas, diagnósticos o evoluciones, la API requiere la ruta:
`POST /api/historial-clinico/{id}/recetas/`

**Justificación para Agentes/Desarrolladores Futuros:**
1. **Prevención de Fuga de Datos (Escenario GET):** Una URL plana (`GET /api/diagnosticos/`) permitiría que un error u omisión de parámetros en el frontend devuelva datos de todos los pacientes de la base de datos de golpe. La URL anidada fuerza un error 404 si el sistema escanea sin el ID del paciente, bloqueando la filtración.
2. **Prevención de Corrupción de Estado (Escenario POST):** Las rutas anidadas inyectan de forma inmutable a quién le pertenece la relación directamente desde la URL principal. El backend prioriza el ID de la URL y sobreescribe cualquier ID corrupto enviado en el JSON.

**REGLA:** Nunca abstraer o aplanar los submódulos clínicos. Mantener la dependencia en la URL.
