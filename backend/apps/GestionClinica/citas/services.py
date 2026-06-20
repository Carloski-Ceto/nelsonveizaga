from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from .models import Cita, EstadoCita, HorarioEspecialista


def validar_disponibilidad(especialista, inicio, fin, cita_excluir_id=None):
    inicio_local = timezone.localtime(inicio)
    dia_semana = inicio_local.weekday()
    hora_inicio = inicio_local.time()
    hora_fin = timezone.localtime(fin).time()

    horario_valido = HorarioEspecialista.objects.filter(
        id_especialista=especialista,
        dia_semana=dia_semana,
        activo=True,
        hora_inicio__lte=hora_inicio,
        hora_fin__gte=hora_fin,
    ).exists()

    if not horario_valido:
        raise serializers.ValidationError('No existe horario disponible del especialista para ese bloque.')

    qs = Cita.objects.filter(
        id_especialista=especialista,
        estado__in=[EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA],
    ).filter(
        Q(fecha_hora_inicio__lt=fin) & Q(fecha_hora_fin__gt=inicio)
    )
    if cita_excluir_id:
        qs = qs.exclude(pk=cita_excluir_id)

    if qs.exists():
        raise serializers.ValidationError('El especialista ya tiene una cita en ese horario.')
