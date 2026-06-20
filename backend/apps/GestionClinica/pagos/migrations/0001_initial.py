from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('citas', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PagoCita',
            fields=[
                ('id_pago', models.BigAutoField(primary_key=True, serialize=False)),
                ('id_cita', models.OneToOneField(
                    db_column='id_cita',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='pago',
                    to='citas.cita',
                )),
                ('stripe_payment_intent_id', models.CharField(max_length=255, unique=True)),
                ('monto', models.DecimalField(decimal_places=2, max_digits=10)),
                ('moneda', models.CharField(default='usd', max_length=3)),
                ('estado', models.CharField(
                    choices=[
                        ('PENDIENTE', 'Pendiente'),
                        ('PAGADO', 'Pagado'),
                        ('FALLIDO', 'Fallido'),
                        ('REEMBOLSADO', 'Reembolsado'),
                    ],
                    default='PENDIENTE',
                    max_length=20,
                )),
                ('fecha_pago', models.DateTimeField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'pagos_cita'},
        ),
    ]
