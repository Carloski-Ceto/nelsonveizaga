import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('consultas', '0002_cu12_cu13_cu14_fields'),
        ('historial_clinico', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='RecetaOptica',
            fields=[
                ('id_receta_optica', models.BigAutoField(primary_key=True, serialize=False)),
                (
                    'tipo',
                    models.CharField(
                        choices=[
                            ('ANTEOJOS', 'Anteojos'),
                            ('CONTACTO', 'Lentes de contacto'),
                            ('AMBOS', 'Anteojos y lentes de contacto'),
                        ],
                        max_length=20,
                    ),
                ),
                ('indicaciones', models.TextField(blank=True, null=True)),
                ('fecha_emision', models.DateTimeField(default=django.utils.timezone.now)),
                (
                    'id_consulta',
                    models.OneToOneField(
                        db_column='id_consulta',
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='receta_optica',
                        to='consultas.consultamedica',
                    ),
                ),
                (
                    'id_historial',
                    models.ForeignKey(
                        db_column='id_historial',
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='recetas_opticas',
                        to='historial_clinico.historialclinico',
                    ),
                ),
                (
                    'registrado_por',
                    models.ForeignKey(
                        db_column='registrado_por',
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='recetas_opticas_emitidas',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'db_table': 'recetas_opticas',
                'ordering': ['-fecha_emision'],
                'indexes': [
                    models.Index(
                        fields=['id_historial', 'fecha_emision'],
                        name='idx_rec_opt_hist_fecha',
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name='DetalleRecetaOptica',
            fields=[
                (
                    'id_detalle_receta_optica',
                    models.BigAutoField(primary_key=True, serialize=False),
                ),
                (
                    'tipo_correccion',
                    models.CharField(
                        choices=[
                            ('ANTEOJOS', 'Anteojos'),
                            ('CONTACTO', 'Lentes de contacto'),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    'ojo',
                    models.CharField(
                        choices=[('OD', 'Ojo derecho'), ('OI', 'Ojo izquierdo')],
                        max_length=2,
                    ),
                ),
                ('esfera', models.DecimalField(decimal_places=2, max_digits=5)),
                ('cilindro', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('eje', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('adicion', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('prisma', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                (
                    'base_prisma',
                    models.CharField(
                        blank=True,
                        choices=[
                            ('SUPERIOR', 'Superior'),
                            ('INFERIOR', 'Inferior'),
                            ('INTERNA', 'Interna'),
                            ('EXTERNA', 'Externa'),
                        ],
                        max_length=10,
                        null=True,
                    ),
                ),
                (
                    'distancia_pupilar_mm',
                    models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
                ),
                ('curva_base_mm', models.DecimalField(blank=True, decimal_places=1, max_digits=3, null=True)),
                ('diametro_mm', models.DecimalField(blank=True, decimal_places=1, max_digits=3, null=True)),
                ('marca', models.CharField(blank=True, max_length=120, null=True)),
                ('modelo', models.CharField(blank=True, max_length=120, null=True)),
                ('material', models.CharField(blank=True, max_length=120, null=True)),
                ('modalidad_reemplazo', models.CharField(blank=True, max_length=80, null=True)),
                ('observaciones', models.CharField(blank=True, max_length=255, null=True)),
                (
                    'id_receta_optica',
                    models.ForeignKey(
                        db_column='id_receta_optica',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='detalles',
                        to='recetas_opticas.recetaoptica',
                    ),
                ),
            ],
            options={
                'db_table': 'detalles_receta_optica',
                'ordering': ['tipo_correccion', 'ojo'],
                'constraints': [
                    models.UniqueConstraint(
                        fields=('id_receta_optica', 'tipo_correccion', 'ojo'),
                        name='uq_det_rec_opt_tipo_ojo',
                    ),
                    models.CheckConstraint(
                        condition=(
                            models.Q(eje__isnull=True)
                            | models.Q(eje__gte=0, eje__lte=180)
                        ),
                        name='ck_det_rec_opt_eje_rango',
                    ),
                    models.CheckConstraint(
                        condition=(
                            models.Q(base_prisma__isnull=True, prisma__isnull=True)
                            | models.Q(base_prisma__isnull=False, prisma__isnull=False)
                        ),
                        name='ck_det_rec_opt_prisma_base',
                    ),
                    models.CheckConstraint(
                        condition=(
                            models.Q(
                                base_prisma__isnull=True,
                                curva_base_mm__isnull=False,
                                diametro_mm__isnull=False,
                                distancia_pupilar_mm__isnull=True,
                                marca__isnull=False,
                                modelo__isnull=False,
                                prisma__isnull=True,
                                tipo_correccion='CONTACTO',
                            )
                            | models.Q(
                                curva_base_mm__isnull=True,
                                diametro_mm__isnull=True,
                                distancia_pupilar_mm__isnull=False,
                                marca__isnull=True,
                                material__isnull=True,
                                modalidad_reemplazo__isnull=True,
                                modelo__isnull=True,
                                tipo_correccion='ANTEOJOS',
                            )
                        ),
                        name='ck_det_rec_opt_campos_tipo',
                    ),
                ],
            },
        ),
    ]
