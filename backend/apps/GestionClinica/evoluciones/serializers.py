from rest_framework import serializers
from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
from .models import EvolucionPaciente


class EvolucionPacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucionPaciente
        fields = [
            'id_evolucion',
            'id_historial',
            'id_especialista',
            'nota_evolucion',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = [
            'id_evolucion',
            'id_historial',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def validate(self, attrs):
        # Validar el especialista
        especialista = attrs.get('id_especialista')
        if especialista and not especialista.activo:
            raise serializers.ValidationError({'id_especialista': 'El especialista seleccionado no está activo.'})

        # Validar el historial clínico desde la URL
        view = self.context.get('view')
        if not view:
            return attrs

        historial_id = view.kwargs.get('historial_id')
        if not historial_id:
            raise serializers.ValidationError('No se especificó un historial clínico en la URL.')

        try:
            historial = HistorialClinico.objects.get(pk=historial_id)
        except HistorialClinico.DoesNotExist:
            raise serializers.ValidationError('El historial clínico especificado no existe.')

        if historial.estado != EstadoHistorial.ACTIVO:
            raise serializers.ValidationError('No se pueden registrar o modificar evoluciones en un historial clínico archivado.')

        return attrs

    def create(self, validated_data):
        historial_id = self.context['view'].kwargs['historial_id']
        validated_data['id_historial_id'] = historial_id
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)
