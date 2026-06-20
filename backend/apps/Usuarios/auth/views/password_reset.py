"""Recuperación de contraseña por código (sin sesión)."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.Usuarios.security.emails import enviar_recuperacion_password
from apps.Usuarios.security.tokens import buscar_token_recuperacion_valido, crear_token_recuperacion
from apps.Usuarios.users.models import Usuario

from ..serializers import (
    ConfirmarPasswordSerializer,
    RecuperarPasswordSerializer,
    VerificarCodigoRecuperacionSerializer,
)


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Envía email con código. Siempre responde 200 (no revela si el email existe).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecuperarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            usuario = Usuario.objects.get(email__iexact=email.strip(), estado='ACTIVO')
            token_obj = crear_token_recuperacion(usuario)
            enviar_recuperacion_password(usuario, token_obj.token)
            registrar_bitacora(
                usuario=usuario, modulo='auth', accion=AccionBitacora.RECUPERAR_PASSWORD,
                descripcion=f'Solicitud reset password: {usuario.email}',
                ip_origen=get_client_ip(request),
            )
        except Usuario.DoesNotExist:
            pass

        return Response({'mensaje': 'Si el correo existe, recibirás instrucciones en breve.'})


class ResetPasswordVerifyCodeView(APIView):
    """
    POST /api/auth/reset-password/verify-code/
    Comprueba email + código sin consumir el código.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerificarCodigoRecuperacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        codigo = serializer.validated_data['codigo']

        token_obj, err = buscar_token_recuperacion_valido(email, codigo)
        if err == 'expired':
            return Response(
                {'error': 'El código expiró. Solicita un correo nuevo desde el inicio.'},
                status=400,
            )
        if err == 'invalid' or not token_obj:
            return Response({'error': 'Código incorrecto.'}, status=400)

        # Renueva la ventana desde este momento: el usuario puede tardar en elegir la nueva contraseña.
        ttl = int(getattr(settings, 'PASSWORD_RESET_CODE_TTL_SECONDS', 180) or 180)
        ttl = max(10, min(ttl, 3600))
        token_obj.expira_en = timezone.now() + timedelta(seconds=ttl)
        token_obj.save(update_fields=['expira_en'])

        return Response({'mensaje': 'Código verificado. Ya puedes definir tu nueva contraseña.'})


class ResetPasswordConfirmView(APIView):
    """POST /api/auth/reset-password/confirm/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        codigo = serializer.validated_data['codigo']
        token_obj, err = buscar_token_recuperacion_valido(email, codigo)
        if err == 'expired':
            return Response(
                {'error': 'El código expiró. Solicita un correo nuevo desde el inicio.'},
                status=400,
            )
        if err == 'invalid' or not token_obj:
            return Response({'error': 'Código incorrecto.'}, status=400)

        usuario = token_obj.id_usuario
        usuario.set_password(serializer.validated_data['password_nuevo'])
        usuario.save(update_fields=['password'])
        token_obj.usado = True
        token_obj.save(update_fields=['usado'])

        registrar_bitacora(
            usuario=usuario, modulo='auth', accion=AccionBitacora.CAMBIAR_PASSWORD,
            descripcion=f'Password restablecida via token: {usuario.username}',
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': 'Contraseña restablecida correctamente.'})
