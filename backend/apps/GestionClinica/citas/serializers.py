from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Cita, EstadoCita, HorarioEspecialista
from .services import validar_disponibilidad


class HorarioEspecialistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioEspecialista
        fields = [
            'id_horario',
            'id_especialista',
            'dia_semana',
            'hora_inicio',
            'hora_fin',
            'duracion_slot_min',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id_horario', 'fecha_creacion', 'fecha_actualizacion']


class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = [
            'id_cita',
            'id_paciente',
            'id_especialista',
            'fecha_hora_inicio',
            'fecha_hora_fin',
            'motivo',
            'estado',
            'motivo_cancelacion',
            'motivo_reprogramacion',
            'observaciones',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = [
            'id_cita',
            'estado',
            'motivo_cancelacion',
            'motivo_reprogramacion',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def validate(self, attrs):
        inicio = attrs['fecha_hora_inicio']
        if inicio <= timezone.now():
            raise serializers.ValidationError('La cita debe programarse en fecha/hora futura.')

        especialista = attrs['id_especialista']
        horario = HorarioEspecialista.objects.filter(
            id_especialista=especialista,
            dia_semana=timezone.localtime(inicio).weekday(),
            activo=True,
        ).order_by('duracion_slot_min').first()
        if not horario:
            raise serializers.ValidationError('El especialista no tiene horario configurado para ese dia.')

        fin = attrs.get('fecha_hora_fin')
        if not fin:
            fin = inicio + timedelta(minutes=horario.duracion_slot_min)
            attrs['fecha_hora_fin'] = fin

        if inicio >= fin:
            raise serializers.ValidationError('fecha_hora_inicio debe ser menor que fecha_hora_fin.')

        validar_disponibilidad(especialista, inicio, fin)
        return attrs

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


class CitaReprogramarSerializer(serializers.Serializer):
    nueva_fecha_hora_inicio = serializers.DateTimeField()
    nueva_fecha_hora_fin = serializers.DateTimeField(required=False)
    motivo_reprogramacion = serializers.CharField(max_length=255)

    def validate(self, attrs):
        cita = self.context['cita']
        if cita.estado in (EstadoCita.CANCELADA, EstadoCita.ATENDIDA):
            raise serializers.ValidationError('No se puede reprogramar cita cancelada o atendida.')

        inicio = attrs['nueva_fecha_hora_inicio']
        if inicio <= timezone.now():
            raise serializers.ValidationError('La nueva fecha debe ser futura.')

        fin = attrs.get('nueva_fecha_hora_fin')
        if not fin:
            fin = inicio + (cita.fecha_hora_fin - cita.fecha_hora_inicio)
            attrs['nueva_fecha_hora_fin'] = fin
        if inicio >= fin:
            raise serializers.ValidationError('nueva_fecha_hora_inicio debe ser menor que nueva_fecha_hora_fin.')

        validar_disponibilidad(cita.id_especialista, inicio, fin, cita_excluir_id=cita.id_cita)
        return attrs

    def save(self, **kwargs):
        cita = self.context['cita']
        with transaction.atomic():
            cita.fecha_hora_inicio = self.validated_data['nueva_fecha_hora_inicio']
            cita.fecha_hora_fin = self.validated_data['nueva_fecha_hora_fin']
            cita.motivo_reprogramacion = self.validated_data['motivo_reprogramacion']
            cita.estado = EstadoCita.REPROGRAMADA
            cita.save(
                update_fields=[
                    'fecha_hora_inicio',
                    'fecha_hora_fin',
                    'motivo_reprogramacion',
                    'estado',
                    'fecha_actualizacion',
                ]
            )
        return cita


class CitaCancelarSerializer(serializers.Serializer):
    motivo_cancelacion = serializers.CharField(max_length=255)

    def validate(self, attrs):
        cita = self.context['cita']
        if cita.estado in (EstadoCita.CANCELADA, EstadoCita.ATENDIDA):
            raise serializers.ValidationError('No se puede cancelar cita cancelada o atendida.')
        return attrs

    def save(self, **kwargs):
        cita = self.context['cita']
        cita.motivo_cancelacion = self.validated_data['motivo_cancelacion']
        cita.estado = EstadoCita.CANCELADA
        cita.save(update_fields=['motivo_cancelacion', 'estado', 'fecha_actualizacion'])
        return cita
