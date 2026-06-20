"""
config/settings.py
============================
Configuración única de Django — un solo archivo.
Los valores específicos de entorno se controlan vía .env

Para producción, sobreescribe via variables de entorno:
  DJANGO_DEBUG=False
  DJANGO_SECRET_KEY=tu-clave-segura
  CORS_ALLOWED_ORIGINS=https://tudominio.com
  (ver .env.example para la lista completa)
"""
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# BASE_DIR apunta a la raíz /backend/
# __file__ está en /backend/config/settings.py → .parent.parent
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================================
# SEGURIDAD
# =============================================================================
SECRET_KEY = config('DJANGO_SECRET_KEY', default='INSECURE-change-me-in-production')
DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = list(config('DJANGO_ALLOWED_HOSTS', default='*', cast=Csv()))
# Docker Compose: Next proxifica a http://backend:8000 → Host header "backend:8000".
# Sin esto, DJANGO_ALLOWED_HOSTS sin "backend" provoca DisallowedHost y el login devuelve 400.
if '*' not in ALLOWED_HOSTS and 'backend' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('backend')

# API JSON: evita 301 APPEND_SLASH cuando el proxy de Next normaliza la ruta
# (p. ej. /api/users?page=1) y el cliente sigue redirecciones → ERR_TOO_MANY_REDIRECTS.
APPEND_SLASH = False

# =============================================================================
# APLICACIONES
# =============================================================================
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'corsheaders',
    'django_filters',
]

LOCAL_APPS = [
    'apps.core',      # Utilidades transversales, health check, permissions
    'apps.Usuarios.users',     # Usuario (AUTH_USER_MODEL)
    'apps.Usuarios.security',  # Bloqueo login, config intentos, tokens recuperación (tablas existentes)
    'apps.Usuarios.auth',      # Login, logout, JWT, perfil sesión, reset password (sin modelos propios)
    'apps.Usuarios.roles',     # Rol, UsuarioRol, RolPermiso (paquete Usuarios)
    'apps.Usuarios.permisos',  # Permiso (granular por módulo)
    'apps.bitacora',  # Registro de auditoría del sistema
    'apps.GestionClinica.pacientes',
    'apps.GestionClinica.especialistas',
    'apps.GestionClinica.medicos',
    'apps.GestionClinica.citas',
    'apps.GestionClinica.consultas',
    'apps.GestionClinica.evoluciones',
    'apps.ReportesEstadisticas.dashboard',
    'apps.ReportesEstadisticas.reportes',
    'apps.HistorialClinico.historial',  # CU20 Archivar historial clínico
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# Mantiene estado de migraciones en rutas físicas nuevas tras reordenamiento
MIGRATION_MODULES = {
    'users': 'apps.Usuarios.users.migrations',
    'oftalmologia_security': 'apps.Usuarios.security.migrations',
    'permisos': 'apps.Usuarios.permisos.migrations',
    'pacientes': 'apps.GestionClinica.pacientes.migrations',
    'especialistas': 'apps.GestionClinica.especialistas.migrations',
    'medicos': 'apps.GestionClinica.medicos.migrations',
    'citas': 'apps.GestionClinica.citas.migrations',
    'consultas': 'apps.GestionClinica.consultas.migrations',
    'evoluciones': 'apps.GestionClinica.evoluciones.migrations',
    'historial_clinico': 'apps.HistorialClinico.historial.migrations',
}

# =============================================================================
# MIDDLEWARE
# =============================================================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# =============================================================================
# TEMPLATES
# =============================================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# =============================================================================
# BASE DE DATOS — PostgreSQL
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='oftalmologia_db'),
        'USER': config('POSTGRES_USER', default='oftalmologia_user'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='password'),
        'HOST': config('POSTGRES_HOST', default='localhost'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# =============================================================================
# MODELO DE USUARIO PERSONALIZADO
# =============================================================================
AUTH_USER_MODEL = 'users.Usuario'

# =============================================================================
# VALIDACIÓN DE CONTRASEÑAS
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'apps.Usuarios.users.password_validators.AlphanumericComplexityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# =============================================================================
# INTERNACIONALIZACIÓN
# =============================================================================
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/La_Paz'   # Bolivia Time — UTC-4, sin horario de verano
USE_I18N = True
USE_TZ = True

# =============================================================================
# ARCHIVOS ESTÁTICOS Y MULTIMEDIA
# =============================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================
_drf_renderer_classes = (
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',  # Solo se ve si DEBUG=True
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': _drf_renderer_classes,
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Oftalmologia SI1 API',
    'DESCRIPTION': 'API REST del sistema de gestion clinica oftalmologica.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# =============================================================================
# SIMPLE JWT
# =============================================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=30, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME', default=7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# =============================================================================
# CORS
# =============================================================================
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = config(
        'CORS_ALLOWED_ORIGINS', default='http://localhost:3000', cast=Csv()
    )
    CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# HEADERS DE SEGURIDAD
# =============================================================================
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True

# En producción (DEBUG=False) activar HTTPS headers:
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31_536_000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# =============================================================================
# EMAIL (Mailhog en Docker dev | SMTP real en producción via .env)
# =============================================================================
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = config('EMAIL_HOST', default='mailhog')
EMAIL_PORT = config('EMAIL_PORT', default=1025, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=False, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@oftalmologia.local')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# Código numérico en email (MailHog / SMTP). Por defecto 3 min; mín. 10 s en tokens.py.
PASSWORD_RESET_CODE_TTL_SECONDS = config(
    'PASSWORD_RESET_CODE_TTL_SECONDS', default=180, cast=int
)
PASSWORD_RESET_CODE_LENGTH = config(
    'PASSWORD_RESET_CODE_LENGTH', default=6, cast=int
)

# =============================================================================
# LOGGING
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}
