"""
Oftalmología SI1 — Clínica de Ojos Norte — URL Configuration
=============================================================
Todas las rutas del proyecto bajo /api/
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

api_patterns = [
    # Core — Health check
    path('', include('apps.core.urls')),

    # Autenticación y sesión (login, logout, /auth/me, JWT, reset password, security/login-config)
    path('', include('apps.Usuarios.auth.urls')),

    # Usuarios (CRUD /api/users/)
    path('', include('apps.Usuarios.users.urls')),

    # Roles y asignaciones usuario-rol
    path('', include('apps.Usuarios.roles.urls')),

    # Permisos granulares
    path('', include('apps.Usuarios.permisos.urls')),

    # Bitácora (app separada — solo lectura via API)
    path('', include('apps.bitacora.urls')),

    # Dominio clínico
    path('', include('apps.GestionClinica.pacientes.urls')),
    path('', include('apps.GestionClinica.especialistas.urls')),
    path('', include('apps.GestionClinica.medicos.urls')),
    path('', include('apps.GestionClinica.citas.urls')),
    path('', include('apps.GestionClinica.consultas.urls')),
    path('', include('apps.GestionClinica.recetas.urls')),
    path('', include('apps.GestionClinica.evoluciones.urls')),
    path('', include('apps.ReportesEstadisticas.dashboard.urls')),
    path('', include('apps.ReportesEstadisticas.reportes.urls')),
    path('', include('apps.HistorialClinico.historial.urls')),
    path('', include('apps.HistorialClinico.antecedentes.urls')),
    path('', include('apps.GestionClinica.pagos.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='api-docs-swagger'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='api-docs-redoc'),
    path('api/', include((api_patterns, 'api'))),
]

# Media y static en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
