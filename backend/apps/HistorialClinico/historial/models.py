"""
apps/HistorialClinico/historial/models.py
Modelo de historial clínico del paciente — CU20 Archivar historial clínico.
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class EstadoHistorial(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    ARCHIVADO = 'ARCHIVADO', 'Archivado'


class HistorialClinico(models.Model):
    id_historial = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.PROTECT,
        db_column='id_paciente',
        related_name='historiales',
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoHistorial.choices,
        default=EstadoHistorial.ACTIVO,
    )
    motivo_archivo = models.TextField(blank=True, null=True)
    archivado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='archivado_por',
        related_name='historiales_archivados',
    )
    fecha_archivo = models.DateTimeField(null=True, blank=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='historiales_registrados',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'historiales_clinicos'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['id_paciente'], name='idx_historial_paciente'),
            models.Index(fields=['estado'], name='idx_historial_estado'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['id_paciente'],
                condition=models.Q(estado='ACTIVO'),
                name='uq_historial_activo_por_paciente',
            )
        ]

    def clean(self):
        if self.estado == EstadoHistorial.ARCHIVADO and not self.motivo_archivo:
            raise ValidationError(
                {'motivo_archivo': 'El motivo de archivo es requerido al archivar el historial.'}
            )

    def __str__(self):
        return f'Historial #{self.id_historial} — Paciente {self.id_paciente_id} ({self.estado})'
