"""
apps/security/models.py
Persistencia de políticas de login, bloqueo por intentos y códigos de recuperación de contraseña.

El usuario (`AUTH_USER_MODEL`) permanece en apps.users.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class ConfiguracionLoginSeguridad(models.Model):
    """
    Fila única (pk=1): umbral de intentos y minutos de bloqueo por login.
    Solo ADMIN puede cambiarla vía API del panel.
    """
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    max_intentos_fallidos = models.PositiveSmallIntegerField(default=5)
    minutos_bloqueo = models.PositiveSmallIntegerField(default=10)

    class Meta:
        db_table = 'configuracion_login_seguridad'
        verbose_name = 'Configuración seguridad login'
        verbose_name_plural = 'Configuración seguridad login'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.max_intentos_fallidos} intentos / {self.minutos_bloqueo} min'

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                'max_intentos_fallidos': 5,
                'minutos_bloqueo': 10,
            },
        )
        return obj


class BloqueoIntentoLogin(models.Model):
    """Estado de intentos fallidos por clave de login (email en minúsculas o username tal cual)."""

    login_key = models.CharField(max_length=120, unique=True, db_index=True)
    intentos_fallidos = models.PositiveSmallIntegerField(default=0)
    bloqueado_hasta = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bloqueo_intento_login'
        verbose_name = 'Bloqueo intento login'
        verbose_name_plural = 'Bloqueos intento login'

    def __str__(self):
        return f'{self.login_key} ({self.intentos_fallidos})'


class TokenRecuperacion(models.Model):
    """Código de un solo uso para restablecimiento de contraseña (vigencia vía settings)."""
    id_token = models.BigAutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='tokens_recuperacion',
    )
    token = models.TextField(db_index=True)
    expira_en = models.DateTimeField()
    usado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tokens_recuperacion'
        verbose_name = 'Token de Recuperación'
        verbose_name_plural = 'Tokens de Recuperación'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'Token {self.id_token} — {self.id_usuario} [usado={self.usado}]'
