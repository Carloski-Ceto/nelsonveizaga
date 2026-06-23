from django.conf import settings
from django.db import models
from django.utils import timezone


class TipoRecetaOptica(models.TextChoices):
    ANTEOJOS = 'ANTEOJOS', 'Anteojos'
    CONTACTO = 'CONTACTO', 'Lentes de contacto'
    AMBOS = 'AMBOS', 'Anteojos y lentes de contacto'


class TipoCorreccionOptica(models.TextChoices):
    ANTEOJOS = 'ANTEOJOS', 'Anteojos'
    CONTACTO = 'CONTACTO', 'Lentes de contacto'


class Ojo(models.TextChoices):
    OD = 'OD', 'Ojo derecho'
    OI = 'OI', 'Ojo izquierdo'


class BasePrisma(models.TextChoices):
    SUPERIOR = 'SUPERIOR', 'Superior'
    INFERIOR = 'INFERIOR', 'Inferior'
    INTERNA = 'INTERNA', 'Interna'
    EXTERNA = 'EXTERNA', 'Externa'


class RecetaOptica(models.Model):
    id_receta_optica = models.BigAutoField(primary_key=True)
    id_historial = models.ForeignKey(
        'historial_clinico.HistorialClinico',
        on_delete=models.PROTECT,
        db_column='id_historial',
        related_name='recetas_opticas',
    )
    id_consulta = models.OneToOneField(
        'consultas.ConsultaMedica',
        on_delete=models.PROTECT,
        db_column='id_consulta',
        related_name='receta_optica',
    )
    tipo = models.CharField(max_length=20, choices=TipoRecetaOptica.choices)
    indicaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='registrado_por',
        related_name='recetas_opticas_emitidas',
    )
    fecha_emision = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'recetas_opticas'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['id_historial', 'fecha_emision'], name='idx_rec_opt_hist_fecha'),
        ]

    def __str__(self):
        return f'Receta óptica #{self.id_receta_optica} — Consulta #{self.id_consulta_id}'


class DetalleRecetaOptica(models.Model):
    id_detalle_receta_optica = models.BigAutoField(primary_key=True)
    id_receta_optica = models.ForeignKey(
        RecetaOptica,
        on_delete=models.CASCADE,
        db_column='id_receta_optica',
        related_name='detalles',
    )
    tipo_correccion = models.CharField(max_length=20, choices=TipoCorreccionOptica.choices)
    ojo = models.CharField(max_length=2, choices=Ojo.choices)
    esfera = models.DecimalField(max_digits=5, decimal_places=2)
    cilindro = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    eje = models.PositiveSmallIntegerField(blank=True, null=True)
    adicion = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    prisma = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    base_prisma = models.CharField(max_length=10, choices=BasePrisma.choices, blank=True, null=True)
    distancia_pupilar_mm = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    curva_base_mm = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    diametro_mm = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    marca = models.CharField(max_length=120, blank=True, null=True)
    modelo = models.CharField(max_length=120, blank=True, null=True)
    material = models.CharField(max_length=120, blank=True, null=True)
    modalidad_reemplazo = models.CharField(max_length=80, blank=True, null=True)
    observaciones = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'detalles_receta_optica'
        ordering = ['tipo_correccion', 'ojo']
        constraints = [
            models.UniqueConstraint(
                fields=['id_receta_optica', 'tipo_correccion', 'ojo'],
                name='uq_det_rec_opt_tipo_ojo',
            ),
            models.CheckConstraint(
                condition=models.Q(eje__isnull=True) | models.Q(eje__gte=0, eje__lte=180),
                name='ck_det_rec_opt_eje_rango',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(prisma__isnull=True, base_prisma__isnull=True)
                    | models.Q(prisma__isnull=False, base_prisma__isnull=False)
                ),
                name='ck_det_rec_opt_prisma_base',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        tipo_correccion=TipoCorreccionOptica.CONTACTO,
                        curva_base_mm__isnull=False,
                        diametro_mm__isnull=False,
                        marca__isnull=False,
                        modelo__isnull=False,
                        distancia_pupilar_mm__isnull=True,
                        prisma__isnull=True,
                        base_prisma__isnull=True,
                    )
                    | models.Q(
                        tipo_correccion=TipoCorreccionOptica.ANTEOJOS,
                        curva_base_mm__isnull=True,
                        diametro_mm__isnull=True,
                        marca__isnull=True,
                        modelo__isnull=True,
                        material__isnull=True,
                        modalidad_reemplazo__isnull=True,
                        distancia_pupilar_mm__isnull=False,
                    )
                ),
                name='ck_det_rec_opt_campos_tipo',
            ),
        ]

    def __str__(self):
        return f'{self.tipo_correccion} {self.ojo} — Receta #{self.id_receta_optica_id}'
