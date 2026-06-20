from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone


class DiaSemana(models.IntegerChoices):
    LUNES = 0, 'Lunes'
    MARTES = 1, 'Martes'
    MIERCOLES = 2, 'Miercoles'
    JUEVES = 3, 'Jueves'
    VIERNES = 4, 'Viernes'
    SABADO = 5, 'Sabado'
    DOMINGO = 6, 'Domingo'


class EstadoCita(models.TextChoices):
    PROGRAMADA = 'PROGRAMADA', 'Programada'
    CONFIRMADA = 'CONFIRMADA', 'Confirmada'
    ATENDIDA = 'ATENDIDA', 'Atendida'
    CANCELADA = 'CANCELADA', 'Cancelada'
    REPROGRAMADA = 'REPROGRAMADA', 'Reprogramada'


class HorarioEspecialista(models.Model):
    id_horario = models.BigAutoField(primary_key=True)
    id_especialista = models.ForeignKey(
        'especialistas.Especialista',
        on_delete=models.CASCADE,
        db_column='id_especialista',
        related_name='horarios',
    )
    dia_semana = models.IntegerField(choices=DiaSemana.choices)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    duracion_slot_min = models.PositiveIntegerField(default=30)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'horarios_especialista'
        ordering = ['id_especialista', 'dia_semana', 'hora_inicio']
        constraints = [
            models.UniqueConstraint(
                fields=['id_especialista', 'dia_semana', 'hora_inicio', 'hora_fin'],
                name='uq_horario_especialista_bloque',
            )
        ]

    def clean(self):
        if self.hora_inicio >= self.hora_fin:
            raise ValidationError('hora_inicio debe ser menor que hora_fin.')
        if self.duracion_slot_min <= 0:
            raise ValidationError('duracion_slot_min debe ser mayor a 0.')


class Cita(models.Model):
    id_cita = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.PROTECT,
        db_column='id_paciente',
        related_name='citas',
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista',
        on_delete=models.PROTECT,
        db_column='id_especialista',
        related_name='citas',
    )
    fecha_hora_inicio = models.DateTimeField()
    fecha_hora_fin = models.DateTimeField(blank=True, null=True)
    motivo = models.CharField(max_length=255)
    estado = models.CharField(max_length=20, choices=EstadoCita.choices, default=EstadoCita.PROGRAMADA)
    motivo_cancelacion = models.CharField(max_length=255, blank=True, null=True)
    motivo_reprogramacion = models.CharField(max_length=255, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='citas_registradas',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'citas'
        ordering = ['-fecha_hora_inicio']
        indexes = [
            models.Index(fields=['id_especialista', 'fecha_hora_inicio']),
            models.Index(fields=['id_paciente', 'fecha_hora_inicio']),
            models.Index(fields=['estado', 'fecha_hora_inicio']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['id_especialista', 'fecha_hora_inicio'],
                condition=Q(estado__in=[EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA]),
                name='uq_cita_especialista_fecha_hora_activa',
            )
        ]

    def clean(self):
        if self.fecha_hora_fin and self.fecha_hora_inicio >= self.fecha_hora_fin:
            raise ValidationError('fecha_hora_inicio debe ser menor que fecha_hora_fin.')

    def calcular_fin_por_defecto(self, duracion_min):
        self.fecha_hora_fin = self.fecha_hora_inicio + timedelta(minutes=duracion_min)
