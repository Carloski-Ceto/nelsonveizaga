from django.apps import AppConfig


class AuthConfig(AppConfig):
    """
    `name` sigue siendo apps.auth (carpeta modular).
    `label` distinto de 'auth' para no chocar con django.contrib.auth.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.Usuarios.auth'
    label = 'oftalmologia_auth'
    verbose_name = 'Autenticación y sesión'
