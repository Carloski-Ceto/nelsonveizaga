from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('pacientes', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='HistorialClinico',
            fields=[
                ('id_historial', models.BigAutoField(primary_key=True, serialize=False)),
                ('estado', models.CharField(
                    choices=[('ACTIVO', 'Activo'), ('ARCHIVADO', 'Archivado')],
                    default='ACTIVO',
                    max_length=20,
                )),
                ('motivo_archivo', models.TextField(blank=True, null=True)),
                ('fecha_archivo', models.DateTimeField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('id_paciente', models.ForeignKey(
                    db_column='id_paciente',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='historiales',
                    to='pacientes.paciente',
                )),
                ('archivado_por', models.ForeignKey(
                    blank=True,
                    db_column='archivado_por',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='historiales_archivados',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('registrado_por', models.ForeignKey(
                    db_column='registrado_por',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='historiales_registrados',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'historiales_clinicos',
                'ordering': ['-fecha_creacion'],
            },
        ),
        migrations.AddIndex(
            model_name='historialclinico',
            index=models.Index(fields=['id_paciente'], name='idx_historial_paciente'),
        ),
        migrations.AddIndex(
            model_name='historialclinico',
            index=models.Index(fields=['estado'], name='idx_historial_estado'),
        ),
        migrations.AddConstraint(
            model_name='historialclinico',
            constraint=models.UniqueConstraint(
                condition=models.Q(estado='ACTIVO'),
                fields=['id_paciente'],
                name='uq_historial_activo_por_paciente',
            ),
        ),
    ]
