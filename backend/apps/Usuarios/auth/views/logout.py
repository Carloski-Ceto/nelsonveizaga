"""POST /api/auth/logout/ — invalidar refresh (blacklist)."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { "refresh": "<refresh_token>" }
    Añade el refresh token a la JWT Blacklist.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Se requiere el refresh token.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'error': 'Token inválido o ya expirado.'}, status=400)

        registrar_bitacora(
            usuario=request.user, modulo='auth', accion=AccionBitacora.LOGOUT,
            descripcion=f'Logout: {request.user.username}',
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': 'Sesión cerrada correctamente.'})
