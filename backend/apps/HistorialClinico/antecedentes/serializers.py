from rest_framework import serializers
from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
from .models import AntecedentePaciente, TipoAntecedente


class AntecedentePacienteSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = AntecedentePaciente
        fields = [
            'id_antecedente',
            'id_historial',
            'tipo_antecedente',
            'descripcion',
            'registrado_por',
            'registrado_por_nombre',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = [
            'id_antecedente',
            'id_historial',
            'registrado_por',
            'registrado_por_nombre',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def get_registrado_por_nombre(self, obj):
        if obj.registrado_por:
            return f"{obj.registrado_por.nombres} {obj.registrado_por.apellidos}"
        return "Desconocido"


    def validate(self, attrs):
        # Validar el tipo de antecedente
        tipo = attrs.get('tipo_antecedente')
        if tipo and tipo not in TipoAntecedente.values:
            raise serializers.ValidationError({'tipo_antecedente': 'El tipo de antecedente seleccionado no es válido.'})

        # Validar que la descripción no esté vacía
        descripcion = attrs.get('descripcion')
        if descripcion is not None and not descripcion.strip():
            raise serializers.ValidationError({'descripcion': 'La descripción es obligatoria.'})

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
            raise serializers.ValidationError('No se pueden registrar o modificar antecedentes en un historial clínico archivado.')

        return attrs

    def create(self, validated_data):
        historial_id = self.context['view'].kwargs['historial_id']
        validated_data['id_historial_id'] = historial_id
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)
