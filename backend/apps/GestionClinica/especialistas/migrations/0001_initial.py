from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0005_remove_security_models_state_only'),
    ]

    operations = [
        migrations.CreateModel(
            name='Especialista',
            fields=[
                ('id_especialista', models.BigAutoField(primary_key=True, serialize=False)),
                ('especialidad', models.CharField(max_length=120)),
                ('registro_profesional', models.CharField(max_length=60, unique=True)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('id_usuario', models.OneToOneField(db_column='id_usuario', on_delete=django.db.models.deletion.PROTECT, related_name='perfil_especialista', to='users.usuario')),
            ],
            options={
                'verbose_name': 'Especialista',
                'verbose_name_plural': 'Especialistas',
                'db_table': 'especialistas',
                'ordering': ['id_usuario__apellidos', 'id_usuario__nombres'],
            },
        ),
    ]
