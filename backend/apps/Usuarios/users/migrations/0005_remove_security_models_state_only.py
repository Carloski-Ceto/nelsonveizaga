# Los modelos pasan a apps.security (mismas tablas en BD). Solo se actualiza el estado de users.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_tokenrecuperacion_token'),
        # AppConfig.label en apps/security/apps.py (no usar el nombre de carpeta "security")
        ('oftalmologia_security', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='TokenRecuperacion'),
                migrations.DeleteModel(name='BloqueoIntentoLogin'),
                migrations.DeleteModel(name='ConfiguracionLoginSeguridad'),
            ],
            database_operations=[],
        ),
    ]
