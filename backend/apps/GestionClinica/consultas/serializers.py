from django.db import transaction
from rest_framework import serializers

from apps.GestionClinica.citas.models import EstadoCita

from .models import ConsultaMedica


class ConsultaMedicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultaMedica
        fields = [
            'id_consulta',
            'id_cita',
            'id_paciente',
            'id_especialista',
            'motivo_consulta',
            'anamnesis',
            'hallazgos',
            'peso_kg',
            'talla_cm',
            'temperatura_c',
            'presion_arterial',
            'frecuencia_cardiaca',
            'frecuencia_respiratoria',
            'saturacion_oxigeno',
            'triaje_observaciones',
            'presion_intraocular_od',
            'presion_intraocular_oi',
            'refraccion_od_esfera',
            'refraccion_od_cilindro',
            'refraccion_od_eje',
            'refraccion_oi_esfera',
            'refraccion_oi_cilindro',
            'refraccion_oi_eje',
            'agudeza_visual_sc',
            'agudeza_visual_cc',
            'diagnostico',
            'diagnostico_secundario',
            'codigo_cie10',
            'plan_tratamiento',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id_consulta', 'registrado_por', 'fecha_creacion', 'fecha_actualizacion']

    def validate(self, attrs):
        cita = attrs['id_cita']
        paciente = attrs['id_paciente']
        especialista = attrs['id_especialista']
        if cita.estado in (EstadoCita.CANCELADA, EstadoCita.ATENDIDA):
            raise serializers.ValidationError('La cita está cancelada o ya fue atendida.')
        if paciente.id_paciente != cita.id_paciente_id:
            raise serializers.ValidationError('El paciente no coincide con la cita.')
        if especialista.id_especialista != cita.id_especialista_id:
            raise serializers.ValidationError('El especialista no coincide con la cita.')

        pio_od = attrs.get('presion_intraocular_od')
        pio_oi = attrs.get('presion_intraocular_oi')
        if pio_od is not None and (pio_od < 0 or pio_od > 80):
            raise serializers.ValidationError('La presión intraocular OD debe estar entre 0 y 80 mmHg.')
        if pio_oi is not None and (pio_oi < 0 or pio_oi > 80):
            raise serializers.ValidationError('La presión intraocular OI debe estar entre 0 y 80 mmHg.')

        temp = attrs.get('temperatura_c')
        if temp is not None and (temp < 30 or temp > 45):
            raise serializers.ValidationError('La temperatura debe estar entre 30 y 45 °C.')

        sat = attrs.get('saturacion_oxigeno')
        if sat is not None and sat > 100:
            raise serializers.ValidationError('La saturación de oxígeno no puede ser mayor a 100.')

        eje_od = attrs.get('refraccion_od_eje')
        eje_oi = attrs.get('refraccion_oi_eje')
        if eje_od is not None and eje_od > 180:
            raise serializers.ValidationError('El eje OD debe estar entre 0 y 180.')
        if eje_oi is not None and eje_oi > 180:
            raise serializers.ValidationError('El eje OI debe estar entre 0 y 180.')

        return attrs

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        with transaction.atomic():
            consulta = super().create(validated_data)
            cita = consulta.id_cita
            cita.estado = EstadoCita.ATENDIDA
            cita.save(update_fields=['estado', 'fecha_actualizacion'])
        return consulta
