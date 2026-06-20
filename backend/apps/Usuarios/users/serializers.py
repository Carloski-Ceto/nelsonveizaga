"""
apps/users/serializers.py
Serializers del recurso Usuario (lectura, alta administrativa).

Autenticación y perfil de sesión → apps.auth.serializers
Roles/Permisos → apps/roles/serializers.py y apps/permisos/serializers.py
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'nombres', 'apellidos', 'nombre_completo',
            'telefono', 'foto_perfil', 'tipo_usuario', 'estado',
            'ultimo_acceso', 'fecha_creacion', 'fecha_actualizacion',
            'is_staff', 'is_active',
        ]
        read_only_fields = ['id', 'ultimo_acceso', 'fecha_creacion', 'fecha_actualizacion']

    def get_nombre_completo(self, obj):
        return obj.get_full_name()


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Para creación de usuarios por el administrador."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'password', 'nombres', 'apellidos',
            'telefono', 'tipo_usuario', 'estado', 'is_staff',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        return Usuario.objects.create_user(password=password, **validated_data)
