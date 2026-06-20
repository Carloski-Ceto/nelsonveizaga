from django.conf import settings
from django.db import models
from django.utils import timezone


class RecetaMedicamento(models.Model):
    id_receta = models.BigAutoField(primary_key=True)
    id_historial = models.ForeignKey(
        'historial_clinico.HistorialClinico',
        on_delete=models.PROTECT,
        db_column='id_historial',
        related_name='recetas',
    )
    id_consulta = models.ForeignKey(
        'consultas.ConsultaMedica',
        on_delete=models.PROTECT,
        db_column='id_consulta',
        related_name='recetas',
        null=True,
        blank=True,
    )
    medicamentos = models.JSONField()  # Almacena una lista de diccionarios: [{"nombre": "...", "dosis": "...", "frecuencia": "...", "duracion": "..."}]
    indicaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='recetas_registradas',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recetas_medicamentos'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['id_historial'], name='idx_receta_historial'),
            models.Index(fields=['id_consulta'], name='idx_receta_consulta'),
        ]

    def __str__(self):
        return f'Receta #{self.id_receta} — Historial #{self.id_historial_id} (Registrado por {self.registrado_por.username})'
