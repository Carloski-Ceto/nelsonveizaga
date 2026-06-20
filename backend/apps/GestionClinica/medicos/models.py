from django.conf import settings
from django.db import models
from django.utils import timezone


class Medico(models.Model):
    id_medico = models.BigAutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='id_usuario',
        related_name='perfil_medico',
    )
    matricula = models.CharField(max_length=60, unique=True)
    anios_experiencia = models.PositiveSmallIntegerField(default=0)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medicos'
        verbose_name = 'Médico'
        verbose_name_plural = 'Médicos'
        ordering = ['id_usuario__apellidos', 'id_usuario__nombres']

    def __str__(self):
        return f'{self.id_usuario.get_full_name()} - {self.matricula}'
