from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('consultas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='consultamedica',
            name='agudeza_visual_cc',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='agudeza_visual_sc',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='codigo_cie10',
            field=models.CharField(blank=True, max_length=12, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='diagnostico_secundario',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='frecuencia_cardiaca',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='frecuencia_respiratoria',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='peso_kg',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='presion_arterial',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='presion_intraocular_od',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='presion_intraocular_oi',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='refraccion_od_cilindro',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='refraccion_od_eje',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='refraccion_od_esfera',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='refraccion_oi_cilindro',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='refraccion_oi_eje',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='refraccion_oi_esfera',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='saturacion_oxigeno',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='talla_cm',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='temperatura_c',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='consultamedica',
            name='triaje_observaciones',
            field=models.TextField(blank=True, null=True),
        ),
    ]
