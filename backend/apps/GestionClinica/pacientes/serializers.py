from django.utils import timezone
from rest_framework import serializers

from .models import Paciente


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = [
            'id_paciente',
            'nombres',
            'apellidos',
            'documento_identidad',
            'fecha_nacimiento',
            'sexo',
            'telefono',
            'email',
            'direccion',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id_paciente', 'fecha_creacion', 'fecha_actualizacion']

    def validate_fecha_nacimiento(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError('La fecha de nacimiento no puede ser futura.')
        return value
