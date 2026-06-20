# Oftalmología SI1 — Documentación

## Estructura de Documentación

```
docs/
├── ai/                # Contexto y estado del proyecto para agentes IA
└── README.md          # Este archivo
```

## Convenciones del Proyecto

### Git

- Commits descriptivos en español o inglés
- Ramas: `main`, `develop`, `feature/*`, `bugfix/*`, `hotfix/*`

### Código

- **Python:** PEP 8, docstrings en español
- **TypeScript:** ESLint + Prettier

### Base de Datos

- Tablas en `snake_case`
- El esquema de referencia en **raíz del repo: `BaseDeDatos.sql`** (sintaxis DBML / [dbdiagram.io](https://dbdiagram.io)) debe mantenerse alineado con los modelos Django del SI1 (paciente sin usuario, tabla `consultas_medicas`, etc.).
- Nunca editar migraciones ya aplicadas en entornos compartidos

### Comandos de Base de Datos y Backend

El proyecto usa contenedores Docker. Para realizar cambios en la estructura de la base de datos o poblarla con datos iniciales (seeders):

```bash
# 1. Generar migraciones (después de cambiar models.py)
docker-compose exec backend python manage.py makemigrations

# 2. Aplicar migraciones a la BD
docker-compose exec backend python manage.py migrate

# 3. Poblar datos iniciales IAM (superusuario admin, roles y permisos)
docker-compose exec backend python manage.py seed

# Opcional: solo un seeder
# docker-compose exec backend python manage.py seed --only admin
# docker-compose exec backend python manage.py seed --only roles
# docker-compose exec backend python manage.py seed --only permisos
```

> **Nota:** El comando `seed` es idempotente: se puede ejecutar varias veces sin crear duplicados lógicos.

### Frontend y API en Docker

El frontend Next.js proxifica `/api/*` al backend. En compose suele definirse **`INTERNAL_API_URL`** (p. ej. `http://backend:8000/api`) para que el contenedor `frontend` alcance al servicio `backend` por red interna. **`NEXT_PUBLIC_API_URL`** sigue siendo la URL pública que ve el navegador en el host (p. ej. `http://localhost:8000/api`) cuando aplica.
