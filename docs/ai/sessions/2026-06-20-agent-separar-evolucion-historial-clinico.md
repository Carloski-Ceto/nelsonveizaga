# Sesión: Separación del módulo de Evoluciones del Historial Clínico

## Fecha
2026-06-20

## Objetivo
Separar completamente la funcionalidad de "Evoluciones médicas del paciente" de la página de "Historial clínico" en el frontend, moviendo toda la lógica de gestión de evoluciones a una página dedicada independiente (`/dashboard/evoluciones`), con acceso directo en el Sidebar y control de acceso RBAC granular.

## Cambios aplicados
- **Frontend Rutas y Menú Lateral:**
  - Modificado [Sidebar.tsx](file:///c:/Users/valer/Desktop/U/1-2026/si1/proyecto%20ciclo%204/Proyecto-SI1/frontend/src/components/Sidebar.tsx) para incluir la opción "Evoluciones" dentro del grupo **Gestión clínica** usando el icono `TrendingUp`.
  - Modificado [authorization.ts](file:///c:/Users/valer/Desktop/U/1-2026/si1/proyecto%20ciclo%204/Proyecto-SI1/frontend/src/lib/authorization.ts) para añadir la ruta `/dashboard/evoluciones` y mapearla al módulo clínico de `'evoluciones'`.
- **Backend Cambios de Dominio:**
  - Extendido `HistorialClinicoSerializer` para agregar el campo calculado `paciente_nombre_completo` obteniendo el nombre completo directamente a través de la relación FK `id_paciente`. Esto evita consultas N+1 en la API ya que las vistas usan `select_related('id_paciente')`.
- **Frontend Módulo Historial Clínico (`/dashboard/historial-clinico`):**
  - Removidos estados reactivos, llamadas asíncronas a la API de evoluciones y gestores de modales asociados en [page.tsx](file:///c:/Users/valer/Desktop/U/1-2026/si1/proyecto%20ciclo%204/Proyecto-SI1/frontend/src/app/dashboard/historial-clinico/page.tsx).
  - Removido el botón "Evoluciones" en la columna de acciones de la tabla de historiales.
  - Removido el componente modal split-screen de evoluciones de la parte inferior de la página.
  - Modificada la tabla principal de historiales clínicos para agregar una nueva columna "Nombre Paciente" que muestra el nombre completo cargado desde el serializer del backend.
- **Frontend Nueva Página de Evoluciones (`/dashboard/evoluciones`):**
  - Creado el archivo de página independiente [page.tsx](file:///c:/Users/valer/Desktop/U/1-2026/si1/proyecto%20ciclo%204/Proyecto-SI1/frontend/src/app/dashboard/evoluciones/page.tsx) con un diseño split-screen de alta calidad visual:
    - **Panel izquierdo (Sidebar local):** Buscador reactivo y listado paginado de expedientes de pacientes con historial clínico activo, mostrando el nombre completo del paciente.
    - **Panel derecho (Detalle principal):** Estado vacío (placeholder) inicial si no hay paciente seleccionado. Al seleccionar un paciente, muestra los detalles del historial (incluyendo el nombre del paciente en la cabecera) junto a la lista cronológica de notas de evolución (con edición y eliminación inline controladas por permisos) y el formulario completo para registrar nuevas notas asignadas a un especialista tratante activo.
  - Creado archivo de estilos [page.module.css](file:///c:/Users/valer/Desktop/U/1-2026/si1/proyecto%20ciclo%204/Proyecto-SI1/frontend/src/app/dashboard/evoluciones/page.module.css) con la distribución grid y clases visuales adaptativas.

## Validación ejecutada en Docker
1. **Linter:** `docker compose exec frontend npm run lint` → Completado con cero advertencias y cero errores. ✅
2. **Suite Backend (pytest):** `docker compose exec backend pytest` → 32 tests aprobados con éxito (0 fallos). ✅
3. **Build de Producción:** `docker compose exec frontend npm run build` → Construcción del bundle estático Next.js exitosa. ✅
