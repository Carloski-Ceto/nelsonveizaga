from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('medicos', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='medico',
            name='especialidad_principal',
        ),
        migrations.RemoveField(
            model_name='medico',
            name='subespecialidad',
        ),
    ]
