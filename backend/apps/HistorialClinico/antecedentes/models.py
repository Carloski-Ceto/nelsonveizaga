from django.conf import settings
from django.db import models
from django.utils import timezone


class TipoAntecedente(models.TextChoices):
    PATOLOGICO = 'PATOLOGICO', 'Patológico'
    NO_PATOLOGICO = 'NO_PATOLOGICO', 'No Patológico'
    FAMILIAR = 'FAMILIAR', 'Familiar'
    QUIRURGICO = 'QUIRURGICO', 'Quirúrgico'
    ALERGICO = 'ALERGICO', 'Alérgico'
    OTRO = 'OTRO', 'Otro'


class AntecedentePaciente(models.Model):
    id_antecedente = models.BigAutoField(primary_key=True)
    id_historial = models.ForeignKey(
        'historial_clinico.HistorialClinico',
        on_delete=models.PROTECT,
        db_column='id_historial',
        related_name='antecedentes',
    )
    tipo_antecedente = models.CharField(
        max_length=30,
        choices=TipoAntecedente.choices,
        default=TipoAntecedente.PATOLOGICO,
    )
    descripcion = models.TextField()
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='antecedentes_registrados',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'antecedentes_paciente'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['id_historial'], name='idx_antecedente_historial'),
            models.Index(fields=['tipo_antecedente'], name='idx_antecedente_tipo'),
        ]

    def __str__(self):
        return f'Antecedente #{self.id_antecedente} ({self.tipo_antecedente}) — Historial #{self.id_historial_id}'
