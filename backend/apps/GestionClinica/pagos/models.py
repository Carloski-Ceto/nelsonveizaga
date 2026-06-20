from django.db import models


class EstadoPago(models.TextChoices):
    PENDIENTE   = 'PENDIENTE',   'Pendiente'
    PAGADO      = 'PAGADO',      'Pagado'
    FALLIDO     = 'FALLIDO',     'Fallido'
    REEMBOLSADO = 'REEMBOLSADO', 'Reembolsado'


class PagoCita(models.Model):
    id_pago = models.BigAutoField(primary_key=True)
    id_cita = models.OneToOneField(
        'citas.Cita',
        on_delete=models.PROTECT,
        db_column='id_cita',
        related_name='pago',
    )
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    moneda = models.CharField(max_length=3, default='usd')
    estado = models.CharField(
        max_length=20,
        choices=EstadoPago.choices,
        default=EstadoPago.PENDIENTE,
    )
    fecha_pago = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pagos_cita'
