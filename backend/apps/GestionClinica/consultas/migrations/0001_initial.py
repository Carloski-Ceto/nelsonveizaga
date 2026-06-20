from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('citas', '0001_initial'),
        ('especialistas', '0001_initial'),
        ('pacientes', '0001_initial'),
        ('users', '0005_remove_security_models_state_only'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConsultaMedica',
            fields=[
                ('id_consulta', models.BigAutoField(primary_key=True, serialize=False)),
                ('motivo_consulta', models.TextField()),
                ('anamnesis', models.TextField(blank=True, null=True)),
                ('hallazgos', models.TextField(blank=True, null=True)),
                ('diagnostico', models.TextField()),
                ('plan_tratamiento', models.TextField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('id_cita', models.OneToOneField(db_column='id_cita', on_delete=django.db.models.deletion.PROTECT, related_name='consulta_medica', to='citas.cita')),
                ('id_especialista', models.ForeignKey(db_column='id_especialista', on_delete=django.db.models.deletion.PROTECT, related_name='consultas_medicas', to='especialistas.especialista')),
                ('id_paciente', models.ForeignKey(db_column='id_paciente', on_delete=django.db.models.deletion.PROTECT, related_name='consultas_medicas', to='pacientes.paciente')),
                ('registrado_por', models.ForeignKey(db_column='registrado_por', on_delete=django.db.models.deletion.PROTECT, related_name='consultas_registradas', to='users.usuario')),
            ],
            options={
                'db_table': 'consultas_medicas',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]
