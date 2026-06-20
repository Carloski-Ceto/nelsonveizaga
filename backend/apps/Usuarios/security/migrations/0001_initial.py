# Tablas ya existían en apps.users; solo se reclama el estado ORM para oftalmologia_security.

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0004_alter_tokenrecuperacion_token'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
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
                migrations.CreateModel(
                    name='TokenRecuperacion',
                    fields=[
                        ('id_token', models.BigAutoField(primary_key=True, serialize=False)),
                        ('token', models.TextField(db_index=True)),
                        ('expira_en', models.DateTimeField()),
                        ('usado', models.BooleanField(default=False)),
                        (
                            'fecha_creacion',
                            models.DateTimeField(default=django.utils.timezone.now),
                        ),
                        (
                            'id_usuario',
                            models.ForeignKey(
                                db_column='id_usuario',
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='tokens_recuperacion',
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        'verbose_name': 'Token de Recuperación',
                        'verbose_name_plural': 'Tokens de Recuperación',
                        'db_table': 'tokens_recuperacion',
                        'ordering': ['-fecha_creacion'],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
