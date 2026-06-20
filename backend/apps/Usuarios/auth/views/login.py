"""POST /api/auth/login/ — credenciales, bloqueo temporal, JWT."""
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.Usuarios.security.login_lockout import (
    is_locked,
    lockout_error_payload,
    normalize_login_key,
    record_failure,
    record_success,
)

from ..serializers import BAD_CREDENTIALS_MSG, LoginSerializer
from .common import errors_mean_bad_credentials_only, jwt_login_response


class LoginView(APIView):
    """
    POST /api/auth/login/
    Acepta username o email. Retorna JWT + datos del usuario.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        login_raw = request.data.get('login', '')
        login_key = normalize_login_key(login_raw) if isinstance(login_raw, str) else ''

        locked, retry_sec = is_locked(login_key)
        if locked:
            return Response(
                lockout_error_payload(retry_sec),
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            if errors_mean_bad_credentials_only(serializer.errors, BAD_CREDENTIALS_MSG):
                record_failure(login_key)
                locked2, retry2 = is_locked(login_key)
                if locked2:
                    return Response(
                        lockout_error_payload(retry2),
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        usuario = serializer.validated_data['user']
        record_success(login_key)

        usuario.ultimo_acceso = timezone.now()
        usuario.save(update_fields=['ultimo_acceso'])

        registrar_bitacora(
            usuario=usuario, modulo='auth', accion=AccionBitacora.LOGIN,
            descripcion=f'Login exitoso: {usuario.username}',
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(jwt_login_response(usuario))
