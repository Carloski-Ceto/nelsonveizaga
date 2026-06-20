from django.db import migrations, models
import django.db.models.deletion
import django.db.models.expressions
import django.db.models.query_utils
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('especialistas', '0001_initial'),
        ('pacientes', '0001_initial'),
        ('users', '0005_remove_security_models_state_only'),
    ]

    operations = [
        migrations.CreateModel(
            name='HorarioEspecialista',
            fields=[
                ('id_horario', models.BigAutoField(primary_key=True, serialize=False)),
                ('dia_semana', models.IntegerField(choices=[(0, 'Lunes'), (1, 'Martes'), (2, 'Miercoles'), (3, 'Jueves'), (4, 'Viernes'), (5, 'Sabado'), (6, 'Domingo')])),
                ('hora_inicio', models.TimeField()),
                ('hora_fin', models.TimeField()),
                ('duracion_slot_min', models.PositiveIntegerField(default=30)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('id_especialista', models.ForeignKey(db_column='id_especialista', on_delete=django.db.models.deletion.CASCADE, related_name='horarios', to='especialistas.especialista')),
            ],
            options={
                'db_table': 'horarios_especialista',
                'ordering': ['id_especialista', 'dia_semana', 'hora_inicio'],
                'constraints': [models.UniqueConstraint(fields=('id_especialista', 'dia_semana', 'hora_inicio', 'hora_fin'), name='uq_horario_especialista_bloque')],
            },
        ),
        migrations.CreateModel(
            name='Cita',
            fields=[
                ('id_cita', models.BigAutoField(primary_key=True, serialize=False)),
                ('fecha_hora_inicio', models.DateTimeField()),
                ('fecha_hora_fin', models.DateTimeField(blank=True, null=True)),
                ('motivo', models.CharField(max_length=255)),
                ('estado', models.CharField(choices=[('PROGRAMADA', 'Programada'), ('CONFIRMADA', 'Confirmada'), ('ATENDIDA', 'Atendida'), ('CANCELADA', 'Cancelada'), ('REPROGRAMADA', 'Reprogramada')], default='PROGRAMADA', max_length=20)),
                ('motivo_cancelacion', models.CharField(blank=True, max_length=255, null=True)),
                ('motivo_reprogramacion', models.CharField(blank=True, max_length=255, null=True)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('id_especialista', models.ForeignKey(db_column='id_especialista', on_delete=django.db.models.deletion.PROTECT, related_name='citas', to='especialistas.especialista')),
                ('id_paciente', models.ForeignKey(db_column='id_paciente', on_delete=django.db.models.deletion.PROTECT, related_name='citas', to='pacientes.paciente')),
                ('registrado_por', models.ForeignKey(db_column='registrado_por', on_delete=django.db.models.deletion.PROTECT, related_name='citas_registradas', to='users.usuario')),
            ],
            options={
                'db_table': 'citas',
                'ordering': ['-fecha_hora_inicio'],
                'indexes': [models.Index(fields=['id_especialista', 'fecha_hora_inicio'], name='citas_id_esp_fecha_h_80f8ff_idx'), models.Index(fields=['id_paciente', 'fecha_hora_inicio'], name='citas_id_pac_fecha_h_56b320_idx'), models.Index(fields=['estado', 'fecha_hora_inicio'], name='citas_estado_fecha_h_4673bf_idx')],
                'constraints': [models.UniqueConstraint(condition=django.db.models.query_utils.Q(('estado__in', ['PROGRAMADA', 'CONFIRMADA'])), fields=('id_especialista', 'fecha_hora_inicio'), name='uq_cita_especialista_fecha_hora_activa')],
            },
        ),
    ]
