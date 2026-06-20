from rest_framework import serializers
from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
from apps.GestionClinica.consultas.models import ConsultaMedica
from .models import RecetaMedicamento


class RecetaMedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecetaMedicamento
        fields = [
            'id_receta',
            'id_historial',
            'id_consulta',
            'medicamentos',
            'indicaciones',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = [
            'id_receta',
            'id_historial',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def validate_medicamentos(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Los medicamentos deben ser una lista.')
        if len(value) == 0:
            raise serializers.ValidationError('La receta debe contener al menos un medicamento.')
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError('Cada medicamento debe ser un objeto.')
            required_keys = ['nombre', 'dosis', 'frecuencia', 'duracion']
            for key in required_keys:
                if key not in item or not str(item[key]).strip():
                    raise serializers.ValidationError(f'El campo "{key}" es obligatorio para cada medicamento.')
        return value

    def validate(self, attrs):
        # Validar la consulta si se pasa
        consulta = attrs.get('id_consulta')
        if consulta:
            try:
                ConsultaMedica.objects.get(pk=consulta.pk)
            except ConsultaMedica.DoesNotExist:
                raise serializers.ValidationError({'id_consulta': 'La consulta médica especificada no existe.'})

        # Validar el historial clínico desde la URL de la vista
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
            raise serializers.ValidationError('No se pueden emitir recetas para un historial clínico archivado.')

        return attrs

    def create(self, validated_data):
        historial_id = self.context['view'].kwargs['historial_id']
        validated_data['id_historial_id'] = historial_id
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)
