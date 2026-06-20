from django.db import models
from django.utils import timezone

from apps.GestionClinica.medicos.models import Medico


class Especialista(models.Model):
    id_especialista = models.BigAutoField(primary_key=True)
    id_medico = models.OneToOneField(
        Medico,
        on_delete=models.PROTECT,
        db_column='id_medico',
        related_name='perfil_especialista',
    )
    especialidad = models.CharField(max_length=120)
    registro_profesional = models.CharField(max_length=60, unique=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'especialistas'
        verbose_name = 'Especialista'
        verbose_name_plural = 'Especialistas'
        ordering = ['id_medico__id_usuario__apellidos', 'id_medico__id_usuario__nombres']

    def __str__(self):
        return f'{self.id_medico.id_usuario.get_full_name()} - {self.especialidad}'
