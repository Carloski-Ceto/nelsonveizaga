"""
apps/users/models.py
Modelo de identidad del personal (AUTH_USER_MODEL).

Seguridad de login, bloqueo por intentos y tokens de recuperación → apps.security.models
Flujos HTTP login/JWT/reset → apps.auth
Roles y permisos → apps.roles, apps.permisos
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UsuarioManager


class TipoUsuario(models.TextChoices):
    ADMINISTRATIVO = 'ADMINISTRATIVO', 'Administrativo'
    MEDICO = 'MEDICO', 'Médico'
    ESPECIALISTA = 'ESPECIALISTA', 'Especialista'
    ADMIN = 'ADMIN', 'Admin del Sistema'


class EstadoUsuario(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    INACTIVO = 'INACTIVO', 'Inactivo'
    BLOQUEADO = 'BLOQUEADO', 'Bloqueado'


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Usuarios del sistema: personal administrativo, médicos y especialistas.
    Los pacientes NO son usuarios; son gestionados como registros por el personal.
    """
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=120, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to='perfiles/', blank=True, null=True)
    tipo_usuario = models.CharField(max_length=20, choices=TipoUsuario.choices)
    estado = models.CharField(
        max_length=20, choices=EstadoUsuario.choices, default=EstadoUsuario.ACTIVO
    )
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'nombres', 'apellidos', 'tipo_usuario']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.username})'

    def get_full_name(self):
        return f'{self.nombres} {self.apellidos}'

    def get_short_name(self):
        return self.nombres
