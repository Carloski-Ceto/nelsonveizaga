"""
apps/HistorialClinico/historial/serializers.py
Serializers para CU20 Archivar historial clínico.
"""
from django.utils import timezone
from rest_framework import serializers

from .models import EstadoHistorial, HistorialClinico


class HistorialClinicoSerializer(serializers.ModelSerializer):
    paciente_nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = HistorialClinico
        fields = '__all__'
        read_only_fields = [
            'id_historial',
            'archivado_por',
            'fecha_archivo',
            'registrado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def get_paciente_nombre_completo(self, obj):
        return f"{obj.id_paciente.nombres} {obj.id_paciente.apellidos}"

    def validate(self, attrs):
        id_paciente = attrs.get('id_paciente')
        if id_paciente:
            qs = HistorialClinico.objects.filter(id_paciente=id_paciente, estado=EstadoHistorial.ACTIVO)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'id_paciente': 'El paciente ya tiene un historial clínico activo.'}
                )
        return attrs

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


class HistorialArchivarSerializer(serializers.Serializer):
    motivo_archivo = serializers.CharField(max_length=500)

    def save(self):
        historial = self.context['historial']
        historial.estado = EstadoHistorial.ARCHIVADO
        historial.motivo_archivo = self.validated_data['motivo_archivo']
        historial.archivado_por = self.context['request'].user
        historial.fecha_archivo = timezone.now()
        historial.full_clean()
        historial.save()
        return historial


class HistorialRestaurarSerializer(serializers.Serializer):
    def validate(self, attrs):
        historial = self.context['historial']
        if historial.estado != EstadoHistorial.ARCHIVADO:
            raise serializers.ValidationError(
                'Solo se puede restaurar un historial con estado ARCHIVADO.'
            )
        return attrs

    def save(self):
        historial = self.context['historial']
        historial.estado = EstadoHistorial.ACTIVO
        historial.motivo_archivo = None
        historial.archivado_por = None
        historial.fecha_archivo = None
        historial.full_clean()
        historial.save()
        return historial
