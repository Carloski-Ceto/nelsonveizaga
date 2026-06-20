# Generated manually for login lockout + admin-editable security config

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_usuario_tipo_usuario'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguracionLoginSeguridad',
            fields=[
                (
                    'id',
                    models.PositiveSmallIntegerField(
                        default=1, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ('max_intentos_fallidos', models.PositiveSmallIntegerField(default=5)),
                ('minutos_bloqueo', models.PositiveSmallIntegerField(default=10)),
            ],
            options={
                'verbose_name': 'Configuración seguridad login',
                'verbose_name_plural': 'Configuración seguridad login',
                'db_table': 'configuracion_login_seguridad',
            },
        ),
        migrations.CreateModel(
            name='BloqueoIntentoLogin',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('login_key', models.CharField(db_index=True, max_length=120, unique=True)),
                ('intentos_fallidos', models.PositiveSmallIntegerField(default=0)),
                ('bloqueado_hasta', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Bloqueo intento login',
                'verbose_name_plural': 'Bloqueos intento login',
                'db_table': 'bloqueo_intento_login',
            },
        ),
    ]
