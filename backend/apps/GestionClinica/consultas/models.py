from django.conf import settings
from django.db import models
from django.utils import timezone


class ConsultaMedica(models.Model):
    id_consulta = models.BigAutoField(primary_key=True)
    id_cita = models.OneToOneField(
        'citas.Cita',
        on_delete=models.PROTECT,
        db_column='id_cita',
        related_name='consulta_medica',
    )
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.PROTECT,
        db_column='id_paciente',
        related_name='consultas_medicas',
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista',
        on_delete=models.PROTECT,
        db_column='id_especialista',
        related_name='consultas_medicas',
    )
    motivo_consulta = models.TextField()
    anamnesis = models.TextField(blank=True, null=True)
    hallazgos = models.TextField(blank=True, null=True)

    # CU12: Triaje y presion intraocular
    peso_kg = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    talla_cm = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    temperatura_c = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    presion_arterial = models.CharField(max_length=20, blank=True, null=True)
    frecuencia_cardiaca = models.PositiveSmallIntegerField(blank=True, null=True)
    frecuencia_respiratoria = models.PositiveSmallIntegerField(blank=True, null=True)
    saturacion_oxigeno = models.PositiveSmallIntegerField(blank=True, null=True)
    triaje_observaciones = models.TextField(blank=True, null=True)
    presion_intraocular_od = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    presion_intraocular_oi = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)

    # CU13: Examen de refraccion
    refraccion_od_esfera = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    refraccion_od_cilindro = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    refraccion_od_eje = models.PositiveSmallIntegerField(blank=True, null=True)
    refraccion_oi_esfera = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    refraccion_oi_cilindro = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    refraccion_oi_eje = models.PositiveSmallIntegerField(blank=True, null=True)
    agudeza_visual_sc = models.CharField(max_length=20, blank=True, null=True)
    agudeza_visual_cc = models.CharField(max_length=20, blank=True, null=True)

    # CU14: Diagnostico
    diagnostico = models.TextField()
    diagnostico_secundario = models.TextField(blank=True, null=True)
    codigo_cie10 = models.CharField(max_length=12, blank=True, null=True)
    plan_tratamiento = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='consultas_registradas',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'consultas_medicas'
        ordering = ['-fecha_creacion']
