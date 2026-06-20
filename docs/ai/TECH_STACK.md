# TECH STACK

## Stack Tecnológico Oficial

### Backend
- **Framework:** Django 5+
- **API:** Django REST Framework (DRF)
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT vía `djangorestframework-simplejwt`

### Frontend Web
- **Framework:** Next.js (App Router)
- **Librería UI/UX:** React, con foco en sistemas de diseño responsivos y accesibles.

### Infraestructura y Despliegue
- **Contenedores:** Docker + Docker Compose.
- **Entornos:** Todo el código debe estar adaptado para funcionar bajo variables de entorno dinámicas permitiendo fluidez entre tres ambientes: **Local / Docker Nativo / Servidores Nube (VM/Cloud/VPS)**.
- **DB Driver:** `psycopg2-binary` para conexión desde los workers Python al storage de Postgres.
- **Email (dev):** Mailhog en puerto `:8025`.

### Convenciones Técnicas Importantes
- Diseño Seguro y UX Fluida: Las vistas web deben implementar siempre manejo de cargas (spinners) y captura de errores genéricos antes de enviarlos sin tratar al usuario.
- Sin registro público: Los usuarios del sistema son creados únicamente por administradores desde el panel.
