# Oftalmología SI1 — Clínica de Ojos Norte

Sistema de administración (IAM): autenticación, usuarios, roles, permisos y bitácora de auditoría para la Clínica de Ojos Norte.

## Stack Tecnológico

| Capa          | Tecnología              | Puerto Dev |
| ------------- | ----------------------- | ---------- |
| Backend       | Django 5 + DRF          | :8000      |
| Frontend      | Next.js 14 (App Router) | :3000      |
| Base de Datos | PostgreSQL 16           | :5432      |
| Email (dev)   | Mailhog                 | :8025      |
| Contenedores  | Docker + Docker Compose | —          |

## Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git
- (Opcional) Python 3.12+, Node.js 20+ — solo si quieres desarrollo sin Docker

## Setup Rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Oftalmologia-SI1

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores reales (contraseñas y secret key)

# 3. Construir y levantar los contenedores
docker compose up -d --build

# 5. (Solo si cambiaste modelos en tu máquina) generar migraciones y aplicarlas
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# 6. Poblar base de datos (superusuario admin, roles y permisos IAM)
docker compose exec backend python manage.py seed
```

## Acceso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/
- **Mailhog (emails dev):** http://localhost:8025

## Estructura del Proyecto

```
Oftalmologia-SI1/
├── backend/          # Django + DRF (API REST)
├── frontend/         # Next.js (Panel web administrativo)
├── docs/             # Documentación del proyecto
├── docker-compose.yml
├── .env.example
└── README.md
```

## Módulos del Sistema

| Módulo   | Descripción                                     |
| -------- | ----------------------------------------------- |
| Usuarios | Autenticación JWT, cuentas del personal interno |
| Roles    | Roles y asignación de permisos                  |
| Permisos | Catálogo de permisos granulares                 |
| Bitácora | Auditoría de acciones (solo lectura vía API)    |

## Comandos Esenciales Backend

```bash
# Levantar todos los servicios
docker compose up

# Levantar solo backend + base de datos
docker compose up backend db

# Ver logs en tiempo real
docker compose logs -f backend

# Parar servicios
docker compose down

# Reconstruir después de cambios en requirements
docker compose up -d --build
```

```bash
# Crear nuevas migraciones (tras cambiar models.py)
docker compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker compose exec backend python manage.py migrate

#Reiniciar contenedor
docker compose restart backend

docker compose restart frontend
#
docker compose exec backend python manage.py makemigrations

#
docker compose exec backend python manage.py migrate

# Ver estado de migraciones
#docker compose exec backend python manage.py showmigrations

# Poblar datos iniciales (admin, roles, permisos IAM)
docker compose exec backend python manage.py seed

# Abrir shell de Django
docker compose exec backend python manage.py shell

# Recolectar archivos estáticos
docker compose exec backend python manage.py collectstatic --noinput
```

### Migraciones: error `duplicate key ... pg_type_typname_nsp_index` (token_blacklist)

Suele ocurrir si **`migrate` se ejecutó dos veces a la vez** (por ejemplo el `entrypoint` del contenedor y un `docker compose exec ... migrate` manual justo al levantar el stack). PostgreSQL queda a medias.

**Opción A — desarrollo, puedes borrar la base:**

```bash
docker compose down -v
docker compose up -d --build
# Espera ~1 minuto a que el backend muestre "Starting development server", luego:
docker compose exec backend python manage.py seed
```

**Opción B — conservar el volumen de Postgres:** entra a SQL y rehace solo JWT blacklist (ajusta usuario y base según tu `.env`):

```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
DROP TABLE IF EXISTS token_blacklist_blacklistedtoken CASCADE;
DROP TABLE IF EXISTS token_blacklist_outstandingtoken CASCADE;
DELETE FROM django_migrations WHERE app = 'token_blacklist';
"
docker compose exec backend python manage.py migrate
```

En PowerShell puedes cargar `.env` o sustituir `-U` / `-d` a mano.

## Licencia

Proyecto académico — Uso educativo. Clínica de Ojos Norte.
docker compose down -v --rmi all
