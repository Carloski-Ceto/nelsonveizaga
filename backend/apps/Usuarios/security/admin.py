from django.contrib import admin

from .models import BloqueoIntentoLogin, ConfiguracionLoginSeguridad, TokenRecuperacion


@admin.register(ConfiguracionLoginSeguridad)
class ConfiguracionLoginSeguridadAdmin(admin.ModelAdmin):
    list_display = ['id', 'max_intentos_fallidos', 'minutos_bloqueo']

    def has_add_permission(self, request):
        return not ConfiguracionLoginSeguridad.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(BloqueoIntentoLogin)
class BloqueoIntentoLoginAdmin(admin.ModelAdmin):
    list_display = ['login_key', 'intentos_fallidos', 'bloqueado_hasta']
    search_fields = ['login_key']


@admin.register(TokenRecuperacion)
class TokenRecuperacionAdmin(admin.ModelAdmin):
    list_display = ['id_token', 'id_usuario', 'expira_en', 'usado', 'fecha_creacion']
    list_filter = ['usado']
    readonly_fields = ['token', 'fecha_creacion']
    ordering = ['-fecha_creacion']
