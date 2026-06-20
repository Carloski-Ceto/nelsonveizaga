from django.contrib import admin

from .models import Medico


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ['id_medico', 'id_usuario', 'matricula', 'anios_experiencia', 'activo']
    list_filter = ['activo']
    search_fields = ['id_usuario__username', 'id_usuario__nombres', 'id_usuario__apellidos', 'matricula']
    ordering = ['id_usuario__apellidos']
