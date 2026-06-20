"""POST /api/auth/change-password/ — con sesión activa."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora

from ..serializers import CambiarPasswordSerializer


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['password_actual']):
            return Response({'error': 'La contraseña actual es incorrecta.'}, status=400)

        request.user.set_password(serializer.validated_data['password_nuevo'])
        request.user.save(update_fields=['password'])

        registrar_bitacora(
            usuario=request.user, modulo='auth', accion=AccionBitacora.CAMBIAR_PASSWORD,
            descripcion=f'Cambio de contraseña: {request.user.username}',
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': 'Contraseña actualizada correctamente.'})
