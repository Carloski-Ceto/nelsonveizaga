"""
apps/auth/serializers.py
Serializers de autenticación, sesión y recuperación de contraseña.
El modelo de usuario sigue en apps.users (AUTH_USER_MODEL).
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.Usuarios.security.models import ConfiguracionLoginSeguridad
from apps.Usuarios.users.models import Usuario

BAD_CREDENTIALS_MSG = 'Credenciales incorrectas.'


class LoginSerializer(serializers.Serializer):
    """Acepta username o email en el campo 'login'."""
    login = serializers.CharField(label='Username o Email')
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        login_val = data.get('login', '').strip()
        password = data.get('password', '')

        if '@' in login_val:
            try:
                obj = Usuario.objects.get(email=login_val)
                username = obj.username
            except Usuario.DoesNotExist:
                raise serializers.ValidationError({'login': BAD_CREDENTIALS_MSG})
        else:
            username = login_val

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError({'login': BAD_CREDENTIALS_MSG})
        if user.estado == 'BLOQUEADO':
            raise serializers.ValidationError({'login': 'Cuenta bloqueada. Contacta al administrador.'})
        if user.estado == 'INACTIVO':
            raise serializers.ValidationError({'login': 'Cuenta inactiva.'})

        data['user'] = user
        return data


class LoginSeguridadConfigSerializer(serializers.ModelSerializer):
    """Lectura/actualización por ADMIN del umbral de intentos y minutos de bloqueo."""

    class Meta:
        model = ConfiguracionLoginSeguridad
        fields = ('max_intentos_fallidos', 'minutos_bloqueo')

    def validate_max_intentos_fallidos(self, value):
        if value < 1 or value > 50:
            raise serializers.ValidationError('Debe estar entre 1 y 50.')
        return value

    def validate_minutos_bloqueo(self, value):
        if value < 1 or value > 10080:
            raise serializers.ValidationError('Debe estar entre 1 y 10080 (7 días).')
        return value


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nuevo = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password_nuevo'] != data['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo2': 'Las contraseñas no coinciden.'})
        return data


class RecuperarPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerificarCodigoRecuperacionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    codigo = serializers.CharField(max_length=32)


class ConfirmarPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    codigo = serializers.CharField(max_length=32)
    password_nuevo = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password_nuevo'] != data['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo2': 'Las contraseñas no coinciden.'})
        return data


class PerfilSerializer(serializers.ModelSerializer):
    """Vista/edición del perfil propio — campos sensibles en solo lectura."""
    nombre_completo = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'nombres', 'apellidos', 'nombre_completo',
            'telefono', 'foto_perfil', 'tipo_usuario', 'estado', 'ultimo_acceso',
        ]
        read_only_fields = ['id', 'username', 'email', 'tipo_usuario', 'estado', 'ultimo_acceso']

    def get_nombre_completo(self, obj):
        return obj.get_full_name()
