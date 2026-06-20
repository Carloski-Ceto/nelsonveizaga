from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = [
        'username', 'email', 'nombres', 'apellidos',
        'tipo_usuario', 'estado', 'is_staff', 'ultimo_acceso',
    ]
    list_filter = ['tipo_usuario', 'estado', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'nombres', 'apellidos']
    ordering = ['apellidos', 'nombres']

    fieldsets = (
        ('Credenciales', {'fields': ('username', 'email', 'password')}),
        ('Información Personal', {'fields': ('nombres', 'apellidos', 'telefono', 'foto_perfil')}),
        ('Tipo y Estado', {'fields': ('tipo_usuario', 'estado')}),
        ('Permisos Django', {
            'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Fechas', {
            'fields': ('ultimo_acceso', 'fecha_creacion', 'fecha_actualizacion', 'last_login')
        }),
    )
    readonly_fields = ['ultimo_acceso', 'fecha_creacion', 'fecha_actualizacion', 'last_login']

    add_fieldsets = (
        ('Nuevo Usuario', {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'nombres', 'apellidos',
                'tipo_usuario', 'password1', 'password2',
            ),
        }),
    )
