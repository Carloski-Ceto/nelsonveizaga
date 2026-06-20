"""Configuración de bloqueo temporal por intentos de login (solo ADMIN)."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.Usuarios.security.models import ConfiguracionLoginSeguridad

from ..serializers import LoginSeguridadConfigSerializer


class LoginSeguridadConfigView(APIView):
    """
    GET/PATCH /api/security/login-config/
    Solo ADMIN. Umbrales de bloqueo temporal por intentos fallidos (por clave de login).
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        cfg = ConfiguracionLoginSeguridad.get_solo()
        return Response(LoginSeguridadConfigSerializer(cfg).data)

    def patch(self, request):
        cfg = ConfiguracionLoginSeguridad.get_solo()
        ser = LoginSeguridadConfigSerializer(cfg, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        inst = ser.instance
        registrar_bitacora(
            usuario=request.user,
            modulo='auth',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'Config seguridad login: max_intentos={inst.max_intentos_fallidos}, '
                f'minutos_bloqueo={inst.minutos_bloqueo}'
            ),
            tabla_afectada='configuracion_login_seguridad',
            id_registro_afectado=1,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(LoginSeguridadConfigSerializer(inst).data)
