"""
Paquete Usuarios/Roles - modelos de rol.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class Rol(models.Model):
    id_rol = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class UsuarioRol(models.Model):
    id_usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='usuario_roles',
    )
    id_rol = models.ForeignKey(
        Rol,
        on_delete=models.CASCADE,
        db_column='id_rol',
        related_name='usuario_roles',
    )
    fecha_asignacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'usuario_rol'
        unique_together = ('id_usuario', 'id_rol')
        verbose_name = 'Usuario-Rol'
        verbose_name_plural = 'Asignaciones Usuario-Rol'

    def __str__(self):
        return f'{self.id_usuario} → {self.id_rol}'


class RolPermiso(models.Model):
    id_rol = models.ForeignKey(
        Rol,
        on_delete=models.CASCADE,
        db_column='id_rol',
        related_name='rol_permisos',
    )
    id_permiso = models.ForeignKey(
        'permisos.Permiso',
        on_delete=models.CASCADE,
        db_column='id_permiso',
        related_name='rol_permisos',
    )
    fecha_asignacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'rol_permiso'
        unique_together = ('id_rol', 'id_permiso')
        verbose_name = 'Rol-Permiso'
        verbose_name_plural = 'Asignaciones Rol-Permiso'

    def __str__(self):
        return f'{self.id_rol} → {self.id_permiso}'
