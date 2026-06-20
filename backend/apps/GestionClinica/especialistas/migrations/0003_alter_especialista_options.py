from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('especialistas', '0002_link_especialista_to_medico'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='especialista',
            options={
                'ordering': ['id_medico__id_usuario__apellidos', 'id_medico__id_usuario__nombres'],
                'verbose_name': 'Especialista',
                'verbose_name_plural': 'Especialistas',
            },
        ),
    ]
