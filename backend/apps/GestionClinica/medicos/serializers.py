from rest_framework import serializers

from apps.Usuarios.users.models import TipoUsuario

from .models import Medico


class MedicoSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.CharField(source='id_usuario.get_full_name', read_only=True)

    class Meta:
        model = Medico
        fields = [
            'id_medico',
            'id_usuario',
            'nombre_usuario',
            'matricula',
            'anios_experiencia',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id_medico', 'fecha_creacion', 'fecha_actualizacion', 'nombre_usuario']

    def validate_id_usuario(self, value):
        if value.tipo_usuario != TipoUsuario.MEDICO:
            raise serializers.ValidationError('El usuario debe ser MEDICO para registrar perfil médico.')
        return value

    def validate_anios_experiencia(self, value):
        if value < 0 or value > 80:
            raise serializers.ValidationError('Años de experiencia debe estar entre 0 y 80.')
        return value
