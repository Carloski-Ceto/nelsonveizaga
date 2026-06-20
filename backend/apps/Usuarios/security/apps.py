from django.apps import AppConfig


class SecurityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.Usuarios.security'
    label = 'oftalmologia_security'
    verbose_name = 'Seguridad de acceso (login, recuperación)'
