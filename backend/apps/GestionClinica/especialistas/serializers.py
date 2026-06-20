from rest_framework import serializers

from apps.GestionClinica.medicos.models import Medico

from .models import Especialista


class EspecialistaSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.CharField(source='id_medico.id_usuario.get_full_name', read_only=True)
    id_usuario = serializers.IntegerField(source='id_medico.id_usuario.id', read_only=True)

    class Meta:
        model = Especialista
        fields = [
            'id_especialista',
            'id_medico',
            'id_usuario',
            'nombre_usuario',
            'especialidad',
            'registro_profesional',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id_especialista', 'fecha_creacion', 'fecha_actualizacion', 'nombre_usuario', 'id_usuario']

    def validate_id_medico(self, value: Medico):
        if not value.activo:
            raise serializers.ValidationError('El médico seleccionado está inactivo.')
        return value
