from django.conf import settings
from django.db import models
from django.utils import timezone


class EvolucionPaciente(models.Model):
    id_evolucion = models.BigAutoField(primary_key=True)
    id_historial = models.ForeignKey(
        'historial_clinico.HistorialClinico',
        on_delete=models.PROTECT,
        db_column='id_historial',
        related_name='evoluciones',
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista',
        on_delete=models.PROTECT,
        db_column='id_especialista',
        related_name='evoluciones',
    )
    nota_evolucion = models.TextField()
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='evoluciones_registradas',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evoluciones_paciente'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['id_historial'], name='idx_evolucion_historial'),
            models.Index(fields=['id_especialista'], name='idx_evolucion_especialista'),
        ]

    def __str__(self):
        return f'Evolución #{self.id_evolucion} — Historial #{self.id_historial_id} (Especialista {self.id_especialista_id})'
